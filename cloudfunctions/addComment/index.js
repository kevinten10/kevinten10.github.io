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
  maxContentLength: 1000,
  rateLimitWindowMs: 30000,
  rateLimitMax: 3
};

const rateLimitMap = new Map();

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

function sanitizeContent(text) {
  if (typeof text !== 'string') return '';
  return text.trim().substring(0, CONFIG.maxContentLength);
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
    const { content, pageId, parentId, sessionId, uid } = payload || {};

    const sanitized = sanitizeContent(content);
    if (!sanitized || !pageId) {
      const result = { success: false, error: 'Invalid content or pageId' };
      return isHttp
        ? { statusCode: 400, headers, body: JSON.stringify(result) }
        : result;
    }

    const clientIP = context.CLIENTIP || 'unknown';
    const limitKey = sessionId || clientIP;
    if (!checkRateLimit(limitKey)) {
      const result = { success: false, error: 'Rate limit exceeded. Please slow down.' };
      return isHttp
        ? { statusCode: 429, headers, body: JSON.stringify(result) }
        : result;
    }

    const doc = {
      pageId: String(pageId).substring(0, 200),
      parentId: parentId || null,
      content: sanitized,
      author: {
        uid: uid || 'anonymous',
        name: 'Guest',
        loginType: 'anonymous'
      },
      status: 'approved',
      createdAt: new Date(),
      likes: 0
    };

    const addRes = await db.collection('comments').add(doc);

    const result = { success: true, data: { id: addRes.id } };
    return isHttp
      ? { statusCode: 200, headers, body: JSON.stringify(result) }
      : result;
  } catch (err) {
    const result = { success: false, error: 'Submission failed' };
    return isHttp
      ? { statusCode: 500, headers, body: JSON.stringify(result) }
      : result;
  }
};
