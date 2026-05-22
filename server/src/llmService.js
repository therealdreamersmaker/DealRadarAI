const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder');

async function callWithRetry(fn, maxRetries = 5) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      if (status === 429 || status === 503) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 32000);
        console.log(`[LLM] Rate limited (${status}). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

function getModel(useSearch = true) {
  const tools = useSearch
    ? [{ googleSearch: {} }]
    : [];
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools,
  });
}

async function generateWithSearch(prompt) {
  return callWithRetry(async () => {
    const model = getModel(true);
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

async function generateChat(systemContext, history, userMessage, language) {
  return callWithRetry(async () => {
    const model = getModel(false);
    const langInstruction = language === 'es'
      ? 'Respond entirely in Spanish. '
      : 'Respond in English. ';
    const fullPrompt = `${langInstruction}You are DealRadar Copilot, a senior real estate wholesaling expert. Use the following market analysis data as your knowledge base:\n\n${systemContext}\n\nConversation history:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}\n\nAssistant:`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  });
}

module.exports = { generateWithSearch, generateChat };
