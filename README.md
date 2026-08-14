# TeamFit

TeamFit is a smart student project-team formation platform. It helps university students find suitable teammates based on skills, preferred project roles, and availability.

This repository is being built step by step as an individual full-stack learning project using Next.js, ASP.NET Core Web API, SQL Server, and Entity Framework Core.

## Current stage

The MVP scope and architecture are documented, and the frontend now includes a static TeamFit landing page. The next development milestone is to create the ASP.NET Core Web API and test it with Swagger.

## MVP goal

Students will be able to create profiles, list their skills and availability, create project requests, and receive ranked student recommendations using a simple rule-based matching score.

Authentication, invitations, and advanced automatic team generation will be added in later versions.

## Planned technology stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: C#, ASP.NET Core Web API (.NET 8)
- Database: SQL Server with Entity Framework Core
- API testing: Swagger / OpenAPI
- Version control: Git and GitHub

## Documentation

The MVP scope, architecture, matching approach, and initial delivery plan are documented in [docs/mvp-and-architecture.md](docs/mvp-and-architecture.md).

## Planned repository structure

```text
TeamFit/
├── docs/
├── frontend/
├── TeamFit.API/
└── README.md
```

> This project is under active development. Each major working change will be committed separately with a meaningful Git message.

## Run the frontend locally

From the repository root, run:

```powershell
cd frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in a browser. Stop the local development server with `Ctrl + C` when you are finished.
