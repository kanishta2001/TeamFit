# TeamFit frontend

Next.js App Router, React, TypeScript, and Tailwind CSS.

See the [root README](../README.md) for setup, API authentication, database requirements, and tests.

From this folder:

```powershell
npm ci
npm run dev
```

The API must also be running on localhost:5273. Set NEXT_PUBLIC_API_URL in .env.local if needed, then restart/rebuild Next.js. Never place secrets in NEXT_PUBLIC_ variables.

Routes: / (landing page), /workspace (authenticated application).

```powershell
npm run lint
npm run build
```

Run browser tests through scripts/test.ps1 -Browser from the repository root so synthetic data goes into a disposable database.
