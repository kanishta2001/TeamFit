"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project, User } from "@/lib/types";
import { buttonStyle, inputStyle, panelStyle, secondaryStyle, Tags } from "./form-controls";

export default function ProjectBoard({ user, projects, filter }: {
  user: User; projects: Project[]; filter: "all" | "mine";
}) {
  const [search, setSearch] = useState("");
  const visible = projects.filter(project =>
    (filter === "all" || project.ownerId === user.id || project.isMember) &&
    project.title.toLowerCase().includes(search.trim().toLowerCase()));
  const title = filter === "mine" ? "My projects" : "Browse projects";
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="workspace-page-title">{title}</h1><p className="mt-2 text-slate-600">
        {filter === "mine" ? "Projects you created or joined. Use the labels to tell them apart." :
          "Discover projects, see their requirements, or build your own team."}</p></div>
    </div>
    <nav aria-label="Project views" className="flex flex-wrap gap-2">
      {[["all", "/projects", "Browse projects"], ["mine", "/projects/mine", "My projects"]].map(([value, href, label]) =>
        <Link key={href} href={href} replace aria-current={filter === value ? "page" : undefined} className={filter === value ? buttonStyle : secondaryStyle}>{label}</Link>)}
    </nav>
    <div className="flex flex-wrap items-end gap-4">
      <label className="block min-w-60 flex-1 text-sm font-semibold">Search projects<input className={inputStyle} value={search} onChange={event => setSearch(event.target.value)} /></label>
      {filter === "mine" && <Link className={buttonStyle + " inline-flex min-h-12 items-center"} href="/projects/new">Create project</Link>}
    </div>
    {!visible.length && <p className={panelStyle}>{filter === "mine" && !search.trim() ? "No projects yet. Create a project or accept an invitation to join one." : "No projects found."}</p>}
    <div className="grid gap-5 md:grid-cols-2">
      {visible.map(project => <article className={panelStyle + " space-y-4"} key={project.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{project.title}</h2>
            {(project.ownerId === user.id || project.isMember) && <span className={"rounded-full px-2.5 py-1 text-xs font-bold " +
              (project.ownerId === user.id ? "bg-[#e5edf8] text-[#1d3559]" : "bg-[#e8f4ee] text-[#1c6444]")}>
              {project.ownerId === user.id ? "Owner" : "Joined"}
            </span>}
          </div>
          <span className="text-sm font-semibold text-indigo-700">{project.status}</span>
        </div>
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-slate-600">{project.description}</p>
        <Tags values={project.requiredSkills.map(skill => skill.name)} />
        <p className="text-sm text-slate-600">{project.memberCount}/{project.teamSize} members</p>
        <p className="text-sm text-slate-600">{project.taskCount ? `${project.progressPercent}% complete · ${project.completedTaskCount}/${project.taskCount} tasks` : "No tasks yet"}</p>
        <Link className={secondaryStyle + " inline-block"} href={`/projects/${project.id}`}>View project</Link>
      </article>)}
    </div>
  </section>;
}
