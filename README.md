# Project Sunrise - Corporate Travel Booking Platform

A full-stack corporate travel booking platform built with React, Node.js, Express, and PostgreSQL.

## 🚀 Features

### Core Features
- **Flight Search** - Search flights with mock data, filter by city, class, and dates
- **Hotel Search** - Search hotels with mock data, filter by city, stars, and dates
- **Booking System** - Create and manage travel bookings
- **Approval Workflow** - Multi-level approval system for bookings
- **Corporate Policy Engine** - Validate bookings against company policies

### User Roles
1. **Employee** - Search and book flights/hotels, view bookings
2. **Travel Approver** - Approve/reject booking requests
3. **Travel Administrator** - Full access to dashboard and analytics

### Dashboard Features
- Today's bookings count
- Total travel spend
- Pending approvals
- Most travelled cities
- Booking status breakdown
- Monthly trend analysis

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd project-sunrise
```

### 2. Setup Backend

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Edit `backend/.env` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_sunrise
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
PORT=5000
```

### 4. Create Database

```sql
CREATE DATABASE project_sunrise;
```

### 5. Run Migrations

```bash
npm run migrate
```

### 6. Seed Test Data

```bash
npm run seed
```

### 7. Setup Frontend

```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## 👥 Test Accounts

After running the seed script, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@test.com | password123 |
| Approver | approver@test.com | password123 |
| Admin | admin@test.com | password123 |

## 📁 Project Structure

```
project-sunrise/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and migration config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth middleware
│   │   ├── models/          # Database models
│   │   ├── mockData/        # Flight and hotel mock data
│   │   ├── routes/          # API routes
│   │   └── server.js        # Express server
│   ├── .env                 # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Flights
- `GET /api/flights/search` - Search flights
- `GET /api/flights/cities` - Get available cities
- `GET /api/flights/:id` - Get flight by ID

### Hotels
- `GET /api/hotels/search` - Search hotels
- `GET /api/hotels/cities` - Get available cities
- `GET /api/hotels/:id` - Get hotel by ID

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/approvals/pending` - Get pending approvals
- `PUT /api/bookings/approvals/:id` - Approve/reject booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/all` - Get all bookings (admin)

### Policies
- `GET /api/policies` - Get all policies
- `GET /api/policies/:designation` - Get policy by designation
- `POST /api/policies/validate` - Validate booking against policy

### Dashboard
- `GET /api/dashboard/stats` - Get admin dashboard stats
- `GET /api/dashboard/my-stats` - Get user stats

## 🏗️ Database Schema

### Users Table
- id, name, email, password_hash, role, designation, salary_band, department

### Bookings Table
- id, user_id, booking_type, status, travel_date, from_city, to_city, hotel_name, total_cost, etc.

### Approvals Table
- id, booking_id, approver_id, status, comments

### Travel Policies Table
- id, designation, max_flight_class, max_hotel_stars, daily_allowance

## 🎨 Tech Stack

- **Frontend:** React 18, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend:** Node.js, Express.js, PostgreSQL, JWT, bcryptjs
- **Tools:** Vite, PostCSS, Nodemon

## 📝 License

This project is created for educational purposes as part of Project Sunrise assessment.
