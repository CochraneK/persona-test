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
    return {
      addData() {},
      make() {},
      createSvgTag() {
        return '<svg data-test="qr" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
      }
    };
  };
});

async function ready(path) {
  await page.goto(`${base}/${path}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__PERSONA_READY__ === true);
  assert.equal(await page.locator('iframe').count(), 0, 'play page must not use iframe');
}

async function answerChallenge(id, firstSelector = '.challenge-option:first-child') {
  await ready(`play.html?test=${id}`);
  for (let i = 0; i < 6; i++) await page.locator(firstSelector).click();
  await page.locator('.challenge-invite').waitFor();
  assert.match(page.url(), /challenge=000000/, `${id} should encode first-player answers in URL`);
  assert.ok(await page.getByRole('button', { name: '复制挑战链接' }).isVisible(), `${id} should expose challenge copy action`);
}

await ready('play.html?test=priority');
assert.equal(await page.locator('#tabs button').count(), 26, 'expanded collection should expose 26 test tabs');
assert.equal(await page.locator('.rank-option').count(), 6, 'ranking test should render six choices');
const rankOptions = page.locator('.rank-option');
await rankOptions.nth(0).click();
await rankOptions.nth(1).click();
await rankOptions.nth(2).click();
await page.getByRole('button', { name: '查看结果' }).click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=freedom/, 'ranking result should deep-link the first priority');
assert.match(await page.locator('.rstats').innerText(), /自由.*安全.*关系/, 'ranking result should preserve top-three summary');

await ready('play.html?test=crossroads');
for (let i = 0; i < 6; i++) await page.locator('.binary-option').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=fast_plan/, 'binary choices should classify fast/plan result');

await ready('play.html?test=budget');
const plus = page.locator('.alloc-plus');
for (let i = 0; i < 6; i++) await plus.nth(0).click();
for (let i = 0; i < 2; i++) await plus.nth(1).click();
for (let i = 0; i < 2; i++) await plus.nth(2).click();
for (let i = 0; i < 2; i++) await plus.nth(3).click();
await page.getByRole('button', { name: '查看分配结果' }).click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=self/, 'allocation should classify a clear leading bucket');

await ready('play.html?test=selffuture');
for (let i = 0; i < 12; i++) await page.locator('.challenge-option').first().click();
await page.locator('.result').waitFor();
assert.match(await page.locator('.rname').innerText(), /内外同向型/, 'identical current/ideal answers should classify aligned');
assert.match(await page.locator('.rstats').innerText(), /6 \/ 6/, 'self comparison should show six aligned directions');
assert.doesNotMatch(page.url(), /challenge=/, 'self comparison must never write a challenge code');

await answerChallenge('sync');
await ready('play.html?test=sync&challenge=000000');
for (let i = 0; i < 6; i++) await page.locator('.challenge-option').first().click();
await page.locator('.result').waitFor();
assert.match(await page.locator('.rname').innerText(), /高同步拍档/, 'sync 6/6 result should render');
assert.match(await page.locator('.rstats').innerText(), /6 \/ 6/, 'sync should show similarity count');
assert.doesNotMatch(page.url(), /challenge=/, 'sync result should clear challenge code');

await answerChallenge('guessme');
await ready('play.html?test=guessme&challenge=000000');
assert.match(await page.locator('.hint').innerText(), /不要选你自己|猜你朋友/, 'guess-me partner must be told to guess the first player');
for (let i = 0; i < 6; i++) await page.locator('.challenge-option').first().click();
await page.locator('.result').waitFor();
assert.match(await page.locator('.rname').innerText(), /读心级好友/, 'guess-me 6/6 should produce mind-reader result');
assert.match(await page.locator('.rstats').innerText(), /猜中.*6 \/ 6/, 'guess-me stats should use guess accuracy wording');

await answerChallenge('travelmate');
await ready('play.html?test=travelmate&challenge=000000');
for (let i = 0; i < 6; i++) await page.locator('.challenge-option').nth(1).click();
await page.locator('.result').waitFor();
assert.match(await page.locator('.rname').innerText(), /反向行程型/, 'opposite travel answers should render travel-specific result');
assert.match(await page.locator('.rstats').innerText(), /旅行同频.*0 \/ 6/, 'travel result should use travel-specific score label');

await answerChallenge('rhythm');
await ready('play.html?test=rhythm&challenge=000000');
for (let i = 0; i < 6; i++) await page.locator('.challenge-option').first().click();
await page.locator('.result').waitFor();
assert.match(await page.locator('.rname').innerText(), /同拍关系型/, 'matching relationship rhythms should produce same-beat result');
assert.match(await page.locator('.rstats').innerText(), /节奏同频.*6 \/ 6/, 'relationship result should use rhythm-specific score label');

await ready('play.html?test=guessme&challenge=010');
assert.doesNotMatch(page.url(), /challenge=/, 'malformed challenge codes should be normalized away');
assert.match(await page.locator('.prog').innerText(), /我的真实答案/, 'invalid guess-me challenge should fall back to creator mode');

await ready('play.html?test=room');
assert.equal(await page.locator('.symbol-item').count(), 8, 'room test should render eight symbol choices');
await page.locator('.symbol-item').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /result=window/, 'symbol result should be deep-linkable');
assert.ok(await page.getByRole('button', { name: '生成结果海报' }).isVisible(), 'symbol result should support poster generation');
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
assert.doesNotMatch(invite, /result=|challenge=/, 'friend invite URL must not leak result or challenge data');

await ready('play.html?test=room&from=friend');
assert.ok(await page.locator('.friend-invite').isVisible(), 'friend landing should show invite context');
assert.match(await page.locator('.friend-invite').innerText(), /朋友点名你来测/, 'friend landing copy should be explicit');
assert.doesNotMatch(page.url(), /from=friend/, 'friend source marker should be consumed from the clean URL');

await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
assert.ok(await page.getByText('🎲 随机来一个', { exact: true }).isVisible(), 'homepage should expose random test entry');
await page.locator('.recent-section').waitFor();
assert.match(await page.locator('.recent-section').innerText(), /房间人格/, 'homepage should show locally recent test');
assert.match(await page.locator('.recent-section').innerText(), /只保存在这台设备/, 'recent section should state local-only storage');
await page.getByRole('button', { name: '清除记录' }).click();
assert.equal(await page.locator('.recent-section').count(), 0, 'recent history should be clearable locally');

await ready('play.html?test=animal');
assert.ok(await page.locator('.eitem').count() >= 8, 'animal grid should render');
await page.locator('.eitem').first().click();
await page.locator('.result').waitFor();
assert.match(page.url(), /[?&]result=/, 'grid result should be deep-linkable');

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

const manifest = await page.request.get(`${base}/manifest.webmanifest`);
assert.equal(manifest.ok(), true, 'manifest should be served');
const interactionPack = await page.request.get(`${base}/assets/data/interaction-pack.js`);
assert.equal(interactionPack.ok(), true, 'interaction pack should be served');
const mirror = await page.request.get(`${base}/assets/renderers/mirror.js`);
assert.equal(mirror.ok(), true, 'mirror renderer should be served');
const historyAsset = await page.request.get(`${base}/assets/core/history.js`);
assert.equal(historyAsset.ok(), true, 'local history module should be served');

await browser.close();
if (runtimeErrors.length) throw new Error(`Browser runtime errors:\n${runtimeErrors.join('\n')}`);
console.log('Browser smoke tests passed.');
