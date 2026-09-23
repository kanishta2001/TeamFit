"use client";

import { useState } from "react";
import Link from "next/link";
import { api, message } from "@/lib/api";
import type { Invitation } from "@/lib/types";
import { buttonStyle, Notice, panelStyle, secondaryStyle } from "./form-controls";
import PageBack from "./page-back";

export default function InvitationInbox({ invitations, onChanged }: { invitations: Invitation[]; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function respond(item: Invitation, status: "Accepted" | "Rejected") {
    const id = item.id;
    setBusy(id); setError(""); setNotice("");
    try {
      await api(item.kind === "Task" ? `invitations/tasks/${id}` : `invitations/${id}`, "PUT", { status });
      await onChanged();
      setNotice(status === "Accepted" ? (item.kind === "Task" ? "Task accepted. It now appears under Workspace → My accepted tasks." : "You joined the team. Find it under Projects → My projects.") : "Invitation rejected.");
    }
    catch (reason) { setError(message(reason)); }
    finally { setBusy(null); }
  }
  return <section className="space-y-5">
    <PageBack />
    <h2 className="invitation-inbox-title">Invitation inbox</h2>
    <p className="text-slate-600">Project and task invitations appear here. Accept a task before it appears in your Workspace.</p>
    <Notice text={error} error /><Notice text={notice} />
    {!invitations.length && <p className={panelStyle}>No invitations yet. Complete your skills and availability so project owners can find you.</p>}
    {invitations.map(item => <article className={panelStyle} key={item.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-700">{item.kind} invitation</p>
          <h3 className="text-xl font-bold"><Link href={`/projects/${item.projectId}`} className="hover:text-indigo-700">{item.kind === "Task" ? item.taskTitle : item.title}</Link></h3>
          <p className="mt-2 text-sm text-slate-600">{item.status} · Project: {item.title}{item.deadlineAt ? ` · Due ${new Date(item.deadlineAt).toLocaleDateString()}` : ""}</p></div>
        {item.status === "Pending" && <div className="flex gap-3">
          <button className={buttonStyle} disabled={busy !== null || (item.kind === "Project" && item.projectStatus !== "Open")} onClick={() => respond(item, "Accepted")}>Accept</button>
          <button className={secondaryStyle} disabled={busy !== null} onClick={() => respond(item, "Rejected")}>Reject</button>
        </div>}
      </div>
    </article>)}
  </section>;
}
