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
  "ppsftComparison": {
    "zipAvg":   number,
    "cityAvg":  number,
    "stateAvg": number,
    "national": number,
    "zipLabel":   "string",
    "cityLabel":  "string",
    "stateLabel": "string"
  },
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
    ? 'Return the "note" field in Spanish. Keep addresses, types, and numeric fields in English/numbers.'
    : 'Return all string values in English.';

  const avoidList = existingAddresses.length > 0
    ? `Do NOT repeat these addresses: ${existingAddresses.join('; ')}`
    : '';

  return `You are a real estate data specialist executing the 5-Phase Elite Wholesaler Underwriting Protocol with deep knowledge of US neighborhoods and distressed property markets.

Generate 6 realistic off-market DISTRESSED property profiles for "${location}" for MVP demonstration purposes.

CRITICAL — every property MUST be genuinely distressed:
- In POOR or FAIR physical condition: original fixtures, deferred maintenance, outdated systems, roof issues, HVAC issues, etc.
- NEVER renovated, updated, remodeled, move-in ready, or recently improved
- The "note" must describe BOTH the owner's financial distress AND the property's physical condition problems
  (e.g., "Owner 18 months behind on taxes; property has original 1971 plumbing, missing gutters, and a failing roof — deep discount expected")

PHASE 3 — CONDITION TIER CLASSIFICATION (for each property):
Classify into ONE tier. When borderline, ALWAYS choose the more expensive tier.
  Tier 1 — Cosmetic Clean (conditionRating 7-9): needs paint, carpet, light landscaping only — repairDiscount = 0.30
  Tier 2 — Average Fixer (conditionRating 4-6): full kitchen/bath update + one major mechanical (HVAC, roof, electrical, plumbing) — repairDiscount = 0.40
  Tier 3 — Total Gut Job (conditionRating 1-3): structural damage, mold, fire, or fully abandoned — repairDiscount = 0.50
repairCostTotal = arv x repairDiscount

PHASE 4 — MAO FINANCIAL ENGINE:
Select marketModifier:
  0.70 — stable/slower markets (default)
  0.75 — active/liquid metropolitan markets
  0.80 — hot/high-priced markets with fast absorption
wholesaleFee = $10,000–$15,000 (scale with deal size)
mao = (arv x marketModifier) - repairCostTotal - wholesaleFee
targetOffer = mao

dealStatus (compare listPrice to mao):
  "GOLDEN DEAL"               — listPrice <= mao
  "DEAL SPREAD ACCEPTED"      — listPrice <= mao x 1.05
  "UNPROFITABLE - OVERPRICED" — listPrice > mao x 1.05

${langInstruction}
${avoidList}

Use realistic local street names, zip codes, and price ranges for ${location}.

Return ONLY a raw JSON array of exactly 6 objects — no markdown, no code fences, no commentary:
[
  {
    "type": "Foreclosure | Tax Delinquency | Inherited House | Relocations | Property Issues | Fire Damage | Bank Owned | Too Many Liens | No/Low Equity",
    "address": "string — realistic street address in ${location} (e.g. '2847 Oak Ridge Dr, Atlanta, GA 30318')",
    "arv": number,
    "conditionTier": 1 or 2 or 3,
    "conditionLabel": "Cosmetic Clean" or "Average Fixer" or "Total Gut Job",
    "conditionRating": number (1-9 based on tier),
    "repairDiscount": 0.30 or 0.40 or 0.50,
    "repairCostTotal": number (arv x repairDiscount),
    "marketModifier": 0.70 or 0.75 or 0.80,
    "wholesaleFee": number (10000-15000),
    "mao": number ((arv x marketModifier) - repairCostTotal - wholesaleFee),
    "targetOffer": number (= mao),
    "dealStatus": "GOLDEN DEAL" or "DEAL SPREAD ACCEPTED" or "UNPROFITABLE - OVERPRICED",
    "listPrice": number (60-75% of ARV — distressed, below-market pricing),
    "daysOnMarket": null,
    "bedBath": "string e.g. '3bd/2ba'",
    "sqft": number,
    "yearBuilt": number,
    "isListed": false,
    "mlsNumber": null,
    "dataSource": "ai-estimate",
    "zillowUrl": null,
    "redfinUrl": null,
    "note": "2 sentences: specific owner distress situation + specific physical condition problems that make this a wholesale deal"
  }
]

Rules:
- Use all 9 distress types, vary them across the 6 entries
- ARV: realistic after-repair value for ${location} ($80k–$500k depending on market)
- mao = (arv x marketModifier) - repairCostTotal - wholesaleFee (exact formula)
- targetOffer = mao (always equal to MAO)
- sqft: 900–2400, yearBuilt: 1940–1995 (older stock — more likely to need work)
- Addresses must look real for ${location}
- Return ONLY the JSON array.`;
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
  // Normalise: ensure isListed=false and dataSource='ai-estimate' on all returned records
  return results.map(r => ({
    ...r,
    isListed:   false,
    dataSource: 'ai-estimate',
    mlsNumber:  null,
    zillowUrl:  null,
    redfinUrl:  null,
  }));
}

module.exports = { analyzeMarket, scanMoreOpportunities };
