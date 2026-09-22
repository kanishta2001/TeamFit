"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project, User } from "@/lib/types";
import { buttonStyle, inputStyle, panelStyle, secondaryStyle, Tags } from "./form-controls";
import PageBack from "./page-back";

export default function ProjectBoard({ user, projects, filter }: {
  user: User; projects: Project[]; filter: "all" | "owned" | "joined";
}) {
  const [search, setSearch] = useState("");
  const visible = projects.filter(project =>
    (filter === "all" || (filter === "owned" ? project.ownerId === user.id : project.isMember && project.ownerId !== user.id)) &&
    project.title.toLowerCase().includes(search.trim().toLowerCase()));
  const title = filter === "owned" ? "My projects" : filter === "joined" ? "Joined projects" : "Browse projects";
  return <section className="space-y-5">
    <PageBack />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="workspace-page-title">{title}</h1><p className="mt-2 text-slate-600">
        {filter === "owned" ? "Manage projects you created: invite members and assign tasks." :
          filter === "joined" ? "Projects you joined by invitation. Check your assigned tasks or leave a team." :
          "Discover projects, see their requirements, or build your own team."}</p></div>
    </div>
    <nav aria-label="Project views" className="flex flex-wrap gap-2">
      {[["all", "/projects", "Browse projects"], ["owned", "/projects/mine", "My projects"], ["joined", "/projects/joined", "Joined projects"]].map(([value, href, label]) =>
        <Link key={href} href={href} aria-current={filter === value ? "page" : undefined} className={filter === value ? buttonStyle : secondaryStyle}>{label}</Link>)}
    </nav>
    <div className="flex flex-wrap items-end gap-4">
      <label className="block min-w-60 flex-1 text-sm font-semibold">Search projects<input className={inputStyle} value={search} onChange={event => setSearch(event.target.value)} /></label>
      {filter === "owned" && <Link className={buttonStyle + " inline-flex min-h-12 items-center"} href="/projects/new">Create project</Link>}
    </div>
    {!visible.length && <p className={panelStyle}>{filter === "joined" ? "No joined projects yet. Accept an invitation to join a team." : "No projects found."}</p>}
    <div className="grid gap-5 md:grid-cols-2">
      {visible.map(project => <article className={panelStyle + " space-y-4"} key={project.id}>
        <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-bold">{project.title}</h2><span className="text-sm font-semibold text-indigo-700">{project.status}</span></div>
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-slate-600">{project.description}</p>
        <Tags values={project.requiredSkills.map(skill => skill.name)} />
        <p className="text-sm text-slate-600">{project.memberCount}/{project.teamSize} members {project.ownerId === user.id ? "· Owner" : project.isMember ? "· Joined" : ""}</p>
        <p className="text-sm text-slate-600">{project.taskCount ? `${project.progressPercent}% complete · ${project.completedTaskCount}/${project.taskCount} tasks` : "No tasks yet"}</p>
        <Link className={secondaryStyle + " inline-block"} href={`/projects/${project.id}`}>View project</Link>
      </article>)}
    </div>
  </section>;
}
