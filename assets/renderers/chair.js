import { el, renderTestHeader, safeScene } from '../core/ui.js';

const ROOM = '<defs><pattern id="cvgrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#e9eef5" stroke-width="1"/></pattern><filter id="cvds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#142A40" flood-opacity="0.16"/></filter></defs><rect class="cv-room-line" x="36" y="36" width="608" height="448" rx="18"/><rect x="36" y="36" width="608" height="448" rx="18" fill="url(#cvgrid)"/>';

function chairSvg(c) {
  const { id, cx, cy, dir } = c;
  let back = '';
  if (dir === 'L') back = `<rect class="cvback" x="${cx-35}" y="${cy-20}" width="13" height="40" rx="5"/>`;
  else if (dir === 'R') back = `<rect class="cvback" x="${cx+22}" y="${cy-20}" width="13" height="40" rx="5"/>`;
  else if (dir === 'B') back = `<rect class="cvback" x="${cx-20}" y="${cy+22}" width="40" height="13" rx="5"/>`;
  else if (dir === 'T') back = `<rect class="cvback" x="${cx-20}" y="${cy-35}" width="40" height="13" rx="5"/>`;
  return `<g class="cv" data-id="${id}" role="button" tabindex="0" aria-label="选择椅子 ${id}">${back}<rect class="cvseat" x="${cx-22}" y="${cy-22}" width="44" height="44" rx="10"/><circle class="cvring" cx="${cx}" cy="${cy}" r="30"/><circle class="cvbadge" cx="${cx}" cy="${cy}" r="15"/><text class="cvnum" x="${cx}" y="${cy+5}" text-anchor="middle">${id}</text><rect class="cvhit" x="${cx-30}" y="${cy-30}" width="60" height="60"/></g>`;
}

export function renderChair({ stage, test, initialScene = '', onScene, onResult }) {
  let scene = safeScene(test, initialScene);

  function paint() {
    renderTestHeader(stage, test);
    const tabs = el('div', 'ctabs');
    Object.entries(test.scenes || {}).forEach(([key, value]) => {
      const button = el('button', `ctab${key === scene ? ' active' : ''}`, value.name);
      button.type = 'button';
      button.setAttribute('aria-pressed', key === scene ? 'true' : 'false');
      button.addEventListener('click', () => {
        scene = key;
        onScene?.(scene);
        paint();
      });
      tabs.append(button);
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'cvroom');
    svg.setAttribute('viewBox', '0 0 680 520');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${test.scenes[scene].name}俯视图`);
    svg.innerHTML = `<g>${ROOM}${test.scenes[scene].table}</g><g>${test.scenes[scene].chairs.map(chairSvg).join('')}</g>`;

    const hint = el('p', 'hint', '凭第一反应选一把椅子。座位解释仅用于娱乐化投射，没有标准答案。');
    stage.append(tabs, svg, hint);

    svg.querySelectorAll('.cv').forEach((g) => {
      const choose = () => {
        svg.querySelectorAll('.cv').forEach((x) => {
          x.classList.toggle('selected', x === g);
          x.classList.toggle('dim', x !== g);
        });
        onResult(g.dataset.id, scene);
      };
      g.addEventListener('click', choose, { once: true });
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose();
        }
      }, { once: true });
    });
  }

  paint();
  return () => {};
}
