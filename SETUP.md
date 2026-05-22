# DealRadar AI — Setup Guide

## Prerequisites
- Node.js 18+
- Google Gemini API key (for live web search grounding)
- GoHighLevel API key + Location ID (optional, for CRM injection)

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your API keys
```

### 3. Development (two terminals)
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open http://localhost:5173

### 4. Production Build
```bash
cd client && npm run build   # builds into server/public/
cd ../server && npm start    # serves everything on port 3001
```

Open http://localhost:3001

## Required API Keys

| Key | Purpose | Get it |
|-----|---------|--------|
| `GEMINI_API_KEY` | Live web search + AI analysis | Google AI Studio |
| `GHL_API_KEY` | GoHighLevel CRM injection | GHL Settings > API |
| `GHL_LOCATION_ID` | Your GHL sub-account ID | GHL Settings |
| `BATCHDATA_API_KEY` | Property data (optional) | batchdata.io |

## Features
- 🔍 **Live Market Analysis** — AI scans real estate data with Google Search grounding
- 🏠 **Real Distressed Properties** — Actual addresses from live web search
- 📊 **Deal Tier Calculator** — Three wholesale offer tiers with profit projections
- 📈 **6-Month Trend Charts** — Price and days-on-market trends
- 🤖 **AI Copilot** — Context-aware chat with full dashboard knowledge
- ⚡ **Autopilot Deal Hunter** — Daily cron job → skip-trace → GoHighLevel CRM
- 🌐 **EN/ES Language Toggle** — Full bilingual support
- 🖨 **Print to PDF** — Clean print layout
