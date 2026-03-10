"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Sparkles,
    Trash2,
    Edit2,
    History,
    ChevronRight,
    Search,
    X,
    CheckCircle2,
    UtensilsCrossed,
    Layers,
    ShoppingBag,
    ListPlus,
    ArrowRight,
    Tag,
    Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ImageUpload from "../components/uploaditems/ImageUpload";
import { kravy } from "@/lib/sounds";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface MenuItem {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    category?: { name: string };
}

interface ComboSelection {
    type: 'fixed' | 'choice';
    itemId?: string;
    categoryId?: string;
    qty?: number;
    label?: string; // e.g. "Choose your drink"
}

interface Combo {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isActive: boolean;
    selections: ComboSelection[];
}

export default function CombosPage() {
    const [combos, setCombos] = useState<Combo[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        imageUrl: "" as string | null,
        isActive: true,
        selections: [] as ComboSelection[],
    });

    const fetchData = async () => {
        try {
            const [combosRes, itemsRes, catsRes] = await Promise.all([
                fetch("/api/admin/combos"),
                fetch("/api/menu/items"), // Internal management items api
                fetch("/api/categories")
            ]);
            setCombos(await combosRes.json());
            setItems(await itemsRes.json());
            setCategories(await catsRes.json());
        } catch (error) {
            kravy.error();
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSelection = (type: 'fixed' | 'choice') => {
        setFormData({
            ...formData,
            selections: [
                ...formData.selections,
                type === 'fixed'
                    ? { type: 'fixed', itemId: '', qty: 1 }
                    : { type: 'choice', categoryId: '', label: 'Choose one item', qty: 1 }
            ]
        });
    };

    const removeSelection = (index: number) => {
        const s = [...formData.selections];
        s.splice(index, 1);
        setFormData({ ...formData, selections: s });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.selections.length === 0) {
            kravy.error();
            toast.error("Add at least one item to the combo");
            return;
        }

        const method = editingCombo ? "PATCH" : "POST";
        const url = editingCombo ? `/api/admin/combos/${editingCombo.id}` : "/api/admin/combos";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                kravy.success();
                toast.success(editingCombo ? "Combo updated" : "Combo created");
                setIsSheetOpen(false);
                setEditingCombo(null);
                setFormData({ name: "", description: "", price: "", imageUrl: "", isActive: true, selections: [] });
                fetchData();
            } else {
                const err = await res.json();
                kravy.error();
                toast.error(err.error || "Failed to save combo");
            }
        } catch (error) {
            kravy.error();
            toast.error("Failed to save combo");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/admin/combos/${id}`, { method: "DELETE" });
            if (res.ok) {
                kravy.success();
                toast.success("Combo deleted");
                fetchData();
            }
        } catch (error) {
            kravy.error();
            toast.error("Delete failed");
        }
    };

    return (
        <div className="space-y-8 p-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        Combo Deals
                    </h1>
                    <p className="text-[var(--kravy-text-muted)] font-medium mt-1">Design meal sets and customizable value packs</p>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={(open) => {
                    setIsSheetOpen(open);
                    if (!open) {
                        setEditingCombo(null);
                        setFormData({ name: "", description: "", price: "", imageUrl: "", isActive: true, selections: [] });
                    }
                }}>
                    <SheetTrigger asChild>
                        <Button className="bg-indigo-610 hover:bg-indigo-700 bg-indigo-600 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2">
                            <Plus size={20} /> Create New Combo Deal
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-4xl bg-[var(--kravy-surface)] border-[var(--kravy-border)] p-0 overflow-hidden flex flex-col md:flex-row">
                        {/* Editor Side */}
                        <div className="flex-1 overflow-y-auto p-6 border-r border-[var(--kravy-border)]">
                            <SheetHeader>
                                <SheetTitle className="text-2xl font-black">Design New Combo</SheetTitle>
                                <SheetDescription className="font-medium text-[var(--kravy-text-muted)]">
                                    Pick items or categories to bundle together.
                                </SheetDescription>
                            </SheetHeader>

                            <form onSubmit={handleSubmit} className="space-y-8 mt-8 pb-10">
                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Combo Cover Image</Label>
                                    <ImageUpload
                                        image={formData.imageUrl}
                                        setImage={(url) => setFormData({ ...formData, imageUrl: url })}
                                    />
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Combo Name</Label>
                                        <Input
                                            placeholder="e.g. Super Saver Thali"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Offer Price (₹)</Label>
                                        <Input
                                            type="number"
                                            placeholder="199"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Status</Label>
                                        <Button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                            variant="outline"
                                            className={`w-full h-12 rounded-xl border-[var(--kravy-border)] font-bold flex justify-between px-4 ${formData.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}
                                        >
                                            {formData.isActive ? 'Visible on Menu' : 'Hidden'}
                                            <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Selections Builder */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Combo Components</Label>
                                        <div className="flex gap-2">
                                            <Button type="button" onClick={() => handleAddSelection('fixed')} size="sm" variant="outline" className="rounded-lg h-8 gap-2 border-[var(--kravy-border)] font-bold text-[10px] uppercase">
                                                <Plus size={12} /> Fixed Item
                                            </Button>
                                            <Button type="button" onClick={() => handleAddSelection('choice')} size="sm" variant="outline" className="rounded-lg h-8 gap-2 border-[var(--kravy-border)] font-bold text-[10px] uppercase">
                                                <ListPlus size={12} /> Choice Pack
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.selections.map((sel, idx) => (
                                            <Card key={idx} className="p-4 rounded-2xl border-[var(--kravy-border)] relative group shadow-none bg-gray-50/30">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelection(idx)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <X size={14} />
                                                </button>

                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sel.type === 'fixed' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                                        {sel.type === 'fixed' ? <ShoppingBag size={18} /> : <Layers size={18} />}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                        {sel.type === 'fixed' ? (
                                                            <>
                                                                <div className="col-span-1">
                                                                    <select
                                                                        value={sel.itemId}
                                                                        onChange={e => {
                                                                            const s = [...formData.selections];
                                                                            s[idx].itemId = e.target.value;
                                                                            setFormData({ ...formData, selections: s });
                                                                        }}
                                                                        className="w-full h-10 rounded-lg border-[var(--kravy-border)] px-2 font-bold text-sm bg-transparent outline-none focus:ring-1 ring-blue-500"
                                                                    >
                                                                        <option value="">Select Item</option>
                                                                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Qty"
                                                                    value={sel.qty}
                                                                    onChange={e => {
                                                                        const s = [...formData.selections];
                                                                        s[idx].qty = parseInt(e.target.value);
                                                                        setFormData({ ...formData, selections: s });
                                                                    }}
                                                                    className="h-10 rounded-lg font-bold"
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="col-span-1">
                                                                    <select
                                                                        value={sel.categoryId}
                                                                        onChange={e => {
                                                                            const s = [...formData.selections];
                                                                            s[idx].categoryId = e.target.value;
                                                                            setFormData({ ...formData, selections: s });
                                                                        }}
                                                                        className="w-full h-10 rounded-lg border-[var(--kravy-border)] px-2 font-bold text-sm bg-transparent outline-none focus:ring-1 ring-purple-500"
                                                                    >
                                                                        <option value="">Select Category</option>
                                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <Input
                                                                    placeholder="Label (e.g. Choose Drink)"
                                                                    value={sel.label}
                                                                    onChange={e => {
                                                                        const s = [...formData.selections];
                                                                        s[idx].label = e.target.value;
                                                                        setFormData({ ...formData, selections: s });
                                                                    }}
                                                                    className="h-10 rounded-lg font-bold"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {formData.selections.length === 0 && (
                                            <div className="p-8 border-2 border-dashed border-[var(--kravy-border)] rounded-2xl text-center">
                                                <p className="text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-widest mb-2 italic">No components added</p>
                                                <p className="text-sm text-gray-400">Click buttons above to start building</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20">
                                    {editingCombo ? "Save Changes" : "Create Combo Pack ⚡"}
                                </Button>
                            </form>
                        </div>

                        {/* Live Preview Side */}
                        <div className="w-[380px] bg-gray-50 flex flex-col items-center justify-center p-6 shrink-0 relative overflow-hidden group">
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                Interactive Live Preview
                            </div>

                            {/* Mobile Frame Container */}
                            <div className="w-full aspect-[9/18.5] bg-white rounded-[3rem] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="h-6 w-full bg-gray-900 flex justify-center items-end pb-1 gap-1">
                                    <div className="w-12 h-2.5 bg-gray-800 rounded-full" />
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 p-4 space-y-6">
                                    {/* Menu Strip Mockup */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[0.6rem] font-black uppercase text-gray-300">Section Preview</div>
                                            <div className="text-[0.5rem] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded italic font-bold">Bundle & Save ✨</div>
                                        </div>

                                        {/* Real-time Card Preview */}
                                        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm relative">
                                            {/* Preview Image */}
                                            {formData.imageUrl ? (
                                                <div className="w-full h-24 relative">
                                                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-full shadow-lg">Live Image</div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-16 bg-indigo-50 flex items-center justify-center text-indigo-200">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}

                                            <div className="p-3">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                                        <Sparkles size={16} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[0.7rem] font-black text-indigo-600 leading-none">₹{formData.price || "0"}</div>
                                                        <div className="text-[0.5rem] font-bold text-gray-400 line-through">₹{Number(formData.price || 0) + 100}</div>
                                                    </div>
                                                </div>
                                                <h4 className="text-[0.75rem] font-black text-gray-800 mb-1 truncate">{formData.name || "Combo Name"}</h4>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {formData.selections.length > 0 ? (
                                                        formData.selections.map((s, idx) => (
                                                            <div key={idx} className="bg-white/60 border border-black/5 rounded-md px-1 py-0.5 text-[0.45rem] font-black text-gray-400 truncate max-w-[70px]">
                                                                {s.type === 'fixed' ? items.find(it => it.id === s.itemId)?.name || "Item" : (s.label || "Choice")}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-[0.5rem] text-gray-300 italic">No items added yet...</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customizer Sheet Mockup */}
                                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                                        <div className="text-[0.6rem] font-black uppercase text-gray-300 italic">Customizer UI Preview</div>
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                            <div className="p-3 border-b border-gray-50 flex items-center justify-between">
                                                <div className="text-[0.7rem] font-black">Configure Combo</div>
                                                <X size={12} className="text-gray-300" />
                                            </div>
                                            <div className="p-4 space-y-4 max-h-[160px] overflow-y-auto no-scrollbar">
                                                {formData.selections.map((sel, idx) => (
                                                    <div key={idx} className="space-y-2">
                                                        <div className="text-[0.55rem] font-black text-indigo-500 uppercase flex items-center gap-1.5">
                                                            <div className="w-3 h-3 bg-indigo-50 rounded flex items-center justify-center text-[6px]">{idx + 1}</div>
                                                            {sel.type === 'fixed' ? 'Included' : (sel.label || 'Choice')}
                                                        </div>
                                                        <div className={`p-2 rounded-xl border flex items-center justify-between ${sel.type === 'fixed' ? 'bg-gray-50 border-gray-100' : 'bg-white border-indigo-100 shadow-sm ring-1 ring-indigo-50'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 bg-white rounded border border-gray-50 flex items-center justify-center text-[10px]">🍱</div>
                                                                <span className="text-[0.6rem] font-bold text-gray-700">
                                                                    {items.find(it => it.id === (sel.itemId || ''))?.name || (sel.type === 'fixed' ? 'Select Item' : 'Pick from ' + (categories.find(c => c.id === sel.categoryId)?.name || 'Category'))}
                                                                </span>
                                                            </div>
                                                            <CheckCircle2 size={10} className={sel.type === 'fixed' || sel.itemId ? 'text-emerald-500' : 'text-gray-200'} />
                                                        </div>
                                                    </div>
                                                ))}
                                                {formData.selections.length === 0 && (
                                                    <div className="text-[0.55rem] text-center text-gray-300 py-4 italic">Add components to see options</div>
                                                )}
                                            </div>
                                            <div className="p-3 bg-gray-50/50">
                                                <div className="w-full h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-[0.65rem] font-black text-white shadow-lg shadow-indigo-200">
                                                    Add to Order
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Home Bar */}
                                <div className="h-4 w-full bg-white flex justify-center items-center pb-1">
                                    <div className="w-16 h-1 bg-gray-200 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map((combo, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={combo.id}
                    >
                        <Card className="rounded-[32px] overflow-hidden border-[var(--kravy-border)] bg-[var(--kravy-surface)] shadow-sm group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    {combo.imageUrl ? (
                                        <img src={combo.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white" alt={combo.name} />
                                    ) : (
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <Sparkles size={24} />
                                        </div>
                                    )}
                                    <div className="flex gap-1">
                                        <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400" onClick={() => {
                                            setEditingCombo(combo);
                                            setFormData({
                                                name: combo.name,
                                                description: combo.description || "",
                                                price: combo.price.toString(),
                                                imageUrl: combo.imageUrl,
                                                isActive: combo.isActive,
                                                selections: combo.selections as ComboSelection[]
                                            });
                                            setIsSheetOpen(true);
                                        }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500" onClick={() => handleDelete(combo.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black">{combo.name}</h3>
                                <p className="text-2xl font-black text-indigo-600 mt-1">₹{combo.price}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {combo.selections.map((s, i) => (
                                        <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.type === 'fixed' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {s.type === 'fixed' ? <ShoppingBag size={12} /> : <Layers size={12} />}
                                            {s.type === 'fixed' ? items.find(it => it.id === s.itemId)?.name || 'Item' : s.label || 'Choice'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50/50 p-4 border-t border-[var(--kravy-border)] flex items-center justify-between">
                                <span className={`${combo.isActive ? 'text-emerald-500' : 'text-gray-400'} text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                                    <div className={`w-2 h-2 rounded-full ${combo.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                    {combo.isActive ? 'Selling Now' : 'Draft'}
                                </span>
                                <ArrowRight size={14} className="text-gray-300" />
                            </div>
                        </Card>
                    </motion.div>
                ))}

                {combos.length === 0 && (
                    <div className="col-span-full py-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <UtensilsCrossed size={32} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black opacity-40 uppercase tracking-widest">No Combos Configured</h3>
                        <p className="text-sm text-[var(--kravy-text-muted)] font-medium mt-2">Start by creating bundles to increase your average order value!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
