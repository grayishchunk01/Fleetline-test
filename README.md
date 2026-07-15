# Fleetline — Fleet Management Console

A complete, static fleet management web app: vehicles, drivers, trips, costing,
maintenance, CSV reports, and an automation/AI layer that flags maintenance,
licence, cost and utilisation risks — all running client-side, no backend
required. Built to host for free on **GitHub Pages**.

## What's inside

- **Dashboard** — fleet KPIs, cost trend, status breakdown, live trip ticker.
- **Vehicles** — CRUD, service-interval progress bars, cost/km.
- **Drivers** — CRUD, licence expiry tracking.
- **Trips** — schedule/dispatch/complete trips; live advisory warnings if you
  assign a vehicle in maintenance or a driver with an expiring/expired licence.
- **Costing** — expense log (fuel, maintenance, insurance, tolls, fines),
  cost-by-vehicle and cost-by-category charts.
- **Maintenance** — service history + predicted next-service windows.
- **AI Insights** — an automation engine that scans your live data for:
  overdue/upcoming maintenance, licence risk, cost-per-km outliers, fuel
  efficiency outliers, idle/underutilised vehicles, and a next-month spend
  forecast. Includes "Ask the fleet," a keyword-driven Q&A box that answers
  from your real data instantly, offline.
- **Reports** — one-click CSV export for vehicles, trips, expenses, and
  maintenance history.

All data is stored in the browser's `localStorage` — nothing leaves the
visitor's machine, and there's nothing to host or pay for besides the static
files themselves.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `fleetline`) and push these files to
   it — either the whole unzipped folder, or via the GitHub web UI's
   "Add file → Upload files."
   ```bash
   git init
   git add .
   git commit -m "Fleetline fleet management console"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
5. GitHub gives you a live URL after a minute or two, typically:
   `https://<your-username>.github.io/<your-repo>/`

No build step, no npm install, no server — `index.html` loads everything it
needs (fonts from Google Fonts, and a vendored copy of Chart.js already
included in `js/vendor/`, so charts work even without internet access to a
CDN).

## Project structure

```
index.html          entry point / app shell
css/style.css        design system + layout
js/store.js           localStorage data layer + seed data
js/ai-engine.js        rule-based automation/insights engine
js/app.js               router + all page views
js/vendor/chart.umd.js    vendored Chart.js (no external CDN dependency)
```

## Why the "AI" is rule-based, not a hosted LLM

This app ships as static files with no server. A real LLM call straight from
the browser would either expose an API key to every visitor or get blocked by
CORS — neither is safe for a public GitHub Pages site. So the automation
layer in `js/ai-engine.js` is a deterministic engine: it reads your live
vehicles/drivers/trips/expenses and applies maintenance-interval math, licence
date checks, cost-per-km statistics, and a linear spend forecast. It updates
instantly, works offline, and costs nothing to run.

### Wiring in a real LLM (optional)

If you want genuine generative summaries (e.g. "write me a paragraph
explaining this month's cost trend") on top of the existing engine:

1. Stand up a small serverless function (Cloudflare Worker, Vercel/Netlify
   function, or AWS Lambda) that holds your Anthropic API key server-side and
   forwards requests to `https://api.anthropic.com/v1/messages`.
2. Call that function's URL from `js/ai-engine.js` instead of (or alongside)
   the rule-based logic — the rest of the app doesn't need to change since
   `AIEngine.run()` and `AIEngine.ask()` are the only entry points the UI
   calls.
3. Never put an API key directly in this repo's client-side code — anything
   in a GitHub Pages site is public.

## Customizing

- **Currency / fleet name** — edit `settings` in `js/store.js`'s `seedData()`.
- **Colors / type** — CSS custom properties at the top of `css/style.css`.
- **Reset sample data** — click "Reset demo data" in the sidebar, or clear
  the `fleetline_v1` key in your browser's localStorage.
- **Service intervals, thresholds** — tweak the constants inside
  `js/ai-engine.js` (e.g. the 30-day licence warning window, the 1.3x cost
  outlier multiplier).

## Browser support

Any modern evergreen browser (Chrome, Edge, Firefox, Safari). Data is local
to each browser/device — it does not sync between devices unless you export
and re-import CSVs manually, since there's no backend database.
