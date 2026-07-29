// 日日新 (SenseNova) Token Plan 调用次数查询
// 引擎：Rhai（语法接近 JS，map 用 #{ }，数组用 [ ]）
// 鉴权：Bearer Token（请在供应商的「扩展模板变量」中添加 key 为 `token` 的变量）
// 说明：查询 deepseek-v4-flash 模型的剩余调用次数百分比
// 每个模型每5小时1500次调用
// auth.account_id 自动从供应商配置中注入

let base = "https://platform.sensenova.cn";
// 供应商的「扩展模板变量」中添加 key 为 `account_id` 的变量
let account_id = variables["account_id"];

// 构造查询 URL，只请求 deepseek-v4-flash 模型数据
let url = base + `/lite/console/v1/user/coding-plan/usages?account_id=${account_id}&model_ids=deepseek-v4-flash`;

let headers = #{
    "Authorization": "Bearer " + variables["token"],
    "Referer": "https://platform.sensenova.cn/console",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
};

let resp = http::get(url, headers);
if resp.status < 200 || resp.status >= 300 {
    error(`HTTP ${resp.status}: ${resp.body}`);
}

let json = json::parse(resp.body);
let percents = json["model_remaining_percent"];
let flash_pct = percents["deepseek-v4-flash"];

if flash_pct == () {
    error("未找到 deepseek-v4-flash 模型的剩余百分比数据");
}

if flash_pct < 0.0 || flash_pct > 100.0 {
    error(`deepseek-v4-flash 剩余百分比值异常: ${flash_pct}`);
}

// 已消耗百分比
let used_pct = 100.0 - flash_pct;

#{
    items: [
        // 主指标：剩余调用次数百分比
        #{
            id: "flash_remaining_pct",
            type: "percent",
            value: flash_pct,
            basis: "remaining",
            label: "deepseek-v4-flash 剩余",
            period: "current",
            primary: true
        },
        // 副指标：已消耗百分比
        #{
            id: "flash_used_pct",
            type: "percent",
            value: used_pct,
            basis: "used",
            label: "deepseek-v4-flash 已消耗",
            period: "current"
        }
    ]
}