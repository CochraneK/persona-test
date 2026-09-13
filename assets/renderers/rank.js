import { el, renderTestHeader, appendHint } from '../core/ui.js';

export function renderRank({ stage, test, onResult }) {
  renderTestHeader(stage, test);
  appendHint(stage, '依次点出前三名；已经选过的项目不会重复进入排序。');

  const selected = [];
  const itemMap = new Map((test.items || []).map((item) => [item[2], item]));
  const summary = el('div', 'rank-summary');
  const grid = el('div', 'rank-grid');
  const actions = el('div', 'rank-actions');
  const undo = el('button', 'btn ghost', '撤销上一个');
  const done = el('button', 'btn', '查看结果');
  undo.type = done.type = 'button';
  undo.disabled = true;
  done.disabled = true;

  function update() {
    summary.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const key = selected[i];
      const item = key ? itemMap.get(key) : null;
      const slot = el('div', `rank-slot${item ? ' filled' : ''}`);
      slot.append(el('span', 'rank-no', String(i + 1)));
      slot.append(el('span', 'rank-slot-text', item ? `${item[0]} ${item[1]}` : '待选择'));
      summary.append(slot);
    }
    grid.querySelectorAll('.rank-option').forEach((button) => {
      const index = selected.indexOf(button.dataset.key);
      button.classList.toggle('picked', index >= 0);
      button.disabled = index >= 0 || selected.length >= 3;
      const badge = button.querySelector('.rank-order');
      if (badge) badge.textContent = index >= 0 ? `第 ${index + 1}` : '';
    });
    undo.disabled = selected.length === 0;
    done.disabled = selected.length !== 3;
  }

  for (const [icon, label, key, desc] of test.items || []) {
    const button = el('button', 'rank-option');
    button.type = 'button';
    button.dataset.key = key;
    const top = el('div', 'rank-option-top');
    top.append(el('span', 'rank-icon', icon), el('span', 'rank-label', label), el('span', 'rank-order'));
    button.append(top, el('span', 'rank-desc', desc));
    button.addEventListener('click', () => {
      if (selected.length >= 3 || selected.includes(key)) return;
      selected.push(key);
      update();
    });
    grid.append(button);
  }

  undo.addEventListener('click', () => {
    selected.pop();
    update();
  });
  done.addEventListener('click', () => {
    if (selected.length !== 3) return;
    const labels = selected.map((key) => itemMap.get(key)?.[1] || key);
    onResult(selected[0], `<b>你的前三：</b>${labels.join(' → ')}`);
  });

  actions.append(undo, done);
  stage.append(summary, grid, actions);
  update();
  return () => {};
}
