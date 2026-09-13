import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.cwd());
const sourcePath = path.join(root, 'persona-image.html');
const outPath = path.join(root, 'assets', 'data', 'test-data.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function findObjectLiteral(text, variableName) {
  const re = new RegExp(`(?:var|let|const)\\s+${variableName}\\s*=\\s*`);
  const match = re.exec(text);
  if (!match) throw new Error(`Cannot find ${variableName} assignment`);
  const start = text.indexOf('{', match.index + match[0].length);
  if (start < 0) throw new Error(`Cannot find ${variableName} object start`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') { blockComment = false; i++; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && next === '/') { lineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
    if (ch === '\'' || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed ${variableName} object literal`);
}

const literal = findObjectLiteral(source, 'DATA');
const tests = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
const order = ['chair','balloon','cyber','dog','cat','audio','animal','food','color','weather','city','flower'];

const extraMbti = [
  [['临时多出一个空闲下午？','约人出去走走','E'],['自己安静待着更舒服','I']],
  [['碰到陌生任务？','先从已知步骤开始','S'],['先猜整体规律和可能性','N']],
  [['朋友来找你诉苦？','先一起想解决办法','T'],['先确认对方现在的感受','F']],
  [['明天有件重要的事？','提前安排好更安心','J'],['保留弹性到时候再看','P']]
];

function normalizeMbti(test) {
  const raw = [...test.qs, ...extraMbti];
  test.qs = raw.map((q) => ({
    prompt: q[0][0],
    options: [
      { label: q[0][1], value: q[0][2] },
      { label: q[1][0], value: q[1][1] }
    ]
  }));
  test.note = '12 道情境题，每个维度 3 题，凭第一反应选择；这是娱乐化 MBTI 改编，并非正式量表。';
  delete test.ref;
}

for (const [id, test] of Object.entries(tests)) {
  delete test.ref;
  if (test.kind === 'mbti') normalizeMbti(test);
  if (id === 'balloon') test.note = '5 个气球的娱乐化风险决策小游戏，灵感来自 BART。每次打气可能加分，也可能爆掉；结果仅供娱乐。';
  if (id === 'cyber') test.note = '一个受 Cyberball 启发的社会反应小游戏：经历被冷落后，看你接下来更倾向怎样分配互动。结果仅供娱乐。';
}

const missing = order.filter((id) => !tests[id]);
if (missing.length) throw new Error(`Missing tests: ${missing.join(', ')}`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const banner = '// GENERATED FILE. Source: persona-image.html via scripts/extract-test-data.mjs\n';
const body = `${banner}export const ORDER = ${JSON.stringify(order, null, 2)};\n\nexport const TESTS = ${JSON.stringify(tests, null, 2)};\n`;
fs.writeFileSync(outPath, body, 'utf8');
console.log(`Wrote ${path.relative(root, outPath)} (${Buffer.byteLength(body)} bytes)`);
