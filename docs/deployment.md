# Public deployment checklist

The application is implemented and runs locally. No hosting account, domain, database subscription, or public URL has been provisioned by this change. Deployment needs the owner's provider/budget/domain decision.

## Recommended topology for this cookie-based application

Use one HTTPS origin with a reverse proxy:

```text
https://teamfit.your-domain
  /api/*  -> ASP.NET Core service (private port)
  /*      -> Next.js production service (private port)
SQL Server -> reachable only from the API
```

Keeping the frontend and API on one origin avoids cross-site cookie problems. Two unrelated provider domains will not work with SameSite=Strict cookies. Do not simply disable cookie security to work around that.

Use supported production hosting for Node.js and .NET, with persistent SQL Server, backups, and an HTTPS certificate. Do not expose the local developer SQL Server or development servers directly to the internet.

## Required configuration

Backend environment variables:

| Variable | Value |
| --- | --- |
| ASPNETCORE_ENVIRONMENT | Production |
| ConnectionStrings__DefaultConnection | Production SQL Server connection string from a secret store |
| Jwt__Key | Random private signing key, at least 32 bytes; not committed |
| Jwt__Issuer | TeamFit (or your consistent configured issuer) |
| Jwt__Audience | TeamFit (or your consistent configured audience) |
| Frontend__Origin | Exact HTTPS frontend origin, no trailing slash |

Frontend **build-time** variable:

```text
NEXT_PUBLIC_API_URL=https://teamfit.your-domain
```

This is a public URL, not a secret. Rebuild Next.js after changing it.

Production cookies are Secure + HttpOnly + SameSite=Strict. The proxy must preserve request paths and forward Origin headers. Restrict public access to the proxy; never expose database credentials to Next.js/browser bundles. Configure rate limits at the public proxy too: the app's per-IP limiter cannot distinguish clients if a proxy presents the same source IP for everyone.

## Build and release

1. Run the automated checks on the release commit.
2. Back up the database and verify that a restore works.
3. Generate and review a migration script from the backend folder:
   `dotnet tool run dotnet-ef migrations script --idempotent --output ../artifacts/migrations.sql`.
   Create the artifacts directory first. Generate with a valid local configuration; apply to production using a controlled administrative connection.
4. Apply reviewed migrations once; do not let every web instance race to migrate.
5. Publish the backend with `dotnet publish backend/backend.csproj -c Release -o artifacts/backend`.
6. Set the frontend public URL, then run `npm ci` and `npm run build` in frontend.
7. Configure services to restart automatically and run with limited OS/database privileges.
8. Enable HTTPS, restrict internal ports, configure backups and log retention.
9. Smoke-test registration, login after refresh, profile saving, invitations, team capacity, logout, and mobile layout on the real HTTPS domain.
10. Keep signing keys out of logs. Rotating a key signs out existing users. Document rollback for both code and schema.

Swagger is disabled in Production. No health endpoint is required for the local workflow; a host-specific health strategy can be added during deployment if the chosen platform needs one.

## Before an official multi-university launch

The current release is an internship-project application, not a certified institutional identity service. Plan email verification, account recovery, privacy/data-retention policy, moderation/support, monitoring, capacity/load testing, and security review before an unrestricted public launch. An administrator console, real-time/email notifications, and SSO are not currently implemented. In-app invitations and owner/member authorization are implemented.

## Information the owner must supply

- Hosting provider/account and acceptable monthly budget.
- Domain name, if available.
- SQL Server hosting choice and secret-store configuration.
- Whether registration should require verified university email.

Do not publish until these choices and production checks are complete.
