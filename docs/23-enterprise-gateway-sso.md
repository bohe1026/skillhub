# 企业认证网关 SSO 接入说明

本文档记录 SkillCenter 私有化部署接入企业认证网关的代码侧实现和部署开关。

## 接入方式

企业认证网关认证通过后，会向后端请求注入一个带签名的 JWT header。header 名称由部署环境变量配置，SkillCenter 后端会：

1. 使用网关应用密钥验签。
2. 要求 JWT 必须包含 `iat` 和 `exp`。
3. 读取 `username` 作为外部用户唯一标识。
4. 可选读取 `name`、`email`，用于展示名和邮箱。
5. 通过现有 OAuth 身份绑定流程创建或复用本地用户。
6. 建立 SkillCenter 自己的 Spring Session。

不会信任纯用户名 header，也不会把网关密钥暴露给前端。

## 后端环境变量

```bash
SKILLHUB_AUTH_SESSION_BOOTSTRAP_ENABLED=true
SKILLHUB_AUTH_GATEWAY_JWT_ENABLED=true
SKILLHUB_AUTH_GATEWAY_JWT_SECRET='<企业认证网关应用 JWT Secret>'
SKILLHUB_AUTH_GATEWAY_JWT_PROVIDER_CODE=enterprise-sso
SKILLHUB_AUTH_GATEWAY_JWT_HEADER_NAME=X-Enterprise-Authorization
```

`SKILLHUB_AUTH_GATEWAY_JWT_PROVIDER_CODE` 默认是 `enterprise-sso`。如果网关侧已有固定 provider code，可通过环境变量覆盖。

## 前端环境变量

```bash
SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_ENABLED=true
SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_PROVIDER=enterprise-sso
SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_AUTO=false
```

建议先保持 `AUTO=false`，让用户点击“企业 SSO”按钮触发登录。确认网关链路稳定后，再考虑打开自动探测。

## Compose 覆盖示例

`compose.release.yml` 不会自动把所有 `.env` 变量传入容器，所以私有化部署需要在本地 compose override 中显式透传。示例：

```yaml
services:
  server:
    environment:
      SKILLHUB_AUTH_SESSION_BOOTSTRAP_ENABLED: ${SKILLHUB_AUTH_SESSION_BOOTSTRAP_ENABLED:-true}
      SKILLHUB_AUTH_GATEWAY_JWT_ENABLED: ${SKILLHUB_AUTH_GATEWAY_JWT_ENABLED:-true}
      SKILLHUB_AUTH_GATEWAY_JWT_SECRET: ${SKILLHUB_AUTH_GATEWAY_JWT_SECRET}
      SKILLHUB_AUTH_GATEWAY_JWT_PROVIDER_CODE: ${SKILLHUB_AUTH_GATEWAY_JWT_PROVIDER_CODE:-enterprise-sso}
      SKILLHUB_AUTH_GATEWAY_JWT_HEADER_NAME: ${SKILLHUB_AUTH_GATEWAY_JWT_HEADER_NAME:-X-Enterprise-Authorization}

  web:
    environment:
      SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_ENABLED: ${SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_ENABLED:-true}
      SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_PROVIDER: ${SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_PROVIDER:-enterprise-sso}
      SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_AUTO: ${SKILLHUB_WEB_AUTH_SESSION_BOOTSTRAP_AUTO:-false}
```

## 登录页策略

- 公司 SSO 是主入口。
- 普通用户和管理员的账号密码登录保留为折叠入口。
- 登录页不再展示注册入口。
- 本地自助注册默认关闭，避免知道接口地址的人绕过前端直接注册。

## 验证方式

进入企业认证网关后的业务域名，点击登录页的“企业 SSO”：

- 成功：返回 `/api/v1/auth/session/bootstrap` 200，并跳转到控制台。
- header 缺失、签名错误、过期或缺少 `username`：返回 401。
- 用户被禁用：返回 403。

可以在服务端查看日志：

```bash
docker compose --env-file .env -f compose.release.yml -f compose.local.yml logs --since=10m server \
  | grep -E "session/bootstrap|gateway JWT|401|403"
```
