import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

await page.goto(`${base}/play.html?test=room&from=friend`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__PERSONA_READY__ === true);
assert.ok(await page.locator('.friend-invite').isVisible(), 'friend landing should show invite context');
assert.match(await page.locator('.friend-invite').innerText(), /朋友点名你来测/, 'friend landing copy should be explicit');
assert.doesNotMatch(page.url(), /from=friend/, 'friend source marker should be consumed from the clean URL');
assert.match(page.url(), /test=room/, 'friend landing should preserve target test');

await browser.close();
if (runtimeErrors.length) throw new Error(`Browser runtime errors:\n${runtimeErrors.join('\n')}`);
console.log('Friend landing growth smoke passed.');
