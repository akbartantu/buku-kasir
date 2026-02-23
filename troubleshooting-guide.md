# Troubleshooting Guide

Log problems, causes, fixes, and verification here. Update when issues or workarounds are discovered.

## Format per entry

- **Problem:** What went wrong (symptom).
- **Cause:** Why it happened (if known).
- **Fix:** What was done to fix it.
- **Verification:** How to confirm the fix.

---

## Entries

### Google Sheets not configured

- **Problem:** Products or transactions list is empty; API returns 503 or "Google Sheets not configured".
- **Cause:** `GOOGLE_SHEETS_SPREADSHEET_ID` or `GOOGLE_APPLICATION_CREDENTIALS` is not set in `server/.env`, or the spreadsheet is not shared with the service account.
- **Fix:** Create a Google Cloud project, enable Sheets API, create a service account, download the JSON key. Create a spreadsheet (or run `node scripts/ensure-sheets-tables.js` after setting the ID). The script creates all six sheets (**Users**, **Shop**, **Products**, **Transactions**, **OperationalCosts**, **Orders**) with headers per [erd-and-sheets.md](erd-and-sheets.md). Set `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_APPLICATION_CREDENTIALS` (path to the JSON file) in `server/.env`. Share the spreadsheet with the service account email (Editor).
- **Verification:** Restart the server; open the app and add a product or transaction; check the spreadsheet for the new row.

### CORS: "Access-Control-Allow-Origin header contains multiple values"

- **Problem:** Browser blocks requests with: "The 'Access-Control-Allow-Origin' header contains multiple values 'http://localhost:8080, http://localhost:3000', but only one is allowed."
- **Cause:** `CORS_ORIGIN` in `server/.env` was set to a comma-separated string that was sent literally as one header value, or the header was sent twice.
- **Fix:** The server now parses `CORS_ORIGIN`: a single origin is sent as one value; multiple comma-separated origins are passed as an array so the `cors` package reflects back only the request origin. Ensure `server/.env` has one origin, e.g. `CORS_ORIGIN=http://localhost:8080`, or several with no spaces after commas: `CORS_ORIGIN=http://localhost:8080,http://localhost:3000`. Restart the API server after changing `.env`.
- **Verification:** Restart the server, then register or log in from the app; the request should succeed and the browser should not show the CORS error.

### Login or register fails with ERR_CONNECTION_REFUSED (localhost:3000)

- **Problem:** Browser shows `POST http://localhost:3000/auth/login net::ERR_CONNECTION_REFUSED` (or same for `/auth/register`). Login and register do not work.
- **Cause:** The API server is not running. The root `npm run dev` only starts the Vite frontend; the backend must be started separately.
- **Fix:** Open a second terminal. From the project root, run: `cd server` then `node index.js` (or `npm run dev` for watch mode). Leave it running. The API listens on port 3000 by default (or the port in `server/.env` if `PORT` is set). Then use the app in the browser as usual.
- **Verification:** With the server running, you should see "Server running at http://localhost:3000" in the server terminal. Try logging in or registering again; the request should reach the server.

### Users, Shop, or OperationalCosts sheets missing

- **Problem:** The Google spreadsheet has no **Users**, **Shop**, or **OperationalCosts** sheet tabs; login, shop, or operational costs fail or show empty.
- **Cause:** The one-time setup script that creates these sheets has not been run.
- **Fix:** From the project root, run: `node server/scripts/ensure-sheets-tables.js` (works in PowerShell, cmd, and bash). Or from the `server` folder run: `node scripts/ensure-sheets-tables.js`. Ensure `server/.env` has `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_APPLICATION_CREDENTIALS` (path to the service account JSON). The spreadsheet must be shared with the service account email (Editor).
- **Verification:** Open the spreadsheet in Google Sheets and confirm the six sheet tabs exist (Users, Shop, Products, Transactions, OperationalCosts, Orders) with the correct header row in each, as in [erd-and-sheets.md](erd-and-sheets.md).
