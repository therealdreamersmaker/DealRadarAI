/**
 * LLM Service — supports two providers:
 *   PROVIDER=gemini  → Google Gemini 2.0 Flash (requires billing-enabled key)
 *   PROVIDER=groq    → Groq Llama-3.3-70b (free tier, no credit card needed)
 * Default: tries Gemini first, auto-falls back to Groq if billing error.
 */

const PROVIDER = process.env.LLM_PROVIDER || 'auto'; // 'gemini' | 'groq' | 'auto'

// ── Gemini ───────────────────────────────────────────────────────────────────
let geminiAI = null;
function getGemini() {
  if (!geminiAI) {
    const { GoogleGenAI } = require('@google/genai');
    geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder' });
  }
  return geminiAI;
}

async function callGemini(prompt) {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
}

// ── Groq ─────────────────────────────────────────────────────────────────────
let groqClient = null;
function getGroq() {
  if (!groqClient) {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' });
  }
  return groqClient;
}

async function callGroq(prompt) {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return completion.choices[0].message.content;
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
async function callWithRetry(fn, maxRetries = 4) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err?.message || '';
      const status = err?.status || err?.response?.status;
      // Don't retry billing/auth errors
      if (msg.includes('prepayment') || msg.includes('API key') || status === 401 || status === 403) {
        throw err;
      }
      if (status === 429 || status === 503 || status === 500) {
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

// ── Public interface ──────────────────────────────────────────────────────────
async function generateText(prompt) {
  // Auto mode: try Gemini, fall back to Groq on billing errors
  if (PROVIDER === 'gemini') {
    return callWithRetry(() => callGemini(prompt));
  }
  if (PROVIDER === 'groq') {
    return callWithRetry(() => callGroq(prompt));
  }

  // AUTO: try Gemini, fall back to Groq
  try {
    return await callWithRetry(() => callGemini(prompt));
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('prepayment') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('placeholder')) {
      console.log('[LLM] Gemini unavailable, falling back to Groq...');
      return callWithRetry(() => callGroq(prompt));
    }
    throw err;
  }
}

async function generateChat(systemContext, history, userMessage, language) {
  const langInstruction = language === 'es' ? 'Respond entirely in Spanish. ' : 'Respond in English. ';
  const prompt = `${langInstruction}You are DealRadar Copilot, a senior real estate wholesaling expert. Use this market analysis data as your knowledge base:\n\n${systemContext}\n\nConversation history:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}\n\nAssistant:`;
  return generateText(prompt);
}

module.exports = { generateText, generateChat };
