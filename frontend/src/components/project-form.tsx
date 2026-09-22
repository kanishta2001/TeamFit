"use client";

import { useState, type FormEvent } from "react";
import { api, message } from "@/lib/api";
import type { Options, Project, Skill } from "@/lib/types";
import { buttonStyle, Choices, Field, inputStyle, Notice, panelStyle, secondaryStyle } from "./form-controls";
import SkillMultiSelect from "./skill-multi-select";

export default function ProjectForm({ project, skills, options, onSaved, onCancel }: {
  project?: Project; skills: Skill[]; options: Options; onSaved: (project: Project) => Promise<void>; onCancel: () => void;
}) {
  const allowed = new Set(skills.map(skill => skill.id));
  const legacySkills = project?.requiredSkills.filter(skill => !allowed.has(skill.id)) ?? [];
  const [selectedSkills, setSkills] = useState(project?.requiredSkills.map(skill => String(skill.id)) ?? []);
  const [roles, setRoles] = useState(project?.desiredRoles ?? []);
  const [slots, setSlots] = useState(project?.availability ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!selectedSkills.length || !roles.length || !slots.length) {
      setError("Select at least one required skill, desired role, and availability period."); return;
    }
    setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      const saved = await api<Project>(project ? `projects/${project.id}` : "projects", project ? "PUT" : "POST", {
        title: String(values.get("title")).trim(), description: String(values.get("description")).trim(),
        teamSize: Number(values.get("teamSize")), status: values.get("status") ?? "Open",
        requiredSkillIds: selectedSkills.map(Number), desiredRoles: roles, availability: slots,
      });
      await onSaved(saved);
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className={panelStyle + " space-y-5"}>
    <h2 className="text-2xl font-bold">{project ? "Edit project" : "Create a project"}</h2>
    <p className="text-sm text-slate-600">A project and its team are kept together. You join automatically as the owner.</p>
    <fieldset disabled={busy} className="space-y-5">
      <Field label="Project title"><input name="title" required maxLength={120} defaultValue={project?.title} className={inputStyle} /></Field>
      <Field label="Description"><textarea name="description" required maxLength={2000} rows={4} defaultValue={project?.description} className={inputStyle} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Team size (including you)"><input name="teamSize" type="number" min={Math.max(2, project?.memberCount ?? 2)} max={20} required defaultValue={project?.teamSize ?? 4} className={inputStyle} /></Field>
        {project && <Field label="Project status"><select name="status" defaultValue={project.status} className={inputStyle}>
          <option value="Open">Open — accepting teammates</option><option value="InProgress">In progress</option><option value="Completed">Completed</option>
        </select></Field>}
      </div>
      <SkillMultiSelect label="Required skills" skills={skills} selectedLegacy={legacySkills} selected={selectedSkills} onChange={setSkills} />
      {legacySkills.length > 0 && <p className="text-sm text-amber-800">Older required skills stay on this project unless you remove their chips. New selections must come from the catalogue.</p>}
      <Choices label="Desired roles" options={options.roles.map(role => ({ value: role, label: role }))} selected={roles} onChange={setRoles} />
      <Choices label="Meeting availability (Sri Lanka time)" options={options.availabilitySlots.map(slot => ({ value: slot, label: slot }))} selected={slots} onChange={setSlots} />
      <div className="flex gap-3"><button type="submit" className={buttonStyle}>{busy ? "Saving…" : "Save project"}</button>
        <button type="button" className={secondaryStyle} onClick={onCancel}>Cancel</button></div>
    </fieldset>
    <Notice text={error} error />
  </form>;
}
