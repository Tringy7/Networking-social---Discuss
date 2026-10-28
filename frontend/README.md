# DISCUSS frontend

The React/Vite application in this directory contains the migrated discussion UI. It uses the Spring Boot API rather than the prototype data that was previously bundled with the pages.

## Run locally

1. Start the backend and its configured database.
2. From this directory, install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

3. By default, API requests target `http://localhost:8080`. To use another backend URL, set `VITE_API_URL` in a local `.env` file:

   ```env
   VITE_API_URL=http://localhost:8080
   ```

The API client sends requests with credentials so the backend authentication cookie is included.

## Validation

- `npm run build` creates the production bundle.
- `npm run lint` runs the repository ESLint configuration (currently configured for the legacy JavaScript files).
- `npm test` checks the frontend's demo content and local-only interactions.

## Demo content

Posts, comments, notifications, and direct messages currently use demo content while their backend APIs are unavailable. Creating posts, reactions, saves, comments, read status, and messages work locally for the current app session; notification preferences and appearance settings are saved in browser storage. These demo interactions are not sent to or persisted by the backend.

## API-backed areas

The frontend uses API endpoints for authentication and profiles, communities and memberships, reports and moderation, and administrator statistics/user/community management. Posts, notifications, and direct messages use local demo data until their backend APIs are available. The backend creates the additional persistence tables through its configured JPA schema update.
