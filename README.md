# Project Sunrise

A travel booking app for companies. Employees search flights/hotels, submit bookings that go through an approval chain based on their role and company policy, and get PDF tickets generated on approval.

Built with React, Express, and PostgreSQL.

## What it does

- **Search** — Flight and hotel search (mock data by default, SerpAPI integration available)
- **Book** — Employees create bookings; the system checks them against designation-based policies (flight class, hotel stars, cost caps)
- **Approve** — Bookings that violate policy or require approval route through a management hierarchy. Managers can delegate when OOO.
- **Deliver** — Approved bookings generate a PDF boarding pass/voucher and send it via email
- **Admin** — Dashboard for spend analytics, policy configuration, and user management

## Roles

| Role | Can do |
|------|--------|
| Employee | Search, book, view own bookings |
| Approver | Approve/reject bookings, manage delegations |
| Admin | Everything + user management, policies, analytics |

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Backend
```bash
cd backend
npm install
cp .env.example .env    # edit with your DB credentials
npm run migrate
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`.

### Test accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Employee | karan.kapoor@company.com | password123 |
| Approver | aditya.roy@company.com | password123 |
| Admin | arjun.mehta@company.com | password123 |

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios
- **Backend:** Express.js, PostgreSQL (pg), JWT auth, bcryptjs
- **Extras:** PDFKit (ticket generation), Nodemailer (email), express-rate-limit, express-validator

## Project structure

```
project-sunrise/
├── backend/
│   └── src/
│       ├── config/          # DB connection, migrations, seeds
│       ├── controllers/     # Route handlers
│       ├── middleware/       # Auth, validation, rate limiting
│       ├── services/        # PDF generation, email
│       ├── routes/          # Express routers
│       └── server.js
├── frontend/
│   └── src/
│       ├── components/      # Navbar, modals, route guards
│       ├── context/         # Auth state (React Context)
│       ├── pages/           # Page components
│       └── services/        # Axios instance
├── ARCHITECTURE.md          # Detailed architecture docs
└── README.md
```

## API endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | Public | Sign up |
| `/api/auth/login` | POST | Public | Log in |
| `/api/auth/profile` | GET | Yes | Get profile |
| `/api/flights/search` | GET | Yes | Search flights |
| `/api/hotels/search` | GET | Yes | Search hotels |
| `/api/bookings` | POST | Yes | Create booking |
| `/api/bookings/my-bookings` | GET | Yes | My bookings |
| `/api/bookings/approvals/pending` | GET | Approver+ | Pending approvals |
| `/api/bookings/approvals/:id` | PUT | Approver+ | Approve/reject |
| `/api/bookings/:id/ticket` | GET | Yes | Download PDF |
| `/api/policies` | GET | Yes | List policies |
| `/api/policies/validate` | POST | Yes | Check policy |
| `/api/delegations` | GET/POST | Approver+ | Manage delegates |
| `/api/dashboard/stats` | GET | Admin | Analytics |
| `/api/admin/users` | GET/POST | Admin | User management |
