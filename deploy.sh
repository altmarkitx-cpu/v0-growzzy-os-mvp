#!/bin/bash

# GROWZZY OS - Deploy to Vercel Script
# Streamlined deployment process

set -e

echo "🚀 GROWZZY OS - Vercel Deployment"
echo "================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Deploying to Vercel..."
echo ""

# Deploy to production
vercel deploy --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel dashboard to monitor deployment"
echo "2. Update OAuth redirect URLs:"
echo "   - Meta: https://your-domain.vercel.app/api/oauth/meta/callback"
echo "   - Google: https://your-domain.vercel.app/api/oauth/google/callback"
echo "   - LinkedIn: https://your-domain.vercel.app/api/oauth/linkedin/callback"
echo "3. Test all features on live URL"
echo ""
