
// src/app/menu/view/page.tsx

// "use client";

// import { useAuth } from "@clerk/nextjs";
// import { useEffect, useMemo, useState } from "react";
// import Image from "next/image";
// import { motion, AnimatePresence } from "framer-motion";

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number | null;
//   imageUrl?: string | null;
//   unit?: string | null;
//   categoryId?: string | null;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// export default function ViewMenuPage() {
//   const { getToken } = useAuth();
//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [activeCategory, setActiveCategory] = useState<string | null>(null);

//   // guard Audio for SSR
//   const addSound =
//     typeof window !== "undefined" && typeof Audio !== "undefined"
//       ? new Audio("/sounds/add.mp3")
//       : null;
//   const removeSound =
//     typeof window !== "undefined" && typeof Audio !== "undefined"
//       ? new Audio("/sounds/remove.mp3")
//       : null;

//   useEffect(() => {
//     const fetchMenus = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         // try to get token (not strictly required if you use Clerk middleware),
//         // but calling getToken keeps compatibility if backend expects bearer token.
//         let token: string | undefined;
//         try {
//           token = await getToken();
//         } catch {
//           token = undefined;
//         }

//         const headers: Record<string, string> = {
//           "Content-Type": "application/json",
//         };
//         if (token) {
//           headers["Authorization"] = `Bearer ${token}`;
//         }

//         // include credentials so cookies set by Clerk middleware are sent
//         const res = await fetch("/api/menu/view", {
//   method: "GET",
//   credentials: "include",
// });


//         if (!res.ok) {
//           const text = await res.text().catch(() => "");
//           throw new Error(text || `Failed to fetch menus (${res.status})`);
//         }

//         const data = await res.json().catch(() => ({}));

//         // support different response shapes:
//         // 1) { menus: MenuCategory[] }
//         // 2) { items: Item[], categories: Category[] } -> convert to MenuCategory[]
//         if (Array.isArray(data.menus)) {
//           setMenus(data.menus);
//           if (data.menus.length > 0) setActiveCategory(data.menus[0].id);
//         } else if (Array.isArray(data.items)) {
//           const items: MenuItem[] = data.items.map((it: any) => ({
//             id: it.id || it._id || String(Math.random()),
//             name: it.name || "Unnamed",
//             price: typeof it.sellingPrice === "number" ? it.sellingPrice : it.price ?? null,
//             imageUrl: it.imageUrl ?? null,
//             unit: it.unit ?? null,
//             categoryId: it.categoryId ?? it.category?.id ?? null,
//           }));

//           const categoriesRaw: { id: string; name: string }[] =
//             Array.isArray(data.categories)
//               ? data.categories.map((c: any) => ({
//                   id: c.id || c._id,
//                   name: c.name || "Unknown",
//                 }))
//               : [];

//           const categoryMap = new Map<string, MenuCategory>();
//           // seed categories
//           categoriesRaw.forEach((c) => {
//             categoryMap.set(c.id, { id: c.id, name: c.name, items: [] });
//           });

//           // put items into categories, fallback to 'Uncategorised'
//           const uncategorisedId = "uncategorised";
//           if (!categoryMap.has(uncategorisedId)) {
//             categoryMap.set(uncategorisedId, { id: uncategorisedId, name: "Uncategorised", items: [] });
//           }

//           items.forEach((it) => {
//             const catId = it.categoryId ?? uncategorisedId;
//             if (!categoryMap.has(catId)) {
//               categoryMap.set(catId, { id: catId, name: "Uncategorised", items: [] });
//             }
//             categoryMap.get(catId)!.items.push(it);
//           });

//           const finalCategories = Array.from(categoryMap.values()).map((c) => ({
//             ...c,
//             items: c.items.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
//           }));

//           // sort categories by name (Uncategorised last)
//           finalCategories.sort((a, b) => {
//             if (a.id === uncategorisedId) return 1;
//             if (b.id === uncategorisedId) return -1;
//             return a.name.localeCompare(b.name);
//           });

//           setMenus(finalCategories);
//           if (finalCategories.length > 0) setActiveCategory(finalCategories[0].id);
//         } else {
//           // unknown shape
//           setMenus([]);
//           setError("Unexpected response from server");
//         }
//       } catch (err: any) {
//         console.error("Error fetching menus:", err);
//         setError(err?.message ?? "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMenus();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [getToken]); // getToken stable by Clerk; keep it in deps

//   const addToCart = (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       return {
//         ...prev,
//         [item.id]: { ...item, quantity: existing ? existing.quantity + 1 : 1 },
//       };
//     });

//     if (addSound) {
//       addSound.currentTime = 0;
//       void addSound.play().catch(() => {});
//     }
//   };

//   const removeFromCart = (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;

//       if (removeSound) {
//         removeSound.currentTime = 0;
//         void removeSound.play().catch(() => {});
//       }

//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//   };

//   const scrollToCategory = (id: string) => {
//     const el = document.getElementById(`cat-${id}`);
//     if (el) {
//       el.scrollIntoView({ behavior: "smooth", block: "start" });
//       setActiveCategory(id);
//     }
//   };

//   const totalPrice = Object.values(cart).reduce((sum, item) => sum + ((item.price ?? 0) * item.quantity), 0);
//   const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

//   // render
//   if (loading) return <p className="p-4 text-center">Loading...</p>;
//   if (error) return <p className="p-4 text-red-500 text-center">Error: {error}</p>;

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar - Categories */}
//       <div className="w-1/5 bg-white border-r shadow-sm overflow-y-auto p-4">
//         <h2 className="font-bold text-xl mb-6 text-gray-700">Categories</h2>
//         <ul className="space-y-3">
//           {menus.map((cat) => (
//             <li key={cat.id}>
//               <button
//                 onClick={() => scrollToCategory(cat.id)}
//                 className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
//                   activeCategory === cat.id
//                     ? "bg-green-500 text-white"
//                     : "hover:bg-green-100 hover:text-green-700 text-gray-800"
//                 }`}
//               >
//                 {cat.name} <span className="text-xs text-slate-500 ml-2">({cat.items.length})</span>
//               </button>
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Right - Items */}
//       <div className="flex-1 overflow-y-auto p-4 md:p-6">
//         <h1 className="text-2xl font-bold mb-6 text-gray-800">Products</h1>
//         <div className="space-y-12">
//           {menus.map((cat) => (
//             <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">{cat.name}</h2>
//               {cat.items.length === 0 ? (
//                 <p className="text-sm text-gray-500 mb-4">No items in this category.</p>
//               ) : (
//                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
//                   {cat.items.map((item) => {
//                     const inCart = cart[item.id]?.quantity || 0;
//                     return (
//                       <motion.div
//                         key={item.id}
//                         className={`border rounded-2xl p-2 shadow-md hover:shadow-xl transition relative cursor-pointer flex flex-col items-center ${
//                           inCart > 0 ? "bg-green-100" : "bg-white"
//                         }`}
//                         onClick={() => addToCart(item)}
//                         whileHover={{ scale: 1.03 }}
//                         layout
//                       >
//                         {inCart > 0 && (
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               removeFromCart(item);
//                             }}
//                             className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-lg shadow hover:bg-red-600 transition z-10"
//                             aria-label="remove one"
//                           >
//                             -
//                           </button>
//                         )}

//                         <div className="w-full h-32 relative rounded-xl overflow-hidden mb-2">
//                           {item.imageUrl ? (
//                             // next/image requires parent relative and fill for layout fill
//                             <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
//                           ) : (
//                             <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 rounded-xl">
//                               No Image
//                             </div>
//                           )}
//                         </div>

//                         <div className="flex flex-col items-center text-center">
//                           <h3 className="font-semibold text-gray-800 line-clamp-2">{item.name}</h3>
//                           <p className="text-green-600 font-bold mt-1">
//                             ₹{(item.price ?? 0).toFixed(2)}
//                           </p>
//                           {item.unit && <p className="text-xs text-gray-500 mt-1">{item.unit}</p>}
//                         </div>

//                         <AnimatePresence>
//                           {inCart > 0 && (
//                             <motion.div
//                               key={inCart}
//                               className="absolute bottom-2 left-2 bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
//                               initial={{ scale: 0, opacity: 0 }}
//                               animate={{ scale: 1, opacity: 1 }}
//                               exit={{ scale: 0, opacity: 0 }}
//                               transition={{ type: "spring", stiffness: 500, damping: 20 }}
//                             >
//                               {inCart}
//                             </motion.div>
//                           )}
//                         </AnimatePresence>
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//               )}
//             </section>
//           ))}
//         </div>

//         {/* Bottom Cart Bar */}
//         {totalItems > 0 && (
//           <motion.div
//             className="fixed bottom-0 left-0 right-0 bg-white shadow-xl border-t z-50 px-4 py-3 flex justify-between items-center md:px-6"
//             initial={{ y: 100 }}
//             animate={{ y: 0 }}
//             transition={{ type: "spring", stiffness: 200 }}
//           >
//             <div className="flex flex-col md:flex-row gap-2 md:gap-4 font-semibold text-gray-800">
//               <span>🛒 {totalItems} item{totalItems > 1 ? "s" : ""}</span>
//               <span>Total: ₹{totalPrice.toFixed(2)}</span>
//             </div>

//             <button
//               onClick={() => {
//                 try {
//                   localStorage.setItem("pendingCart", JSON.stringify(cart));
//                   localStorage.setItem("pendingTotal", totalPrice.toString());
//                   window.location.href = "/billing";
//                 } catch (e) {
//                   console.error("Failed to save cart to localStorage", e);
//                 }
//               }}
//               className="bg-blue-600 px-4 py-2 rounded-xl text-white font-semibold hover:bg-green-700 transition"
//             >
//               ✅ Generate Payment Slip
//             </button>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// }

// last updated code above



















































//src/app/menu/view/page.tsx

"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/* types */
type MenuItem = {
  id: string;
  name: string;
  price?: number | null;
  imageUrl?: string | null;
  unit?: string | null;
  categoryId?: string | null;
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

type CartItem = MenuItem & { quantity: number };

function formatPrice(v?: number | null) {
  return `₹${((v ?? 0)).toFixed(2)}`;
}
export default function ViewMenuPage() {


  const [menus, setMenus] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // filters & UI
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [filterHasImage, setFilterHasImage] = useState<"any" | "only" | "no">("any");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [sortMode, setSortMode] = useState<
    "alpha_asc" | "alpha_desc" | "price_asc" | "price_desc"
  >("alpha_asc");

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
  const fetchMenus = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/menu/view", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }

      const items = await res.json();
      console.log("MENU ITEMS:", items);

      if (!Array.isArray(items)) {
        throw new Error("Menu API did not return array");
      }

     const UNCATEGORISED_ID = "__uncategorised__";

const categoryMap = new Map<string, MenuCategory>();

categoryMap.set(UNCATEGORISED_ID, {
  id: UNCATEGORISED_ID,
  name: "Uncategorised",
  items: [],
});

      items.forEach((it: any) => {
        const catId = it.category?.id ?? UNCATEGORISED_ID;
        const catName = it.category?.name ?? "Uncategorised";

        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            id: catId,
            name: catName,
            items: [],
          });
        }

        categoryMap.get(catId)!.items.push({
          id: String(it.id),
          name: it.name ?? "Unnamed",
          price:
            typeof it.sellingPrice === "number"
              ? it.sellingPrice
              : it.price ?? null,
          imageUrl: it.imageUrl ?? null,
          unit: it.unit ?? null,
          categoryId: catId,
        });
      });

      const finalCategories = Array.from(categoryMap.values()).filter(
        (c) => c.items.length > 0
      );

      setMenus(finalCategories);
      setActiveCategory(finalCategories[0]?.id ?? null);
    } catch (err: any) {
      console.error("Error fetching menus:", err);
      setError(err.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  fetchMenus();
}, []);

  const allCategories = useMemo(() => [{ id: "all", name: "All Categories" }, ...menus.map((m) => ({ id: m.id, name: m.name }))], [menus]);

  const flattenedItems = useMemo(() => menus.flatMap((c) => c.items.map((it) => ({ ...it, categoryName: c.name }))), [menus]);

  const filteredByQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flattenedItems;
    return flattenedItems.filter((it) => (it.name?.toLowerCase() ?? "").includes(q) || (it as any).categoryName?.toLowerCase()?.includes(q));
  }, [flattenedItems, query]);

  const filteredByCategory = useMemo(() => {
    if (filterCategory === "all") return filteredByQuery;
    return filteredByQuery.filter((it) => it.categoryId === filterCategory);
  }, [filteredByQuery, filterCategory]);

  const filteredByImage = useMemo(() => {
    if (filterHasImage === "any") return filteredByCategory;
    if (filterHasImage === "only") return filteredByCategory.filter((it) => !!it.imageUrl);
    return filteredByCategory.filter((it) => !it.imageUrl);
  }, [filteredByCategory, filterHasImage]);

  const filteredByPrice = useMemo(() => {
    let arr = filteredByImage;
    if (priceMin !== "") arr = arr.filter((it) => (it.price ?? 0) >= Number(priceMin));
    if (priceMax !== "") arr = arr.filter((it) => (it.price ?? 0) <= Number(priceMax));
    return arr;
  }, [filteredByImage, priceMin, priceMax]);

  const sortedItems = useMemo(() => {
    const copy = [...filteredByPrice];
    switch (sortMode) {
      case "alpha_asc": copy.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")); break;
      case "alpha_desc": copy.sort((a, b) => (b.name ?? "").localeCompare(a.name ?? "")); break;
      case "price_asc": copy.sort((a, b) => (Number(a.price ?? 0) - Number(b.price ?? 0))); break;
      case "price_desc": copy.sort((a, b) => (Number(b.price ?? 0) - Number(a.price ?? 0))); break;
    }
    return copy;
  }, [filteredByPrice, sortMode]);

  const groupedForUI = useMemo(() => {
    if (filterCategory !== "all") {
      const itemsForCat = sortedItems.filter((it) => it.categoryId === filterCategory);
      const catObj = menus.find((m) => m.id === filterCategory);
      const name = catObj?.name ?? (filterCategory === "uncategorised" ? "Uncategorised" : "Selected Category");
      return [{ id: String(filterCategory), name, items: itemsForCat }];
    }

    const map = new Map<string, MenuCategory>();
    for (const it of sortedItems) {
      const cid = it.categoryId ?? "uncategorised";
      if (!map.has(cid)) {
        const catName = menus.find((m) => m.id === cid)?.name ?? (cid === "uncategorised" ? "Uncategorised" : "Unknown");
        map.set(cid, { id: cid, name: catName, items: [] });
      }
      map.get(it.categoryId ?? "uncategorised")!.items.push({ id: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl, unit: it.unit, categoryId: it.categoryId });
    }

    const list: MenuCategory[] = [];
    for (const m of menus) {
      const got = map.get(m.id);
      if (got && got.items.length > 0) list.push(got);
    }
    const unc = map.get("uncategorised");
    if (unc && unc.items.length > 0) list.push(unc);
    return list;
  }, [sortedItems, menus, filterCategory]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => { const existing = prev[item.id]; return { ...prev, [item.id]: { ...item, quantity: existing ? existing.quantity + 1 : 1 } }; });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (!existing) return prev;
      if (existing.quantity === 1) {
        const copy = { ...prev }; delete copy[item.id]; return copy;
      }
      return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const totalPrice = Object.values(cart).reduce((sum, it) => sum + ((it.price ?? 0) * it.quantity), 0);
  const totalItems = Object.values(cart).reduce((sum, it) => sum + it.quantity, 0);

  async function saveEdit(updated: MenuItem) {
    if (!updated?.id) return;
    try {
      const res = await fetch("/api/items", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: updated.id,
    name: updated.name,
    sellingPrice: updated.price,
    unit: updated.unit,
    categoryId: updated.categoryId,
    imageUrl: updated.imageUrl,
  }),
});

      if (!res.ok) throw new Error(await res.text().catch(() => `Failed (${res.status})`));
      setMenus((prev) => prev.map((cat) => ({ ...cat, items: cat.items.map((it) => it.id === updated.id ? { ...it, ...updated } : it) })));
      setEditingItem(null);
      setToast("Item updated");
    } catch (err: any) {
      console.error(err);
      setToast(err?.message ?? "Update failed");
    }
  }

  async function confirmDelete(item: MenuItem) {
    if (!item?.id) return;
    try {
     const res = await fetch("/api/items", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: item.id }),
});

      if (!res.ok) throw new Error(await res.text().catch(() => `Failed (${res.status})`));
      setMenus((prev) => prev.map((cat) => ({ ...cat, items: cat.items.filter((it) => it.id !== item.id) })));
      setDeletingItem(null);
      setToast("Item deleted");
    } catch (err: any) {
      console.error(err);
      setToast(err?.message ?? "Delete failed");
    }
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) { setToast("Category name required"); return; }
    setIsCreatingCategory(true);
    try {
    const res = await fetch("/api/categories", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name }),
});
  
    if (!res.ok) throw new Error(await res.text().catch(() => `Failed (${res.status})`));
      const data = await res.json().catch(() => null);
      const newCat = data?.id ? { id: data.id, name: data.name || name, items: [] } : { id: String(Date.now()), name, items: [] };
      setMenus((prev) => [newCat, ...prev]);
      setNewCategoryName("");
      setToast("Category created");
    } catch (err: any) {
      console.error(err);
      setToast(err?.message ?? "Create failed");
    } finally {
      setIsCreatingCategory(false);
    }
  }

  function EditModal({ item, onClose, onSave }: { item: MenuItem; onClose: () => void; onSave: (u: MenuItem) => void }) {
    const [local, setLocal] = useState<MenuItem>(item);
    useEffect(() => setLocal(item), [item]);
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-5 z-50">
          <h3 className="text-lg font-semibold mb-3">Edit item</h3>
          <label className="text-sm">Name</label>
          <input className="w-full border rounded px-3 py-2 mb-3" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
          <label className="text-sm">Price</label>
          <input className="w-full border rounded px-3 py-2 mb-3" type="number" value={local.price ?? ""} onChange={(e) => setLocal({ ...local, price: e.target.value === "" ? null : Number(e.target.value) })} />
          <label className="text-sm">Unit</label>
          <input className="w-full border rounded px-3 py-2 mb-3" value={local.unit ?? ""} onChange={(e) => setLocal({ ...local, unit: e.target.value })} />
          <label className="text-sm">Image URL</label>
          <input className="w-full border rounded px-3 py-2 mb-3" value={local.imageUrl ?? ""} onChange={(e) => setLocal({ ...local, imageUrl: e.target.value })} />
          <label className="text-sm">Category</label>
          <select value={local.categoryId ?? "uncategorised"} onChange={(e) => setLocal({ ...local, categoryId: e.target.value })} className="w-full border rounded px-3 py-2 mb-4">
            {allCategories.map((c) => <option key={c.id} value={c.id === "all" ? "uncategorised" : c.id}>{c.name}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded bg-gray-100">Cancel</button>
            <button onClick={() => onSave(local)} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
          </div>
        </motion.div>
      </div>
    );
  }

  function ConfirmDelete({ item, onClose, onConfirm }: { item: MenuItem; onClose: () => void; onConfirm: () => void }) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-5 z-50">
          <h3 className="text-lg font-semibold mb-2">Delete</h3>
          <p className="text-sm text-gray-600 mb-4">Delete "{item.name}"? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded bg-gray-100">Cancel</button>
            <button onClick={() => onConfirm()} className="px-3 py-2 rounded bg-red-600 text-white">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <p className="p-6 text-center">Loading items...</p>;
  if (error) return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  return (
    // prevent horizontal overflow site-wide
    <div className="min-h-screen bg-gray-50 pb-28 overflow-x-hidden">
      {/* sticky search/filter bar below header
          - top value should match header height (header is 64px -> top-16)
          - horizontal scroll: overflow-x-auto with flex-nowrap so controls can scroll left-right */}
      <div className="filter-sticky-bar sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* horizontally scrollable container */}
            <div className="flex gap-3 items-center overflow-x-auto no-scrollbar py-1 w-full min-w-0">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items or category..."
                className="border px-3 py-2 rounded w-64 min-w-[180px] flex-shrink-0"
              />

              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="border px-3 py-2 rounded flex-shrink-0">
                {allCategories.map((c) => <option key={c.id} value={c.id as any}>{c.name}</option>)}
              </select>

              <select value={filterHasImage} onChange={(e) => setFilterHasImage(e.target.value as any)} className="border px-3 py-2 rounded flex-shrink-0">
                <option value="any">Any image</option>
                <option value="only">Has image</option>
                <option value="no">No image</option>
              </select>

              <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} className="border px-3 py-2 rounded flex-shrink-0">
                <option value="alpha_asc">A → Z</option>
                <option value="alpha_desc">Z → A</option>
                <option value="price_asc">Price low → high</option>
                <option value="price_desc">Price high → low</option>
              </select>

              <input placeholder="Min" type="number" value={priceMin === "" ? "" : String(priceMin)} onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))} className="border px-3 py-2 rounded w-20 flex-shrink-0" />
              <input placeholder="Max" type="number" value={priceMax === "" ? "" : String(priceMax)} onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))} className="border px-3 py-2 rounded w-20 flex-shrink-0" />

              <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category" className="border px-3 py-2 rounded flex-shrink-0 w-40" />
              <button onClick={createCategory} disabled={isCreatingCategory} className="px-3 py-2 rounded bg-blue-600 text-white flex-shrink-0">{isCreatingCategory ? "Adding..." : "Add"}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 mt-4">
        <aside className="hidden md:block bg-white p-4 rounded-lg shadow h-fit sticky top-[90px] min-w-0">
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="flex flex-col gap-2 min-w-0">
            <button onClick={() => { setFilterCategory("all"); setActiveCategory(null); }} className={`text-left px-3 py-2 rounded ${filterCategory === "all" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>All Categories</button>
            {menus.map((m) => (
              <button key={m.id} onClick={() => { setFilterCategory(m.id); setActiveCategory(m.id); const el = document.getElementById(`cat-${m.id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={`text-left px-3 py-2 rounded ${filterCategory === m.id ? "bg-green-500 text-white" : "hover:bg-gray-100"}`}>
                <div className="flex justify-between items-center min-w-0">
                  <span className="truncate">{m.name}</span>
                  <span className="text-xs text-slate-500 ml-2">({m.items.length})</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="md:hidden mobile-category-wrapper">
          <div className="flex gap- overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => { setFilterCategory("all"); setActiveCategory(null); }} className={`px-3 py-1 rounded-full text-sm ${filterCategory === "all" ? "bg-green-500 text-white" : "bg-white border"}`}>All</button>
            {menus.map((m) => (
              <button key={m.id} onClick={() => { setFilterCategory(m.id); setActiveCategory(m.id); const el = document.getElementById(`cat-${m.id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={`px-3 py-1 rounded-full text-sm ${filterCategory === m.id ? "bg-green-500 text-white" : "bg-white border"}`}>
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <main className="min-w-0">
          <h2 className="text-2xl font-bold mb-4">Products</h2>

          {groupedForUI.length === 0 && <p className="text-sm text-gray-600">No items match your filters.</p>}

          <div className="space-y-10">
            {groupedForUI.map((cat) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="min-w-0">
                <h3 className="font-semibold mb-4">{cat.name}</h3>

                {cat.items.length === 0 ? (
                  <p className="text-sm text-gray-500">No items here.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {cat.items.map((item) => {
                      const inCart = cart[item.id]?.quantity ?? 0;
                      return (
                        <motion.div key={item.id} layout whileHover={{ scale: 1.02 }} className={`bg-white p-3 rounded-xl shadow relative cursor-pointer min-w-0 ${inCart > 0 ? "ring-2 ring-green-200" : ""}`} onClick={() => addToCart(item)}>
                          {inCart > 0 && <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{inCart}</div>}

                          <div className="w-full h-36 mb-3 relative rounded overflow-hidden bg-gray-100 flex items-center justify-center min-w-0">
                            {item.imageUrl ? (
                              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                            ) : (
                              <div className="text-gray-400">No Image</div>
                            )}
                          </div>

                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center justify-between w-full">
                              <h4 className="font-semibold text-sm md:text-base truncate max-w-[70%]">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="px-2 py-1 text-xs bg-blue-100 rounded">Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); setDeletingItem(item); }} className="px-2 py-1 text-xs bg-red-100 rounded">Delete</button>
                              </div>
                            </div>

                            <div className="text-green-600 font-bold">{formatPrice(item.price)}</div>
                            {item.unit && <div className="text-xs text-gray-500">{item.unit}</div>}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        </main>
      </div>

      {totalItems > 0 && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} className="fixed left-4 right-4 bottom-4 z-50 bg-white border rounded-xl shadow-lg px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="font-semibold">🛒 {totalItems} item(s)</div>
            <div className="text-gray-700 font-semibold">Total: {formatPrice(totalPrice)}</div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => { try { localStorage.setItem("pendingCart", JSON.stringify(cart)); localStorage.setItem("pendingTotal", totalPrice.toString()); window.location.href = "/billing/checkout"; } catch (e) { console.error(e); setToast("Unable to go to billing"); } }} className="px-4 py-2 bg-blue-600 text-white rounded">Checkout</button>
          </div>
        </motion.div>
      )}

      {editingItem && <EditModal item={editingItem} onClose={() => setEditingItem(null)} onSave={async (u) => await saveEdit(u)} />}
      {deletingItem && <ConfirmDelete item={deletingItem} onClose={() => setDeletingItem(null)} onConfirm={() => confirmDelete(deletingItem!)} />}

      {toast && <div className="fixed right-4 bottom-28 bg-black text-white px-4 py-2 rounded shadow z-60">{toast}</div>}
    </div>
  );
}