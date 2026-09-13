import { el, assetUrl, renderTestHeader, appendHint } from '../core/ui.js';

export function renderGrid({ stage, test, onResult }) {
  renderTestHeader(stage, test);
  appendHint(stage, '凭第一反应点一个，没有标准答案。');

  const isSwatch = test.kind === 'swatch';
  const grid = el('div', isSwatch ? 'sgrid' : 'egrid');

  for (const item of test.items || []) {
    const [visual, label, key] = item;
    const button = el('button', isSwatch ? 'sitem' : 'eitem');
    button.type = 'button';
    button.dataset.key = key;
    button.setAttribute('aria-label', label);

    if (isSwatch) {
      button.style.background = visual;
      button.append(el('span', 'nm', label));
    } else {
      const img = el('img');
      img.src = assetUrl(visual);
      img.alt = label;
      img.loading = 'lazy';
      img.decoding = 'async';
      button.append(img, el('span', 'nm', label));
    }

    button.addEventListener('click', () => {
      grid.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === button));
      const image = isSwatch ? '' : assetUrl(visual);
      setTimeout(() => onResult(key, image), 120);
    }, { once: true });
    grid.append(button);
  }

  stage.append(grid);
  return () => {};
}
