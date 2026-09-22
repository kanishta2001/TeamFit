"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, message } from "@/lib/api";
import type { Invitation, Options, Project, Skill, Student, User } from "@/lib/types";
import { Notice, secondaryStyle } from "./form-controls";
import { displayName } from "@/lib/display-name";
import SiteHeader from "./site-header";

type Snapshot = { user: User; profile: Student | null; students: Student[]; skills: Skill[]; projects: Project[]; invitations: Invitation[]; options: Options };
type WorkspaceContextValue = Snapshot & { refresh: () => Promise<void> };
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workspace pages must be inside Workspace.");
  return context;
}

async function loadWorkspace(): Promise<Snapshot> {
  const user = await api<User>("auth/me");
  const profile = await api<Student>("students/me").catch(reason => {
    if (reason instanceof ApiError && reason.status === 404) return null;
    throw reason;
  });
  // Profile setup is the only workspace screen allowed before onboarding is complete.
  if (!profile) {
    const [skills, options] = await Promise.all([api<Skill[]>("skills"), api<Options>("options")]);
    return { user, profile, students: [], skills, projects: [], invitations: [], options };
  }
  const [students, skills, projects, invitations, options] = await Promise.all([
    api<Student[]>("students"), api<Skill[]>("skills"), api<Project[]>("projects"),
    api<Invitation[]>("invitations"), api<Options>("options"),
  ]);
  return { user, profile, students, skills, projects, invitations, options };
}

export default function Workspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loaded, setLoaded] = useState<{ path: string; data: Snapshot } | null>(null);
  const [failure, setFailure] = useState<{ path: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const data = loaded?.path === pathname ? loaded.data : null;
  const error = failure?.path === pathname ? failure.text : "";

  // Each URL is checked again; a protected screen never renders before authentication.
  useEffect(() => {
    let active = true;
    loadWorkspace().then(snapshot => {
      if (!active) return;
      setLoaded({ path: pathname, data: snapshot }); setFailure(null);
      if (!snapshot.profile && pathname !== "/profile/create") router.replace("/profile/create");
    }).catch(reason => {
      if (!active) return;
      setLoaded(null);
      if (reason instanceof ApiError && reason.status === 401)
        router.replace("/login?next=" + encodeURIComponent(pathname));
      else setFailure({ path: pathname, text: message(reason) });
    });
    return () => { active = false; };
  }, [pathname, router]);

  async function refresh() {
    setBusy(true); setFailure(null);
    try {
      const snapshot = await loadWorkspace();
      // A refresh started on another page must not replace the new page's state.
      if (window.location.pathname !== pathname) return;
      setLoaded({ path: pathname, data: snapshot });
      if (!snapshot.profile && pathname !== "/profile/create") router.replace("/profile/create");
    } catch (reason) {
      if (window.location.pathname !== pathname) return;
      setFailure({ path: pathname, text: message(reason) });
      if (reason instanceof ApiError && reason.status === 401) {
        setLoaded(null); router.replace("/login?next=" + encodeURIComponent(pathname));
      }
      throw reason;
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await api("auth/logout", "POST"); setLoaded(null); router.replace("/"); }
    catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) { setLoaded(null); router.replace("/"); }
      else setFailure({ path: pathname, text: message(reason) });
    } finally { setBusy(false); }
  }

  return <div className="workspace-shell">
    <SiteHeader signedIn={Boolean(data)} profileReady={Boolean(data?.profile)} checking={!data && !error} username={displayName(data?.profile?.fullName)}
      busy={busy} onLogout={logout} />
    <div className="workspace-container">
      <main className="space-y-6">
        <Notice text={error} error />
        {!data && error && <button className={secondaryStyle} disabled={busy} onClick={() => void refresh().catch(() => {})}>Retry connection</button>}
        {!data ? <p role="status">{error ? "Use Retry connection to try again." : "Loading your workspace…"}</p> :
          !data.profile && pathname !== "/profile/create" ? <p role="status">Opening profile setup…</p> :
          <WorkspaceContext.Provider value={{ ...data, refresh }}>{children}</WorkspaceContext.Provider>}
      </main>
    </div>
  </div>;
}
