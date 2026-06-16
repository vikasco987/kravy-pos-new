
// src/app/menu/upload/page.tsx

"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion } from "framer-motion";
import ImageUpload from "@/app/dashboard/components/uploaditems/ImageUpload";
import CategorySelect from "@/app/dashboard/components/uploaditems/CategorySelect";
import GstTaxSection from "@/app/dashboard/components/uploaditems/GstTaxSection";
import ProductDetailsSection from "@/app/dashboard/components/uploaditems/ProductDetailsSection";
import InventorySection from "@/app/dashboard/components/uploaditems/InventorySection";
import DisplaySection from "@/app/dashboard/components/uploaditems/DisplaySection";
import { Wand2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Page() {
  const [image, setImage] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    productName: "",
    shortCode: "",
    sellPrice: "",
    itemUnit: "",
    mrp: "",
    purchasePrice: "",
    gst: "",
    otherTax: "",
    brand: "",
    model: "",
    size: "",
    color: "",
    description: "",
    openingStock: "",
    currentStock: "",
    reorderLevel: "",
    displayColor: "",
    hsnCode: "",
    zones: "",
  });

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setCategories(data);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoFetchImage = async () => {
    if (!formData.productName.trim()) {
      toast.error("Please enter a product name first");
      return;
    }
    setIsFetchingImage(true);
    try {
      const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL || "http://localhost:3005";
      const res = await fetch(`${SCRAPER_URL}/api/scrape-image-only`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: formData.productName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch image");
      
      setImage(data.url);
      localStorage.setItem("uploadedImage", data.url);
      toast.success(`Image found via ${data.source === 'database' ? 'Database' : 'AI Scraper'}!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not find an image automatically");
    } finally {
      setIsFetchingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formRef.current) return;

    if (!image) {
      alert("Please upload an image before saving.");
      setIsSaving(false);
      return;
    }

    const parseFloatOrNull = (v: string) => {
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    const parseIntOrNull = (v: string) => {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    };

    const itemData = {
      name: formData.productName || undefined,
      price: parseFloatOrNull(formData.sellPrice),
      unit: formData.itemUnit || null,
      categoryId: selectedCategory,
      mrp: parseFloatOrNull(formData.mrp),
      purchasePrice: parseFloatOrNull(formData.purchasePrice),
      gst: parseFloatOrNull(formData.gst),
      otherTax: parseFloatOrNull(formData.otherTax),
      brand: formData.brand || null,
      model: formData.model || null,
      size: formData.size || null,
      color: formData.color || null,
      description: formData.description || null,
      openingStock: parseIntOrNull(formData.openingStock),
      currentStock: parseIntOrNull(formData.currentStock),
      reorderLevel: parseIntOrNull(formData.reorderLevel),
      displayCategory: formData.displayCategory || null,
      displayColor: formData.displayColor || null,
      shortCode: formData.shortCode || null,
      imageUrl: image,
      hsnCode: formData.hsnCode || null,
      zones: formData.zones ? formData.zones.split(',').map((z: string) => z.trim()).filter(Boolean) : [],
    };

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save item");

      alert("✅ Item saved successfully!");
      formRef.current.reset();
      setFormData({
        productName: "",
        shortCode: "",
        sellPrice: "",
        itemUnit: "",
        mrp: "",
        purchasePrice: "",
        gst: "",
        otherTax: "",
        brand: "",
        model: "",
        size: "",
        color: "",
        description: "",
        openingStock: "",
        currentStock: "",
        reorderLevel: "",
        displayCategory: "",
        displayColor: "",
        hsnCode: "",
        zones: "",
      });
      setImage(null);
      setOpenSection(null);
      setSelectedCategory("");
    } catch (error) {
      console.error("❌ Failed to save item:", error);
      alert("Failed to save item. Please check the form data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          ➕ New Item
        </h1>

        <form onSubmit={handleSave} ref={formRef}>
          <ImageUpload image={image} setImage={setImage} />

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                name="productName"
                placeholder="Product/Service Name *"
                value={formData.productName}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
                required
              />
              <button
                type="button"
                onClick={handleAutoFetchImage}
                disabled={isFetchingImage || !formData.productName.trim()}
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isFetchingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                Auto Image
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="shortCode"
              placeholder="Item Code / Short Code (Optional)"
              value={formData.shortCode}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              name="sellPrice"
              placeholder="Sell Price *"
              value={formData.sellPrice}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
              required
            />
            <select
              name="itemUnit"
              value={formData.itemUnit}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
            >
              <option value="">Item Unit</option>
              <option>Piece</option>
              <option>Kg</option>
              <option>Litre</option>
              <option>Pack</option>
            </select>
          </div>

          <CategorySelect
            categories={categories}
            setCategories={setCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <div className="mb-4">
            <input
              type="text"
              name="zones"
              placeholder="Zones (comma separated e.g. Dining, Takeaway)"
              value={formData.zones}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <input
              type="number"
              name="mrp"
              placeholder="MRP"
              value={formData.mrp}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
            <input
              type="number"
              name="purchasePrice"
              placeholder="Purchase Price"
              value={formData.purchasePrice}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div className="space-y-4 mb-6">
            <GstTaxSection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
            <ProductDetailsSection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
            <InventorySection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
            <DisplaySection
              openSection={openSection}
              toggleSection={toggleSection}
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-blue-700 transition"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "SAVE"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

