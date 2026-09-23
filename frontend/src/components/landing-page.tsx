"use client";

import Link from "next/link";
import PublicExperience, { usePublicSession } from "./public-experience";
import ProjectShowcase from "./project-showcase";

function Hero() {
  const session = usePublicSession();
  return <main className="landing-hero">
    <section className="hero-copy" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero-title">
        <span className="hero-intro">Find your</span>{" "}
        <span className="hero-build">TEAM.</span>{" "}
        <span className="hero-line">Build something great.</span>
      </h1>
      <p className="hero-description">Bring your skills, find your people, and create together. TeamFit makes it easier to build the right student project team.</p>
      <div className="hero-actions">
        {session.status === "loading" ? <span className="hero-session-placeholder" aria-hidden="true" /> :
          session.status === "signed-in" && !session.profile ? <Link className="brand-button brand-button-primary" href="/profile/create">Complete your profile</Link> :
          session.status === "signed-in" ? <>
            <Link className="brand-button brand-button-primary" href="/workspace">Workspace</Link>
            <Link className="brand-button brand-button-secondary" href="/projects">Browse projects</Link>
          </> : <Link className="brand-button brand-button-primary" href="/register">Let’s Build</Link>}
      </div>
      <Link href="/how-it-works" className="hero-how-link">How it works <span aria-hidden="true">→</span></Link>
    </section>
    <ProjectShowcase />
  </main>;
}

export default function LandingPage() {
  return <PublicExperience><Hero /></PublicExperience>;
}
