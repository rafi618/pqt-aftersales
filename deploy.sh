#!/bin/bash
set -e

APP_DIR="/var/www/pqt-aftersales"
REPO_URL="https://github.com/rafi618/pqt-aftersales.git"
BRANCH="claude/enhance-payment-system-1Itox"

echo "========================================="
echo "  PQT After-Sales Deployment Script"
echo "========================================="

# Step 1: Install system dependencies
echo ""
echo "[1/9] Installing system dependencies..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  Node.js version: $(node -v)"
echo "  npm version: $(npm -v)"

# Step 2: Install PM2 globally
echo ""
echo "[2/9] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "  PM2 version: $(pm2 -v)"

# Step 3: Install nginx
echo ""
echo "[3/9] Installing nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Step 4: Install PostgreSQL
echo ""
echo "[4/9] Setting up PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
fi
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
DB_NAME="pqt_aftersales"
DB_USER="pqt_user"
DB_PASS="pqt_secure_$(openssl rand -hex 8)"

echo "  Creating database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres createdb "$DB_NAME"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo "  Database ready: $DB_NAME"

# Step 5: Clone or pull the repo
echo ""
echo "[5/9] Setting up application..."
if [ -d "$APP_DIR" ]; then
    echo "  Updating existing installation..."
    cd "$APP_DIR"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "  Cloning repository..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Step 6: Configure environment
echo ""
echo "[6/9] Configuring environment..."
echo "DATABASE_URL=\"$DATABASE_URL\"" > "$APP_DIR/.env"
echo "  .env file created"

# Step 7: Install dependencies
echo ""
echo "[7/9] Installing Node.js dependencies..."
npm install --production=false

# Step 8: Generate Prisma client, push schema, seed, and build
echo ""
echo "[8/9] Building application..."
npx prisma generate
npx prisma db push

# Seed only if first time (check if customers table has data)
ROW_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT count(*) FROM \"Customer\"" 2>/dev/null || echo "0")
if [ "$ROW_COUNT" = "0" ]; then
    echo "  Seeding database with demo data..."
    npm run db:seed
else
    echo "  Database already has data, skipping seed."
fi

npx next build

# Step 9: Start/restart with PM2
echo ""
echo "[9/9] Starting application with PM2..."
pm2 stop pqt-aftersales 2>/dev/null || true
pm2 delete pqt-aftersales 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  App running at: http://localhost:3000"
echo "  Database: PostgreSQL ($DB_NAME)"
echo ""
echo "  Next steps:"
echo "  1. Configure nginx (see below)"
echo "  2. Set up SSL with certbot"
echo ""
echo "  To configure nginx, run:"
echo "    sudo cp $APP_DIR/nginx.conf.example /etc/nginx/sites-available/pqt-aftersales"
echo "    sudo ln -sf /etc/nginx/sites-available/pqt-aftersales /etc/nginx/sites-enabled/"
echo "    # Edit /etc/nginx/sites-available/pqt-aftersales and replace your-domain.com"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  For SSL (HTTPS):"
echo "    sudo apt install certbot python3-certbot-nginx"
echo "    sudo certbot --nginx -d your-domain.com"
echo ""
echo "  Useful commands:"
echo "    pm2 logs pqt-aftersales    # View logs"
echo "    pm2 restart pqt-aftersales # Restart app"
echo "    pm2 status                 # Check status"
echo ""
