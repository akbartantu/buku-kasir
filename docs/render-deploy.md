# Deploy Buku Kasir on Render

You create **two** services in the same repo: one **Web Service** (backend API) and one **Static Site** (frontend).

## 1. Backend (API) Web Service

1. Go to [Render](https://render.com) and sign in. **New** → **Web Service**.
2. Connect **GitHub** and select **akbartantu/buku-kasir**. Branch: **master** (or `main` if you use that).
3. **Name**: e.g. `buku-kasir-api`.
4. **Region**: pick the closest to your users.
5. **Root Directory**: **`server`**.
6. **Runtime**: **Node**.
7. **Build Command**: `npm install` (or `npm ci` if you use the lockfile).
8. **Start Command**: `npm start`.
9. **Instance Type**: Free (or paid if you need always-on).

### Backend environment variables

| Key | Value | Notes |
|-----|--------|--------|
| `NODE_ENV` | `production` | Optional |
| `PORT` | (leave empty) | Render sets this |
| `JWT_SECRET` | (long random string) | Use a strong secret |
| `CORS_ORIGIN` | (set after frontend is live) | Frontend URL, no trailing slash |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | (your spreadsheet ID) | From `server/.env` |
| `GOOGLE_CREDENTIALS_JSON` | (entire `service-account.json` as string) | See below |

**Google credentials (Option A – recommended)**  
Set **`GOOGLE_CREDENTIALS_JSON`** to the **full contents** of your `service-account.json` (the whole JSON as one string). The server writes it to a temp file at startup and sets `GOOGLE_APPLICATION_CREDENTIALS` automatically. Do not set `GOOGLE_APPLICATION_CREDENTIALS` when using this option.

**Option B**  
Use Render’s **Secret File** for `service-account.json` and set **`GOOGLE_APPLICATION_CREDENTIALS`** to the path Render gives (e.g. `/etc/secrets/service-account.json`).

10. **Create Web Service**. Wait for deploy, then note the URL (e.g. `https://buku-kasir-api.onrender.com`).
11. Open `https://<your-api-url>/health`; you should see `{"ok":true}`.

---

## 2. Frontend (Static Site)

1. **New** → **Static Site**.
2. Connect **akbartantu/buku-kasir**, branch **master** (or `main`).
3. **Name**: e.g. `buku-kasir`.
4. **Root Directory**: leave **empty** (repo root).
5. **Build Command**: `npm install && npm run build` (or `npm ci && npm run build`).
6. **Publish Directory**: **`dist`**.

### Frontend environment variable

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://<your-backend-url>` (e.g. `https://buku-kasir-api.onrender.com`) |

No trailing slash. This is used at build time.

7. **Create Static Site**. Wait for deploy and note the frontend URL (e.g. `https://buku-kasir.onrender.com`).

---

## 3. CORS and final check

1. Open the **backend** Web Service → **Environment**.
2. Set **CORS_ORIGIN** to the **frontend** URL (e.g. `https://buku-kasir.onrender.com`). Save so the backend redeploys.
3. Open the **frontend** URL in a browser, sign in or register, and confirm the app works.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Render: New Web Service, root `server`, build `npm install`, start `npm start`. |
| 2 | Set backend env vars (JWT_SECRET, GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_CREDENTIALS_JSON). |
| 3 | Deploy backend, copy its URL. |
| 4 | Render: New Static Site, build `npm install && npm run build`, publish `dist`. |
| 5 | Set `VITE_API_URL` = backend URL. Deploy frontend, copy its URL. |
| 6 | Set backend `CORS_ORIGIN` = frontend URL, redeploy backend. |
| 7 | Test login and app on the frontend URL. |
