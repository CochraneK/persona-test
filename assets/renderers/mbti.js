import { el, renderTestHeader } from '../core/ui.js';

const DIMENSIONS = [['E','I'],['S','N'],['T','F'],['J','P']];

export function renderMbti({ stage, test, onResult }) {
  renderTestHeader(stage, test);
  const host = el('div', 'mbti-host');
  stage.append(host);

  const state = {
    index: 0,
    score: { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 }
  };

  function finish() {
    const type = DIMENSIONS.map(([a,b]) => state.score[a] > state.score[b] ? a : b).join('');
    onResult(type, `MBTI 类型：${type}`);
  }

  function paint() {
    const q = test.qs[state.index];
    if (!q) return finish();
    host.replaceChildren();
    host.append(el('div', 'prog', `第 ${state.index + 1} / ${test.qs.length} 题`));
    host.append(el('div', 'qtext', q.prompt));
    const opts = el('div', 'opts');
    q.options.forEach((option) => {
      const button = el('button', 'opt', option.label);
      button.type = 'button';
      button.addEventListener('click', () => {
        state.score[option.value]++;
        state.index++;
        paint();
      }, { once: true });
      opts.append(button);
    });
    host.append(opts);
  }

  paint();
  return () => {};
}
