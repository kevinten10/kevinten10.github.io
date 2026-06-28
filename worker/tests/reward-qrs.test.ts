import { describe, expect, it } from 'vitest';
import { classifyRewardQr } from '../../scripts/verify-reward-qrs.mjs';

describe('reward QR verification helpers', () => {
  it('rejects WeChat contact or follow QR links as payment codes', () => {
    expect(classifyRewardQr('wechat', 'https://u.wechat.com/ELhLlxAvOByQm1K65g7b72U')).toMatchObject({
      ok: false
    });
    expect(classifyRewardQr('wechat', 'http://weixin.qq.com/r/example')).toMatchObject({
      ok: false
    });
  });

  it('accepts known WeChat payment-like QR formats', () => {
    expect(classifyRewardQr('wechat', 'wxp://f2f0abc')).toMatchObject({ ok: true });
    expect(classifyRewardQr('wechat', 'https://wx.tenpay.com/f2f?t=AQAA')).toMatchObject({ ok: true });
  });

  it('accepts Alipay QR links for manual confirmation', () => {
    expect(classifyRewardQr('alipay', 'https://qr.alipay.com/a7x04699n9ctixmtv1tudfb')).toMatchObject({
      ok: true
    });
  });
});
