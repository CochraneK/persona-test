# Persona Test · 人格投射测验

一组轻量、可玩、可分享的人格投射与行为小游戏。项目保持 **纯静态 HTML / CSS / JavaScript**，无需登录、无需后端、默认无埋点，适合 GitHub Pages 直接部署。

在线访问：<https://cochranek.github.io/persona-test/>

## 当前版本

首页面向玩家直接提供 12 个测试入口：

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

推荐入口是 [`play.html`](play.html)。它保留现有 `persona-image.html` 作为测试引擎，并通过独立的 [`assets/play-shell.js`](assets/play-shell.js) / [`assets/play-shell.css`](assets/play-shell.css) 提供产品层增强，避免继续把功能堆进大型单文件。

### 玩家体验

- 手机端气球测试增加「打气 +2」按钮，也可以直接点击气球；桌面仍支持空格键。
- 猫系 / 犬系 MBTI 修正旧版第一选项读取与计分错误，并从每维 2 题扩展为每维 3 题（共 12 题），避免平手固定偏向某一侧。
- 椅子测试移除容易产生误导的固定座位说明，并补充键盘操作。
- 结果页支持「复制结果」「分享结果」和「生成结果海报」。海报为浏览器本地生成的 PNG，不需要上传服务器。
- 可分享的静态结果会写入 `?test=...&result=...`；椅子结果额外保存 `scene`，朋友打开链接可直接看到同一结果卡。
- 气球 / 抛球属于过程型行为小游戏，分享链接只保留测试入口，不伪造或复现原始过程统计。
- 玩家入口隐藏内部「平台 / 营销落点」信息；这些内容仍保留在原始图鉴页供开发参考。
- 图片选择项启用 lazy loading / async decoding，并补充 `prefers-reduced-motion` 与 focus 状态。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| [`index.html`](index.html) | **推荐首页**：12 个测试直接入口，移动优先。 |
| [`play.html`](play.html) | **推荐游玩入口**：轻量产品壳。 |
| [`assets/play-shell.js`](assets/play-shell.js) | 移动端、计分修正、深链接、分享、结果海报、无障碍增强。 |
| [`assets/play-shell.css`](assets/play-shell.css) | 产品壳样式。 |
| [`persona-image.html`](persona-image.html) | 原始旗舰图鉴 / 测试引擎，含图片资源和内部参考信息。 |
| [`persona-collection.html`](persona-collection.html) | Lite 合集：纯 emoji / SVG，零外部图片资源。 |
| [`chair-test.html`](chair-test.html) | 独立会议室选椅子版本。 |
| [`img/`](img/) | 图片资源。 |
| [`scripts/check-static.mjs`](scripts/check-static.mjs) | 零依赖静态结构 / 关键功能 / 图片资产检查。 |
| [`scripts/optimize-images.py`](scripts/optimize-images.py) | 安全 JPEG 批量压缩脚本。 |

## 图片优化

项目保留现有 `.jpg` 文件名和引用方式，先做低风险的体积治理，而不是立刻重写所有资源为 WebP/AVIF。

[`scripts/optimize-images.py`](scripts/optimize-images.py) 会：

- 仅处理 JPEG；
- 对超大图片限制最长边；
- 使用 progressive JPEG + optimize 重新编码；
- 只有新文件至少小约 8% 时才替换；
- 不修改图片文件名，因此现有测试数据无需迁移。

本地预览压缩收益：

```bash
python -m pip install pillow
python scripts/optimize-images.py
```

实际写入：

```bash
python scripts/optimize-images.py --write
```

`.github/workflows/optimize-images.yml` 会在优化脚本 / workflow / 图片进入 `main` 后自动执行一次，并只在确实产生更小图片时提交资源变更。

## 结果定位

这是一个 **娱乐、破冰与自我反思** 项目，不是心理诊断工具。

- 视觉、颜色、食物、城市等测试属于趣味投射玩法，结果不能被理解为临床或心理测量结论。
- 猫系 / 犬系 MBTI 是娱乐化改编，不等同于正式人格量表。
- 气球玩法受 Balloon Analogue Risk Task（BART）启发，但当前是 5 轮的轻量游戏，不等同于正式实验范式。
- 抛球玩法受 Cyberball 启发，结果分类为本项目的娱乐化设计，不是 Cyberball 的标准心理学结论。

## 隐私

当前推荐入口为纯静态页面：

- 无账号系统
- 无后端数据库
- 无第三方埋点
- 测试过程默认只存在于当前浏览器页面中
- 结果海报完全在浏览器 Canvas 中生成
- 分享 URL 只包含测试 / 静态结果标识，不包含姓名或账号信息

## 本地预览

旧页面可以直接双击打开。推荐入口 `play.html` 使用同源 iframe 对旧测试引擎做增强；部分浏览器会限制 `file://` 页面之间的脚本访问，因此完整体验建议使用任意静态 HTTP server，或直接访问 GitHub Pages。

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## 自动检查

GitHub Actions 会运行 `node scripts/check-static.mjs`，检查：

- 12 个首页入口是否完整；
- 产品壳模块是否存在；
- MBTI 修复、手机气球、分享、结果海报、深链接等关键能力是否仍在；
- 图片重复字节与异常大文件。

## 后续方向

下一阶段更适合做正式的数据层 / renderer 拆分，把 `persona-image.html` 中的测试数据迁到独立模块；再增加浏览器级 smoke test，以及在确认图片授权和内容正确后处理重复素材与 WebP/AVIF 双格式。
