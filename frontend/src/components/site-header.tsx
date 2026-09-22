"use client";

import Link from "next/link";
import Brand from "./brand";

export default function SiteHeader({ signedIn, username, profileReady = true, checking = false, busy = false, onLogout, onRefresh }: {
  signedIn: boolean; username?: string; profileReady?: boolean; checking?: boolean; busy?: boolean;
  onLogout?: () => void; onRefresh?: () => void;
}) {
  return <header className="site-header">
    <div className="site-header-inner">
      <Brand />
      <nav className="account-navigation" aria-label="Account navigation">
        {checking ? <span className="session-check" role="status">Checking session…</span> : signedIn ? <>
          {profileReady ? <Link href="/profile" className="account-name" aria-label={`My profile: ${username}`}>
            <span aria-hidden="true" className="account-avatar">{username?.slice(0, 1).toUpperCase()}</span>
            <span className="account-name-text">{username}</span>
          </Link> : <span className="account-name" aria-label="Profile setup required">
            <span aria-hidden="true" className="account-avatar">S</span>
            <span className="account-name-text">Student</span>
          </span>}
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
