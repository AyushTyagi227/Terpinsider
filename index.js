const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const app = express();
const port = process.env.PORT || 3000;
dotenv.config();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);


app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});



async function getAllClubs(req, res) {
  console.log('Attempting to get all clubs');
  const { data, error } = await supabase.from('clubs').select();

  if (error) {
    console.log(`Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  } else {
    console.log('Received Data:', data.length);
    res.json(data);
  }
}

app.get('/clubs', getAllClubs);
app.get('/api/clubs', getAllClubs);

app.get('/api/clubs/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`Getting club id: ${id}`);

  const { data, error } = await supabase
    .from('clubs')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    console.log(`Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  } else if (!data) {
    res.status(404).json({ error: 'Club not found' });
  } else {
    res.json(data);
  }
});



app.post('/club', async (req, res) => {
  console.log('Adding Club');
  console.log(`Request: ${JSON.stringify(req.body)}`);

  const clubName = req.body.clubName;
  const category = req.body.category;
  const description = req.body.description;
  const meeting_text = req.body.meeting_text;
  const lat = req.body.lat;
  const lon = req.body.lon;

  const { data, error } = await supabase
    .from('clubs')
    .insert({
      clubName: clubName,
      category: category,
      description: description,
      meeting_text: meeting_text,
      lat: lat,
      lon: lon,
    })
    .select();

  if (error) {
    console.log(`Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});

app.post('/api/clubs', async (req, res) => {
  console.log('Adding Club via /api/clubs');
  const { clubName, category, description, meeting_text, lat, lon } = req.body;

  const { data, error } = await supabase
    .from('clubs')
    .insert({ clubName, category, description, meeting_text, lat, lon })
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});



app.get('/api/reviews/:clubId', async (req, res) => {
  const clubId = req.params.clubId;
  console.log(`Getting reviews for club: ${clubId}`);

  const { data, error } = await supabase
    .from('reviews')
    .select()
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log(`Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});

app.post('/api/reviews', async (req, res) => {
  console.log('Adding review');
  const { club_id, reviewer_name, rating, review_text } = req.body;

  const { data, error } = await supabase
    .from('reviews')
    .insert({ club_id, reviewer_name, rating, review_text })
    .select();

  if (error) {
    console.log(`Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});

app.post('/reviews', async (req, res) => {
  const { club_id, reviewer_name, rating, review_text } = req.body;

  const { data, error } = await supabase
    .from('reviews')
    .insert({ club_id, reviewer_name, rating, review_text })
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});



app.post('/api/nala', async (req, res) => {
  const userMessage = req.body.message;
  const history = req.body.history || [];
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Add OPENAI_API_KEY to your .env file (and Vercel env vars when deployed)',
    });
  }

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  console.log('Nala chat:', userMessage.slice(0, 80));

  const { data: clubs, error: clubError } = await supabase
    .from('clubs')
    .select('id, clubName, category, description, meeting_text');

  if (clubError) {
    return res.status(500).json({ error: clubError.message });
  }

  const clubList = clubs.map((c) => ({
    id: c.id,
    clubName: c.clubName,
    category: c.category,
    description: (c.description || '').slice(0, 250),
    meeting_text: c.meeting_text,
  }));

  const systemPrompt = `You are Nala, a friendly AI club advisor for University of Maryland students on TerpInsider.
Recommend ONLY clubs from the clubs list below. Never invent clubs.
Return valid JSON with this exact shape:
{"reply":"your helpful conversational response","recommendations":[{"id":<club id number>,"reason":"one sentence why this club fits"}]}
Recommend 1 to 4 clubs when possible. If nothing fits, explain kindly and use an empty recommendations array.
Keep replies concise and welcoming.

Clubs list:
${JSON.stringify(clubList)}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8),
    { role: 'user', content: userMessage.trim() },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('OpenAI error:', data.error?.message || data);
      return res.status(500).json({
        error: data.error?.message || 'OpenAI request failed',
      });
    }

    const raw = data.choices[0].message.content;
    const parsed = JSON.parse(raw);

    const recommendations = (parsed.recommendations || [])
      .map((rec) => {
        const club = clubs.find((c) => c.id === Number(rec.id));
        if (!club) return null;
        return {
          id: club.id,
          clubName: club.clubName,
          category: club.category,
          reason: rec.reason,
        };
      })
      .filter(Boolean);

    res.json({
      reply: parsed.reply || 'Here are some clubs you might like!',
      recommendations: recommendations,
    });
  } catch (err) {
    console.log('Nala error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendation from Nala' });
  }
});



app.get('/api/geocode', async (req, res) => {
  const location = req.query.location;

  if (!location) {
    return res.status(400).json({ error: 'location query parameter is required' });
  }

  console.log(`Geocoding: ${location}`);

  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&q=' +
      encodeURIComponent(location) +
      '&limit=1';

    const response = await fetch(url, {
      headers: { 'User-Agent': 'TerpInsider/1.0' },
    });

    const results = await response.json();

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const place = results[0];
    res.json({
      location: location,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      display_name: place.display_name,
    });
  } catch (err) {
    console.log(`Geocode error: ${err.message}`);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});


if (require.main === module) {
  app.listen(port, () => {
    console.log(`App is available on port: ${port}`);
  });
}

module.exports = app;
