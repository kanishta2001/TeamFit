"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { api, ApiError, message } from "@/lib/api";
import { displayName } from "@/lib/display-name";
import type { Student } from "@/lib/types";
import SiteHeader from "./site-header";

type Session = { status: "loading" | "guest" | "signed-in" | "error"; profile: Student | null; error: string };
const PublicSession = createContext<Session>({ status: "loading", profile: null, error: "" });
export const usePublicSession = () => useContext(PublicSession);

export default function PublicExperience({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session>({ status: "loading", profile: null, error: "" });
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function checkSession() {
      const request = ++sequence;
      try {
        // Guests never request the private student/project directories.
        await api("auth/me");
        const profile = await api<Student>("students/me").catch(reason => {
          if (reason instanceof ApiError && reason.status === 404) return null;
          throw reason;
        });
        if (active && request === sequence) setSession({ status: "signed-in", profile, error: "" });
      } catch (reason) {
        if (active && request === sequence) setSession({
          status: reason instanceof ApiError && reason.status === 401 ? "guest" : "error",
          profile: null,
          error: reason instanceof ApiError && reason.status === 401 ? "" : message(reason),
        });
      }
    }
    void checkSession();
    // Re-check when returning from another tab, including after a logout there.
    window.addEventListener("focus", checkSession);
    return () => { active = false; window.removeEventListener("focus", checkSession); };
  }, [pathname, revision]);

  async function logout() {
    setBusy(true);
    try {
      await api("auth/logout", "POST");
      setSession({ status: "guest", profile: null, error: "" });
      setRevision(value => value + 1);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401)
        setSession({ status: "guest", profile: null, error: "" });
      else setSession(current => ({ ...current, error: message(reason) }));
    } finally { setBusy(false); }
  }
  return <PublicSession.Provider value={session}>
    <div className={pathname === "/" ? "public-experience landing-home" : "public-experience"}>
      {!hideHeader && <SiteHeader signedIn={session.status === "signed-in"} profileReady={Boolean(session.profile)} username={displayName(session.profile?.fullName)}
        checking={session.status === "loading"} busy={busy} onLogout={logout} />}
      {session.error && <div className="public-session-error" role="alert" aria-label="Session connection error">
        <p>{session.error}</p>
        <button onClick={() => setRevision(value => value + 1)}>Retry connection</button>
      </div>}
      {children}
    </div>
  </PublicSession.Provider>;
}
