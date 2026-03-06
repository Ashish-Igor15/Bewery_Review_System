# Brewery Review System

This repository now includes a complete backend API and a usable frontend UI for the assignment.

## What is implemented
- Login/Signup page
- Brewery search page (by city, by name, by type)
- Brewery detail page with:
  - full brewery details from Open Brewery DB
  - list of existing reviews from MongoDB
  - add/update review form (rating 1-5 + description)

## Tech
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth
- Frontend: Vanilla HTML/CSS/JS served from Express static files

## Project structure
- `server/` → active application (backend + frontend static assets)
- `server2/` → old experimental backend (not used)

## Setup
1. Copy env:
   - `cp server/.env.example server/.env`
2. Install dependencies:
   - `cd server && npm install`
3. Run server:
   - `npm run dev`
4. Open app:
   - `http://localhost:4000`

## Environment variables
See `server/.env.example`:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`

## API endpoints
Base URL: `http://localhost:4000`

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/breweries/search?by_city=&by_name=&by_type=&page=&per_page=`
- `GET /api/breweries/:id`
- `GET /api/breweries/:id/reviews`
- `POST /api/breweries/:id/reviews`
