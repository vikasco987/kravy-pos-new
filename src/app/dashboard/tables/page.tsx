"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { QrCode, Plus, Trash2, Download, Copy, Eye, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableRecord {
  id: string;
  name: string;
  qrUrl?: string;
}

export default function TablesPage() {
  const { user, isLoaded } = useUser();
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");

  const getBase = () => (typeof window !== "undefined" ? window.location.origin : "");

  const generateTableUrl = (id: string, name: string) => {
    return `${getBase()}/menu/${user?.id}?tableId=${encodeURIComponent(id)}&tableName=${encodeURIComponent(name)}`;
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBase()}/api/tables`);
      if (!res.ok) throw new Error("could not load");
      const data: TableRecord[] = await res.json();
      setTables(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a table name");
      return;
    }
    try {
      const res = await fetch(`/api/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const t: TableRecord = await res.json();
      setTables((prev) => [...prev, t]);
      setNewName("");
      toast.success(`Table "${newName}" created successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create table");
    }
  };

  const deleteTable = async (id: string) => {
    const ok = confirm("Delete this table? QR code and all references will be removed.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/tables?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setTables((prev) => prev.filter((t) => t.id !== id));
      toast.success("Table deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete table");
    }
  };

  const copyTableUrl = (id: string, name: string) => {
    const url = generateTableUrl(id, name);
    navigator.clipboard.writeText(url);
    toast.success("Table URL copied!");
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
      ctx.fillStyle = "#3B82F6";
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Table: ${table.name}`, canvas.width / 2, 70);
      const qrSize = 250;
      const qrX = (canvas.width - qrSize) / 2;
      ctx.drawImage(img, qrX, 90, qrSize, qrSize);
      ctx.fillStyle = "#6B7280";
      ctx.font = "14px Arial";
      ctx.fillText("Place this QR on your table", canvas.width / 2, 360);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Table_${table.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  useEffect(() => {
    if (user) fetchTables();
  }, [user]);

  if (!isLoaded) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6 text-red-500">Not signed in</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] tracking-tight">Table Management</h1>
          <p className="text-[var(--kravy-text-muted)] mt-1 font-medium italic">Create and manage digital menus for your restaurant tables</p>
        </div>
      </div>

      {/* Add Table Form */}
      <div className="bg-[var(--kravy-surface)] rounded-2xl border border-[var(--kravy-border)] p-8 shadow-xl">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-[var(--kravy-text-primary)]">
          <Plus className="w-5 h-5 text-[var(--kravy-brand)]" />
          Add New Table
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Table name (e.g., T-01, VIP-1, Balcony)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") createTable();
            }}
            className="flex-1 px-4 py-3 bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
          <Button onClick={createTable} className="bg-[var(--kravy-brand)] hover:bg-indigo-700 text-white font-black px-6 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Tables List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-[var(--kravy-text-muted)] animate-pulse">Scanning tables...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-[var(--kravy-bg-2)]/30 rounded-3xl border border-dashed border-[var(--kravy-border)] p-16 text-center">
          <TableIcon className="w-16 h-16 text-[var(--kravy-border)] mx-auto mb-6 opacity-50" />
          <p className="text-[var(--kravy-text-muted)] font-bold text-lg">No tables found. Add your first table above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tables.map((table) => (
            <div key={table.id} className="bg-[var(--kravy-surface)] rounded-[32px] border border-[var(--kravy-border)] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              {/* Table Name */}
              <h3 className="font-black text-2xl mb-6 text-[var(--kravy-text-primary)] tracking-tight">{table.name}</h3>

              {/* QR Code */}
              <div className="flex justify-center mb-8 bg-white p-6 rounded-2xl shadow-inner shadow-black/5" id={`qr-${table.id}`}>
                <QRCode value={generateTableUrl(table.id, table.name)} size={150} />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30 text-[var(--kravy-text-primary)] font-black uppercase tracking-widest text-[10px] rounded-xl h-11 hover:bg-[var(--kravy-surface-hover)]"
                  onClick={() => copyTableUrl(table.id, table.name)}
                >
                  <Copy className="w-4 h-4 mr-2 text-[var(--kravy-brand)]" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30 text-[var(--kravy-text-primary)] font-black uppercase tracking-widest text-[10px] rounded-xl h-11 hover:bg-[var(--kravy-surface-hover)]"
                  onClick={() => downloadTableQR(table)}
                >
                  <Download className="w-4 h-4 mr-2 text-[var(--kravy-brand)]" />
                  Download QR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30 text-[var(--kravy-text-primary)] font-black uppercase tracking-widest text-[10px] rounded-xl h-11 hover:bg-[var(--kravy-surface-hover)]"
                  onClick={() => window.open(generateTableUrl(table.id, table.name), "_blank")}
                >
                  <Eye className="w-4 h-4 mr-2 text-[var(--kravy-brand)]" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-rose-500/20 bg-rose-500/5 text-rose-500 font-black uppercase tracking-widest text-[10px] rounded-xl h-11 hover:bg-rose-500 hover:text-white transition-all mt-2"
                  onClick={() => deleteTable(table.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Table
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

