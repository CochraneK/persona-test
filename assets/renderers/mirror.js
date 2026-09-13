import { el, renderTestHeader, appendHint } from '../core/ui.js';

function bandKey(matches, total) {
  if (matches >= Math.max(total - 1, 1)) return 'aligned';
  if (matches >= Math.ceil(total / 2)) return 'stretch';
  if (matches >= 1) return 'contrast';
  return 'rewrite';
}

export function renderMirror({ stage, test, onResult }) {
  const questions = test.questions || [];
  const passLabels = test.passLabels || ['现在的我', '我想成为的我'];
  const first = [];
  const second = [];
  let pass = 0;
  let index = 0;

  function finish() {
    let matches = 0;
    const shifts = [];
    for (let i = 0; i < questions.length; i++) {
      if (first[i] === second[i]) matches += 1;
      else shifts.push(i);
    }
    const key = bandKey(matches, questions.length);
    const changed = shifts.length;
    const stat = `<b>方向一致：</b>${matches} / ${questions.length}<br><b>想调整：</b>${changed} 项`;
    onResult(key, stat);
  }

  function nextPass() {
    if (pass === 0) {
      pass = 1;
      index = 0;
      renderQuestion();
      return;
    }
    finish();
  }

  function renderQuestion() {
    if (index >= questions.length) return nextPass();
    renderTestHeader(stage, test);
    appendHint(stage, pass === 0
      ? (test.firstHint || `第一轮只按“${passLabels[0]}”来选，不考虑应该怎样。`)
      : (test.secondHint || `第二轮改按“${passLabels[1]}”来选。答案只在当前页面比较。`));

    const host = el('div', 'challenge-host mirror-host');
    const [prompt, left, right] = questions[index];
    host.append(el('div', 'prog', `${passLabels[pass]} · ${index + 1} / ${questions.length}`));
    host.append(el('div', 'qtext', prompt));
    const options = el('div', 'challenge-options');

    [[left, '0'], [right, '1']].forEach(([label, bit]) => {
      const button = el('button', 'challenge-option', label);
      button.type = 'button';
      button.addEventListener('click', () => {
        (pass === 0 ? first : second).push(bit);
        index += 1;
        renderQuestion();
      }, { once: true });
      options.append(button);
    });

    host.append(options, el('p', 'challenge-privacy', '两轮答案只存在于当前浏览器页面，不写入挑战链接，也不会上传。'));
    stage.append(host);
  }

  renderQuestion();
  return () => {};
}
