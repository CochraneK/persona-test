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
const shell = read('assets/play-shell.js');
read('assets/play-shell.css');
const engine = read('persona-image.html');
read('README.md');
read('scripts/optimize-images.py');

for (const id of tests) {
  if (!index.includes(`play.html?test=${id}`)) errors.push(`homepage missing test link: ${id}`);
  if (!engine.includes(`'${id}'`) && !engine.includes(`${id}:`)) warnings.push(`engine id not obviously found: ${id}`);
}

if (!play.includes('assets/play-shell.js')) errors.push('play.html does not load modular play shell');
if (!play.includes('assets/play-shell.css')) errors.push('play.html does not load modular shell CSS');

const requiredShellMarkers = [
  'function patchMbti',
  'w.mQ=function(id)',
  "pump.textContent='打气 +2'",
  'navigator.share',
  'function makePoster',
  "u.searchParams.set('result',result)",
  'function restoreResult',
  'function patchChair',
  'function enhanceAccessibility',
  'function patchScientificNotes'
];
for (const marker of requiredShellMarkers) {
  if (!shell.includes(marker)) errors.push(`play shell missing marker: ${marker}`);
}

const imgDir = path.join(root, 'img');
if (fs.existsSync(imgDir)) {
  const files = fs.readdirSync(imgDir).filter(f => /\.(?:jpe?g|png|webp|avif)$/i.test(f));
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

for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  process.exit(1);
}
console.log(`OK: ${tests.length} test entries checked; ${warnings.length} warning(s).`);
