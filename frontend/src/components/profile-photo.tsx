"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { api, message } from "@/lib/api";
import type { Student } from "@/lib/types";
import StudentAvatar from "./student-avatar";

const PREVIEW_SIZE = 320;
const OUTPUT_SIZE = 512;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

type Offset = { x: number; y: number };

function clampOffset(image: ImageBitmap, zoom: number, offset: Offset): Offset {
  const scale = Math.max(PREVIEW_SIZE / image.width, PREVIEW_SIZE / image.height) * zoom;
  return {
    x: Math.max((PREVIEW_SIZE - image.width * scale) / 2, Math.min((image.width * scale - PREVIEW_SIZE) / 2, offset.x)),
    y: Math.max((PREVIEW_SIZE - image.height * scale) / 2, Math.min((image.height * scale - PREVIEW_SIZE) / 2, offset.y)),
  };
}

function drawCrop(canvas: HTMLCanvasElement, image: ImageBitmap, zoom: number, offset: Offset) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const ratio = canvas.width / PREVIEW_SIZE;
  const scale = Math.max(PREVIEW_SIZE / image.width, PREVIEW_SIZE / image.height) * zoom * ratio;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#e9eef3";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image,
    (canvas.width - image.width * scale) / 2 + offset.x * ratio,
    (canvas.height - image.height * scale) / 2 + offset.y * ratio,
    image.width * scale, image.height * scale);
}

export default function ProfilePhoto({ student, onChanged }: { student: Student; onChanged: () => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const avatarButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; offset: Offset } | null>(null);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { if (image && preview.current) drawCrop(preview.current, image, zoom, offset); }, [image, zoom, offset]);
  useEffect(() => () => image?.close(), [image]);
  useEffect(() => { if (image) cancelButton.current?.focus(); }, [image]);
  useEffect(() => {
    if (!image) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) { event.preventDefault(); setImage(null); avatarButton.current?.focus(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, busy]);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > MAX_FILE_SIZE || !file.size) {
      setError("Choose a JPG or PNG image up to 2 MB."); return;
    }
    try {
      const bitmap = await createImageBitmap(file).catch(() => { throw new Error("This image could not be opened. Choose another JPG or PNG."); });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImage(bitmap);
    } catch (reason) { setError(message(reason)); }
  }

  function closeEditor() {
    setImage(null);
    setError("");
    avatarButton.current?.focus();
  }

  async function save() {
    if (!image) return;
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      drawCrop(canvas, image, zoom, offset);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(result => result ? resolve(result) : reject(new Error("Could not crop this image.")), "image/jpeg", 0.85));
      const form = new FormData();
      form.append("file", blob, "profile-photo.jpg");
      await api(`students/${student.id}/photo`, "PUT", form);
      await onChanged();
      setImage(null);
      setNotice("Profile picture saved.");
      avatarButton.current?.focus();
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    setError(""); setNotice("");
    try {
      await api(`students/${student.id}/photo`, "DELETE");
      await onChanged();
      setNotice("Profile picture removed.");
      avatarButton.current?.focus();
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!image || !drag.current) return;
    const ratio = PREVIEW_SIZE / event.currentTarget.getBoundingClientRect().width;
    setOffset(clampOffset(image, zoom, {
      x: drag.current.offset.x + (event.clientX - drag.current.x) * ratio,
      y: drag.current.offset.y + (event.clientY - drag.current.y) * ratio,
    }));
  }

  return <div className="profile-photo-control">
    <input ref={input} type="file" accept="image/jpeg,image/png" hidden aria-label="Choose profile picture" onChange={choose} disabled={busy} />
    <button ref={avatarButton} type="button" className="profile-avatar profile-photo-button" disabled={busy}
      aria-label={student.photoVersion ? "Change profile picture" : "Add profile picture"}
      aria-describedby="profile-photo-help" onClick={() => input.current?.click()}>
      <StudentAvatar student={student} />
      <span className="profile-photo-hint" aria-hidden="true">
        <span>{student.photoVersion ? "Change photo" : "Add photo"}<small>JPG/PNG, max 2 MB</small></span>
      </span>
    </button>
    {student.photoVersion && <button type="button" className="profile-photo-remove" disabled={busy}
      onClick={remove}>Remove photo</button>}
    <span id="profile-photo-help" className="sr-only">Click photo to change. JPG or PNG, up to 2 MB. Adjust the crop before saving.</span>
    {error && !image && <p className="profile-photo-error" role="alert">{error}</p>}
    <span className="sr-only" role="status">{busy ? "Saving picture…" : notice}</span>
    {image && <div className="profile-crop-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) closeEditor(); }}>
      <div className="profile-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-crop-title" aria-describedby="profile-crop-help">
        <h2 id="profile-crop-title">Adjust profile picture</h2>
        <p id="profile-crop-help">Drag the photo to choose what appears in the circle. Use Zoom to adjust its size.</p>
        <div className="profile-crop-preview">
          <canvas ref={preview} width={PREVIEW_SIZE} height={PREVIEW_SIZE} role="img" aria-label="Profile picture crop preview"
            tabIndex={0} onPointerDown={event => {
              drag.current = { x: event.clientX, y: event.clientY, offset };
              event.currentTarget.setPointerCapture(event.pointerId);
            }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
            onKeyDown={event => {
              if (!image) return;
              const moves: Record<string, Offset> = {
                ArrowLeft: { x: -10, y: 0 }, ArrowRight: { x: 10, y: 0 },
                ArrowUp: { x: 0, y: -10 }, ArrowDown: { x: 0, y: 10 },
              };
              const delta = moves[event.key];
              if (delta) { event.preventDefault(); setOffset(current => clampOffset(image, zoom, { x: current.x + delta.x, y: current.y + delta.y })); }
            }} />
        </div>
        <label className="profile-crop-zoom">Zoom
          <input type="range" min="1" max="3" step="0.01" value={zoom} disabled={busy} onChange={event => {
            const value = Number(event.target.value);
            setZoom(value);
            setOffset(current => clampOffset(image, value, current));
          }} />
        </label>
        {error && <p className="profile-photo-error" role="alert">{error}</p>}
        <div className="profile-crop-actions">
          <button ref={cancelButton} type="button" onClick={closeEditor} disabled={busy}>Cancel</button>
          <button type="button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save photo"}</button>
        </div>
      </div>
    </div>}
  </div>;
}
