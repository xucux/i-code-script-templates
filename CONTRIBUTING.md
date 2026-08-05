# Contributing to i-code Script Templates

感谢你为 i-code 贡献额度监控脚本模板！本文档说明如何新增 / 修改模板，以及 `meta.json`、`script.rhai`、`varList` 等字段的具体规范。

> 编写 Rhai 脚本的完整语法、系统变量与函数参考请见 [prompt/balance-script-prompt-guide.md](./prompt/balance-script-prompt-guide.md)。本文只聚焦投稿流程与字段约束。

---

## 1. PR 规范

- **一 PR 一模板**（或同 `kind` 小批量相关模板）。
- 必须包含 `meta.json` + `script.rhai`；`README.md` 可选。
- 脚本仅使用 [prompt 指南](./prompt/balance-script-prompt-guide.md) 中公开的 host functions / 系统变量。
- **不得硬编码密钥**：示例一律用 `api_key`、`variables["cookie"]` 等系统变量占位。
- 维护者审查重点：HTTP 目标 host、有无危险逻辑、返回结构是否符合规范、`varList` 是否与脚本实际使用的变量一致。
- PR 不需要手动修改 `catalog.json`——CI 会在合并到 `main` 时自动重建并提交。

---

## 2. 目录约定

```
templates/{kind}/{slug}/
├── meta.json       # 必填：模板元数据
├── script.rhai     # 必填：脚本正文
└── README.md       # 可选：补充说明（抓包步骤、字段含义等）
```

约束：

- `slug` 必须与目录名一致（CI 会校验）。
- `kind` 必须与父目录名一致（CI 会校验），当前仅支持 `balance`。
- `script.rhai` 为默认脚本文件名；如需自定义，可在 `meta.json` 中通过 `scriptFile` 指定。

---

## 3. 新增模板步骤

### 3.1 确定信息

从目标平台的额度查询请求（curl / 浏览器抓包等）中提取：

| 信息 | 说明 |
|------|------|
| HTTP 方法 + URL | 查询端点；优先用 `provider.base_url` + `url_join`，固定域名也可 |
| 鉴权方式 | `Bearer` / `x-api-key` / `Cookie` / 无认证等 |
| 请求头 | Authorization、Cookie、Referer、User-Agent 等 |
| 响应结构 | 从 JSON 中提取剩余 / 已用 / 上限等字段 |
| 依赖变量 | 区分**系统变量**（`api_key` / `provider.base_url` 等）与**自定义扩展变量**（`variables["cookie"]` 等） |

### 3.2 编写脚本

参考 [prompt/balance-script-prompt-guide.md](./prompt/balance-script-prompt-guide.md) 的语法速查、系统变量、返回值结构与完整示例编写 `script.rhai`。关键约束：

- 模块函数用 `::` 调用（`http::get`、`json::parse`），**禁止**点号。
- 必须返回 `#{ items: [ ... ] }` 结构。
- 空值判断用 `== ()`，不支持 `null` / `undefined`。
- 仅请求 `provider.base_url` 所在 host 或 `meta.json` 中声明的 `allowedHosts`。

### 3.3 填写 meta.json

按下文 §4 的字段规范填写 `meta.json`，并**务必填写 `varList`**（见 §5），列出脚本用到的所有系统变量与自定义扩展变量。

### 3.4 本地校验

提交前在仓库根目录运行：

```bash
# 1. 校验所有 meta.json / catalog.json 是否符合 schema
node scripts/validate.mjs

# 2. 重新生成 catalog.json（仅在本地预览用，CI 会自动生成）
node scripts/build-catalog.mjs
```

`validate.mjs` 通过（`Errors: 0`）后即可提交 PR。

---

## 4. meta.json 字段规范

`meta.json` 必须符合 [schemas/template-meta.schema.json](./schemas/template-meta.schema.json)。字段说明：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `schemaVersion` | integer | 是 | 协议版本，当前固定 `1` |
| `slug` | string | 是 | 模板标识，与目录名一致，`^[A-Za-z0-9\-_.@]{1,64}$` |
| `name` | string | 是 | 模板显示名称（中文） |
| `kind` | string | 是 | 模板类型，当前仅 `balance` |
| `engine` | string | 是 | 脚本引擎，当前仅 `rhai` |
| `author` | string | 是 | 作者 |
| `authors` | string[] | 否 | 多作者列表（与 `author` 二选一即可） |
| `description` | string | 否 | 模板描述（建议填写，展示在市场列表） |
| `tags` | string[] | 否 | 标签，便于筛选（如 `cookie`、`bearer`、`xiaomi`） |
| `homepage` | string (uri) | 否 | 主页 / 文档地址 |
| `license` | string | 否 | 许可证，默认建议 `MIT` |
| `defaultTimeoutMs` | integer | 否 | 默认超时（毫秒），最小 1000，建议 15000 |
| `allowedHosts` | string[] | 否 | 脚本允许请求的额外 host（不含 `provider.base_url` 的 host） |
| `minAppVersion` | string | 否 | 所需最低 i-code 应用版本 |
| `scriptFile` | string | 否 | 脚本文件名，默认 `script.rhai` |
| `varList` | VarDef[] | 否 | 脚本依赖的变量列表，详见 §5 |
| `createdAt` | string (date-time) | 是 | 创建时间，ISO 8601 |
| `updatedAt` | string (date-time) | 是 | 更新时间，ISO 8601 |
| `version` | string | 否 | 语义化版本 `^\\d+\\.\\d+\\.\\d+$` |
| `changelog` | string | 否 | 变更说明 |

---

## 5. varList 变量列表规范

`varList` 用于**显式声明脚本依赖的所有变量**，告知用户在应用模板前需要配置哪些凭证。i-code 应用会据此提示用户补全缺失的变量。

### 5.1 字段定义

每个变量项（`VarDef`）结构：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 变量名 |
| `source` | string | 是 | 变量来源：`system` 或 `custom`（见 §5.2） |
| `required` | boolean | 是 | 是否必填。`custom` 变量 `required=true` 时，应用模板必须配置 |
| `description` | string | 否 | 变量用途说明（建议填写） |
| `example` | string | 否 | 示例值或格式提示，**禁止填写真实密钥** |

### 5.2 source 取值

| source | 含义 | name 示例 | 脚本中的访问方式 |
|--------|------|-----------|------------------|
| `system` | 引擎自动注入的系统变量 | `api_key`、`now_ms`、`provider.base_url`、`provider.name`、`auth.account_id`、`template.id` | 直接用 `api_key`、`provider.base_url` 等 |
| `custom` | 供应商「扩展模板变量」中由用户配置的键值对 | `cookie`、`token`、`account_id` | `variables["cookie"]`、`variables["token"]` |

> 系统变量完整清单见 [prompt 指南 §2 系统变量](./prompt/balance-script-prompt-guide.md#2-系统变量)。`source: "system"` 的变量无需用户额外配置（由供应商配置自动派生），但仍建议列出以便用户理解脚本依赖。

### 5.3 填写要求

1. **完整性**：脚本中实际读取的所有 `variables["xxx"]` 必须在 `varList` 中声明为 `source: "custom"`。
2. **一致性**：`name` 必须与脚本中访问的 key 完全一致（区分大小写）。
3. **真实性**：`required` 反映脚本对该变量的真实依赖——缺失会导致运行失败的设为 `true`，仅用于增强功能（如自定义 base_url 回退）的设为 `false`。
4. **示例安全**：`example` 仅给格式提示，**严禁**填入真实可用的 Token / Cookie。

### 5.4 示例

**自定义变量（Cookie 鉴权）**：

```json
"varList": [
  {
    "name": "cookie",
    "source": "custom",
    "required": true,
    "description": "完整 Cookie 字符串，作为 Cookie 头发送",
    "example": "sessionToken=\"...\"; userId=..."
  }
]
```

**自定义变量（多凭证）**：

```json
"varList": [
  {
    "name": "token",
    "source": "custom",
    "required": true,
    "description": "Bearer Token，作为 Authorization 头发送",
    "example": "eyJhbGciOiJI..."
  },
  {
    "name": "account_id",
    "source": "custom",
    "required": true,
    "description": "账户 ID，作为 URL 查询参数传入"
  }
]
```

**系统变量（api_key 鉴权）**：

```json
"varList": [
  {
    "name": "api_key",
    "source": "system",
    "required": true,
    "description": "解密后的 API Key，作为 x-api-key 头发送"
  },
  {
    "name": "provider.base_url",
    "source": "system",
    "required": false,
    "description": "供应商基础 URL，用于拼接查询端点"
  }
]
```

---

## 6. script.rhai 规范要点

完整语法与函数参考见 [prompt/balance-script-prompt-guide.md](./prompt/balance-script-prompt-guide.md)。投稿前自查：

- [ ] 模块函数用 `::`（`http::get` / `json::parse` / `log::info` / `str::to_float` 等）
- [ ] Map 用 `#{}`，数组用 `[]`
- [ ] 空值判断用 `== ()`
- [ ] HTTP 状态码与业务错误码均有检查，失败调用 `error()`
- [ ] 返回 `#{ items: [...] }`，每个指标含 `id` / `type` / 必要字段
- [ ] 仅请求 `provider.base_url` host 或 `allowedHosts` 内的 host
- [ ] 不硬编码密钥；凭证一律来自 `api_key` 或 `variables["..."]`
- [ ] `varList` 与脚本实际读取的变量逐一对应

---

## 7. catalog.json 说明

`catalog.json` 是市场索引文件，由 [scripts/build-catalog.mjs](./scripts/build-catalog.mjs) 扫描所有 `templates/**/meta.json` 自动生成。

- **无需手动编辑**：CI 会在合并到 `main` 时自动重建并提交。
- 字段从 `meta.json` 透传，并补充 `id`（`{kind}/{slug}`）、`path`、`metaPath`、`scriptPath` 等派生字段。
- 生成后会按 `updatedAt` 倒序、`name` 升序排序。
- 本地预览可运行 `node scripts/build-catalog.mjs`。

---

## 8. CI 检查

### 8.1 Pull Request

CI 会运行 [scripts/validate.mjs](./scripts/validate.mjs)，检查项：

1. 每个 `meta.json` 符合 [template-meta.schema.json](./schemas/template-meta.schema.json)（含 `varList` 内 `VarDef` 结构校验）。
2. `slug` 与目录名一致。
3. `kind` 与父目录路径段一致。
4. `script.rhai`（或 `scriptFile` 指定的文件）存在。
5. `catalog.json`（若已生成）符合 [catalog.schema.json](./schemas/catalog.schema.json)。

### 8.2 Merge 到 main

包含 PR 的所有检查，另加：

- 重新构建 `catalog.json`。
- 自动提交 `catalog.json` 到仓库（无需手动操作）。

---

## 9. 常见问题

### Q: 脚本同时用了 `api_key` 和 `variables["cookie"]`，varList 怎么写？

两者都列出，分别标 `source`：

```json
"varList": [
  { "name": "api_key", "source": "system", "required": true, "description": "Bearer Token" },
  { "name": "cookie", "source": "custom", "required": true, "description": "额外 Cookie 凭证" }
]
```

### Q: 脚本用了 `now_ms`（时间戳），需要写进 varList 吗？

建议写。虽为系统自动注入、无需用户配置，但列出能让用户了解脚本依赖，也便于维护者审查。

### Q: 脚本用了 `variables["cookie"]` 的扁平注入形式 `cookie`，怎么声明？

`name` 写 `cookie`、`source` 写 `custom`。扁平注入与 `variables["cookie"]` 是同一变量的两种访问方式，声明一份即可。

### Q: 修改了 meta.json 后需要重新生成 catalog.json 吗？

PR 中不需要——CI 会在合并时自动生成。本地预览可运行 `node scripts/build-catalog.mjs`。
