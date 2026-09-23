"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { NotificationSummary } from "@/lib/types";

export default function NotificationBell({ enabled }: { enabled: boolean }) {
  const [summary, setSummary] = useState<NotificationSummary>({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const load = () => api<NotificationSummary>("notifications")
      .then(value => { if (active) setSummary(value); }).catch(() => {});
    void load();
    const timer = window.setInterval(load, 30000);
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [enabled]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && summary.unreadCount > 0) {
      setSummary(value => ({ ...value, unreadCount: 0 }));
      await api("notifications/read", "POST").catch(() => {});
    }
  }

  return <div className="notification-control" ref={root}>
    <button type="button" className="notification-button" aria-label={`Notifications${summary.unreadCount ? `, ${summary.unreadCount} unread` : ""}`}
      aria-expanded={open} onClick={() => void toggle()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {summary.unreadCount > 0 && <span className="notification-badge">{summary.unreadCount > 99 ? "99+" : summary.unreadCount}</span>}
    </button>
    {open && <section className="notification-popover" aria-label="Notifications panel">
      <div className="notification-popover-heading"><h2>Notifications</h2></div>
      {summary.items.length === 0 ? <p className="notification-empty">No notifications yet.</p> :
        <div className="notification-list">{summary.items.map(item => <Link href={item.href} key={item.id} onClick={() => setOpen(false)}>
          <strong>{item.title}</strong><span>{item.detail}</span><time>{new Date(item.createdAt).toLocaleString()}</time>
        </Link>)}</div>}
      <div className="notification-footer"><Link href="/notifications" onClick={() => setOpen(false)}>See all</Link></div>
    </section>}
  </div>;
}
