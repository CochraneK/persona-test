# Persona Test · 人格投射测验

一组轻量、可玩、可分享的人格投射与互动小游戏。项目保持 **纯静态 HTML / CSS / JavaScript**，无需登录、无需后端、默认无埋点，可直接部署到 GitHub Pages。

在线访问：<https://cochranek.github.io/persona-test/>

## 当前版本

首页提供 **22 个测试入口**，覆盖 9 类交互方式。

### 互动新玩法 4 个

- 🥇 **你会先守住什么**：从 6 个价值选项中依次排出前三名；第一名决定主结果，前三顺序进入本轮摘要。
- ↔️ **决策节奏**：连续 6 个二选一，组合“快 / 慢”和“规划 / 弹性”两条轴。
- 🔋 **12 格精力怎么分**：把有限资源分给自己、关系、目标和安全感，再按分配结构生成结果。
- 🤝 **双人默契挑战**：第一位玩家完成 6 个二选一并生成挑战链接，第二位打开同一链接作答，浏览器本地计算相似度。

### 10 秒直觉系列 6 个

- 🪟 房间人格
- 🚪 门后人格
- 🧋 饮品人格
- 💎 宝石人格
- 🍂 四季人格
- 🛣️ 道路人格

### 经典 12 个

- 🪑 会议室选椅子
- 🎈 气球风险小游戏
- ⚽ 抛球社会反应
- 🐶 犬系 MBTI
- 🐱 猫系 MBTI
- 🎧 音乐人格
- 🦊 动物人格
- 🍜 食物人格
- 🎨 颜色人格
- 🌦️ 天气人格
- 🏙️ 城市人格
- 🌸 花系人格

推荐游玩入口是 [`play.html`](play.html)。正式应用由独立数据层、核心模块和 renderer 直接运行，不使用 iframe。

## 玩家体验

- 首页优先展示 4 种新交互，其次是 6 个快速 symbol 测试和 12 个经典玩法。
- 静态结果支持 `?test=...&result=...` 深链接、复制结果、系统分享和 1080×1440 PNG 海报。
- 双人默契挑战不需要账号或数据库：第一位玩家的 6 个答案压缩成 `challenge=010101` 一类 URL 参数，第二位玩家的浏览器本地比较后立即清除挑战码。
- 手机端气球测试有明确的「打气 +2」按钮，也可以直接点击气球；桌面仍支持空格键。
- 猫系 / 犬系 MBTI 使用 12 道题，每个维度 3 题，并修正旧版第一选项读取与计分错误。
- 椅子测试支持多场景、键盘 Enter / Space 操作。
- 支持 `prefers-reduced-motion`、键盘焦点、移动端触摸与图片 lazy loading。
- Web App Manifest 与 Service Worker 会缓存核心应用壳、内容包和互动 renderer，改善重复访问与离线体验。

## 架构

```text
persona-test/
├── index.html                    # 玩家首页 / 22 个入口
├── play.html                     # 无 iframe 的正式游玩页面
├── manifest.webmanifest          # PWA 元信息
├── sw.js                         # 离线缓存
├── assets/
│   ├── app.js                    # 应用入口、调度、路由
│   ├── app.css                   # 基础应用样式
│   ├── content-pack.css          # symbol 内容卡样式
│   ├── interaction-pack.css      # 排序 / 二选一 / 分配 / 双人挑战样式
│   ├── data/
│   │   ├── test-data.js          # 经典 12 个：由 legacy DATA 生成
│   │   ├── content-pack.js       # 6 个现代 symbol 内容测试
│   │   └── interaction-pack.js   # 4 个新交互测试
│   ├── core/
│   │   ├── router.js             # URL / 深链接 / challenge 参数
│   │   ├── result.js             # 统一结果卡
│   │   ├── share.js              # 分享 / 海报
│   │   └── ui.js                 # UI 公共工具
│   └── renderers/
│       ├── grid.js               # 图片 / 色块 / symbol 直觉选择
│       ├── mbti.js               # 12 题类型测试
│       ├── chair.js              # 会议室选椅子
│       ├── balloon.js            # 气球风险小游戏
│       ├── cyberball.js          # 抛球社会反应小游戏
│       ├── rank.js               # 排序玩法
│       ├── binary.js             # 连续二选一
│       ├── allocate.js           # 资源分配
│       └── challenge.js          # 双人挑战
├── img/
├── scripts/
│   ├── extract-test-data.mjs
│   ├── check-static.mjs
│   └── optimize-images.py
└── tests/
    └── smoke.mjs
```

## 三层内容数据

经典 12 个测试仍从 `persona-image.html` 的 `DATA` 经 [`scripts/extract-test-data.mjs`](scripts/extract-test-data.mjs) 生成 [`assets/data/test-data.js`](assets/data/test-data.js)。CI 会重新生成并检查 Git diff。

6 个现代快速投射测试直接维护在 [`assets/data/content-pack.js`](assets/data/content-pack.js)。它们共享 `grid.js` 的 `symbol` 模式，不需要新增图片素材。

4 个新交互测试维护在 [`assets/data/interaction-pack.js`](assets/data/interaction-pack.js)。交互逻辑与内容数据分离：同一种玩法可以继续复用现有 renderer，例如以后新增“旅行价值排序”只需要新增 `kind: 'rank'` 的数据，而无需复制页面代码。

## 新增测试

- 经典历史内容：修改 `persona-image.html` 中的 `DATA` 后运行 `node scripts/extract-test-data.mjs`。
- 快速图片 / 色块 / symbol 测试：优先加入 `content-pack.js`。
- 排序 / 二选一 / 资源分配 / 双人挑战：优先加入 `interaction-pack.js` 并复用现有 renderer。
- 只有当玩法交互本身完全不同，才新增 `assets/renderers/*.js`。

新增后同步首页入口、sitemap、可分享路由和 CI 覆盖。

## 自动测试

GitHub Actions 分为两层：

1. **validate**：检查所有 JS / Python 语法、22 个首页与 sitemap 入口、三层数据、PWA 缓存、深链接、分享能力、renderer 和图片资产。
2. **smoke**：安装 Playwright Chromium，真正打开页面并操作关键流程。

当前浏览器 smoke test 会验证：

- 顶部导航确实有 22 个测试；
- 排序玩法选满前三并生成可恢复主结果；
- 连续二选一完整答完 6 题并得到二维组合结果；
- 资源分配必须用完 12 格，并按领先结构分类；
- 双人挑战完整模拟 A 生成挑战链接 → B 打开同一链接 → 得到 6/6 本地默契结果；
- 非法 challenge 参数会清理，challenge 参数不会泄漏到其他测试；
- 6 个 symbol 测试、图片人格、MBTI、椅子、气球与 Cyberball 继续正常运行；
- 页面运行期间无未处理 JavaScript 错误。

## 双人挑战隐私模型

双人挑战没有账号、后端数据库或答题上传接口。第一位玩家的 6 个二选一只编码为 6 位 `0/1` 字符串并写进 URL；第二位玩家作答后在浏览器本地比较。生成最终匹配结果时，路由会清掉 `challenge` 参数。

因此挑战链接本身包含第一位玩家的 6 个选择，**拿到链接的人可以读取这 6 位编码**；它不是加密或秘密存储，只是无需服务器的轻量传递方式。不要用它承载敏感信息。

## 图片优化

[`scripts/optimize-images.py`](scripts/optimize-images.py) 会在保持 JPEG 文件名不变的前提下做低风险重编码。首次自动运行实测优化 15 张图片，减少约 **3.14 MB**。

```bash
python -m pip install pillow
python scripts/optimize-images.py          # 预览
python scripts/optimize-images.py --write  # 写入
```

## 结果定位

这是一个 **娱乐、破冰与自我反思** 项目，不是心理诊断工具。

- 房间、门、饮品、宝石、四季、道路、排序、二选一、资源分配等都是本项目设计的趣味玩法。
- 双人挑战的匹配度只代表这 6 道题的一致程度，不代表关系质量或心理学意义上的兼容度。
- 猫系 / 犬系 MBTI 是娱乐化改编，不等同于正式人格量表。
- 气球玩法受 BART 启发，抛球玩法受 Cyberball 启发，但都不是正式实验版本。

## 隐私

- 无账号系统；
- 无后端数据库；
- 无第三方埋点；
- 普通测试过程默认只存在于浏览器当前会话；
- 结果海报完全在浏览器 Canvas 中生成；
- Service Worker 只缓存站点自身静态资源。

## 本地预览

```bash
python -m http.server 8000
npm install --no-save playwright@1.55.0
npx playwright install chromium
BASE_URL=http://127.0.0.1:8000 node tests/smoke.mjs
```

## Legacy 页面

`persona-image.html`、`persona-collection.html` 与 `chair-test.html` 为历史/兼容入口。正式产品不再依赖它们运行。

## 许可证与图片资源

仓库目前尚未声明统一开源许可证。不要仅因为仓库公开就假定代码或历史图片可以任意重新授权或商业分发；在明确许可证与素材来源之前，应逐项确认权利。现代 content / interaction pack 不新增第三方照片素材。
