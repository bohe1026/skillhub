# Skill Judge 自动审核部署说明

本文说明如何启用基于 Skill Judge 规则的自动审核，以及如何用 Docker Compose 部署包含本地改动的后端镜像。

## 行为说明

- 自动审核默认关闭，必须显式设置 `SKILLHUB_AUTO_REVIEW_ENABLED=true`。
- 公共技能版本进入审核流程后会被自动评分。分数大于等于 `SKILLHUB_AUTO_REVIEW_PASS_SCORE` 时自动通过，低于阈值时自动驳回。
- 如果安全扫描开启，自动审核只会在扫描结果为 `SAFE` 后执行。
- 如果安全扫描关闭，技能版本进入 `PENDING_REVIEW` 后会直接触发自动审核。
- 服务会定时补偿已经进入 `PENDING_REVIEW` 但仍是 `PENDING` 的审核任务，避免重启或事件丢失导致页面一直显示待审核。
- 如果读取 bundle 或评分过程失败，系统只记录 warning 日志，不自动通过或驳回，保留人工审核兜底。

## 环境变量

```bash
SKILLHUB_AUTO_REVIEW_ENABLED=true
SKILLHUB_AUTO_REVIEW_PASS_SCORE=96
SKILLHUB_AUTO_REVIEW_REVIEWER_ID=system-auto-review
# 可选：启动后首次补偿等待时间，默认 15 秒
SKILLHUB_AUTO_REVIEW_COMPENSATION_INITIAL_DELAY_MS=15000
# 可选：两次补偿扫描间隔，默认 60 秒
SKILLHUB_AUTO_REVIEW_COMPENSATION_DELAY_MS=60000
```

评分满分为 120。默认阈值 96 对应 Skill Judge 的 B 档，适合作为自动通过线；如果希望更严格，可以提高到 108。

## Docker Compose 部署

`compose.release.yml` 默认使用发布镜像。如果你要部署本地源码里的自动审核改动，需要先构建本地后端镜像：

```bash
cd /Users/bobsong/Documents/skill-hub/skillhub
docker build -t skillhub-server:auto-review ./server
```

然后创建本机覆盖文件 `compose.local.yml`：

```yaml
services:
  server:
    image: skillhub-server:auto-review
```

确认 `.env.release` 中保留你的公网地址、端口、管理员账号和 BOS/S3 配置，并加入自动审核配置：

```bash
WEB_PORT=8001
SKILLHUB_PUBLIC_BASE_URL=http://168.138.171.0:8001

SKILLHUB_STORAGE_PROVIDER=s3
SKILLHUB_STORAGE_S3_ENDPOINT=https://s3.bj.bcebos.com
SKILLHUB_STORAGE_S3_PUBLIC_ENDPOINT=https://skill-hub.bj.bcebos.com
SKILLHUB_STORAGE_S3_BUCKET=skill-hub

SKILLHUB_AUTO_REVIEW_ENABLED=true
SKILLHUB_AUTO_REVIEW_PASS_SCORE=96
SKILLHUB_AUTO_REVIEW_REVIEWER_ID=system-auto-review
```

启动或更新服务：

```bash
docker compose --env-file .env.release \
  -f compose.release.yml \
  -f compose.local.yml \
  up -d
```

查看状态和后端日志：

```bash
docker compose --env-file .env.release -f compose.release.yml -f compose.local.yml ps
docker compose --env-file .env.release -f compose.release.yml -f compose.local.yml logs -f server
```

## 验证方式

1. 上传一个公共技能版本并提交审核。
2. 如果安全扫描开启，先确认扫描通过。
3. 查看审核任务是否自动通过或驳回。
4. 查看 `server` 日志中是否出现 `Auto review skipped`。如果出现，说明自动审核失败后已回退到人工审核。
