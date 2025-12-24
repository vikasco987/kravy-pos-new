// src/app/store-item-upload/StoreItemPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Category = { id: string; name: string };
type ClerkOption = {
  clerkId: string; // internal use only
  email: string;   // shown in UI
};

type StoreItem = {
  name: string;
  price: number;
  categoryId: string | null;
  clerkId: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

export default function StoreItemPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clerks, setClerks] = useState<ClerkOption[]>([]);
  const [search, setSearch] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [bulkClerkId, setBulkClerkId] = useState<string>("");


  /* =============================
     LOAD MASTER DATA
     ============================= */
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
    fetch("/api/clerks").then(r => r.json()).then(setClerks);
  }, []);

  /* =============================
     ENSURE CATEGORY
     ============================= */
  const ensureCategory = async (name: string): Promise<Category> => {
    const res = await fetch("/api/categories/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const cat = await res.json();

    setCategories((prev) =>
      prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]
    );

    return cat;
  };

  /* =============================
     EXCEL UPLOAD
     ============================= */
  const handleExcelUpload = async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

    const newItems: StoreItem[] = [];

    for (const row of raw) {
      const name = String(row.name || row.Name || "").trim();
      if (!name) continue;

      let categoryId: string | null = null;
      if (row.category || row.Category) {
        const cat = await ensureCategory(String(row.category || row.Category));
        categoryId = cat.id;
      }

      newItems.push({
        name,
        price: Number(row.price || row.Price || 0),
        categoryId,
        clerkId: userId || null,
        imageUrl: null,
        isActive: true,
      });
    }

    setItems(newItems);
    toast.success(`Loaded ${newItems.length} items`);
  };

  /* =============================
     IMAGE UPLOAD (API)
     ============================= */
  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload/image", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  /* =============================
     IMAGE HANDLERS (CLICK + DROP)
     ============================= */
  const handleImageFile = async (file: File, index: number) => {
    try {
      const url = await uploadImage(file);
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, imageUrl: url } : it))
      );
    } catch {
      toast.error("Image upload failed");
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    setDragIndex(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await handleImageFile(file, index);
    } else {
      toast.error("Please drop an image file");
    }
  };

  /* =============================
     CATEGORY SELECT
     ============================= */
  const handleCategorySelect = async (index: number, value: string) => {
    if (value === "__new__") {
      const name = prompt("Enter new category name");
      if (!name) return;
      const cat = await ensureCategory(name);
      value = cat.id;
    }

    setItems((p) =>
      p.map((it, i) => (i === index ? { ...it, categoryId: value } : it))
    );
  };

  /* =============================
     VALIDATION
     ============================= */
  const duplicateMap = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => {
      const k = i.name.toLowerCase();
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [items]);

  const hasErrors = items.some(
  (i) => !i.name?.trim() || i.price == null
);

  /* =============================
     SAVE
     ============================= */
 const saveItems = async (e?: React.MouseEvent) => {
  e?.preventDefault();
  e?.stopPropagation();

  if (hasErrors) {
    toast.error("Fix validation errors first");
    return;
  }

  const res = await fetch("/api/store-items/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    // ✅ SEND WHAT USER SEES & EDITS
body: JSON.stringify({ items }),
  });

  const data = await res.json();

  if (res.ok && data?.insertedCount > 0) {
    toast.success(`${data.insertedCount} items saved`);
    router.push("/menu/view");
  } else {
    toast.error("No items were saved");
  }
};


  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-26 space-y-4">
      <h1 className="text-2xl font-bold">Store Item Uploading</h1>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) =>
            e.target.files && handleExcelUpload(e.target.files[0])
          }
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Search item"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Category</th>
<th className="p-3 text-left">
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-gray-600">
      Assigned Clerk
    </span>

    <select
      className="border rounded px-2 py-1 text-sm"
      value={bulkClerkId}
      onChange={(e) => {
        const selectedClerkId = e.target.value;

        // 🔴 VERY IMPORTANT
        setBulkClerkId(selectedClerkId);

        // 🔴 APPLY TO ALL ITEMS (THIS WAS MISSING / BROKEN)
        setItems((prev) =>
          prev.map((it) => ({
            ...it,
            clerkId: selectedClerkId || it.clerkId,
          }))
        );
      }}
    >
      <option value="">Select clerk</option>
      {clerks.map((c) => (
        <option key={c.clerkId} value={c.clerkId}>
          {c.email}
        </option>
      ))}
    </select>
  </div>
</th>

              <th className="p-3">Active</th>
              <th className="p-3">Delete</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} className="border-t">
                {/* IMAGE (DRAG + DROP + CLICK) */}
                <td className="p-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setDragIndex(i)}
                    onDragLeave={() => setDragIndex(null)}
                    onDrop={(e) => handleDrop(e, i)}
                    className={`w-16 h-16 border rounded flex items-center justify-center cursor-pointer overflow-hidden ${
                      dragIndex === i ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <label className="w-full h-full flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          Drop / Click
                        </span>
                      )}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files &&
                          handleImageFile(e.target.files[0], i)
                        }
                      />
                    </label>
                  </div>
                </td>

                <td className="p-3">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={item.name}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((it, idx) =>
                          idx === i
                            ? { ...it, name: e.target.value }
                            : it
                        )
                      )
                    }
                  />
                </td>

                <td className="p-3">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={item.price}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((it, idx) =>
                          idx === i
                            ? { ...it, price: Number(e.target.value) }
                            : it
                        )
                      )
                    }
                  />
                </td>

                <td className="p-3">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={item.categoryId || ""}
                    onChange={(e) =>
                      handleCategorySelect(i, e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new__">+ Add new category</option>
                  </select>
                </td>

               <td className="p-3">
  <select
    className="border rounded px-2 py-1 w-full text-sm"
    value={item.clerkId || ""}
    onChange={(e) =>
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? { ...it, clerkId: e.target.value }
            : it
        )
      )
    }
  >
    <option value="">Select</option>
    {clerks.map((c) => (
      <option key={c.clerkId} value={c.clerkId}>
        {c.email}
      </option>
    ))}
  </select>
</td>


                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((it, idx) =>
                          idx === i
                            ? { ...it, isActive: e.target.checked }
                            : it
                        )
                      )
                    }
                  />
                </td>

                <td className="p-3 text-center">
                  <button
                    className="text-red-600"
                    onClick={() =>
                      setItems((p) =>
                        p.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {hasErrors && (
  <p className="text-red-600 text-sm mb-2">
    Please fill item name and price before saving.
  </p>
)}

     <button
  type="button"
  onClick={saveItems}
  disabled={hasErrors || items.length === 0}
  className="px-6 py-3 bg-black text-white rounded disabled:opacity-50"
>
  Save Items
</button>

    </div>
  );
}
