# SkillCenter CLI Compatibility Guide

SkillCenter recommends using the ClawHub-compatible CLI for registry workflows such as searching, installing, and publishing Agent skill packages. Use your own deployed instance URL in production.

## Install And Configure

```bash
# Run with npx
npx clawhub --help

# Configure the registry URL
export CLAWHUB_REGISTRY=https://skillcenter.example.com
export CLAWHUB_SITE=https://skillcenter.example.com
```

Windows PowerShell:

```powershell
$env:CLAWHUB_REGISTRY="https://skillcenter.example.com"
$env:CLAWHUB_SITE="https://skillcenter.example.com"
```

## Common Commands

```bash
# Search skills
npx clawhub search pdf

# Install a global namespace skill
npx clawhub install pdf-parser --registry https://skillcenter.example.com

# Install a team namespace skill with namespace--skill format
npx clawhub install team-alpha--pdf-parser --registry https://skillcenter.example.com

# Publish a skill package
npx clawhub publish ./my-skill --registry https://skillcenter.example.com
```

## Naming Rules

| SkillCenter coordinate | CLI slug |
|---|---|
| `@global/my-skill` | `my-skill` |
| `@team-alpha/my-skill` | `team-alpha--my-skill` |

A slug without `--` is resolved to the `global` namespace by default.

## Authentication

For private skills or publishing, create an API token in the web console first, then run:

```bash
npx clawhub login --token sk_xxx --registry https://skillcenter.example.com
```

## Local Development Check

```bash
export CLAWHUB_REGISTRY=http://localhost:8080
npx clawhub search test
npx clawhub install example-skill
```
