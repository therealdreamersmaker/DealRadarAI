const { generateText } = require('./llmService');
const { getOpportunities, hasRentcast } = require('./listingsService');

function buildMarketPrompt(location, language) {
  const langInstruction = language === 'es'
    ? 'Return all string values in Spanish except property addresses, URLs, and numeric data.'
    : 'Return all string values in English.';

  return `You are a senior real estate market intelligence analyst with deep expertise in US wholesale real estate. Analyze the market for: "${location}".

${langInstruction}

Return ONLY a single valid JSON object — no markdown, no code fences, no commentary — just raw JSON.

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

  return `You are a real estate distressed property specialist. Find 4 MORE off-market distressed property lead types in "${location}".

${langInstruction}
${avoidList}

IMPORTANT: These are off-market leads — do NOT invent specific street addresses. Return lead type records only.

Return ONLY a raw JSON array of exactly 4 objects — no markdown, no code fences:
[
  {
    "type": "string (Pre-Foreclosure | Probate | Tax Delinquency | Absentee Owner)",
    "address": null,
    "arv": null,
    "targetOffer": null,
    "listPrice": null,
    "daysOnMarket": null,
    "bedBath": null,
    "sqft": null,
    "isListed": false,
    "mlsNumber": null,
    "dataSource": "ai-target",
    "zillowUrl": null,
    "redfinUrl": null,
    "note": "string — brief guidance on how to find and approach this distress category in ${location}"
  }
]

Rules: Vary the types. Return ONLY the JSON array.`;
}

async function analyzeMarket(location, language = 'en') {
  // Run AI market analysis and real MLS listings fetch in parallel
  const [aiResult, listingsResult] = await Promise.all([
    (async () => {
      const prompt  = buildMarketPrompt(location, language);
      const raw     = await generateText(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const start   = cleaned.indexOf('{');
      const end     = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON object found in LLM response');
      return JSON.parse(cleaned.slice(start, end + 1));
    })(),
    getOpportunities(location).catch(err => {
      console.error('[marketAnalysis] listingsService error:', err.message);
      return { listed: [], offMarket: [] };
    }),
  ]);

  // Merge: AI provides market intelligence (verdict, metrics, trends, macroComparison, dealTiers)
  //        RentCast provides 100% real MLS listed properties
  //        listingsService provides clearly-labelled off-market lead types (no fake addresses)
  const allOpportunities = [
    ...listingsResult.listed,    // Real MLS data (isListed: true, dataSource: 'live', real addresses)
    ...listingsResult.offMarket, // AI lead type stubs (isListed: false, dataSource: 'ai-target', address: null)
  ];

  return {
    ...aiResult,
    opportunities: allOpportunities,
    _hasRentcast: hasRentcast(),
  };
}

async function scanMoreOpportunities(location, existingAddresses = [], language = 'en') {
  // Scan More fetches additional off-market lead types (clearly labelled, no fake addresses)
  const prompt  = buildScanMorePrompt(location, existingAddresses, language);
  const raw     = await generateText(prompt);
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start   = cleaned.indexOf('[');
  const end     = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in LLM response');
  const results = JSON.parse(cleaned.slice(start, end + 1));
  // Ensure all fields are correctly set (AI may hallucinate addresses despite instructions)
  return results.map(r => ({
    ...r,
    address:    null,
    isListed:   false,
    dataSource: 'ai-target',
    zillowUrl:  null,
    redfinUrl:  null,
  }));
}

module.exports = { analyzeMarket, scanMoreOpportunities };
