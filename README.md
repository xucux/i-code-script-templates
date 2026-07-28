# i-code Script Templates

i-code 应用可复用的 Rhai 脚本模板集合。

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