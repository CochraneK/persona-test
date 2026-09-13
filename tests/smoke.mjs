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

await ready('play.html?test=priority');
assert.equal(await page.locator('#tabs button').count(), 22, 'expanded collection should expose 22 test tabs');
assert.equal(await page.locator('.rank-option').count(), 6, 'ranking test should render six choices');
const rankOptions = page.locator('.rank-option');
await rankOptions.nth(0).click();
await rankOptions.nth(1).click();
await rankOptions.nth(2).click();
await page.getByRole('button', { name: '查看结果' }).click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=freedom/, 'ranking result should deep-link the first priority');
assert.match(await page.locator('.rstats').innerText(), /自由.*安全.*关系/, 'ranking result should preserve top-three summary for the current run');

await ready('play.html?test=priority&result=freedom');
assert.match(await page.locator('.rname').innerText(), /自由优先型/, 'ranking deep link should restore the main result');

await ready('play.html?test=crossroads');
for (let i = 0; i < 6; i++) await page.locator('.binary-option').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=fast_plan/, 'binary choices should classify fast/plan result');
assert.match(await page.locator('.rname').innerText(), /快速掌舵型/, 'binary result should render');

await ready('play.html?test=budget');
const plus = page.locator('.alloc-plus');
for (let i = 0; i < 6; i++) await plus.nth(0).click();
for (let i = 0; i < 2; i++) await plus.nth(1).click();
for (let i = 0; i < 2; i++) await plus.nth(2).click();
for (let i = 0; i < 2; i++) await plus.nth(3).click();
assert.match(await page.locator('.alloc-meter').innerText(), /12 \/ 12/, 'allocation meter should reach the budget');
await page.getByRole('button', { name: '查看分配结果' }).click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=self/, 'allocation should classify a clear leading bucket');
assert.match(await page.locator('.rname').innerText(), /自我回充型/, 'allocation result should render');

await ready('play.html?test=sync');
for (let i = 0; i < 6; i++) await page.locator('.challenge-option').first().click();
await page.locator('.challenge-invite').waitFor();
assert.match(page.url(), /challenge=000000/, 'first player answers should be encoded into the challenge URL');
assert.ok(await page.getByRole('button', { name: '复制挑战链接' }).isVisible(), 'challenge invitation should expose copy action');

await ready('play.html?test=sync&challenge=000000');
for (let i = 0; i < 6; i++) await page.locator('.challenge-option').first().click();
await page.locator('.result').waitFor();
assert.match(await page.locator('.rname').innerText(), /高同步拍档/, 'matching answers should produce the 6/6 pair result');
assert.match(await page.locator('.rstats').innerText(), /6 \/ 6/, 'pair result should show local similarity count');
assert.doesNotMatch(page.url(), /challenge=/, 'pair result should clear invitation answers from the URL');

await ready('play.html?test=sync&challenge=010');
assert.doesNotMatch(page.url(), /challenge=/, 'malformed challenge codes should be normalized away');
assert.match(await page.locator('.prog').innerText(), /发起挑战/, 'invalid challenge should fall back to first-player mode');

await ready('play.html?test=room');
assert.equal(await page.locator('.symbol-item').count(), 8, 'room test should render eight symbol choices');
await page.locator('.symbol-item').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=window/, 'symbol result should be deep-linkable');
assert.match(await page.locator('.rname').innerText(), /通透换气型/, 'room result should render');
assert.ok(await page.getByRole('button', { name: '生成结果海报' }).isVisible(), 'symbol result should support poster generation');

await ready('play.html?test=room&result=window');
assert.match(await page.locator('.rname').innerText(), /通透换气型/, 'deep-linked symbol result should restore');
assert.equal(await page.locator('.rimg').count(), 0, 'symbol result should not require an image asset');

for (const id of ['door','drink','gem','season','path']) {
  await ready(`play.html?test=${id}`);
  assert.equal(await page.locator('.symbol-item').count(), 8, `${id} should render eight symbol choices`);
}

await ready('play.html?test=animal');
assert.ok(await page.locator('.eitem').count() >= 8, 'animal grid should render');
await page.locator('.eitem').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /[?&]result=/, 'grid result should be deep-linkable');
assert.ok(await page.getByRole('button', { name: '生成结果海报' }).isVisible(), 'poster action should be available');

await ready('play.html?test=animal&result=fox');
assert.match(await page.locator('.rname').innerText(), /机灵独行型/, 'deep-linked result should restore');
assert.equal(await page.locator('.rimg').count(), 1, 'deep-linked grid result should restore its image');

await ready('play.html?test=cat&result=ENTP');
assert.match(await page.locator('.rname').innerText(), /斯芬克斯猫/, 'ENTP cat result should restore');
assert.match(await page.locator('.rimg').getAttribute('src'), /cat_sphynx\.svg$/, 'Sphynx result should use the distinct SVG asset');

await ready('play.html?test=cat');
for (let i = 0; i < 12; i++) await page.locator('.opt').first().click();
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

await ready('play.html?test=does-not-exist&result=nope&scene=wrong&challenge=000000');
assert.match(page.url(), /test=chair/, 'invalid test id should normalize to chair');
assert.doesNotMatch(page.url(), /result=/, 'invalid result should be removed');
assert.doesNotMatch(page.url(), /challenge=/, 'challenge data must not leak into another test');
assert.match(page.url(), /scene=long/, 'invalid chair scene should normalize to the default scene');
assert.ok(await page.locator('.cv').first().isVisible(), 'normalized route should render a playable chair test');

const manifest = await page.request.get(`${base}/manifest.webmanifest`);
assert.equal(manifest.ok(), true, 'manifest should be served');
const contentPack = await page.request.get(`${base}/assets/data/content-pack.js`);
assert.equal(contentPack.ok(), true, 'content pack should be served');
const interactionPack = await page.request.get(`${base}/assets/data/interaction-pack.js`);
assert.equal(interactionPack.ok(), true, 'interaction pack should be served');

await browser.close();
if (runtimeErrors.length) throw new Error(`Browser runtime errors:\n${runtimeErrors.join('\n')}`);
console.log('Browser smoke tests passed.');
