import { el, assetUrl } from './ui.js';
import { installShareActions } from './share.js';

function tags(text) {
  return String(text || '').split('|').map((x) => x.trim()).filter(Boolean);
}

function resultMeta(test, key, imageOverride = '') {
  const raw = test.results?.[key];
  if (!raw) return null;
  const hasImage = raw.length >= 6;
  const offset = hasImage ? 1 : 0;
  const image = imageOverride || (hasImage ? assetUrl(raw[0]) : '');
  return {
    key,
    image,
    name: raw[offset],
    line: raw[offset + 1],
    tags: tags(raw[offset + 2]),
    blind: raw[offset + 3],
    copy: raw[offset + 4]
  };
}

function imageNode(src, alt) {
  if (!src) return null;
  const img = el('img', 'rimg');
  img.src = src;
  img.alt = alt || '';
  img.loading = 'eager';
  img.decoding = 'async';
  return img;
}

function actionRow(onAgain, onNext, againLabel = '再玩一次') {
  const row = el('div', 'btnrow');
  const again = el('button', 'btn', againLabel);
  again.type = 'button';
  again.addEventListener('click', onAgain);
  const next = el('button', 'btn ghost', '换一个测验');
  next.type = 'button';
  next.addEventListener('click', onNext);
  row.append(again, next);
  return row;
}

export function renderStandardResult({ stage, id, test, key, image = '', stats = '', onAgain, onNext }) {
  const meta = resultMeta(test, key, image);
  if (!meta) return false;

  const card = el('section', 'result');
  card.setAttribute('aria-live', 'polite');
  card.append(el('div', 'rtype', `你的结果 · ${test.name}`));
  const img = imageNode(meta.image, meta.name);
  if (img) card.append(img);
  card.append(el('div', 'rname', meta.name));
  card.append(el('div', 'rline', `「${meta.line}」`));

  const tagWrap = el('div', 'tags');
  meta.tags.forEach((tag) => tagWrap.append(el('span', 'chip', tag)));
  card.append(tagWrap);
  card.append(el('div', 'blind', `盲区：${meta.blind}`));

  if (stats) {
    const stat = el('div', 'rstats');
    stat.innerHTML = stats;
    card.append(stat);
  }

  const copy = el('div', 'copy');
  copy.append(el('b', '', '可晒文案'));
  copy.append(document.createTextNode(meta.copy));
  card.append(copy, actionRow(onAgain, onNext));
  stage.replaceChildren(card);

  installShareActions(card, {
    type: `你的结果 · ${test.name}`,
    name: meta.name,
    line: meta.line,
    tags: meta.tags,
    copy: meta.copy,
    image: img
  });
  return true;
}

const DIMENSIONS = [
  ['act', '主动进取'],
  ['ind', '独立思考'],
  ['soc', '社交亲和'],
  ['risk', '风险偏好'],
  ['auth', '权威亲近']
];

export function renderChairResult({ stage, test, seatId, scene, onAgain, onNext }) {
  const result = test.chairs?.[seatId];
  const sceneData = test.scenes?.[scene];
  if (!result || !sceneData) return false;

  const card = el('section', 'result');
  card.setAttribute('aria-live', 'polite');
  const type = `你的落座人格 · 椅子 ${seatId} · ${sceneData.name}`;
  card.append(el('div', 'rtype', type));
  card.append(el('div', 'crpick', result.icon));
  card.append(el('div', 'rname', result.name));
  card.append(el('div', 'cren', result.en));
  card.append(el('div', 'rline', `「${result.quote}」`));

  const tagWrap = el('div', 'tags');
  result.tags.forEach((tag) => tagWrap.append(el('span', 'chip', tag)));
  card.append(tagWrap, el('div', 'csec', '你的特点'));

  const features = el('ul', 'cfeat');
  result.feat.forEach((feature) => features.append(el('li', '', feature)));
  card.append(features, el('div', 'csec', '五维人格画像'));

  const bars = el('div', 'cbars');
  DIMENSIONS.forEach(([key, label]) => {
    const value = Number(result.dim?.[key] || 0);
    const row = el('div', 'cbar-row');
    row.append(el('span', 'cbar-label', label));
    const track = el('span', 'cbar-track');
    const fill = el('span', `cbar-fill dim-${key}`);
    fill.style.setProperty('--value', `${value}%`);
    track.append(fill);
    row.append(track, el('span', 'cbar-val', String(value)));
    bars.append(row);
  });
  card.append(bars);
  card.append(el('div', 'blind', `盲区：${result.blind}`));

  const copy = el('div', 'copy');
  copy.append(el('b', '', '可晒文案'));
  copy.append(document.createTextNode(result.copy));
  card.append(copy, actionRow(onAgain, onNext, '再选一次'));
  stage.replaceChildren(card);

  requestAnimationFrame(() => {
    card.querySelectorAll('.cbar-fill').forEach((bar) => { bar.style.width = bar.style.getPropertyValue('--value'); });
  });

  installShareActions(card, {
    type,
    name: result.name,
    line: result.quote,
    tags: result.tags,
    copy: result.copy,
    image: null
  });
  return true;
}
