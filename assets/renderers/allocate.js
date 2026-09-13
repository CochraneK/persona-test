import { el, renderTestHeader, appendHint } from '../core/ui.js';

export function renderAllocate({ stage, test, onResult }) {
  renderTestHeader(stage, test);
  appendHint(stage, `一共 ${test.total || 12} 格；可以反复加减，直到全部分完。`);

  const total = Number(test.total || 12);
  const values = Object.fromEntries((test.buckets || []).map((bucket) => [bucket[2], 0]));
  const grid = el('div', 'alloc-grid');
  const meter = el('div', 'alloc-meter');
  const done = el('button', 'btn alloc-done', '还没分完');
  done.type = 'button';
  done.disabled = true;

  function used() {
    return Object.values(values).reduce((sum, value) => sum + value, 0);
  }

  function update() {
    const current = used();
    meter.textContent = `已分配 ${current} / ${total} 格`;
    grid.querySelectorAll('.alloc-card').forEach((card) => {
      const key = card.dataset.key;
      const count = values[key] || 0;
      card.querySelector('.alloc-count').textContent = String(count);
      card.querySelector('.alloc-minus').disabled = count <= 0;
      card.querySelector('.alloc-plus').disabled = current >= total;
    });
    done.disabled = current !== total;
    done.textContent = current === total ? '查看分配结果' : `还剩 ${total - current} 格`;
  }

  for (const [icon, label, key, desc] of test.buckets || []) {
    const card = el('section', 'alloc-card');
    card.dataset.key = key;
    const head = el('div', 'alloc-head');
    head.append(el('span', 'alloc-icon', icon), el('strong', 'alloc-label', label));
    const controls = el('div', 'alloc-controls');
    const minus = el('button', 'alloc-step alloc-minus', '−');
    const plus = el('button', 'alloc-step alloc-plus', '+');
    minus.type = plus.type = 'button';
    minus.setAttribute('aria-label', `${label}减少一格`);
    plus.setAttribute('aria-label', `${label}增加一格`);
    const count = el('span', 'alloc-count', '0');
    minus.addEventListener('click', () => {
      if (values[key] <= 0) return;
      values[key] -= 1;
      update();
    });
    plus.addEventListener('click', () => {
      if (used() >= total) return;
      values[key] += 1;
      update();
    });
    controls.append(minus, count, plus);
    card.append(head, el('p', 'alloc-desc', desc), controls);
    grid.append(card);
  }

  done.addEventListener('click', () => {
    if (used() !== total) return;
    const rows = (test.buckets || []).map((bucket) => ({ key: bucket[2], label: bucket[1], value: values[bucket[2]] || 0 }));
    rows.sort((a, b) => b.value - a.value);
    const key = rows[0].value - rows[1].value >= 2 ? rows[0].key : 'balance';
    const summary = rows.map((row) => `${row.label} ${row.value}`).join(' · ');
    onResult(key, `<b>你的分配：</b>${summary}`);
  });

  stage.append(meter, grid, done);
  update();
  return () => {};
}
