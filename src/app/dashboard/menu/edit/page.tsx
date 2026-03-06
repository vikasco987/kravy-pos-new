"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Copy, Plus, Edit2, Trash2, Image as ImageIcon, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = {
    id: string;
    name: string;
};

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    sellingPrice: number | null;
    imageUrl: string | null;
    categoryId: string | null;
    category?: { name: string };
};

export default function MenuEditPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Form states
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Controlled Form values
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        imageUrl: "",
        categoryId: "uncategorised",
    });

    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [itemsRes, catRes] = await Promise.all([
                fetch("/api/items"),
                fetch("/api/categories")
            ]);
            if (itemsRes.ok) setItems(await itemsRes.json());
            if (catRes.ok) setCategories(await catRes.json());
        } catch (err) {
            console.error("Failed to load menu data:", err);
            toast.error("Failed to load menu items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        loadData();
    }, []);

    const openEditModal = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name || "",
            price: item.price ? String(item.price) : "",
            description: item.description || "",
            imageUrl: item.imageUrl || "",
            categoryId: item.categoryId || "uncategorised",
        });
        setIsFormOpen(true);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            price: "",
            description: "",
            imageUrl: "",
            categoryId: categories.length > 0 ? categories[0].id : "uncategorised",
        });
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const priceNum = parseFloat(formData.price) || 0;
            const bodyPayload = {
                name: formData.name,
                price: priceNum,
                sellingPrice: priceNum,
                description: formData.description,
                imageUrl: formData.imageUrl,
                categoryId: formData.categoryId === "uncategorised" ? null : formData.categoryId,
                ...(editingItem ? { id: editingItem.id } : {})
            };

            const method = editingItem ? "PUT" : "POST";
            const res = await fetch("/api/items", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload)
            });

            if (!res.ok) throw new Error("Failed to save item");
            toast.success(editingItem ? "Item updated successfully!" : "Item added successfully!");

            setIsFormOpen(false);
            loadData(); // Reload table
        } catch (err) {
            console.error(err);
            toast.error("Error saving item");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            const res = await fetch("/api/items", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (!res.ok) throw new Error("Failed to delete item");
            toast.success("Item deleted");
            setItems(items.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
            toast.error("Error deleting item");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center mt-20">
                <p className="text-[var(--kravy-text-muted)] font-medium animate-pulse">Loading menu manager...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--kravy-text-primary)] tracking-tight">Menu Manager</h1>
                    <p className="text-[var(--kravy-text-muted)] mt-1 font-medium">Add, edit, and organize your digital menu items.</p>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 px-6 font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Item
                </Button>
            </div>

            {/* LISTING MENU ITEMS */}
            <div className="bg-[var(--kravy-surface)] rounded-2xl border border-[var(--kravy-border)] shadow-sm overflow-hidden">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="w-20 h-20 bg-[var(--kravy-bg-2)] rounded-full flex items-center justify-center mb-4">
                            <UtensilsCrossed className="w-10 h-10 text-[var(--kravy-text-faint)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--kravy-text-primary)] mb-2">No Items Found</h3>
                        <p className="text-[var(--kravy-text-muted)] max-w-sm">Create your first menu item by clicking the "Add New Item" button.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--kravy-table-header)] border-b border-[var(--kravy-border)]">
                                    <th className="py-4 px-6 text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-widester">Item</th>
                                    <th className="py-4 px-6 text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-widester text-right">Price</th>
                                    <th className="py-4 px-6 text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-widester text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-[var(--kravy-border)] last:border-0 hover:bg-[var(--kravy-table-row-hover)] transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-[var(--kravy-bg-2)] flex items-center justify-center border border-[var(--kravy-border)]">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-[var(--kravy-text-faint)]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[var(--kravy-text-primary)] text-base flex items-center gap-2">
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold tracking-widest uppercase bg-[var(--kravy-badge-bg)] text-[var(--kravy-text-secondary)] px-2 py-0.5 rounded-md border border-[var(--kravy-border)]">
                                                            {item.category?.name || "Uncategorised"}
                                                        </span>
                                                        {item.description && (
                                                            <p className="text-xs text-[var(--kravy-text-muted)] truncate max-w-[200px] sm:max-w-xs">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="font-black text-[var(--kravy-text-primary)]">₹{item.price || 0}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {mounted && isFormOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-[var(--kravy-surface)] rounded-3xl shadow-2xl border border-[var(--kravy-border-strong)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-[var(--kravy-border)] flex items-center justify-between bg-[var(--kravy-table-header)]">
                            <h2 className="text-xl font-black text-[var(--kravy-text-primary)]">
                                {editingItem ? "Edit Menu Item" : "Add New Item"}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--kravy-surface-hover)] text-[var(--kravy-text-muted)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto no-scrollbar">
                            <form id="item-form" onSubmit={handleSave} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--kravy-text-secondary)] mb-1.5 uppercase tracking-wider">Item Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-4 py-3 text-[var(--kravy-text-primary)] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none font-semibold"
                                        placeholder="e.g. Paneer Tikka"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Price (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none font-semibold"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none font-semibold"
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        >
                                            <option value="uncategorised">Uncategorised</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none resize-none h-24"
                                        placeholder="Write a tasty description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Image URL</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                            {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                                        </div>
                                        <input
                                            type="url"
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none text-sm"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">Paste a direct link to an image. External links are fully supported.</p>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                className="px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-200 font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="item-form"
                                disabled={isSaving}
                                className="px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                {isSaving ? "Saving..." : "Save Item"}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}
