# GROWZZY OS - AI-Powered Marketing Platform

A production-ready SaaS application that unifies Meta Ads, Google Ads, LinkedIn, and Shopify with AI-driven insights, automated creative generation, and real-time analytics.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![License MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

## 🚀 Quick Start

Get started in 5 steps: **[QUICK_START.md](./QUICK_START.md)**

For detailed deployment instructions: **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

## ✨ Key Features

### Complete Authentication System
- Email/Password sign up & login with secure hashing
- Session management with HTTP-only cookies
- Protected routes with middleware
- Automatic redirect to dashboard after login

### One-Click Platform Connections
- **Meta Ads** - Facebook & Instagram campaigns
- **Google Ads** - Search & Display ads
- **LinkedIn Ads** - B2B campaign management
- **Shopify** - E-commerce sales tracking
- Secure OAuth 2.0 flows with auto token refresh
- Real-time sync status monitoring
- Auto-sync every 5 minutes via Vercel Cron

### AI Creative Generator
- Generate 20 high-converting ad variations in seconds
- Powered by Claude AI with copywriting expertise
- Analyzes proven frameworks (PAS, AIDA, BAB, 4P, FAB)
- Performance scoring and psychological trigger analysis
- Target audience segmentation
- CSV export functionality

### Real-Time Analytics Dashboard
- KPI cards with trends (Spend, Revenue, ROAS, Conversions)
- 30-day performance charts
- Platform breakdown visualization
- Top 10 campaigns ranking table
- Real data from connected platforms
- Manual data refresh button

### Smart Automations
- Schedule-based rules (time/frequency)
- Metric threshold triggers
- Real API execution on platforms
- Automation history and logs
- Budget optimization recommendations

### Professional Report Generation
- AI-generated insights and analysis
- Platform performance breakdown
- Top/bottom campaign identification
- Budget reallocation recommendations
- PDF export with charts
- Email delivery integration

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS 4, Shadcn/UI
- **Backend**: Next.js API Routes, Prisma ORM, Supabase PostgreSQL
- **AI**: Claude (Anthropic), OpenAI GPT-4
- **Auth**: Custom auth + OAuth 2.0 (Meta, Google, LinkedIn, Shopify)
- **Deployment**: Vercel with Cron jobs

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase account (free tier works)
- OpenAI or Anthropic API key
- OAuth credentials (Meta, Google, LinkedIn)
- Vercel account (for deployment)

## 🏃 Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Initialize database
pnpm prisma:generate
pnpm prisma:push

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
growzzy-os/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── auth/page.tsx                 # Login/signup
│   ├── dashboard/page.tsx            # Main dashboard
│   ├── dashboard/creative/page.tsx   # AI creative generator
│   ├── connections/page.tsx          # Platform connections
│   └── api/                          # API endpoints
├── components/                       # Reusable UI components
├── lib/                              # Utilities & helpers
├── prisma/                           # Database schema
├── public/                           # Static assets
├── QUICK_START.md                    # 5-step deployment guide
├── DEPLOYMENT_GUIDE.md               # Detailed deployment
└── README.md                         # This file
```

## 🔑 Environment Variables

See `.env.local.example` for complete list:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# AI Services
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# OAuth Providers
META_APP_ID=your_id
META_APP_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret

# Security
ENCRYPTION_KEY=your_32_char_key
CRON_SECRET=your_secret
```

## 🚢 Deployment

**Step 1:** Get API keys from Supabase, OpenAI, and OAuth providers
**Step 2:** Push code to GitHub
**Step 3:** Deploy to Vercel with environment variables
**Step 4:** Update OAuth redirect URLs
**Step 5:** Test on live URL

See **[QUICK_START.md](./QUICK_START.md)** for detailed 5-step guide (40 minutes total).

## 📊 API Endpoints

- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/analytics/summary` - KPI metrics
- `GET /api/campaigns` - List campaigns
- `POST /api/creative/generate` - AI ad generator
- `GET /api/connections` - List platform connections
- `POST /api/oauth/start` - Begin OAuth flow

## 🔒 Security

✓ Password hashing (bcrypt)
✓ Secure sessions (HTTP-only cookies)
✓ OAuth 2.0 flows
✓ Data encryption
✓ SQL injection prevention (Prisma)
✓ CORS protection
✓ Rate limiting

## 🎯 Use Cases

- **Marketing Agencies**: Manage multiple client accounts
- **E-commerce Brands**: Unified ad spend tracking
- **SaaS Companies**: Lead generation optimization
- **Startups**: Cost-effective marketing ops
- **Enterprises**: Multi-team collaboration

## 📈 Performance

- Server-side rendering for fast initial load
- Client-side caching with SWR
- Optimized database queries
- Image optimization with Next.js
- Background jobs prevent UI blocking

## 🐛 Troubleshooting

**OAuth Popup Blocked?**
- Check popup blocker settings
- Verify redirect URLs match exactly

**Data Not Showing?**
- Click "Sync All Now" in Connections
- Wait 30 seconds for background job

**Creative Generator Error?**
- Verify OpenAI API key has credits
- Check rate limits
- Review Vercel logs

**Can't Log In?**
- Verify email/password
- Check Supabase connection
- Clear browser cache

## 📚 Documentation

- **Quick Deployment**: [QUICK_START.md](./QUICK_START.md)
- **Full Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Environment Setup**: [.env.local.example](./.env.local.example)

## 🗺️ Roadmap

- [ ] TikTok Ads integration
- [ ] Real-time bid optimization
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced audience segmentation
- [ ] Workflow builder
- [ ] Custom report templates

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Support

- Documentation: See guides above
- Issues: Open GitHub issues for bugs
- Email: support@growzzyos.com

## 🎉 Getting Started

1. **Read** [QUICK_START.md](./QUICK_START.md) (5 minutes)
2. **Gather** API keys from providers (15 minutes)
3. **Deploy** to Vercel (10 minutes)
4. **Test** on live URL (5 minutes)
5. **Celebrate** - You're live! 🚀

---

**Built with passion for marketing teams.** 

Unify your marketing channels. Automate your workflows. Optimize with AI.

**Let's grow together!**
