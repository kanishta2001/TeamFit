# TeamFit frontend

Next.js App Router, React, TypeScript, and Tailwind CSS.

See the [root README](../README.md) for setup, API authentication, database requirements, and tests.

From this folder:

```powershell
npm ci
npm run dev
```

The API must also be running on localhost:5273. Set NEXT_PUBLIC_API_URL in .env.local if needed, then restart/rebuild Next.js. Never place secrets in NEXT_PUBLIC_ variables.

Public routes: / (compact hero and automatically rotating project-card showcase), /how-it-works, /login, /register.

The root page checks the HttpOnly session through the API. Guests see Login/Register and Create your profile, never a Browse projects button. Signed-in users with completed profiles see their first-name display username, Log out, My profile, and Browse projects. How It Works sits below the hero buttons instead of in the homepage header. Registration opens /profile/create, then saving opens /dashboard. Normal login opens /dashboard; a protected deep link still returns to the requested route once a profile exists. The shared workspace navigation bar is removed from every page. Use dashboard cards, page-specific links, and the header username to reach sections; the TeamFit logo always returns to /.

The fictional cards rotate every 10 seconds without arrows, dots, or a slide counter. Rotation pauses on hover/focus, in hidden tabs, and when reduced motion is requested. A small disclaimer remains so the examples are not mistaken for real projects. Home-only spacing uses viewport height as well as width; no content is hidden with overflow rules. Extremely small windows or enlarged text may still scroll so information remains accessible.

The display name is computed from the saved profile by src/lib/display-name.ts. It is not a unique account identifier; before profile setup it displays Student. Header email addresses have been removed; profile/account email fields are unchanged.

Profile creation/editing and project creation/editing share the searchable skill selector. It receives the categorized, predefined catalog from the API; users cannot add new skill names. Previously saved non-catalog skills remain on existing profiles and projects during editing unless their chips are explicitly removed. They cannot be added to another profile or project.

Supplied branding assets are in public/brand. landing.css controls the reference-based home layout; Brand and SiteHeader are shared with authenticated pages. The original transparent logo is displayed using a navy CSS mask without editing the source file. No real project data is used in the homepage showcase.

Authenticated routes:

- /dashboard — workspace main page with section counts and active projects.
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

For the non-mutating landing UI tests only, run npx playwright test tests/landing.spec.ts against a running frontend. Set TEAMFIT_UI_URL to override the default localhost:3000 URL. These tests stub the API and exercise guest/member views, onboarding display names, logout, navigation, mobile widths, and connection failure handling.
