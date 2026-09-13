import { el, renderTestHeader } from '../core/ui.js';

function roll() {
  return 4 + Math.floor(Math.random() * 17);
}

export function renderBalloon({ stage, test, onResult }) {
  renderTestHeader(stage, test);

  const state = {
    trial: 0,
    pumps: 0,
    temp: 0,
    total: 0,
    pops: 0,
    sumPumps: 0,
    popAt: roll(),
    trials: 5,
    locked: false,
    active: true
  };

  const wrap = el('div', 'bl');
  const slot = el('div', 'blslot');
  const balloon = el('button', 'balloon');
  balloon.type = 'button';
  balloon.id = 'balloon-pump';
  balloon.setAttribute('aria-label', '给气球打气');
  slot.append(balloon);

  const pumps = el('div', 'pumps');
  const actions = el('div', 'blrow');
  const pump = el('button', 'btn', '打气 +2');
  pump.type = 'button';
  const bank = el('button', 'btn ghost', '收下得分');
  bank.type = 'button';
  actions.append(pump, bank);
  const hint = el('div', 'hint', '手机可点“打气 +2”或气球；桌面也支持空格键。');
  const stats = el('div', 'bstat');
  wrap.append(slot, pumps, actions, hint, stats);
  stage.append(wrap);

  const timers = new Set();
  const schedule = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); if (state.active) fn(); }, ms);
    timers.add(id);
  };

  function lock(value) {
    state.locked = value;
    pump.disabled = value;
    bank.disabled = value;
    balloon.disabled = value;
  }

  function paint() {
    const scale = Math.min(1.22, 1 + state.pumps * 0.016);
    balloon.style.transform = `scale(${scale})`;
    pumps.textContent = `本轮已打气 ${state.pumps} 次 · 当前可收 ${state.temp} 分`;
    stats.innerHTML = `第 ${state.trial + 1}/${state.trials} 个气球 · 总分 <b>${state.total}</b> · 已爆 <b>${state.pops}</b>`;
  }

  function finish() {
    const avg = state.sumPumps / state.trials;
    let key = avg <= 3 ? 'safe' : avg <= 6 ? 'steady' : avg <= 10 ? 'balance' : avg <= 14 ? 'risk' : 'wild';
    if (state.pops >= 3 && (key === 'balance' || key === 'risk')) key = key === 'balance' ? 'risk' : 'wild';
    onResult(key, `总分 <b>${state.total}</b> 分 · 爆掉 <b>${state.pops}/${state.trials}</b> · 平均打气 <b>${avg.toFixed(1)}</b> 次`);
  }

  function next() {
    state.trial++;
    state.temp = 0;
    state.pumps = 0;
    state.popAt = roll();
    if (state.trial >= state.trials) return finish();
    balloon.classList.remove('pop');
    lock(false);
    paint();
  }

  function doPump() {
    if (state.locked || !state.active) return;
    state.pumps++;
    state.sumPumps++;
    state.temp += 2;
    if (state.pumps >= state.popAt) {
      state.pops++;
      balloon.classList.add('pop');
      pumps.textContent = `爆了！这轮 ${state.temp} 分没了`;
      stats.innerHTML = `第 ${state.trial + 1}/${state.trials} 个气球 · 总分 <b>${state.total}</b> · 已爆 <b>${state.pops}</b>`;
      lock(true);
      schedule(next, 900);
      return;
    }
    paint();
  }

  function doBank() {
    if (state.locked || !state.active) return;
    state.total += state.temp;
    pumps.textContent = `收下 ${state.temp} 分`;
    lock(true);
    schedule(next, 550);
  }

  pump.addEventListener('click', doPump);
  balloon.addEventListener('click', doPump);
  bank.addEventListener('click', doBank);

  const onKey = (event) => {
    if ((event.code === 'Space' || event.key === ' ') && !event.repeat && !state.locked) {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
      event.preventDefault();
      doPump();
    }
  };
  document.addEventListener('keydown', onKey);
  paint();

  return () => {
    state.active = false;
    document.removeEventListener('keydown', onKey);
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
