# TeamFit frontend

Next.js App Router, React, TypeScript, and Tailwind CSS.

See the [root README](../README.md) for setup, API authentication, database requirements, and tests.

From this folder:

```powershell
npm ci
npm run dev
```

The API must also be running on localhost:5273. Set NEXT_PUBLIC_API_URL in .env.local if needed, then restart/rebuild Next.js. Never place secrets in NEXT_PUBLIC_ variables.

Public routes: / (intro, sample projects, how it works), /login, /register.

Authenticated routes:

- /dashboard — summary counts and project shortcuts.
- /profile/create — new-account profile setup.
- /profile and /profile/edit — view and update your profile.
- /students — search/filter the student directory.
- /projects — browse all projects.
- /projects/mine and /projects/joined — owned projects vs teams joined by invitation.
- /projects/new — create a project.
- /projects/[id] — requirements, team, tasks, progress, recommendations/invitations.
- /projects/[id]/edit — owner-only project editing.
- /invitations — accept/reject incoming invitations.

/workspace redirects to /dashboard for old bookmarks. The (workspace) route group shares the authenticated layout but does not appear in URLs. Signed-out visitors are sent to login; accounts without a profile are sent to /profile/create. API authorization remains the actual security boundary.

Page wrappers are in src/app; shared page views are in src/components/workspace-pages.tsx. ProjectTasks handles task editing and status updates. Browser sessions continue to use HttpOnly cookies, not localStorage tokens.

```powershell
npm run lint
npm run build
```

Run browser tests through scripts/test.ps1 -Browser from the repository root so synthetic data goes into a disposable database.
