"use client";

import { useEffect, useRef, useState } from "react";

// Deliberately static examples: never fetch or publish real student projects here.
const examples = [
  {
    title: "Campus Connect", category: "Campus life", description: "One place to discover university events, book a seat, and bring student communities together.",
    skills: ["React", "C#", "SQL"], teamSize: 4, difficulty: "Intermediate",
    roles: ["Frontend Developer", "Backend Developer", "UI/UX Designer", "QA Engineer"],
  },
  {
    title: "Study Circle", category: "Student productivity", description: "A shared study planner that helps classmates organize assignments, study sessions, and weekly goals.",
    skills: ["TypeScript", "React", "UI Design"], teamSize: 3, difficulty: "Beginner",
    roles: ["Frontend Developer", "UI/UX Designer", "QA Engineer"],
  },
  {
    title: "Green Campus", category: "Sustainability", description: "Help students report recycling points and coordinate small sustainability projects around campus.",
    skills: ["ASP.NET Core", "SQL", "React"], teamSize: 4, difficulty: "Intermediate",
    roles: ["Frontend Developer", "Backend Developer", "UI/UX Designer", "QA Engineer"],
  },
];

export default function ProjectShowcase() {
  const [index, setIndex] = useState(0);
  const showcase = useRef<HTMLElement>(null);
  useEffect(() => {
    // Rotate automatically, but let people finish reading on hover/keyboard focus.
    // Hidden tabs and reduced-motion preferences must not trigger slide changes.
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          showcase.current?.matches(":hover, :focus-within")) return;
      setIndex(current => (current + 1) % examples.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);
  const project = examples[index];
  return <section ref={showcase} className="project-showcase" aria-label="Example projects, rotating automatically" tabIndex={0}>
    <div className="project-stack">
      <div className="stack-sheet stack-sheet-back" aria-hidden="true" />
      <div className="stack-sheet stack-sheet-middle" aria-hidden="true" />
      <article className="example-project" aria-live="off">
        <div className="example-heading">
          <span className="project-category">{project.category}</span>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
        </div>
        <div className="example-skills"><h3>Required skills</h3><ul>{project.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></div>
        <dl className="example-facts">
          <div><dt>Team size</dt><dd><span className="people-icon" aria-hidden="true">◉ ◉</span> {project.teamSize} students</dd></div>
          <div><dt>Difficulty</dt><dd>{project.difficulty}</dd></div>
        </dl>
        <div className="example-roles"><h3>Roles needed</h3><ul>{project.roles.map(role => <li key={role}><span aria-hidden="true">↗</span>{role}</li>)}</ul></div>
        <p className="example-disclaimer">An idea to show what a balanced team could look like.<br />Not a real project or an open invitation.</p>
      </article>
    </div>
  </section>;
}
