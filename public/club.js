
let ratingChart = null;
let currentClubId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const clubId = params.get('id');
  const content = document.getElementById('club-content');

  if (!clubId) {
    content.innerHTML =
      '<p class="status error">No club selected. <a href="clubs.html">Browse clubs</a></p>';
    return;
  }

  currentClubId = clubId;

  try {

    const clubRes = await fetch(`/api/clubs/${clubId}`);
    if (!clubRes.ok) throw new Error('Club not found');
    const club = await clubRes.json();

    content.innerHTML = buildClubHtml(club);


    await loadMap(club);


    await loadReviews(clubId);

 
    document.getElementById('review-form').addEventListener('submit', submitReview);
  } catch (err) {
    console.error(err);
    content.innerHTML =
      '<p class="status error">Could not load this club. <a href="clubs.html">Back to directory</a></p>';
  }
});

function buildClubHtml(club) {
  return `
    <div class="detail-header">
      <a href="clubs.html">&larr; Back to clubs</a>
      <h1>${escapeHtml(club.clubName)}</h1>
      <p class="detail-meta">
        <span class="category">${escapeHtml(club.category || 'General')}</span>
      </p>
    </div>

    <section class="detail-section">
      <h2>About</h2>
      <p>${escapeHtml(club.description || 'No description available.')}</p>
    </section>

    <section class="detail-section">
      <h2>Meeting Location</h2>
      <p id="meeting-text">${escapeHtml(club.meeting_text || 'Not specified')}</p>
      <div id="map"></div>
      <p id="map-status" class="status" style="padding: 0.5rem 0;"></p>
    </section>

    <section class="detail-section">
      <h2>Reviews</h2>
      <div class="chart-container">
        <canvas id="rating-chart"></canvas>
      </div>
      <ul class="reviews-list" id="reviews-list"></ul>

      <h2 style="margin-top: 1.5rem;">Leave a Review</h2>
      <form id="review-form" class="review-form">
        <input type="hidden" name="club_id" value="${club.id}">
        <label for="reviewer_name">Your name</label>
        <input type="text" id="reviewer_name" name="reviewer_name" required placeholder="e.g. Alex">

        <label for="rating">Rating (1–5)</label>
        <select id="rating" name="rating" required>
          <option value="">Select…</option>
          <option value="5">5 – Excellent</option>
          <option value="4">4 – Good</option>
          <option value="3">3 – Average</option>
          <option value="2">2 – Fair</option>
          <option value="1">1 – Poor</option>
        </select>

        <label for="review_text">Review</label>
        <textarea id="review_text" name="review_text" required placeholder="Share your experience…"></textarea>

        <button type="submit" class="btn">Submit Review</button>
        <p id="review-message" class="status" style="padding-top: 0.5rem;"></p>
      </form>
    </section>
  `;
}

async function loadMap(club) {
  const mapEl = document.getElementById('map');
  const statusEl = document.getElementById('map-status');
  let lat = club.lat;
  let lon = club.lon;
  let label = club.meeting_text;


  if ((!lat || !lon) && club.meeting_text) {
    statusEl.textContent = 'Looking up location…';
    try {
      const geoRes = await fetch(
        `/api/geocode?location=${encodeURIComponent(club.meeting_text)}`
      );
      if (geoRes.ok) {
        const geo = await geoRes.json();
        lat = geo.lat;
        lon = geo.lon;
        label = geo.display_name || club.meeting_text;
        statusEl.textContent = geo.display_name;
      } else {
        statusEl.textContent = 'Could not find this location on the map.';
        mapEl.style.display = 'none';
        return;
      }
    } catch (err) {
      statusEl.textContent = 'Map unavailable.';
      mapEl.style.display = 'none';
      return;
    }
  } else if (!lat || !lon) {
    statusEl.textContent = 'No meeting location provided.';
    mapEl.style.display = 'none';
    return;
  }

  statusEl.textContent = label || '';


  const map = L.map('map').setView([lat, lon], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  L.marker([lat, lon]).addTo(map).bindPopup(label || club.clubName).openPopup();
}

async function loadReviews(clubId) {
  const listEl = document.getElementById('reviews-list');

  try {
    const res = await fetch(`/api/reviews/${clubId}`);
    if (!res.ok) {
      listEl.innerHTML =
        '<li class="status">Reviews not available yet. Create the reviews table in Supabase.</li>';
      renderChart([]);
      return;
    }

    const reviews = await res.json();
    renderReviews(reviews);
    renderChart(reviews);
  } catch (err) {
    listEl.innerHTML = '<li class="status">Could not load reviews.</li>';
    renderChart([]);
  }
}

function renderReviews(reviews) {
  const listEl = document.getElementById('reviews-list');

  if (!reviews || reviews.length === 0) {
    listEl.innerHTML = '<li class="status">No reviews yet. Be the first!</li>';
    return;
  }

  listEl.innerHTML = reviews
    .map(
      (r) => `
    <li>
      <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
      <strong>${escapeHtml(r.reviewer_name)}</strong>
      <p>${escapeHtml(r.review_text)}</p>
    </li>
  `
    )
    .join('');
}

function renderChart(reviews) {
  const ctx = document.getElementById('rating-chart');
  const counts = [0, 0, 0, 0, 0]; 

  reviews.forEach((r) => {
    const idx = r.rating - 1;
    if (idx >= 0 && idx < 5) counts[idx]++;
  });

  if (ratingChart) ratingChart.destroy();

  ratingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1★', '2★', '3★', '4★', '5★'],
      datasets: [
        {
          label: 'Number of reviews',
          data: counts,
          backgroundColor: ['#7b61ff', '#6a52e6', '#9b85ff', '#b5a3ff', '#d4caff'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Rating Distribution', color: '#212121' },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#666' },
          grid: { color: '#e0e0e0' },
        },
        x: { ticks: { color: '#666' }, grid: { color: '#e0e0e0' } },
      },
    },
  });
}

async function submitReview(e) {
  e.preventDefault();
  const msg = document.getElementById('review-message');
  msg.textContent = 'Submitting…';
  msg.className = 'status';

  const body = {
    club_id: parseInt(currentClubId, 10),
    reviewer_name: document.getElementById('reviewer_name').value.trim(),
    rating: parseInt(document.getElementById('rating').value, 10),
    review_text: document.getElementById('review_text').value.trim(),
  };

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit review');
    }

    msg.textContent = 'Review submitted! Thank you.';
    msg.className = 'status';
    document.getElementById('review-form').reset();
    await loadReviews(currentClubId);
  } catch (err) {
    msg.textContent =
      err.message || 'Could not submit review. Make sure the reviews table exists in Supabase.';
    msg.className = 'status error';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
