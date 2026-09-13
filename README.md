# Persona Test · 人格投射测验

一组轻量、可玩、可分享的人格投射与行为小游戏。项目保持 **纯静态 HTML / CSS / JavaScript**，无需登录、无需后端、默认无埋点，可直接部署到 GitHub Pages。

在线访问：<https://cochranek.github.io/persona-test/>

## 当前版本

首页直接提供 12 个测试入口：

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

推荐游玩入口是 [`play.html`](play.html)。当前版本已经不再通过 iframe 驱动旧页面，而是由独立数据层、核心模块和 5 类 renderer 直接运行。

## 玩家体验

- 手机端气球测试有明确的「打气 +2」按钮，也可以直接点击气球；桌面仍支持空格键。
- 猫系 / 犬系 MBTI 使用 12 道题，每个维度 3 题，并修正了旧版第一选项读取与计分错误。
- 椅子测试支持多场景、键盘 Enter / Space 操作，不再使用容易误导的固定座位提示。
- 结果页支持复制结果、系统原生分享和 1080×1440 PNG 结果海报。
- 静态人格结果写入 `?test=...&result=...`；椅子额外保存 `scene`，分享链接可直接恢复同一结果卡。
- 气球 / 抛球属于过程型行为小游戏，分享 URL 只保留测试入口，不伪造或复现过程统计。
- 支持 `prefers-reduced-motion`、键盘焦点、移动端触摸操作与图片 lazy loading。
- 已加入 Web App Manifest 与 Service Worker，可安装并缓存核心应用壳以改善重复访问和离线体验。

## 架构

```text
persona-test/
├── index.html                    # 玩家首页 / 12 个入口
├── play.html                     # 无 iframe 的正式游玩页面
├── manifest.webmanifest          # PWA 元信息
├── sw.js                         # 离线缓存
├── assets/
│   ├── app.js                    # 应用入口、调度、路由
│   ├── app.css                   # 正式游玩界面样式
│   ├── icon.svg
│   ├── data/
│   │   └── test-data.js          # 生成后的规范化测试数据
│   ├── core/
│   │   ├── router.js             # URL / 深链接
│   │   ├── result.js             # 统一结果卡
│   │   ├── share.js              # 分享 / 海报
│   │   └── ui.js                 # UI 公共工具
│   └── renderers/
│       ├── grid.js               # 图片 / 色块直觉选择
│       ├── mbti.js               # 12 题类型测试
│       ├── chair.js              # 会议室选椅子
│       ├── balloon.js            # 气球风险小游戏
│       └── cyberball.js          # 抛球社会反应小游戏
├── img/                          # 图片与 SVG 资源
├── scripts/
│   ├── extract-test-data.mjs     # 从 legacy DATA 生成规范化数据
│   ├── check-static.mjs          # 静态架构 / 资源检查
│   └── optimize-images.py        # JPEG 安全压缩
├── tests/
│   └── smoke.mjs                 # Playwright Chromium 冒烟测试
├── persona-image.html            # Legacy 图鉴 / 数据源参考页
├── persona-collection.html       # Legacy Lite 合集
└── chair-test.html               # Legacy 独立椅子页
```

### 数据与 renderer 的边界

正式运行时只读取 [`assets/data/test-data.js`](assets/data/test-data.js)，不依赖 `persona-image.html`。

目前为了避免人工迁移 12 套历史文案时产生遗漏，`persona-image.html` 中的 `DATA` 仍作为内容源，由 [`scripts/extract-test-data.mjs`](scripts/extract-test-data.mjs) 自动抽取并规范化。CI 会重新生成数据并检查 Git diff，因此源数据和正式数据不一致时会直接失败。

五种玩法分别由 renderer 实现。图片人格、动物、食物、天气、城市、花卉等同类测试共享 `grid.js`，因此新增同类测试通常只需要补数据与首页卡片，不需要复制业务逻辑。

## 修改或新增测试

修改已有测试内容时：

```bash
# 1. 修改 persona-image.html 中 DATA 的对应内容
# 2. 重新生成正式数据
node scripts/extract-test-data.mjs

# 3. 做静态检查
node scripts/check-static.mjs

# 4. 本地起静态服务器
python -m http.server 8000
```

如果增加一种全新的交互范式，再新增一个 `assets/renderers/*.js` 并在 `assets/app.js` 中注册；如果只是新增已有范式的测试，只增加数据即可。

## 自动测试

GitHub Actions 分为两层：

1. **validate**：检查所有 JS / Python 语法、12 个入口、模块结构、PWA 文件、关键能力与生成数据是否最新。
2. **smoke**：安装 Playwright Chromium，真正打开页面并操作关键流程。

当前浏览器 smoke test 会验证：

- 正式页不存在 iframe；
- 图片人格可以选择并生成深链接；
- 深链接可以直接恢复结果卡；
- 猫系 MBTI 可以完整答完 12 题并得到四字母结果；
- 椅子测试保存座位与场景；
- 手机气球存在可点击气球和「打气 +2」按钮；
- Cyberball-inspired 场景可以正常启动；
- 页面运行期间无未处理 JavaScript 错误。

## 图片优化

[`scripts/optimize-images.py`](scripts/optimize-images.py) 会在保持现有 JPEG 文件名不变的前提下进行低风险重编码：限制超大尺寸、使用 progressive JPEG + optimize，并且只有新文件至少缩小约 8% 才替换。

首次自动运行实测优化 **15 张图片，减少约 3.14 MB**。其中 `cat_norwegian.jpg` 从约 1.55 MB 降到 149 KB，`cat_scottish.jpg` 从约 588 KB 降到 85 KB。

```bash
python -m pip install pillow
python scripts/optimize-images.py          # 预览
python scripts/optimize-images.py --write  # 写入
```

`.github/workflows/optimize-images.yml` 会在相关资源进入 `main` 后自动执行，并只在确实产生更小图片时提交变更。

## 结果定位

这是一个 **娱乐、破冰与自我反思** 项目，不是心理诊断工具。

- 视觉、颜色、食物、城市等测试属于趣味投射玩法，不能理解为临床或心理测量结论。
- 猫系 / 犬系 MBTI 是娱乐化改编，不等同于正式人格量表。
- 气球玩法受 Balloon Analogue Risk Task（BART）启发，但当前是 5 轮轻量游戏，不等同于正式实验范式。
- 抛球玩法受 Cyberball 启发，结果分类为本项目自己的娱乐化设计，不是 Cyberball 的标准心理学结论。

## 隐私

正式入口为纯静态页面：

- 无账号系统；
- 无后端数据库；
- 无第三方埋点；
- 测试过程默认只存在于浏览器当前会话；
- 结果海报完全在浏览器 Canvas 中生成；
- 分享 URL 只包含测试 / 静态结果 / 椅子场景标识，不包含姓名或账号信息。

Service Worker 只缓存站点自身的静态资源，不上传测试数据。

## 本地预览

ES Modules 与 Service Worker 需要 HTTP 环境，建议使用静态服务器：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

如需跑浏览器测试：

```bash
npm install --no-save playwright@1.55.0
npx playwright install chromium
BASE_URL=http://127.0.0.1:8000 node tests/smoke.mjs
```

## Legacy 页面

`persona-image.html`、`persona-collection.html` 与 `chair-test.html` 为历史/兼容入口。正式产品不再依赖它们运行，但暂时保留，便于比较旧版设计和维护历史数据来源。

## 许可证与图片资源

仓库目前尚未声明统一开源许可证。不要仅因为仓库公开就假定代码或历史图片可以在任意场景下重新授权或商业分发；在明确许可证与图片来源之前，应逐项确认素材权利。项目自制的 SVG（如应用图标和斯芬克斯猫插画）与历史图片资源应分开管理授权信息。
