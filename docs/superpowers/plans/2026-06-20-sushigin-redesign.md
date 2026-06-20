# SushiGin 网站改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SushiGin 静态网站改版为明亮现代的三语（ES/CA/EN）站点，保留 CoverManager 预订，新增图文+PDF 菜单页和图库灯箱。

**Architecture:** 纯静态 HTML/CSS/JS（无构建工具，Vercel 部署）。一套页面 + JSON 词典实现多语言（`data-i18n` 属性，JS 运行时填充）。菜品数据从 PDF 提取为 `menu.json`，菜单页用 JS 渲染。图库网格 + 灯箱。

**Tech Stack:** HTML5, 原生 CSS（CSS 变量 token），原生 JS（ES modules / 普通 script），无依赖。压缩图片用系统 `sips`（macOS）。

## Global Constraints

- 纯静态，无构建工具、无 npm 依赖；Vercel 部署。
- 三语全程一致：ES（默认）/ CA / EN，回退 EN；语言存 `localStorage`，`?lang=` 可覆盖。
- 设计 token（verbatim）：背景 `#FBF8F3`，文字 `#1A2238`，点缀朱红 `#C8472F`；标题衬线、正文无衬线。
- 字体一律用 https（现有 `http://fonts.googleapis.com` 必须改 https 或自托管）。
- 保留 CoverManager 预订 iframe，src 随语言联动。
- 保留现有 PDF 菜单下载（堂食 + 外带）。
- 图片先备份原图到 `images/gallery/_original/` 再压缩。
- 餐厅信息（verbatim）：电话 `+34 932 47 38 71`；邮箱 `sushiginreservas@gmail.com`；地址 `Rambla del Garraf 48-60, 6p, En Valenti Village (Parking Aldi), 08812 Les Roquetes del Garraf, Sant Pere de Ribes`；评分 `4.8★ (816)`；Facebook `https://www.facebook.com/p/SushiGin-Sushibar-100088581475421`。

---

## File Structure

```
index.html                  首页（单页滚动）
menu.html                   菜单页
/assets/css/style.css       设计 token + 全站样式
/assets/js/i18n.js          多语言填充 + 语言切换
/assets/js/menu.js          从 menu.json 渲染菜单
/assets/js/gallery.js       图库灯箱
/assets/data/i18n.json      界面文案（三语）
/assets/data/menu.json      菜品数据（三语 + 过敏原 + 辣/素）
/images/gallery/*.jpg        压缩后图库图（+ 缩略图）
/images/gallery/_original/   原图备份
vercel.json                 路由更新
```

旧文件（`menu_es/ca/en.html`、`menu_en_new.html`、`Default.aspx`、`css/`）保留不引用。

---

## Task 1: 图片压缩与备份

**Files:**
- Create: `images/gallery/_original/` (备份)
- Modify: `images/gallery/*.jpg` (压缩覆盖)
- Create: `images/gallery/thumbs/*.jpg` (缩略图)

**Interfaces:**
- Produces: 13 张压缩后大图（长边 ≤1600px，~200–400KB）+ `thumbs/` 缩略图（长边 ≤600px）。文件名保持不变（去掉空格，统一小写连字符以便引用）。

- [ ] **Step 1:** 备份原图：把 `images/gallery/*.jpg` 复制到 `images/gallery/_original/`。
- [ ] **Step 2:** 重命名含空格的文件（如 `ins-mix nigiri 3.jpg` → `ins-mix-nigiri-3.jpg`），生成文件名映射表记录在 progress。
- [ ] **Step 3:** 用 `sips` 压缩：大图长边 1600px、JPEG 质量 ~70；缩略图长边 600px。
  ```bash
  for f in images/gallery/*.jpg; do
    sips -Z 1600 -s formatOptions 70 "$f" --out "$f"
  done
  ```
- [ ] **Step 4 (验证):** `ls -la images/gallery/` 确认每张 <500KB；`du -sh images/gallery` 总量大幅下降。`sips -g pixelWidth <file>` 抽查尺寸。
- [ ] **Step 5:** 记录最终图片文件名清单到 `progress.md`（菜单/图库要引用）。

---

## Task 2: 菜单数据提取 (menu.json)

**Files:**
- Create: `assets/data/menu.json`
- 来源: `images/SushiGin_ES.pdf`, `images/SushiGin_EN.pdf`

**Interfaces:**
- Produces: `menu.json`，结构：
  ```json
  {
    "categories": [
      { "id": "soups", "name": {"es":"Sopas","ca":"Sopes","en":"Soups"} }
    ],
    "items": [
      {
        "code": "001",
        "category": "soups",
        "name": {"es":"Sopa miso","ca":"Sopa miso","en":"Miso soup"},
        "desc": {"es":"...","ca":"...","en":"..."},
        "allergens": [1,4,8],
        "spicy": false,
        "vegan": false
      }
    ]
  }
  ```

- [ ] **Step 1:** `pdftotext -layout` 提取 ES 与 EN PDF 全文到临时文件（CA 文本在 ES PDF 中同页出现）。
- [ ] **Step 2:** 解析三栏布局：按编号 `\d{3}` 切分菜品，提取三语名称、描述、过敏原编号、辣/素标记。归类（001–088 前菜/寿司、201–239 卷物、301–335 热菜、401+ 甜点；按 PDF 实际小标题细分）。
- [ ] **Step 3:** 写入 `assets/data/menu.json`。
- [ ] **Step 4 (验证):** `python3 -c "import json;d=json.load(open('assets/data/menu.json'));print(len(d['items']),'items',len(d['categories']),'cats')"` 确认条数合理（>40）、JSON 合法。
- [ ] **Step 5:** 标记需用户核对（识别误差），记入 `progress.md`。

---

## Task 3: 设计 token 与全站 CSS 基座

**Files:**
- Create: `assets/css/style.css`

**Interfaces:**
- Produces: CSS 变量 token、排版、按钮、导航、容器、响应式断点等基础类，供后续页面复用。

- [ ] **Step 1:** 按 artifact-design 技能流程先定 token 系统（颜色/字体/间距/圆角/阴影 scale），写成 `:root` CSS 变量。
  ```css
  :root{
    --bg:#FBF8F3; --ink:#1A2238; --accent:#C8472F;
    /* 字体、间距 scale、圆角、阴影… */
  }
  ```
- [ ] **Step 2:** 基础排版（衬线标题 + 无衬线正文，https 字体）、`.container`、`.btn`/`.btn-accent`、固定导航 `.site-nav`、语言切换样式、`reduced-motion` 适配。
- [ ] **Step 3 (验证):** 建临时 `_tokens-preview.html` 在浏览器打开，确认配色/排版/按钮符合"明亮清新现代日系"；截图自检后删除预览文件。

---

## Task 4: 多语言基础设施 (i18n)

**Files:**
- Create: `assets/js/i18n.js`, `assets/data/i18n.json`

**Interfaces:**
- Produces:
  - `i18n.json`: `{ "<key>": {"es":"...","ca":"...","en":"..."} }` 覆盖所有界面文案。
  - `i18n.js` 全局：`setLang(lang)` 切换并持久化；初始化时读取 `localStorage` → `?lang=` → 浏览器语言 → 默认 `es`；填充所有 `[data-i18n]`（文本）、`[data-i18n-attr]`（属性如 alt/title）；暴露 `getLang()`；切换时派发 `langchange` 事件（菜单/iframe 监听）。

- [ ] **Step 1:** 写 `i18n.json` 基础键（导航、hero、按钮、各 section 标题与文案、页脚）。
- [ ] **Step 2:** 写 `i18n.js`：语言判定、填充、`setLang`、`langchange` 事件。
- [ ] **Step 3:** 建临时 `_i18n-test.html` 含几个 `data-i18n` 元素 + 切换按钮。
- [ ] **Step 4 (验证):** 浏览器打开，切换 ES/CA/EN 文案即时变化；刷新后保持；`?lang=en` 生效。通过后删测试文件。

---

## Task 5: 首页 — 导航 + Hero + 自助概念 + 亮点

**Files:**
- Create: `index.html`
- Modify: `assets/css/style.css`, `assets/data/i18n.json`

**Interfaces:**
- Consumes: Task 3 CSS、Task 4 i18n。
- Produces: 首页上半部分（固定导航含 logo+锚点+语言切换；全屏 Hero 大图+店名+标语+「查看菜单」「立即预订」按钮；自助 BUFFET INFINITY 概念区；4.8★/816 等亮点区）。

- [ ] **Step 1:** 写 `index.html` 骨架（head 引 CSS/JS、meta viewport、SEO meta/title 三语由 i18n 填）。
- [ ] **Step 2:** 固定导航 + 语言切换控件（绑定 `setLang`）。
- [ ] **Step 3:** Hero（用 Task 1 压缩大图，`loading=eager` 首屏，叠加渐变保证文字可读）。
- [ ] **Step 4:** 自助概念区 + 亮点/信任背书区（文案走 i18n）。
- [ ] **Step 5 (验证):** 浏览器桌面+移动视口检查布局、三语切换、锚点滚动；截图自检。

---

## Task 6: 首页 — 图库预览 + 预订 + 页脚

**Files:**
- Modify: `index.html`, `assets/css/style.css`, `assets/data/i18n.json`

**Interfaces:**
- Consumes: Task 1 图、Task 4 i18n。
- Produces: 图库预览区（6 张精选 + 「查看更多」跳图库）；预订区（CoverManager iframe，src 随语言）；页脚（地址/电话/邮箱/地图/营业时间/社媒）。

- [ ] **Step 1:** 图库预览 6 张网格 + 进入完整图库的入口。
- [ ] **Step 2:** 预订区：CoverManager iframe + `iframeResizer`。监听 `langchange` 切换 src：
  - ES `https://www.covermanager.com/reservation/module_restaurant/restaurante-sushigin/spanish`
  - CA `.../catalan`、EN `.../english`（实现时验证可用，失败回退 spanish）。
- [ ] **Step 3:** 页脚（Global Constraints 中的地址/电话/邮箱/社媒 verbatim）+ Google 地图链接 + 营业时间（用户后续补确切值，先放占位结构并标记）。
- [ ] **Step 4 (验证):** iframe 正常加载；切换语言 iframe 重载对应语言；页脚链接可点；移动端正常。

---

## Task 7: 菜单页 (menu.html)

**Files:**
- Create: `menu.html`, `assets/js/menu.js`
- Modify: `assets/css/style.css`, `assets/data/i18n.json`

**Interfaces:**
- Consumes: Task 2 `menu.json`、Task 4 i18n。
- Produces: 菜单页（同款导航/页脚；PDF 下载按钮区；分类 Tab；编号菜品卡片网格；过敏原图例 + 辣/素图标；buffet 计价说明）。

- [ ] **Step 1:** `menu.html` 骨架（复用导航/页脚结构与 CSS）。
- [ ] **Step 2:** PDF 下载按钮区（堂食 `images/SushiGin_ES.pdf` 等 + 外带 `-llevar.pdf`，按语言取对应 ES/EN PDF）。
- [ ] **Step 3:** `menu.js`：`fetch('assets/data/menu.json')` → 渲染分类 Tab + 卡片（编号、当前语言名称/描述、过敏原徽标、辣/素图标）；监听 `langchange` 重渲染。
- [ ] **Step 4:** 过敏原图例（14 项三语）+ buffet 按人头计价说明。
- [ ] **Step 5 (验证):** 浏览器打开，分类切换、语言切换、过敏原/标记显示、PDF 按钮跳转均正常；移动端卡片排布正常。
  - 注意：`fetch` 本地需经 http 服务（`python3 -m http.server`），不能 `file://`。

---

## Task 8: 图库灯箱

**Files:**
- Modify: `index.html`（或独立 `gallery` 锚点区）, Create: `assets/js/gallery.js`
- Modify: `assets/css/style.css`, `assets/data/i18n.json`

**Interfaces:**
- Consumes: Task 1 图（thumbs + 大图）。
- Produces: 响应式图库网格（缩略图）+ 灯箱（大图、左右切换、键盘方向键、Esc 关闭、移动端滑动、`aria` 可访问）。

- [ ] **Step 1:** 图库网格用 `thumbs/`，`loading=lazy`。
- [ ] **Step 2:** `gallery.js`：点击打开灯箱加载大图；prev/next、键盘、Esc、触摸滑动；焦点管理。
- [ ] **Step 3 (验证):** 浏览器点击放大、左右切换、键盘、Esc、移动端滑动均正常；懒加载生效。

---

## Task 9: 路由、收尾与整体验证

**Files:**
- Modify: `vercel.json`
- Review: 全站

**Interfaces:**
- Produces: 正确路由（`/` → index.html，旧路径不 404）、最终验收。

- [ ] **Step 1:** 更新 `vercel.json`：根路径指向新 `index.html`；旧 `menu_es/ca/en.html` 做 301/rewrite 到新页或保留可访问。
- [ ] **Step 2:** 全站跑 `python3 -m http.server` 自测：首页→菜单→图库→预订全流程，三语切换。
- [ ] **Step 3 (验证 — 对照 spec 第 9 节验收清单逐条核对):** 响应式、三语联动、iframe、菜单分类/过敏原/PDF、图库灯箱、加载性能、无 404。
- [ ] **Step 4:** 列出需用户核对项（菜单数据、营业时间、CoverManager 三语 URL、社媒链接）于 `progress.md`。

---

## Self-Review

- **Spec 覆盖:** 技术架构(T3,T4,T9)、视觉风格(T3)、首页全部 section(T5,T6)、菜单页(T2,T7)、图库(T1,T8)、三语(T4 + 全任务)、图片压缩(T1)、预订保留(T6)、PDF 保留(T7)、验收(T9) — 均有对应任务。
- **占位符:** 无 TBD；营业时间/CoverManager URL/菜单数据明确标记为"待用户核对"并给了回退方案。
- **类型一致:** `setLang/getLang/langchange` 跨 T4/T6/T7 一致；`menu.json` 结构在 T2 定义、T7 消费一致。
