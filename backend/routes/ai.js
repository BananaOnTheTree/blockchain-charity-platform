const express = require('express');
const router = express.Router();
const { CampaignMetadata } = require('../models');

// Simple in-memory cache: key -> {data, ts}
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Helper: call OpenAI Chat Completions if API key is provided
async function callOpenAI(messages, options = {}) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-nano-2025-04-14';

  if (!OPENAI_API_KEY || typeof fetch === 'undefined') {
    // Fallback: return joined messages as a naive mock
    const last = messages[messages.length - 1];
    return { text: `MOCK: ${String(last.content).slice(0, 800)}` };
  }

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 500
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { text: content, meta: data };
}

// POST /campaigns/:campaignId/generate
// body: { action: 'summary'|'risk', style?: string, title?: string, description?: string }
router.post('/campaigns/:campaignId/generate', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { action, style, title, description } = req.body;

    if (!action || !['summary', 'risk'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const cacheKey = `${campaignId}:${action}:${style || 'default'}`;
    const now = Date.now();

    // Return cached if within TTL
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.ts) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // Load metadata from DB to build context
    let metadata = null;
    if (/^\d+$/.test(campaignId)) {
      metadata = await CampaignMetadata.findOne({ where: { campaignId: parseInt(campaignId) } });
    } else {
      metadata = await CampaignMetadata.findOne({ where: { uuid: campaignId } });
    }

    const contextParts = [];
    if (title) contextParts.push(`Title: ${title}`);
    if (description) contextParts.push(`Description: ${description}`);
    if (metadata?.detailedDescription) contextParts.push(`Detailed: ${metadata.detailedDescription}`);
    if (metadata?.story) contextParts.push(`Story: ${metadata.story}`);
    if (metadata?.impactStatement) contextParts.push(`Impact: ${metadata.impactStatement}`);

    const contextText = contextParts.join('\n\n') || 'No additional context provided.';

    if (action === 'summary') {
      const prompt = `You are a helpful assistant that summarizes fundraising campaigns for donors. Produce a 2-sentence short summary. Keep it factual and warm. Context:\n\n${contextText}`;

      const messages = [
        { role: 'system', content: 'You summarize charity fundraising campaigns concisely and accurately.' },
        { role: 'user', content: prompt }
      ];

      const result = await callOpenAI(messages, { temperature: 0.2, max_tokens: 400 });

      const out = {
        text: result.text,
        prompt,
        model: process.env.OPENAI_MODEL || 'mock',
        meta: result.meta || null
      };

      cache.set(cacheKey, { data: out, ts: now });

      return res.json({ success: true, data: out });
    }

    if (action === 'risk') {
      const prompt = `You are a safety assistant. Given the campaign context below, provide a short verdict: SAFE, WARNING, or SUSPICIOUS, and up to 5 concise reasons supporting your verdict. Do NOT make legal accusations—state concerns only. Context:\n\n${contextText}`;

      const messages = [
        { role: 'system', content: 'You identify potential red flags and missing information in fundraising campaigns.' },
        { role: 'user', content: prompt }
      ];

      const result = await callOpenAI(messages, { temperature: 0.4, max_tokens: 300 });

      // Try to parse a simple JSON-like response if user asked for it, otherwise return text
      const out = {
        text: result.text,
        prompt,
        model: process.env.OPENAI_MODEL || 'mock',
        meta: result.meta || null
      };

      cache.set(cacheKey, { data: out, ts: now });

      return res.json({ success: true, data: out });
    }

    return res.status(400).json({ success: false, error: 'Unhandled action' });
  } catch (error) {
    console.error('AI route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
