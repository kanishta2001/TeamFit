"use client";

import Link from "next/link";
import PublicExperience, { usePublicSession } from "./public-experience";
import ProjectShowcase from "./project-showcase";

function Hero() {
  const session = usePublicSession();
  return <main className="landing-hero">
    <section className="hero-copy" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero-title">
        <span className="hero-build">Build</span>
        <span className="hero-line">student teams</span>
        <span className="hero-line">that fit the project.</span>
      </h1>
      <p className="hero-description">TeamFit helps university students discover teammates with complementary skills, suitable roles, and shared availability.</p>
      <div className="hero-actions">
        {session.status === "loading" ? <span className="hero-session-placeholder" aria-hidden="true" /> :
          session.status === "signed-in" ? <>
            <Link className="brand-button brand-button-primary" href="/profile">My profile</Link>
            <Link className="brand-button brand-button-secondary" href="/projects">Browse projects</Link>
          </> : <Link className="brand-button brand-button-primary" href="/register">Create your profile</Link>}
      </div>
      <Link href="/how-it-works" className="hero-how-link">How it works <span aria-hidden="true">→</span></Link>
    </section>
    <ProjectShowcase />
  </main>;
}

export default function LandingPage() {
  return <PublicExperience><Hero /></PublicExperience>;
}
