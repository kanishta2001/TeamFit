"use client";

import { useState } from "react";
import type { Options, Project, Skill, Student, User } from "@/lib/types";
import ProjectForm from "./project-form";
import ProjectDetail from "./project-detail";
import { buttonStyle, inputStyle, panelStyle, secondaryStyle, Tags } from "./form-controls";

export default function ProjectBoard({ user, profile, projects, skills, options, students, onChanged }: {
  user: User; profile: Student | null; projects: Project[]; skills: Skill[]; options: Options; students: Student[];
  onChanged: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState("");
  const [teamIds, setTeamIds] = useState<number[] | null>(null);
  const [filterError, setFilterError] = useState("");
  const project = projects.find(item => item.id === selected);
  const visible = projects.filter(item => (!mine || teamIds?.includes(item.id)) &&
    item.title.toLowerCase().includes(search.trim().toLowerCase()));

  async function filterMine(value: boolean) {
    setFilterError("");
    if (value) {
      try {
        const { api } = await import("@/lib/api");
        const result = await api<Project[]>("projects?mine=true");
        setTeamIds(result.map(item => item.id)); setMine(true);
      } catch { setFilterError("Could not load your teams. Please try again."); }
    } else setMine(false);
  }
  async function changed() {
    await onChanged();
    if (mine) await filterMine(true);
  }

  if (creating) return <ProjectForm skills={skills} options={options} onCancel={() => setCreating(false)}
    onSaved={async saved => { await changed(); setCreating(false); setSelected(saved.id); }} />;
  if (project) return <ProjectDetail key={project.id} project={project} user={user} skills={skills} options={options} students={students}
    onBack={() => setSelected(null)} onChanged={changed} onDeleted={async () => { await changed(); setSelected(null); }} />;
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-bold">Projects & teams</h2>
      <button className={buttonStyle} disabled={!profile} onClick={() => setCreating(true)}>Create project</button>
    </div>
    {!profile && <p className="text-sm text-amber-800">Create your student profile first to start a project or join a team.</p>}
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex-1">Search projects<input aria-label="Search projects" className={inputStyle} value={search} onChange={event => setSearch(event.target.value)} /></label>
      <button aria-pressed={mine} className={secondaryStyle} onClick={() => filterMine(!mine)}>{mine ? "Show all projects" : "My teams"}</button>
    </div>
    {filterError && <p role="alert" className="text-rose-700">{filterError}</p>}
    {!visible.length && <p className={panelStyle}>No projects found. Start your own project to invite teammates.</p>}
    <div className="grid gap-5 md:grid-cols-2">
      {visible.map(item => <article className={panelStyle + " space-y-4"} key={item.id}>
        <div className="flex flex-wrap justify-between gap-2"><h3 className="text-xl font-bold">{item.title}</h3><span className="text-sm font-semibold text-indigo-700">{item.status}</span></div>
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-slate-600">{item.description}</p>
        <Tags values={item.requiredSkills.map(skill => skill.name)} />
        <p className="text-sm text-slate-600">{item.memberCount}/{item.teamSize} members {item.ownerId === user.id && "· You own this project"}</p>
        <button className={secondaryStyle} onClick={() => setSelected(item.id)}>View project</button>
      </article>)}
    </div>
  </section>;
}
