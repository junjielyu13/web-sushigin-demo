# SushiGin 改版 — 实现进度

## Task 1: 图片压缩与备份 ✅
- 原图备份: `images/gallery/_original/` (13 张, 82M)
- 压缩大图: `images/gallery/*.jpg` (长边 1600px, 211–423KB, 共 ~4MB)
- 缩略图: `images/gallery/thumbs/*.jpg` (长边 600px, 48–82KB)
- 重命名(去空格): `ins sarten de pollo 5.jpg`→`ins-sarten-de-pollo-5.jpg`, `ins sushigin2.jpg`→`ins-sushigin2.jpg`, `ins-mix nigiri 3.jpg`→`ins-mix-nigiri-3.jpg`

### 图库图片最终文件名 (大图 + thumbs/ 同名)
- Gin-1057.jpg, Gin-1062.jpg, Gin-1065.jpg, Gin-1067.jpg, Gin-1068.jpg
- Gin-1076.jpg, Gin-1083.jpg, Gin-1153.jpg, Gin-3202.jpg
- ins-mix-nigiri-3.jpg, ins-pokebowl.jpg, ins-sarten-de-pollo-5.jpg, ins-sushigin2.jpg

## Task 2: 菜单数据提取 ✅
- `assets/data/menu.json`: 142 道菜, 14 分类, 三语 name+desc, 过敏原(自动解析自 PDF 文本层), spicy/vegan 标记
- 分类: starters12 / dimsum12 / fried12 / teppanyaki12 / wok12 / drypot5 / uramaki32 / maki8 / nigiri12 / gunkan6 / chirashi6 / tataki6 / poke5 / especial2
- 数据来源: 视觉转写 PDF 第6-23页 (名称/描述) + 文本层解析 (过敏原)
- ⚠️ 需用户核对: ES名称(部分由CA派生)、CA描述(由ES翻译)、spicy/vegan标记、个别菜品(如321 carpaccio描述)

## Task 3-9 ✅ (全部完成)
- T3 设计 token + CSS: `assets/css/style.css` (明亮日系, Shippori Mincho + Zen Kaku Gothic New, 朱红点缀, 銀 motif)
- T4 i18n: `assets/js/i18n.js` + `assets/data/i18n.json` (ES/CA/EN, localStorage, ?lang=, langchange 事件)
- T5/6 首页 `index.html`: 导航+语言切换 / Hero(銀水印) / 自助概念 / 4.8★亮点 / 图库预览+灯箱 / CoverManager预订 / 页脚
- T7 菜单页 `menu.html` + `assets/js/menu.js`: 粘性分类Tab + 编号菜品 + 过敏原徽标 + 辣/素 + PDF下载(随语言)
- T8 图库灯箱 `assets/js/gallery.js`: 网格+灯箱+键盘+滑动
- T9 路由 `vercel.json`: 旧URL 301重定向到新页

### 验证 (headless Chrome 渲染)
- ✅ 首页 Hero/概念/亮点/图库/预订/页脚 全部正常
- ✅ CoverManager 预订 iframe 实际加载成功 (西语日历)
- ✅ 菜单页三语切换 (UI+菜品数据+PDF链接) — 已验证 EN
- ✅ 图片压缩: 大图 3.8M, 缩略图 880K (原 165M)
- ⚠️ 修复: reveal 动画加了降级保护(JS失败/慢时内容仍可见)

## 追加: 菜单菜品照片 ✅
- 从 PDF 提取 142 张菜品照片到 `images/menu/<code>.jpg` (共 1.5M, 480px q80)
- 方法: `pdftohtml -xml` 拿到每张图的坐标 + 编号标签坐标 → 按"照片在编号正上方同列"做位置映射 (而非按提取顺序, 顺序不可靠)
- 已验证多种版式 (3列前菜 / 2列uramaki / 大图nigiri / poke / combo) 映射全部正确
- menu.js 每个菜品卡片左侧加缩略图 (lazy + onerror 优雅降级); CSS `.m-item` 改为 照片+正文 布局

## 追加迭代 (用户反馈)
- ✅ 菜单卡片照片偏移修复: 描述紧贴菜名 (`.m-item__body` 改块级堆叠), 缩略图 84px
- ✅ 过敏原数字→官方图标: 从 PDF 第4页提取 14 个彩色圆形图标到 `images/allergens/<1-14>.png` (128K)。方法: pdftoppm 渲染 + 按网格定位圆盘 + 圆形 alpha 遮罩。menu.js 渲染 `<img class="allg">` + legend 同步
- ✅ 联系区加 Google 地图嵌入 (footer `.footer-map`, 免 key 的 q=lat,lng&output=embed)
- ✅ 手机端横向滚动条修复: 根因是固定定位的 off-canvas 抽屉撑宽页面 → `html{overflow-x:clip}` (body clip 无法裁剪 fixed 元素)。验证 scrollWidth==viewport
- ✅ 分类 Tab 横向滚动条隐藏 (scrollbar-width:none + ::-webkit-scrollbar)
- ✅ 缓存版本 ?v=4 (强制刷新新 CSS/JS)
- 注: headless 截图强制 500px 视口 + 100svh hero, 故移动端"截断"是工具假象, 实际 390px 正常

## 追加迭代 2 (用户反馈 06-21)
- ✅ 移动端导航抽屉错位修复 (根因): `.site-nav` 的 `backdrop-filter` 会为 `position:fixed` 子元素创建 containing block, 把抽屉困在 ~56px 高的导航条内 → 链接散落悬浮在 hero 上。修复: `@media(max-width:860px)` 内 `.site-nav{backdrop-filter:none}` + 提高背景不透明度 (桌面端保留模糊)。抽屉现为右侧整高奶白面板, 已加 `.nav-scrim` 半透明遮罩。CDP 412px 验证: 5 链接整齐、有遮罩
- ✅ 预订横向滚动条: `@media(max-width:600px)` 把 `.reserve-wrap` padding 降到 .35rem, 让 CoverManager 组件拿到近满宽 (~365px > 其最小宽), 避免内部横向滚动。`.reserve-wrap{overflow:hidden}`
- ✅ 地图改小并移位: 删除页脚顶部全宽 `.footer-map` 横幅, 改为联系信息(邮箱下方)的紧凑 `.contact-map` (max-width 320px, 高 168px)。index + menu 两页
- ✅ 图库白缝: 合并预览(6)+完整(原 7)两个 section 为单一 grid (12 张, 去掉与 hero 重复的 ins-mix-nigiri-3)。多余图 `.is-extra{display:none}`, 按钮加 `.show-all` 类就地展开 → 同网格同 gap, 中间不再留大白块。CDP 验证连续 6×2 网格
- ✅ 过敏原图标文字渗漏修复: 旧图标(芹菜7/牛奶12/蛋14 等)裁切带进了下方标签文字。重新用最大连通色块定位圆盘 + 收紧圆形遮罩重裁 14 个 (128K→256K, 128px)。CDP 菜单页验证干净圆形
- ✅ 缓存版本 ?v=5

## 追加迭代 3 (用户反馈 06-21)
- ✅ 地图移到页脚左栏 (品牌/简介/社媒下方), 不再在中间联系栏。index + menu
- ✅ 移动端抽屉"完全无法点击"修复 (堆叠上下文陷阱): `.nav-scrim`(z-65) 是 `.site-nav`(z-60) 的兄弟, 但抽屉 z-70 被困在 nav 的堆叠上下文内 (实际封顶在 60), 故 scrim 盖在抽屉之上吞掉点击。修复: scrim 降到 z-50 (低于 nav)。CDP elementFromPoint 验证链接位置顶层元素=链接本身
- ✅ 菜品照片"位移"修复: 源图是白底、菜品偏下居中, `object-fit:cover` 裁切导致每张取景不一致(碗被切/偏移)。改 `object-fit:contain` + 白底 + 3px padding → 整道菜居中完整显示, 各卡一致。CDP 菜单页验证
- ✅ 缓存版本 ?v=6

## 追加迭代 4 (用户反馈 06-21)
- ✅ 预订区底部大片留白: CoverManager 的 iframeResizer 在真实浏览器里把 iframe 高度过度上报(~1300px)。移除 resizer 脚本 + onload, 改固定高度 (桌面 620px / 手机 840px, 模块手机端纵向堆叠故更高)。CDP 验证 iframeH=620/840, 不再过高
- ✅ 过敏原布局怪异(4+2 错位): `.m-item__allerg` 还留着旧的右对齐 + max-width:7rem(为旧的侧栏布局设计), 在块级堆叠下逼出窄列换行。改为左对齐 `display:flex;flex-wrap:wrap;gap:.35rem`、去掉宽度上限, 图标缩到 1.4rem → 全部图标在名称下一行平铺。CDP 验证 6 图标单行
- ✅ 缓存版本 ?v=7

## 追加迭代 5 (用户反馈 06-21)
- ✅ 预订区留白再收紧: CoverManager 模块桌面端实际只有 ~470px(日历+表单+footer, Time 是原生下拉不撑高), 620px 仍留 ~150px 空白。改 桌面 500px / 手机 720px。CDP: iframeH=500/720, wrap=566/733。注: 用户截图底部仍是 `v ___COMMIT__` 占位 + 老留白, 说明其浏览器仍缓存旧版 → 已 ?v=8 强制刷新

## 待用户核对项 (汇总)
- [ ] 菜单数据 (从 PDF 提取, 可能有识别误差)
- [ ] 营业时间 (确切值)
- [ ] CoverManager 三语 URL (catalan/english 路径)
- [ ] 社媒链接 (Instagram/其他)
