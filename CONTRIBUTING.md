# Contributing to i-code Script Templates

## PR 规范

- 一 PR 一模板（或同 kind 小批量相关模板）
- 必须包含 `meta.json` + `script.rhai`
- 脚本仅使用文档公开的 host functions / 系统变量
- 不得硬编码密钥；示例用 `api_key`、`variables["cookie"]` 等系统变量
- 维护者审查：HTTP 目标 host、有无危险逻辑、返回结构是否符合规范

## 目录约定

```
templates/{kind}/{slug}/
├── meta.json       # 必填
├── script.rhai     # 必填
└── README.md       # 可选
```

## CI 检查

Merge 后 CI 自动：
1. 校验每个 `meta.json` 符合 JSON Schema
2. 校验 `slug` 与目录名一致
3. 校验 `kind` 与路径一致
4. 校验 `script.rhai` 存在
5. 重建 `catalog.json`