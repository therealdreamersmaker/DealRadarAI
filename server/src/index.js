require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const { analyzeMarket, scanMoreOpportunities } = require('./marketAnalysis');
const { generateChat } = require('./llmService');
const { runAutopilot, getState, getLeads, EXPORTS_DIR } = require('./autopilot');
const { hasRentcast } = require('./listingsService');
const { generateScripts, generateMemo } = require('./aiTools');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve built client
const PUBLIC_DIR = path.join(__dirname, '../public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// ── Health / diagnostics ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const key = process.env.GEMINI_API_KEY || '';
  const rKey = process.env.RENTCAST_API_KEY || '';
  res.json({
    status: 'ok',
    provider: process.env.LLM_PROVIDER || 'auto',
    geminiKeySet: key.length > 0,
    geminiKeyLength: key.length,
    geminiKeyPreview: key.length > 8 ? `${key.slice(0, 8)}...${key.slice(-4)}` : '(not set)',
    rentcastEnabled: hasRentcast(),
    rentcastKeyPreview: rKey.length > 8 ? `${rKey.slice(0, 6)}...` : '(not set)',
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
  });
});

// ── Market Analysis ─────────────────────────────────────────────────────────

app.post('/api/analyze', async (req, res) => {
  const { location, language = 'en' } = req.body;
  if (!location) return res.status(400).json({ error: 'Location is required' });

  try {
    const data = await analyzeMarket(location, language);
    res.json(data);
  } catch (err) {
    console.error('[/api/analyze]', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

app.post('/api/scan-more', async (req, res) => {
  const { location, existingAddresses = [], language = 'en' } = req.body;
  if (!location) return res.status(400).json({ error: 'Location is required' });

  try {
    const opportunities = await scanMoreOpportunities(location, existingAddresses, language);
    res.json(opportunities);
  } catch (err) {
    console.error('[/api/scan-more]', err);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

// ── Copilot Chat ─────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { message, history = [], context = '', language = 'en' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const reply = await generateChat(context, history, message, language);
    res.json({ reply });
  } catch (err) {
    console.error('[/api/chat]', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

// ── AI Tools ─────────────────────────────────────────────────────────────────

app.post('/api/ai-tools/scripts', async (req, res) => {
  const { property, language = 'en' } = req.body;
  if (!property) return res.status(400).json({ error: 'Property data required' });
  try {
    const scripts = await generateScripts(property, language);
    res.json(scripts);
  } catch (err) {
    console.error('[/api/ai-tools/scripts]', err.message);
    res.status(500).json({ error: err.message || 'Script generation failed' });
  }
});

app.post('/api/ai-tools/memo', async (req, res) => {
  const { property, language = 'en' } = req.body;
  if (!property) return res.status(400).json({ error: 'Property data required' });
  try {
    const memo = await generateMemo(property, language);
    res.json(memo);
  } catch (err) {
    console.error('[/api/ai-tools/memo]', err.message);
    res.status(500).json({ error: err.message || 'Memo generation failed' });
  }
});

// Walk Score proxy — requires WALKSCORE_API_KEY env var (free at walkscore.com/professional/api.php)
app.get('/api/walkscore', async (req, res) => {
  const key = process.env.WALKSCORE_API_KEY;
  if (!key) return res.json({ available: false, reason: 'WALKSCORE_API_KEY not set' });
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address query param required' });
  try {
    const response = await axios.get('https://api.walkscore.com/score', {
      params: { format: 'json', address, wsapikey: key, transit: 1, bike: 1 },
      timeout: 6000,
    });
    const d = response.data;
    res.json({
      available:        true,
      walkScore:        d.walkscore,
      walkDescription:  d.description,
      transitScore:     d.transit?.score    ?? null,
      transitDesc:      d.transit?.description ?? null,
      bikeScore:        d.bike?.score       ?? null,
      bikeDesc:         d.bike?.description ?? null,
    });
  } catch (err) {
    console.error('[/api/walkscore]', err.message);
    res.json({ available: false, error: err.message });
  }
});

// ── Autopilot ────────────────────────────────────────────────────────────────

app.get('/api/autopilot/state', (req, res) => {
  // Return state without the full leads array (fetched separately)
  const { leads, ...stateWithoutLeads } = getState();
  res.json(stateWithoutLeads);
});

app.get('/api/autopilot/leads', (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page  || '1'));
  const pageSize = Math.min(100, parseInt(req.query.size || '25'));
  const search   = (req.query.search || '').toLowerCase();
  const filter   = (req.query.filter || '').toLowerCase(); // distress type filter

  let leads = getLeads();

  if (search) {
    leads = leads.filter(l =>
      l.fullAddress.toLowerCase().includes(search) ||
      `${l.ownerFirstName} ${l.ownerLastName}`.toLowerCase().includes(search) ||
      l.distressType.toLowerCase().includes(search)
    );
  }
  if (filter && filter !== 'all') {
    leads = leads.filter(l => l.distressType.toLowerCase().includes(filter));
  }

  const total = leads.length;
  const pages = Math.ceil(total / pageSize);
  const data  = leads.slice((page - 1) * pageSize, page * pageSize);

  res.json({ data, total, page, pages, pageSize });
});

app.post('/api/autopilot/run', async (req, res) => {
  const state = getState();
  if (state.isRunning) {
    return res.status(409).json({ error: 'Autopilot is already running' });
  }
  const { niches = [], markets = [] } = req.body || {};
  runAutopilot({ niches, markets }).catch(console.error);
  res.json({ message: 'Autopilot started', startedAt: new Date().toISOString() });
});

app.get('/api/autopilot/download/:filename', (req, res) => {
  const { filename } = req.params;
  const safe = path.basename(filename);
  const filepath = path.join(EXPORTS_DIR, safe);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filepath, safe);
});

// Daily cron at 6:00 AM
cron.schedule('0 6 * * *', () => {
  console.log('[CRON] Daily Autopilot Deal Hunter triggered at', new Date().toISOString());
  const state = getState();
  state.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  runAutopilot().catch(console.error);
});

// Set initial nextRun
const autopilotState = getState();
const now = new Date();
const nextRun = new Date(now);
nextRun.setDate(nextRun.getDate() + 1);
nextRun.setHours(6, 0, 0, 0);
autopilotState.nextRun = nextRun.toISOString();

// SPA fallback
if (fs.existsSync(PUBLIC_DIR)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[SERVER] DealRadar AI running on port ${PORT}`);
});
