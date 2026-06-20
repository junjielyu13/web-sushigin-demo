# SushiGin 网站改版 — 设计方案 (Spec)

- **日期**: 2026-06-20
- **项目**: web-sushigin-demo (SushiGin Sushibar)
- **状态**: 已批准设计，待写实现计划

## 1. 背景与目标

SushiGin 是巴塞罗那 Las Roquetes del Garraf 的一家**自助 buffet 式日本料理**（BUFFET INFINITY 畅吃，按人头计价，按编号点单）。Restaurant Guru 评分 4.8★（816 评价）。

现有网站是纯静态 HTML（Bootstrap + 自定义 CSS，Vercel 部署），通过浏览器语言跳转到 `menu_es/ca/en.html`，每页内容为：横幅 → 语言切换 → 两个 PDF 菜单链接 → CoverManager 预订 iframe → 页脚。

### 目标
1. 对网站做**大改版**，全新现代视觉风格。
2. **保留预订功能**（CoverManager iframe，三语联动）。
3. 新增**菜单查看功能**（图文 + PDF 下载结合）。
4. 新增**图库**（gallery，带灯箱）。
5. 全站支持三语：**西班牙语 (ES) / 加泰罗尼亚语 (CA) / 英语 (EN)**。

### 非目标 (YAGNI)
- 不做在线点单/支付（实体店内自助点单）。
- 不做后台 CMS（菜单数据为静态 JSON）。
- 不做框架/构建工具（保持纯静态）。

## 2. 技术与架构

- **纯静态** HTML/CSS/JS，无构建工具，继续 Vercel 部署。
- **多语言机制**：放弃每语言独立 HTML 文件。改为**一套页面 + JSON 词典**：HTML 元素用 `data-i18n="key"` 标记，`i18n.js` 根据当前语言从 `i18n.json` 填充文案。语言切换在导航栏，选择存入 `localStorage`，首次访问按浏览器语言判定（默认 ES，回退 EN）。可用 `?lang=es|ca|en` 覆盖。
- **样式**：自己写轻量 CSS（CSS 变量定义设计 token），**不再依赖旧 Bootstrap**。
- **字体**：优雅衬线（标题）+ 净高无衬线（正文）。需自托管或可靠 CDN；注意现有页面用 `http://fonts.googleapis.com`（非 https，需改为 https 或自托管）。

### 文件结构
```
index.html              首页（单页滚动）
menu.html               菜单页
/assets/css/style.css   新样式
/assets/js/i18n.js      多语言填充
/assets/js/gallery.js   图库灯箱
/assets/js/menu.js      菜单渲染（从 menu.json）
/assets/data/i18n.json  界面文案（三语）
/assets/data/menu.json  菜品数据（三语，带编号/过敏原/标记）
/images/gallery/        压缩后图库图 + /_original/ 原图备份
```

旧文件（`menu_es/ca/en.html`、`menu_en_new.html`、`Default.aspx`、旧 `css/`）**保留但不再引用**，避免误删，后续可清理。`vercel.json` / `web.config` 视情况更新路由。

## 3. 设计风格 (Design Tokens)

**方向**：明亮清新 · 现代日系（照片为王）。

```
背景:   暖白 #FBF8F3 / 米色
文字:   深靖蓝 #1A2238 / 炭黑
点缀:   朱红 #C8472F
字体:   标题=优雅衬线, 正文=净高无衬线
调性:   明亮、通透、留白充足，鲜艳美食照片作主角
```

设计灵感参考：fatcow.com.sg、littlesakana.com（明亮调）。实现时按 artifact-design 技能流程先定 token 系统再开发。

## 4. 首页 (index.html — 单页滚动)

顶部固定导航（logo + 锚点链接 + 语言切换 ES/CA/EN）。

1. **Hero** — 全屏美食大图（nigiri/卷物），叠加店名 + 标语 + 按钮「查看菜单」「立即预订」。
2. **自助概念** — 介绍 BUFFET INFINITY 畅吃模式与规则（按编号点、不浪费、每人至少一杯饮料、未食用每盘 +2€）。
3. **亮点/信任背书** — 突出 4.8★（816 评价）、新鲜现做、儿童优惠（<3 岁免费，1–1.3m 儿童价）。
4. **图库预览** — 6 张精选，「查看更多」进图库灯箱。
5. **预订** — 保留 CoverManager iframe，按当前语言加载对应版本（src 随语言切换）。
6. **联系/页脚** — 地址、电话 (+34 932 47 38 71)、邮箱 (sushiginreservas@gmail.com)、Google 地图、营业时间、真实社媒链接（Facebook: facebook.com/p/SushiGin-Sushibar-100088581475421）。

## 5. 菜单页 (menu.html — 核心新功能)

- **图文 + PDF 结合**。
- 菜品数据从现有 PDF (`SushiGin_ES/EN.pdf`) 提取为 `menu.json`：每项含编号、三语名称、三语描述、过敏原编号 (1–14)、辣/素标记。
- 顶部分类 Tab（汤 / 寿司 / 卷物 / 热菜 / 甜点 等），下方为编号菜品卡片网格。
- 过敏原图例（14 项：麸质/甲壳/软体/鱼/坚果/芹菜/羽扇豆/大豆/花生/芥末/芝麻/乳/亚硫酸盐/蛋）+ 辣/素图标。
- 顶部醒目按钮：「下载完整 PDF」——堂食版 + 外带版（保留现有 PDF）。
- 说明 buffet 按人头计价（儿童/成人），单品不显示价格。

## 6. 图库 (Gallery)

- 响应式网格（grid/masonry）。
- 点击打开**灯箱**：放大、左右切换、键盘方向键、移动端滑动、Esc 关闭。
- **图片压缩**（重要）：现有 13 张图每张 5–9MB（共 ~85MB），严重拖慢加载。压缩为网页用尺寸（大图约 200–400KB，另生成缩略图）；原图备份到 `images/gallery/_original/`。

## 7. 多语言范围

ES / CA / EN 三语覆盖：界面文案 (`i18n.json`) + 菜单数据 (`menu.json`) + 预订 iframe（CoverManager 各语言 URL 联动）。

## 8. 数据来源（已确认）

- 餐厅信息来自 Google Maps + 搜索：自助 buffet 日料，4.8★/816 评价，地址/电话见上。
- 菜单数据：从 PDF 自动提取，**最终由用户核对**（可能有识别误差）。
- 图片压缩：原图备份后压缩，已获用户同意。

## 9. 验收标准

- [ ] 首页与菜单页在桌面/移动端均明亮现代、响应式正常。
- [ ] 三语切换全站生效（文案 + 菜单 + 预订 iframe），刷新后记住选择。
- [ ] CoverManager 预订 iframe 正常加载且随语言切换。
- [ ] 菜单页按分类展示编号菜品（三语）+ 过敏原/辣/素标记 + PDF 下载按钮。
- [ ] 图库网格 + 灯箱交互正常；图片已压缩，首屏加载快。
- [ ] 旧链接/路由不致 404（Vercel 路由处理）。
```
