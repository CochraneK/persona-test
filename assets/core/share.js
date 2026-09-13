import { el } from './ui.js';
import { shareUrl } from './router.js';

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      ok ? resolve() : reject(new Error('copy failed'));
    } catch (error) {
      reject(error);
    }
  });
}

function resultText(meta) {
  const lead = meta.copy || `我的人格测试结果：${meta.name}`;
  const details = [
    meta.name,
    meta.line,
    meta.tags?.length ? `#${meta.tags.join(' #')}` : ''
  ].filter(Boolean).join('\n');
  return `${lead}\n\n${details}\n\n你也来测：${shareUrl()}`;
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const chars = Array.from(String(text || ''));
  const out = [];
  let line = '';
  let i = 0;
  for (; i < chars.length; i++) {
    const next = line + chars[i];
    if (ctx.measureText(next).width > maxWidth && line) {
      out.push(line);
      line = chars[i];
      if (out.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line && out.length < maxLines) out.push(line);
  if (i < chars.length && out.length) {
    const last = out.length - 1;
    while (ctx.measureText(`${out[last]}…`).width > maxWidth && out[last]) out[last] = out[last].slice(0, -1);
    out[last] += '…';
  }
  return out;
}

function drawLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function drawCover(ctx, image, x, y, w, h) {
  if (!image?.naturalWidth || !image?.naturalHeight) return false;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
  if (imageRatio > boxRatio) {
    sw = image.naturalHeight * boxRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / boxRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  ctx.save();
  roundedRect(ctx, x, y, w, h, 34);
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
  return true;
}

async function makePoster(meta) {
  if (meta.image && !meta.image.complete) {
    await meta.image.decode().catch(() => {});
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  const font = '-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';

  ctx.fillStyle = '#F7FBFA';
  ctx.fillRect(0, 0, 1080, 1440);
  ctx.fillStyle = '#142A40';
  ctx.fillRect(0, 0, 1080, 190);
  ctx.fillStyle = '#72D5CC';
  ctx.font = `700 30px ${font}`;
  ctx.fillText('PERSONA TEST', 72, 78);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 48px ${font}`;
  ctx.fillText('人格投射测验', 72, 140);

  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, 54, 225, 972, 1125, 42);
  ctx.fill();

  let y = 290;
  if (drawCover(ctx, meta.image, 72, y, 936, 390)) y += 438;

  ctx.fillStyle = '#24A69E';
  ctx.font = `700 24px ${font}`;
  y = drawLines(ctx, wrapLines(ctx, meta.type, 880, 2), 82, y, 34) + 34;

  ctx.fillStyle = '#142A40';
  ctx.font = `800 64px ${font}`;
  y = drawLines(ctx, wrapLines(ctx, meta.name, 880, 2), 82, y, 78) + 22;

  ctx.fillStyle = '#738796';
  ctx.font = `500 31px ${font}`;
  y = drawLines(ctx, wrapLines(ctx, meta.line, 880, 3), 82, y, 45) + 24;

  let tx = 82;
  ctx.font = `700 24px ${font}`;
  for (const tag of (meta.tags || []).slice(0, 4)) {
    const width = ctx.measureText(tag).width + 44;
    if (tx + width > 998) break;
    ctx.fillStyle = '#EAF7F4';
    roundedRect(ctx, tx, y - 28, width, 48, 24);
    ctx.fill();
    ctx.fillStyle = '#1C857D';
    ctx.fillText(tag, tx + 22, y + 5);
    tx += width + 14;
  }
  y += 70;

  if (meta.copy && y < 1150) {
    ctx.fillStyle = '#F3FAF8';
    roundedRect(ctx, 72, y, 936, 170, 28);
    ctx.fill();
    ctx.fillStyle = '#F29A49';
    ctx.font = `800 20px ${font}`;
    ctx.fillText('可晒文案', 98, y + 42);
    ctx.fillStyle = '#263746';
    ctx.font = `600 29px ${font}`;
    drawLines(ctx, wrapLines(ctx, meta.copy, 830, 3), 98, y + 88, 40);
  }

  ctx.strokeStyle = '#DCE8E8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(82, 1260);
  ctx.lineTo(998, 1260);
  ctx.stroke();
  ctx.fillStyle = '#738796';
  ctx.font = `500 22px ${font}`;
  ctx.fillText('娱乐向结果 · 不构成心理诊断', 82, 1308);
  ctx.fillStyle = '#142A40';
  ctx.font = `700 22px ${font}`;
  ctx.fillText('cochranek.github.io/persona-test/', 82, 1348);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('poster failed')), 'image/png', 0.95);
  });
}

async function savePoster(meta, note) {
  note.textContent = '正在生成结果海报…';
  try {
    const blob = await makePoster(meta);
    const safe = (meta.name || 'persona-result').replace(/[\\/:*?"<>|\s]+/g, '-');
    const file = new File([blob], `${safe}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Persona Test · ${meta.name}`, text: '这是我的人格测试结果。' });
      note.textContent = '海报已生成';
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    note.textContent = '结果海报已保存';
  } catch {
    note.textContent = '海报生成失败，请稍后重试';
  }
}

export function installShareActions(card, meta) {
  const row = card.querySelector('.btnrow');
  if (!row || card.dataset.shareReady === '1') return;
  card.dataset.shareReady = '1';

  const copy = el('button', 'btn ghost', '复制结果');
  copy.type = 'button';
  const share = el('button', 'btn ghost', navigator.share ? '分享结果' : '复制分享链接');
  share.type = 'button';
  const poster = el('button', 'btn ghost poster-btn', '生成结果海报');
  poster.type = 'button';
  const note = el('div', 'share-note');
  note.setAttribute('aria-live', 'polite');

  copy.addEventListener('click', async () => {
    try {
      await copyText(resultText(meta));
      note.textContent = '已复制结果文案';
    } catch {
      note.textContent = '复制失败，请长按选择文案';
    }
  });

  share.addEventListener('click', async () => {
    const text = resultText(meta).replace(/\n\n你也来测：.*$/s, '');
    if (navigator.share) {
      try { await navigator.share({ title: `Persona Test · ${meta.name}`, text, url: shareUrl() }); } catch {}
      return;
    }
    try {
      await copyText(shareUrl());
      note.textContent = '已复制结果链接';
    } catch {
      note.textContent = '复制失败';
    }
  });

  poster.addEventListener('click', () => savePoster(meta, note));
  row.append(copy, share, poster);
  card.append(note);
}
