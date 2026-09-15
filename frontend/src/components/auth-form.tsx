"use client";

import { useState, type FormEvent } from "react";
import { api, message } from "@/lib/api";
import type { User } from "@/lib/types";
import { buttonStyle, Field, inputStyle, Notice, panelStyle } from "./form-controls";

export default function AuthForm({ onSignedIn }: { onSignedIn: (user: User) => Promise<void> }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const result = await api<{ user: User }>(register ? "auth/register" : "auth/login", "POST", {
        email: data.get("email"), password: data.get("password"),
      });
      await onSignedIn(result.user);
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  return <section className={`${panelStyle} mx-auto max-w-lg`}>
    <h1 className="text-2xl font-bold">{register ? "Create your TeamFit account" : "Welcome back to TeamFit"}</h1>
    <p className="mt-3 text-slate-600">Find teammates, share your skills, and manage your university projects.</p>
    <form onSubmit={submit} className="mt-6 space-y-5">
      <Field label="Email"><input className={inputStyle} name="email" type="email" autoComplete="email" required maxLength={150} /></Field>
      <Field label="Password"><input className={inputStyle} name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 10 : 1} maxLength={128} /></Field>
      {register && <p className="text-sm text-slate-500">Use at least 10 characters. Create your student profile after registration.</p>}
      <Notice text={error} error />
      <button className={buttonStyle} disabled={busy}>{busy ? "Please wait..." : register ? "Register" : "Sign in"}</button>
    </form>
    <button type="button" disabled={busy} className="mt-5 text-sm font-semibold text-indigo-700"
      onClick={() => { setRegister(!register); setError(""); }}>
      {register ? "Already have an account? Sign in" : "New here? Create an account"}
    </button>
  </section>;
}
