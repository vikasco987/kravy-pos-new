"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    ImagePlus, Trash2, Loader2, Tag, X, CheckCircle2,
    Camera, ToggleRight, ToggleLeft, Edit3, Save, Grid2x2,
    UtensilsCrossed, Sofa, Megaphone, Info
} from "lucide-react";
import toast from "react-hot-toast";

type GalleryImage = {
    id: string;
    imageUrl: string;
    category: string;
    caption: string | null;
    isActive: boolean;
    createdAt: string;
};

const CATEGORIES = [
    { value: "food", label: "Food & Drinks", icon: <UtensilsCrossed size={16} />, color: "orange" },
    { value: "interior", label: "Interior", icon: <Sofa size={16} />, color: "blue" },
    { value: "promo", label: "Promotions", icon: <Megaphone size={16} />, color: "purple" },
    { value: "other", label: "Other", icon: <Tag size={16} />, color: "gray" },
];

const CAT_COLORS: Record<string, string> = {
    food: "text-orange-500 bg-orange-50 border-orange-100",
    interior: "text-blue-500 bg-blue-50 border-blue-100",
    promo: "text-purple-500 bg-purple-50 border-purple-100",
    other: "text-gray-500 bg-gray-50 border-gray-200",
};

export default function GalleryManagerPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filterCat, setFilterCat] = useState("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCaption, setEditCaption] = useState("");
    const [editCategory, setEditCategory] = useState("food");
    const [lightbox, setLightbox] = useState<GalleryImage | null>(null);

    // Upload form
    const [uploadCat, setUploadCat] = useState("food");
    const [uploadCaption, setUploadCaption] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchImages();
    }, []);

    async function fetchImages() {
        try {
            const res = await fetch("/api/admin/gallery");
            const data = await res.json();
            setImages(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load gallery");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);

        try {
            // Step 1: Upload to Cloudinary via /api/upload
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            const uploadData = await uploadRes.json();
            if (!uploadData.secure_url) throw new Error("Upload failed");

            // Step 2: Save to DB
            const res = await fetch("/api/admin/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: uploadData.secure_url,
                    category: uploadCat,
                    caption: uploadCaption || null,
                }),
            });
            const newImage = await res.json();
            setImages(prev => [newImage, ...prev]);
            setUploadCaption("");
            toast.success("Image added to gallery! 🖼️");
        } catch {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this image from gallery?")) return;
        try {
            await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
            setImages(prev => prev.filter(i => i.id !== id));
            toast.success("Deleted");
        } catch {
            toast.error("Failed to delete");
        }
    }

    async function handleToggle(img: GalleryImage) {
        try {
            const res = await fetch("/api/admin/gallery", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: img.id, isActive: !img.isActive }),
            });
            const updated = await res.json();
            setImages(prev => prev.map(i => i.id === img.id ? updated : i));
        } catch {
            toast.error("Failed to update");
        }
    }

    async function handleSaveEdit(id: string) {
        try {
            const res = await fetch("/api/admin/gallery", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, caption: editCaption, category: editCategory }),
            });
            const updated = await res.json();
            setImages(prev => prev.map(i => i.id === id ? updated : i));
            setEditingId(null);
            toast.success("Updated!");
        } catch {
            toast.error("Failed to update");
        }
    }

    const filtered = filterCat === "all" ? images : images.filter(i => i.category === filterCat);
    const stats = CATEGORIES.map(c => ({ ...c, count: images.filter(i => i.category === c.value).length }));

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 kravy-page-fade">

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Camera size={20} className="text-violet-600" />
                    </div>
                    Gallery Manager
                </h1>
                <p className="text-xs text-[var(--kravy-text-muted)] font-mono mt-1">Upload photos for your QR menu gallery · customers see this</p>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {stats.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setFilterCat(filterCat === cat.value ? "all" : cat.value)}
                        className={`rounded-2xl p-3 border transition-all text-left ${filterCat === cat.value ? CAT_COLORS[cat.value] + " border-current" : "bg-[var(--kravy-surface)] border-[var(--kravy-border)]"}`}
                    >
                        <div className="text-xl font-black text-[var(--kravy-text-primary)]">{cat.count}</div>
                        <div className="text-[0.68rem] font-bold text-[var(--kravy-text-muted)] mt-0.5">{cat.label}</div>
                    </button>
                ))}
            </div>

            {/* UPLOAD BOX */}
            <div className="bg-[var(--kravy-surface)] border-2 border-dashed border-[var(--kravy-border)] hover:border-violet-400 rounded-2xl p-6 mb-6 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                    <ImagePlus size={20} className="text-violet-500" />
                    <h2 className="text-sm font-black text-[var(--kravy-text-primary)] uppercase tracking-widest">Upload New Photo</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {/* Category */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-2 block">Category</label>
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setUploadCat(c.value)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[0.7rem] font-black border transition-all ${uploadCat === c.value ? CAT_COLORS[c.value] + " border-current" : "border-[var(--kravy-border)] text-[var(--kravy-text-muted)]"}`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-2 block">Caption <span className="normal-case font-normal opacity-60">— optional</span></label>
                        <input
                            value={uploadCaption}
                            onChange={e => setUploadCaption(e.target.value)}
                            placeholder="e.g. Freshly made Butter Chicken"
                            className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-violet-400 transition"
                        />
                    </div>

                    {/* Upload button */}
                    <div className="flex items-end">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-black text-sm hover:bg-violet-700 transition disabled:opacity-50 shadow-md shadow-violet-200"
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                            {uploading ? "Uploading..." : "Choose & Upload"}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[0.65rem] text-[var(--kravy-text-muted)] font-medium">
                    <Info size={12} />
                    Images are uploaded to Cloudinary and instantly appear on your QR Menu gallery tab.
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {["all", ...CATEGORIES.map(c => c.value)].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCat(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-[0.72rem] font-black border transition-all ${filterCat === cat
                            ? "bg-[var(--kravy-brand)] text-white border-[var(--kravy-brand)] shadow-md"
                            : "bg-[var(--kravy-surface)] text-[var(--kravy-text-muted)] border-[var(--kravy-border)]"
                            }`}
                    >
                        {cat === "all" ? `All (${images.length})` : `${CATEGORIES.find(c => c.value === cat)?.label} (${images.filter(i => i.category === cat).length})`}
                    </button>
                ))}
            </div>

            {/* GALLERY GRID */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[var(--kravy-brand)] w-8 h-8" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[var(--kravy-border)] rounded-2xl">
                    <Camera size={36} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-[var(--kravy-text-muted)]">No images yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload your first photo above</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filtered.map((img, i) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className={`relative rounded-2xl overflow-hidden border group ${img.isActive ? "border-[var(--kravy-border)]" : "border-dashed border-gray-200 opacity-50"}`}
                        >
                            {/* Image */}
                            <div
                                className="relative w-full h-40 cursor-pointer"
                                onClick={() => setLightbox(img)}
                            >
                                <Image src={img.imageUrl} alt={img.caption || img.category} fill className="object-cover" />
                                {/* Category chip */}
                                <div className={`absolute top-2 left-2 text-[0.55rem] font-black px-1.5 py-0.5 rounded-full border ${CAT_COLORS[img.category]}`}>
                                    {CATEGORIES.find(c => c.value === img.category)?.label}
                                </div>
                                {!img.isActive && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <span className="text-[0.6rem] font-black text-white bg-black/60 px-2 py-1 rounded-full">HIDDEN</span>
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            {editingId === img.id ? (
                                <div className="p-2 bg-[var(--kravy-surface)] space-y-1.5">
                                    <input
                                        value={editCaption}
                                        onChange={e => setEditCaption(e.target.value)}
                                        placeholder="Caption..."
                                        className="w-full text-xs font-medium border border-violet-300 rounded-lg px-2 py-1.5 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex gap-1">
                                        {CATEGORIES.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={() => setEditCategory(c.value)}
                                                className={`flex-1 text-[0.55rem] font-black py-1 rounded-md border transition ${editCategory === c.value ? CAT_COLORS[c.value] + " border-current" : "border-gray-200 text-gray-400"}`}
                                            >{c.label.split(" ")[0]}</button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setEditingId(null)} className="flex-1 text-xs py-1 rounded-md border border-gray-200 text-gray-400">Cancel</button>
                                        <button onClick={() => handleSaveEdit(img.id)} className="flex-1 text-xs py-1 rounded-md bg-violet-600 text-white font-black flex items-center justify-center gap-1"><Save size={10} />Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2 flex items-center justify-between gap-1 bg-[var(--kravy-surface)]">
                                    <span className="text-[0.65rem] font-medium text-[var(--kravy-text-muted)] truncate flex-1">{img.caption || <span className="italic opacity-40">No caption</span>}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => { setEditingId(img.id); setEditCaption(img.caption || ""); setEditCategory(img.category); }} className="p-1 hover:bg-violet-50 rounded-lg transition" title="Edit">
                                            <Edit3 size={12} className="text-violet-400" />
                                        </button>
                                        <button onClick={() => handleToggle(img)} title={img.isActive ? "Hide" : "Show"}>
                                            {img.isActive
                                                ? <ToggleRight size={20} className="text-green-500" />
                                                : <ToggleLeft size={20} className="text-gray-300" />
                                            }
                                        </button>
                                        <button onClick={() => handleDelete(img.id)} className="p-1 hover:bg-red-50 rounded-lg transition text-gray-300 hover:text-red-400">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* LIGHTBOX */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.85 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-lg w-full rounded-2xl overflow-hidden"
                        >
                            <div className="relative w-full" style={{ paddingTop: "75%" }}>
                                <Image src={lightbox.imageUrl} alt={lightbox.caption || ""} fill className="object-contain" />
                            </div>
                            {lightbox.caption && (
                                <div className="bg-black/70 text-white text-sm font-bold text-center py-3 px-4">{lightbox.caption}</div>
                            )}
                            <button
                                onClick={() => setLightbox(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
