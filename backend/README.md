# Gaming Arena — Backend

This folder contains the Express API for GameArena that proxies Supabase operations server-side.

Environment variables (create a `.env` file inside `backend/`):

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (KEEP SECRET)
- `FRONTEND_URL` — optional redirect URL for password reset
- `PORT` — optional server port

Install and run:

```bash
cd backend
npm install
npm run dev
```
