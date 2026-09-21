"use client";

import Link from "next/link";
import Brand from "./brand";

export default function SiteHeader({ signedIn, username, checking = false, busy = false, onLogout, onRefresh, homeHref = "/" }: {
  signedIn: boolean; username?: string; checking?: boolean; busy?: boolean;
  onLogout?: () => void; onRefresh?: () => void; homeHref?: string;
}) {
  return <header className="site-header">
    <div className="site-header-inner">
      <Brand href={homeHref} />
      <nav className="account-navigation" aria-label="Account navigation">
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
