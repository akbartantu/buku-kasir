# Sprint Planning — Auth (Sign In, Register, Sign Out)

## Sprint goal

Implement sign in, register, and sign out with a real backend (Node/Express). The app is modular: auth is a dedicated feature; protected routes require authentication.

## Scope (from master plan)

- Auth module: Register, Sign in, Sign out.
- Backend: user store, JWT, bcrypt; endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (optional), `POST /auth/logout` (optional).
- Frontend: Auth feature (types, API, context, ProtectedRoute, SignIn and Register pages), App wiring, sign-out UI.

## User stories and acceptance criteria

### US-1: Register

- **As a** new user, **I want to** create an account with email and password **so that** I can sign in later.
- **Acceptance criteria:**
  - Register page at `/register` with form: email, password, optional name.
  - Validation (required email/password; format/strength as defined).
  - On success: user created on backend, JWT returned; frontend stores token and redirects to home.
  - On error (e.g. email already exists): show message, do not redirect.

### US-2: Sign in

- **As a** registered user, **I want to** sign in with email and password **so that** I can use the app.
- **Acceptance criteria:**
  - Sign in page at `/signin` with form: email, password.
  - On success: JWT stored; redirect to home or intended URL.
  - On error: show message, do not redirect.

### US-3: Sign out

- **As a** signed-in user, **I want to** sign out **so that** my session ends.
- **Acceptance criteria:**
  - Sign out control visible when authenticated (e.g. header or Akun tab).
  - On click: token and user cleared; redirect to `/signin`.

### US-4: Protected app

- **As a** visitor, **I want** the app to show sign in when I am not authenticated **so that** I cannot use main features without an account.
- **Acceptance criteria:**
  - Unauthenticated access to `/`, `/add-sale`, `/add-expense`, `/summary`, `/products` redirects to `/signin`.
  - Authenticated users can access these routes; session restored on load via token (e.g. `GET /auth/me`).

## Out of scope this sprint

- Password reset, email verification, OAuth.
- Moving products/transactions to backend (still localStorage for this sprint).
