# Master Plan — Catat Jualan

## Product scope

**Catat Jualan** is a sales and expense tracking app. Users sign in, complete onboarding, then record sales and expenses, manage products, and view summaries. **Data storage:** all persistent data (users, shop, products, transactions, operational costs, orders) in one Google Spreadsheet; users sheet includes password hash for auth; each user sees only their own data (scoped by userId). See [erd-and-sheets.md](erd-and-sheets.md) for the normalized ERD and sheet layout.

## Module classification

| Module   | Purpose                          | Pages / entry points                    |
|----------|----------------------------------|-----------------------------------------|
| **Auth** | Sign in, register, sign out      | Sign In, Register (public)              |
| **Onboarding** | First-time intro           | Onboarding (shown once)                  |
| **Sales** | Record and view sales          | Home, Add Sale, Summary                 |
| **Expenses** | Record expenses              | Add Expense, Summary                    |
| **Products** | Manage product catalog       | Manage Products                         |
| **Orders**   | Customer orders (pesanan)    | Orders (list, add, update collected/paid) |
| **Summary** | View daily/overview          | Summary (shared with Sales/Expenses)    |
| **Admin** | Admin-only views across sellers | Admin Dashboard, Pengguna, Transaksi   |

## Pages per module

- **Auth:** `/signin`, `/register`
- **Onboarding:** Full-screen before first use (no path)
- **Sales:** `/` (Home), `/add-sale`
- **Expenses:** `/add-expense`
- **Products:** `/products`
- **Orders:** `/orders`
- **Summary:** `/summary`
- **Admin:** `/admin` (Dashboard, Ringkasan, Pengguna, Transaksi)

## Use cases (workflow + data)

### Auth module

| Use case      | Workflow | Data read | Data write |
|---------------|----------|-----------|------------|
| **Register** | User opens Register → fills email, password, name (optional) → submit → backend creates user in Users sheet, returns JWT → redirect to app | — | Spreadsheet: Users sheet (id, email, phone, name, passwordHash, createdAt) |
| **Sign in**   | User opens Sign in → fills email, password → submit → backend validates via Users sheet → returns JWT → redirect to app | Spreadsheet: Users sheet (user by email/phone, verify password) | — |
| **Sign out**  | User clicks Sign out → frontend clears token and user state → redirect to Sign in | — | Frontend: clear token/user |

### Onboarding

| Use case           | Workflow | Data read | Data write |
|--------------------|----------|-----------|------------|
| **Complete onboarding** | User sees slides → taps selesai → app marks onboarded | localStorage: onboarded flag | localStorage: set onboarded |

### Sales / Expenses / Products / Summary

Users, Shop, Products, Transactions, OperationalCosts, and Orders are stored in Google Spreadsheet (see erd-and-sheets.md). Backend API (JWT, userId from token) reads/writes Sheets; frontend calls the API. Each user has one shop (toko name), their own products, transactions, operational costs, and orders. Record sales, record expenses, manage products, view summary, manage customer orders (pesanan: customer name, product, quantity, when to send/collect, status collected/paid); optional: manage shop name and operational costs (recurring/one-time).

### Admin module

| Use case | Workflow | Data read | Data write |
|----------|----------|-----------|------------|
| **View all transactions** | Admin opens Admin > Transaksi → sets date range and optional type filter → sees list of all penjualan and expenses across all sellers | Spreadsheet: Transactions (all rows), Users (for seller names) | — |

## Governance rules

- All features must be described here before implementation.
- Auth: protected routes require valid session (JWT); public routes are `/signin`, `/register`, and onboarding.
- Documentation is source of truth; code must match it.
