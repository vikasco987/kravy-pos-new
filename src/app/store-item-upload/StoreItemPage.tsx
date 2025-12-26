"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

/* =============================
   TYPES
   ============================= */
type Category = { id: string; name: string };
type ClerkOption = {
  clerkId: string;
  label: string;   // name or email (display)
  email: string;
};

type StoreItem = {
  id?: string;                 // present in update mode
  name: string;
  price: number | null;
  categoryId: string | null;
  clerkId: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

/* =============================
   COMPONENT
   ============================= */
export default function StoreItemPage() {
  const { userId } = useAuth();
  const router = useRouter();

  // mode: create (bulk upload) | update (edit existing)
  const [mode, setMode] = useState<"create" | "update">("create");
  const [loadingItems, setLoadingItems] = useState(false);

  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clerks, setClerks] = useState<ClerkOption[]>([]);
  const [search, setSearch] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [bulkClerkId, setBulkClerkId] = useState<string>("");
  const [clerkSearch, setClerkSearch] = useState("");
  const [showClerkDropdown, setShowClerkDropdown] = useState(false);

  const filteredClerks = useMemo(() => {
  return clerks.filter((c) =>
    c.label.toLowerCase().includes(clerkSearch.toLowerCase())
  );
  }, [clerks, clerkSearch]);


  /* =============================
     LOAD MASTER DATA
     ============================= */
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
    fetch("/api/clerks").then(r => r.json()).then(setClerks);
  }, []);

  /* =============================
     FETCH EXISTING ITEMS (UPDATE)
     ============================= */
  const fetchExistingItems = async () => {
    try {
      setLoadingItems(true);

      const res = await fetch("/api/menu/view");
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to load items");
        return;
      }

      const mapped: StoreItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        categoryId: item.categoryId ?? null,
        clerkId: item.clerkId ?? null,
        imageUrl: item.imageUrl ?? null,
        isActive: item.isActive ?? true,
      }));

      setItems(mapped);
      setSearch("");
      setMode("update");
      toast.success("Items loaded for update");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch items");
    } finally {
      setLoadingItems(false);
    }
  };

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

    setCategories(prev =>
      prev.some(c => c.id === cat.id) ? prev : [...prev, cat]
    );

    return cat;
  };

  /* =============================
     EXCEL UPLOAD (CREATE)
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
    setMode("create");
    setSearch("");
    toast.success(`Loaded ${newItems.length} items`);
  };

  /* =============================
     IMAGE UPLOAD
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

  const handleImageFile = async (file: File, index: number) => {
    try {
      const url = await uploadImage(file);
      setItems(prev =>
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
     VALIDATION (ONLY REQUIRED FIELDS)
     ============================= */
  const hasErrors = items.some(
    i => !i.name?.trim() || i.price == null
  );

  /* =============================
     SAVE / UPDATE
     ============================= */
  const saveItems = async () => {
    const res = await fetch("/api/store-items/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    if (res.ok && data?.insertedCount > 0) {
      toast.success(`${data.insertedCount} items saved`);
      router.push("/menu/view");
    } else {
      toast.error(data?.error || "Save failed");
    }
  };

  const updateItems = async () => {
    const res = await fetch("/api/store-items/bulk-update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (res.ok) {
      toast.success("Items updated");
    } else {
      toast.error("Update failed");
    }
  };

  const handleSave = () => {
    if (hasErrors || items.length === 0) return;
    mode === "create" ? saveItems() : updateItems();
  };

  const displayedItems = search
    ? items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  /* =============================
     RENDER
     ============================= */
  return (
    <div className="p-24 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Store Item Uploading</h1>
          <p className="text-sm text-gray-500">
            {mode === "create"
              ? "Upload new items"
              : "Update existing items"}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchExistingItems}
          disabled={loadingItems}
          className="px-4 py-2 border rounded"
        >
          {loadingItems ? "Loading..." : "Update"}
        </button>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={e =>
            e.target.files && handleExcelUpload(e.target.files[0])
          }
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Search item"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Category</th>

              {/* CLERK HEADER DROPDOWN */}
             <th className="p-3 text-left relative">
  <span className="text-xs font-medium text-gray-600">
    Assigned Clerk
  </span>

  <input
    className="mt-1 w-full border rounded px-2 py-1 text-sm"
    placeholder="Search clerk"
    value={clerkSearch}
    onFocus={() => setShowClerkDropdown(true)}
    onChange={(e) => setClerkSearch(e.target.value)}
  />

  {showClerkDropdown && (
    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto border bg-white rounded shadow">
      {filteredClerks.map((c) => (
        <div
          key={c.clerkId}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
          onClick={() => {
            setBulkClerkId(c.clerkId);

            // ✅ apply to all rows
            setItems((prev) =>
              prev.map((it) => ({
                ...it,
                clerkId: c.clerkId,
              }))
            );

            setShowClerkDropdown(false);
            setClerkSearch(c.label);
          }}
        >
          {c.label}
        </div>
      ))}

      {filteredClerks.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-400">
          No clerk found
        </div>
      )}
    </div>
  )}
</th>


              <th className="p-3">Active</th>
              <th className="p-3">Delete</th>
            </tr>
          </thead>

          <tbody>
            {displayedItems.map((item, i) => (
              <tr key={item.id ?? i} className="border-t">
                {/* IMAGE */}
               {/* IMAGE */}
<td className="p-3">
  <div
    onDragOver={e => e.preventDefault()}
    onDragEnter={() => setDragIndex(i)}
    onDragLeave={() => setDragIndex(null)}
    onDrop={e => handleDrop(e, i)}
    className={`w-16 h-16 border rounded flex items-center justify-center ${
      dragIndex === i ? "border-blue-500 bg-blue-50" : ""
    }`}
  >
    <label className="w-full h-full flex items-center justify-center cursor-pointer">
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
        onChange={e =>
          e.target.files &&
          handleImageFile(e.target.files[0], i)
        }
      />
    </label>
  </div>

  {/* 🔹 IMAGE URL PASTE (NEW) */}
  <input
    type="text"
    placeholder="Paste image URL"
    className="mt-2 w-32 text-xs border rounded px-2 py-1"
    value={item.imageUrl ?? ""}
    onChange={(e) =>
      setItems(prev =>
        prev.map((it, idx) =>
          idx === i
            ? { ...it, imageUrl: e.target.value }
            : it
        )
      )
    }
  />
</td>

                {/* NAME */}
                {/* NAME */}
<td className="p-3">
  <div className="flex items-center gap-2">
    <input
      className="border rounded px-2 py-1 w-full"
      value={item.name}
      onChange={e =>
        setItems(prev =>
          prev.map((it, idx) =>
            idx === i
              ? { ...it, name: e.target.value }
              : it
          )
        )
      }
    />

    {/* 🔹 COPY NAME */}
    <button
      type="button"
      className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
      onClick={() => {
        navigator.clipboard.writeText(item.name);
        toast.success("Item name copied");
      }}
      title="Copy item name"
    >
      Copy
    </button>
  </div>
</td>

                {/* PRICE */}
                <td className="p-3">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={item.price ?? ""}
                    onChange={e =>
                      setItems(prev =>
                        prev.map((it, idx) =>
                          idx === i
                            ? {
                                ...it,
                                price: Number(e.target.value),
                              }
                            : it
                        )
                      )
                    }
                  />
                </td>

                {/* CATEGORY */}
                <td className="p-3">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={item.categoryId ?? ""}
                    onChange={e =>
                      setItems(prev =>
                        prev.map((it, idx) =>
                          idx === i
                            ? { ...it, categoryId: e.target.value }
                            : it
                        )
                      )
                    }
                  >
                    <option value="">Select</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new__">+ Add new category</option>
                  </select>
                </td>

                {/* CLERK (ROW) */}
                <td className="p-3">
  <select
    className="border rounded px-2 py-1 w-full text-sm"
    value={item.clerkId || ""}
    onChange={(e) =>
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, clerkId: e.target.value } : it
        )
      )
    }
  >
    <option value="">Select clerk</option>
    {clerks.map((c) => (
      <option key={c.clerkId} value={c.clerkId}>
        {c.label}
      </option>
    ))}
  </select>
</td>


                {/* ACTIVE */}
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={e =>
                      setItems(prev =>
                        prev.map((it, idx) =>
                          idx === i
                            ? { ...it, isActive: e.target.checked }
                            : it
                        )
                      )
                    }
                  />
                </td>

                {/* DELETE */}
                <td className="p-3 text-center">
                  <button
                    className="text-red-600"
                    onClick={() =>
                      setItems(prev =>
                        prev.filter((_, idx) => idx !== i)
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
        <p className="text-red-600 text-sm">
          Please fill item name and price before saving.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={hasErrors || items.length === 0}
        className="px-6 py-3 bg-black text-white rounded disabled:opacity-50"
      >
        {mode === "create" ? "Save Items" : "Update Items"}
      </button>
    </div>
  );
}