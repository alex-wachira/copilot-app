# 🚗 Co-Pilot — Driver Earnings App

> Real-time surge maps, AI shift planning, and automatic tax tracking for rideshare drivers.

---

## 🚀 Deploy to Vercel (10 minutes)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial Co-Pilot build"

# Create a new repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/copilot-app.git
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click **Add New → Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**

Live at `https://copilot-app-xyz.vercel.app` in ~2 minutes.

### Step 3 — Add environment variables

In Vercel → Settings → Environment Variables:

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | supabase.com → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | supabase.com → Settings → API |
| `VITE_PREDICTHQ_TOKEN` | predicthq.com (free tier) |
| `VITE_OPENWEATHER_KEY` | openweathermap.org (free tier) |

After adding → **Redeploy**.

### Step 4 — Set up Supabase

1. Create free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**, paste `supabase-schema.sql`, click **Run**

### Step 5 — Custom domain (optional)

Vercel → Settings → Domains → add your domain.
Free SSL included. Domains ~$10-15/yr at Namecheap or Porkbun.

---

## 🛠 Local development

```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev                  # http://localhost:5173
```

---

## 📁 Project structure

```
src/
├── screens/
│   ├── AuthScreen.jsx        # Login + signup
│   ├── HomeScreen.jsx        # Dashboard, goal tracker, AI nudge
│   ├── MapScreen.jsx         # Live surge map + events
│   ├── EarningsScreen.jsx    # Charts, breakdown, insights
│   ├── TaxesScreen.jsx       # Deductions, mileage log, PDF export
│   └── ProfileScreen.jsx     # Settings, upgrade CTA
├── components/
│   ├── UI.jsx                # Shared design components
│   ├── BottomNav.jsx         # Navigation bar
│   └── SurgeReportPrompt.jsx # In-car surge reporter (1-tap + voice)
└── lib/
    ├── supabase.js           # DB client
    ├── mockData.js           # Dev mock data
    ├── surgeDetection.js     # Passive fare analysis + crowdsource logging
    ├── predictiveModel.js    # PredictHQ + weather demand forecast
    └── useSurge.js           # React hook wiring everything together
```

---

## 🗄 Database tables

| Table | Purpose |
|---|---|
| `drivers` | Profiles, plan tier, city, weekly goal |
| `rides` | Ride logs with fare breakdown |
| `mileage_log` | Auto-tracked mileage + tax deduction |
| `expenses` | Fuel, maintenance, phone |
| `surge_reports` | Crowdsourced + passive surge data (20min TTL) |

---

## 🔑 API keys (all have free tiers)

| Service | Free tier | Purpose |
|---|---|---|
| [Supabase](https://supabase.com) | 500MB, 50k MAU | Auth + database |
| [OpenWeatherMap](https://openweathermap.org/api) | 1M calls/month | Weather signal |
| [PredictHQ](https://predicthq.com) | 100 calls/day | Event forecasting |

---

## 📱 Capacitor (App Store — later)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Co-Pilot" "com.copilot.app"
npm run build && npx cap sync
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

---

## 🗺 Roadmap

- [x] Auth + onboarding
- [x] Home dashboard + goal tracker
- [x] Live surge map (crowdsourced + passive detection)
- [x] Predictive demand model (weather + events)
- [x] Earnings charts + breakdown
- [x] Tax tracker + mileage log
- [x] In-car surge prompt (1-tap + voice)
- [ ] Push notifications (surge alerts)
- [ ] Mapbox real map tiles
- [ ] Stripe payments (Pro upgrade)
- [ ] Capacitor native app
