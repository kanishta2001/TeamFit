"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, message } from "@/lib/api";
import { safeDestination } from "@/lib/navigation";
import type { Student } from "@/lib/types";
import AuthForm from "./auth-form";
import { Notice } from "./form-controls";
import Brand from "./brand";

export default function AuthScreen({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const destination = safeDestination(next);
  useEffect(() => {
    let active = true;
    api("auth/me").then(async () => {
      const profile = await api<Student>("students/me").catch(reason => {
        if (reason instanceof ApiError && reason.status === 404) return null;
        throw reason;
      });
      if (active) router.replace(profile ? destination : "/profile/create");
    }).catch(reason => {
      if (active) {
        if (!(reason instanceof ApiError && reason.status === 401)) setError(message(reason));
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, [router, destination]);
  return <main className="public-experience min-h-screen px-6 py-8">
    <div className="mx-auto mb-10 max-w-6xl"><Brand /></div>
    <div className="mx-auto mb-4 max-w-lg"><Notice text={error} error /></div>
    {checking ? <p className="text-center" role="status">Checking your session…</p> :
      <AuthForm mode={mode} next={destination} onSignedIn={async () => {
        if (mode === "register") { router.replace("/profile/create"); return; }
        const profile = await api<Student>("students/me").catch(reason => {
          if (reason instanceof ApiError && reason.status === 404) return null;
          throw reason;
        });
        router.replace(profile ? destination : "/profile/create");
      }} />}
  </main>;
}
