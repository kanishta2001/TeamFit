"use client";

import { useEffect, useState } from "react";
import { api, message } from "@/lib/api";
import type { Member, Project, Recommendation, SentInvitation, Student, User } from "@/lib/types";
import ProjectTasks from "./project-tasks";
import { buttonStyle, Notice, panelStyle, secondaryStyle, Tags } from "./form-controls";
import PageBack from "./page-back";

type Detail = { members: Member[]; recommendations: Recommendation[]; invitations: SentInvitation[] };

export default function ProjectDetail({ project, user, students, onEdit, onChanged, onDeleted }: {
  project: Project; user: User; students: Student[];
  onEdit: () => void; onChanged: () => Promise<void>; onDeleted: () => Promise<void>;
}) {
  const owner = project.ownerId === user.id;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Member[]>(`projects/${project.id}/members`),
      owner ? api<Recommendation[]>(`projects/${project.id}/recommendations`) : Promise.resolve([]),
      owner ? api<SentInvitation[]>(`projects/${project.id}/invitations`) : Promise.resolve([]),
    ]).then(([members, recommendations, invitations]) => {
      if (active) { setDetail({ members, recommendations, invitations }); setError(""); }
    }).catch(reason => { if (active) setError(message(reason)); });
    return () => { active = false; };
  }, [project, owner, revision]);

  async function action(path: string, method: string, body?: unknown, success = "Updated successfully.") {
    setBusy(true); setError(""); setNotice("");
    try { await api(path, method, body); await onChanged(); setRevision(value => value + 1); setNotice(success); }
    catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }
  async function removeProject() {
    if (!window.confirm("Delete this project, its team, tasks, and all its invitations? This cannot be undone.")) return;
    setBusy(true); setError("");
    try { await api(`projects/${project.id}`, "DELETE"); await onDeleted(); }
    catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  const memberStudents = students.filter(student => detail?.members.some(member => member.studentId === student.id));
  const covered = new Set(memberStudents.flatMap(student => student.skills.map(skill => skill.id)));
  const full = project.memberCount >= project.teamSize;
  return <section className="space-y-5">
    <PageBack href="/projects" className={secondaryStyle} label="Go to previous page">← Back</PageBack>
    <Notice text={error} error /><Notice text={notice} />
    <article className={panelStyle + " space-y-4"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-bold">{project.title}</h2>
          <p className="mt-2 text-sm text-indigo-700">{project.status} · {project.memberCount}/{project.teamSize} team members</p></div>
        {owner && <div className="flex gap-3"><button className={secondaryStyle} disabled={busy} onClick={onEdit}>Edit project</button>
          <button className="text-sm font-semibold text-rose-700" disabled={busy} onClick={removeProject}>Delete project</button></div>}
      </div>
      <p className="whitespace-pre-wrap break-words text-slate-600">{project.description}</p>
      <h3 className="font-semibold">Required skills</h3><Tags values={project.requiredSkills.map(skill => skill.name)} />
      <h3 className="font-semibold">Desired roles</h3><Tags values={project.desiredRoles} />
      <p className="text-sm text-slate-600">Meeting availability: {project.availability.join(" · ")} (Sri Lanka time)</p>
    </article>
    {!detail ? <div className={panelStyle}><p role="status">{error ? "Could not load team details." : "Loading team details…"}</p>
      {error && <button className={secondaryStyle} onClick={() => setRevision(value => value + 1)}>Retry</button>}</div> : <>
      {(owner || project.isMember) && <ProjectTasks project={project} user={user} members={detail.members} onChanged={onChanged} />}
      <article className={panelStyle + " space-y-4"}>
        <h3 className="text-xl font-bold">Team members</h3>
        {detail.members.map(member => <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3" key={member.studentId}>
          <div><p className="font-semibold">{member.fullName}{member.userId === project.ownerId ? " · Owner" : ""}</p><p className="text-sm text-slate-600">{member.preferredRole}</p></div>
          {member.userId !== project.ownerId && (owner || member.userId === user.id) &&
            <button className={secondaryStyle} disabled={busy} onClick={() => {
              if (window.confirm(member.userId === user.id ? "Leave this team?" : "Remove this student from the team?"))
                void action(`projects/${project.id}/members/${member.studentId}`, "DELETE");
            }}>{member.userId === user.id ? "Leave team" : "Remove member"}</button>}
        </div>)}
        <h4 className="font-semibold">Team skill coverage</h4>
        <p className="text-sm text-slate-600">Coverage shows whether at least one member has each required skill; it does not measure proficiency.</p>
        {project.requiredSkills.map(skill => <div key={skill.id} className="flex items-center justify-between gap-2 text-sm">
          <span>{skill.name}</span><span className={covered.has(skill.id) ? "text-emerald-700" : "text-amber-700"}>{covered.has(skill.id) ? "Covered" : "Missing"}</span>
        </div>)}
      </article>
      {owner && <>
        <article className={panelStyle + " space-y-4"}>
          <h3 className="text-xl font-bold">Sent invitations</h3>
          {!detail.invitations.length && <p className="text-sm text-slate-600">No invitations sent yet.</p>}
          {detail.invitations.map(invitation => <div className="flex flex-wrap items-center justify-between gap-3" key={invitation.id}>
            <p>{invitation.fullName} <span className="text-sm text-slate-500">· {invitation.status}</span></p>
            {invitation.status === "Pending" && <button className={secondaryStyle} disabled={busy}
              onClick={() => action(`invitations/${invitation.id}`, "DELETE", undefined, "Invitation cancelled.")}>Cancel invitation</button>}
          </div>)}
        </article>
        <div className="space-y-3">
          <h3 className="text-xl font-bold">Recommended teammates</h3>
          <p className="text-sm text-slate-600">Skills: up to 60 points · desired role: 25 · shared availability: 15.
            Scores compare each candidate with your project requirements, not personality or skill proficiency. Existing members are excluded.</p>
          {(full || project.status !== "Open") && <p className="text-sm text-amber-800">Invitations are disabled because the team is full or the project is not open.</p>}
          {!detail.recommendations.length && <p className={panelStyle}>No other registered student profiles are available yet.</p>}
          {detail.recommendations.map(item => {
            const pending = detail.invitations.some(invitation => invitation.studentId === item.student.id && invitation.status === "Pending");
            return <article className={panelStyle + " space-y-3"} key={item.student.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h4 className="text-lg font-bold">{item.student.fullName}</h4><p className="text-sm text-slate-600">{item.student.preferredRole}</p></div>
                <p className="text-xl font-bold text-emerald-700">{item.score}/100</p>
              </div>
              <p className="text-sm">Skills: {item.matchedSkills.length}/{item.requiredSkillCount} matched (+{item.skillScore}) · Role: +{item.roleScore} · Availability: +{item.availabilityScore}</p>
              <Tags values={item.matchedSkills.map(skill => skill.name)} />
              <p className="text-sm text-slate-600">Missing: {item.missingSkills.map(skill => skill.name).join(", ") || "None"}</p>
              <p className="text-sm text-slate-600">Shared time: {item.sharedAvailability.join(" · ") || "None"}</p>
              <button className={buttonStyle} disabled={busy || pending || full || project.status !== "Open"}
                onClick={() => action(`projects/${project.id}/invitations`, "POST", { studentId: item.student.id }, "Invitation sent.")}>
                {pending ? "Invitation pending" : "Invite student"}
              </button>
            </article>;
          })}
        </div>
      </>}
    </>}
  </section>;
}
