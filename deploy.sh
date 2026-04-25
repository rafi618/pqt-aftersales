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
echo "[1/8] Installing system dependencies..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  Node.js version: $(node -v)"
echo "  npm version: $(npm -v)"

# Step 2: Install PM2 globally
echo ""
echo "[2/8] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "  PM2 version: $(pm2 -v)"

# Step 3: Install nginx
echo ""
echo "[3/8] Installing nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Step 4: Clone or pull the repo
echo ""
echo "[4/8] Setting up application..."
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

# Step 5: Install dependencies
echo ""
echo "[5/8] Installing Node.js dependencies..."
npm install --production=false

# Step 6: Generate Prisma client and build
echo ""
echo "[6/8] Building application..."
npx prisma generate
npx next build

# Step 7: Initialize database
echo ""
echo "[7/8] Setting up database..."
if [ ! -f "$APP_DIR/dev.db" ]; then
    echo "  Creating database and running seed..."
    npx prisma db push
    npm run db:seed
else
    echo "  Database already exists, running migrations..."
    npx prisma db push
fi

# Step 8: Start/restart with PM2
echo ""
echo "[8/8] Starting application with PM2..."
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
echo ""
echo "  Next steps:"
echo "  1. Configure nginx (see below)"
echo "  2. Set up SSL with certbot"
echo ""
echo "  To configure nginx, run:"
echo "    sudo cp nginx.conf.example /etc/nginx/sites-available/pqt-aftersales"
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
