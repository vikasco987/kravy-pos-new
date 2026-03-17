"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, Plus, Filter, Download, Eye, Edit, Trash2, FileText, X, AlertTriangle, Save, Sparkles, TrendingUp, Layers, ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useSearch } from "@/components/SearchContext";

type InventoryItem = {
  id: string;
  name: string;
  category: { name: string } | null;
  categoryId: string | null;
  currentStock: number;
  reorderLevel: number;
  openingStock: number;
  unit: string;
  price: number;
  sellingPrice: number;
  barcode?: string;
};

export default function InventoryPage() {
  const { query: globalQuery } = useSearch();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock-low" | "stock-high" | "price-low" | "price-high">("name");
  const [filterMode, setFilterMode] = useState<"all" | "critical">("all");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    currentStock: 0,
    reorderLevel: 0,
    openingStock: 0,
    unit: "pcs",
    price: 0,
    sellingPrice: 0,
    barcode: "",
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchInventory();
    fetchCategories();

    const handleKravySearch = (e: any) => {
      setSearchTerm(e.detail || "");
    };
    window.addEventListener("kravy-search", handleKravySearch);
    return () => window.removeEventListener("kravy-search", handleKravySearch);
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Fetch inventory error:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId || "",
      currentStock: item.currentStock || 0,
      reorderLevel: item.reorderLevel || 0,
      openingStock: item.openingStock || 0,
      unit: item.unit || "pcs",
      price: item.price || 0,
      sellingPrice: item.sellingPrice || 0,
      barcode: item.barcode || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = "/api/items"; 
      
      const payload = editingItem 
        ? { id: editingItem.id, ...formData }
        : { ...formData };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "Updated successfully" : "Added successfully");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchInventory();
      } else {
        const err = await res.json();
        toast.error(err.error || "Save failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully");
        fetchInventory();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const getStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return "out-of-stock";
    if (item.currentStock <= item.reorderLevel) return "low-stock";
    return "in-stock";
  };

  const filteredItems = items
    .filter(item => {
      const activeQuery = searchTerm || globalQuery;
      const matchesSearch = item.name.toLowerCase().includes(activeQuery.toLowerCase()) || 
                           item.barcode?.toLowerCase().includes(activeQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
      
      const status = getStatus(item);
      const matchesStatus = filterStatus === "all" || status === filterStatus;
      const matchesCritical = filterMode === "all" || item.currentStock <= item.reorderLevel;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesCritical;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock-low") return a.currentStock - b.currentStock;
      if (sortBy === "stock-high") return b.currentStock - a.currentStock;
      if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
      return 0;
    });

  const stats = [
    { label: "Total Assets", val: items.length, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", mode: "all" },
    { label: "Critical Stock", val: items.filter(i => i.currentStock <= i.reorderLevel).length, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", mode: "critical" },
    { label: "Categories", val: categories.length, icon: Layers, color: "text-amber-500", bg: "bg-amber-500/10", mode: "all" },
    { label: "Live Value", val: `₹${Math.round(items.reduce((acc, i) => acc + (i.currentStock * i.price), 0))}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", mode: "all" },
  ];

  return (
    <div className="flex flex-col gap-6 max-h-screen overflow-hidden">
      {/* Header Hub */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight flex items-center gap-2">
            <Sparkles className="text-[var(--kravy-brand)]" size={24} />
            Inventory Hub
          </h1>
          <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-widest opacity-70">
            Real-time Asset Monitoring & Stock Control
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: "", categoryId: "", currentStock: 0, reorderLevel: 0, openingStock: 0, unit: "pcs", price: 0, sellingPrice: 0, barcode: ""
              });
              setIsModalOpen(true);
            }}
            className="h-10 px-6 bg-[var(--kravy-brand)] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg hover:shadow-[var(--kravy-brand)]/20 transition-all active:scale-95 shadow-md shadow-[var(--kravy-brand)]/10"
          >
            <Plus size={16} strokeWidth={3} /> New Record
          </button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-4 gap-3 px-1">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setFilterMode(stat.mode as any)}
            className={`cursor-pointer bg-[var(--kravy-surface)] border rounded-2xl p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-3 transition-all duration-300 ${filterMode === stat.mode && stat.mode === "critical" ? "border-rose-500 ring-2 ring-rose-500/10 shadow-rose-500/5" : "border-[var(--kravy-border)] hover:border-[var(--kravy-brand)]/30"}`}
          >
            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon size={16} />
            </div>
            <div className="truncate">
              <div className="text-lg font-black text-[var(--kravy-text-primary)] leading-tight">{stat.val}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--kravy-text-muted)] opacity-60">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Smart Filters */}
      <div className="flex flex-wrap gap-2 items-center px-1">
        <div className="relative w-72 max-w-full group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] group-focus-within:text-[var(--kravy-brand)] transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search assets or barcodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl text-xs font-bold text-[var(--kravy-text-primary)] outline-none focus:border-[var(--kravy-brand)] focus:ring-4 focus:ring-[var(--kravy-brand)]/5 transition-all h-10 shadow-sm"
          />
        </div>

        <div className="flex gap-2 items-center">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-36 pl-3 pr-8 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-primary)] cursor-pointer outline-none h-10 focus:border-[var(--kravy-brand)] transition-all shadow-sm"
            >
              <option value="all">Categories: ALL</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] pointer-events-none" size={10} />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none w-36 pl-3 pr-8 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-primary)] cursor-pointer outline-none h-10 focus:border-[var(--kravy-brand)] transition-all shadow-sm"
            >
              <option value="all">Condition: ALL</option>
              <option value="in-stock">IN STOCK</option>
              <option value="low-stock">LOW STOCK</option>
              <option value="out-of-stock">OUT OF STOCK</option>
            </select>
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] pointer-events-none" size={10} />
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none w-44 pl-3 pr-8 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-primary)] cursor-pointer outline-none h-10 focus:border-[var(--kravy-brand)] transition-all shadow-sm"
            >
              <option value="name">Sort: NAME (A-Z)</option>
              <option value="stock-low">Sort: STOCK (LOW\u2192HIGH)</option>
              <option value="stock-high">Sort: STOCK (HIGH\u2192LOW)</option>
              <option value="price-low">Sort: PRICE (LOW\u2192HIGH)</option>
              <option value="price-high">Sort: PRICE (HIGH\u2192LOW)</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] pointer-events-none" size={10} />
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedCategory !== "all" || filterStatus !== "all" || sortBy !== "name" || filterMode !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setFilterStatus("all");
                setSortBy("name");
                setFilterMode("all");
              }}
              className="h-10 px-4 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500/10 transition-all active:scale-95"
            >
              <XCircle size={12} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Dense Modern Table */}
      <motion.div 
        layout
        className="flex-1 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-3xl overflow-hidden shadow-2xl shadow-black/5 flex flex-col mb-4"
      >
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--kravy-navbar-bg)] backdrop-blur-xl border-b border-[var(--kravy-border)]">
              <tr className="bg-gradient-to-r from-[var(--kravy-brand)]/[0.03] to-transparent">
                <th className="px-5 py-4 text-left text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.2em]">Inventory Item</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.2em]">Category</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.2em]">Stock Status</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.2em]">Critical Floor</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.2em]">Valuation</th>
                <th className="px-5 py-4 text-center text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.2em]">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--kravy-border)]/50">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="h-14 px-5 bg-[var(--kravy-bg)]/30"></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package className="mx-auto text-[var(--kravy-text-faint)] mb-4 opacity-20" size={48} />
                    <div className="text-sm font-bold text-[var(--kravy-text-muted)]">No inventory records found</div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--kravy-text-faint)] mt-1">Try adjusting your filters</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStatus(item);
                  return (
                    <motion.tr 
                      layout
                      key={item.id} 
                      className="group hover:bg-[var(--kravy-brand)]/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${status === 'out-of-stock' ? 'bg-rose-500/10 text-rose-500' : 'bg-[var(--kravy-brand)]/10 text-[var(--kravy-brand)]'}`}>
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[var(--kravy-text-primary)] leading-tight">{item.name}</div>
                            <div className="text-[10px] font-bold text-[var(--kravy-text-faint)] mt-0.5">ID: {item.id.slice(-8).toUpperCase()} · {item.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-3 py-1.5 bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-lg text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-secondary)]">
                          {item.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-black text-[var(--kravy-text-primary)]">{item.currentStock ?? 0}</div>
                          <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                            status === 'out-of-stock' ? 'bg-rose-500/10 text-rose-600' : 
                            status === 'low-stock' ? 'bg-amber-500/10 text-amber-600' : 
                            'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {status.replace('-', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-[var(--kravy-text-muted)]">{item.reorderLevel}</div>
                          {item.currentStock <= item.reorderLevel && (
                            <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <div className="text-sm font-black text-[var(--kravy-text-primary)]">₹{item.sellingPrice}</div>
                          <div className="text-[10px] font-bold text-[var(--kravy-text-faint)]">Cost: ₹{item.price}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="w-8 h-8 rounded-lg bg-[var(--kravy-surface)] border border-[var(--kravy-border)] text-[var(--kravy-text-muted)] hover:text-[var(--kravy-brand)] hover:border-[var(--kravy-brand)]/50 transition-all flex items-center justify-center"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="w-8 h-8 rounded-lg bg-[var(--kravy-surface)] border border-[var(--kravy-border)] text-[var(--kravy-text-muted)] hover:text-rose-500 hover:border-rose-500/50 transition-all flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Inventory Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="px-6 py-5 border-b border-[var(--kravy-border)] flex justify-between items-center bg-gradient-to-r from-[var(--kravy-brand)]/[0.05] to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--kravy-brand)] flex items-center justify-center text-white shadow-lg shadow-[var(--kravy-brand)]/20">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[var(--kravy-text-primary)]">{editingItem ? 'Edit Asset Record' : 'Create New Asset'}</h2>
                    <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-widest leading-none mt-1">Classification & Stock Levels</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl hover:bg-[var(--kravy-bg)] flex items-center justify-center text-[var(--kravy-text-muted)] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Item Primary Name</label>
                    <input
                      required
                      className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] focus:border-[var(--kravy-brand)] outline-none transition-all shadow-inner shadow-black/5"
                      placeholder="e.g. Basmati Rice 25kg"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Classification</label>
                    <select
                      className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] outline-none focus:border-[var(--kravy-brand)] transition-all cursor-pointer shadow-inner shadow-black/5"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    >
                      <option value="">No Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                       <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Unit Type</label>
                          <select
                            className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] outline-none focus:border-[var(--kravy-brand)] transition-all cursor-pointer shadow-inner shadow-black/5"
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                          >
                            <option value="pcs">Pieces (pcs)</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="ltr">Liter (ltr)</option>
                            <option value="box">Box</option>
                            <option value="pkt">Packet</option>
                          </select>
                       </div>
                       <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Barcode</label>
                          <input
                            type="text"
                            placeholder="Scan/Type"
                            className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] focus:border-[var(--kravy-brand)] outline-none transition-all shadow-inner shadow-black/5"
                            value={formData.barcode}
                            onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Live Stock</label>
                    <input
                      type="number"
                      className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] focus:border-[var(--kravy-brand)] outline-none transition-all shadow-inner shadow-black/5"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Alert Floor</label>
                    <input
                      type="number"
                      className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] focus:border-[var(--kravy-brand)] outline-none transition-all shadow-inner shadow-black/5"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({...formData, reorderLevel: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Purchase Cost</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--kravy-text-faint)]">\u20B9</span>
                      <input
                        type="number"
                        className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl pl-8 pr-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] focus:border-[var(--kravy-brand)] outline-none transition-all shadow-inner shadow-black/5"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest px-1">Selling Value</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--kravy-text-faint)]">\u20B9</span>
                      <input
                        type="number"
                        className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl pl-8 pr-4 py-3 text-sm font-bold text-[var(--kravy-text-primary)] focus:border-[var(--kravy-brand)] outline-none transition-all shadow-inner shadow-black/5"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-[var(--kravy-bg)] text-[var(--kravy-text-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--kravy-border)]/20 transition-all border border-[var(--kravy-border)]"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-[var(--kravy-brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[var(--kravy-brand)]/20 transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-xl shadow-[var(--kravy-brand)]/10"
                  >
                    {isSaving ? <Package className="animate-spin" size={16} /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
                    Confirm Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
