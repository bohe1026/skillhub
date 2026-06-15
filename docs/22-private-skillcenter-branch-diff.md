# Private SkillCenter Branch Diff

本文档汇总 `codex/private-local-auth-hardening` 分支相对 `main` 分支的主要差异。

## 对比范围

- 当前分支：`codex/private-local-auth-hardening`
- 对比基准：`main`
- Merge base：`7e23508a32e2e30d7e266b0726666e62f0266724`
- 最新提交：`f687f080 fix(auth): remove email from self registration`
- 差异规模：`205 files changed, 7869 insertions(+), 3461 deletions(-)`

## 变更分布

| 区域 | 文件数 | 说明 |
| --- | ---: | --- |
| `web/` | 76 | 前端品牌、登录注册、审核、一键优化、页面风格和组件样式 |
| `server/` | 65 | 自动审核、Skill Judge、一键优化、邀请码注册、用户密码管理 |
| `docs/` | 30 | 部署说明、功能差异说明、SkillCenter/私有化文档调整 |
| `document/` | 22 | 文档站内容和品牌表述调整 |
| `scanner/` | 3 | 扫描器文档和规则命名调整 |
| `.github/` | 3 | release/issue 脚本中的品牌表述调整 |
| 其他 | 6 | README、compose、示例环境变量、logo 等 |

## 提交列表

```text
76caaecc feat: add skill judge auto review
19658ab8 feat: render skill judge auto review report
d7da40e5 fix: backfill pending auto reviews
9a17537a fix: delete review tasks when replacing versions
67816d3a feat: add skill judge one-click optimization
84042eb6 feat: preserve Chinese skill semantics during optimization
491318c6 feat: show skill optimization summary dialog
eda91a17 docs: summarize skill judge auto review changes
fec93aff feat(web): refresh tech homepage style
8412011a fix(web): improve floating panel readability
8d0e9948 fix(web): close optimize dialog before opening review
0174b0f3 fix(review): limit one-click optimization to submitter
c760b72d fix(web): show owner optimization on skill detail
ddc80444 fix(web): surface owner optimization above review report
195440ce fix(review): find rejected owner task for optimization
e2ff63e6 fix(web): match owner rejected review by version id
c678a01d fix(review): optimize rejected skill version directly
30f198a7 fix(review): compile direct version optimization
e1de94e5 fix(test): update skill detail dto constructor
8494e396 fix(web): hide review actions from submitters
8c9b2308 chore(brand): rebrand public surfaces to SkillCenter
88246dc4 fix(web): make landing metrics enterprise focused
8135979c fix(auth): harden private local account flows
443c397f feat(web): add profile password change dialog
7ad06f61 feat(auth): require invite codes for self registration
98540024 fix(auth): make department invite permanent
f687f080 fix(auth): remove email from self registration
```

## 功能差异

### 1. Skill Judge 自动审核

相对 `main`，当前分支新增了完整的 Skill Judge 自动审核链路。

- 新增自动审核配置：`AutoReviewProperties`
- 新增自动审核服务：`AutoReviewAppService`
- 新增安全扫描完成事件监听：`AutoReviewEventListener`
- 新增补偿任务：`AutoReviewCompensationTask`
- 安全扫描通过后可自动进入 Skill Judge 评分
- 达到通过分数线时自动通过审核
- 未达到通过分数线时自动拒绝并写入审核意见
- 对历史卡住的待审核任务增加补偿处理

核心文件：

- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/AutoReviewAppService.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/AutoReviewEventListener.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/task/AutoReviewCompensationTask.java`
- `server/skillhub-domain/src/main/java/com/iflytek/skillhub/domain/event/SecurityScanCompletedEvent.java`
- `server/skillhub-app/src/main/resources/application.yml`

### 2. 中文 Skill Judge 审核报告

当前分支不再只返回简单通过/拒绝结果，而是生成更接近真实 Skill Judge 的中文审核报告。

报告包含：

- 总分
- 通过或拒绝原因
- 逐项问题
- 具体修改建议
- 示例改写
- 风险提示

核心文件：

- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/HeuristicSkillJudgeEvaluator.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/SkillJudgeEvaluationResult.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/SkillJudgeIssue.java`
- `web/src/features/review/review-comment-report.tsx`
- `web/src/pages/dashboard/review-detail.tsx`

### 3. 一键优化

当前分支新增了被拒 Skill 的一键优化能力。

优化原则：

- 保留原中文 `description`
- 根据审核报告逐项补强
- 只在缺少的地方追加内容
- 不覆盖业务语义
- 优先补强触发条件、使用前置条件、步骤、错误处理、输出格式、风险提示
- 优化结果中展示新增内容和保留内容

权限设计：

- 提交人/Skill Owner 可以看到 Skill Judge 报告
- 提交人/Skill Owner 可以一键优化
- 提交人/Skill Owner 可以查看优化差异并重新提交
- 管理员/审核员可以看到报告并执行审核
- 管理员/审核员默认不显示一键优化入口
- 普通提交人不显示审核通过/拒绝操作

核心文件：

- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/SkillJudgeOptimizationAppService.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/service/autoreview/SkillJudgePackageOptimizer.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/dto/ReviewOptimizationResponse.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/controller/portal/ReviewController.java`
- `web/src/features/review/review-optimization-dialog.tsx`
- `web/src/pages/dashboard/review-detail.tsx`
- `web/src/pages/skill-detail.tsx`

### 4. 私有化本地账号体系

当前分支将账号体系调整为更适合私有化部署。

新增能力：

- 本地账号直登
- 管理员创建用户
- 管理员重置用户密码
- 用户在个人设置里修改自己的密码
- 自助注册需要邀请码
- 管理员可创建和撤销邀请码
- 部门邀请码可设置为永久有效
- 当前自助注册不再要求邮箱

设计结果：

- 不依赖邮件系统完成普通用户注册
- 不依赖邮箱找回密码
- 可以通过管理员重置密码解决忘记密码问题
- 可以通过邀请码控制注册范围，避免任何人随便注册

核心文件：

- `server/skillhub-app/src/main/java/com/iflytek/skillhub/config/LocalAuthSelfServiceProperties.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/controller/LocalAuthController.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/controller/admin/UserManagementController.java`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/controller/admin/RegistrationInviteAdminController.java`
- `server/skillhub-auth/src/main/java/com/iflytek/skillhub/auth/local/LocalAuthService.java`
- `server/skillhub-auth/src/main/java/com/iflytek/skillhub/auth/local/RegistrationInviteService.java`
- `server/skillhub-app/src/main/resources/db/migration/V43__registration_invite.sql`
- `server/skillhub-app/src/main/resources/db/migration/V44__make_department_invite_permanent.sql`
- `web/src/pages/login.tsx`
- `web/src/pages/register.tsx`
- `web/src/pages/reset-password.tsx`
- `web/src/pages/admin/users.tsx`
- `web/src/pages/settings/profile.tsx`

### 5. 前端品牌和视觉改造

当前分支对前端做了较大范围的私有化品牌和视觉调整。

主要变化：

- 将公开界面品牌从 SkillHub 调整为 SkillCenter
- 首页改为泛科技 Skill 注册中心风格
- 移除或弱化开源项目痕迹
- 移除社区驱动、下载量等偏开源平台表达
- 登录页去掉 OAuth 主入口文案
- 注册页改为邀请码注册
- 子页面、按钮、弹窗和表单统一新风格
- 调整悬浮面板可读性
- 替换 favicon/logo 等视觉资源

核心文件：

- `web/src/pages/landing.tsx`
- `web/src/pages/login.tsx`
- `web/src/pages/register.tsx`
- `web/src/index.css`
- `web/src/app/layout.tsx`
- `web/src/app/layout-header-style.ts`
- `web/public/favicon.svg`
- `skillhub-logo.svg`
- `web/src/i18n/locales/zh.json`
- `web/src/i18n/locales/en.json`

### 6. API 和前端类型

当前分支新增或调整了多组 API。

主要类型变化：

- 新增审核优化响应：`ReviewOptimizationResponse`
- 新增邀请码响应和创建请求：`RegistrationInviteResponse`、`RegistrationInviteCreateRequest`
- 新增管理员创建用户请求：`AdminUserCreateRequest`
- 新增管理员重置密码请求：`AdminUserPasswordUpdateRequest`
- 注册请求去掉邮箱字段
- 技能详情响应增加用于匹配审核/优化入口的字段

核心文件：

- `web/src/api/client.ts`
- `web/src/api/types.ts`
- `web/src/api/generated/schema.d.ts`
- `server/skillhub-app/src/main/java/com/iflytek/skillhub/dto/`

### 7. 部署和配置

当前分支增加了自动审核和私有化登录相关配置。

新增/调整配置包括：

- `SKILLHUB_AUTO_REVIEW_ENABLED`
- `SKILLHUB_AUTO_REVIEW_PASS_SCORE`
- `SKILLHUB_AUTO_REVIEW_REVIEWER_ID`
- `SKILLHUB_AUTH_DIRECT_ENABLED`
- `SKILLHUB_WEB_AUTH_DIRECT_ENABLED`
- `SKILLHUB_WEB_AUTH_DIRECT_PROVIDER`
- scanner 相关配置透传
- S3/BOS chunked encoding 配置示例

核心文件：

- `.env.release.example`
- `compose.release.yml`
- `server/skillhub-app/src/main/resources/application.yml`
- `docs/20-auto-review-deployment.md`

## 数据库变化

当前分支新增 Flyway 迁移：

- `V43__registration_invite.sql`
  - 新增注册邀请码表
  - 支持邀请码使用次数、过期时间、撤销状态、使用记录
- `V44__make_department_invite_permanent.sql`
  - 将部门邀请码调整为永久不过期
  - `expires_at = NULL` 表示永不过期

## 文档变化

新增文档：

- `docs/20-auto-review-deployment.md`
- `docs/21-skill-judge-auto-review-changes.md`
- `docs/22-private-skillcenter-branch-diff.md`

同时调整了 README、VitePress 文档、CLI 文档、OpenClaw 集成文档和部署文档中的品牌及私有化表达。

## 测试覆盖变化

新增或更新的测试覆盖：

- 自动审核配置绑定
- 自动审核流程
- Skill Judge 评分规则
- 一键优化服务
- 一键优化包改写逻辑
- 邀请码服务
- 邀请码管理接口
- 本地注册接口
- 管理员用户创建和重置密码
- 前端注册页
- 前端登录页
- 前端用户管理页
- 前端审核详情页
- 前端技能详情页
- 前端 UI 组件

核心测试文件：

- `server/skillhub-app/src/test/java/com/iflytek/skillhub/service/autoreview/AutoReviewAppServiceTest.java`
- `server/skillhub-app/src/test/java/com/iflytek/skillhub/service/autoreview/HeuristicSkillJudgeEvaluatorTest.java`
- `server/skillhub-app/src/test/java/com/iflytek/skillhub/service/autoreview/SkillJudgeOptimizationAppServiceTest.java`
- `server/skillhub-app/src/test/java/com/iflytek/skillhub/service/autoreview/SkillJudgePackageOptimizerTest.java`
- `server/skillhub-auth/src/test/java/com/iflytek/skillhub/auth/local/RegistrationInviteServiceTest.java`
- `web/src/pages/register.test.tsx`
- `web/src/pages/login.test.tsx`
- `web/src/pages/admin/users.test.tsx`
- `web/src/pages/dashboard/review-detail.test.tsx`
- `web/src/pages/skill-detail.test.tsx`

## 部署影响

从 `main` 切到当前分支后，需要重新构建后端和前端镜像。

```bash
cd ~/skillhub_my/skillhub

git fetch bohe1026
git checkout codex/private-local-auth-hardening
git pull --ff-only bohe1026 codex/private-local-auth-hardening

docker build -t skillhub-server:auto-review ./server
docker build -t skillhub-web:frontend-tech ./web

docker compose --env-file .env -f compose.release.yml -f compose.local.yml up -d --force-recreate server web
```

如果是首次从 `main` 升级到该分支，启动后 Flyway 会执行 `V43` 和 `V44` 数据库迁移。

## 风险和注意事项

- 该分支包含多条功能线，不是一个单一小改动分支。
- 自动审核依赖安全扫描完成事件，scanner 服务不可用时审核可能卡在扫描失败或待处理状态。
- 一键优化会生成新版本或修改包内容，建议保留原始包备份。
- 注册不再要求邮箱后，邮件找回密码不再适合私有化场景，推荐使用管理员重置密码和用户自改密码。
- 注册邀请码需要管理员维护，部门邀请码当前按永久有效处理。
- 当前分支对品牌、文档和前端样式做了较大范围调整，如后续要合并回上游 `main`，建议拆分 PR。

## 总结

`codex/private-local-auth-hardening` 分支相对 `main` 的核心变化可以概括为三块：

1. 将人工审核升级为 Skill Judge 自动审核，并支持中文报告和一键优化。
2. 将公开开源风格的 SkillHub 前端改造为私有化 SkillCenter 风格。
3. 将账号体系改造为本地账号、邀请码注册、管理员重置密码和用户自改密码，更适合内网或私有化部署。
