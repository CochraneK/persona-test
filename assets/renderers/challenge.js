import { el, renderTestHeader, appendHint } from '../core/ui.js';

function validCode(code, count) {
  return new RegExp(`^[01]{${count}}$`).test(String(code || ''));
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const box = document.createElement('textarea');
  box.value = text;
  box.style.position = 'fixed';
  box.style.opacity = '0';
  document.body.append(box);
  box.select();
  document.execCommand('copy');
  box.remove();
}

export function renderChallenge({ stage, test, challengeCode = '', onInvite, onPairResult, onRestart }) {
  const questions = test.questions || [];
  const partnerMode = validCode(challengeCode, questions.length);
  const answers = [];
  let index = 0;

  function renderInvite(code) {
    const card = el('section', 'challenge-invite result');
    card.setAttribute('aria-live', 'polite');
    card.append(el('div', 'rtype', '挑战链接已生成'));
    card.append(el('div', 'challenge-big', '🤝'));
    card.append(el('div', 'rname', '轮到你的朋友了'));
    card.append(el('div', 'rline', '「你的 6 个选择已经压进这个链接里，不会上传到服务器。」'));
    const note = el('div', 'challenge-code-note', `挑战码：${code}`);
    const row = el('div', 'btnrow');
    const copy = el('button', 'btn', '复制挑战链接');
    const share = el('button', 'btn ghost', '系统分享');
    const again = el('button', 'btn ghost', '重新答一次');
    copy.type = share.type = again.type = 'button';
    const status = el('div', 'share-note');

    copy.addEventListener('click', async () => {
      try {
        await copyText(location.href);
        status.textContent = '挑战链接已复制。';
      } catch {
        status.textContent = '复制失败，请从地址栏手动复制。';
      }
    });
    share.addEventListener('click', async () => {
      if (!navigator.share) {
        try {
          await copyText(location.href);
          status.textContent = '当前浏览器不支持系统分享，已改为复制链接。';
        } catch {
          status.textContent = '当前浏览器不支持系统分享。';
        }
        return;
      }
      try {
        await navigator.share({ title: test.name, text: '我已经答完 6 题，轮到你了。', url: location.href });
      } catch (error) {
        if (error?.name !== 'AbortError') status.textContent = '分享没有完成，可以改用复制链接。';
      }
    });
    again.addEventListener('click', onRestart);
    row.append(copy, share, again);
    card.append(note, row, status);
    stage.replaceChildren(card);
  }

  function finish() {
    const code = answers.join('');
    if (!partnerMode) {
      onInvite(code);
      renderInvite(code);
      return;
    }
    let matches = 0;
    for (let i = 0; i < questions.length; i++) if (code[i] === challengeCode[i]) matches += 1;
    const key = matches === questions.length ? 'soulmate' : matches >= 4 ? 'close' : matches >= 2 ? 'complement' : 'opposite';
    onPairResult(key, `<b>本轮默契：</b>${matches} / ${questions.length} 题相同`);
  }

  function renderQuestion() {
    if (index >= questions.length) return finish();
    renderTestHeader(stage, test);
    appendHint(stage, partnerMode ? '朋友已经先答完；现在按你自己的第一反应选。' : '先完成你的 6 个选择，答完后会生成一个挑战链接。');
    const host = el('div', 'challenge-host');
    const [prompt, left, right] = questions[index];
    host.append(el('div', 'prog', `${partnerMode ? '朋友挑战' : '发起挑战'} · ${index + 1} / ${questions.length}`));
    host.append(el('div', 'qtext', prompt));
    const options = el('div', 'challenge-options');
    [[left, '0'], [right, '1']].forEach(([label, bit]) => {
      const button = el('button', 'challenge-option', label);
      button.type = 'button';
      button.addEventListener('click', () => {
        answers.push(bit);
        index += 1;
        renderQuestion();
      }, { once: true });
      options.append(button);
    });
    host.append(options, el('p', 'challenge-privacy', '答案只编码在当前挑战链接中；项目没有账号、数据库或答题上传接口。'));
    stage.append(host);
  }

  renderQuestion();
  return () => {};
}
