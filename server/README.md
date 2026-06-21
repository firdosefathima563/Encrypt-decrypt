# SecureCrypt API

Backend for the SecureCrypt education platform. Provides server-side RSA,
Caesar cipher, and password-strength endpoints, plus optional history
persistence via Supabase.

The frontend originally ran all crypto math client-side in the browser —
this API mirrors that exact logic so the same calculations can also run
server-side (useful for verifying results, sharing a session via a link,
or building features that need a backend, like saved history).

## Endpoints

| Method | Path                     | Body / Query                                  | Description                                  |
|--------|--------------------------|------------------------------------------------|-----------------------------------------------|
| GET    | `/api/health`            | —                                              | Health check (used by Render)                |
| POST   | `/api/rsa/keys`          | `{ bits: 16\|32\|64 }`                         | Generate an RSA keypair                      |
| POST   | `/api/rsa/encrypt`       | `{ message, e, n }`                            | Encrypt a message                            |
| POST   | `/api/rsa/decrypt`       | `{ ciphertext: [...], d, n }`                  | Decrypt ciphertext chunks                    |
| POST   | `/api/rsa/modpow-steps`  | `{ base, exp, mod }`                           | Step-by-step modular exponentiation trace    |
| POST   | `/api/rsa/run`           | `{ message, bits, save? }`                     | Full keygen → encrypt → decrypt in one call  |
| POST   | `/api/caesar/run`        | `{ text, shift, mode, save? }`                 | Caesar cipher encrypt/decrypt                |
| POST   | `/api/caesar/brute-force`| `{ text }`                                     | All 26 possible shifts                       |
| POST   | `/api/caesar/frequency`  | `{ text }`                                     | Letter frequency table                       |
| POST   | `/api/password/analyze`  | `{ password }`                                 | Entropy / strength analysis (never saved)    |
| GET    | `/api/history`           | `?type=rsa\|caesar\|password&limit=50`         | List saved history for this browser session  |
| DELETE | `/api/history/:id`       | —                                              | Delete one history entry                     |
| DELETE | `/api/history`           | —                                              | Clear all history for this session           |

All numbers larger than JS's safe integer range (RSA `n`, `e`, `d`, etc.)
are passed as **strings** in JSON request/response bodies and converted
to `BigInt` server-side.

Session grouping for history uses an `X-Session-Id` header (or `sessionId`
in the body/query) — a random ID the frontend generates and stores in
`localStorage`. There's no login system; it's just a way to group a
visitor's saved items.

## Local development

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

The server starts on `http://localhost:3001` by default. Without
Supabase credentials set, history is stored in memory and resets on
restart — that's fine for local testing.

## Deploying the backend to Render

1. Push this repo (including the `server/` folder) to GitHub.
2. In Render, choose **New + → Blueprint** and point it at your repo —
   it will read `server/render.yaml` automatically. Or create a **Web
   Service** manually with:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Add environment variables (Render dashboard → your service →
   Environment):
   - `CORS_ORIGIN` — your GitHub Pages URL, e.g.
     `https://yourusername.github.io`
   - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (see below) — optional,
     but needed for history to persist.
4. Deploy. Render gives you a URL like
   `https://securecrypt-api.onrender.com`.

## Setting up Supabase for persistence

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `server/supabase/schema.sql` to create
   the `history` table.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret key** → `SUPABASE_SERVICE_KEY`
     (⚠️ this key bypasses Row Level Security — never put it in
     frontend code, only in the backend's environment variables)
4. Set both as environment variables on Render and redeploy.

Without these two variables, the API still works — it just keeps
history in memory instead of in Supabase, and that memory clears
whenever the server restarts.

## Connecting the frontend

In the frontend project root:

```bash
cp .env.example .env
# edit .env, set VITE_API_URL to your Render URL
```

Then import the client where you need it:

```js
import { api } from "./src/api/client";

const result = await api.runRsaDemo("Hello, SecureCrypt!", 32, true);
```

## Notes on scope

- RSA key sizes are capped at 64 bits in the UI (128-bit hard server cap)
  — this is an educational demo of the RSA *algorithm*, not a
  production-grade crypto implementation. Real RSA uses 2048+ bit keys.
- Password analysis is **not saved** to history by design — entropy
  calculation happens on request, but the password content itself is
  never persisted, matching the original frontend's "analyzed locally"
  promise.
- A basic rate limiter (60 requests/min per IP) protects the CPU-bound
  endpoints like key generation and brute-force from abuse.
