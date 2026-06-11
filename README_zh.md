# SkillCenter

SkillCenter 是面向团队私有部署的 Skill 注册中心，用于发布、审核、检索、复用和治理 Agent 技能。

系统提供 Web 控制台、审核流程、技能包存储、全文搜索、命名空间治理、API Token，以及兼容 ClawHub 的注册中心接口。

## 核心能力

- **私有部署**：部署在自己的服务器和网络环境中。
- **技能发布**：上传 ZIP 技能包，管理版本生命周期。
- **审核治理**：支持提交、审核、通过、拒绝、审计记录。
- **自动审核**：可接入 Skill Judge 自动评分，并生成优化建议。
- **搜索发现**：按关键字、命名空间、时间、下载量检索技能。
- **命名空间管理**：支持 global 和团队空间的权限边界。
- **可插拔存储**：开发环境可用本地文件，生产环境可用 S3 兼容存储。
- **Web + CLI 接入**：支持 Web 控制台和兼容 CLI 工作流。

## 快速开始

```bash
make dev-all
```

启动后访问：

- Web UI：`http://localhost:3000`
- 后端 API：`http://localhost:8080`

停止本地环境：

```bash
make dev-all-down
```

## Docker Compose 部署

复制并修改发布环境配置：

```bash
cp .env.release.example .env.release
```

启动发布栈：

```bash
make validate-release-config
docker compose --env-file .env.release -f compose.release.yml up -d
```

如果需要使用本地镜像覆盖，保留你的 `compose.local.yml`，然后执行：

```bash
docker compose --env-file .env -f compose.release.yml -f compose.local.yml up -d
```

## 常用开发命令

```bash
make help
make test
make test-backend-app
make build-backend-app
make typecheck-web
make build-web
make generate-api
```

后端模块测试建议使用上面的仓库命令，或 Maven 搭配 `-am`，避免单独构建应用模块时使用到本地 Maven 缓存里的旧 sibling module。

## 项目结构

```text
server/      后端服务和领域模块
web/         React Web 控制台
scanner/     技能包扫描服务
docs/        部署和实现说明
scripts/     发布、冒烟测试和维护脚本
deploy/      Kubernetes 和部署资产
monitoring/  Prometheus / Grafana 监控资产
```

## 配置说明

运行配置通过环境变量提供。部分兼容变量仍保留 `SKILLHUB_` 前缀，用于在 SkillCenter 改名后继续兼容现有 compose 覆盖、镜像入口脚本和后端配置。

重点配置包括：

- 对外访问地址
- PostgreSQL / Redis
- 对象存储
- 初始化管理员
- 账号密码登录
- 安全扫描
- 自动审核

部署细节见 `.env.release.example`、`compose.release.yml` 和 `docs/20-auto-review-deployment.md`。

## Skill Judge 自动审核

SkillCenter 可以在安全扫描通过后自动处理审核任务。

常用开关：

```bash
SKILLHUB_AUTO_REVIEW_ENABLED=true
SKILLHUB_AUTO_REVIEW_PASS_SCORE=96
SKILLHUB_AUTO_REVIEW_REVIEWER_ID=system-auto-review
```

审核报告会包含分数、通过或拒绝原因、逐项问题、具体修改建议和优化说明。提交人可在权限允许时使用一键优化功能。

## Registry 接入

SkillCenter 提供兼容 ClawHub 的注册中心接口。把兼容客户端指向你的公网地址即可：

```bash
export CLAWHUB_REGISTRY=https://skillcenter.example.com
npx clawhub search email
npx clawhub install my-skill
```

团队命名空间技能使用兼容 slug：

```bash
npx clawhub install team-name--my-skill
```

## 部署建议

- 公网地址使用最终 HTTPS 入口
- PostgreSQL 和 Redis 不直接暴露公网
- 生产环境使用 S3 兼容存储保存技能包
- 对外开放前修改初始化管理员密码
- 启动前执行 `make validate-release-config`
- 明确配置 scanner 和 auto-review 开关
