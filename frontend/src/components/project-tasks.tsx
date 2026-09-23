"use client";

import { useEffect, useState } from "react";
import { api, message } from "@/lib/api";
import type { Member, Project, ProjectTask, User } from "@/lib/types";
import { buttonStyle, Field, inputStyle, Notice, panelStyle, secondaryStyle } from "./form-controls";

type TaskInput = Pick<ProjectTask, "title" | "description" | "deadlineDays"> & { assignedStudentIds: number[] };

export default function ProjectTasks({ project, user, members, onChanged }: {
  project: Project; user: User; members: Member[]; onChanged: () => Promise<void>;
}) {
  const owner = project.ownerId === user.id;
  const myStudentId = members.find(member => member.userId === user.id)?.studentId;
  const [tasks, setTasks] = useState<ProjectTask[] | null>(null);
  const [editing, setEditing] = useState<ProjectTask | null>(null);
  const [onlyMine, setOnlyMine] = useState(!owner);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    api<ProjectTask[]>(`projects/${project.id}/tasks`).then(items => {
      if (active) { setTasks(items); setError(""); }
    }).catch(reason => { if (active) setError(message(reason)); });
    return () => { active = false; };
  }, [project.id, revision]);

  async function mutate(path: string, method: string, body?: unknown, success = "Task saved.") {
    setBusy(true); setError(""); setNotice("");
    try {
      await api(path, method, body);
      await onChanged();
      setRevision(value => value + 1);
      setNotice(success);
      return true;
    } catch (reason) { setError(message(reason)); return false; }
    finally { setBusy(false); }
  }

  const visible = tasks?.filter(task => !onlyMine || task.assignments.some(
    assignment => assignment.studentId === myStudentId && assignment.status === "Accepted"));
  return <section className={panelStyle + " space-y-5"} aria-label="Project tasks">
    <div className="flex flex-wrap justify-between gap-3">
      <h3 className="text-xl font-bold">Tasks and progress</h3>
      <p className="font-semibold text-indigo-700">{project.completedTaskCount}/{project.taskCount} tasks completed · {project.progressPercent}%</p>
    </div>
    <progress aria-label="Project task progress" className="h-3 w-full accent-indigo-600" value={project.progressPercent} max={100} />
    <p className="text-sm text-slate-600">A task is completed when its accepted assignees mark their work as completed.</p>
    <Notice text={error} error /><Notice text={notice} />
    {error && <button className={secondaryStyle} onClick={() => setRevision(value => value + 1)}>Reload tasks</button>}
    {owner && <TaskEditor key={editing?.id ?? `new-${revision}`} task={editing} members={members} busy={busy}
      onCancel={() => setEditing(null)} onSave={async input => {
        const saved = await mutate(`projects/${project.id}/tasks${editing ? "/" + editing.id : ""}`, editing ? "PUT" : "POST", input,
          editing ? "Task changes saved." : "Task created. Invitations were sent to the assigned members.");
        if (saved) setEditing(null);
      }} />}
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" checked={onlyMine} onChange={event => setOnlyMine(event.target.checked)} /> My accepted tasks only
    </label>
    {!tasks && !error && <p role="status">Loading tasks…</p>}
    {visible?.length === 0 && <p className="text-slate-600">{onlyMine ? "No accepted tasks assigned to you yet." : "No tasks yet. The owner can create the first task."}</p>}
    <div className="space-y-4">
      {visible?.map(task => {
        const mine = task.assignments.find(assignment => assignment.studentId === myStudentId);
        return <article key={task.id} className="space-y-3 rounded-xl border border-slate-200 p-4" aria-label={task.title}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="break-words font-bold">{task.title}</h4>
            <span className={"rounded-full px-3 py-1 text-xs font-bold " + (task.isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
              {task.isCompleted ? "Task completed" : "Not completed"}
            </span>
          </div>
          {task.description && <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{task.description}</p>}
          <p className="text-sm font-semibold text-slate-700">Deadline: {new Date(task.dueAt).toLocaleDateString()} ({task.deadlineDays} {task.deadlineDays === 1 ? "day" : "days"})</p>
          <div className="flex flex-wrap gap-2" aria-label={`Assignments for ${task.title}`}>
            {task.assignments.map(assignment => <span key={assignment.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {assignment.fullName} · {assignment.status === "Accepted" ? (assignment.isCompleted ? "Completed" : "Not completed") : assignment.status}
            </span>)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {mine?.status === "Accepted" && <button className={mine.isCompleted ? secondaryStyle : buttonStyle} disabled={busy}
              onClick={() => void mutate(`projects/${project.id}/tasks/${task.id}/completion`, "PATCH", { completed: !mine.isCompleted },
                mine.isCompleted ? "Task marked as not completed." : "Task marked as completed.")}>
              {mine.isCompleted ? "Mark as not completed" : "Mark as completed"}
            </button>}
            {owner && <><button className={secondaryStyle} disabled={busy} onClick={() => setEditing(task)}>Edit task</button>
              <button className="px-3 py-3 font-semibold text-rose-700" disabled={busy} onClick={async () => {
                if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
                if (await mutate(`projects/${project.id}/tasks/${task.id}`, "DELETE") && editing?.id === task.id) setEditing(null);
              }}>Delete task</button></>}
          </div>
        </article>;
      })}
    </div>
  </section>;
}

function TaskEditor({ task, members, busy, onSave, onCancel }: {
  task: ProjectTask | null; members: Member[]; busy: boolean;
  onSave: (input: TaskInput) => Promise<void>; onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigned, setAssigned] = useState<number[]>(task?.assignments.map(item => item.studentId) ?? []);
  const [deadlineDays, setDeadlineDays] = useState(task?.deadlineDays ?? 2);
  function toggle(studentId: number) {
    setAssigned(current => current.includes(studentId) ? current.filter(id => id !== studentId) : [...current, studentId]);
  }
  return <form aria-label={task ? "Edit task" : "Create task"} className="space-y-4 rounded-xl bg-slate-50 p-4" onSubmit={async event => {
    event.preventDefault();
    await onSave({ title: title.trim(), description: description.trim() || null, assignedStudentIds: assigned, deadlineDays });
  }}>
    <h4 className="font-bold">{task ? "Edit task" : "Create and assign a task"}</h4>
    <Field label="Task title"><input required maxLength={120} className={inputStyle} value={title} onChange={event => setTitle(event.target.value)} /></Field>
    <Field label="Task description"><textarea maxLength={1000} className={inputStyle} value={description} onChange={event => setDescription(event.target.value)} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <fieldset className="space-y-2"><legend className="text-sm font-semibold">Assign members</legend>
        <div className="space-y-2 rounded-xl border border-slate-300 bg-white p-3">
          {members.map(member => <label className="flex items-center gap-2 text-sm" key={member.studentId}>
            <input type="checkbox" checked={assigned.includes(member.studentId)} onChange={() => toggle(member.studentId)} /> {member.fullName}
          </label>)}
        </div>
      </fieldset>
      <Field label="Deadline (days)"><input required type="number" min={1} max={365} className={inputStyle} value={deadlineDays}
        onChange={event => setDeadlineDays(Number(event.target.value))} /></Field>
    </div>
    <div className="flex gap-3"><button className={buttonStyle} disabled={busy || !title.trim() || assigned.length === 0}>{task ? "Save task changes" : "Create task"}</button>
      {task && <button type="button" className={secondaryStyle} onClick={onCancel} disabled={busy}>Cancel task edit</button>}</div>
  </form>;
}
