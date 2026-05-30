/**
 * propertyAnalyzer.js
 *
 * Accepts a Zillow/Redfin URL or a plain US address and returns
 * a full AI-powered wholesale deal analysis via Gemini.
 *
 * Implements the 5-Phase Elite Wholesaler Underwriting Protocol:
 *   Phase 1 — Buy-Box & Liquidity Filter
 *   Phase 2 — Hyper-Local Renovated Comps → True ARV
 *   Phase 3 — Condition-Based Three-Tier Matrix
 *   Phase 4 — MAO (Maximum Allowable Offer) Financial Engine
 *   Phase 5 — Deal-Killer Audit (Automated Disqualification)
 */

const { generateText } = require('./llmService');

// ── URL → address parser ──────────────────────────────────────────────────────

function parseAddressFromUrl(url) {
  try {
    const zMatch = url.match(/zillow\.com\/homedetails\/([^/?#]+)/i);
    if (zMatch) {
      let slug = zMatch[1];
      slug = slug.replace(/-?\d+_zpid.*$/, '');
      return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    }

    const rfMatch = url.match(/redfin\.com\/([A-Z]{2})\/([^/]+)\/([^/]+)\/(?:unit-[^/]+\/)?home/i);
    if (rfMatch) {
      const state  = rfMatch[1].toUpperCase();
      const city   = rfMatch[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const street = rfMatch[3].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${street}, ${city}, ${state}`;
    }

    const rlMatch = url.match(/realtor\.com\/realestateandhomes-detail\/([^?#/]+)/i);
    if (rlMatch) {
      const parts  = rlMatch[1].split('_');
      const street = parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return parts.length >= 3 ? `${street}, ${parts[1]}, ${parts[2]}` : street;
    }
  } catch (_) {}
  return null;
}

function detectPlatform(input) {
  if (/zillow\.com/i.test(input))  return 'Zillow';
  if (/redfin\.com/i.test(input))  return 'Redfin';
  if (/realtor\.com/i.test(input)) return 'Realtor.com';
  return null;
}

// ── 5-Phase Underwriting Prompt ───────────────────────────────────────────────

function buildPrompt(address, platform) {
  return `You are an elite real estate wholesaling AI executing a strict 5-Phase Deal Underwriting Protocol used by top US flippers and wholesalers. Every calculation must be exact and conservative.

Analyze this property:
Address: ${address}
${platform ? `Listed on: ${platform}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — BUY-BOX & LIQUIDITY FILTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimate the Months of Supply (MoS) for this specific zip code based on current market conditions.
Classify marketLiquidity:
  "Liquid"            → MoS between 2 and 4 months (ideal for wholesaling)
  "Hyper-Competitive" → MoS below 1.5 months (too competitive for deep discounts)
  "Stagnant"          → MoS above 5 months (hard to exit a flip)

Check buy-box criteria — fail any that do not qualify:
  • Property type must be SFR or townhome (NO condos, NO multi-family)
  • Size must be between 1,000 and 2,500 sqft
  • Year built must be AFTER 1950 (pre-1950 = unknown plumbing/electrical = cash buyer risk)
Record any failures in buyBoxIssues[]. Set buyBoxPass = false if ANY criterion fails.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — TRUE ARV FROM RENOVATED COMPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pull 3–4 comp sales using this EXACT standard:
  • Geographic: within 0.5-mile radius maximum
  • DO NOT cross highways, rivers, or railroad tracks (these change school districts and values)
  • Time: closed sales within the last 180 days ONLY
  • Physical match: ±15% sqft variance, ±10 years age, same bedroom/bathroom count
  • CONDITION CRITICAL: Use ONLY fully renovated/remodeled comps
    (look for: "fully remodeled" "turn-key" "designer finishes" "renovated" "updated" "move-in ready")
    This is non-negotiable — you are establishing the POST-REPAIR value of the subject property.

ARV Calculation (mandatory formula):
  compsAvgPpsft = average $/sqft of the top 3 renovated comps
  arv = compsAvgPpsft × subject property sqft

Mark each comp with "usedForArv": true only if it was renovated and used in the ARV calculation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — CONDITION TIER (ALWAYS CONSERVATIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classify into ONE tier. When borderline, ALWAYS choose the more expensive tier.

  Tier 1 — Cosmetic Clean (conditionRating 7–9):
    What it means: clean, functional, but outdated. Needs paint, carpet, light landscaping only.
    repairDiscount = 0.30
    repairCostTotal = arv × 0.30

  Tier 2 — Average Fixer (conditionRating 4–6):  ← CORE WHOLESALE TARGET
    What it means: needs full kitchen update, bathroom update, all new flooring, PLUS one major
    mechanical (HVAC, roof, electrical panel, or plumbing).
    repairDiscount = 0.40
    repairCostTotal = arv × 0.40

  Tier 3 — Total Gut Job (conditionRating 1–3):
    What it means: structural damage, foundation issues, mold, fire damage, or fully abandoned.
    Requires complete teardown to the studs.
    repairDiscount = 0.50
    repairCostTotal = arv × 0.50

repairCostPerSqft = repairCostTotal / sqft

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — MAO FINANCIAL ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Select marketModifier based on this market:
  0.70 → stable/slower markets (default 70% Rule — 30% safety cushion)
  0.75 → active/liquid metropolitan markets
  0.80 → hot/high-priced markets with fast absorption

wholesaleFee = $10,000–$20,000 (scale with deal size; larger ARV = larger fee)

MAO Formula (execute in this exact sequence):
  Step 1: step1_arvTimesModifier  = arv × marketModifier
  Step 2: step2_minusRepairs      = step1_arvTimesModifier − repairCostTotal
  Step 3: step3_minusWholesaleFee = step2_minusRepairs − wholesaleFee
  MAO                             = step3_minusWholesaleFee
  targetOffer                     = MAO

Golden Safety Check (compare estimatedValue to MAO):
  estimatedValue ≤ MAO                  → dealStatus = "GOLDEN DEAL"
  estimatedValue ≤ MAO × 1.05           → dealStatus = "DEAL SPREAD ACCEPTED"
  estimatedValue > MAO                  → dealStatus = "UNPROFITABLE - OVERPRICED"
  Any hard disqualifier from Phase 5    → dealStatus = "DISQUALIFIED"  (overrides above)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — DEAL-KILLER AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cross-reference location, public records context for these disqualifiers:

  Check 5.1 — Backyard Defect:
    Does the property back up to: high-voltage power lines, interstate highway, railroad track,
    or commercial strip mall? These kill retail resale value.
    → impact: "Penalize ARV 15%" (adjust ARV down and recalculate MAO)
    → backyardDefects = true

  Check 5.2 — Equity Lockup:
    Estimate the owner's likely remaining mortgage balance.
    If estimatedMortgageBalance > MAO → owner cannot pay off their bank with your offer.
    → equityLockupRisk = "Short Sale Only" or "High" or "Medium" or "Low"
    → impact: "Short Sale Only" (if balance > MAO)

  Check 5.3 — HOA / Zoning Risk:
    Does the neighborhood have an HOA with rental bans or long approval timelines?
    Buy-and-hold investors will avoid it.
    → hoaRisk = "None" | "Low" | "High"
    → impact: "Flag High Risk" (if hoaRisk = "High")

Add each finding to dealKillers[]. Override dealStatus to "DISQUALIFIED" ONLY for hard killers
(equity lockup blocking sale, severe structural failure).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Trust numbers, not seller claims. Base everything on closed comp data.
2. Underwrite conservatively — always default to the more expensive condition tier.
3. Return ONLY raw JSON — absolutely no markdown, no code fences, no commentary.

Return this EXACT JSON schema:

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

  "monthsOfSupply": number,
  "marketLiquidity": "Liquid" | "Stagnant" | "Hyper-Competitive",
  "buyBoxPass": true | false,
  "buyBoxIssues": ["string"],

  "estimatedValue": number,
  "arv": number,
  "compsAvgPpsft": number,
  "arvMethod": "Avg $/sqft of top 3 renovated comps × subject sqft",

  "conditionTier": 1 | 2 | 3,
  "conditionRating": number,
  "conditionLabel": "Cosmetic Clean" | "Average Fixer" | "Total Gut Job",
  "repairDiscount": 0.30 | 0.40 | 0.50,
  "repairCostTotal": number,
  "repairCostPerSqft": number,

  "marketModifier": 0.70 | 0.75 | 0.80,
  "wholesaleFee": number,
  "mao": number,
  "maoBreakdown": {
    "step1_arvTimesModifier": number,
    "step2_minusRepairs": number,
    "step3_minusWholesaleFee": number,
    "result_mao": number
  },
  "targetOffer": number,
  "equitySpread": number,
  "dealScore": number,
  "dealScoreLabel": "HOT DEAL" | "STRONG" | "SOLID" | "AVERAGE" | "PASS",
  "dealStatus": "GOLDEN DEAL" | "DEAL SPREAD ACCEPTED" | "UNPROFITABLE - OVERPRICED" | "DISQUALIFIED",
  "verdict": "GO" | "WATCHLIST" | "PASS",

  "distressType": "string",
  "estimatedDom": number,

  "dealKillers": [
    {
      "type": "Backyard Defect" | "Equity Lockup" | "HOA Risk" | "Buy-Box Fail",
      "description": "string — specific detail about what was found",
      "impact": "Disqualify" | "Penalize ARV 15%" | "Short Sale Only" | "Flag High Risk"
    }
  ],
  "estimatedMortgageBalance": number,
  "equityLockupRisk": "Low" | "Medium" | "High" | "Short Sale Only",
  "backyardDefects": false,
  "hoaRisk": "None" | "Low" | "High",

  "repairEstimate": {
    "light": number,
    "lightDesc": "string — what cosmetic work includes for this specific property",
    "medium": number,
    "mediumDesc": "string — what the average fixer scope includes",
    "heavy": number,
    "heavyDesc": "string — what a gut rehab would entail"
  },
  "comps": [
    {
      "address": "string — realistic nearby street address",
      "soldPrice": number,
      "soldDate": "string (e.g. Mar 2025)",
      "sqft": number,
      "beds": number,
      "baths": number,
      "pricePerSqft": number,
      "condition": "Renovated" | "Average" | "Needs Work",
      "usedForArv": true | false,
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
  "marketContext": "string (2–3 sentences about the local market)",
  "pricePerSqft": number,
  "ppsftComparison": {
    "subject": number,
    "zipAvg": number,
    "cityAvg": number,
    "stateAvg": number,
    "zipLabel": "string",
    "cityLabel": "string",
    "stateLabel": "string"
  },
  "recommendation": "string — 2-3 sentence actionable wholesaler summary referencing the MAO and dealStatus"
}

Mandatory calculation checks (verify before outputting):
  arv            = compsAvgPpsft × sqft
  repairCostTotal = arv × repairDiscount
  mao            = (arv × marketModifier) − repairCostTotal − wholesaleFee
  targetOffer    = mao
  equitySpread   = round((arv − estimatedValue) / arv × 100)
  dealScore      = 9–10 for GOLDEN DEAL with strong equity | 5–7 for ACCEPTED | 1–4 for OVERPRICED/DISQUALIFIED
  All dollar amounts = USD integers. Be specific and realistic for the actual city/neighborhood.`;
}

// ── Public API ────────────────────────────────────────────────────────────────

async function analyzeProperty(input, language = 'en') {
  const trimmed  = input.trim();
  const platform = detectPlatform(trimmed);

  let address  = trimmed;
  let sourceUrl = null;

  if (platform) {
    sourceUrl = trimmed;
    const parsed = parseAddressFromUrl(trimmed);
    if (parsed) {
      address = parsed;
      console.log(`[Analyzer] Extracted address from ${platform} URL: ${address}`);
    } else {
      console.log(`[Analyzer] Could not parse URL — sending raw input to Gemini`);
    }
  }

  console.log(`[Analyzer] Running 5-Phase Protocol on: ${address}`);
  const raw = await generateText(buildPrompt(address, platform));

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');

  const data = JSON.parse(jsonMatch[0]);

  // Enforce targetOffer === mao (in case AI drifts)
  if (data.mao && !data.targetOffer) data.targetOffer = data.mao;

  return {
    ...data,
    inputAddress: address,
    sourceUrl,
    platform,
    dataSource: 'ai-analysis',
  };
}

module.exports = { analyzeProperty };
