# TerpInsider Developer Manual

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AyushTyagi227/Terpinsider.git
   cd Terpinsider
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root (do not commit this file):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_key
   ```

4. In Supabase, ensure you have:
   - A `clubs` table with columns: `id`, `clubName`, `category`, `description`, `meeting_text`, `lat`, `lon`, `created_at`
   - A `reviews` table with columns: `id`, `club_id`, `reviewer_name`, `rating`, `review_text`, `created_at`

## Running locally

```bash
npm start
```

This runs `nodemon` and restarts the server when files change. The app is available at **http://localhost:3000**.

For production-style run without nodemon:

```bash
node index.js
```

## Running tests

There are no automated test scripts. Use manual testing:

1. Home page loads and shows category pills.
2. Clubs page lists clubs and filters work.
3. Club detail page shows info, map, chart, and review form.
4. Submitting a review updates the list and chart.

## Project structure

```
Terpinsider/
├── index.js          # Express backend
├── package.json
├── vercel.json       # Vercel deployment config
├── .env              # Local secrets (not in git)
├── public/           # Frontend static files
│   ├── index.html    # Home
│   ├── clubs.html    # Directory
│   ├── club.html     # Detail + reviews + map
│   ├── about.html    # About
│   ├── styles.css
│   ├── main.js
│   ├── clubs.js
│   └── club.js
└── docs/
    └── developer-manual.md
```

## API documentation

All frontend data access goes through these backend routes. The frontend does not call Supabase or Nominatim directly.

### GET `/clubs` and GET `/api/clubs`

Retrieves all clubs from the Supabase `clubs` table.

**Response (200):** JSON array of club objects.

```json
[
  {
    "id": 1,
    "clubName": "Archery Club",
    "category": "Sports",
    "description": "...",
    "meeting_text": "Eppley Recreation Center, College Park MD",
    "lat": null,
    "lon": null,
    "created_at": "2026-01-01T00:00:00+00:00"
  }
]
```

**Errors:** `500` with `{ "error": "message" }`.

---

### GET `/api/clubs/:id`

Retrieves a single club by `id`.

**Parameters:** `id` (path) – club primary key.

**Response (200):** Single club object.

**Errors:** `404` if not found, `500` on database error.

---

### POST `/club` and POST `/api/clubs`

Inserts a new club into Supabase.

**Request body (JSON):**

```json
{
  "clubName": "Example Club",
  "category": "Academic",
  "description": "Club description",
  "meeting_text": "Stamp Student Union, College Park MD",
  "lat": null,
  "lon": null
}
```

Use exact column names: `clubName`, `meeting_text`, `lat`, `lon`.

**Response (200):** JSON array with the inserted row(s).

**Errors:** `500` on validation or database error.

---

### GET `/api/reviews/:clubId`

Retrieves all reviews for a club, newest first.

**Parameters:** `clubId` (path) – matches `reviews.club_id`.

**Response (200):** JSON array of review objects.

```json
[
  {
    "id": 1,
    "club_id": 5,
    "reviewer_name": "Alex",
    "rating": 5,
    "review_text": "Great club!",
    "created_at": "2026-05-01T12:00:00+00:00"
  }
]
```

---

### POST `/api/reviews` and POST `/reviews`

Inserts a new review.

**Request body (JSON):**

```json
{
  "club_id": 5,
  "reviewer_name": "Alex",
  "rating": 5,
  "review_text": "Great club!"
}
```

**Response (200):** JSON array with inserted row(s).

**Errors:** `500` if `reviews` table does not exist or insert fails.

---

### GET `/api/geocode`

Calls the external **OpenStreetMap Nominatim** API to convert a location string into coordinates. Used by the club detail page for maps.

**Query parameters:**

| Name | Required | Description |
|------|----------|-------------|
| `location` | Yes | Address or place name, e.g. `Stamp Student Union, College Park MD` |

**Example:** `GET /api/geocode?location=Stamp%20Student%20Union,%20College%20Park%20MD`

**Response (200):**

```json
{
  "location": "Stamp Student Union, College Park MD",
  "lat": 38.9882,
  "lon": -76.9447,
  "display_name": "Adele H. Stamp Student Union, ..."
}
```

**Errors:**

- `400` – missing `location` parameter
- `404` – no results from Nominatim
- `500` – network or server error

**Note:** Nominatim requires a `User-Agent` header; the backend sends `TerpInsider/1.0`.

---

## Frontend fetch calls (rubric)

| Page | Fetch | Backend route | Purpose |
|------|-------|---------------|---------|
| Home (`main.js`) | GET | `/clubs` | Load categories |
| Clubs (`clubs.js`) | GET | `/clubs` | List clubs |
| Club detail (`club.js`) | GET | `/api/clubs/:id` | Club info |
| Club detail | GET | `/api/geocode?location=...` | Map coordinates (external API via backend) |
| Club detail | GET | `/api/reviews/:clubId` | Load reviews |
| Club detail | POST | `/api/reviews` | Submit review |

## Frontend libraries

1. **Leaflet.js** – interactive map on club detail page (CDN)
2. **Chart.js** – bar chart of review ratings (CDN)

## Deployment (Vercel)

1. Push code to GitHub.
2. Import the repo in Vercel.
3. Add environment variables in Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Deploy. `vercel.json` routes all requests to `index.js`.

## Supabase: create reviews table

If you have not created the reviews table, run this in the Supabase SQL editor:

```sql
create table reviews (
  id bigint generated always as identity primary key,
  club_id bigint not null,
  reviewer_name text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  review_text text not null,
  created_at timestamptz default now()
);
```

Enable Row Level Security policies as needed for your project (service role key in backend bypasses RLS if using service key).

## Known bugs

- Nominatim may rate-limit frequent geocode requests.
- First map load on a club without stored coordinates requires a geocode round trip.
- Empty review list still shows an empty chart.

## Roadmap

- Cache geocoded coordinates in the `clubs` table
- OpenAI-based club recommendations
- Pagination for large club lists
- Email or SSO for review identity
