# CI/CD Guide (Railway + Vercel)

This project uses GitHub Actions with staged deployment:

- `ci.yml`: runs on PRs and pushes to `main`
- `deploy-staging.yml`: auto deploy on `main`
- `deploy-production.yml`: manual, approval-gated deploy

## Workflows

### 1) CI
File: `.github/workflows/ci.yml`

Runs:
- install dependencies
- Prisma validation
- API + web builds
- web lint
- API unit tests
- secret-log guard (`security:check-logs`)
- dependency audit (high severity and above)
- gitleaks secret scan

### 2) Staging deploy
File: `.github/workflows/deploy-staging.yml`

Runs on every push to `main`:
- build API + web
- deploy API to Railway staging service
- deploy web preview to Vercel
- smoke checks:
  - `/health`
  - authenticated `/api/onboarding`
  - authenticated `/api/chat`

### 3) Production deploy
File: `.github/workflows/deploy-production.yml`

Manual trigger (`workflow_dispatch`) with optional `ref` input:
- build API + web from selected ref
- deploy API to Railway production
- deploy web to Vercel production
- run smoke checks
- attempt best-effort rollback if deployment fails

## Required GitHub environments

Create GitHub environments:
- `staging`
- `production` (set required reviewers for manual approval)

## Required GitHub secrets

### Shared deploy secrets
- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Staging
- `RAILWAY_SERVICE_STAGING`
- `STAGING_API_URL`
- `STAGING_TEST_BEARER`

### Production
- `RAILWAY_SERVICE_PRODUCTION`
- `PRODUCTION_API_URL`
- `PRODUCTION_TEST_BEARER`

## Branch protection recommendation

For `main`, require:
- `CI / build-test`
- `CI / gitleaks`
- no direct pushes
- linear history (optional)

