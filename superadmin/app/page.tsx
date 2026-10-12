"use client";

import { useEffect, useState, type FormEvent } from "react";
import Management from "./Management";

type SessionUser = { name: string; username: string };

export default function SuperadminLogin() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/superadmin/me", { credentials: "include", cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      .then(async response => { if (response.ok) setUser((await response.json()).user); })
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/superadmin/login", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: fields.get("username"), password: fields.get("password") }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.user) throw new Error(data.message || "Sign in is unavailable. Please try again.");
      form.reset();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "The server took too long to respond. Please try again.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/superadmin/logout", { method: "POST", credentials: "include", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      setUser(null);
    } catch { setError("Unable to sign out. Please try again."); }
    finally { setBusy(false); }
  }

  if (user) return <Management name={user.name || user.username} logout={logout}/>;
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand">HivraSoft<span>.</span><span className="badge">SUPERADMIN</span></div>
        <div className="lock-mark" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></div>
        <h1 id="login-title">{user ? `Welcome, ${user.name || user.username}` : "Superadmin sign in"}</h1>
        <p className="subtitle">{user ? "You are signed in to your superadmin account." : "Sign in with your superadmin credentials."}</p>
        {checking ? <p role="status" className="session-status">Checking your session…</p> : user ? (
          <div className="signed-in"><p className="success" role="status">Superadmin access verified</p><button className="submit" onClick={logout} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button></div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="username">Login ID</label>
            <input id="username" name="username" autoComplete="username" placeholder="Enter your login ID" required maxLength={100} disabled={busy} />
            <label htmlFor="password">Password</label>
            <div className="password-field"><input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required maxLength={256} disabled={busy}/><button type="button" className="toggle" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Hide" : "Show"}</button></div>
            <button className="submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<span aria-hidden="true">→</span></button>
          </form>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="footer-links"><a href={process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"}>← Back to store</a><a href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"}>Admin login</a></div>
      </section>
      <p className="copyright">HivraSoft · Superadmin portal</p>
    </main>
  );
}
