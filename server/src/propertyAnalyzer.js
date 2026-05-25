/**
 * propertyAnalyzer.js
 *
 * Accepts a Zillow/Redfin URL or a plain US address and returns
 * a full AI-powered wholesale deal analysis via Gemini.
 */

const { generateText } = require('./llmService');

// ── URL → address parser ──────────────────────────────────────────────────────

function parseAddressFromUrl(url) {
  try {
    // Zillow: zillow.com/homedetails/123-Main-St-City-State-ZIP/zpid_rb/
    const zMatch = url.match(/zillow\.com\/homedetails\/([^/?#]+)/i);
    if (zMatch) {
      let slug = zMatch[1];
      // Remove trailing zpid segment: -12345678_zpid
      slug = slug.replace(/-?\d+_zpid.*$/, '');
      // Replace dashes with spaces and title-case
      return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    }

    // Redfin patterns:
    // redfin.com/GA/Atlanta/123-Main-St-30301/home/123
    // redfin.com/GA/Atlanta/123-Main-St/unit-2/home/123
    const rfMatch = url.match(/redfin\.com\/([A-Z]{2})\/([^/]+)\/([^/]+)\/(?:unit-[^/]+\/)?home/i);
    if (rfMatch) {
      const state   = rfMatch[1].toUpperCase();
      const city    = rfMatch[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const street  = rfMatch[3].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${street}, ${city}, ${state}`;
    }

    // Realtor.com: realtor.com/realestateandhomes-detail/123-Main-St_City_State_ZIP_ID
    const rlMatch = url.match(/realtor\.com\/realestateandhomes-detail\/([^?#/]+)/i);
    if (rlMatch) {
      const parts = rlMatch[1].split('_');
      const street = parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return parts.length >= 3 ? `${street}, ${parts[1]}, ${parts[2]}` : street;
    }
  } catch (_) {}
  return null;
}

function detectPlatform(input) {
  if (/zillow\.com/i.test(input))   return 'Zillow';
  if (/redfin\.com/i.test(input))   return 'Redfin';
  if (/realtor\.com/i.test(input))  return 'Realtor.com';
  return null;
}

// ── Gemini prompt ─────────────────────────────────────────────────────────────

function buildPrompt(address, platform) {
  return `You are a seasoned real estate wholesaler and market analyst with deep knowledge of US housing markets.

Analyze this property for wholesale investment potential:
Address: ${address}
${platform ? `Listed on: ${platform}` : ''}

Use your knowledge of this specific location's real estate market, typical home values, neighborhood grades, and investment metrics to provide a realistic analysis. Do NOT make up fictional addresses for comps — use plausible real street names for that city.

Return ONLY a valid JSON object matching this exact schema (no markdown, no code fences):

{
  "address": "${address}",
  "city": "string",
  "state": "string (2-letter)",
  "zip": "string",
  "propertyType": "Single Family",
  "beds": number,
  "baths": number,
  "sqft": number,
  "yearBuilt": number,
  "neighborhood": "A" | "B" | "C" | "D",
  "marketTrend": "Appreciating" | "Stable" | "Declining",
  "estimatedValue": number,
  "arv": number,
  "targetOffer": number,
  "equitySpread": number,
  "dealScore": number,
  "dealScoreLabel": "HOT DEAL" | "STRONG" | "SOLID" | "AVERAGE" | "PASS",
  "verdict": "GO" | "WATCHLIST" | "PASS",
  "distressType": "string",
  "estimatedDom": number,
  "repairEstimate": {
    "light": number,
    "lightDesc": "string (what light rehab includes)",
    "medium": number,
    "mediumDesc": "string",
    "heavy": number,
    "heavyDesc": "string"
  },
  "comps": [
    {
      "address": "string (real-sounding nearby street)",
      "soldPrice": number,
      "soldDate": "string (e.g. Mar 2025)",
      "sqft": number,
      "beds": number,
      "baths": number,
      "pricePerSqft": number,
      "condition": "Updated" | "Average" | "Needs Work",
      "distanceDesc": "string (e.g. 0.3 mi away)"
    }
  ],
  "exitStrategies": [
    {
      "strategy": "Wholesale",
      "projectedProfit": number,
      "timeline": "string",
      "difficulty": "Low" | "Medium" | "High",
      "notes": "string"
    },
    {
      "strategy": "Fix & Flip",
      "projectedProfit": number,
      "timeline": "string",
      "difficulty": "Low" | "Medium" | "High",
      "rehabBudget": number,
      "notes": "string"
    },
    {
      "strategy": "Buy & Hold",
      "projectedMonthlyRent": number,
      "capRate": number,
      "monthlyCashFlow": number,
      "notes": "string"
    }
  ],
  "insights": ["string", "string", "string", "string"],
  "redFlags": ["string", "string"],
  "negotiationTips": ["string", "string", "string"],
  "marketContext": "string (2-3 sentences about the local market)",
  "pricePerSqft": number,
  "ppsftComparison": {
    "subject": number,
    "zipAvg": number,
    "cityAvg": number,
    "stateAvg": number,
    "zipLabel": "string (e.g. '30301')",
    "cityLabel": "string",
    "stateLabel": "string"
  },
  "recommendation": "string (2-3 sentence actionable summary for a wholesaler)"
}

Rules:
- estimatedValue = current as-is value; arv = after full renovation; targetOffer = arv × 0.70
- equitySpread = round((arv - estimatedValue) / arv * 100)
- dealScore 1–10: base on equity, distress type, DOM potential, neighborhood, market trend
- Provide exactly 3–4 comps that actually sold in the last 6 months nearby
- All dollar amounts are USD integers
- Be specific and realistic for the actual city/neighborhood`;
}

// ── Public API ────────────────────────────────────────────────────────────────

async function analyzeProperty(input, language = 'en') {
  const trimmed = input.trim();
  const platform = detectPlatform(trimmed);

  // If URL, try to extract address; otherwise treat as address directly
  let address = trimmed;
  let sourceUrl = null;

  if (platform) {
    sourceUrl = trimmed;
    const parsed = parseAddressFromUrl(trimmed);
    if (parsed) {
      address = parsed;
      console.log(`[Analyzer] Extracted address from ${platform} URL: ${address}`);
    } else {
      // Can't parse — analyse the raw URL slug anyway, Gemini may handle it
      console.log(`[Analyzer] Could not parse URL — sending raw input to Gemini`);
    }
  }

  console.log(`[Analyzer] Analyzing: ${address}`);
  const raw = await generateText(buildPrompt(address, platform));

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');

  const data = JSON.parse(jsonMatch[0]);

  return {
    ...data,
    inputAddress: address,
    sourceUrl,
    platform,
    dataSource: 'ai-analysis',
  };
}

module.exports = { analyzeProperty };
