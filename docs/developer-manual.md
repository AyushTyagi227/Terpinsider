# Developer Manual

## Installation

To run this project locally, first clone the repository:

```bash
git clone https://github.com/AyushTyagi227/Terpinsider.git
cd Terpinsider
```

Install the required dependencies:

```bash
npm install
```

Create a `.env` file in the main project folder. This file should not be pushed to GitHub.

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
```

The Supabase database should include two main tables.

The `clubs` table should include:

```txt
id
clubName
category
description
meeting_text
lat
lon
created_at
```

The `reviews` table should include:

```txt
id
club_id
reviewer_name
rating
review_text
created_at
```

## Running the Application

To start the server locally, run:

```bash
npm start
```

The app will run at:

```txt
http://localhost:3000
```

If `npm start` does not work, run:

```bash
node index.js
```

## Running Tests

There are no automated tests for this project.

Testing is done manually by opening the website and checking that:

- The home page loads.
- Clubs load from Supabase.
- Club detail pages display the correct club information.
- Reviews can be submitted.
- The map loads using the club meeting location.
- Nala returns club recommendations.

## Server API Endpoints

### GET `/api/clubs`

Gets all clubs from the Supabase `clubs` table.

Used by the frontend to display the club directory.

### GET `/api/clubs/:id`

Gets one club by its ID.

Used by the club detail page.

### POST `/api/clubs`

Adds a new club to the Supabase `clubs` table.

Expected JSON body:

```json
{
  "clubName": "Example Club",
  "category": "Academic",
  "description": "Example description",
  "meeting_text": "Stamp Student Union, College Park MD",
  "lat": null,
  "lon": null
}
```

### GET `/api/reviews/:clubId`

Gets all reviews for a specific club.

Used on the club detail page.

### POST `/api/reviews`

Adds a new review to the Supabase `reviews` table.

Expected JSON body:

```json
{
  "club_id": 1,
  "reviewer_name": "Student Name",
  "rating": 5,
  "review_text": "Great club."
}
```

### GET `/api/geocode`

Uses the OpenStreetMap Nominatim API to turn a meeting location into latitude and longitude.

Example request:

```txt
/api/geocode?location=Stamp Student Union, College Park MD
```

This endpoint is used for the map feature.

### POST `/api/nala`

Uses the OpenAI API to power Nala, the club recommendation assistant.

Expected JSON body:

```json
{
  "message": "I want a club related to fitness or sports"
}
```

The response includes a short reply and club recommendations.

## Known Bugs

- Some club locations may not geocode perfectly.
- The map depends on the external Nominatim API, so it may fail if the API is slow or rate limited.
- Reviews do not require user login, so names are user-entered.
- Nala only recommends clubs already stored in the Supabase database.

## Future Development Roadmap

Future developers could improve the project by:

- Saving geocoded latitude and longitude back into Supabase.
- Adding login or UMD authentication.
- Adding favorite clubs for each user.
- Adding stronger search and filters.
- Adding more club data.
- Improving Nala’s recommendation logic.
- Adding automated tests.
- Improving mobile responsiveness.
