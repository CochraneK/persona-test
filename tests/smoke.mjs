import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

async function ready(path) {
  await page.goto(`${base}/${path}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__PERSONA_READY__ === true);
  assert.equal(await page.locator('iframe').count(), 0, 'play page must not use iframe');
}

await ready('play.html?test=animal');
assert.ok(await page.locator('.eitem').count() >= 8, 'animal grid should render');
await page.locator('.eitem').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /[?&]result=/, 'grid result should be deep-linkable');

await ready('play.html?test=animal&result=fox');
assert.match(await page.locator('.rname').innerText(), /机灵独行型/, 'deep-linked result should restore');

await ready('play.html?test=cat');
for (let i = 0; i < 12; i++) {
  await page.locator('.opt').first().click();
}
await page.locator('.result').waitFor();
assert.match(page.url(), /result=[EISNTFJP]{4}/, 'MBTI should finish with a four-letter type');

await ready('play.html?test=chair&scene=round');
await page.locator('.cv[data-id="5"]').click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=5/, 'chair result should preserve seat');
assert.match(page.url(), /scene=round/, 'chair result should preserve scene');

await ready('play.html?test=balloon');
assert.equal(await page.locator('#balloon-pump').count(), 1, 'balloon itself should be tappable');
assert.ok(await page.getByRole('button', { name: '打气 +2' }).isVisible(), 'mobile pump button should exist');
await page.getByRole('button', { name: '打气 +2' }).click();
assert.match(await page.locator('.pumps').innerText(), /打气 1 次|爆了/, 'pump action should update state');

await ready('play.html?test=cyber');
assert.ok(await page.locator('.cb').isVisible(), 'Cyberball board should render');

await browser.close();
if (runtimeErrors.length) {
  throw new Error(`Browser runtime errors:\n${runtimeErrors.join('\n')}`);
}
console.log('Browser smoke tests passed.');
