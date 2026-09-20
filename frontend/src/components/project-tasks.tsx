"use client";

import { useEffect, useState } from "react";
import { api, message } from "@/lib/api";
import type { Member, Project, ProjectTask, User } from "@/lib/types";
import { buttonStyle, Field, inputStyle, Notice, panelStyle, secondaryStyle } from "./form-controls";

type TaskInput = Pick<ProjectTask, "title" | "description" | "assignedStudentId" | "status">;
const statuses = [{ value: "Todo", label: "To do" }, { value: "InProgress", label: "In progress" }, { value: "Done", label: "Done" }];

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
  }, [project, revision]);

  async function mutate(path: string, method: string, body?: unknown) {
    setBusy(true); setError(""); setNotice("");
    try {
      await api(path, method, body);
      await onChanged();
      setRevision(value => value + 1);
      setNotice("Task saved.");
      return true;
    } catch (reason) { setError(message(reason)); return false; }
    finally { setBusy(false); }
  }
  const visible = tasks?.filter(task => !onlyMine || task.assignedStudentId === myStudentId);
  return <section className={panelStyle + " space-y-5"} aria-label="Project tasks">
    <div className="flex flex-wrap justify-between gap-3">
      <h3 className="text-xl font-bold">Tasks and progress</h3>
      <p className="font-semibold text-indigo-700">{project.completedTaskCount}/{project.taskCount} tasks done · {project.progressPercent}%</p>
    </div>
    <progress aria-label="Project task progress" className="h-3 w-full accent-indigo-600" value={project.progressPercent} max={100} />
    <p className="text-sm text-slate-600">Progress is completed tasks divided by all tasks. The owner sets the project status separately.</p>
    <Notice text={error} error /><Notice text={notice} />
    {error && <button className={secondaryStyle} onClick={() => setRevision(value => value + 1)}>Reload tasks</button>}
    {owner && <TaskEditor key={editing?.id ?? `new-${revision}`} task={editing} members={members} busy={busy}
      onCancel={() => setEditing(null)} onSave={async input => {
        const saved = await mutate(`projects/${project.id}/tasks${editing ? "/" + editing.id : ""}`, editing ? "PUT" : "POST", input);
        if (saved) setEditing(null);
      }} />}
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" checked={onlyMine} onChange={event => setOnlyMine(event.target.checked)} /> My assigned tasks only
    </label>
    {!tasks && !error && <p role="status">Loading tasks…</p>}
    {visible?.length === 0 && <p className="text-slate-600">{onlyMine ? "No tasks assigned to you yet." : "No tasks yet. The owner can create the first task."}</p>}
    <div className="space-y-4">
      {visible?.map(task => <article key={task.id} className="space-y-3 rounded-xl border border-slate-200 p-4" aria-label={task.title}>
        <h4 className="break-words font-bold">{task.title}</h4>
        {task.description && <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{task.description}</p>}
        <p className="text-sm text-slate-600">Assigned to: {task.assignedStudentName || "Unassigned"}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Task status"><select className={inputStyle} aria-label={`Status for ${task.title}`} value={task.status}
            disabled={busy || !(owner || task.assignedStudentId === myStudentId)}
            onChange={event => void mutate(`projects/${project.id}/tasks/${task.id}/status`, "PATCH", { status: event.target.value })}>
            {statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select></Field>
          {owner && <><button className={secondaryStyle} disabled={busy} onClick={() => setEditing(task)}>Edit task</button>
            <button className="px-3 py-3 font-semibold text-rose-700" disabled={busy} onClick={async () => {
              if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
              if (await mutate(`projects/${project.id}/tasks/${task.id}`, "DELETE") && editing?.id === task.id) setEditing(null);
            }}>Delete task</button></>}
        </div>
      </article>)}
    </div>
  </section>;
}

function TaskEditor({ task, members, busy, onSave, onCancel }: {
  task: ProjectTask | null; members: Member[]; busy: boolean;
  onSave: (input: TaskInput) => Promise<void>; onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigned, setAssigned] = useState(task?.assignedStudentId?.toString() ?? "");
  const [status, setStatus] = useState<ProjectTask["status"]>(task?.status ?? "Todo");
  return <form aria-label={task ? "Edit task" : "Create task"} className="space-y-4 rounded-xl bg-slate-50 p-4" onSubmit={async event => {
    event.preventDefault();
    // Empty selection means no assignee; never convert it to student ID zero.
    await onSave({ title: title.trim(), description: description.trim() || null, assignedStudentId: assigned ? Number(assigned) : null, status });
  }}>
    <h4 className="font-bold">{task ? "Edit task" : "Create and assign a task"}</h4>
    <Field label="Task title"><input required maxLength={120} className={inputStyle} value={title} onChange={event => setTitle(event.target.value)} /></Field>
    <Field label="Task description"><textarea maxLength={1000} className={inputStyle} value={description} onChange={event => setDescription(event.target.value)} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Assign to"><select className={inputStyle} value={assigned} onChange={event => setAssigned(event.target.value)}>
        <option value="">Unassigned</option>{members.map(member => <option key={member.studentId} value={member.studentId}>{member.fullName}</option>)}
      </select></Field>
      <Field label="Initial task status"><select className={inputStyle} value={status} onChange={event => setStatus(event.target.value as ProjectTask["status"])}>
        {statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select></Field>
    </div>
    <div className="flex gap-3"><button className={buttonStyle} disabled={busy || !title.trim()}>{task ? "Save task changes" : "Create task"}</button>
      {task && <button type="button" className={secondaryStyle} onClick={onCancel} disabled={busy}>Cancel task edit</button>}</div>
  </form>;
}
