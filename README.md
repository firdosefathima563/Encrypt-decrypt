# SecureCrypt

A full-stack cybersecurity education platform demonstrating RSA encryption,
the Caesar cipher, and password-strength analysis.

```
.
├── src/              # React frontend (Vite)
├── index.html
├── package.json      # frontend deps
├── vite.config.js
├── netlify.toml       # Netlify build config
├── server/            # Express backend API
│   ├── src/
│   ├── package.json   # backend deps (separate from frontend)
│   ├── render.yaml     # Render deploy blueprint
│   └── supabase/schema.sql
└── .env.example        # frontend env (VITE_API_URL)
```

The frontend and backend are two separate apps in one repo. They deploy to
two different services and have two separate `package.json` files — that's
intentional, not a mistake. Netlify only ever looks at the root-level
frontend files; Render only ever looks inside `server/`.

## Publishing

### 1. Push this repo to GitHub
Create a new GitHub repo and push everything in this folder to it
(including `server/`).

### 2. Deploy the backend on Render
- New → Web Service → select this repo
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`
- (Or use the included `server/render.yaml` blueprint via "New → Blueprint")

After deploy, copy the live URL, e.g. `https://securecrypt-api.onrender.com`.

### 3. Set up Supabase (optional, for persistence)
- Create a free project at supabase.com
- Run `server/supabase/schema.sql` in the SQL editor
- Copy your Project URL and `service_role` key into Render's environment
  variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Redeploy the Render service

Without this step, the backend still works — history just resets whenever
Render restarts the service, since it falls back to in-memory storage.

### 4. Deploy the frontend on Netlify
- New site from Git → select this repo
- Netlify will auto-detect `netlify.toml` (build command + publish dir
  already configured)
- Site settings → Environment variables → add `VITE_API_URL` set to your
  Render URL from step 2
- Deploy

### 5. Update backend CORS
Back in Render, set the backend's `CORS_ORIGIN` environment variable to
your live Netlify URL (e.g. `https://your-site.netlify.app`), then
redeploy the backend so it accepts requests from your live frontend.

## Current state

The frontend's RSA/Caesar/password components still compute everything
client-side in the browser (no network calls needed for the actual
crypto math). On top of that, each tool now also makes a best-effort
call to the backend to log a history entry to Supabase:

- **RSA Simulator** — saves after a successful decrypt (message, bit
  size, public modulus, whether decryption matched the original).
- **Caesar Cipher** — saves a debounced snapshot (1s after typing
  stops) of the input, shift, mode, and output.
- **Password Strength** — saves only non-sensitive summary metrics
  (length, score, strength label, entropy). The raw password is never
  sent to the backend or stored anywhere, matching the UI's own
  "analyzed locally — never sent anywhere" promise.

A new **"Recent Activity"** section at the bottom of the page reads
this history back from `/api/history` and displays it, with filters
per type.

All of this is best-effort and non-blocking: if `VITE_API_URL` isn't
set, or the backend is asleep/unreachable (common on Render's free
tier after inactivity), the site's core functionality is completely
unaffected — saves just silently fail, and the history viewer shows a
friendly "couldn't reach the backend" message instead of breaking.

