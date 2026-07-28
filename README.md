# i-code Script Templates

> [i-code](https://github.com/xucux/i-code) 是一个本地 AI 网关与 CLI 配置管理中心，支持额度监控、多供应商代理、集中配置管理等功能。本仓库是 i-code 应用可复用的 Rhai 脚本模板集合，当前主要提供**额度监控**（balance）类脚本。

## 目录结构

```
templates/
  {kind}/
    {slug}/
      meta.json         # 模板元数据
      script.rhai       # 脚本正文
      README.md         # 可选：说明文档
catalog.json            # 市场索引（CI 自动生成）
```

## 类型

| kind | 说明 |
|------|------|
| `balance` | 额度监控脚本 |

## 模板列表

| 名称 | slug | 作者 | 类型 | 说明 |
|------|------|------|------|------|
| 小米 MiMo 按量计费额度查询 | `mimo-balance` | i-code | balance | Cookie 鉴权查询小米 MiMo 按量计费余额 |
| 小米 MiMo 套餐积分查询 | `mimo-token-plan` | i-code | balance | Cookie 鉴权查询小米 MiMo 套餐积分用量 |
| 京东 JoyAgent 积分查询 | `joyagent-balance` | i-code | balance | Cookie 鉴权查询京东 JoyAgent 积分 |
| 公益 Grok 额度监控 | `grok-usage` | i-code | balance | x-api-key 鉴权查询公益 Grok 额度与 Token 用量 |

## 投稿

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 脚本开发指南

编写额度监控脚本的详细说明请参阅 [prompt/balance-script-prompt-guide.md](./prompt/balance-script-prompt-guide.md)，涵盖 Rhai 语法、系统变量与函数、返回值结构、完整示例等内容。