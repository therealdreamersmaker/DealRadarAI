const { generateWithSearch } = require('./llmService');

function buildMarketPrompt(location, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses and numeric data.'
    : 'Return all string values in English.';

  return `You are a real estate market intelligence AI. Use your live web search capability to research current real estate data for: "${location}".

${langInstruction}

Search the web for current (2024-2025) real estate market data for this location and return a SINGLE valid JSON object with NO markdown, no code fences, no extra text — only raw JSON.

The JSON must follow this exact schema:
{
  "city": "string",
  "state": "string",
  "verdict": "STRONG BUY" | "WATCHLIST" | "AVOID",
  "rationale": "string (2-3 sentences explaining the verdict based on real data)",
  "wholesalingPlan": "string (actionable 3-step wholesaling strategy for this market)",
  "metrics": {
    "medianSalePrice": number,
    "medianDaysOnMarket": number,
    "saleToListRatio": number,
    "inventoryDirection": "Rising" | "Falling" | "Stable"
  },
  "dealTiers": [
    {
      "tier": "Tier 1 – Aggressive",
      "targetOffer": number,
      "lowAnchor": number,
      "maxCap": number,
      "expectedProfit": number
    },
    {
      "tier": "Tier 2 – Moderate",
      "targetOffer": number,
      "lowAnchor": number,
      "maxCap": number,
      "expectedProfit": number
    },
    {
      "tier": "Tier 3 – Highest Acceptable",
      "targetOffer": number,
      "lowAnchor": number,
      "maxCap": number,
      "expectedProfit": number
    }
  ],
  "opportunities": [
    {
      "type": "string (e.g. Price Drop, Fixer-Upper, Pre-Foreclosure)",
      "address": "string (REAL full street address in this location — must be a real address you found via web search)",
      "arv": number,
      "targetOffer": number,
      "listPrice": number,
      "daysOnMarket": number,
      "bedBath": "string (e.g. 3bd/2ba)"
    }
  ],
  "trends": [
    { "month": "string", "medianPrice": number, "daysOnMarket": number }
  ]
}

Rules:
- opportunities array must have at least 3 entries with REAL addresses you found via web search
- arv must be based on the actual list price found (ARV ≈ list price adjusted for comps)
- targetOffer = 70% of arv
- trends must cover the last 6 months with real or estimated monthly data
- dealTiers must be calculated based on the real medianSalePrice
- Tier 1 targetOffer ≈ 60% of medianSalePrice, Tier 2 ≈ 65%, Tier 3 ≈ 70%
- Return ONLY the JSON object, nothing else`;
}

function buildScanMorePrompt(location, existingAddresses, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses and numeric data.'
    : 'Return all string values in English.';

  const avoidList = existingAddresses.join(', ');

  return `You are a real estate market intelligence AI. Use live web search to find 4 NEW distressed property listings in "${location}".

${langInstruction}

Do NOT use these already-found addresses: ${avoidList}

Search Zillow, Redfin, Realtor.com, or MLS listings for distressed properties (price drops, fixer-uppers, pre-foreclosure, high equity absentee owners) in ${location}.

Return ONLY a raw JSON array (no markdown, no code fences) of exactly 4 objects:
[
  {
    "type": "string",
    "address": "string (REAL full street address)",
    "arv": number,
    "targetOffer": number,
    "listPrice": number,
    "daysOnMarket": number,
    "bedBath": "string"
  }
]

Rules: arv ≈ listPrice adjusted for comps. targetOffer = 70% of arv. Use REAL addresses only.`;
}

async function analyzeMarket(location, language = 'en') {
  const prompt = buildMarketPrompt(location, language);
  const raw = await generateWithSearch(prompt);

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in LLM response');

  return JSON.parse(cleaned.slice(start, end + 1));
}

async function scanMoreOpportunities(location, existingAddresses = [], language = 'en') {
  const prompt = buildScanMorePrompt(location, existingAddresses, language);
  const raw = await generateWithSearch(prompt);

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in LLM response');

  return JSON.parse(cleaned.slice(start, end + 1));
}

module.exports = { analyzeMarket, scanMoreOpportunities };
