"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "./brand";

export default function SiteHeader({ signedIn, username, checking = false, busy = false, onLogout, onRefresh }: {
  signedIn: boolean; username?: string; checking?: boolean; busy?: boolean;
  onLogout?: () => void; onRefresh?: () => void;
}) {
  const pathname = usePathname();
  return <header className="site-header">
    <div className="site-header-inner">
      <Brand />
      <nav className="account-navigation" aria-label="Account navigation">
        <Link href="/how-it-works" aria-current={pathname === "/how-it-works" ? "page" : undefined}>How it works</Link>
        {checking ? <span className="session-check" role="status">Checking session…</span> : signedIn ? <>
          <Link href="/profile" className="account-name" aria-label={`My profile: ${username}`}>
            <span aria-hidden="true" className="account-avatar">{username?.slice(0, 1).toUpperCase()}</span>
            <span className="account-name-text">{username}</span>
          </Link>
          {onRefresh && <button disabled={busy} onClick={onRefresh}>Refresh</button>}
          <button className="logout-button" disabled={busy} onClick={onLogout}>Log out</button>
        </> : <>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>}
      </nav>
    </div>
  </header>;
}

export function WorkspaceNavigation({ pending = 0 }: { pending?: number }) {
  const pathname = usePathname();
  return <nav className="workspace-navigation" aria-label="Workspace navigation">
    {[
      ["/dashboard", "Dashboard"], ["/profile", "My Profile"], ["/students", "Students"],
      ["/projects", "Projects"], ["/invitations", "Invitations"],
    ].map(([href, label]) => <Link key={href} href={href}
      aria-current={pathname === href || pathname.startsWith(href + "/") ? "page" : undefined}>
      {label}{href === "/invitations" && pending > 0 && <span className="nav-count">{pending}</span>}
    </Link>)}
  </nav>;
}
