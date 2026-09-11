# Architecture

## Overview

Three-tier app: React SPA → Express REST API → PostgreSQL.

Employees search flights/hotels, create bookings, and the system routes them through an approval chain. Approved bookings generate PDF tickets.

## How the approval flow works

This is the core of the app, so it's worth understanding well.

1. Employee submits a booking
2. System checks the booking against their designation's policy (flight class, hotel stars, cost limits)
3. If policy violations exist and no justification is provided, the booking is rejected with reasons
4. If justification is provided or booking is compliant, the system finds an approver using a hierarchy walk:
   - Start with the employee's direct manager
   - If manager isn't an approver, walk up the chain (manager's manager, etc.)
   - Fallback: highest-ranking approver in the same department
   - Fallback: any approver in the company
   - Final fallback: an admin
   - Self-approval is always blocked
5. Approvers can delegate when out of office — the system checks delegation windows and reroutes
6. When approved, a PDF ticket is generated and emailed to the employee

## Key files

| File | What it does |
|------|--------------|
| `bookingController.js` | Booking creation, approval routing, approval actions, ticket generation trigger |
| `policyController.js` | Policy CRUD and booking validation against policies |
| `delegationController.js` | OOO delegation CRUD |
| `authController.js` | Register, login, profile management |
| `adminController.js` | User CRUD (admin only) |
| `ticketService.js` | Generates PDF boarding passes and hotel vouchers using PDFKit |
| `emailService.js` | Sends approval/rejection emails with PDF attachments via Nodemailer |
| `auth.js` (middleware) | JWT verification and role-based access control |
| `validate.js` (middleware) | Input validation using express-validator |
| `rateLimit.js` (middleware) | Rate limiting for auth and admin endpoints |

## Database schema

```
users
├── id, name, email, password_hash
├── role (employee | approver | admin)
├── designation, salary_band, department
└── manager_id → users.id (self-referential for hierarchy)

travel_policies
├── designation (unique)
├── max_flight_class, max_hotel_stars
├── max_flight_cost, max_hotel_cost_per_night
└── requires_approval

bookings
├── user_id → users.id
├── booking_type (flight | hotel)
├── status (pending | approved | rejected | ticketed | cancelled)
├── flight/hotel details (from_city, to_city, hotel_name, etc.)
├── total_cost, policy_compliant, policy_violations[]
├── justification (for out-of-policy requests)
├── confirmation_number, ticket_pdf_path
└── created_at, updated_at

approvals
├── booking_id → bookings.id
├── approver_id → users.id
├── status (pending | approved | rejected)
├── comments
└── delegated_from → users.id

approval_delegations
├── original_approver_id → users.id
├── delegated_to_id → users.id
├── is_active, start_date, end_date
└── reason
```

## Auth and security

- **Passwords:** bcrypt with salt rounds
- **Sessions:** JWT tokens (24h expiry), stored in localStorage
- **RBAC:** Middleware checks `req.user.role` against allowed roles per route
- **Rate limiting:** Global (100 req/15min), auth endpoints (10 req/15min), admin (30 req/15min)
- **Input validation:** express-validator on register and login
- **SQL injection:** All queries use parameterized statements ($1, $2, ...)
- **Registration:** Public signup is locked to employee role — admin/approver assigned via admin panel only

## Frontend architecture

- React 18 with Vite
- React Router v6 with `PrivateRoute` for auth-guarded pages
- React Context for auth state (`AuthContext`) and theme (`ThemeContext`)
- Axios instance with request interceptor (attaches JWT) and response interceptor (handles 401)
- Tailwind CSS for styling

## External services

- **SerpAPI** (optional) — Real flight/hotel search. Falls back to mock data if API key isn't configured.
- **Nodemailer** (optional) — Sends emails via SMTP. Gracefully skips if SMTP isn't configured.
- **PDFKit** — Generates PDF tickets locally (no external service needed).

## Directory structure

```
backend/src/
├── config/          # database.js (pg.Pool), migrate.js, seed.js
├── controllers/     # Route handlers
├── middleware/       # auth.js, validate.js, rateLimit.js
├── services/        # ticketService.js, emailService.js
├── routes/          # Express routers
└── server.js        # Entry point, middleware stack

frontend/src/
├── components/      # Navbar, HotelDetailModal, PrivateRoute
├── context/         # AuthContext.jsx, ThemeContext.jsx
├── pages/           # One component per page
├── services/        # api.js (Axios instance)
├── App.jsx          # Routes
└── main.jsx         # Entry point
```
