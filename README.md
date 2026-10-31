# Sweet Smart Calendar

**Plan Smarter. Upload Earlier. Create for Global Demand.**

A global seasonal intelligence platform for Adobe Stock contributors. It answers the four
questions at the heart of contributor planning:

- **What should I create today?**
- **What should I upload right now?**
- **Which season should I prepare for next?**
- **Which global markets should I target?**

## Features

- **Dashboard** — date-driven hero with instant answers, ⭐ priority opportunities, action board
  (RESEARCH NOW / CREATE NOW / UPLOAD NOW / HIGH PRIORITY / LAST CHANCE), charts, top markets.
- **Intelligent recommendation engine** — per-event creation/submission windows, preparation stages,
  and a transparent priority score (timing 30%, market 25%, demand 20%, versatility 15%,
  confidence 10%). Scores are internal planning indicators, not sales predictions.
- **Smart calendar** — month / week / day / year views with filters (country, region, event type,
  priority, preparation status) and per-event preparation windows.
- **Global event database** — 101 researched events across 26 markets for 2026–2028, with
  country-specific dates. Lunar/religious dates are marked provisional and never presented as confirmed.
- **Market intelligence** — country explorer with shopping periods, design notes, sectors, and a
  side-by-side country comparison tool.
- **Asset production planner** — tasks with quantities, deadlines, progress bars; favorites,
  completed items and production lists persist in the browser (localStorage).
- **Event research pages** — full brief per event plus a **Generate Content Plan** button producing
  10–16 asset concepts, collection themes, keyword plans and upload checklists (with IP guardrails).
- **Research Sources & admin** — Adobe Stock contributor guidelines (official docs only), data
  validation, JSON/CSV export, and JSON import validation.
- **Dark / light mode**, responsive mobile-first design, SEO metadata, sitemap, robots.txt.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Recharts · date-fns · Lucide icons.
No database required for v1 — the dataset is a versioned JSON bundle built from researched sources.

## Getting started

```bash
npm install

# Rebuild the event database from definitions + researched dates
npm run build:data

npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Project structure

```
src/
  app/                 # Routes: dashboard, calendar, opportunities, markets,
                       # planner, events/[id], sources, contact
  components/          # Theme, header/footer, cards, calendar modal, charts,
                       # date selector, localStorage collections
  data/                # events.json, countries.json, asset-categories.json,
                       # contributor-facts.ts, meta.json (generated)
  lib/                 # date-engine, recommendation-engine, market-engine,
                       # content-plan generator, event-validator, store
  types/               # Domain types
scripts/
  event-defs.mjs       # Human-editable event definitions (the source of truth)
  fallback-dates.json  # Variable dates, marked provisional until researched
  build-events.mjs     # Expands definitions → src/data/events.json + meta.json
research/
  variable-dates.json      # Researched variable dates (overrides fallback)
  adobe-stock-facts.md     # Contributor facts from official Adobe docs
  2028-key-events-verified.md
```

## Updating the data

1. Edit `scripts/event-defs.mjs` (or drop new researched dates into
   `research/variable-dates.json`).
2. Run `npm run build:data` — validates ids, dates, country codes and scales.
3. Run `npm run build` to verify, then redeploy.

The **Research Sources** page (`/sources`) also offers JSON/CSV export and validates
JSON imports before staging.

## Deployment

### Vercel (recommended)

1. Push this repo to GitHub.
2. Import it in Vercel — defaults work (Next.js preset, `npm run build`).
3. Optional: set `NEXT_PUBLIC_SITE_URL` to your production URL (used for sitemap/OG tags).

### GitHub

```bash
git init
git add .
git commit -m "StockSeason Intelligence v1"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for sitemap.xml and Open Graph tags (defaults to the Vercel URL) |

## Disclaimer

Seasonal recommendations are research-based planning guidance. Adobe Stock download demand,
ranking and sales performance are not guaranteed. No private Adobe Stock sales data is used
or claimed.

## Contact

**Md Sonet Mia** — WhatsApp: [01797953059](https://wa.me/8801797953059)
