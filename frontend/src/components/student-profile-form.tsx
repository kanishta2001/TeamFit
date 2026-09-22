"use client";

import { useState, type FormEvent } from "react";
import { api, message } from "@/lib/api";
import type { Options, Skill, Student, User } from "@/lib/types";
import { buttonStyle, Choices, Field, inputStyle, Notice, panelStyle } from "./form-controls";
import SkillMultiSelect from "./skill-multi-select";

export default function StudentProfileForm({ user, student, skills, options, onSaved }: {
  user: User; student: Student | null; skills: Skill[]; options: Options; onSaved: () => Promise<void>;
}) {
  const allowed = new Set(skills.map(skill => skill.id));
  const legacySkills = student?.skills.filter(skill => !allowed.has(skill.id)) ?? [];
  const [selectedSkills, setSkills] = useState(student?.skills.map(skill => String(skill.id)) ?? []);
  const [availability, setAvailability] = useState(student?.availability ?? []);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      await api(student ? `students/${student.id}` : "students", student ? "PUT" : "POST", {
        fullName: String(form.get("fullName")).trim(), universityEmail: user.email,
        bio: String(form.get("bio")).trim(), preferredRole: form.get("preferredRole"),
        skillIds: selectedSkills.map(Number), availability,
      });
      await onSaved(); setNotice("Your profile has been saved.");
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!student || !window.confirm("Delete your student profile? Leave joined teams and delete owned projects first. Your login account will remain.")) return;
    setBusy(true); setError("");
    try { await api(`students/${student.id}`, "DELETE"); await onSaved(); }
    catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  return <section className={panelStyle + " profile-form-card"}>
    <h2 className="text-2xl font-bold">{student ? "Edit my profile" : "Create new profile"}</h2>
    <p className="mt-2 text-sm text-slate-600">Skills and availability help project owners understand where you fit. You can edit only your own profile.</p>
    <form onSubmit={save} className="mt-6 space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name"><input name="fullName" required maxLength={100} defaultValue={student?.fullName} className={inputStyle} /></Field>
          <Field label="Account email"><input value={user.email} readOnly className={inputStyle} /></Field>
        </div>
        <Field label="About you"><textarea name="bio" maxLength={500} rows={3} defaultValue={student?.bio ?? ""} className={inputStyle} /></Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Preferred project role">
            <select name="preferredRole" required defaultValue={student?.preferredRole ?? ""} className={inputStyle}>
              <option value="" disabled>Choose a role</option>
              {options.roles.map(role => <option key={role}>{role}</option>)}
            </select>
          </Field>
          <SkillMultiSelect label="Your skills" skills={skills} selectedLegacy={legacySkills} selected={selectedSkills} onChange={setSkills} />
        </div>
        {legacySkills.length > 0 && <p className="text-sm text-amber-800">Skills saved earlier outside the catalogue stay on your profile unless you remove their chips. New selections must come from the catalogue.</p>}
        <Choices label="Availability" options={options.availabilitySlots.map(slot => ({ value: slot, label: slot }))}
          selected={availability} onChange={setAvailability} />
        <p className="text-sm text-slate-500">Availability uses Sri Lanka local time. Choose general meeting periods that work for you.</p>
        <button className={buttonStyle} type="submit">{busy ? "Saving…" : "Save profile"}</button>
        {student && <button className="ml-4 text-sm font-semibold text-rose-700" type="button" onClick={remove}>Delete profile</button>}
      </fieldset>
      <Notice text={error} error /><Notice text={notice} />
    </form>
  </section>;
}
