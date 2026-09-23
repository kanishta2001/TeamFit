"use client";

import { useRef } from "react";

export default function LogoutConfirm({ onLogout, busy = false, className = "" }: {
  onLogout: () => Promise<void> | void;
  busy?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return <>
    <button type="button" className={className} disabled={busy} onClick={() => dialog.current?.showModal()}>
      {busy ? "Logging out…" : "Log out"}
    </button>
    <dialog ref={dialog} className="logout-confirm-dialog" aria-labelledby="logout-confirm-title" aria-describedby="logout-confirm-description">
      <h2 id="logout-confirm-title">Log out of TeamFit?</h2>
      <p id="logout-confirm-description">Are you sure you want to log out?</p>
      <div className="logout-confirm-actions">
        <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" onClick={() => { dialog.current?.close(); void onLogout(); }}>Log out</button>
      </div>
    </dialog>
  </>;
}
