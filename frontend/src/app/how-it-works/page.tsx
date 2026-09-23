import type { Metadata } from "next";
import PublicExperience from "@/components/public-experience";

export const metadata: Metadata = { title: "How it works | TeamFit" };
const steps = [
  { title: "Create your profile", text: "Register, tell us your name, and share a little about yourself. Your profile helps other students get to know you." },
  { title: "Add your skills", text: "Choose your technical skills, preferred project role, and the meeting times that work for you. Keep them up to date as you learn." },
  { title: "Browse projects", text: "Sign in to explore project requirements and teams. Create your own project with the skills, roles, availability, and team size you need." },
  { title: "Receive recommendations", text: "As a project owner, see ranked teammate suggestions: required skills contribute up to 60 points, a suitable role adds 25, and shared availability adds 15. No AI or machine learning is involved." },
  { title: "Form a balanced team", text: "Invite suitable students. They can accept or reject from Invitations. Once the team is ready, assign tasks, update progress, and build together." },
];

export default function HowItWorks() {
  return <PublicExperience>
    <main className="how-page">
      <p className="page-eyebrow">From your first skill to your next team</p>
      <h1>How TeamFit works.</h1>
      <p className="how-intro">Good projects start with people who complement each other. Here is how to find yours.</p>
      <ol className="how-steps">{steps.map((step, index) => <li key={step.title}>
        <span className="how-step-number" aria-hidden="true">0{index + 1}</span>
        <div><h2>{step.title}</h2><p>{step.text}</p></div>
      </li>)}</ol>
      <p className="how-note">Recommendations explain skill, role, and availability overlap. They do not guarantee performance or measure personality. Meeting periods use Sri Lanka local time.</p>
    </main>
  </PublicExperience>;
}
