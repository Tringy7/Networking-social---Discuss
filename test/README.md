# DISCUSS test interface

The test interface keeps its prototype screens and local demo data for features without backend endpoints (including communities, posts, notifications, and messages). Authentication and profile operations use the same backend endpoints as `frontend/`.

## Run locally

1. Install dependencies with `npm install` or `bun install`.
2. Set `VITE_API_URL` in a local `.env.local` file if the backend is not running at `http://localhost:8080`.
3. Set `VITE_GOOGLE_CLIENT_ID` if Google sign-in should be enabled.
4. Start the interface with `npm run dev` or `bun run dev`.

The browser sends and receives the backend's HTTP-only authentication cookies. The backend allows Vite's `http://localhost:3000` and `http://127.0.0.1:3000` origins for credentialed CORS requests; cookie settings must also be suitable for the local protocol.

Authentication screens support registration, email verification, login/logout, password recovery, and password changes. The test-only role switcher remains available to preview role-based screens; it does not change the authenticated account on the backend.
