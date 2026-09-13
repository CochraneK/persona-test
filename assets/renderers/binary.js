import { el, renderTestHeader } from '../core/ui.js';

export function renderBinary({ stage, test, onResult }) {
  renderTestHeader(stage, test);
  const host = el('div', 'binary-host');
  const questions = test.questions || [];
  const score = { fast: 0, slow: 0, plan: 0, flow: 0 };
  let index = 0;

  function finish() {
    const pace = score.fast > score.slow ? 'fast' : 'slow';
    const control = score.plan > score.flow ? 'plan' : 'flow';
    const key = `${pace}_${control}`;
    const paceText = pace === 'fast' ? '快节奏' : '慢节奏';
    const controlText = control === 'plan' ? '高规划' : '高弹性';
    onResult(key, `<b>你的两条轴：</b>${paceText} · ${controlText}`);
  }

  function renderQuestion() {
    if (index >= questions.length) return finish();
    const q = questions[index];
    host.replaceChildren();
    host.append(el('div', 'prog', `${index + 1} / ${questions.length}`));
    host.append(el('div', 'qtext', q.prompt));
    const options = el('div', 'binary-options');
    q.options.forEach(([label, value]) => {
      const button = el('button', 'binary-option', label);
      button.type = 'button';
      button.addEventListener('click', () => {
        score[value] = (score[value] || 0) + 1;
        index += 1;
        renderQuestion();
      }, { once: true });
      options.append(button);
    });
    host.append(options);
  }

  stage.append(host);
  renderQuestion();
  return () => {};
}
