export const SHAREABLE_RESULT_TESTS = new Set([
  'chair','dog','cat','audio','animal','food','color','weather','city','flower'
]);

export function readRoute() {
  const p = new URLSearchParams(location.search);
  return {
    test: p.get('test') || 'chair',
    result: p.get('result') || '',
    scene: p.get('scene') || ''
  };
}

export function writeRoute(test, result = '', scene = '', mode = 'replace') {
  const url = new URL(location.href);
  url.searchParams.set('test', test);
  if (result && SHAREABLE_RESULT_TESTS.has(test)) url.searchParams.set('result', result);
  else url.searchParams.delete('result');
  if (test === 'chair' && scene) url.searchParams.set('scene', scene);
  else url.searchParams.delete('scene');
  const next = url.pathname + url.search + url.hash;
  if (mode === 'push') history.pushState(null, '', next);
  else history.replaceState(null, '', next);
}

export function shareUrl() {
  return location.href;
}
