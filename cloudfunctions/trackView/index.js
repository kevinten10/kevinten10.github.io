const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});
const db = app.database();
const _ = db.command;

const ALLOWED_ORIGINS = [
  'https://kevinten10.github.io',
  'https://kevinten.com',
  'http://localhost:8000'
];

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
    const { page, referrer, userAgent, screenSize, sessionId, uid, doNotTrack } = payload || {};

    if (doNotTrack) {
      const result = { success: true, tracked: false };
      return isHttp
        ? { statusCode: 200, headers, body: JSON.stringify(result) }
        : result;
    }

    if (!page || !sessionId) {
      const result = { success: false, error: 'Missing page or sessionId' };
      return isHttp
        ? { statusCode: 400, headers, body: JSON.stringify(result) }
        : result;
    }

    const clientIP = context.CLIENTIP || 'unknown';
    const anonymizedIP = clientIP.includes('.')
      ? clientIP.split('.').slice(0, 3).join('.') + '.*'
      : clientIP.includes(':')
      ? clientIP.split(':').slice(0, 4).join(':') + ':*'
      : 'unknown';

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    await db.collection('page_views').add({
      page,
      sessionId,
      uid: uid || 'anonymous',
      referrer: (referrer || '').substring(0, 500),
      userAgent: (userAgent || '').substring(0, 500),
      screenSize: screenSize || '',
      ip: anonymizedIP,
      timestamp: now,
      date: dateStr
    });

    const statsRes = await db.collection('daily_stats')
      .where({ date: dateStr, page })
      .limit(1)
      .get();

    if (statsRes.data && statsRes.data.length > 0) {
      const docId = statsRes.data[0]._id;
      await db.collection('daily_stats').doc(docId).update({
        data: {
          pv: _.inc(1),
          lastUpdated: now
        }
      });
    } else {
      await db.collection('daily_stats').add({
        date: dateStr,
        page,
        pv: 1,
        uv: 1,
        lastUpdated: now
      });
    }

    const result = { success: true };
    return isHttp
      ? { statusCode: 200, headers, body: JSON.stringify(result) }
      : result;
  } catch (err) {
    const result = { success: false, error: 'Internal error' };
    return isHttp
      ? { statusCode: 500, headers, body: JSON.stringify(result) }
      : result;
  }
};
