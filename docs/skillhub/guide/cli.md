# SkillCenter CLI 兼容使用说明

SkillCenter 当前推荐使用 ClawHub 兼容 CLI 访问注册中心，用于搜索、安装和发布 Agent 技能包。实例地址请以你的部署域名为准。

## 安装与配置

```bash
# 使用 npx 直接运行
npx clawhub --help

# 配置注册中心地址
export CLAWHUB_REGISTRY=https://skillcenter.example.com
export CLAWHUB_SITE=https://skillcenter.example.com
```

Windows PowerShell：

```powershell
$env:CLAWHUB_REGISTRY="https://skillcenter.example.com"
$env:CLAWHUB_SITE="https://skillcenter.example.com"
```

## 常用命令

```bash
# 搜索技能
npx clawhub search pdf

# 安装 global 命名空间技能
npx clawhub install pdf-parser --registry https://skillcenter.example.com

# 安装团队命名空间技能，格式为 namespace--skill
npx clawhub install team-alpha--pdf-parser --registry https://skillcenter.example.com

# 发布技能包
npx clawhub publish ./my-skill --registry https://skillcenter.example.com
```

## 命名规则

| SkillCenter 坐标 | CLI slug |
|---|---|
| `@global/my-skill` | `my-skill` |
| `@team-alpha/my-skill` | `team-alpha--my-skill` |

没有 `--` 的 slug 默认解析到 `global` 命名空间。

## 认证

如果访问私有技能或发布技能，需要先在 Web 控制台创建 API Token，然后执行：

```bash
npx clawhub login --token sk_xxx --registry https://skillcenter.example.com
```

## 本地开发验证

```bash
export CLAWHUB_REGISTRY=http://localhost:8080
npx clawhub search test
npx clawhub install example-skill
```
