"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthContext";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  QrCode, Plus, Trash2, Download, Copy, Eye,
  Table as TableIcon, Search, RefreshCw, X, Edit, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { kravy } from "@/lib/sounds";

interface TableRecord {
  id: string;
  name: string;
  zone: string;
  qrUrl?: string;
}

export default function TablesPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newZone, setNewZone] = useState("Default");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewTable, setPreviewTable] = useState<TableRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [multiZoneEnabled, setMultiZoneEnabled] = useState(false);
  const [editingTable, setEditingTable] = useState<TableRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editZone, setEditZone] = useState("");
  const [search, setSearch] = useState("");

  const getBase = () => (typeof window !== "undefined" ? window.location.origin : "");

  const generateTableUrl = (id: string, name: string) =>
    `${getBase()}/menu/${user?.businessId || user?.id}?tableId=${encodeURIComponent(id)}&tableName=${encodeURIComponent(name)}`;

  const [availableZones, setAvailableZones] = useState<string[]>(["Default"]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const [tableRes, profileRes, itemsRes] = await Promise.all([
        fetch(`${getBase()}/api/tables`),
        fetch(`${getBase()}/api/profile`),
        fetch(`${getBase()}/api/menu/items`)
      ]);
      
      if (!tableRes.ok) throw new Error("could not load tables");
      const data: TableRecord[] = await tableRes.json();
      setTables(data);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile) {
          setMultiZoneEnabled(profile.multiZoneMenuEnabled);
        }
      }

      // Extract unique zones from tables AND items
      const tableZones = data.map(t => t.zone).filter(Boolean);
      let itemZones: string[] = [];
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        if (Array.isArray(itemsData)) {
          itemsData.forEach(item => {
            if (Array.isArray(item.zones)) {
              itemZones.push(...item.zones);
            }
          });
        }
      }
      
      const allUniqueZones = Array.from(new Set([...tableZones, ...itemZones, "Default", "AC", "Non AC"]));
      setAvailableZones(allUniqueZones.sort());

    } catch (e) {
      console.error(e);
      kravy.error();
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const createTable = async () => {
    if (!newName.trim() || isCreating) { 
      if (!newName.trim()) { kravy.error(); toast.error("Please enter a table name"); }
      return; 
    }
    
    setIsCreating(true);
    try {
      const res = await fetch(`/api/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), zone: newZone }),
      });
      if (!res.ok) throw new Error(await res.text());
      const t: TableRecord = await res.json();
      setTables((prev) => {
        if (prev.some(table => table.id === t.id)) return prev;
        return [...prev, t];
      });
      setNewName("");
      kravy.success();
      toast.success(`Table "${t.name}" created!`);
    } catch (err) {
      console.error(err);
      kravy.error();
      toast.error("Failed to create table");
    } finally {
      setIsCreating(false);
    }
  };

  const updateTable = async () => {
    if (!editingTable || !editName.trim()) return;
    try {
      const res = await fetch(`/api/tables`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTable.id, name: editName.trim(), zone: editZone }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTable(null);
      kravy.success();
      toast.success("Table updated");
    } catch (err) {
      console.error(err);
      kravy.error();
      toast.error("Update failed");
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const res = await fetch(`/api/tables?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setTables((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      kravy.success();
      toast.success("Table deleted");
    } catch (err) {
      console.error(err);
      kravy.error();
      toast.error("Failed to delete table");
    }
  };

  const copyTableUrl = (id: string, name: string) => {
    const url = generateTableUrl(id, name);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    kravy.success();
    toast.success("Link copied!");
  };

  const downloadTableQR = (table: TableRecord) => {
    const qrRef = document.querySelector(`#qr-${table.id} svg`) as SVGElement;
    if (!qrRef) return;
    const svgData = new XMLSerializer().serializeToString(qrRef);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1F2937";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Scan to Order", canvas.width / 2, 40);
      ctx.fillStyle = "#4F46E5";
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Table: ${table.name}`, canvas.width / 2, 70);
      const qrSize = 260;
      const qrX = (canvas.width - qrSize) / 2;
      ctx.drawImage(img, qrX, 90, qrSize, qrSize);
      ctx.fillStyle = "#6B7280";
      ctx.font = "14px Arial";
      ctx.fillText("Place this QR on your table", canvas.width / 2, 380);
      const pngFile = canvas.toDataURL("image/png");
      const dl = document.createElement("a");
      dl.download = `QR_Table_${table.name}.png`;
      dl.href = pngFile;
      dl.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  useEffect(() => { if (user) fetchTables(); }, [user]);

  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--kravy-bg)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--kravy-brand)]/20 border-t-[var(--kravy-brand)] animate-spin" />
        <p className="text-sm font-bold text-[var(--kravy-text-muted)]">Loading…</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-rose-500 font-bold">Please log in to manage tables</p>
    </div>
  );

  return (
    <div className="min-h-full bg-[var(--kravy-bg)] pb-16">

      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
      <div className="bg-[var(--kravy-surface)] border-b border-[var(--kravy-border)] px-4 sm:px-6 lg:px-8 py-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icon badge */}
            <div className="w-12 h-12 rounded-2xl bg-[var(--kravy-brand)] flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <TableIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight leading-tight">
                Table Management
              </h1>
              <p className="text-xs sm:text-sm text-[var(--kravy-text-muted)] font-medium mt-0.5">
                Create tables &amp; generate QR codes for digital menu ordering
              </p>
            </div>
          </div>

          {/* Stats pill */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--kravy-brand)]/8 border border-[var(--kravy-brand)]/15 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black text-[var(--kravy-text-primary)]">{tables.length}</span>
              <span className="text-xs font-bold text-[var(--kravy-text-muted)]">Tables Active</span>
            </div>
            <button
              onClick={fetchTables}
              disabled={loading}
              className="w-9 h-9 rounded-xl border border-[var(--kravy-border)] bg-[var(--kravy-bg)]
                flex items-center justify-center text-[var(--kravy-text-muted)]
                hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)] transition-all
                disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ══════════════════════════════════════
            ADD TABLE FORM
        ══════════════════════════════════════ */}
        <div className="bg-[var(--kravy-surface)] rounded-2xl border border-[var(--kravy-border)] overflow-hidden shadow-sm">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg)]/40
            flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--kravy-brand)]/10 flex items-center justify-center">
              <Plus size={14} className="text-[var(--kravy-brand)]" />
            </div>
            <span className="text-sm font-black text-[var(--kravy-text-primary)]">Add New Table</span>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <TableIcon
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Table name — e.g. T-01, VIP-1, Balcony, Rooftop…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createTable(); }}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                      text-[var(--kravy-text-primary)] rounded-xl text-sm font-medium outline-none
                      focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)]
                      transition-all placeholder:text-[var(--kravy-text-muted)]"
                  />
                </div>
                {multiZoneEnabled && (
                  <div className="relative w-full sm:w-48">
                    <Layers
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]"
                    />
                    <input
                      type="text"
                      list="zones-list"
                      placeholder="Zone (e.g. Rooftop)"
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                        text-[var(--kravy-text-primary)] rounded-xl text-sm font-medium outline-none
                        focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)]
                        transition-all placeholder:text-[var(--kravy-text-muted)]"
                    />
                    <datalist id="zones-list">
                      {availableZones.map(z => (
                        <option key={z} value={z} />
                      ))}
                    </datalist>
                  </div>
                )}
                <button
                  onClick={createTable}
                  disabled={isCreating}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    bg-[var(--kravy-brand)] text-white font-black text-sm
                    hover:bg-indigo-700 active:scale-[0.97]
                    shadow-md shadow-indigo-500/25 transition-all
                    whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                >
                  {isCreating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isCreating ? "Creating..." : "Add Table"}
                </button>
              </div>
            </div>

            {/* Quick tips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {["T-01", "VIP-1", "Rooftop", "Balcony", "Window-1"].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setNewName(tip)}
                  className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                    bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                    text-[var(--kravy-text-muted)] hover:border-[var(--kravy-brand)]
                    hover:text-[var(--kravy-brand)] transition-all"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            SEARCH BAR (only if tables exist)
        ══════════════════════════════════════ */}
        {tables.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]" />
              <input
                type="text"
                placeholder="Search tables…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-[var(--kravy-surface)] border border-[var(--kravy-border)]
                  text-[var(--kravy-text-primary)] rounded-xl text-sm font-medium outline-none
                  focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)]
                  transition-all placeholder:text-[var(--kravy-text-muted)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <p className="text-xs font-bold text-[var(--kravy-text-muted)]">
              Showing {filtered.length} of {tables.length} tables
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════
            LOADING STATE
        ══════════════════════════════════════ */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-[var(--kravy-brand)]/20 border-t-[var(--kravy-brand)] animate-spin" />
            <p className="text-sm font-bold text-[var(--kravy-text-muted)] animate-pulse">Loading tables…</p>
          </div>
        )}

        {/* ══════════════════════════════════════
            EMPTY STATE
        ══════════════════════════════════════ */}
        {!loading && tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center
            bg-[var(--kravy-surface)] rounded-2xl border border-dashed border-[var(--kravy-border)]">
            <div className="w-20 h-20 rounded-3xl bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
              flex items-center justify-center mb-5 shadow-inner">
              <TableIcon size={32} className="text-[var(--kravy-text-muted)] opacity-40" />
            </div>
            <p className="font-black text-[var(--kravy-text-primary)] text-lg mb-2">No tables yet</p>
            <p className="text-sm text-[var(--kravy-text-muted)] max-w-xs">
              Add your first table above to generate a QR code for ordering
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════
            TABLES GRID
        ══════════════════════════════════════ */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {filtered.map((table, idx) => (
              <div
                key={table.id}
                className="group bg-[var(--kravy-surface)] rounded-2xl border border-[var(--kravy-border)]
                  overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--kravy-brand)]/40
                  transition-all duration-300 hover:-translate-y-1 flex flex-col"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Card top strip */}
                <div className="h-1.5 bg-gradient-to-r from-[var(--kravy-brand)] to-indigo-400 opacity-60
                  group-hover:opacity-100 transition-opacity" />

                {/* Table name + number */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--kravy-border)]">
                  <div>
                    <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-0.5">
                      Table
                    </p>
                    <h3 className="text-lg font-black text-[var(--kravy-text-primary)] tracking-tight leading-none">
                      {table.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-9 h-9 rounded-xl bg-[var(--kravy-brand)]/8 border border-[var(--kravy-brand)]/15
                      flex items-center justify-center flex-shrink-0">
                      <QrCode size={16} className="text-[var(--kravy-brand)]" />
                    </div>
                    {multiZoneEnabled && table.zone && (
                      <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                        {table.zone}
                      </span>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex-1 flex items-center justify-center p-5">
                  <div
                    id={`qr-${table.id}`}
                    className="bg-white p-4 rounded-2xl shadow-md border border-gray-100
                      group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-300"
                  >
                    <QRCode
                      value={generateTableUrl(table.id, table.name)}
                      size={140}
                      style={{ display: "block" }}
                    />
                  </div>
                </div>

                {/* URL preview */}
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-[var(--kravy-text-muted)] font-mono truncate
                    bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-lg px-2.5 py-1.5">
                    {generateTableUrl(table.id, table.name).replace("https://", "").slice(0, 44)}…
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {/* Copy Link */}
                  <button
                    onClick={() => copyTableUrl(table.id, table.name)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                      border font-black text-xs transition-all
                      ${copiedId === table.id
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)]"
                      }`}
                  >
                    <Copy size={12} />
                    {copiedId === table.id ? "Copied!" : "Copy Link"}
                  </button>

                  {/* Download QR */}
                  <button
                    onClick={() => downloadTableQR(table)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                      border border-[var(--kravy-border)] bg-[var(--kravy-bg)]
                      text-[var(--kravy-text-secondary)] font-black text-xs
                      hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)] transition-all"
                  >
                    <Download size={12} />
                    Download
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditingTable(table);
                      setEditName(table.name);
                      setEditZone(table.zone || "Default");
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                      bg-[var(--kravy-brand)]/8 border border-[var(--kravy-brand)]/20
                      text-[var(--kravy-brand)] font-black text-xs
                      hover:bg-[var(--kravy-brand)] hover:text-white transition-all"
                  >
                    <Edit size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => window.open(generateTableUrl(table.id, table.name), "_blank")}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                      border border-[var(--kravy-border)] bg-[var(--kravy-bg)]
                      text-[var(--kravy-text-secondary)] font-black text-xs
                      hover:bg-[var(--kravy-brand)] hover:text-white transition-all"
                  >
                    <Eye size={12} />
                    Preview
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteConfirmId(table.id)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                      bg-rose-500/8 border border-rose-500/20 text-rose-500 font-black text-xs
                      hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* "Add Table" ghost card */}
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="Table name"]')?.focus()}
              className="group min-h-[320px] rounded-2xl border-2 border-dashed border-[var(--kravy-border)]
                bg-[var(--kravy-bg)] flex flex-col items-center justify-center gap-3
                hover:border-[var(--kravy-brand)]/50 hover:bg-[var(--kravy-brand)]/3 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[var(--kravy-border)]
                group-hover:border-[var(--kravy-brand)]/50 group-hover:bg-[var(--kravy-brand)]/5
                flex items-center justify-center transition-all">
                <Plus size={20} className="text-[var(--kravy-text-muted)] group-hover:text-[var(--kravy-brand)] transition-colors" />
              </div>
              <p className="text-xs font-black text-[var(--kravy-text-muted)] group-hover:text-[var(--kravy-brand)] transition-colors uppercase tracking-wider">
                Add Table
              </p>
            </button>
          </div>
        )}

        {/* Search no results */}
        {!loading && tables.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={32} className="text-[var(--kravy-text-muted)] opacity-30 mb-3" />
            <p className="font-bold text-[var(--kravy-text-primary)]">No tables match "{search}"</p>
            <button onClick={() => setSearch("")} className="text-sm text-[var(--kravy-brand)] font-bold mt-2 hover:underline">
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          EDIT TABLE MODAL
      ══════════════════════════════════════ */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingTable(null)} />
          <div className="relative w-full max-w-md bg-[var(--kravy-surface)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[var(--kravy-border)] flex items-center justify-between bg-[var(--kravy-bg)]/40">
              <div className="flex items-center gap-2">
                <Edit size={16} className="text-[var(--kravy-brand)]" />
                <span className="text-sm font-black text-[var(--kravy-text-primary)]">Edit Table</span>
              </div>
              <button onClick={() => setEditingTable(null)} className="text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)]">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Table Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-xl text-sm font-bold text-[var(--kravy-text-primary)] outline-none focus:border-[var(--kravy-brand)] transition-all"
                />
              </div>
              {multiZoneEnabled && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Zone</label>
                  <input
                    type="text"
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-xl text-sm font-bold text-[var(--kravy-text-primary)] outline-none focus:border-[var(--kravy-brand)] transition-all"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingTable(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] font-black text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={updateTable}
                  className="flex-1 py-3.5 rounded-2xl bg-[var(--kravy-brand)] text-white font-black text-sm shadow-lg shadow-indigo-500/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════ */}
      {deleteConfirmId && (() => {
        const table = tables.find((t) => t.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            />
            {/* Sheet */}
            <div className="relative w-full sm:max-w-sm bg-[var(--kravy-surface)]
              rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden
              animate-in slide-in-from-bottom-4 duration-300">

              {/* Mobile handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--kravy-border)]" />
              </div>

              <div className="p-6 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-100
                  flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={26} className="text-rose-500" />
                </div>

                <h3 className="text-xl font-black text-[var(--kravy-text-primary)] mb-2">
                  Delete Table?
                </h3>
                <p className="text-sm text-[var(--kravy-text-muted)] font-medium leading-relaxed mb-5">
                  Table <span className="font-black text-[var(--kravy-text-primary)]">"{table?.name}"</span> aur uska QR code permanently delete ho jaayega.
                  Yeh action undo nahi ho sakti.
                </p>

                {/* Table preview chip */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--kravy-bg)]
                  border border-[var(--kravy-border)] rounded-xl mb-6">
                  <QrCode size={14} className="text-[var(--kravy-text-muted)]" />
                  <span className="font-black text-sm text-[var(--kravy-text-primary)]">{table?.name}</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => deleteTable(deleteConfirmId)}
                    className="w-full py-3.5 rounded-2xl
                      bg-gradient-to-r from-rose-600 to-rose-500
                      text-white font-black text-sm
                      shadow-lg shadow-rose-500/30
                      hover:-translate-y-0.5 hover:shadow-rose-500/40
                      active:scale-[0.98] transition-all
                      flex items-center justify-center gap-2"
                  >
                    <Trash2 size={15} /> Haan, Delete Karo
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="w-full py-3.5 rounded-2xl bg-[var(--kravy-bg)]
                      border border-[var(--kravy-border)]
                      text-[var(--kravy-text-secondary)] font-black text-sm
                      hover:bg-[var(--kravy-surface-hover)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}