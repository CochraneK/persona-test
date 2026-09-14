import { getRecentTests, clearRecentTests } from './core/history.js';

const TESTS = [
  ['sync','双人默契挑战'],['guessme','你真的了解我吗'],['travelmate','旅行搭子适配'],['rhythm','关系节奏挑战'],
  ['selffuture','现在的我 vs 理想的我'],['priority','你会先守住什么'],['crossroads','决策节奏'],['budget','12 格精力怎么分'],
  ['room','房间人格'],['door','门后人格'],['drink','饮品人格'],['gem','宝石人格'],['season','四季人格'],['path','道路人格'],
  ['chair','会议室选椅子'],['balloon','气球风险小游戏'],['cyber','Cyberball 社会反应'],['dog','狗狗人格'],['cat','猫咪人格'],
  ['audio','乐器人格'],['animal','动物人格'],['food','食物人格'],['color','颜色人格'],['weather','天气人格'],['city','城市人格'],['flower','花朵人格']
];

function playUrl(id) {
  const url = new URL('play.html', location.href);
  url.searchParams.set('test', id);
  return url.href;
}

function randomTest() {
  const recentIds = new Set(getRecentTests().slice(0, 3).map((item) => item.id));
  const pool = TESTS.filter(([id]) => !recentIds.has(id));
  const source = pool.length ? pool : TESTS;
  return source[Math.floor(Math.random() * source.length)];
}

function addHeroActions() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const row = document.createElement('div');
  row.className = 'hero-actions';

  const random = document.createElement('a');
  random.className = 'hero-btn';
  random.href = '#';
  random.textContent = '🎲 随机来一个';
  random.addEventListener('click', (event) => {
    event.preventDefault();
    const [id] = randomTest();
    location.href = playUrl(id);
  });

  const social = document.createElement('a');
  social.className = 'hero-btn ghost';
  social.href = 'play.html?test=guessme';
  social.textContent = '🧠 考考朋友';

  row.append(random, social);
  hero.append(row);
}

function addRecentSection() {
  const recent = getRecentTests();
  if (!recent.length) return;
  const firstSection = document.querySelector('main > section');
  if (!firstSection) return;

  const section = document.createElement('section');
  section.className = 'recent-section';
  section.setAttribute('aria-labelledby', 'recent-title');
  const head = document.createElement('div');
  head.className = 'section-head recent-head';
  const text = document.createElement('div');
  text.innerHTML = '<h2 id="recent-title">最近玩过</h2><p>只保存在这台设备的浏览器里，不上传。</p>';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'clear-recent';
  clear.textContent = '清除记录';
  clear.addEventListener('click', () => {
    clearRecentTests();
    section.remove();
  });
  head.append(text, clear);

  const strip = document.createElement('div');
  strip.className = 'recent-strip';
  recent.forEach((item) => {
    const a = document.createElement('a');
    a.href = playUrl(item.id);
    a.className = 'recent-chip';
    a.innerHTML = `<span>${item.name}</span><b>再玩一次 →</b>`;
    strip.append(a);
  });
  section.append(head, strip);
  firstSection.before(section);
}

addHeroActions();
addRecentSection();
