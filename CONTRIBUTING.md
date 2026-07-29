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

### Pull Request
- 校验每个 `meta.json` 符合 JSON Schema
- 校验 `slug` 与目录名一致
- 校验 `kind` 与路径一致
- 校验 `script.rhai` 存在
- 构建 `catalog.json` 以验证脚本可正常运行（不检查是否与仓库一致）

### Merge 到 main
包含 PR 的所有检查，另加：
- 重新构建 `catalog.json`
- 自动提交 `catalog.json` 到仓库（无需手动操作）