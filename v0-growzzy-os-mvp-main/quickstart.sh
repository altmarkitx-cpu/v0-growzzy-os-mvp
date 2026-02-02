#!/bin/bash
set -e

echo "🚀 GROWZZY OS - Quick Start Setup"
echo "=================================="
echo ""

# Step 1: Check environment
echo "Step 1: Checking environment..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"
echo ""

# Step 2: Create .env.local
echo "Step 2: Setting up environment variables..."
if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    cp .env.local.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your values:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL (from Supabase dashboard)"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)"
    echo "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase settings)"
    echo "   - OPENAI_API_KEY (from OpenAI account)"
    echo "   - NEXTAUTH_SECRET (run: openssl rand -base64 32)"
    echo ""
    echo "Once completed, run this script again."
    exit 0
fi
echo "✅ .env.local configured"
echo ""

# Step 3: Install dependencies
echo "Step 3: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 4: Generate Prisma client
echo "Step 4: Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Step 5: Build application
echo "Step 5: Building application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Visit: http://localhost:3000"
echo "3. Login with test credentials"
echo ""
echo "To deploy to Vercel:"
echo "1. Push to GitHub: git push"
echo "2. Connect repository to Vercel"
echo "3. Add environment variables in Vercel dashboard"
echo "4. Deployment will auto-trigger"
echo ""
