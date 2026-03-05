"use client";

import { useState } from "react";
import { Package, Search, Plus, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";

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
    switch(status) {
      case "in-stock": return { color: "#10B981", background: "rgba(16,185,129,0.1)" };
      case "low-stock": return { color: "#F59E0B", background: "rgba(245,158,11,0.1)" };
      case "out-of-stock": return { color: "#EF4444", background: "rgba(239,68,68,0.1)" };
      default: return { color: "#6B7280", background: "rgba(107,114,128,0.1)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#F1F0EC", letterSpacing: "-1px" }}>
            Inventory Management
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#4A5568", marginTop: "4px" }}>
            Track and manage your restaurant inventory in real-time.
          </p>
        </div>
        <button style={{
          background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
        }}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(16,185,129,0.1)", color: "#10B981",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F1F0EC" }}>470</div>
              <div style={{ fontSize: "0.75rem", color: "#4A5568" }}>Total Items</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(245,158,11,0.1)", color: "#F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Filter size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F1F0EC" }}>2</div>
              <div style={{ fontSize: "0.75rem", color: "#4A5568" }}>Low Stock</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Download size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F1F0EC" }}>5</div>
              <div style={{ fontSize: "0.75rem", color: "#4A5568" }}>Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "300px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }} />
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#F1F0EC",
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
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            color: "#F1F0EC",
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
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        overflow: "hidden",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Item Name</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Category</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Current Stock</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Min Stock</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Status</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "16px", color: "#F1F0EC", fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: "16px", color: "#6B7280" }}>{item.category}</td>
                  <td style={{ padding: "16px", color: "#F1F0EC" }}>{item.stock} {item.unit}</td>
                  <td style={{ padding: "16px", color: "#6B7280" }}>{item.minStock} {item.unit}</td>
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
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button style={{
                        background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                        border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer"
                      }}>
                        <Eye size={16} />
                      </button>
                      <button style={{
                        background: "rgba(245,158,11,0.1)", color: "#F59E0B",
                        border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer"
                      }}>
                        <Edit size={16} />
                      </button>
                      <button style={{
                        background: "rgba(239,68,68,0.1)", color: "#EF4444",
                        border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer"
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
