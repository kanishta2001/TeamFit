"use client";

import { useState } from "react";
import { api, message } from "@/lib/api";
import type { Invitation } from "@/lib/types";
import { buttonStyle, Notice, panelStyle, secondaryStyle } from "./form-controls";

export default function InvitationInbox({ invitations, onChanged }: { invitations: Invitation[]; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function respond(id: number, status: "Accepted" | "Rejected") {
    setBusy(id); setError(""); setNotice("");
    try { await api(`invitations/${id}`, "PUT", { status }); await onChanged(); setNotice(status === "Accepted" ? "You joined the team. Find it under Projects → My teams." : "Invitation rejected."); }
    catch (reason) { setError(message(reason)); }
    finally { setBusy(null); }
  }
  return <section className="space-y-5">
    <h2 className="text-2xl font-bold">Invitation inbox</h2>
    <p className="text-slate-600">Your in-app notifications. Use Refresh to check for new invitations. Pending invitations do not reserve a team place.</p>
    <Notice text={error} error /><Notice text={notice} />
    {!invitations.length && <p className={panelStyle}>No invitations yet. Complete your skills and availability so project owners can find you.</p>}
    {invitations.map(item => <article className={panelStyle} key={item.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.status} · Project: {item.projectStatus}</p></div>
        {item.status === "Pending" && <div className="flex gap-3">
          <button className={buttonStyle} disabled={busy !== null || item.projectStatus !== "Open"} onClick={() => respond(item.id, "Accepted")}>Accept</button>
          <button className={secondaryStyle} disabled={busy !== null} onClick={() => respond(item.id, "Rejected")}>Reject</button>
        </div>}
      </div>
    </article>)}
  </section>;
}
