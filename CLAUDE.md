# PQT After-Sales Property Management System

Dual-portal property management system: **Internal Portal** (PQT team - full management) and **Client Portal** (owners - property performance, income, costs).

## Tech Stack
- **Backend:** Django 5 + Django REST Framework + PostgreSQL
- **Frontend:** React 18 (Vite) + Ant Design + Recharts
- **Auth:** JWT (SimpleJWT) with role-based access (admin/manager/staff/client)

## Project Structure
- `backend/` - Django REST API
- `frontend/` - React SPA (dual portal)

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Default Admin
- Email: admin@pqt.com
- Password: admin123

## Key Modules
- Properties & Units, Owners & Tenants, Contracts/Leases
- Maintenance Tickets, Invoices & Payments, Owner Payouts
- Internal Dashboard (revenue, occupancy, tickets)
- Client Dashboard (income, costs, management fees, tax, net income)

## API Docs
Visit http://localhost:8000/api/docs/ for Swagger UI
