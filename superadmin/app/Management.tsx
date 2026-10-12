"use client";
import { useCallback, useEffect, useState } from "react";

type Admin = { _id: string; name: string; username?: string; email: string; phone: string; role: string; adminStatus?: string; accountStatus: string; emailVerified: boolean; createdAt: string; approvedAt?: string; lastLoginAt?: string; credentialDelivery?: string; mustChangePassword?: boolean };
type Log = { _id: string; createdAt: string; actor?: { name?: string; username?: string; email?: string; role?: string }; action: string; module: string; recordId: string; status: string; ip: string; metadata: unknown };
const time = (s?: string) => s ? new Date(s).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }) : "—";
async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`/api/superadmin/${path}`, { method, credentials: "include", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
export default function Management({ name, logout }: { name: string; logout: () => void }) {
  const [tab, setTab] = useState<"admins" | "activity">("admins");
  const [admins, setAdmins] = useState<Admin[]>([]), [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1), [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const [adminId, setAdminId] = useState(""), [action, setAction] = useState(""), [module, setModule] = useState("");
  const [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [profile, setProfile] = useState<Admin | null>(null), [detail, setDetail] = useState<Log | null>(null);
  const [choices, setChoices] = useState<Admin[]>([]);
  const [error, setError] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const query = useCallback(() => {
    const q = new URLSearchParams({ page: String(page), limit: "20", search });
    if (tab === "admins") q.set("status", status);
    else { q.set("adminId", adminId); q.set("action", action); q.set("module", module); if (from) q.set("from", new Date(`${from}:00+05:30`).toISOString()); if (to) q.set("to", new Date(`${to}:00+05:30`).toISOString()); }
    return q;
  }, [page, search, tab, status, adminId, action, module, from, to]);
  const refresh = useCallback(async () => {
    setBusy(true); setError("");
    try { const [data, counts] = await Promise.all([api(`${tab}?${query()}`), api("dashboard")]); if (tab === "admins") setAdmins(data.items); else setLogs(data.items); setTotal(data.total); setStats(counts); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load."); }
    finally { setBusy(false); }
  }, [tab, query]);
  useEffect(() => { const timer = setTimeout(() => { void refresh(); }, 250); return () => clearTimeout(timer); }, [refresh]);
  useEffect(() => { api("admins?limit=100").then(data => setChoices(data.items)).catch(() => {}); }, []);
  async function mutate(admin: Admin, operation: string, nextStatus?: string) {
    setBusy(true); setError(""); setMessage("");
    try { const data = await api(`admins/${admin._id}/${operation}`, nextStatus ? "PATCH" : "POST", nextStatus ? { status: nextStatus } : {}); setMessage(data.message || "Admin updated."); if (profile?._id === admin._id) setProfile((await api(`admins/${admin._id}`)).user); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Update failed."); }
    finally { setBusy(false); }
  }
  function activity(admin: Admin) { setAdminId(admin._id); setSearch(""); setPage(1); setTab("activity"); setProfile(null); }
  async function openAdmin() {
    setBusy(true); setError("");
    try { await api("admin-session", "POST", {}); window.location.assign("/admin"); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to open admin panel."); setBusy(false); }
  }
  const actions = (a: Admin) => <div className="actions">
    {a.adminStatus === "pending_approval" && <><button disabled={busy} onClick={() => mutate(a, "approve")}>Approve</button><button disabled={busy} onClick={() => mutate(a, "reject")}>Reject</button></>}
    {(a.adminStatus === "approved" || !a.adminStatus) && <><button disabled={busy} onClick={() => mutate(a, "status", a.accountStatus === "active" ? "inactive" : "active")}>{a.accountStatus === "active" ? "Deactivate" : "Activate / Unblock"}</button>{a.accountStatus !== "blocked" && <button disabled={busy} onClick={() => mutate(a, "status", "blocked")}>Block</button>}{a.mustChangePassword && <button disabled={busy} onClick={() => mutate(a, "retry-credentials")}>Resend new credentials</button>}</>}
    <button onClick={() => activity(a)}>View activity</button>
  </div>;
  return <main className="management">
    <header className="management-header"><div><div className="brand">HivraSoft<span>.</span></div><h1>Superadmin management</h1><p>Welcome, {name}</p></div><div className="actions"><button onClick={openAdmin} disabled={busy}>Open full Admin panel</button><button onClick={logout}>Sign out</button></div></header>
    <div className="stats">{Object.entries(stats).map(([key, value]) => <button key={key} onClick={() => { setTab("admins"); setStatus(key === "pending" ? "pending_approval" : key); setPage(1); }}><strong>{value}</strong><span>{key}</span></button>)}</div>
    <nav className="actions"><button aria-pressed={tab === "admins"} onClick={() => { setTab("admins"); setPage(1); }}>All admins / Requests</button><button aria-pressed={tab === "activity"} onClick={() => { setTab("activity"); setPage(1); }}>Activity logs</button><button onClick={refresh} disabled={busy}>Refresh</button></nav>
    <section className="management-panel"><h2>{tab === "admins" ? "Admin accounts" : "Activity logs"}</h2><div className="filters">
      <label>Search name, username or email<input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></label>
      {tab === "admins" ? <label>Status<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{["unverified", "pending_approval", "approved", "rejected", "active", "inactive", "blocked"].map(s => <option key={s}>{s}</option>)}</select></label> : <>
        <label>Admin<select value={adminId} onChange={e => { setAdminId(e.target.value); setPage(1); }}><option value="">All staff</option>{choices.map(a => <option key={a._id} value={a._id}>{a.name} — {a.email}</option>)}</select></label>
        <label>Action<select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}><option value="">All actions</option>{["CREATE", "UPDATE", "DELETE", "SOFT_DELETE", "PERMANENT_DELETE", "RESTORE", "LOGIN", "LOGOUT", "APPROVE", "REJECT", "BLOCK", "UNBLOCK", "EXPORT"].map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Module<input placeholder="products, orders, admins…" value={module} onChange={e => { setModule(e.target.value); setPage(1); }}/></label>
        <label>From (India time)<input type="datetime-local" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}/></label><label>To (India time)<input type="datetime-local" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}/></label>
        <a className="button" href={`/api/superadmin/activity?${query()}&export=csv`}>Export CSV</a>
      </>}
    </div>
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}{busy && <p role="status">Loading…</p>}
    <div className="table-scroll">{tab === "admins" ? <table><thead><tr><th>Admin</th><th>Contact</th><th>Status</th><th>Registered (IST)</th><th>Actions</th></tr></thead><tbody>{admins.map(a => <tr key={a._id}><td><strong>{a.name}</strong><br/>{a.username || "Username assigned on approval"}</td><td>{a.email}<br/>{a.phone}<br/>{a.emailVerified ? "Email verified" : "Unverified"}</td><td>{a.adminStatus || "approved"}<br/>{a.accountStatus}<br/>{a.credentialDelivery && `Email: ${a.credentialDelivery}`}</td><td>{time(a.createdAt)}</td><td><button onClick={async () => { try { setProfile((await api(`admins/${a._id}`)).user); } catch (err) { setError(String(err)); } }}>View details</button>{actions(a)}</td></tr>)}</tbody></table> : <table><thead><tr><th>Time (Asia/Kolkata)</th><th>Admin</th><th>Action</th><th>Module / Record</th><th>Result</th></tr></thead><tbody>{logs.map(l => <tr key={l._id}><td>{time(l.createdAt)}</td><td>{l.actor?.name || "Legacy audit"}<br/>{l.actor?.username}<br/>{l.actor?.email}<br/>{l.actor?.role}</td><td>{l.action}</td><td>{l.module}<br/>{l.recordId}</td><td>{l.status}<br/><button onClick={() => setDetail(l)}>Details</button></td></tr>)}</tbody></table>}</div>
    {!busy && total === 0 && <p>No matching records.</p>}<div className="pagination"><button disabled={page === 1 || busy} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} · {total} records</span><button disabled={page * 20 >= total || busy} onClick={() => setPage(p => p + 1)}>Next</button></div></section>
    {(profile || detail) && <div className="modal-backdrop"><section className="detail-modal" role="dialog" aria-modal="true" aria-label={profile ? "Admin profile" : "Activity details"}><button className="close" onClick={() => { setProfile(null); setDetail(null); }}>Close</button>{profile ? <><h2>{profile.name}</h2><dl>{Object.entries({ Username: profile.username, Email: profile.email, Phone: profile.phone, Role: profile.role, Status: profile.adminStatus, Account: profile.accountStatus, Verified: profile.emailVerified ? "Yes" : "No", Registered: time(profile.createdAt), Approved: time(profile.approvedAt), "Last login": time(profile.lastLoginAt), "Credential email": profile.credentialDelivery }).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>)}</dl>{actions(profile)}</> : detail && <><h2>{detail.action} · {detail.module}</h2><p>{time(detail.createdAt)} IST · {detail.status}</p><p>IP: {detail.ip || "Unavailable"}</p><pre>{JSON.stringify(detail.metadata, null, 2)}</pre></>}</section></div>}
  </main>;
}