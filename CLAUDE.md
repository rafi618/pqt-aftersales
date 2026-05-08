# PQT After-Sales Property Management System

Dual-portal property management system: **Internal Portal** (PQT team - full management) and **Client Portal** (owners - property performance, income, costs).

## Tech Stack
- **Backend:** Django 5 + Django REST Framework + SQLite (default) / PostgreSQL (optional)
- **Frontend:** React 18 (Vite) + Ant Design + Recharts (built and served by Django)
- **Auth:** JWT (SimpleJWT) with role-based access (admin/manager/staff/client)

## Quick Preview (one command)

```bash
./setup.sh
cd backend && DB_ENGINE=sqlite python manage.py runserver
```

Then open **http://localhost:8000/**

### Demo Logins
| Role | Email | Password | Sees |
|------|-------|----------|------|
| PQT Staff | `admin@pqt.com` | `admin123` | Internal portal — everything |
| Owner / Client | `owner@example.com` | `client123` | Client portal — only Ahmed's properties |

The seed creates 4 properties, 60 units, 4 owners, 8 tenants, 8 active contracts, 12 months of invoices/payments, and 6 monthly owner payouts.

## Manual setup

```bash
# Backend
cd backend
pip install -r requirements.txt
DB_ENGINE=sqlite python manage.py migrate
DB_ENGINE=sqlite python manage.py seed_demo
DB_ENGINE=sqlite python manage.py runserver

# Frontend (only needed if you change React code)
cd frontend
npm install
npm run build      # builds into frontend/dist/, served by Django
# OR for hot-reload dev:
npm run dev        # runs at :5173 (configure VITE_API_URL=http://localhost:8000/api/v1)
```

To use PostgreSQL instead, set `DB_ENGINE=postgres` and provide `DB_NAME / DB_USER / DB_PASSWORD / DB_HOST`.

## Project Structure
- `backend/` - Django REST API + serves React build at `/`
- `frontend/` - React SPA (dual portal)
- `setup.sh` - one-command preview installer

## Key Modules
- Properties & Units, Owners & Tenants, Contracts/Leases
- Maintenance Tickets, Invoices & Payments, Owner Payouts
- Internal Dashboard (revenue, occupancy, tickets)
- Client Dashboard (income, costs, management fees, tax, net income)

## API Docs
Visit `/api/docs/` for Swagger UI
