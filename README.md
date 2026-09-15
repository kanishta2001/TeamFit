# TeamFit

TeamFit is a smart student project-team formation platform. It helps university students find suitable teammates based on skills, preferred project roles, and availability.

This repository is being built step by step as an individual full-stack learning project using Next.js, ASP.NET Core Web API, SQL Server, and Entity Framework Core.

## Current stage

The MVP scope and architecture are documented. The Next.js frontend can create and display live student profiles through the ASP.NET Core API, and the .NET 8 backend is connected to SQL Server through Entity Framework Core. Student profile CRUD endpoints are available through Swagger and the profile creation form. The next development milestone is to add skills to student profiles.

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
├── backend/
└── README.md
```

> This project is under active development. Each major working change will be committed separately with a meaningful Git message.

## Run the frontend locally

From the repository root, run:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in a browser. Stop the local development server with `Ctrl + C` when you are finished.

`TEAMFIT_API_URL` in `.env.local` tells the Next.js server where the local ASP.NET Core API is running. `NEXT_PUBLIC_API_URL` is the same public API address used by browser-side features, such as the profile creation form. `.env.local` is ignored by Git; `.env.example` is the safe template committed to the repository.

## Run the backend locally

From the repository root, run:

```powershell
cd backend
dotnet run
```

Then open [Swagger UI](http://localhost:5273/swagger) to test the student profile API.

## Student profile API

The current backend supports these student profile endpoints:

```text
GET    /api/students       List student profiles
GET    /api/students/{id}  View one student profile
POST   /api/students       Create a student profile
PUT    /api/students/{id}  Update a student profile
DELETE /api/students/{id}  Delete a student profile
```

## Database development

The backend uses the local default SQL Server instance with Windows Authentication. EF Core manages the `TeamFitDb` database schema through migrations.

From the `backend` folder, restore the repository-local EF tool and apply pending migrations with:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef database update
```
