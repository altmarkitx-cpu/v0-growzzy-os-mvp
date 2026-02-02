#!/bin/bash

# GROWZZY OS - Setup & Deployment Script
# This script automates the setup process

set -e

echo "🚀 GROWZZY OS - Complete Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required (you have v$NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version OK${NC}"
echo ""

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi
echo -e "${GREEN}✅ pnpm available${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check for .env.local
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Creating .env.local from template..."
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠️  Please edit .env.local with your API keys${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ .env.local found${NC}"
echo ""

# Setup database
echo "🗄️  Setting up database..."
pnpm exec prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Note: We don't run prisma push here as it requires database connection
echo -e "${YELLOW}⚠️  Run 'pnpm prisma:push' to sync database schema${NC}"
echo ""

# Build Next.js
echo "🔨 Building application..."
pnpm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - check errors above${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your API keys if not already done"
echo "2. Run 'pnpm prisma:push' to setup database"
echo "3. Run 'pnpm dev' to start development server"
echo "4. Visit http://localhost:3000"
echo ""
echo "For deployment: See QUICK_START.md or DEPLOYMENT_GUIDE.md"
