import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.cwd());
const baseTests = ['chair','balloon','cyber','dog','cat','audio','animal','food','color','weather','city','flower'];
const contentTests = ['room','door','drink','gem','season','path'];
const interactionTests = ['priority','crossroads','budget','selffuture','sync','guessme','travelmate','rhythm'];
const challengeTests = ['sync','guessme','travelmate','rhythm'];
const tests = [...baseTests, ...contentTests, ...interactionTests];
const errors = [];
const warnings = [];

function read(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    errors.push(`missing file: ${file}`);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

const index = read('index.html');
const play = read('play.html');
const app = read('assets/app.js');
const home = read('assets/home.js');
const homeCss = read('assets/home.css');
const growthCss = read('assets/growth.css');
const data = read('assets/data/test-data.js');
const content = read('assets/data/content-pack.js');
const interaction = read('assets/data/interaction-pack.js');
const share = read('assets/core/share.js');
const router = read('assets/core/router.js');
const history = read('assets/core/history.js');
const balloon = read('assets/renderers/balloon.js');
const chair = read('assets/renderers/chair.js');
const mbti = read('assets/renderers/mbti.js');
const cyber = read('assets/renderers/cyberball.js');
const grid = read('assets/renderers/grid.js');
const rank = read('assets/renderers/rank.js');
const binary = read('assets/renderers/binary.js');
const allocate = read('assets/renderers/allocate.js');
const challenge = read('assets/renderers/challenge.js');
const mirror = read('assets/renderers/mirror.js');
read('assets/app.css');
read('assets/content-pack.css');
read('assets/interaction-pack.css');
read('assets/core/result.js');
read('assets/core/ui.js');
const manifest = read('manifest.webmanifest');
const serviceWorker = read('sw.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const readme = read('README.md');
read('scripts/extract-test-data.mjs');
read('scripts/optimize-images.py');
const smoke = read('tests/smoke.mjs');

for (const id of tests) {
  if (!index.includes(`play.html?test=${id}`)) errors.push(`homepage missing test link: ${id}`);
  if (!sitemap.includes(`play.html?test=${id}`)) errors.push(`sitemap missing test link: ${id}`);
}
for (const id of baseTests) if (!data.includes(`\"${id}\"`)) errors.push(`generated data missing base test: ${id}`);
for (const id of contentTests) {
  if (!content.includes(`  ${id}: {`)) errors.push(`content pack missing test: ${id}`);
  if (!router.includes(`'${id}'`)) errors.push(`shareable routes missing content test: ${id}`);
}
for (const id of interactionTests) if (!interaction.includes(`  ${id}: {`)) errors.push(`interaction pack missing test: ${id}`);
for (const id of ['priority','crossroads','budget']) if (!router.includes(`'${id}'`)) errors.push(`shareable routes missing interaction result: ${id}`);
for (const id of challengeTests) if (!router.includes(`'${id}'`)) errors.push(`challenge route allowlist missing: ${id}`);

if (/<iframe\b/i.test(play)) errors.push('play.html must not use an iframe');
if (!play.includes('type="module" src="assets/app.js"')) errors.push('play.html does not load the modular app entrypoint');
for (const css of ['assets/content-pack.css','assets/interaction-pack.css','assets/growth.css']) {
  if (!play.includes(css)) errors.push(`play.html does not load ${css}`);
}
if (!index.includes('assets/home.css') || !index.includes('assets/growth.css') || !index.includes('assets/home.js')) errors.push('homepage modular growth assets are not wired');
if (!play.includes('name="referrer" content="no-referrer"') || !index.includes('name="referrer" content="no-referrer"')) errors.push('referrer suppression missing');
if (!play.includes('26 个轻量')) errors.push('play page count is stale');
if (!index.includes('26 个测验')) errors.push('homepage count is stale');
if (!manifest.includes('"display": "standalone"')) errors.push('manifest is not installable standalone metadata');
if (!manifest.includes('26 个轻量')) errors.push('manifest description is stale');
if (!serviceWorker.includes("const CACHE = 'persona-test-v7'")) errors.push('service worker cache version marker missing');
for (const cached of [
  './assets/home.js','./assets/home.css','./assets/growth.css','./assets/core/history.js',
  './assets/data/content-pack.js','./assets/data/interaction-pack.js','./assets/content-pack.css','./assets/interaction-pack.css',
  './assets/renderers/rank.js','./assets/renderers/binary.js','./assets/renderers/allocate.js','./assets/renderers/challenge.js','./assets/renderers/mirror.js'
]) {
  if (!serviceWorker.includes(`'${cached}'`)) errors.push(`service worker missing cached asset: ${cached}`);
}
if (!robots.includes('sitemap.xml')) errors.push('robots.txt does not advertise sitemap');

if (fs.existsSync(path.join(root, 'assets', 'play-shell.js')) || fs.existsSync(path.join(root, 'assets', 'play-shell.css'))) errors.push('obsolete iframe play-shell files still exist');

const requiredMarkers = [
  [app, 'CONTENT_ORDER', 'content pack order merge'],
  [app, 'INTERACTION_ORDER', 'interaction pack order merge'],
  [app, 'rememberTest(id, test.name)', 'local recent-test recording'],
  [app, 'showFriendInvite', 'friend invite landing banner'],
  [app, 'renderRank', 'ranking renderer registration'],
  [app, 'renderBinary', 'binary renderer registration'],
  [app, 'renderAllocate', 'allocation renderer registration'],
  [app, 'renderChallenge', 'challenge renderer registration'],
  [app, 'renderMirror', 'self-comparison renderer registration'],
  [app, 'CHALLENGE_TESTS.has(id)', 'generic challenge route handling'],
  [app, 'serviceWorker.register', 'service worker registration'],
  [home, 'randomTest()', 'homepage random entry'],
  [home, 'getRecentTests()', 'homepage recent history'],
  [home, 'clearRecentTests()', 'homepage local-history clear'],
  [history, "persona_recent_tests_v1", 'local history namespace'],
  [router, 'inviteUrl(test)', 'clean friend invite URL'],
  [router, "value === 'friend'", 'friend route source allowlist'],
  [share, "'挑战好友'", 'friend challenge action'],
  [share, "'邀请二维码'", 'QR invite action'],
  [share, 'qrcode-generator@2.0.4', 'pinned QR library'],
  [share, "script.referrerPolicy = 'no-referrer'", 'QR library referrer suppression'],
  [share, 'makePoster', 'poster generation'],
  [share, 'navigator.share', 'native result sharing'],
  [grid, "test.kind === 'symbol'", 'symbol renderer support'],
  [rank, 'selected.length !== 3', 'three-item ranking flow'],
  [binary, "`${pace}_${control}`", 'binary result classification'],
  [allocate, "'balance'", 'allocation balance classification'],
  [challenge, 'challengeConfig', 'per-test challenge copy/config'],
  [challenge, 'resultKey(matches', 'generic challenge scoring bands'],
  [mirror, 'passLabels', 'two-pass self comparison'],
  [router, 'invalidChallenge', 'malformed challenge cleanup'],
  [balloon, "'打气 +2'", 'mobile balloon pump'],
  [chair, 'role="button"', 'keyboard-accessible chairs'],
  [mbti, 'state.score[option.value]++', 'normalized MBTI scoring'],
  [cyber, "ask(['A','B','C']", 'Cyberball choice phase'],
  [smoke, 'friend-invite', 'browser friend landing regression'],
  [smoke, 'recent-section', 'browser recent-history regression']
];
for (const [source, marker, label] of requiredMarkers) if (!source.includes(marker)) errors.push(`missing ${label}: ${marker}`);

const contentResultBlocks = (content.match(/results:\s*\{/g) || []).length;
if (contentResultBlocks !== contentTests.length) errors.push(`content pack should have ${contentTests.length} result maps, found ${contentResultBlocks}`);
if ((content.match(/kind:\s*'symbol'/g) || []).length !== contentTests.length) errors.push(`content pack should have ${contentTests.length} symbol tests`);
const interactionResultBlocks = (interaction.match(/results:\s*\{/g) || []).length;
if (interactionResultBlocks !== interactionTests.length) errors.push(`interaction pack should have ${interactionTests.length} result maps, found ${interactionResultBlocks}`);
if ((interaction.match(/kind:\s*'challenge'/g) || []).length !== challengeTests.length) errors.push(`interaction pack should have ${challengeTests.length} challenge tests`);
for (const kind of ['rank','binary','allocate','mirror','challenge']) if (!interaction.includes(`kind: '${kind}'`)) errors.push(`interaction pack missing ${kind} test kind`);
for (const marker of ['好友读心','旅行搭子','关系节奏','现在的我 vs 理想的我']) if (!index.includes(marker) && !interaction.includes(marker)) errors.push(`missing social content marker: ${marker}`);
for (const marker of ['最近玩过','挑战好友','二维码']) if (!index.includes(marker) && !share.includes(marker) && !home.includes(marker) && !readme.includes(marker)) errors.push(`missing growth marker: ${marker}`);

if (!fs.existsSync(path.join(root, 'img', 'cat_sphynx.svg'))) errors.push('missing distinct Sphynx cat asset');
if (fs.existsSync(path.join(root, 'img', 'cat_sphynx.jpg'))) errors.push('obsolete duplicate Sphynx JPG still exists');

const imgDir = path.join(root, 'img');
if (fs.existsSync(imgDir)) {
  const files = fs.readdirSync(imgDir).filter((file) => /\.(?:jpe?g|png|webp|avif|svg)$/i.test(file));
  const hashes = new Map();
  for (const file of files) {
    const p = path.join(imgDir, file);
    const buf = fs.readFileSync(p);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    const list = hashes.get(hash) || [];
    list.push(file);
    hashes.set(hash, list);
    if (buf.length > 750 * 1024) warnings.push(`large image >750KB: ${file} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  }
  for (const list of hashes.values()) if (list.length > 1) warnings.push(`duplicate image bytes: ${list.join(', ')}`);
} else errors.push('missing img directory');

for (const warning of warnings) console.warn(`WARN  ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`OK: release-ready modular app, growth loop, and ${tests.length} test entries checked; ${warnings.length} warning(s).`);
