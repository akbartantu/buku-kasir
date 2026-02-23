# QA Testing Guide — Auth Sprint

Test cases in User Story / Test Case (US/TC) format. Run manually unless automated later.

## Environment

- Backend running (e.g. `cd server && npm run dev`).
- Frontend running (e.g. `npm run dev`).
- Browser at app URL (e.g. http://localhost:8080).

---

## US-1: Register

| ID     | Step | Action | Expected result |
|--------|------|--------|------------------|
| US-1/TC1 | 1 | Open `/register` | Register page loads with email, password, (optional) name fields and submit button. |
| US-1/TC2 | 1–2 | Submit with empty email or password | Validation error shown; no redirect. |
| US-1/TC3 | 1–3 | Submit with valid email, password, name | User created; redirect to home (or main app); user is signed in. |
| US-1/TC4 | 1–3 | Submit with same email twice | Second attempt shows error (e.g. email already exists); no redirect. |

---

## US-2: Sign in

| ID     | Step | Action | Expected result |
|--------|------|--------|------------------|
| US-2/TC1 | 1 | Open `/signin` | Sign in page loads with email, password and submit button. |
| US-2/TC2 | 1–2 | Submit with wrong password | Error shown; stay on sign in. |
| US-2/TC3 | 1–2 | Submit with correct email and password | Redirect to home; user is signed in. |
| US-2/TC4 | 1–2 | Open app in new tab after sign in | Session still valid (e.g. token restored); no redirect to sign in. |

---

## US-3: Sign out

| ID     | Step | Action | Expected result |
|--------|------|--------|------------------|
| US-3/TC1 | 1 | While signed in, find Sign out (header or Akun) | Sign out control is visible. |
| US-3/TC2 | 1–2 | Click Sign out | Token/user cleared; redirect to `/signin`. |
| US-3/TC3 | 1–2 | After sign out, open `/` | Redirect to `/signin`. |

---

## US-4: Protected app

| ID     | Step | Action | Expected result |
|--------|------|--------|------------------|
| US-4/TC1 | 1 | While not signed in, open `/` or `/add-sale` | Redirect to `/signin`. |
| US-4/TC2 | 1 | Sign in, then open `/` | Home (or main app) loads; no redirect to sign in. |

---

## How to run the project (steps for testers)

1. Open a terminal in the project folder.
2. Install frontend: `npm install`.
3. Install server: `cd server` then `npm install`, then `cd ..`.
4. Start the server: in one terminal, `cd server` then `npm run dev`. Leave it running.
5. Start the website: in a second terminal, from project root, `npm run dev`.
6. Open the URL shown (e.g. http://localhost:8080) in the browser.
7. Complete onboarding if shown, then use Register or Sign in to test.

**Completion:** All US-1–US-4 test cases pass as expected.
