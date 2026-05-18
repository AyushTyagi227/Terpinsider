# TerpInsider

## Description

TerpInsider helps University of Maryland students discover clubs and organizations. Students can browse a searchable directory, filter by category, view club details with meeting locations on a map, and leave reviews with rating charts. The app centralizes club discovery and makes it easier to compare organizations on campus.

**Live deployment:** terpinsider.vercel.app

## Target Browsers

TerpInsider is designed and tested for current desktop versions of:

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

The layout is responsive for common laptop and desktop screen sizes. Mobile support is limited but basic navigation should still work.

## Developer Manual

See the full developer manual in [docs/developer-manual.md](docs/developer-manual.md).

### Quick start

```bash
npm install
```

Create a `.env` file in the project root:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_or_service_key
```

Run locally:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Tests

No automated tests are included. Manual testing: browse clubs, open a club detail page, submit a review, and confirm the map loads.

### API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clubs`, `/api/clubs` | List all clubs (Supabase) |
| GET | `/api/clubs/:id` | Get one club by id |
| POST | `/club`, `/api/clubs` | Add a new club |
| GET | `/api/reviews/:clubId` | Get reviews for a club |
| POST | `/api/reviews`, `/reviews` | Submit a review |
| GET | `/api/geocode?location=...` | Geocode a location (Nominatim) |

Full details: [docs/developer-manual.md](docs/developer-manual.md).

### Known bugs

- Geocoding depends on OpenStreetMap Nominatim rate limits; rapid requests may be throttled.
- Clubs imported without `lat`/`lon` rely on geocoding `meeting_text` on each detail page load.
- Chart.js dark-theme axis colors may vary slightly between browsers.

### Roadmap

- AI-powered club recommendations (OpenAI integration)
- Persist geocoded `lat`/`lon` back to Supabase after first lookup
- User accounts and authenticated reviews
- Admin page to add/edit clubs
- Mobile-first layout improvements
