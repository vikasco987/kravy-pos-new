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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Table Management</h1>
          <p className="text-slate-500 mt-1">Create and manage QR codes for your restaurant tables</p>
        </div>
      </div>

      {/* Add Table Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Add New Table
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Table name (e.g., T-01, VIP-1, Balcony)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") createTable();
            }}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={createTable} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Tables List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500 animate-pulse">Loading tables...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
          <TableIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No tables yet. Create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Table Name */}
              <h3 className="font-bold text-lg mb-4 text-slate-900">{table.name}</h3>

              {/* QR Code */}
              <div className="flex justify-center mb-4 bg-slate-50 p-4 rounded-lg" id={`qr-${table.id}`}>
                <QRCode value={generateTableUrl(table.id, table.name)} size={120} />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => copyTableUrl(table.id, table.name)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Menu Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => downloadTableQR(table)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(generateTableUrl(table.id, table.name), "_blank")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Menu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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

