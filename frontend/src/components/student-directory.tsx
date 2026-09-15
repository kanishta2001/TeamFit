"use client";

import { useState } from "react";
import type { Options, Skill, Student } from "@/lib/types";
import { Field, inputStyle, panelStyle, Tags } from "./form-controls";

export default function StudentDirectory({ students, skills, options }: { students: Student[]; skills: Skill[]; options: Options }) {
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [slot, setSlot] = useState("");
  const visible = students.filter(student =>
    student.fullName.toLowerCase().includes(search.trim().toLowerCase()) &&
    (!skill || student.skills.some(item => item.id === Number(skill))) &&
    (!role || student.preferredRole === role) && (!slot || student.availability.includes(slot)));
  return <section className="space-y-5">
    <h2 className="text-2xl font-bold">Student directory</h2>
    <div className={panelStyle}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search by name"><input value={search} onChange={event => setSearch(event.target.value)} className={inputStyle} /></Field>
        <Field label="Skill"><select value={skill} onChange={event => setSkill(event.target.value)} className={inputStyle}>
          <option value="">All skills</option>{skills.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></Field>
        <Field label="Role"><select value={role} onChange={event => setRole(event.target.value)} className={inputStyle}>
          <option value="">All roles</option>{options.roles.map(item => <option key={item}>{item}</option>)}
        </select></Field>
        <Field label="Availability"><select value={slot} onChange={event => setSlot(event.target.value)} className={inputStyle}>
          <option value="">Any time</option>{options.availabilitySlots.map(item => <option key={item}>{item}</option>)}
        </select></Field>
      </div>
    </div>
    <p role="status" className="text-sm text-slate-600">{visible.length} student{visible.length !== 1 ? "s" : ""} found. Open your project to see ranked recommendations and send invitations.</p>
    <div className="grid gap-5 md:grid-cols-2">
      {visible.map(student => <article key={student.id} className={panelStyle + " space-y-3"}>
        <h3 className="text-xl font-bold">{student.fullName}</h3>
        <p className="text-sm font-semibold text-indigo-700">{student.preferredRole}</p>
        <p className="whitespace-pre-wrap break-words text-slate-600">{student.bio || "No bio added."}</p>
        <Tags values={student.skills.map(item => item.name)} />
        <p className="text-sm text-slate-600">{student.availability.join(" · ") || "Availability not set"}</p>
        {student.userId === null && <p className="text-xs text-amber-700">Legacy learning profile — cannot receive invitations.</p>}
      </article>)}
    </div>
  </section>;
}
