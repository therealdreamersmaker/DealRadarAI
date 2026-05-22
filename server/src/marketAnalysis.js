const { generateText } = require('./llmService');

function buildMarketPrompt(location, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses, URLs, and numeric data.'
    : 'Return all string values in English.';

  return `You are a senior real estate market intelligence analyst with deep expertise in US wholesale real estate. Analyze the market for: "${location}".

${langInstruction}

Return ONLY a single valid JSON object — no markdown, no code fences, no commentary — just raw JSON.

IMPORTANT for opportunities:
- Generate BOTH listed (on MLS/Zillow/Redfin) AND non-listed (off-market) properties.
- "isListed": true means it is currently active on MLS and searchable on Zillow/Redfin.
- "isListed": false means it is off-market (pre-foreclosure, probate, tax delinquency, absentee owner, etc.).
- For listed properties, set "mlsNumber" to a realistic MLS number (e.g. "MLS# 7312045").
- For non-listed, set "mlsNumber" to null.
- Use realistic addresses that actually exist in this location.
- Generate at least 3 listed and at least 2 non-listed properties (7 total).

Schema:
{
  "city": "string",
  "state": "string (2-letter abbreviation)",
  "verdict": "STRONG BUY" | "WATCHLIST" | "AVOID",
  "rationale": "string — 2-3 sentences explaining the verdict",
  "wholesalingPlan": "string — concrete 3-step action plan",
  "metrics": {
    "medianSalePrice": number,
    "medianDaysOnMarket": number,
    "saleToListRatio": number,
    "inventoryDirection": "Rising" | "Falling" | "Stable"
  },
  "dealTiers": [
    { "tier": "Tier 1 – Aggressive",        "targetOffer": number, "lowAnchor": number, "maxCap": number, "expectedProfit": number },
    { "tier": "Tier 2 – Moderate",           "targetOffer": number, "lowAnchor": number, "maxCap": number, "expectedProfit": number },
    { "tier": "Tier 3 – Highest Acceptable", "targetOffer": number, "lowAnchor": number, "maxCap": number, "expectedProfit": number }
  ],
  "opportunities": [
    {
      "type": "string (Price Drop | Fixer-Upper | Pre-Foreclosure | Probate | Tax Delinquency | Absentee Owner | High Equity)",
      "address": "string — realistic full street address",
      "arv": number,
      "targetOffer": number,
      "listPrice": number,
      "daysOnMarket": number,
      "bedBath": "string e.g. 3bd/2ba",
      "sqft": number,
      "isListed": boolean,
      "mlsNumber": "string or null"
    }
  ],
  "trends": [
    { "month": "string", "medianPrice": number, "daysOnMarket": number }
  ],
  "macroComparison": {
    "national": {
      "label": "National",
      "medianSalePrice": number,
      "medianDaysOnMarket": number,
      "saleToListRatio": number,
      "yoyPriceChange": number
    },
    "state": {
      "label": "string (state name)",
      "medianSalePrice": number,
      "medianDaysOnMarket": number,
      "saleToListRatio": number,
      "yoyPriceChange": number
    },
    "city": {
      "label": "string (city name)",
      "medianSalePrice": number,
      "medianDaysOnMarket": number,
      "saleToListRatio": number,
      "yoyPriceChange": number
    },
    "zip": {
      "label": "string (zip code or sub-market name)",
      "medianSalePrice": number,
      "medianDaysOnMarket": number,
      "saleToListRatio": number,
      "yoyPriceChange": number
    }
  }
}

Rules:
- opportunities: 7 total — at least 3 with isListed:true, at least 2 with isListed:false
- Listed types: "Price Drop", "Fixer-Upper", "High Equity" — these appear on MLS
- Non-listed types: "Pre-Foreclosure", "Probate", "Tax Delinquency", "Absentee Owner"
- targetOffer = 70% of arv, listPrice < arv
- trends: last 6 months chronological
- dealTiers: T1 = 58% of medianSalePrice, T2 = 65%, T3 = 70%
- lowAnchor = targetOffer × 0.92, maxCap = targetOffer × 1.08
- macroComparison: use realistic current market knowledge for each geographic level
- yoyPriceChange: year-over-year % price change (can be negative)
- Return ONLY the raw JSON object.`;
}

function buildScanMorePrompt(location, existingAddresses, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses, URLs, and numeric data.'
    : 'Return all string values in English.';

  const avoidList = existingAddresses.length > 0
    ? `Do NOT repeat these addresses: ${existingAddresses.join('; ')}`
    : '';

  return `You are a real estate distressed property specialist. Find 4 MORE property opportunities in "${location}".

${langInstruction}
${avoidList}

Generate a mix of listed (isListed:true) and off-market (isListed:false) properties.

Return ONLY a raw JSON array of exactly 4 objects — no markdown, no code fences:
[
  {
    "type": "string (Price Drop | Fixer-Upper | Pre-Foreclosure | Probate | Tax Delinquency | Absentee Owner | High Equity)",
    "address": "string — realistic full street address in ${location}",
    "arv": number,
    "targetOffer": number,
    "listPrice": number,
    "daysOnMarket": number,
    "bedBath": "string",
    "sqft": number,
    "isListed": boolean,
    "mlsNumber": "string or null"
  }
]

Rules: targetOffer = 70% of arv. listPrice < arv. Mix listed and off-market. Return ONLY the JSON array.`;
}

async function analyzeMarket(location, language = 'en') {
  const prompt  = buildMarketPrompt(location, language);
  const raw     = await generateText(prompt);
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start   = cleaned.indexOf('{');
  const end     = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in LLM response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function scanMoreOpportunities(location, existingAddresses = [], language = 'en') {
  const prompt  = buildScanMorePrompt(location, existingAddresses, language);
  const raw     = await generateText(prompt);
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start   = cleaned.indexOf('[');
  const end     = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in LLM response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

module.exports = { analyzeMarket, scanMoreOpportunities };
