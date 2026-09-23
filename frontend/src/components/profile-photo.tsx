"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { api, message } from "@/lib/api";
import type { Student } from "@/lib/types";
import StudentAvatar from "./student-avatar";

export default function ProfilePhoto({ student, onChanged }: { student: Student; onChanged: () => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024 || !file.size) {
      setError("Choose a JPG or PNG image smaller than 2 MB."); return;
    }
    setBusy(true);
    try {
      // Check that the selected file can be decoded before sending it to the API.
      const bitmap = await createImageBitmap(file).catch(() => { throw new Error("This image could not be opened. Choose another JPG or PNG."); });
      bitmap.close();
      const form = new FormData();
      form.append("file", file);
      await api(`students/${student.id}/photo`, "PUT", form);
      await onChanged();
      setNotice("Profile picture saved.");
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError(""); setNotice("");
    try {
      await api(`students/${student.id}/photo`, "DELETE");
      await onChanged(); setNotice("Profile picture removed.");
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  return <div className="profile-photo-control">
    <input ref={input} type="file" accept="image/jpeg,image/png" hidden aria-label="Choose profile picture" onChange={upload} disabled={busy} />
    <button type="button" className="profile-avatar profile-photo-button" disabled={busy}
      aria-label={student.photoVersion ? "Change profile picture" : "Add profile picture"}
      aria-describedby="profile-photo-help" onClick={() => input.current?.click()}>
      <StudentAvatar student={student} />
    </button>
    <p id="profile-photo-help" className="profile-photo-help">{busy ? "Saving picture…" : `${student.photoVersion ? "Click photo to change" : "Click circle to add photo"} · JPG/PNG, max 2 MB`}</p>
    {student.photoVersion && <button type="button" className="profile-photo-remove" disabled={busy} onClick={() => void remove()}>Remove photo</button>}
    {error && <p className="profile-photo-error" role="alert">{error}</p>}
    <span className="sr-only" role="status">{notice}</span>
  </div>;
}
