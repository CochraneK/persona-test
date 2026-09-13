import { ORDER, TESTS } from './data/test-data.js';
import { readRoute, writeRoute, SHAREABLE_RESULT_TESTS } from './core/router.js';
import { nextTestId, safeScene } from './core/ui.js';
import { renderStandardResult, renderChairResult } from './core/result.js';
import { renderGrid } from './renderers/grid.js';
import { renderMbti } from './renderers/mbti.js';
import { renderChair } from './renderers/chair.js';
import { renderBalloon } from './renderers/balloon.js';
import { renderCyberball } from './renderers/cyberball.js';

const stage = document.getElementById('stage');
const tabs = document.getElementById('tabs');
let cleanup = () => {};
let currentId = '';

function next(id) {
  go(nextTestId(ORDER, id), { historyMode: 'push' });
}

function again(id, scene = '') {
  go(id, { scene, historyMode: 'replace' });
}

function scrollTop() {
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  window.scrollTo({ top: 0, behavior });
}

function setActiveTab(id) {
  tabs.querySelectorAll('button').forEach((button) => {
    const active = button.dataset.test === id;
    button.classList.toggle('on', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function showDeepLinkedResult(id, test, result, scene) {
  if (!result || !SHAREABLE_RESULT_TESTS.has(id)) return false;
  if (test.kind === 'chair') {
    const safe = safeScene(test, scene);
    return renderChairResult({
      stage, test, seatId: result, scene: safe,
      onAgain: () => again(id, safe),
      onNext: () => next(id)
    });
  }
  return renderStandardResult({
    stage, id, test, key: result,
    onAgain: () => again(id),
    onNext: () => next(id)
  });
}

function launchRenderer(id, test, scene) {
  const base = { stage, test };
  if (test.kind === 'grid' || test.kind === 'swatch') {
    return renderGrid({ ...base, onResult: (key, image) => {
      writeRoute(id, key);
      renderStandardResult({ stage, id, test, key, image, onAgain: () => again(id), onNext: () => next(id) });
    }});
  }
  if (test.kind === 'mbti') {
    return renderMbti({ ...base, onResult: (key) => {
      writeRoute(id, key);
      renderStandardResult({ stage, id, test, key, onAgain: () => again(id), onNext: () => next(id) });
    }});
  }
  if (test.kind === 'chair') {
    const initialScene = safeScene(test, scene);
    return renderChair({
      ...base,
      initialScene,
      onScene: (nextScene) => writeRoute(id, '', nextScene),
      onResult: (seatId, selectedScene) => {
        writeRoute(id, seatId, selectedScene);
        renderChairResult({ stage, test, seatId, scene: selectedScene, onAgain: () => again(id, selectedScene), onNext: () => next(id) });
      }
    });
  }
  if (test.kind === 'balloon') {
    return renderBalloon({ ...base, onResult: (key, stats) => {
      writeRoute(id);
      renderStandardResult({ stage, id, test, key, stats, onAgain: () => again(id), onNext: () => next(id) });
    }});
  }
  return renderCyberball({ ...base, onResult: (key, stats) => {
    writeRoute(id);
    renderStandardResult({ stage, id, test, key, stats, onAgain: () => again(id), onNext: () => next(id) });
  }});
}

export function go(requestedId, options = {}) {
  cleanup();
  cleanup = () => {};

  const requestedValid = Boolean(TESTS[requestedId]);
  const id = requestedValid ? requestedId : 'chair';
  const test = TESTS[id];
  currentId = id;
  setActiveTab(id);
  document.title = `${test.name} · Persona Test`;

  const route = options.route || { result: '', scene: options.scene || '' };
  const requestedScene = options.scene || route.scene || '';
  const scene = id === 'chair' ? safeScene(test, requestedScene) : '';
  const shouldWrite = options.syncRoute !== false;

  if (shouldWrite) writeRoute(id, route.result || '', scene, options.historyMode || 'replace');

  const restored = showDeepLinkedResult(id, test, route.result, scene);
  if (restored) {
    if (!shouldWrite && (!requestedValid || (id === 'chair' && requestedScene !== scene) || (id !== 'chair' && requestedScene))) {
      writeRoute(id, route.result, scene, 'replace');
    }
    scrollTop();
    window.__PERSONA_READY__ = true;
    return;
  }

  if (!shouldWrite && (!requestedValid || route.result || requestedScene !== scene)) {
    writeRoute(id, '', scene, 'replace');
  } else if (shouldWrite && route.result) {
    writeRoute(id, '', scene, 'replace');
  }

  cleanup = launchRenderer(id, test, scene) || (() => {});
  scrollTop();
  window.__PERSONA_READY__ = true;
}

function buildTabs() {
  tabs.replaceChildren();
  ORDER.forEach((id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.test = id;
    button.textContent = TESTS[id].t;
    button.addEventListener('click', () => go(id, { historyMode: 'push' }));
    tabs.append(button);
  });
}

buildTabs();
const initial = readRoute();
go(initial.test, { route: initial, syncRoute: false });

window.addEventListener('popstate', () => {
  const route = readRoute();
  go(route.test, { route, syncRoute: false });
});

window.addEventListener('beforeunload', () => cleanup(), { once: true });

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

window.__PERSONA_APP__ = { get currentTest() { return currentId; }, go };
