/**
 * LLM Service — calls Gemini REST API directly via axios (no SDK).
 * Falls back to Groq if GROQ_API_KEY is also set.
 */

const axios = require('axios');

const GEMINI_MODEL = 'gemini-2.5-flash';
// v1beta is required for thinkingConfig support on gemini-2.5-flash
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Retry wrapper ─────────────────────────────────────────────────────────────
async function callWithRetry(fn, maxRetries = 4) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.response?.status || err?.status;
      const msg    = err?.message || '';

      // Never retry auth / billing / invalid-key errors
      if (status === 400 || status === 401 || status === 403 ||
          msg.includes('API_KEY_INVALID') || msg.includes('prepayment')) {
        throw err;
      }

      if (status === 429 || status === 500 || status === 503) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
        console.log(`[LLM] Transient error (${status}). Retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// ── Gemini via direct REST ────────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const response = await axios.post(
    `${GEMINI_URL}?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      // Disable extended thinking to keep latency under Railway's proxy timeout
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

// ── Groq fallback ─────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const Groq = require('groq-sdk');
  const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res   = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return res.choices[0].message.content;
}

// ── Public interface ──────────────────────────────────────────────────────────
async function generateText(prompt) {
  const provider = process.env.LLM_PROVIDER || 'auto';

  if (provider === 'groq') return callWithRetry(() => callGroq(prompt));
  if (provider === 'gemini') return callWithRetry(() => callGemini(prompt));

  // auto: try Gemini, fall back to Groq
  try {
    return await callWithRetry(() => callGemini(prompt));
  } catch (err) {
    const msg = err?.message || '';
    const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
    if (hasGroq && (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429'))) {
      console.log('[LLM] Gemini quota hit — falling back to Groq...');
      return callWithRetry(() => callGroq(prompt));
    }
    throw err;
  }
}

async function generateChat(systemContext, history, userMessage, language) {
  const lang   = language === 'es' ? 'Respond entirely in Spanish. ' : 'Respond in English. ';
  const prompt = `${lang}You are DealRadar Copilot, a senior real estate wholesaling expert. Use this market analysis data as your knowledge base:\n\n${systemContext}\n\nConversation history:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}\n\nAssistant:`;
  return generateText(prompt);
}

module.exports = { generateText, generateChat };
