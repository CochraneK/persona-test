import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem('persona_recent_tests_v1', JSON.stringify([
    { id: 'room', name: '房间人格', at: Date.now() },
    { id: 'chair', name: '会议室选椅子', at: Date.now() - 1000 }
  ]));
});
await page.reload({ waitUntil: 'networkidle' });
assert.ok(await page.getByText('🎲 随机来一个', { exact: true }).isVisible(), 'homepage should expose random test entry');
await page.locator('.recent-section').waitFor();
assert.match(await page.locator('.recent-section').innerText(), /房间人格/, 'homepage should show locally recent test');
assert.match(await page.locator('.recent-section').innerText(), /只保存在这台设备/, 'recent section should state local-only storage');
await page.getByRole('button', { name: '清除记录' }).click();
assert.equal(await page.locator('.recent-section').count(), 0, 'recent history should be clearable locally');
assert.equal(await page.evaluate(() => localStorage.getItem('persona_recent_tests_v1')), null, 'clear action should remove local storage key');

await browser.close();
if (runtimeErrors.length) throw new Error(`Browser runtime errors:\n${runtimeErrors.join('\n')}`);
console.log('Homepage growth smoke passed.');
