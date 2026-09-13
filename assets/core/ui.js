export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

export function assetUrl(stem) {
  if (!stem) return '';
  if (stem.includes('.')) return stem.startsWith('img/') ? stem : `img/${stem}`;
  if (stem === 'cat_sphynx') return 'img/cat_sphynx.svg';
  return `img/${stem}.jpg`;
}

export function renderTestHeader(stage, test) {
  const head = el('div', 'qhead');
  head.append(el('div', 'badge', test.t), el('h2', '', test.name));
  const note = el('p', 'qnote', test.note || '');
  stage.replaceChildren(head, note);
}

export function appendHint(stage, text) {
  stage.append(el('p', 'hint', text));
}

export function nextTestId(order, id) {
  const i = Math.max(0, order.indexOf(id));
  return order[(i + 1) % order.length];
}

export function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  if (label) button.textContent = label;
}

export function safeScene(test, requested) {
  if (requested && test.scenes && test.scenes[requested]) return requested;
  return test.scenes?.long ? 'long' : Object.keys(test.scenes || {})[0] || '';
}
