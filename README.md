# Persona Test · 人格投射测验

一组轻量、可玩、可分享的人格投射与互动小游戏。项目保持 **纯静态 HTML / CSS / JavaScript**，无需登录、无需后端、默认无埋点，可直接部署到 GitHub Pages。

在线访问：<https://cochranek.github.io/persona-test/>

## 当前版本

首页提供 **26 个测试入口**，覆盖 10 类玩法，并形成「发现 → 游玩 → 结果 → 邀请好友 → 好友落地继续玩」的纯前端增长闭环。

### 双人挑战 4 个

- 🤝 **双人默契挑战**：两个人分别按自己真实偏好回答 6 题，本地计算选择相似度。
- 🧠 **你真的了解我吗**：A 回答自己的真实偏好，B 打开链接后猜 A 的答案，结果是猜中数量。
- 🧳 **旅行搭子适配**：两个人分别回答早起、排队、行程密度、预算与临时变化等旅行偏好。
- 💬 **关系节奏挑战**：比较联系频率、冲突处理、独处空间、分歧处理和新鲜感偏好。

### 深度互动 4 个

- 🪞 **现在的我 vs 理想的我**：同一组 6 题答两遍，比较当下与理想版本的方向一致度。
- 🥇 **你会先守住什么**：从 6 个价值选项中依次排出前三名。
- ↔️ **决策节奏**：连续 6 个二选一，组合“快 / 慢”和“规划 / 弹性”两条轴。
- 🔋 **12 格精力怎么分**：把有限资源分给自己、关系、目标和安全感。

### 10 秒直觉系列 6 个

房间、门、饮品、宝石、四季、道路。

### 经典 12 个

会议室选椅子、气球风险小游戏、抛球社会反应、犬系 MBTI、猫系 MBTI、音乐人格、动物人格、食物人格、颜色人格、天气人格、城市人格、花系人格。

推荐入口是 [`play.html`](play.html)。正式应用由数据层、核心模块和 renderer 直接运行，不使用 iframe。

## 增长闭环

- 首页提供 **随机来一个**，并尽量避开最近玩过的 3 个测试，减少重复。
- 最近访问的测试仅写入浏览器 `localStorage`，首页展示「最近玩过」，用户可一键清除。
- 每个结果页除了复制、系统分享和 PNG 海报，现在都有 **挑战好友**：生成干净的 `play.html?test=...&from=friend` 入口，不携带当前结果和双人 challenge 数据。
- 好友从邀请链接进入时会看到「朋友点名你来测」提示；提示展示后 `from=friend` 会从地址栏清掉。
- 结果页可展开 **邀请二维码**。二维码内容只包含测试入口，不包含具体人格结果。
- 二维码按需加载 `qrcode-generator@2.0.4`（MIT）生成，脚本请求设置 `no-referrer`，页面也声明 `referrer=no-referrer`；项目不会把答题结果或邀请 URL 提交给二维码服务。

## 玩家体验

- 首页按「一起玩 / 多一步的互动 / 10 秒直觉 / 经典 12」分区，不再只是平铺卡片。
- 静态结果支持 `?test=...&result=...` 深链接、复制结果、系统分享和 1080×1440 PNG 海报。
- 双人挑战无需账号或数据库：第一位玩家的 6 个选择编码成 `challenge=010101` 一类 URL 参数，第二位玩家在浏览器本地比较；出结果后立即清掉挑战码。
- “好友读心”与普通默契不同：第二位玩家明确被要求**猜第一位玩家**，而不是回答自己。
- “现在的我 vs 理想的我”不生成 challenge 参数，两轮答案只存在于当前页面。
- 手机端气球有明确「打气 +2」按钮，也可以直接点击气球；桌面支持空格键。
- 猫系 / 犬系 MBTI 使用 12 道题，每个维度 3 题，并修正旧版第一选项读取与计分错误。
- 支持键盘焦点、移动端触摸、`prefers-reduced-motion` 与图片 lazy loading。
- Web App Manifest 与 Service Worker 缓存核心应用壳、首页增长资源、三层数据和全部 renderer。

## 架构

```text
persona-test/
├── index.html                     # 26 个入口的内容发现首页
├── play.html                      # 正式游玩页
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── home.js                    # 随机入口 / 最近玩过
│   ├── home.css                   # 首页基础样式
│   ├── growth.css                 # 首页 + 结果页增长组件
│   ├── app.js                     # 调度 26 个测试
│   ├── app.css
│   ├── content-pack.css
│   ├── interaction-pack.css
│   ├── data/
│   │   ├── test-data.js           # 经典 12：由 legacy DATA 生成
│   │   ├── content-pack.js        # 6 个快速 symbol 测试
│   │   └── interaction-pack.js    # 8 个深度 / 双人互动测试
│   ├── core/
│   │   ├── router.js              # URL / result / scene / challenge / friend source
│   │   ├── result.js
│   │   ├── share.js               # 结果分享 / 好友邀请 / 二维码 / 海报
│   │   ├── history.js             # 仅本机的最近游玩记录
│   │   └── ui.js
│   └── renderers/
│       ├── grid.js
│       ├── mbti.js
│       ├── chair.js
│       ├── balloon.js
│       ├── cyberball.js
│       ├── rank.js
│       ├── binary.js
│       ├── allocate.js
│       ├── challenge.js           # 通用双人比较引擎
│       └── mirror.js              # 两轮自我对照
├── img/
├── scripts/
│   ├── extract-test-data.mjs
│   ├── check-static.mjs
│   └── optimize-images.py
└── tests/
    └── smoke.mjs
```

## 三层内容数据

经典 12 个仍从 `persona-image.html` 的 `DATA` 经 `scripts/extract-test-data.mjs` 生成 `assets/data/test-data.js`，CI 会重新生成并检查 Git diff。

6 个快速投射测试直接维护在 `assets/data/content-pack.js`，共享 `grid.js` 的 `symbol` 模式。

8 个深度互动测试维护在 `assets/data/interaction-pack.js`。其中 `challenge.js` 已泛化：每个双人测试可以独立配置第二位玩家说明、邀请文案、分享文本、分数标签和结果分段，因此新增“好友了解度”“旅行适配”等玩法不需要复制 renderer。

## 隐私模型

默认没有账号、后端数据库或答题上传接口。最近玩过只保存在当前浏览器，可以从首页直接清除。

双人挑战第一位玩家的 6 个二选一只编码为 6 位 `0/1` 字符串并写进 URL；第二位玩家作答后在浏览器本地比较。最终结果生成时，路由会清掉 `challenge` 参数。

**挑战码只是编码，不是加密。** 拿到链接的人可以读取这 6 位字符，所以不要把敏感信息放进挑战链接。当前题目本身均设计为低敏感度的娱乐偏好题。

普通「挑战好友」链接不会带当前 `result`、`scene` 或 `challenge`，只传测试 ID 与一次性的 `from=friend` 来源标记。

## 自动测试

GitHub Actions 分两层：

1. **validate**：检查 JS / Python 语法、26 个首页与 sitemap 入口、三层数据、PWA 缓存、增长资源、好友路由、renderer 和图片资产。
2. **smoke**：安装 Playwright Chromium，真实打开页面并操作关键流程。

浏览器 smoke 会实际验证：26 个顶部标签、排序、连续二选一、12 格分配、两轮自我对照、4 个双人挑战的 A→链接→B 流程、非法 challenge 清理、好友邀请落地、邀请二维码入口、首页最近游玩 / 清除记录，以及 symbol / 图片 / MBTI / chair / balloon / Cyberball 回归。

## 结果定位

这是 **娱乐、破冰与自我反思** 项目，不是心理诊断工具。双人挑战的相似度、猜中数、旅行适配和关系节奏只代表这 6 道题的本轮比较，不代表关系质量、临床结论或稳定人格测量。

猫系 / 犬系 MBTI 是娱乐化改编；气球玩法受 BART 启发，抛球玩法受 Cyberball 启发，但都不是正式实验版本。

## 本地预览

```bash
python -m http.server 8000
npm install --no-save playwright@1.55.0
npx playwright install chromium
BASE_URL=http://127.0.0.1:8000 node tests/smoke.mjs
```

## Legacy 与许可证

`persona-image.html`、`persona-collection.html` 与 `chair-test.html` 为历史/兼容入口。正式产品不依赖它们运行。

仓库目前尚未声明统一开源许可证。不要仅因为仓库公开就假定代码或历史图片可任意重新授权或商业分发；在明确许可证与素材来源之前，应逐项确认权利。现代 content / interaction pack 不新增第三方照片素材。

二维码功能按需使用 `qrcode-generator` 2.0.4（Kazuhiko Arase，MIT License）。该依赖只负责在浏览器生成二维码矩阵；当前仓库没有把它作为仓库整体许可证的替代或延伸。
