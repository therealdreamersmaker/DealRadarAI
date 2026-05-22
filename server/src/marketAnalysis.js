const { generateText } = require('./llmService');

function buildMarketPrompt(location, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses and numeric data.'
    : 'Return all string values in English.';

  return `You are a senior real estate market intelligence analyst with deep expertise in US wholesale real estate. Analyze the market for: "${location}".

${langInstruction}

Using your comprehensive knowledge of US real estate markets, generate a detailed market analysis report. For the "opportunities" array, create realistic distressed property listings with REAL-STYLE street addresses that actually exist in this location (use your knowledge of actual street names, neighborhoods, and address formats for this specific city/area).

Return ONLY a single valid JSON object — no markdown, no code fences, no commentary — just raw JSON.

Schema:
{
  "city": "string",
  "state": "string (2-letter code)",
  "verdict": "STRONG BUY" | "WATCHLIST" | "AVOID",
  "rationale": "string — 2-3 sentences with specific data points explaining the verdict",
  "wholesalingPlan": "string — concrete 3-step action plan a wholesaler should execute in this market right now",
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
      "type": "string (Price Drop | Fixer-Upper | Pre-Foreclosure | Probate | Tax Delinquency)",
      "address": "string — realistic full street address in this location",
      "arv": number,
      "targetOffer": number,
      "listPrice": number,
      "daysOnMarket": number,
      "bedBath": "string e.g. 3bd/2ba"
    }
  ],
  "trends": [
    { "month": "string", "medianPrice": number, "daysOnMarket": number }
  ]
}

Rules:
- opportunities: exactly 4 entries, each with a realistic address for this specific location
- arv: realistic after-repair value based on neighborhood comps for this location
- targetOffer: exactly 70% of arv
- listPrice: must be below arv (distressed discount)
- trends: last 6 months in chronological order (e.g. Dec 2024 through May 2025)
- dealTiers: Tier 1 targetOffer = 58% of medianSalePrice, Tier 2 = 65%, Tier 3 = 70%
- lowAnchor = targetOffer × 0.92, maxCap = targetOffer × 1.08
- expectedProfit = arv (medianSalePrice) × 0.15 for T1, × 0.12 for T2, × 0.08 for T3
- Base all numbers on realistic knowledge of this specific market

Return ONLY the raw JSON object.`;
}

function buildScanMorePrompt(location, existingAddresses, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses and numeric data.'
    : 'Return all string values in English.';

  const avoidList = existingAddresses.length > 0
    ? `Do NOT repeat these addresses: ${existingAddresses.join('; ')}`
    : '';

  return `You are a real estate distressed property specialist. Find 4 MORE distressed property opportunities in "${location}".

${langInstruction}
${avoidList}

Using your knowledge of this market, generate 4 new distressed property listings (different types and neighborhoods than before). Use realistic address formats for this location.

Return ONLY a raw JSON array of exactly 4 objects — no markdown, no code fences:
[
  {
    "type": "string (Price Drop | Fixer-Upper | Pre-Foreclosure | Probate | Tax Delinquency)",
    "address": "string — realistic full street address in ${location}",
    "arv": number,
    "targetOffer": number,
    "listPrice": number,
    "daysOnMarket": number,
    "bedBath": "string"
  }
]

Rules: targetOffer = 70% of arv. listPrice < arv. Use different neighborhoods/property types than before. Return ONLY the JSON array.`;
}

async function analyzeMarket(location, language = 'en') {
  const prompt = buildMarketPrompt(location, language);
  const raw = await generateText(prompt);

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in LLM response');

  return JSON.parse(cleaned.slice(start, end + 1));
}

async function scanMoreOpportunities(location, existingAddresses = [], language = 'en') {
  const prompt = buildScanMorePrompt(location, existingAddresses, language);
  const raw = await generateText(prompt);

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in LLM response');

  return JSON.parse(cleaned.slice(start, end + 1));
}

module.exports = { analyzeMarket, scanMoreOpportunities };
