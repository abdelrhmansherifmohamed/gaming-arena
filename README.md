# Gaming Arena — Server

This folder contains a minimal Express API that proxies Supabase operations server-side using a service role key.

Environment variables (create a `.env` file):

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (KEEP SECRET)
- `FRONTEND_URL` — optional redirect URL for password reset
- `PORT` — optional server port

Install and run:

```bash
npm install
npm run dev
```

Endpoints (examples):

- `POST /api/auth/signup` { email, password, username }
- `POST /api/auth/signin` { email, password }
- `POST /api/auth/signout`
- `POST /api/auth/refresh` { refreshToken? }
- `POST /api/auth/password-reset` { email, redirectTo }
- `GET /api/auth/me`
- `GET /api/users/:id`
- `GET /api/players/:id/stats`
