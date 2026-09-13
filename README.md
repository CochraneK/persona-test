# Persona Test · 人格投射测验

一组轻量、可玩、可分享的人格投射与行为小游戏。项目保持 **纯静态 HTML / CSS / JavaScript**，无需登录、无需后端、默认无埋点，可直接部署到 GitHub Pages。

在线访问：<https://cochranek.github.io/persona-test/>

## 当前版本

首页提供 **18 个测试入口**。

经典 12 个：

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

新增 content pack 6 个：

- 🪟 房间人格
- 🚪 门后人格
- 🧋 饮品人格
- 💎 宝石人格
- 🍂 四季人格
- 🛣️ 道路人格

新增 6 个测试全部采用本地 emoji / 图形卡片，不新增外部照片素材；每个测试有 8 个直觉选项和 8 张对应结果卡。

推荐游玩入口是 [`play.html`](play.html)。正式应用由独立数据层、核心模块和 renderer 直接运行，不使用 iframe。

## 玩家体验

- 首页将新增 6 个测试单独放在「新上架」区域，经典 12 个继续保留。
- 房间 / 门 / 饮品 / 宝石 / 四季 / 道路使用统一 symbol renderer，约 10 秒即可完成。
- 所有新增静态结果支持 `?test=...&result=...` 深链接、复制结果、系统分享和 1080×1440 PNG 海报。
- 手机端气球测试有明确的「打气 +2」按钮，也可以直接点击气球；桌面仍支持空格键。
- 猫系 / 犬系 MBTI 使用 12 道题，每个维度 3 题，并修正了旧版第一选项读取与计分错误。
- 椅子测试支持多场景、键盘 Enter / Space 操作，不再使用容易误导的固定座位提示。
- 气球 / 抛球属于过程型行为小游戏，分享 URL 只保留测试入口，不伪造或复现过程统计。
- 支持 `prefers-reduced-motion`、键盘焦点、移动端触摸操作与图片 lazy loading。
- Web App Manifest 与 Service Worker 会缓存核心应用壳和新增 content pack，改善重复访问与离线体验。

## 架构

```text
persona-test/
├── index.html                    # 玩家首页 / 18 个入口
├── play.html                     # 无 iframe 的正式游玩页面
├── manifest.webmanifest          # PWA 元信息
├── sw.js                         # 离线缓存
├── assets/
│   ├── app.js                    # 应用入口、调度、路由
│   ├── app.css                   # 正式游玩界面样式
│   ├── content-pack.css          # emoji / symbol 内容卡样式
│   ├── icon.svg
│   ├── data/
│   │   ├── test-data.js          # 经典 12 个：由 legacy DATA 生成
│   │   └── content-pack.js       # 现代新增内容：直接维护
│   ├── core/
│   │   ├── router.js             # URL / 深链接
│   │   ├── result.js             # 统一结果卡
│   │   ├── share.js              # 分享 / 海报
│   │   └── ui.js                 # UI 公共工具
│   └── renderers/
│       ├── grid.js               # 图片 / 色块 / symbol 直觉选择
│       ├── mbti.js               # 12 题类型测试
│       ├── chair.js              # 会议室选椅子
│       ├── balloon.js            # 气球风险小游戏
│       └── cyberball.js          # 抛球社会反应小游戏
├── img/                          # 图片与 SVG 资源
├── scripts/
│   ├── extract-test-data.mjs     # 从 legacy DATA 生成经典测试数据
│   ├── check-static.mjs          # 静态架构 / 18 个入口 / 资源检查
│   └── optimize-images.py        # JPEG 安全压缩
├── tests/
│   └── smoke.mjs                 # Playwright Chromium 冒烟测试
├── persona-image.html            # Legacy 图鉴 / 历史数据源参考页
├── persona-collection.html       # Legacy Lite 合集
└── chair-test.html               # Legacy 独立椅子页
```

### 两层内容数据

经典 12 个测试为了避免历史文案人工迁移遗漏，仍从 `persona-image.html` 的 `DATA` 经 [`scripts/extract-test-data.mjs`](scripts/extract-test-data.mjs) 生成 [`assets/data/test-data.js`](assets/data/test-data.js)。CI 会重新生成并检查 Git diff。

从本次扩容开始，**新测试不再写回 legacy 大 HTML**。现代新增内容直接维护在 [`assets/data/content-pack.js`](assets/data/content-pack.js)，再由 `assets/app.js` 与经典数据合并。这样新增内容不再需要复制旧页面逻辑，也不会继续扩大 legacy 文件。

`grid.js` 现在支持三种同类输入：

- `grid`：图片选择；
- `swatch`：颜色选择；
- `symbol`：emoji / 字符图形选择。

因此增加房间、物件、场景、道路、饮品等 10 秒投射玩法时，只需要写数据，不需要新增 renderer。

## 修改或新增测试

修改经典 12 个历史测试：

```bash
# 1. 修改 persona-image.html 中 DATA
# 2. 重新生成经典数据
node scripts/extract-test-data.mjs
```

新增现代内容优先修改 `assets/data/content-pack.js`：

1. 在 `CONTENT_ORDER` 增加测试 id；
2. 在 `CONTENT_TESTS` 增加 `t / name / kind / note / items / results`；
3. 在首页增加入口卡；
4. 若结果可分享，将 id 加入 `SHAREABLE_RESULT_TESTS`；
5. 更新 sitemap；
6. 运行静态检查与浏览器 smoke test。

如果增加全新的交互范式，再新增 `assets/renderers/*.js` 并在 `assets/app.js` 注册。

## 自动测试

GitHub Actions 分为两层：

1. **validate**：检查 JS / Python 语法、18 个首页和 sitemap 入口、两层数据、PWA 文件、深链接、分享能力、renderer 与图片资产。
2. **smoke**：安装 Playwright Chromium，真正打开页面并操作关键流程。

当前浏览器 smoke test 会验证：

- 正式页不存在 iframe；
- 顶部导航确实有 18 个测试；
- 6 个新增 symbol 测试逐个能打开且每个渲染 8 个选择；
- 新增结果能生成深链接、恢复结果、生成海报且不依赖图片资源；
- 图片人格可以选择并恢复图片型结果；
- 猫系 MBTI 可以完整答完 12 题并得到四字母结果；
- 椅子测试保存座位与场景；
- 手机气球存在可点击气球和「打气 +2」按钮；
- Cyberball-inspired 场景可以正常启动；
- 非法 URL 会自动规范化；
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

- 房间、门、饮品、宝石、四季、道路、视觉、颜色、食物、城市等属于趣味投射玩法，不能理解为临床或心理测量结论。
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

仓库目前尚未声明统一开源许可证。不要仅因为仓库公开就假定代码或历史图片可以在任意场景下重新授权或商业分发；在明确许可证与图片来源之前，应逐项确认素材权利。新 content pack 使用 emoji / 字符图形，不额外引入第三方照片素材。
