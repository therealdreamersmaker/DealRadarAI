/**
 * aiTools.js — Outreach Scripts, Deal Memos
 * Called by /api/ai-tools/scripts and /api/ai-tools/memo
 */
const { generateText } = require('./llmService');

function buildScriptsPrompt(property, language) {
  const langNote = language === 'es'
    ? 'Write ALL scripts in Spanish.'
    : 'Write all scripts in American English.';
  const addr = property.fullAddress || property.address || 'the subject property';
  const fmt  = n => n ? `$${Number(n).toLocaleString()}` : 'unknown';
  const type = property.distressType || property.type || 'Distressed Property';

  return `${langNote}
You are a top-performing real estate wholesaler who closes 10+ deals per month.
Generate 3 HIGHLY PERSONALIZED outreach scripts for this specific property and distress situation.

PROPERTY:
- Address: ${addr}
- Distress Category: ${type}
- ARV: ${fmt(property.arv)}
- Target Offer: ${fmt(property.targetOffer)}
- Property: ${property.beds || '?'}bd/${property.baths || '?'}ba, ${property.sqft ? Number(property.sqft).toLocaleString() + 'sqft' : ''}, built ${property.yearBuilt || 'unknown'}
- Situation notes: ${property.note || `${type} situation — motivated seller`}

Return ONLY a raw JSON object — no markdown, no code fences, no commentary:
{
  "coldCall": "A natural, conversational phone script (12-16 lines of actual dialogue). Open empathetically about their ${type} situation. Explain you are a local investor paying cash and can close in 2 weeks. DO NOT sound robotic. Include [YOUR NAME] placeholder.",
  "sms": "A direct, non-spammy SMS (max 155 chars). Reference the street address. Include [YOUR NAME]. No CAPS shouting.",
  "directMail": "Opening 2 paragraphs of a heartfelt handwritten-style letter to the homeowner. Reference their specific ${type} situation with empathy. Sign as 'A Local Real Estate Investor'. Feel human, not templated."
}`;
}

function buildMemoPrompt(property, language) {
  const langNote = language === 'es'
    ? 'Write the entire memo in Spanish.'
    : 'Write in English.';
  const addr   = property.fullAddress || property.address || 'Subject Property';
  const fmt    = n => n ? `$${Number(n).toLocaleString()}` : 'TBD';
  const profit = property.arv && property.targetOffer
    ? property.arv - property.targetOffer : null;

  return `${langNote}
You are a senior real estate investment analyst. Generate a professional investor deal memo.

DEAL DATA:
- Property: ${addr}
- Category: ${property.distressType || property.type || 'Distressed'}
- Beds/Baths/Sqft: ${property.beds || '?'}bd / ${property.baths || '?'}ba / ${property.sqft ? Number(property.sqft).toLocaleString() + ' sf' : '?'}
- Year Built: ${property.yearBuilt || 'unknown'}
- ARV: ${fmt(property.arv)}
- Offer Price: ${fmt(property.targetOffer)}
- Potential Profit: ${profit ? fmt(profit) : 'TBD'}
- Equity: ${property.equity ? property.equity + '%' : 'TBD'}
- Days on Market / Distressed: ${property.daysOnMarket || property.dom || '?'}
- Notes: ${property.note || 'Distressed property with motivated seller'}

Return ONLY a raw JSON object — no markdown, no code fences:
{
  "headline": "A punchy 1-line deal headline referencing the property type and profit potential",
  "summary": "3 sentences: what the deal is, why it is a deal, what the play is",
  "dealAnalysis": "Paragraph: ARV validation rationale, estimated repair range, net wholesale fee or flip profit, and why ${fmt(property.targetOffer)} is the right offer",
  "exitStrategies": "3 numbered exits: 1) Wholesale/Assign with expected fee; 2) Fix & Flip with rough profit after estimated rehab; 3) Buy & Hold/BRRRR with rough monthly cash flow estimate",
  "riskFactors": "3 concise bullet points: title/lien risk, repair cost variance, and market timing",
  "nextSteps": "Numbered list of the next 5 specific action steps to lock up this deal this week"
}`;
}

async function generateScripts(property, language = 'en') {
  const raw     = await generateText(buildScriptsPrompt(property, language));
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start   = cleaned.indexOf('{');
  const end     = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in scripts response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateMemo(property, language = 'en') {
  const raw     = await generateText(buildMemoPrompt(property, language));
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start   = cleaned.indexOf('{');
  const end     = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in memo response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

module.exports = { generateScripts, generateMemo };
