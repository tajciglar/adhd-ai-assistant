# Staging / Tester Playbook

This project should use a separate staging stack for testers. Do not point preview builds at production Supabase or the production API.

## Recommended setup

1. Create a separate staging Supabase project.
2. Create a separate staging API deployment.
3. Point Vercel preview or staging web builds to the staging API and staging Supabase keys.
4. Keep production and staging databases fully separate.

## Frontend env for staging

Set these on the staging or preview web project:

```env
VITE_SUPABASE_URL=https://YOUR-STAGING-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY
VITE_API_URL=https://YOUR-STAGING-API.example.com
```

## API env for staging

Set these on the staging API deployment:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://YOUR-STAGING-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_STAGING_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
CORS_ORIGIN=https://YOUR-STAGING-WEB.example.com
```

## How testers should log in

Recommended: create tester accounts manually in staging and share email/password.

Why:

- It avoids open signups in test environments.
- It prevents real users from entering the staging system.
- It keeps test data separate from production.

## Tester account workflow

1. Open the staging Supabase dashboard.
2. Create the tester account under Auth.
3. Give the tester their email and temporary password.
4. Ask them to change the password after first login if needed.
5. If the tester needs admin access, update the `User.role` record in staging to `admin`.

## Vercel workflow

Recommended release flow:

1. Open a branch for the change.
2. Push the branch to GitHub.
3. Let Vercel create a preview deployment for that branch.
4. Verify the preview build is using staging env vars.
5. Share the preview URL with testers.
6. Merge only after tester approval.

## Safety checks before sharing a test build

- Confirm the build points to staging Supabase.
- Confirm the build points to the staging API.
- Confirm open signup is disabled, or only invited testers are using it.
- Confirm the staging API CORS list includes the preview domain.
- Confirm there are no production secrets in the staging deployment.

## Suggested branch policy

- `main`: production-ready code
- `develop` or `staging`: integration branch for QA
- feature branches: Vercel preview per branch

## Recommended next improvements

- Re-enable CI on pull requests.
- Add a dedicated staging deployment workflow in GitHub Actions.
- Add a script or admin utility for creating tester accounts.
- Add a short checklist to the PR template for staging verification.
