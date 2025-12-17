// src/app/parties/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Party = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  dob?: string | null;
  [k: string]: any;
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "phone" | "dob">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // modal for add / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [saving, setSaving] = useState(false);

  // helper to get base origin (safe in SSR)
  const getBase = () => (typeof window !== "undefined" ? window.location.origin : "");

  useEffect(() => {
    let mounted = true;
    async function fetchParties() {
      setLoading(true);
      setError(null);
      try {
        const base = getBase();
        const res = await fetch(`${base}/api/parties`, { credentials: "include" });
        if (!res.ok) {
          const txt = await safeText(res).catch(() => "");
          throw new Error(txt || `Fetch failed (${res.status})`);
        }
        const raw = await safeJson(res).catch(() => null);
        console.debug("Raw /api/parties response:", raw);

        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (raw == null) arr = [];
        else if (Array.isArray((raw as any).parties)) arr = (raw as any).parties;
        else if (Array.isArray((raw as any).data)) arr = (raw as any).data;
        else if (Array.isArray((raw as any).rows)) arr = (raw as any).rows;
        else if (Array.isArray((raw as any).items)) arr = (raw as any).items;
        else {
          const keys = Object.keys(raw || {});
          const firstArrayKey = keys.find((k) => Array.isArray((raw as any)[k]));
          if (firstArrayKey) arr = (raw as any)[firstArrayKey];
        }
        if (!Array.isArray(arr)) arr = [];

        const normalized: Party[] = arr.map((p: any, idx: number) => ({
          id: String(p.id ?? p._id ?? p.partyId ?? `no-id-${idx}`),
          name: p.name ?? p.fullName ?? p.party_name ?? "Unnamed",
          phone: p.phone ?? p.contact ?? p.mobile ?? "—",
          address: p.address ?? p.addr ?? p.location ?? "",
          dob: p.dob ?? p.dateOfBirth ?? null,
          ...p,
        }));

        if (mounted) setParties(normalized);
      } catch (err: any) {
        console.error("Error fetching parties:", err);
        if (mounted) {
          setError(err?.message ?? "Failed to load parties");
          setParties([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchParties();
    return () => {
      mounted = false;
    };
  }, []);

  // derived filtered + sorted
  const visible = useMemo(() => {
    const lower = q.trim().toLowerCase();
    let arr = parties.filter((p) => {
      if (!lower) return true;
      return (
        (p.name ?? "").toString().toLowerCase().includes(lower) ||
        (p.phone ?? "").toString().toLowerCase().includes(lower) ||
        (p.address ?? "").toString().toLowerCase().includes(lower)
      );
    });

    arr = arr.sort((a, b) => {
      const A = (a[sortBy] ?? "").toString().toLowerCase();
      const B = (b[sortBy] ?? "").toString().toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [parties, q, sortBy, sortDir]);

  // small toast helper
  function pushToast(type: "success" | "error", text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }

  // CSV export
  function exportCSV() {
    const header = ["Name", "Phone", "Address", "DOB"];
    const rows = visible.map((p) => [p.name ?? "", p.phone ?? "", p.address ?? "", p.dob ?? ""]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const b = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parties_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast("success", "CSV downloaded");
  }

  // safe helpers to read body (try json then text)
  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  async function safeText(res: Response) {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }

  // try multiple endpoints (primary list) until we find ok
  async function tryEndpoints(endpoints: { url: string; options?: RequestInit; desc?: string }[]) {
    let lastErr: string | null = null;

    for (const ep of endpoints) {
      try {
        const url = ep.url.startsWith("http") ? ep.url : getBase() + ep.url;
        const opts: RequestInit = { ...(ep.options || {}), credentials: "include" };

        console.debug(`[parties] trying: ${ep.desc ?? "-"} -> ${url}`, opts);
        const res = await fetch(url, opts);
        const bodyText = await safeText(res).catch(() => "");
        let bodyJson: any = null;
        try {
          bodyJson = bodyText ? JSON.parse(bodyText) : null;
        } catch { /* ignore parse error */ }

        console.debug(`[parties] result for ${url}: status=${res.status}`, { desc: ep.desc, bodyText, bodyJson });

        if (res.ok) {
          return { res, bodyText, bodyJson };
        }

        lastErr = bodyJson?.error ?? bodyJson?.message ?? bodyText ?? `HTTP ${res.status}`;
      } catch (err: any) {
        console.warn(`[parties] network error for ${ep.url}`, err);
        lastErr = err?.message ?? String(err);
      }
    }

    throw new Error(`All endpoints failed${lastErr ? ` — last error: ${lastErr}` : ""}`);
  }

  // handle delete with many fallbacks
  async function handleDelete(id: string) {
    const ok = confirm("Delete this party? This cannot be undone.");
    if (!ok) return;

    try {
      const base = getBase();
      const endpoints = [
        { url: `${base}/api/parties/${encodeURIComponent(id)}`, options: { method: "DELETE" }, desc: "DELETE /api/parties/:id" },
        { url: `${base}/api/parties`, options: { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }, desc: "DELETE /api/parties (body)" },
        { url: `${base}/api/parties/delete`, options: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }, desc: "POST /api/parties/delete" },
        { url: `${base}/api/parties/remove`, options: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }, desc: "POST /api/parties/remove" },
      ];

      const { res, bodyText, bodyJson } = await tryEndpoints(endpoints);
      if (!res.ok) {
        const msg = bodyJson?.error ?? bodyJson?.message ?? bodyText ?? `Delete failed (${res.status})`;
        throw new Error(msg);
      }

      setParties((p) => p.filter((x) => x.id !== id));
      pushToast("success", "Deleted");
    } catch (err: any) {
      console.error("Delete failed:", err);
      pushToast("error", err?.message ?? "Delete failed");
    }
  }

  // open add modal
  function openAdd() {
    setEditing({ id: "new", name: "", phone: "", address: "", dob: "" });
    setModalOpen(true);
  }

  // open edit modal (use clone to avoid accidental mutation)
  function openEdit(p: Party) {
    setEditing(JSON.parse(JSON.stringify(p)));
    setModalOpen(true);
  }

  // save (create or update) with many fallbacks
  async function handleSave(payload: Party) {
    setSaving(true);
    try {
      const cleanPayload = {
        id: payload.id,
        name: payload.name ?? "",
        phone: payload.phone ?? "",
        address: payload.address ?? "",
        dob: payload.dob ?? null,
      };

      const base = getBase();

      // CREATE
      if (payload.id === "new") {
        const res = await fetch(`${base}/api/parties`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
          credentials: "include",
        });
        const bodyText = await safeText(res);
        const bodyJson = await safeJson(res);
        console.debug("POST /api/parties ->", res.status, { bodyText, bodyJson });

        if (!res.ok) {
          const msg = bodyJson?.error ?? bodyJson?.message ?? bodyText ?? `Save failed (${res.status})`;
          throw new Error(msg);
        }

        let created: any = null;
        if (bodyJson && typeof bodyJson === "object") {
          created = (bodyJson as any).party ?? (bodyJson as any).data ?? bodyJson;
        } else if (bodyText) {
          try {
            const parsed = JSON.parse(bodyText);
            created = (parsed as any).party ?? (parsed as any).data ?? parsed;
          } catch {
            created = null;
          }
        }

        if (!created) created = { ...cleanPayload };
        if (!created.id) created.id = String(created._id ?? created.id ?? `p-${Date.now()}`);
        setParties((p) => [created, ...p]);
        pushToast("success", "Added");
        setModalOpen(false);
        setEditing(null);
        return;
      }

      // UPDATE: try common endpoints
      // 1) PUT /api/parties/:id
      try {
        const url = `${base}/api/parties/${encodeURIComponent(payload.id)}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
          credentials: "include",
        });
        const bodyText = await safeText(res);
        const bodyJson = await safeJson(res);
        console.debug("PUT /api/parties/:id ->", res.status, { bodyText, bodyJson });
        if (res.ok) {
          const updated = (bodyJson && typeof bodyJson === "object") ? (bodyJson.party ?? bodyJson.data ?? bodyJson.updated ?? bodyJson) : (bodyText ? JSON.parse(bodyText || "{}") : null);
          if (updated && updated.id) setParties((p) => p.map((x) => (x.id === payload.id ? updated : x)));
          else setParties((p) => p.map((x) => (x.id === payload.id ? { ...x, ...cleanPayload } : x)));
          pushToast("success", "Updated");
          setModalOpen(false);
          setEditing(null);
          return;
        }
        console.debug("PUT /api/parties/:id not ok, continuing", { status: res.status });
      } catch (err) {
        console.warn("PUT /api/parties/:id failed:", err);
      }

      // 2) PUT /api/parties (body)
      try {
        const url = `${base}/api/parties`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
          credentials: "include",
        });
        const bodyText = await safeText(res);
        const bodyJson = await safeJson(res);
        console.debug("PUT /api/parties (body) ->", res.status, { bodyText, bodyJson });
        if (res.ok) {
          const updated = (bodyJson && typeof bodyJson === "object") ? (bodyJson.party ?? bodyJson.data ?? bodyJson.updated ?? bodyJson) : (bodyText ? JSON.parse(bodyText || "{}") : null);
          if (updated && updated.id) setParties((p) => p.map((x) => (x.id === payload.id ? updated : x)));
          else setParties((p) => p.map((x) => (x.id === payload.id ? { ...x, ...cleanPayload } : x)));
          pushToast("success", "Updated");
          setModalOpen(false);
          setEditing(null);
          return;
        }
        console.debug("PUT /api/parties (body) not ok, continuing", { status: res.status });
      } catch (err) {
        console.warn("PUT /api/parties (body) failed:", err);
      }

      // 3) POST /api/parties/update
      try {
        const url = `${base}/api/parties/update`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
          credentials: "include",
        });
        const bodyText = await safeText(res);
        const bodyJson = await safeJson(res);
        console.debug("POST /api/parties/update ->", res.status, { bodyText, bodyJson });
        if (res.ok) {
          const updated = (bodyJson && typeof bodyJson === "object") ? (bodyJson.party ?? bodyJson.data ?? bodyJson.updated ?? bodyJson) : (bodyText ? JSON.parse(bodyText || "{}") : null);
          if (updated && updated.id) setParties((p) => p.map((x) => (x.id === payload.id ? updated : x)));
          else setParties((p) => p.map((x) => (x.id === payload.id ? { ...x, ...cleanPayload } : x)));
          pushToast("success", "Updated");
          setModalOpen(false);
          setEditing(null);
          return;
        }
        console.debug("POST /api/parties/update not ok, continuing", { status: res.status });
      } catch (err) {
        console.warn("POST /api/parties/update failed:", err);
      }

      // 4) final fallback: POST /api/parties with id in body (upsert-style)
      try {
        const url = `${base}/api/parties`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...cleanPayload, id: payload.id }),
          credentials: "include",
        });
        const bodyText = await safeText(res);
        const bodyJson = await safeJson(res);
        console.debug("Fallback POST /api/parties (with id) ->", res.status, { bodyText, bodyJson });
        if (res.ok) {
          const updated = (bodyJson && typeof bodyJson === "object") ? (bodyJson.party ?? bodyJson.data ?? bodyJson.updated ?? bodyJson) : (bodyText ? JSON.parse(bodyText || "{}") : null);
          if (updated && updated.id) setParties((p) => p.map((x) => (x.id === payload.id ? updated : x)));
          else setParties((p) => p.map((x) => (x.id === payload.id ? { ...x, ...cleanPayload } : x)));
          pushToast("success", "Updated (fallback)");
          setModalOpen(false);
          setEditing(null);
          return;
        }
        const lastBody = bodyJson ?? bodyText ?? `HTTP ${res.status}`;
        throw new Error(`All update attempts failed — last response: ${JSON.stringify(lastBody)}`);
      } catch (err: any) {
        console.error("All update attempts failed:", err);
        throw err;
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      pushToast("error", err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // UI: loading / error
  if (loading)
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-gray-600">Loading parties…</div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="text-red-600 font-medium mb-4">Error: {error}</div>
        <p className="text-sm text-slate-600">Check console for response details from /api/parties.</p>
      </div>
    );

  return (
    // added top padding so page content sits below a fixed header
    <div className="px-4 py-6 max-w-6xl mx-auto pt-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">🧾 Party List</h1>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / phone / address"
              className="px-3 py-2 border rounded-lg w-56"
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 border rounded-lg">
              <option value="name">Sort: Name</option>
              <option value="phone">Sort: Phone</option>
              <option value="dob">Sort: DOB</option>
            </select>
            <button
              onClick={() => setSortDir((s) => (s === "asc" ? "desc" : "asc"))}
              className="px-3 py-2 border rounded-lg"
              title="Toggle sort direction"
            >
              {sortDir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={openAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg">➕ Add</button>
            <button onClick={exportCSV} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Export CSV</button>
            <Link href="/parties/add" className="px-4 py-2 border rounded-lg hidden md:inline-flex items-center">Add Page</Link>
          </div>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {visible.length === 0 && (
          <div className="p-3 bg-yellow-50 border rounded">No parties found.</div>
        )}
        {visible.map((p) => (
          <div key={p.id} className="bg-white border rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-semibold text-gray-800">{p.name}</div>
                <div className="text-sm text-gray-500">{p.phone}</div>
                {p.address && <div className="text-sm text-gray-600 mt-2">{p.address}</div>}
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="text-xs text-gray-400">{formatDate(p.dob)}</div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="px-3 py-1 border rounded text-sm">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
              <th className="py-3 px-4 text-left text-sm font-medium">Phone</th>
              <th className="py-3 px-4 text-left text-sm font-medium">Address</th>
              <th className="py-3 px-4 text-left text-sm font-medium">DOB</th>
              <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-gray-500">No parties found.</td>
              </tr>
            )}
            {visible.map((p) => (
              <tr key={p.id} className="border-t last:border-b">
                <td className="py-3 px-4 align-top">{p.name}</td>
                <td className="py-3 px-4 align-top">{p.phone}</td>
                <td className="py-3 px-4 align-top">{p.address || "—"}</td>
                <td className="py-3 px-4 align-top">{formatDate(p.dob)}</td>
                <td className="py-3 px-4 align-top text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => openEdit(p)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 bottom-4 px-4 py-2 rounded shadow-lg z-50 ${
            toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Modal (simple) */}
      {modalOpen && editing && (
        <Modal onClose={() => { setModalOpen(false); setEditing(null); }}>
          <PartyForm
            initial={editing}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
            onSave={handleSave}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

/* ----- Modal + PartyForm components (local) ----- */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // changed alignment so modal content starts below any fixed header (items-start + top padding)
  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-24">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-4">
        {children}
      </div>
    </div>
  );
}
function PartyForm({ initial, onCancel, onSave, saving }: {
  initial: Party;
  onCancel: () => void;
  onSave: (p: Party) => Promise<void>;
  saving: boolean;
}) {
  // sanitize helper: force empty string for null/undefined
  const clean = (v: any) => (v === null || v === undefined ? "" : v);

  // initial form state always uses strings for inputs
  const [form, setForm] = useState<Party>({
    id: initial.id,
    name: clean(initial.name),
    phone: clean(initial.phone),
    address: clean(initial.address),
    dob: clean(initial.dob),
  });

  // keep form in sync when initial changes (deep clone)
  useEffect(() => {
    setForm({
      id: initial.id,
      name: clean(initial.name),
      phone: clean(initial.phone),
      address: clean(initial.address),
      dob: clean(initial.dob),
    });
  }, [initial]);

  // Reset clears fields (user asked reset = wipe)
  function handleReset() {
    setForm({ id: initial.id === "new" ? "new" : initial.id, name: "", phone: "", address: "", dob: "" });
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        // ensure we pass the expected types back (dob as string or empty)
        await onSave(form);
      }}
      className="space-y-3"
    >
      <h3 className="text-lg font-semibold">{initial.id === "new" ? "Add Party" : "Edit Party"}</h3>

      <div>
        <label className="text-sm font-medium">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="mt-1 w-full px-3 py-2 border rounded"
        />
      </div>
<div>
        <label className="text-sm font-medium">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
          className="mt-1 w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="mt-1 w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Date of Birth</label>
          <input
            value={form.dob ?? ""}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            placeholder="YYYY-MM-DD"
            className="mt-1 w-full px-3 py-2 border rounded"
          />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={handleReset} className="px-3 py-2 border rounded">Reset</button>
        <button type="button" onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
