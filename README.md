# SkillCenter

SkillCenter is a self-hosted skill registry for teams that need to publish, review, discover, and reuse Agent skills inside a controlled environment.

It provides a web console, review workflow, package storage, search, namespace governance, API tokens, and a ClawHub-compatible registry interface.

## Highlights

- **Private deployment**: run the registry in your own environment.
- **Skill publishing**: upload ZIP skill packages and manage version lifecycle.
- **Review governance**: review, approve, reject, and audit submitted versions.
- **Automatic review**: optional Skill Judge automation can score submissions and generate optimization guidance.
- **Search and discovery**: browse skills by keyword, namespace, recency, and download activity.
- **Namespace control**: organize skill ownership by global or team spaces.
- **Storage backends**: local filesystem for development, S3-compatible storage for production.
- **Web and CLI access**: use the web console or compatible CLI workflows.

## Quick Start

```bash
make dev-all
```

Then open:

- Web UI: `http://localhost:3000`
- Backend API: `http://localhost:8080`

Stop the local stack:

```bash
make dev-all-down
```

## Docker Compose Deployment

Copy and edit the release environment file:

```bash
cp .env.release.example .env.release
```

Start the release stack:

```bash
make validate-release-config
docker compose --env-file .env.release -f compose.release.yml up -d
```

For local image overrides, keep your custom `compose.local.yml` and run:

```bash
docker compose --env-file .env -f compose.release.yml -f compose.local.yml up -d
```

## Common Development Commands

```bash
make help
make test
make test-backend-app
make build-backend-app
make typecheck-web
make build-web
make generate-api
```

When testing the backend module directly, use the repository targets above or Maven with `-am`; the application module depends on sibling modules in the same repository.

## Project Layout

```text
server/      Backend services and domain modules
web/         React web console
scanner/     Skill package scanner service
docs/        Deployment and implementation notes
scripts/     Release, smoke test, and maintenance scripts
deploy/      Kubernetes and deployment assets
monitoring/  Prometheus and Grafana assets
```

## Configuration

Important runtime settings are provided through environment variables. Some compatibility variables still use the `SKILLHUB_` prefix so existing compose overrides, images, and server configuration continue to work during the SkillCenter rebrand.

Key areas:

- public base URL
- PostgreSQL and Redis
- object storage
- bootstrap admin account
- direct username/password login
- security scanner
- automatic review

See `.env.release.example`, `compose.release.yml`, and `docs/20-auto-review-deployment.md` for deployment details.

## Skill Judge Auto Review

SkillCenter can automatically process review tasks after a package passes security scanning.

Typical switches:

```bash
SKILLHUB_AUTO_REVIEW_ENABLED=true
SKILLHUB_AUTO_REVIEW_PASS_SCORE=96
SKILLHUB_AUTO_REVIEW_REVIEWER_ID=system-auto-review
```

The review report includes score, pass or reject reasons, itemized issues, concrete suggestions, and optimization guidance. Submitters can use the one-click optimization workflow where enabled by permission rules.

## Registry Access

SkillCenter exposes a ClawHub-compatible registry endpoint. Configure compatible clients with your public base URL:

```bash
export CLAWHUB_REGISTRY=https://skillcenter.example.com
npx clawhub search email
npx clawhub install my-skill
```

Team namespace skills use the compatibility slug format:

```bash
npx clawhub install team-name--my-skill
```

## Deployment Notes

Recommended production baseline:

- set the public base URL to the final HTTPS entrypoint
- keep PostgreSQL and Redis private
- use S3-compatible storage for persisted packages
- change the bootstrap admin password before exposing the service
- run `make validate-release-config` before starting the compose stack
- keep scanner and auto-review settings explicit in your environment file
