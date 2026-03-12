"use client";

import { useState } from "react";
import { Package, Search, Plus, Filter, Download, Eye, Edit, Trash2, FileText } from "lucide-react";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const inventoryItems = [
    { id: 1, name: "Burger Patty", category: "Meat", stock: 150, unit: "pcs", minStock: 50, status: "in-stock" },
    { id: 2, name: "Cheese Slices", category: "Dairy", stock: 25, unit: "pcs", minStock: 100, status: "low-stock" },
    { id: 3, name: "Tomato", category: "Vegetables", stock: 80, unit: "kg", minStock: 30, status: "in-stock" },
    { id: 4, name: "Lettuce", category: "Vegetables", stock: 15, unit: "kg", minStock: 20, status: "low-stock" },
    { id: 5, name: "Burger Buns", category: "Bakery", stock: 200, unit: "pcs", minStock: 100, status: "in-stock" },
  ];

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "all" || item.category === selectedCategory)
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "in-stock": return { color: "rgb(16 185 129)", background: "rgba(16, 185, 129, 0.1)" };
      case "low-stock": return { color: "rgb(245 158 11)", background: "rgba(245, 158, 11, 0.1)" };
      case "out-of-stock": return { color: "rgb(244 63 94)", background: "rgba(244, 63, 94, 0.1)" };
      default: return { color: "var(--kravy-text-muted)", background: "var(--kravy-bg-2)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>
            Inventory Management
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", marginTop: "4px" }}>
            Track and manage your restaurant inventory in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              const res = await fetch("/api/inventory/export");
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Kravy_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              } else {
                alert("Export failed");
              }
            }}
            style={{
              background: "var(--kravy-surface)",
              color: "#10B981",
              border: "1px solid var(--kravy-border)",
              padding: "12px 24px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "var(--kravy-card-shadow)"
            }}
          >
            <FileText size={18} /> Export Excel
          </button>
          <button style={{
            background: "var(--kravy-brand)",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "14px",
            fontWeight: 800,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 20px rgba(79, 70, 229, 0.2)"
          }}>
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "var(--kravy-card-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.1)", color: "rgb(16 185 129)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--kravy-text-primary)", lineHeight: 1 }}>470</div>
              <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontWeight: 600, marginTop: "4px" }}>Total Items</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "var(--kravy-card-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: "rgba(245, 158, 11, 0.1)", color: "rgb(245 158 11)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Filter size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--kravy-text-primary)", lineHeight: 1 }}>2</div>
              <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontWeight: 600, marginTop: "4px" }}>Low Stock</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "var(--kravy-card-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: "rgba(99, 102, 241, 0.1)", color: "rgb(99 102 241)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Download size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--kravy-text-primary)", lineHeight: 1 }}>5</div>
              <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontWeight: 600, marginTop: "4px" }}>Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "300px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--kravy-text-muted)" }} />
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              background: "var(--kravy-input-bg)",
              border: "1px solid var(--kravy-input-border)",
              borderRadius: "12px",
              color: "var(--kravy-text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "12px 16px",
            background: "var(--kravy-input-bg)",
            border: "1px solid var(--kravy-input-border)",
            borderRadius: "12px",
            color: "var(--kravy-text-primary)",
            fontSize: "0.9rem",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="all">All Categories</option>
          <option value="Meat">Meat</option>
          <option value="Dairy">Dairy</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Bakery">Bakery</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: "var(--kravy-surface)",
        border: "1px solid var(--kravy-border)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "var(--kravy-card-shadow)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--kravy-table-header)" }}>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Item Name</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Category</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Current Stock</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Min Stock</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Status</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid var(--kravy-border)" }}>
                  <td style={{ padding: "16px", color: "var(--kravy-text-primary)", fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: "16px", color: "var(--kravy-text-muted)" }}>{item.category}</td>
                  <td style={{ padding: "16px", color: "var(--kravy-text-primary)" }}>{item.stock} {item.unit}</td>
                  <td style={{ padding: "16px", color: "var(--kravy-text-muted)" }}>{item.minStock} {item.unit}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: getStatusStyle(item.status).color,
                      backgroundColor: getStatusStyle(item.status).background
                    }}>
                      {item.status === "in-stock" ? "In Stock" : item.status === "low-stock" ? "Low Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td style={{ padding: "16px text-right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button style={{
                        background: "rgba(99, 102, 241, 0.1)", color: "rgb(99 102 241)",
                        border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer",
                        transition: "all 0.2s"
                      }}>
                        <Eye size={16} />
                      </button>
                      <button style={{
                        background: "rgba(245, 158, 11, 0.1)", color: "rgb(245 158 11)",
                        border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer",
                        transition: "all 0.2s"
                      }}>
                        <Edit size={16} />
                      </button>
                      <button style={{
                        background: "rgba(244, 63, 94, 0.1)", color: "rgb(244 63 94)",
                        border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer",
                        transition: "all 0.2s"
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
