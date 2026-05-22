require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const { analyzeMarket, scanMoreOpportunities } = require('./marketAnalysis');
const { generateChat } = require('./llmService');
const { runAutopilot, getState, EXPORTS_DIR } = require('./autopilot');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve built client
const PUBLIC_DIR = path.join(__dirname, '../public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

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

// ── Autopilot ────────────────────────────────────────────────────────────────

app.get('/api/autopilot/state', (req, res) => {
  res.json(getState());
});

app.post('/api/autopilot/run', async (req, res) => {
  const state = getState();
  if (state.isRunning) {
    return res.status(409).json({ error: 'Autopilot is already running' });
  }
  runAutopilot().catch(console.error);
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
