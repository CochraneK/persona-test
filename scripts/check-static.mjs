import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.cwd());
const tests = ['chair','balloon','cyber','dog','cat','audio','animal','food','color','weather','city','flower'];
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
const data = read('assets/data/test-data.js');
const share = read('assets/core/share.js');
const balloon = read('assets/renderers/balloon.js');
const chair = read('assets/renderers/chair.js');
const mbti = read('assets/renderers/mbti.js');
const cyber = read('assets/renderers/cyberball.js');
read('assets/app.css');
read('assets/core/result.js');
read('assets/core/router.js');
read('assets/core/ui.js');
read('assets/renderers/grid.js');
const manifest = read('manifest.webmanifest');
const serviceWorker = read('sw.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
read('README.md');
read('scripts/extract-test-data.mjs');
read('scripts/optimize-images.py');
read('tests/smoke.mjs');

for (const id of tests) {
  if (!index.includes(`play.html?test=${id}`)) errors.push(`homepage missing test link: ${id}`);
  if (!data.includes(`"${id}"`)) errors.push(`generated data missing test: ${id}`);
}

if (/<iframe\b/i.test(play)) errors.push('play.html must not use an iframe');
if (!play.includes('type="module" src="assets/app.js"')) errors.push('play.html does not load the modular app entrypoint');
if (!play.includes('manifest.webmanifest')) errors.push('play.html does not expose the web app manifest');
if (!index.includes('manifest.webmanifest')) errors.push('index.html does not expose the web app manifest');
if (!manifest.includes('"display": "standalone"')) errors.push('manifest is not installable standalone metadata');
if (!serviceWorker.includes("const CACHE = 'persona-test-v3'")) errors.push('service worker cache version marker missing');
if (!robots.includes('sitemap.xml')) errors.push('robots.txt does not advertise sitemap');
if (!sitemap.includes('play.html?test=chair')) errors.push('sitemap missing play entrypoints');

if (fs.existsSync(path.join(root, 'assets', 'play-shell.js')) || fs.existsSync(path.join(root, 'assets', 'play-shell.css'))) {
  errors.push('obsolete iframe play-shell files still exist');
}

const requiredMarkers = [
  [app, 'serviceWorker.register', 'service worker registration'],
  [app, 'showDeepLinkedResult', 'deep-linked results'],
  [share, 'makePoster', 'poster generation'],
  [share, 'navigator.share', 'native sharing'],
  [balloon, "'打气 +2'", 'mobile balloon pump'],
  [chair, 'role="button"', 'keyboard-accessible chairs'],
  [mbti, 'state.score[option.value]++', 'normalized MBTI scoring'],
  [cyber, "ask(['A','B','C']", 'Cyberball choice phase']
];
for (const [content, marker, label] of requiredMarkers) {
  if (!content.includes(marker)) errors.push(`missing ${label}: ${marker}`);
}

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
  for (const list of hashes.values()) {
    if (list.length > 1) warnings.push(`duplicate image bytes: ${list.join(', ')}`);
  }
} else {
  errors.push('missing img directory');
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`OK: release-ready modular app and ${tests.length} test entries checked; ${warnings.length} warning(s).`);
