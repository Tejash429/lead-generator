# LeadRadar — Local Business Lead Generator

Find local businesses that **don't have websites** or have **outdated/slow websites** so you can offer your web development services.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)

---

## Features

- 🔍 **Search businesses** by city + category (restaurants, gyms, dentists, etc.)
- 🌐 **Detect missing websites** — businesses with no website listed
- ⚡ **Detect slow/outdated websites** — measures load time, checks mobile-friendliness
- 💾 **Save leads** to a PostgreSQL database (Supabase)
- 📊 **Dashboard** with stats cards and filterable tables
- 📞 **Click-to-call** phone numbers for instant outreach
- 📥 **Export to CSV** for use in CRMs or spreadsheets
- 🏷️ **Lead status tracking** — New → Contacted → Responded → Converted

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS 4 + shadcn/ui |
| API | Google Places API (New) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma 6 |
| Validation | Zod 4 |
| Icons | Lucide React |

---

## Setup Instructions (Step by Step)

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A Google Cloud account
- A Supabase account (free tier works)

### Step 1 — Clone & Install

```bash
cd lead-generator
pnpm install
```

### Step 2 — Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Library**
4. Search for **"Places API (New)"** and **Enable** it
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy the API key

> 💡 Google gives you **$200/month free credit** — enough for ~6,000 text searches.

### Step 3 — Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once created, go to **Settings → Database**
3. Copy the **Connection string (URI)** — replace `[YOUR-PASSWORD]` with your DB password
4. Go to **Settings → API** and copy:
   - Project URL
   - Anon/public key

### Step 4 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
GOOGLE_PLACES_API_KEY=AIza...your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-key
DATABASE_URL="postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres"
```

### Step 5 — Set Up the Database

```bash
# Push the schema to Supabase
npx prisma db push

# Generate the Prisma client
npx prisma generate
```

### Step 6 — Run the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard.

---

## How to Use

1. **Enter a city** (e.g., "Austin, TX" or "Brooklyn, NY")
2. **Select a business category** (e.g., Restaurants, Plumbers, Dentists)
3. **Click "Find Leads"** — the app searches Google Places and analyzes each website
4. **Review results** — businesses are sorted with leads (no/bad website) at the top
5. **Select leads** and click **"Save Selected"** to store them in your database
6. **Manage leads** — update status as you contact businesses
7. **Export to CSV** — download your leads for use in email outreach or CRM

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Root → redirects to /dashboard
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Tailwind styles
│   ├── dashboard/
│   │   ├── page.tsx                # Main dashboard (Client Component)
│   │   └── loading.tsx             # Loading skeleton
│   └── api/
│       ├── search/route.ts         # POST — Google Places search + website analysis
│       ├── analyze/route.ts        # POST — Single website check
│       └── leads/
│           ├── route.ts            # GET/POST/PATCH/DELETE — CRUD for leads
│           └── export/route.ts     # GET — CSV export
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── search-form.tsx             # Search input form
│   ├── results-table.tsx           # Search results with lead detection
│   ├── saved-leads-table.tsx       # Saved leads with status management
│   └── stats-cards.tsx             # Dashboard statistics
├── lib/
│   ├── google-places.ts            # Google Places API wrapper
│   ├── website-analyzer.ts         # Website quality checker
│   ├── prisma.ts                   # Prisma client singleton
│   ├── validations.ts              # Zod schemas
│   └── utils.ts                    # cn() utility
└── types/
    └── index.ts                    # Shared TypeScript types
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | POST | Search businesses by city + category |
| `/api/analyze` | POST | Analyze a single website URL |
| `/api/leads` | GET | Fetch saved leads (with filters) |
| `/api/leads` | POST | Bulk save leads |
| `/api/leads` | PATCH | Update lead status/notes |
| `/api/leads` | DELETE | Delete a lead |
| `/api/leads/export` | GET | Export leads as CSV |

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# Settings → Environment Variables → Add all from .env.local
```

---

## Cost Breakdown

| Service | Free Tier | Cost After |
|---------|----------|------------|
| Google Places API | $200/month credit | ~$32/1000 searches |
| Supabase | 500MB DB, 50K rows | $25/month (Pro) |
| Vercel | 100GB bandwidth | $20/month (Pro) |

**For an MVP, everything runs free.**

---

## Future Improvements

- [ ] Email template generator for outreach
- [ ] Bulk website analysis via background jobs
- [ ] Google PageSpeed Insights integration
- [ ] Lead scoring algorithm
- [ ] Multi-user auth with Supabase Auth
- [ ] Automated email sequences
- [ ] Chrome extension for quick lookups
