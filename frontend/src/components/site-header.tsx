"use client";

import Link from "next/link";
import Brand from "./brand";
import LogoutConfirm from "./logout-confirm";
import NotificationBell from "./notification-bell";

export default function SiteHeader({ signedIn, username, profileReady = true, checking = false, busy = false, onLogout }: {
  signedIn: boolean; username?: string; profileReady?: boolean; checking?: boolean; busy?: boolean;
  onLogout: () => Promise<void> | void;
}) {
  return <header className="site-header">
    <div className="site-header-inner">
      <Brand />
      <nav className="account-navigation" aria-label="Account navigation">
        {checking ? <span className="session-check" role="status">Checking session…</span> : signedIn ? <>
          <NotificationBell enabled={signedIn} />
          {profileReady ? <Link href="/profile" className="account-name" aria-label={`My profile: ${username}`}>
            <span aria-hidden="true" className="account-avatar">{username?.slice(0, 1).toUpperCase()}</span>
            <span className="account-name-text">{username}</span>
          </Link> : <span className="account-name" aria-label="Profile setup required">
            <span aria-hidden="true" className="account-avatar">S</span>
            <span className="account-name-text">Student</span>
          </span>}
          <LogoutConfirm className="logout-button" busy={busy} onLogout={onLogout} />
        </> : <>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>}
      </nav>
    </div>
  </header>;
}
