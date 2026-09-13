import { el, renderTestHeader } from '../core/ui.js';

const PHASE1 = ['me','B','me','A','me','B'];
const PHASE3_FROM = ['A','B','C','A','B','C'];

export function renderCyberball({ stage, test, onResult }) {
  renderTestHeader(stage, test);

  const state = {
    holder: 'A',
    thinking: null,
    hasC: false,
    choice: null,
    p3: { A:0, B:0, C:0 },
    mirror: 0,
    active: true
  };
  const timers = new Set();
  const speed = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.15 : 1;

  const stat = el('div', 'cbstat');
  const board = el('div', 'cb');
  const actions = el('div', 'choices');
  stage.append(stat, board, actions);

  const schedule = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); if (state.active) fn(); }, Math.round(ms * speed));
    timers.add(id);
  };

  function position(id) {
    if (!state.hasC) return { A:[22,14], B:[78,14], me:[50,80] }[id];
    return { A:[18,16], B:[82,16], C:[18,82], me:[82,82] }[id];
  }

  function players() {
    const list = [
      { id:'me', emoji:'🙋', name:'你' },
      { id:'A', emoji:'🐨', name:'小A' },
      { id:'B', emoji:'🐰', name:'小B' }
    ];
    if (state.hasC) list.push({ id:'C', emoji:'🐣', name:'小C' });
    return list;
  }

  function paint() {
    board.replaceChildren();
    players().forEach((player) => {
      const pos = position(player.id);
      const node = el('div', `pl${player.id === 'me' ? ' me' : ''}${state.holder === player.id ? ' has' : ''}`);
      node.style.left = `${pos[0]}%`;
      node.style.top = `${pos[1]}%`;
      node.append(el('div', 'av', player.emoji), el('div', 'nm2', player.name));
      node.append(el('div', 'ball', state.holder === player.id ? '⚽' : ''));
      node.append(el('div', 'think', state.thinking === player.id ? '···' : ''));
      if (state.choice?.ids.includes(player.id)) node.classList.add('pick');
      board.append(node);
    });

    actions.replaceChildren();
    if (state.choice) {
      actions.append(el('div', 'hint choice-hint', '把球传给谁？'));
      const names = Object.fromEntries(players().map((p) => [p.id, p.name]));
      state.choice.ids.forEach((id) => {
        const button = el('button', 'btn ghost choice-btn', names[id] || id);
        button.type = 'button';
        button.dataset.pick = id;
        button.addEventListener('click', () => {
          const fn = state.choice?.fn;
          state.choice = null;
          paint();
          fn?.(id);
        }, { once:true });
        actions.append(button);
      });
    }
  }

  function ask(ids, fn) {
    state.choice = { ids, fn };
    paint();
  }

  function aiThrow(to, fn) {
    state.thinking = state.holder;
    paint();
    schedule(() => {
      state.thinking = null;
      state.holder = to;
      paint();
      schedule(fn, 260);
    }, 420);
  }

  function runP1(index) {
    if (index >= PHASE1.length) {
      stat.textContent = '第一轮结束——你拿到球 3 次。第二轮开始。';
      schedule(() => runP2(0), 700);
      return;
    }
    const to = PHASE1[index];
    stat.textContent = `第一轮 · 热身（第 ${index + 1}/${PHASE1.length} 次传递）`;
    if (to === 'me') {
      aiThrow('me', () => ask(['A','B'], (target) => {
        state.holder = target;
        paint();
        schedule(() => runP1(index + 1), 260);
      }));
    } else {
      aiThrow(to, () => runP1(index + 1));
    }
  }

  function runP2(index) {
    if (index >= 4) {
      state.hasC = true;
      paint();
      stat.textContent = '小C 加入了。接下来 6 次你都可以决定传给谁。';
      schedule(() => runP3(0), 850);
      return;
    }
    stat.innerHTML = `第二轮 · 你已经 <b>${index}</b> 次没拿到球了`;
    aiThrow(Math.random() < 0.5 ? 'A' : 'B', () => runP2(index + 1));
  }

  function runP3(index) {
    if (index >= PHASE3_FROM.length) return finish();
    const from = PHASE3_FROM[index];
    state.holder = from;
    paint();
    stat.textContent = `第三轮 · 第 ${index + 1}/${PHASE3_FROM.length} 次`;
    schedule(() => {
      aiThrow('me', () => ask(['A','B','C'], (target) => {
        state.p3[target]++;
        if (target === from) state.mirror++;
        if (target === 'C') {
          stat.textContent = '小C 接到球——它也会继续参与传递。';
          schedule(() => {
            const recipients = ['A','B','me'];
            aiThrow(recipients[Math.floor(Math.random() * recipients.length)], () => schedule(() => runP3(index + 1), 300));
          }, 450);
        } else {
          state.holder = target;
          paint();
          schedule(() => runP3(index + 1), 300);
        }
      }));
    }, 320);
  }

  function finish() {
    const p = state.p3;
    const spread = Math.max(p.A,p.B,p.C) - Math.min(p.A,p.B,p.C);
    const allThree = p.A >= 1 && p.B >= 1 && p.C >= 1;
    let key;
    if (p.C >= 3) key = 'care';
    else if (state.mirror >= 4) key = 'ledger';
    else if (p.A + p.B >= 4) key = 'forgive';
    else if (allThree && spread <= 1) key = 'turn';
    else key = 'careless';
    const stats = `传给小C <b>${p.C}</b> 次 · 传给小A/小B <b>${p.A+p.B}</b> 次 · 回传给刚传给你的人 <b>${state.mirror}</b> 次`;
    onResult(key, stats);
  }

  paint();
  runP1(0);

  return () => {
    state.active = false;
    state.choice = null;
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
