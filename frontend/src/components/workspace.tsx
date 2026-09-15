"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, message } from "@/lib/api";
import type { Invitation, Options, Project, Skill, Student, User } from "@/lib/types";
import AuthForm from "./auth-form";
import StudentProfileForm from "./student-profile-form";
import StudentDirectory from "./student-directory";
import ProjectBoard from "./project-board";
import InvitationInbox from "./invitation-inbox";
import { Notice, secondaryStyle } from "./form-controls";

type Snapshot = { profile: Student | null; students: Student[]; skills: Skill[]; projects: Project[]; invitations: Invitation[]; options: Options };
type Tab = "My profile" | "Students" | "Projects" | "Invitations";

export default function Workspace() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Snapshot | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("My profile");

  // The browser sends the HttpOnly session cookie; JavaScript never stores the JWT.
  useEffect(() => {
    let active = true;
    api<User>("auth/me").then(value => { if (active) setUser(value); })
      .catch(reason => { if (active && !(reason instanceof ApiError && reason.status === 401)) setError(message(reason)); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const [profile, students, skills, projects, invitations, options] = await Promise.all([
        api<Student>("students/me").catch(reason => {
          if (reason instanceof ApiError && reason.status === 404) return null;
          throw reason;
        }),
        api<Student[]>("students"), api<Skill[]>("skills"), api<Project[]>("projects"),
        api<Invitation[]>("invitations"), api<Options>("options"),
      ]);
      setData({ profile, students, skills, projects, invitations, options });
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) { setUser(null); setData(null); }
      setError(message(reason));
      throw reason;
    } finally { setRefreshing(false); }
  }

  useEffect(() => {
    if (!user) return;
    // Defer loading until authentication is established.
    let active = true;
    async function load() {
      try {
        const [profile, students, skills, projects, invitations, options] = await Promise.all([
          api<Student>("students/me").catch(reason => {
            if (reason instanceof ApiError && reason.status === 404) return null;
            throw reason;
          }),
          api<Student[]>("students"), api<Skill[]>("skills"), api<Project[]>("projects"),
          api<Invitation[]>("invitations"), api<Options>("options"),
        ]);
        if (active) { setData({ profile, students, skills, projects, invitations, options }); setError(""); }
      } catch (reason) {
        if (!active) return;
        setError(message(reason));
        if (reason instanceof ApiError && reason.status === 401) setUser(null);
      }
    }
    void load();
    return () => { active = false; };
  }, [user]);

  async function logout() {
    try { await api("auth/logout", "POST"); setUser(null); setData(null); setError(""); setTab("My profile"); }
    catch (reason) { setError(message(reason)); }
  }

  const pending = data?.invitations.filter(item => item.status === "Pending").length ?? 0;
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="text-xl font-bold text-indigo-700">TeamFit</Link>
        {user && <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>{user.email}</span>
          <button className={secondaryStyle} onClick={() => void refresh().catch(() => {})} disabled={refreshing}>Refresh</button>
          <button className={secondaryStyle} onClick={logout}>Sign out</button>
        </div>}
      </div>
    </header>
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <Notice text={error} error />
      {checking ? <p role="status">Checking your session…</p> : !user ?
        <AuthForm onSignedIn={async value => { setError(""); setUser(value); }} /> :
        <>
          <div>
            <h1 className="text-3xl font-bold">Your team workspace</h1>
            <p className="mt-2 text-slate-600">Share your strengths, find teammates, and manage your projects.</p>
          </div>
          {data && <div className="grid gap-3 sm:grid-cols-3">
            {[["Students", data.students.filter(student => student.userId !== null).length],
              ["My projects", data.projects.filter(project => project.ownerId === user.id).length],
              ["Pending invitations", pending]].map(([label, count]) =>
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-bold">{count}</p>
              </div>)}
          </div>}
          <nav aria-label="Workspace sections" className="flex flex-wrap gap-2">
            {(["My profile", "Students", "Projects", "Invitations"] as Tab[]).map(item =>
              <button key={item} aria-current={tab === item ? "page" : undefined} onClick={() => setTab(item)}
                className={tab === item ? "rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white" : secondaryStyle}>
                {item}{item === "Invitations" && pending > 0 ? ` (${pending})` : ""}
              </button>)}
          </nav>
          {!data ? <p role="status">{error ? "Use Refresh to try again." : "Loading your workspace…"}</p> : <>
            {tab === "My profile" && <StudentProfileForm key={data.profile?.id ?? "new"} user={user} student={data.profile}
              skills={data.skills} options={data.options} onSaved={refresh} />}
            {tab === "Students" && <StudentDirectory students={data.students} skills={data.skills} options={data.options} />}
            {tab === "Projects" && <ProjectBoard user={user} profile={data.profile} projects={data.projects}
              skills={data.skills} options={data.options} students={data.students} onChanged={refresh} />}
            {tab === "Invitations" && <InvitationInbox invitations={data.invitations} onChanged={refresh} />}
          </>}
        </>}
    </div>
  </main>;
}
