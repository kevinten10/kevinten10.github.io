import jsQR from 'jsqr';
import { Jimp } from 'jimp';
import { pathToFileURL } from 'node:url';

const rewardQrs = [
  {
    name: 'WeChat',
    file: 'img/weixin.jpg',
    provider: 'wechat',
    enabled: false,
    disabledReason: 'WeChat collect-money QR is not configured; the public reward UI uses Alipay only for now'
  },
  {
    name: 'Alipay',
    file: 'img/alipay.jpg',
    provider: 'alipay',
    enabled: true
  }
];

export function classifyRewardQr(provider, value) {
  const data = String(value || '').trim();
  if (!data) return { ok: false, reason: 'QR code could not be decoded' };

  if (provider === 'wechat') {
    if (/^https:\/\/u\.wechat\.com\//i.test(data) || /^http:\/\/weixin\.qq\.com\/r\//i.test(data)) {
      return { ok: false, reason: 'decoded as a WeChat contact/follow QR, not a payment QR' };
    }
    if (/^(wxp:\/\/|weixin:\/\/wxpay|https:\/\/wx\.tenpay\.com\/|https:\/\/payapp\.weixin\.qq\.com\/)/i.test(data)) {
      return { ok: true, reason: 'decoded as a WeChat payment-like QR' };
    }
    return { ok: false, reason: 'decoded QR does not match known WeChat payment formats' };
  }

  if (provider === 'alipay') {
    if (/^https:\/\/qr\.alipay\.com\//i.test(data) || /^alipays:\/\//i.test(data)) {
      return { ok: true, reason: 'decoded as an Alipay QR; scan once on phone to confirm it opens the collect-money flow' };
    }
    return { ok: false, reason: 'decoded QR does not match known Alipay formats' };
  }

  return { ok: false, reason: `Unknown provider: ${provider}` };
}

export async function decodeQrFile(file) {
  const image = await Jimp.read(file);
  const { width, height, data } = image.bitmap;
  const qr = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width, height);
  return qr?.data || '';
}

export async function verifyRewardQrs(items = rewardQrs) {
  const results = [];
  for (const item of items) {
    let decoded = '';
    let classification;
    if (item.enabled === false) {
      results.push({
        ...item,
        decoded,
        disabled: true,
        ok: true,
        reason: item.disabledReason || `${item.name} reward method is disabled`
      });
      continue;
    }
    try {
      decoded = await decodeQrFile(item.file);
      classification = classifyRewardQr(item.provider, decoded);
    } catch (err) {
      classification = { ok: false, reason: err.message };
    }
    results.push({ ...item, decoded, ...classification });
  }
  return results;
}

export function printRewardQrResults(results) {
  for (const result of results) {
    const marker = result.ok ? 'ok' : 'not ready';
    const decoded = result.decoded ? ` decoded=${result.decoded}` : '';
    console.log(`${marker} ${result.name} reward QR: ${result.reason}${decoded}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await verifyRewardQrs();
  printRewardQrResults(results);
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}
