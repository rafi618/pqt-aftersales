#!/usr/bin/env bash
# PQT After-Sales — one-command preview setup (SQLite, no PostgreSQL needed)
set -e

echo "==> Installing backend dependencies..."
cd backend
pip install -q -r requirements.txt

echo "==> Setting up database (SQLite)..."
DB_ENGINE=sqlite python manage.py migrate --noinput

echo "==> Seeding demo data..."
DB_ENGINE=sqlite python manage.py seed_demo

echo ""
echo "==> Building frontend..."
cd ../frontend
npm install --silent
npm run build

echo ""
echo "============================================================"
echo "  Setup complete! Start the server with:"
echo ""
echo "    cd backend && DB_ENGINE=sqlite python manage.py runserver"
echo ""
echo "  Then open: http://localhost:8000/"
echo ""
echo "  PQT Staff:    admin@pqt.com / admin123"
echo "  Client:       owner@example.com / client123"
echo "============================================================"
