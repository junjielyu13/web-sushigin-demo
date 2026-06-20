# 把网站部署到 Vercel + 迁移域名（sushigin.es）

本文记录如何把 `web-sushigin` 静态网站部署到 Vercel，并把域名 `sushigin.es`
从旧服务器（IONOS 托管）指向 Vercel。整个过程**不需要把域名转走**，只改 DNS 记录即可。

> 适用场景：域名在 IONOS、网站要跑在 Vercel。其他注册商/平台原理相同，
> 区别只是后台界面不同。

---

## 0. 前置概念（先看懂再动手）

- **DNS 的 A 记录**：把域名翻译成一个 IP 地址。改了它，域名就指向新服务器。
- **CNAME 记录**：把一个子域名（如 `www`）指向另一个域名。
- **迁移网站 ≠ 转移域名所有权**：
  - 让网站跑在 Vercel → **只要能改 DNS** 即可（本文做的事）。
  - 让域名归属换人 → 那是另一回事（转注册商 / 变更 titular），本文不涉及。
- **关键**：只改“网站相关”的记录（A / CNAME），
  **邮箱相关的记录（MX、SPF、DKIM、DMARC 等）一条都不要动**，否则邮件会坏。

---

## 第一部分：把网站部署到 Vercel

采用 **GitHub → Vercel** 方式，以后 `git push` 会自动重新部署。

### 1. 把代码推到 GitHub

```bash
# 在项目目录里
git init -b main
git remote add origin git@github.com:junjielyu13/web-sushigin.git
git add -A
git commit -m "Initial import"
git push -u origin main
```

> `.gitignore` 已排除 `.DS_Store` 和 `*.psd`。

### 2. 在 Vercel 导入仓库（新建项目）

1. 打开 <https://vercel.com/new>
2. **Import Git Repository** → 选择 `junjielyu13/web-sushigin`
   - 看不到仓库就点 “Adjust GitHub App Permissions” 授权
3. 纯静态站，配置用默认即可：
   - Framework Preset：**Other**
   - Build / Output：默认（本项目用 `vercel.json` 管理，见下）
4. 点 **Deploy**，得到一个 `web-sushigin-xxx.vercel.app` 网址
5. ⚠️ 一定是**新建的 web-sushigin 项目**，别加到别的项目里

### 3. （可选）页脚版本号

`vercel.json` 里配置了构建命令，部署时会把各菜单页页脚的占位符
`__COMMIT__` 替换成当前部署 commit 的前 7 位（环境变量
`VERCEL_GIT_COMMIT_SHA`），所以右下角版本号会随每次部署自动更新。

```json
{
  "framework": null,
  "buildCommand": "SHA=$(echo \"${VERCEL_GIT_COMMIT_SHA:-local}\" | cut -c1-7); sed -i \"s/__COMMIT__/$SHA/g\" menu_en.html menu_en_new.html menu_es.html menu_ca.html",
  "outputDirectory": "."
}
```

---

## 第二部分：把域名迁到 Vercel（改 DNS）

### 4. 在 Vercel 项目里添加域名

1. 进 **web-sushigin** 项目 → 左侧 **Domains** → 右上角 **Add Existing**
2. 输入 `sushigin.es` → （可勾选/取消 “Redirect apex to www”，决定主网址带不带 www）
3. 环境选 **Production** → **Add Domain**
4. Vercel 会显示**需要在 IONOS 配置的记录**，例如：

   | 用途 | Type  | Name  | Value（以 Vercel 实际显示为准，用复制按钮 📋） |
   |------|-------|-------|------------------------------------------------|
   | 根域名 | A     | `@`   | `216.198.79.1`（或旧值 `76.76.21.21`） |
   | www  | CNAME | `www` | `xxxxxxxx.vercel-dns-0xx.com.`（或旧值 `cname.vercel-dns.com`） |

   > Vercel 偶尔更新推荐 IP/CNAME，**永远以 Dashboard 显示的为准**，
   > 并用复制按钮复制，避免手打错一位。

### 5. 在 IONOS 修改 DNS

进 `sushigin.es` 的 DNS 设置（Dominios & SSL → 选域名 → DNS），改 **2 处**：

**① 根域名 A 记录**
- 找到 `A` / Name `@` / 旧值 `162.0.217.129`
- 点 ✏️ 编辑 → 值改成 Vercel 给的 A 值（如 `216.198.79.1`）→ 保存

**② www 改成 CNAME**
- 找到 `A` / Name `www` / 旧值 `162.0.217.129` → **删除 🗑**
- 点 **Añadir registro（新增记录）** → 新建：
  - Type：**CNAME**
  - Name：`www`
  - Value：Vercel 给的 CNAME 值（如 `xxxxxxxx.vercel-dns-0xx.com.`）
  - 保存

### 6. ⛔ 不要动的记录（邮箱相关）

下面这些保持原样，**改了/删了邮件就会出问题**：

| Type  | Name                     | 值（示例）              | 作用 |
|-------|--------------------------|-------------------------|------|
| MX    | `@`                      | `mx00.ionos.es` / `mx01.ionos.es` | 收信 |
| TXT   | `@`                      | `v=spf1 include:_spf-eu.ionos.com ...` | SPF 防伪造 |
| CNAME | `s1-ionos._domainkey`    | `s1.dkim.ionos.com`     | DKIM |
| CNAME | `s2-ionos._domainkey`    | `s2.dkim.ionos.com`     | DKIM |
| CNAME | `s42582890._domainkey`   | `s42582890.dkim.ionos.com` | DKIM |
| CNAME | `_dmarc`                 | `dmarc.ionos.es`        | DMARC |
| CNAME | `autodiscover`           | `adsredir.ionos.info`   | 邮箱自动配置 |
| CNAME | `_domainconnect`         | `_domainconnect.ionos.com` | IONOS 助手 |

---

## 第三部分：验证

### 7. 等待生效并确认

1. 回 Vercel 的 Domains 页面点 **Refresh**
2. DNS 传播一般几分钟~几小时，状态会从 🔴 **Invalid Configuration**
   变成 🟢 **Valid Configuration**，并自动签发免费 HTTPS 证书
3. 访问 `https://sushigin.es` 应显示新网站

### 8. 命令行查验解析（可选）

```bash
# 根域名应指向 Vercel 的 A 值
dig +short A sushigin.es

# www 应指向 Vercel 的 CNAME 目标
dig +short www.sushigin.es

# 查 nameserver（确认仍在 IONOS：ui-dns.*）
dig +short NS sushigin.es
```

---

## 常见问题

- **域名一直 Invalid？** 多半是 DNS 还没传播，或 IONOS 里值打错。等一会儿再
  Refresh；用 `dig` 核对实际解析值是否等于 Vercel 要求的值。
- **网站好了但邮件收不到了？** 多半误改/误删了 MX/SPF/DKIM。对照第 6 节恢复。
- **想用不带 www 的主网址？** 在第 4 步取消勾选 “Redirect apex to www”。
- **要不要把域名转出 IONOS？** 不需要。本流程只改 DNS，域名仍注册在 IONOS。
