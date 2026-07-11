const https = require('https');
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});
const db = app.database();

const ALLOWED_ORIGINS = [
  'https://kevinten10.github.io',
  'https://kevinten.com',
  'http://localhost:8000'
];

const CONFIG = {
  maxInputLength: 500,
  maxHistoryLength: 10,
  rateLimitWindowMs: 60000,
  rateLimitMax: 10
};

const SYSTEM_PROMPT = `You are KevinTen's AI assistant. You help visitors learn about KevinTen's background, projects, technical expertise, and interests.

KevinTen is a Software Architect and AI-Native Builder with 7+ years of experience. He is a contributor to Apache Dubbo, Dapr, and Layotto. He specializes in cloud-native distributed systems, multi-runtime architecture, and AI application engineering.

Current projects include OpenOctopus (a realm-native life intelligence system) and ikun-llm (a from-scratch LLM training project).

Guidelines:
- Be helpful, concise, and technically accurate
- If asked about personal contact, direct to the Contact section
- If asked something you don't know, say so honestly
- Respond in the same language as the user's query (Chinese or English)
- Keep responses under 200 tokens when possible`;

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '*';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'content-type': 'application/json'
  };
}

function callLLM(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else {
            reject(new Error(json.error?.message || 'Invalid LLM response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}

// Simple in-memory rate limiter (per sessionId)
const rateLimitMap = new Map();

function checkRateLimit(sessionId) {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId);
  if (!record || now - record.windowStart > CONFIG.rateLimitWindowMs) {
    rateLimitMap.set(sessionId, { windowStart: now, count: 1 });
    return true;
  }
  if (record.count >= CONFIG.rateLimitMax) {
    return false;
  }
  record.count++;
  return true;
}

exports.main = async (event, context) => {
  const isHttp = !!event.httpMethod;
  const headers = isHttp ? getCorsHeaders(event) : {};

  if (isHttp && event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const payload = isHttp
      ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body)
      : event;
    const { messages, sessionId, uid } = payload || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const result = { success: false, error: 'Invalid messages' };
      return isHttp
        ? { statusCode: 400, headers, body: JSON.stringify(result) }
        : result;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.content || lastMessage.content.length > CONFIG.maxInputLength) {
      const result = { success: false, error: 'Input too long or empty' };
      return isHttp
        ? { statusCode: 400, headers, body: JSON.stringify(result) }
        : result;
    }

    if (sessionId && !checkRateLimit(sessionId)) {
      const result = { success: false, error: 'Rate limit exceeded. Please slow down.' };
      return isHttp
        ? { statusCode: 429, headers, body: JSON.stringify(result) }
        : result;
    }

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      const result = {
        success: true,
        data: {
          content: 'AI 助手正在配置中，请稍后重试。',
          mock: true
        }
      };
      return isHttp
        ? { statusCode: 200, headers, body: JSON.stringify(result) }
        : result;
    }

    const requestMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-CONFIG.maxHistoryLength)
    ];

    const reply = await callLLM(apiKey, requestMessages);

    try {
      await db.collection('ai_chat_logs').add({
        uid: uid || 'anonymous',
        sessionId: sessionId || '',
        timestamp: new Date(),
        input: lastMessage.content,
        output: reply
      });
    } catch (logErr) {
      // Silently fail logging
    }

    const result = { success: true, data: { content: reply } };
    return isHttp
      ? { statusCode: 200, headers, body: JSON.stringify(result) }
      : result;
  } catch (err) {
    const result = { success: false, error: 'AI service unavailable' };
    return isHttp
      ? { statusCode: 500, headers, body: JSON.stringify(result) }
      : result;
  }
};
