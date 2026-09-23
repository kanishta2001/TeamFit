"use client";

import { useState } from "react";
import { studentPhotoUrl } from "@/lib/api";
import type { Student } from "@/lib/types";

export default function StudentAvatar({ student }: { student: Student }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = student.photoVersion ? studentPhotoUrl(student.id, student.photoVersion) : null;
  if (!url || failedUrl === url) return <span aria-hidden="true">{student.fullName.trim().slice(0, 1).toUpperCase()}</span>;
  // Serve the authenticated image directly so the browser sends its HttpOnly session cookie.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="student-avatar-image" src={url} alt={`${student.fullName}'s profile picture`} onError={() => setFailedUrl(url)} />;
}
