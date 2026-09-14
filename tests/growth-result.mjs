import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
await page.addInitScript(() => {
  window.qrcode = function qrcodeFixture() {
    return { addData() {}, make() {}, createSvgTag() { return '<svg data-test="qr" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'; } };
  };
});

await page.goto(`${base}/play.html?test=room`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__PERSONA_READY__ === true);
await page.locator('.symbol-item').first().click();
await page.locator('.result').waitFor();
assert.ok(await page.getByRole('button', { name: '挑战好友' }).isVisible(), 'result should expose friend invite action');
assert.ok(await page.getByRole('button', { name: '邀请二维码' }).isVisible(), 'result should expose QR invite action');
await page.getByRole('button', { name: '邀请二维码' }).click();
await page.locator('.invite-qr svg[data-test="qr"]').waitFor();
assert.match(await page.locator('.invite-qr').innerText(), /不包含你的具体结果/, 'QR panel should explain result privacy');

const invite = await page.evaluate(async () => {
  const mod = await import('./assets/core/router.js');
  return mod.inviteUrl('room');
});
assert.match(invite, /play\.html\?test=room&from=friend$/, 'friend invite URL should contain only test and source');
assert.doesNotMatch(invite, /result=|challenge=|scene=/, 'friend invite URL must not leak result or challenge data');

await browser.close();
if (runtimeErrors.length) throw new Error(`Browser runtime errors:\n${runtimeErrors.join('\n')}`);
console.log('Result growth smoke passed.');
