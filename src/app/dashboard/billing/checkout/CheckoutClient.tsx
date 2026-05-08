"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock, Trash2, Play, X, Search, ChevronDown, User, Printer, ArrowLeft,
  Save, PauseCircle, RefreshCw, Eye, ZoomIn, ZoomOut, Plus,
  LayoutGrid, Columns, StickyNote, Layers, Utensils, ShoppingBag, Truck, Star, Zap
} from "lucide-react";
import { calculateDiscount } from "@/lib/discount-utils";
import { toast } from "sonner";
import { kravy } from "@/lib/sounds";
import { WhatsAppBillButton } from "@/components/WhatsAppBillButton";
import { useAuthContext } from "@/components/AuthContext";
import PrintTemplates from "@/components/printing/PrintTemplates";
import BillPreview from "@/components/printing/BillPreview";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

/* ================= TYPES ================= */

type MenuItem = {
  id: string;
  name: string;
  price: number;
  unit?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  gst?: number;
  hsnCode?: string;
  taxStatus?: string;
  zones?: string[];
  isVeg?: boolean;
  isEgg?: boolean;
};

type BillItem = {
  id: string;
  name: string;
  qty: number;
  rate: number;
  gst?: number | null;
  hsnCode?: string;
  taxStatus?: string;
};

function normalizeMenuItems(data: any[]): MenuItem[] {
  return (data || []).map((it: any) => {
    const sPrice = Number(it.sellingPrice);
    const bPrice = Number(it.price);
    const finalPrice = !isNaN(sPrice) && it.sellingPrice !== null ? sPrice : !isNaN(bPrice) ? bPrice : 0;
    return { ...it, price: finalPrice, gst: it.gst, hsnCode: it.hsnCode, taxStatus: it.taxStatus };
  });
}

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n: number, depth = 0): string => {
    if (depth > 10) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100, depth + 1) : '');
    if (n < 100000) return convert(Math.floor(n / 1000), depth + 1) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000, depth + 1) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000), depth + 1) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000, depth + 1) : '');
    return convert(Math.floor(n / 10000000), depth + 1) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000, depth + 1) : '');
  };

  if (isNaN(num) || !isFinite(num)) return '';
  if (num === 0) return 'Zero Only';
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);
  
  let result = convert(integerPart) + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + convert(decimalPart) + ' Paise';
  }
  return result + ' Only';
};

/* ================= SUB-COMPONENTS ================= */

const MenuItemCard = ({ m, items, addToCart, reduceFromCart }: { 
  m: MenuItem, 
  items: BillItem[], 
  addToCart: (item: MenuItem) => void, 
  reduceFromCart: (id: string) => void 
}) => {
  const inCart = items.find((i) => i.id === m.id);
  return (
    <div
      onClick={() => addToCart(m)}
      className={`group relative border rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-200 bg-[var(--kravy-surface)] flex flex-col
        hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]
        ${inCart
          ? "border-[var(--kravy-brand)] shadow-md shadow-indigo-500/10"
          : "border-[var(--kravy-border)] hover:border-[var(--kravy-brand)]"
        }`}
    >
      <div
        className="relative w-full bg-[var(--kravy-bg)] overflow-hidden flex-shrink-0 border-b border-[var(--kravy-border)]/50"
        style={{ height: "90px" }}
      >
        <img
          src={m.imageUrl || "/no-image.png"}
          alt={m.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = "/no-image.png"; }}
        />
        {inCart && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white
            text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/40
            border border-white/20 z-10">
            ×{inCart.qty}
          </div>
        )}
        {inCart && (
          <button
            onClick={(e) => { e.stopPropagation(); reduceFromCart(m.id); }}
            className="absolute top-2 right-2 bg-rose-500 text-white
              w-6 h-6 rounded-full flex items-center justify-center
              text-sm font-black hover:bg-rose-600 shadow-lg shadow-rose-500/40
              border border-white/20 transition-all hover:scale-110 z-10"
          >
            −
          </button>
        )}
      </div>

      <div className="p-2.5 md:p-3 flex flex-col gap-1.5 flex-shrink-0">
        <div className={`w-[14px] h-[14px] border-[1.5px] rounded-sm flex items-center justify-center ${m.isVeg && !m.name.includes("(NV)") && !m.name.toLowerCase().includes("egg") ? "border-green-600" : (m.isEgg || m.name.toLowerCase().includes("egg") || m.name.includes("(E)")) ? "border-amber-500" : "border-red-600"}`}>
            <div className={`w-[6px] h-[6px] rounded-full ${m.isVeg && !m.name.includes("(NV)") && !m.name.toLowerCase().includes("egg") ? "bg-green-600" : (m.isEgg || m.name.toLowerCase().includes("egg") || m.name.includes("(E)")) ? "bg-amber-500" : "bg-red-600"}`} />
        </div>
        <p className={`text-[11px] md:text-xs font-bold leading-snug line-clamp-2 transition-colors
          ${inCart ? "text-[var(--kravy-brand)]" : "text-[var(--kravy-text-primary)] group-hover:text-[var(--kravy-brand)]"}`}>
          {m.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}
        </p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs md:text-sm font-black text-emerald-500 whitespace-nowrap">
            ₹{m.price.toFixed(2)}
          </p>
          {m.unit && (
            <p className="text-[9px] uppercase font-black text-[var(--kravy-text-muted)] tracking-wider truncate">
              {m.unit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickAddCard = ({ cat, onClick }: { cat: { id: string, name: string }, onClick: () => void }) => {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="group relative border-2 border-dashed border-[var(--kravy-border)] rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-200 bg-[var(--kravy-bg-2)]/50 flex flex-col items-center justify-center gap-2
        hover:border-[var(--kravy-brand)] hover:bg-[var(--kravy-brand)]/5 hover:shadow-lg active:scale-[0.97] h-full min-h-[140px]"
    >
       <div className="w-10 h-10 rounded-full bg-[var(--kravy-brand)]/10 flex items-center justify-center group-hover:bg-[var(--kravy-brand)] group-hover:text-white transition-all">
          <span className="text-xl font-black">+</span>
       </div>
       <div className="text-center px-2">
         <p className="text-[10px] font-black text-[var(--kravy-text-primary)] uppercase tracking-wider">Quick Add</p>
         <p className="text-[9px] font-bold text-[var(--kravy-text-muted)] group-hover:text-[var(--kravy-brand)]">to {cat.name}</p>
       </div>
    </div>
  );
};

const QuickAddAddonChip = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-2 px-4 py-1.5 border border-dashed border-indigo-300 dark:border-indigo-700 
        bg-indigo-50/20 dark:bg-indigo-900/10 rounded-full text-indigo-400 dark:text-indigo-600
        hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
    >
       <Plus size={12} strokeWidth={3} />
       <span className="text-[10px] font-black uppercase tracking-wider">Add new addon</span>
    </button>
  );
};

/* ================= PAGE ================= */

export default function CheckoutClient() {
  /* ================= BUSINESS PROFILE ================= */
  const [business, setBusiness] = useState<{
    businessName: string;
    businessTagLine?: string;
    gstNumber?: string;
    businessAddress?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    upi?: string;
    logoUrl?: string;
    taxEnabled?: boolean;
    taxRate?: number;
    upiQrEnabled?: boolean;
    fssaiNumber?: string;
    fssaiEnabled?: boolean;
    hsnEnabled?: boolean;
    perProductTaxEnabled?: boolean;
    collectCustomerName?: boolean;
    requireCustomerName?: boolean;
    collectCustomerPhone?: boolean;
    requireCustomerPhone?: boolean;
    collectCustomerAddress?: boolean;
    requireCustomerAddress?: boolean;
    enableKOTWithBill?: boolean;
    enableMenuQRInBill?: boolean;
    enableDeliveryCharges?: boolean;
    deliveryChargeAmount?: number;
    deliveryGstEnabled?: boolean;
    deliveryGstRate?: number;
    enablePackagingCharges?: boolean;
    packagingChargeAmount?: number;
    packagingGstEnabled?: boolean;
    packagingGstRate?: number;
    lastTokenNumber?: number;
    userId?: string;
    syncQuickPosWithKitchen?: boolean;
    multiZoneMenuEnabled?: boolean;
    posCashEnabled?: boolean;
    posUpiEnabled?: boolean;
    posCardEnabled?: boolean;
    posHoldEnabled?: boolean;
    posSaveEnabled?: boolean;
    posPreviewEnabled?: boolean;
    posKotEnabled?: boolean;
  } | null>(null);

  /* ================= CATEGORY + SEARCH ================= */
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeZone, setActiveZone] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryLayout, setCategoryLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [addonGroups, setAddonGroups] = useState<any[]>([]);

  // Load layout preference
  useEffect(() => {
    const saved = localStorage.getItem('pos_category_layout');
    if (saved === 'vertical' || saved === 'horizontal') {
      setCategoryLayout(saved);
    }
  }, []);

  // Save layout preference
  useEffect(() => {
    localStorage.setItem('pos_category_layout', categoryLayout);
  }, [categoryLayout]);
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const kotRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeBillId = searchParams.get("resumeBillId");
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [syncedOrderId, setSyncedOrderId] = useState<string | null>(null);

  /* ================= HELD BILLS & PREVIEW STATE ================= */
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [heldBillsLoading, setHeldBillsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSavedBillId, setLastSavedBillId] = useState<string | null>(null);
  const { user: authUser } = useAuthContext();
  const menuCacheKey = `kravy_menu_${business?.userId || authUser?.businessId || authUser?.id || "default"}`;
  const userRole = authUser?.type || null;
  const userPermissions = authUser?.permissions || [];
  
  const [previewZoom, setPreviewZoom] = useState(1);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [quickAddCat, setQuickAddCat] = useState<{ id: string, name: string } | null>(null);
  const [quickAddAddonGroup, setQuickAddAddonGroup] = useState<any | null>(null);
  const [quickAddTaxStatus, setQuickAddTaxStatus] = useState("Without Tax");
  const [quickAddGst, setQuickAddGst] = useState(0);
  const [showAddCategory, setShowAddCategory] = useState(false);

  /* ================= PARTIES (CUSTOMERS) STATE ================= */
  const [parties, setParties] = useState<any[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const customerSectionRef = useRef<HTMLDivElement>(null);
  const checkoutSidebarRef = useRef<HTMLDivElement>(null);

  /* ================= TABLES STATE ================= */
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("POS");
  const [orderType, setOrderType] = useState<"DINING" | "TAKEAWAY" | "DELIVERY">("DINING");
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [manualDeliveryCharge, setManualDeliveryCharge] = useState<number>(0);
  const [manualPackagingCharge, setManualPackagingCharge] = useState<number>(0);

  const resetForm = () => {
    setItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setOrderNotes("");
    setSelectedParty(null);
    setUpiTxnRef("");
    setPaymentMode("Cash");
    setPaymentStatus("Paid");
    setBuyerGSTIN("");
    setPlaceOfSupply("");
    setAppliedOffer(null);
    setDiscountCode("");
    setDiscountAmt(0);
    setIsKotPrinted(false);
    setTokenNumber(null);
    setKotNumbers([]);
    setServiceCharge(0);
    setManualDeliveryCharge(0);
    setManualPackagingCharge(0);
    setSelectedTable("POS");
    setOrderType("DINING");
    
    // Generate new bill number for next session
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    setBillNumber(`SV-${dateStr}-${rand}`);
    setBillDate(now.toLocaleString());
    setSyncedOrderId(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideSuggestions = suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node);
      const isOutsideCustomerSection = customerSectionRef.current && !customerSectionRef.current.contains(event.target as Node);
      const isOutsideSidebar = checkoutSidebarRef.current && !checkoutSidebarRef.current.contains(event.target as Node);
      
      if (isOutsideSuggestions && isOutsideCustomerSection && isOutsideSidebar) {
        setCustomerSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchParties() {
    try {
      const res = await fetch("/api/parties");
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.parties || []);
        const normalized = arr.map((p: any) => ({
          ...p,
          id: p.id || p._id
        }));
        setParties(normalized);
      }
    } catch (e) {
      console.error("Failed to fetch parties:", e);
    }
  }

  async function fetchHeldBills() {
    try {
      setHeldBillsLoading(true);
      const res = await fetch("/api/bill-manager", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const onlyHeld = (data.bills || []).filter((b: any) => b.isHeld);
        setHeldBills(onlyHeld);
      }
    } catch (err) {
      console.error("Fetch held bills error", err);
    } finally {
      setHeldBillsLoading(false);
    }
  }

  async function fetchTables() {
    try {
      const res = await fetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch tables:", e);
    }
  }

  useEffect(() => { 
    fetchHeldBills();
    fetchParties();
    fetchTables();
  }, []);

  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);
  const [kotNumbers, setKotNumbers] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 🏷️ COMPACT INVOICE NUMBER (Max 16 chars for GST Compliance)
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}${ (now.getMonth() + 1).toString().padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    setBillNumber(`SV-${dateStr}-${rand}`); 
    setBillDate(new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\//g, '|').replace(',', ' -'));
  }, []);

  const [prevWalletBalance, setPrevWalletBalance] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Consolidated initialization fetch with Caching
  useEffect(() => {
    async function initPos() {
      // 1. Try to load from Cache first for instant UI
      const cachedMenu =
        localStorage.getItem(menuCacheKey) ||
        localStorage.getItem("kravy_menu_default") ||
        Object.keys(localStorage)
          .find((key) => key.startsWith("kravy_menu_") && localStorage.getItem(key))
          ?.split("\n")
          .map((key) => localStorage.getItem(key))[0] ||
        null;

      if (cachedMenu) {
        try {
          const parsed = JSON.parse(cachedMenu);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenuItems(parsed);
            setMenuLoading(false); // Hide spinner immediately
          }
        } catch (e) { console.error("Cache parse error", e); }
      }

      try {
        // 2. Parallel fetch for latest data
        const [itemsRes, catsRes, addonsRes] = await Promise.all([
          fetch("/api/menu/items"),
          fetch("/api/categories"),
          fetch("/api/menu-editor/addon-groups")
        ]);

        let finalItems: MenuItem[] = [];

        // Process items
        if (itemsRes.ok) {
          const data = await itemsRes.json();
          const mapped = normalizeMenuItems(data || []);
          finalItems = mapped;
          setMenuItems(mapped);
          
          // Save to cache for next time
          localStorage.setItem(menuCacheKey, JSON.stringify(mapped));

          // Auto-derive categories
          setCategoriesList(prev => {
             const newList = [...prev];
             mapped.forEach((it: any) => {
               if (it.category && !newList.find(c => c.id === it.category.id)) {
                 newList.push({ id: it.category.id, name: it.category.name });
               }
             });
             return newList;
          });
        }

        // Process categories
        if (catsRes.ok) {
          const data = await catsRes.json();
          setCategoriesList(prev => {
            const merged = [...prev];
            data.forEach((c: any) => {
              if (!merged.find(m => m.id === c.id)) merged.push(c);
            });
            return merged;
          });
        }

        // Process addons
        if (addonsRes.ok) {
          const data = await addonsRes.json();
          setAddonGroups(data || []);
        }

      } catch (err) {
        console.error("POS INIT ERROR:", err);
      } finally {
        setMenuLoading(false);
      }
    }
    initPos();
  }, [menuCacheKey]);

  // Compute available zones only from items that have them (to hide empty zones)
  useEffect(() => {
    const itemZones = menuItems.flatMap(i => i.zones || []).filter(Boolean);
    const uniqueZones = Array.from(new Set(itemZones));
    setAvailableZones(uniqueZones.sort());
  }, [menuItems]);

  useEffect(() => {
    if (!resumeBillId) return;
    async function loadHeldBill() {
      try {
        const res = await fetch(`/api/bill-manager/${resumeBillId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const bill = data.bill ?? data;
        setActiveBillId(bill.id);
        setItems(bill.items.map((i: any) => ({ 
          id: i.id, 
          name: i.name, 
          qty: i.qty, 
          rate: i.rate,
          gst: i.gst,
          hsnCode: i.hsnCode,
          taxStatus: i.taxStatus || "Without Tax"
        })));
        setCustomerName(bill.customerName || "");
        setCustomerPhone(bill.customerPhone || "");
        setPaymentMode(bill.paymentMode);
        setPaymentStatus(bill.paymentStatus);
        setUpiTxnRef(bill.upiTxnRef || "");
        setBuyerGSTIN(bill.buyerGSTIN || "");
        setPlaceOfSupply(bill.placeOfSupply || "");
        const table = bill.tableName || "POS";
        setSelectedTable(table);
        if (table === "TAKEAWAY") setOrderType("TAKEAWAY");
        else if (table === "DELIVERY") setOrderType("DELIVERY");
        else setOrderType("DINING");
        setOrderNotes(bill.notes || bill.auditNote || "");
        setServiceCharge(bill.serviceCharge || 0);
        setManualDeliveryCharge(bill.deliveryCharges || 0);
        setManualPackagingCharge(bill.packagingCharges || 0);
      } catch (err) {
        console.error("RESUME BILL ERROR:", err);
      }
    }
    loadHeldBill();
  }, [resumeBillId]);

  useEffect(() => {
    const tableId = searchParams.get("tableId");
    const tableName = searchParams.get("tableName");
    const orderId = searchParams.get("orderId");
    const returnTo = searchParams.get("returnTo");

    if (tableName) {
      setSelectedTable(tableName);
      setOrderType("DINING");
    }

    if (orderId) {
      async function loadActiveOrder() {
        // ✅ Instant Edit Handoff: Check for cached order first
        const cachedStr = sessionStorage.getItem("quick_pos_handoff_order");
        if (cachedStr) {
          try {
            const cachedOrder = JSON.parse(cachedStr);
            if (cachedOrder.id === orderId) {
              setSyncedOrderId(cachedOrder.id);
              setItems(cachedOrder.items.map((i: any) => ({
                id: i.itemId || i.id,
                name: i.name,
                qty: Number(i.quantity || i.qty || 0),
                rate: Number(i.price || i.rate || 0),
                gst: i.gst,
                taxStatus: i.taxStatus || "Without Tax",
                isNew: false
              })));
              setCustomerName(cachedOrder.customerName || "");
              setCustomerPhone(cachedOrder.customerPhone || "");
              setOrderNotes(cachedOrder.notes || "");
              setKotNumbers(cachedOrder.kotNumbers || (cachedOrder.tokenNumber ? [cachedOrder.tokenNumber] : []));
              setTokenNumber(cachedOrder.tokenNumber || null);
              
              // Clean up to avoid stale data on next visit
              sessionStorage.removeItem("quick_pos_handoff_order");
            }
          } catch (e) { console.error("Cache parse error", e); }
        }

        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (!res.ok) return;
          const data = await res.json();
          const order = data.order;
          if (!order) return;
          
          setSyncedOrderId(order.id);
          setItems(order.items.map((i: any) => ({
            id: i.itemId || i.id,
            name: i.name,
            qty: Number(i.quantity || i.qty || 0),
            rate: Number(i.price || i.rate || 0),
            gst: i.gst,
            taxStatus: i.taxStatus || "Without Tax",
            isNew: false 
          })));
          setCustomerName(order.customerName || "");
          setCustomerPhone(order.customerPhone || "");
          setOrderNotes(order.notes || "");
          setKotNumbers(order.kotNumbers || (order.tokenNumber ? [order.tokenNumber] : []));
          setTokenNumber(order.tokenNumber || null);
        } catch (err) {
          console.error("LOAD ORDER ERROR:", err);
        }
      }
      loadActiveOrder();
    }
  }, [searchParams]);

  // Sync activeZone with selectedTable's zone
  useEffect(() => {
    if (business?.multiZoneMenuEnabled && selectedTable && tables.length > 0) {
      if (["POS", "TAKEAWAY", "DELIVERY"].includes(selectedTable)) {
        // Use localStorage default if available for direct visits
        const savedDefault = localStorage.getItem('kravy_default_zone');
        if (savedDefault && availableZones.includes(savedDefault)) {
          if (activeZone !== savedDefault) setActiveZone(savedDefault);
        } else if (activeZone !== "All") {
          setActiveZone("All");
        }
      } else {
        const tableObj = tables.find(t => t.name === selectedTable);
        const tZone = tableObj?.zone;
        if (tZone && tZone.toUpperCase() !== "DEFAULT" && activeZone === "All") {
          setActiveZone(tZone);
        }
      }
    }
  }, [selectedTable, tables, business?.multiZoneMenuEnabled]);

  // Only show categories that have items in them (respecting zone filter)
  const categories = useMemo(() => {
    const itemsInZone = menuItems.filter(i => {
      // 1. Manual Zone Filter (Highest Priority)
      if (activeZone !== "All") {
        const hasSelectedZone = i.zones?.includes(activeZone);
        const isGlobal = !i.zones || i.zones.length === 0;
        return hasSelectedZone || isGlobal;
      }

      // 2. Auto Table Zone Filter (Only if manual filter is "All")
      if (business?.multiZoneMenuEnabled && selectedTable && !["POS", "TAKEAWAY", "DELIVERY"].includes(selectedTable) && tables.length > 0) {
        const tableObj = tables.find(t => t.name === selectedTable);
        if (tableObj && tableObj.zone && tableObj.zone.toUpperCase() !== "DEFAULT") {
          const zone = tableObj.zone;
          const hasTableZone = i.zones?.includes(zone);
          const isGlobal = !i.zones || i.zones.length === 0;
          return hasTableZone || isGlobal;
        }
      }

      return true;
    });

    const catNames = itemsInZone.map(i => i.category?.name || "Others");
    return Array.from(new Set(catNames)).filter(Boolean).sort();
  }, [menuItems, activeZone, selectedTable, tables, business?.multiZoneMenuEnabled]);

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter((i) => activeCategory === "All" ? true : i.category?.name === activeCategory)
      .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((i) => {
        // 1. Manual Zone Filter (Highest Priority)
        if (activeZone !== "All") {
          const hasSelectedZone = i.zones?.includes(activeZone);
          const isGlobal = !i.zones || i.zones.length === 0;
          return hasSelectedZone || isGlobal;
        }

        // 2. Auto-filter if a table is selected (Only if manual filter is "All")
        if (!business?.multiZoneMenuEnabled || !selectedTable || ["POS", "TAKEAWAY", "DELIVERY"].includes(selectedTable)) return true;
        if (tables.length === 0) return true;

        const tableObj = tables.find(t => t.name === selectedTable);
        if (!tableObj || !tableObj.zone || tableObj.zone.toUpperCase() === "DEFAULT") return true;

        const zone = tableObj.zone;
        return !i.zones || i.zones.length === 0 || i.zones.includes(zone);
      });
  }, [menuItems, activeCategory, searchQuery, business, selectedTable, tables, activeZone]);

  /* ================= CART ================= */
  function addToCart(item: MenuItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        kravy.click(); // item already in cart — just increase qty
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1, isNew: true } : i);
      }
      kravy.add(); // new item added — bigger pop sound
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        qty: 1, 
        rate: item.price,
        gst: item.gst ?? null,
        hsnCode: item.hsnCode || "",
        taxStatus: item.taxStatus || "Without Tax",
        isNew: true
      }];
    });
  }

  function reduceFromCart(itemId: string) {
    setItems((prev) => {
      const current = prev.find(i => i.id === itemId);
      if (current && current.qty <= 1) kravy.trash(); // last one removed
      else kravy.remove(); // qty decreased
      return prev.map((i) => i.id === itemId ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0);
    });
  }

  function addAddonToCart(addon: any, groupName: string, catContext?: string) {
    kravy.add();
    const fullName = catContext 
      ? `${addon.name} (${groupName} - ${catContext})`
      : `${addon.name} (${groupName})`;
    
    setItems((prev) => {
      const existing = prev.find(i => i.name === fullName);
      if (existing) {
        return prev.map(i => i.name === fullName ? { ...i, qty: i.qty + 1 } : i);
      }
      return [
        ...prev,
        {
          id: `addon-${Math.random().toString(36).substr(2, 9)}`,
          name: fullName,
          qty: 1,
          rate: addon.price || 0,
          gst: null,
          hsnCode: "",
          taxStatus: "Without Tax"
        }
      ];
    });
    toast.success(`Added ${addon.name}`);
  }

  function reduceAddonFromCart(addonName: string, groupName: string, catContext?: string) {
    const fullName = catContext 
      ? `${addonName} (${groupName} - ${catContext})`
      : `${addonName} (${groupName})`;
      
    setItems((prev) => {
      const existing = prev.find(i => i.name === fullName);
      if (!existing) return prev;
      
      if (existing.qty <= 1) {
        kravy.trash();
        return prev.filter(i => i.name !== fullName);
      } else {
        kravy.remove();
        return prev.map(i => i.name === fullName ? { ...i, qty: i.qty - 1 } : i);
      }
    });
  }

  /* ================= CUSTOMER ================= */
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isKotPrinted, setIsKotPrinted] = useState(false);
  const [buyerGSTIN, setBuyerGSTIN] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [selectedParty, setSelectedParty] = useState<any | null>(null);

  const handleCustomerPhoneChange = (val: string) => {
    setCustomerPhone(val);
    setSelectedParty(null); // Clear selected party if manual edit
    if (val.length >= 3) {
      const filtered = parties.filter(p => p.phone.includes(val) || p.name.toLowerCase().includes(val.toLowerCase()));
      setCustomerSuggestions(filtered.slice(0, 5));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    setSelectedParty(null); // Clear selected party if manual edit
    if (val.length >= 2) {
      const filtered = parties.filter(p => p.name.toLowerCase().includes(val.toLowerCase()) || p.phone.includes(val));
      setCustomerSuggestions(filtered.slice(0, 5));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (p: any) => {
    setCustomerName(p.name);
    setCustomerPhone(p.phone || "");
    setCustomerAddress(p.address || "");
    setSelectedParty(p);
    setCustomerSuggestions([]);
    kravy.success();
    toast.success(`Customer ${p.name} selected`, {
      description: "Details auto-filled instantly",
      duration: 2000
    });
  };

  /* ================= CART STATE ================= */
  const [items, setItems] = useState<BillItem[]>([]);
  const inc = (id: string) => { kravy.click(); setItems((s) => s.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i)); };
  const dec = (id: string) => { 
    const item = items.find(i => i.id === id);
    if (item && item.qty === 1 && userRole === "STAFF" && !userPermissions.includes("pos-delete-item")) {
      toast.error("Permission Denied: Cannot delete item from cart.");
      return;
    }
    kravy.remove(); 
    setItems((s) => s.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0)); 
  };
  const remove = (id: string) => { 
    if (userRole === "STAFF" && !userPermissions.includes("pos-delete-item")) {
      toast.error("Permission Denied: Cannot delete item from cart.");
      return;
    }
    kravy.trash(); 
    setItems((s) => s.filter((i) => i.id !== id)); 
  };



  console.log("DEBUG POS RENDER - business.enableKOTWithBill:", business?.enableKOTWithBill);

  useEffect(() => {
    async function fetchBusinessProfile() {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setBusiness({
            businessName: data.businessName,
            businessTagLine: data.businessTagLine,
            gstNumber: data.gstNumber,
            businessAddress: data.businessAddress,
            district: data.district,
            state: data.state,
            pinCode: data.pinCode,
            upi: data.upi,
            logoUrl: data.logoUrl,
            taxEnabled: data.taxEnabled ?? true,
            taxRate: data.taxRate ?? 5.0,
            fssaiNumber: data.fssaiNumber,
            fssaiEnabled: data.fssaiEnabled ?? false,
            perProductTaxEnabled: data.perProductTaxEnabled ?? false,
            collectCustomerName: data.collectCustomerName ?? true,
            requireCustomerName: data.requireCustomerName ?? false,
            collectCustomerPhone: data.collectCustomerPhone ?? true,
            requireCustomerPhone: data.requireCustomerPhone ?? false,
            collectCustomerAddress: data.collectCustomerAddress ?? false,
            requireCustomerAddress: data.requireCustomerAddress ?? false,
            enableKOTWithBill: data.enableKOTWithBill ?? false,
            enableMenuQRInBill: data.enableMenuQRInBill ?? false,
            enableDeliveryCharges: data.enableDeliveryCharges ?? false,
            deliveryChargeAmount: data.deliveryChargeAmount ?? 0,
            deliveryGstEnabled: data.deliveryGstEnabled ?? false,
            deliveryGstRate: data.deliveryGstRate ?? 0,
            enablePackagingCharges: data.enablePackagingCharges ?? false,
            packagingChargeAmount: data.packagingChargeAmount ?? 0,
            packagingGstEnabled: data.packagingGstEnabled ?? false,
            packagingGstRate: data.packagingGstRate ?? 0,
            lastTokenNumber: data.lastTokenNumber ?? 0,
            userId: data.userId,
            syncQuickPosWithKitchen: data.syncQuickPosWithKitchen ?? false,
            posCashEnabled: data.posCashEnabled ?? true,
            posUpiEnabled: data.posUpiEnabled ?? true,
            posCardEnabled: data.posCardEnabled ?? true,
            posCounterEnabled: data.posCounterEnabled ?? true,
            posWalletEnabled: data.posWalletEnabled ?? true,
            posHoldEnabled: data.posHoldEnabled ?? true,
            posSaveEnabled: data.posSaveEnabled ?? true,
            posPreviewEnabled: data.posPreviewEnabled ?? true,
            posKotEnabled: data.posKotEnabled ?? true,
            multiZoneMenuEnabled: data.multiZoneMenuEnabled ?? false,
            greetingMessage: data.greetingMessage,
            contactPersonPhone: data.contactPersonPhone,
            contactPhone: data.contactPhone,
            businessPhone: data.businessPhone,
            businessAddressSize: data.businessAddressSize,
            tokenNumberSize: data.tokenNumberSize,
            businessNameSize: data.businessNameSize,
          });
          console.log("DEBUG POS API RESPONSE - enableKOTWithBill:", data.enableKOTWithBill);
          console.log("DEBUG POS API FULL DATA:", data);
        }
      } catch (err) {
        console.error("Business profile load failed", err);
      }
    }
    fetchBusinessProfile();
  }, []);

  const handleDeposit = async (amount: number) => {
    if (isSaving) return;
    if (!selectedParty) {
      console.warn("[WALLET] No customer selected for deposit");
      return;
    }
    setIsSaving(true);
    console.log("[WALLET] Starting Deposit:", { amount, partyId: selectedParty.id, partyName: selectedParty.name });
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deposit",
          partyId: selectedParty.id,
          amount,
          description: "Pos Deposit"
        })
      });
      console.log("[WALLET] API Response Status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[WALLET] Success Data:", data);
        toast.success(`₹${amount} added successfully!`, {
          description: `New balance: ₹${data.balance.toFixed(2)}`
        });
        setSelectedParty({ ...selectedParty, walletBalance: data.balance });
        // update main list
        setParties(pts => pts.map(p => (p.id === selectedParty.id || p._id === selectedParty.id) ? { ...p, walletBalance: data.balance } : p));
      } else {
        const errData = await res.json();
        console.error("[WALLET] API Error:", errData);
        toast.error("Failed to deposit money");
      }
    } catch (err) {
      console.error("[WALLET] Network/Catch Error:", err);
      toast.error("Network error during deposit");
    } finally {
      setIsSaving(false);
    }
  };

  /* ================= TOTALS ================= */
  const taxActive = business?.taxEnabled ?? true;
  const perProductEnabled = business?.perProductTaxEnabled ?? false;
  const globalRate = business?.taxRate ?? 5.0;

  // 1. Calculate Gross Subtotal
  const subtotal = Number(items.reduce((a, i) => a + (i.qty * i.rate), 0).toFixed(2));
  
  // 🎟️ DISCOUNT LOGIC (Moved up to be available for tax calculation)
  const [discountCode, setDiscountCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [customDiscountValue, setCustomDiscountValue] = useState(""); 
  const [customDiscountType, setCustomDiscountType] = useState<'PERCENT' | 'FLAT'>('FLAT');
  const [discountMode, setDiscountMode] = useState<'PROMO' | 'INSTANT' | 'CHARGES'>('PROMO');

  // Recalculate discount whenever items or applied offer change
  useEffect(() => {
    if (appliedOffer) {
      const d = calculateDiscount(appliedOffer, subtotal, items);
      setDiscountAmt(d);
    } else if (customDiscountValue) {
      const val = parseFloat(customDiscountValue) || 0;
      if (customDiscountType === 'PERCENT') {
        const d = (subtotal * val) / 100;
        setDiscountAmt(d);
      } else {
        setDiscountAmt(val);
      }
    } else {
      setDiscountAmt(0);
    }
  }, [items, subtotal, appliedOffer, customDiscountValue, customDiscountType]);

  // 2. Net Taxable Amount after Discount
  const netSubtotal = subtotal - discountAmt;
  const discountRatio = subtotal > 0 ? netSubtotal / subtotal : 1;

  const taxGroups = items.reduce((acc: any, item) => {
    // 🥇 PRIORITY LOGIC: Product GST > Default GST
    let rate = 0;
    if (perProductEnabled && item.gst !== undefined && item.gst !== null) {
      rate = item.gst;
    } else if (taxActive) {
      rate = globalRate;
    }
    
    // Apply pro-rata discount to item gross before tax calculation
    const gross = (item.qty * item.rate) * discountRatio;
    let taxable = gross;
    let gst = 0;

    if (item.taxStatus === "With Tax") {
      taxable = gross / (1 + rate / 100);
      gst = gross - taxable;
    } else {
      taxable = gross;
      gst = (gross * rate) / 100;
    }

    const isInterState = placeOfSupply && business?.state && 
      placeOfSupply.trim().toLowerCase() !== business.state.trim().toLowerCase();

    if (!acc[rate]) acc[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    acc[rate].taxable += taxable;
    
    if (isInterState) {
      acc[rate].igst += gst;
    } else {
      acc[rate].cgst += gst / 2;
      acc[rate].sgst += gst / 2;
    }
    acc[rate].totalTax += gst;
    return acc;
  }, {});

  const taxBreakup = Object.values(taxGroups).map((g: any) => ({
    rate: g.rate,
    taxable: Number(g.taxable.toFixed(2)),
    cgst: Number(g.cgst.toFixed(2)),
    sgst: Number(g.sgst.toFixed(2)),
    igst: Number((g.igst || 0).toFixed(2)),
    totalTax: Number(g.totalTax.toFixed(2))
  }));

  const totalTaxable = Number(taxBreakup.reduce((a, b) => a + b.taxable, 0).toFixed(2));
  const totalGst = Number(taxBreakup.reduce((a, b) => a + b.totalTax, 0).toFixed(2));
  
  const handleApplyCoupon = async () => {
    if (!discountCode.trim()) return;
    try {
      const res = await fetch(`/api/discounts`);
      if (res.ok) {
        const data = await res.json();
        const found = (data.offers || []).find((o: any) => o.code === discountCode.toUpperCase() && o.isActive);
        
        if (!found) {
          toast.error("Invalid or expired coupon code");
          return;
        }

        if (found.minOrderValue && subtotal < found.minOrderValue) {
          toast.error(`Minimum order of ₹${found.minOrderValue} required`);
          return;
        }

        setAppliedOffer(found);
        toast.success(`Coupon ${found.code} applied!`);
      }
    } catch (err) {
      toast.error("Failed to verify coupon");
    }
  };

  const removeCoupon = () => {
    setAppliedOffer(null);
    setDiscountCode("");
    setDiscountAmt(0);
  };

  // Additional Charges Calculation
  const deliveryCharge = manualDeliveryCharge || ((orderType === "DELIVERY" && business?.enableDeliveryCharges) ? (business?.deliveryChargeAmount || 0) : 0);
  const deliveryGst = (deliveryCharge > 0 && business?.deliveryGstEnabled) ? (deliveryCharge * (business?.deliveryGstRate || 0) / 100) : 0;

  const packagingCharge = manualPackagingCharge || (((orderType === "DELIVERY" || orderType === "TAKEAWAY") && business?.enablePackagingCharges) ? (business?.packagingChargeAmount || 0) : 0);
  const packagingGst = (packagingCharge > 0 && business?.packagingGstEnabled) ? (packagingCharge * (business?.packagingGstRate || 0) / 100) : 0;

  const totalCharges = deliveryCharge + packagingCharge + serviceCharge;
  const totalChargesGst = deliveryGst + packagingGst;

  // Final total is now simply net taxable + GST + additional charges + tax on charges
  const finalTotal = Number((totalTaxable + totalGst + totalCharges + totalChargesGst).toFixed(2));
  const gstAmount = Number((totalGst + totalChargesGst).toFixed(2));
  
  // 🛡️ SMART AUDIT LOG: Detect if default was used
  const hasAuditNotes = items.some(i => perProductEnabled && (i.gst === undefined || i.gst === null || i.gst === 0));
  const auditNote = hasAuditNotes ? "Some items used global default tax rate." : null;

  /* ================= PAYMENT STATE ================= */
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Card" | "Pay on Counter" | "Wallet">("Cash");
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Paid");
  const [upiTxnRef, setUpiTxnRef] = useState("");

  /* ================= UPI ================= */
  const UPI_ID = business?.upi || "";
  const UPI_NAME = business?.businessName || "Store";
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${finalTotal.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  useEffect(() => {
    if (paymentMode === "Cash" || paymentMode === "Card" || paymentMode === "Pay on Counter") setPaymentStatus("Paid");
  }, [paymentMode]);

  /* ================= DELETE CONFIRM MODAL ================= */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resumeConfirmId, setResumeConfirmId] = useState<string | null>(null);

  /* ================= SAVE BILL ================= */
  async function saveBill(isHeld: boolean = false) {
    if (isSaving) return null;
    if (items.length === 0) { alert("No items to save"); return null; }
    
    setIsSaving(true);
    try {
      // 🛡️ GST VALIDATION SYSTEM
      if (buyerGSTIN) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(buyerGSTIN)) {
          alert("Invalid Buyer GSTIN Format (Expected 15 chars, e.g. 07AAAAA0000A1Z5)");
          setIsSaving(false);
          return null;
        }
      }

      // Recalculate discount ratio for validation
      const validationDiscountRatio = subtotal > 0 ? (subtotal - discountAmt) / subtotal : 1;

      // Recalculation Check (Compare UI result with calculated result)
      let reCalcGst = items.reduce((sum, item) => {
        let rate = 0;
        if (perProductEnabled && item.gst !== undefined && item.gst !== null) {
          rate = item.gst;
        } else if (taxActive) {
          rate = globalRate;
        }

        // Important: Apply discount ratio here as well
        const gross = (item.qty * item.rate) * validationDiscountRatio;
        if (item.taxStatus === "With Tax") return sum + (gross - (gross / (1 + rate / 100)));
        return sum + ((gross * rate) / 100);
      }, 0);

      // ✅ ADDED: Include charges GST in recalculation
      reCalcGst += (deliveryGst + packagingGst);

      if ((taxActive || perProductEnabled) && Math.abs(reCalcGst - gstAmount) > 1) { // Increased tolerance to 1 for rounding
        alert(`Safety Check: GST Calculation Mismatch! System: ₹${gstAmount.toFixed(2)}, Calculated: ₹${reCalcGst.toFixed(2)}`);
        setIsSaving(false);
        return null;
      }

      // 👛 WALLET PAYMENT LOGIC
      if (paymentMode === "Wallet") {
        if (!selectedParty) {
          alert("Please select a registered customer to use Wallet payment.");
          setIsSaving(false);
          return null;
        }
        if ((selectedParty.walletBalance || 0) < finalTotal) {
          alert(`Insufficient Wallet Balance!\nRequired: ₹${finalTotal.toFixed(2)}\nAvailable: ₹${(selectedParty.walletBalance || 0).toFixed(2)}`);
          setIsSaving(false);
          return null;
        }

        try {
          const walletRes = await fetch("/api/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "payment",
              partyId: selectedParty.id,
              amount: finalTotal,
              description: `Order #${billNumber}`
            })
          });

          const wData = await walletRes.json();

          if (!walletRes.ok) {
            alert(wData.error || "Wallet deduction failed");
            setIsSaving(false);
            return null;
          }
          
          // Update local state balance
          if (wData.success) {
            setSelectedParty({ ...selectedParty, walletBalance: wData.balance });
          }
        } catch (err) {
          alert("Wallet system connection error");
          setIsSaving(false);
          return null;
        }
      }

      const payload = {
        items, 
        subtotal: Number(totalTaxable.toFixed(2)), 
        tax: Number(totalGst.toFixed(2)), 
        deliveryCharges: deliveryCharge,
        deliveryGst: deliveryGst,
        packagingCharges: packagingCharge,
        packagingGst: packagingGst,
        total: finalTotal,
        paymentMode, 
        paymentStatus: isHeld ? "HELD" : paymentStatus,
        upiTxnRef: paymentMode === "UPI" ? upiTxnRef : null,
        isHeld, customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        notes: orderNotes,
        auditNote: orderNotes, // Fallback for schema compatibility
        isKotPrinted: isKotPrinted === true,
        tableName: selectedTable,
        zoneName: selectedTable !== "POS" ? tables.find(t => t.name === selectedTable)?.zone : null,
        buyerGSTIN: buyerGSTIN || null,
        placeOfSupply: placeOfSupply || null,
        discountAmount: discountAmt,
        discountCode: appliedOffer?.code || null,
        deliveryCharges: deliveryCharge,
        packagingCharges: packagingCharge,
        serviceCharge: serviceCharge,
        kotNumbers,
        tokenNumber,
      };

      const url = resumeBillId ? `/api/bill-manager/${resumeBillId}` : "/api/bill-manager";
      const method = resumeBillId ? "PUT" : "POST";
      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload),
        keepalive: true // Guaranteed delivery even on print reload
      });
      if (!res.ok) { 
        const err = await res.json(); 
        alert(err.error || "Failed to save bill"); 
        setIsSaving(false);
        return null; 
      }
      const data = await res.json();
      // Refresh parties to include any new customer
      fetchParties();
      const savedBill = data.bill ?? data;
      if (Array.isArray(savedBill?.items)) {
        const serverItems = savedBill.items.map((i: any) => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          rate: i.rate,
          gst: i.gst,
          hsnCode: i.hsnCode,
          taxStatus: i.taxStatus || "Without Tax",
        }));
        const pricesChanged = serverItems.some((serverItem: BillItem) => {
          const localItem = items.find((item) => item.id === serverItem.id);
          return localItem && localItem.rate !== serverItem.rate;
        });

        if (pricesChanged) {
          setItems(serverItems);
          toast.info("Latest menu price applied before saving");
        }
      }
      if (savedBill?.id) setLastSavedBillId(savedBill.id);
      if (savedBill?.billNumber) setBillNumber(savedBill.billNumber);
      if (savedBill?.tokenNumber) {
        setTokenNumber(savedBill.tokenNumber);
        setBusiness(prev => prev ? { ...prev, lastTokenNumber: savedBill.tokenNumber } : prev);
      }

      // ✅ COMPETE LINKED ORDER (Prevent Duplicates in History)
      if (syncedOrderId && !isHeld) {
        try {
          await fetch("/api/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: syncedOrderId, status: "COMPLETED" })
          });
        } catch (compErr) {
          console.error("Failed to complete linked order:", compErr);
        }
      }
      
      setIsSaving(false);
      return savedBill;
    } catch (err) {
      console.error("Save bill error", err);
      alert("Something went wrong");
      setIsSaving(false);
      return null;
    }
  }

  /* ================= DELETE HELD BILL ================= */
  async function deleteHeldBill(id: string) {
    try {
      const res = await fetch(`/api/bill-manager/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (resumeBillId === id) {
          router.replace("/dashboard/billing/checkout");
          resetForm();
        }
        return true;
      } else { alert("Failed to delete bill"); return false; }
    } catch (err) {
      console.error("Delete bill error", err);
      return false;
    }
  }

  /* ================= PRINT RECEIPT ================= */
  function printReceipt(forceBoth = false) {
    if (!receiptRef.current) { alert("Nothing to print"); return; }
    
    // Capture content IMMEDIATELY before state can be cleared by the caller
    const billHtml = receiptRef.current.innerHTML;
    const kotHtml = kotRef.current?.innerHTML || "";

    const isKOTEnabled = forceBoth || business?.enableKOTWithBill;
    console.log("PRINT TRIGGERED - KOT:", isKOTEnabled);

    if (isKOTEnabled && kotHtml) {
      // 1. Print KOT
      runPrintJob("kot", kotHtml, () => {
        // 2. Print Bill after KOT
        setTimeout(() => {
          runPrintJob("bill", billHtml);
        }, 1000); 
      });
    } else {
      runPrintJob("bill", billHtml);
    }
  }

  const printActualBill = () => {
    if (receiptRef.current) runPrintJob("bill", receiptRef.current.innerHTML);
  };

  const printKOT = () => {
    if (kotRef.current) runPrintJob("kot", kotRef.current.innerHTML);
  };

  const handlePrintKOT = async () => {
    if (isSaving || items.length === 0) return;
    setIsSaving(true);

    try {
      kravy.ping();
      setIsKotPrinted(true);

      // Sync and Redirect Logic
      if (business?.syncQuickPosWithKitchen || searchParams.get("returnTo")) {
        const orderData = {
          orderId: syncedOrderId || undefined,
          tableId: selectedTable !== "POS" ? (tables.find(t => t.name === selectedTable)?.id || searchParams.get("tableId")) : null,
          items: items.map(it => ({
            itemId: it.id, // Use consistent ID
            name: it.name,
            price: Number(it.rate || 0),
            quantity: Number(it.qty || 0),
            rate: Number(it.rate || 0), // Include both for compatibility
            qty: Number(it.qty || 0),
            addedAt: new Date().toISOString(),
            taxStatus: it.taxStatus || "Without Tax",
            gst: it.gst ?? 0,
            isNew: !!it.isNew,
            variants: (it as any).variants || [],
            kotNumber: (it as any).kotNumber
          })),
          total: Number(finalTotal.toFixed(2)),
          status: "PREPARING",
          customerName: customerName,
          customerPhone: customerPhone,
          customerAddress: customerAddress,
          notes: orderNotes,
          isKotPrinted: true,
        };

        const res = await fetch("/api/orders", {
          method: syncedOrderId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData)
        });

        if (res.ok) {
          const data = await res.json();
          if (!syncedOrderId) setSyncedOrderId(data.id || data._id);
          
          // ✅ Sync tokens from server
          if (data.kotNumbers) setKotNumbers(data.kotNumbers);
          if (data.tokenNumber) setTokenNumber(data.tokenNumber);
          
          // ✅ Print KOT AFTER sync and state update
          setTimeout(() => {
            printKOT();
            toast.success("KOT Printed & Order Synced! ✅");
          }, 500);

          const returnTo = searchParams.get("returnTo");
          if (returnTo) {
            setTimeout(() => {
              const currentOrderId = data.id || syncedOrderId || data._id;
              const tableId = searchParams.get("tableId");
              const tableName = searchParams.get("tableName");
              
              const query = new URLSearchParams();
              if (tableId) query.set("tableId", tableId);
              if (tableName) query.set("tableName", tableName);
              if (currentOrderId) query.set("orderId", currentOrderId);
              query.set("refresh", Date.now().toString());

              router.push(`/dashboard/terminal?${query.toString()}`);
            }, 100);
            return;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("SYNC_ERROR:", errData);
          toast.error(`Sync Failed: ${errData.error || "Unknown Error"}. Please try again.`);
        }
      } else {
        // ✅ Local print if sync is off
        printKOT();
        toast.success("KOT Printed (Local) ✅");
      }
    } catch (err: any) {
      console.error("KOT_PRINT_CRITICAL_ERROR:", err);
      toast.error(`Critical Error: ${err.message || "Failed to sync with kitchen"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const runPrintJob = (type: "kot" | "bill", html: string, callback?: () => void) => {
    const containerId = `print-container-${type}`;
    const styleId = `print-style-${type}`;

    // Clean any existing ones
    document.getElementById(containerId)?.remove();
    document.getElementById(styleId)?.remove();

    // Create Style
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @media print {
        html, body { 
          height: auto !important; 
          overflow: visible !important; 
          margin: 0 !important;
          padding: 0 !important;
        }
        body > *:not(#${containerId}) { display: none !important; }
        @page { margin: 0; size: auto; }
        #${containerId} {
          display: block !important;
          width: 100% !important;
          max-width: 58mm !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 auto !important;
          padding: 2mm 4% 20px 4% !important; 
          background: #fff !important;
          color: #000 !important;
          font-family: 'Courier New', Courier, monospace !important;
          font-weight: 700 !important;
          position: relative !important;
          box-sizing: border-box !important;
        }
        * { 
          color: #000 !important; 
          border-color: #000 !important; 
          overflow: visible !important;
        }
        img { 
          filter: grayscale(100%) contrast(300%) !important; 
          max-width: 100% !important;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Create Container
    const container = document.createElement("div");
    container.id = containerId;
    container.className = "font-mono text-[11px] leading-tight font-bold";
    container.innerHTML = html;
    document.body.appendChild(container);

    if (type === "kot") setIsKotPrinted(true);

    // Give more time (300ms) for items to render and images to prepare
    setTimeout(() => {
      window.print();
      
      // Delay cleanup to ensure spooler finishes reading the DOM
      setTimeout(() => {
        if (document.body.contains(container)) container.remove();
        if (document.head.contains(style)) style.remove();
        if (callback) callback();
      }, 2500); 
    }, 300);
  }

  /* ================= QUICK ADD ITEM ================= */
  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quickAddCat) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const imageUrl = formData.get("imageUrl") as string;

    if (!name || !price) {
      toast.error("Name and price are required");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticItem: MenuItem = {
      id: tempId,
      name,
      price: Number(price),
      category: { id: quickAddCat.id, name: quickAddCat.name },
      unit: "pcs",
      description: description || null,
      imageUrl: imageUrl || null
    };

    // 🚀 OPTIMISTIC UPDATE: Update UI immediately
    setMenuItems(prev => [optimisticItem, ...prev]);
    setQuickAddCat(null); // Close modal right away
    setQuickAddTaxStatus("Without Tax");
    setQuickAddGst(0);
    kravy.success(); // Play sound immediately
    toast.success(`"${name}" adding to ${quickAddCat.name}...`);

    // Fire & Forget (Backend update in background)
    (async () => {
      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            price: Number(price),
            categoryId: quickAddCat.id,
            description: description || null,
            imageUrl: imageUrl || null,
            taxStatus: quickAddTaxStatus,
            gst: Number(quickAddGst)
          }),
        });

        if (res.ok) {
          const newItem = await res.json();
          // Replace temp item with real item from DB
          setMenuItems(prev => prev.map(it => it.id === tempId ? {
            ...newItem,
            price: Number(newItem.sellingPrice || newItem.price),
            category: { id: quickAddCat.id, name: quickAddCat.name }
          } : it));
        } else {
          // Revert on failure
          setMenuItems(prev => prev.filter(it => it.id !== tempId));
          toast.error(`Failed to save "${name}" formally. Removed from view.`);
        }
      } catch (err) {
        console.error("Optimistic add error:", err);
        setMenuItems(prev => prev.filter(it => it.id !== tempId));
        toast.error(`Connection issue while saving "${name}".`);
      }
    })();
  };

  /* ================= QUICK ADD ADDON ================= */
  const handleQuickAddAddon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quickAddAddonGroup) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const categoryIds = formData.getAll("categoryIds") as string[];

    if (!name || !price) {
      toast.error("Name and price are required");
      return;
    }

    const newAddonItem = {
      id: `it-${Date.now()}`,
      name,
      price: Number(price),
      foodType: "veg",
      categoryIds: categoryIds // Add item-level category mapping
    };

    const currentItems = Array.isArray(quickAddAddonGroup.items) 
      ? quickAddAddonGroup.items 
      : (typeof quickAddAddonGroup.items === 'string' ? JSON.parse(quickAddAddonGroup.items) : []);

    const updatedGroup = {
      ...quickAddAddonGroup,
      items: [...currentItems, newAddonItem]
    };

    setAddonGroups(prev => prev.map(ag => ag.id === quickAddAddonGroup.id ? updatedGroup : ag));
    setQuickAddAddonGroup(null);
    kravy.success();
    toast.success(`"${name}" addon added to ${quickAddAddonGroup.name}`);

    try {
      await fetch(`/api/menu-editor/addon-groups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGroup)
      });
    } catch (err) {
      console.error("Failed to persist addon:", err);
      toast.error("Cloud sync failed for this addon.");
    }
  };

  const handleQuickAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    if (!name) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategoriesList(prev => [...prev, newCat]);
        setShowAddCategory(false);
        toast.success(`Category "${name}" Created`);
        kravy.success();
        setActiveCategory(name);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create category");
      }
    } catch (err) {
      toast.error("Failed to create category");
    }
  };

  /* ================= UI ================= */
  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  /* ================= PERMISSIONS HELPER ================= */
  const canEdit = userRole === "ADMIN" || 
                  userRole === "MASTER" || 
                  userRole === "SELLER" || 
                  userPermissions.includes("edit") || 
                  userPermissions.includes("EDIT_POS");

  return (
    <div className="h-[calc(100vh-72px)] bg-[var(--kravy-bg)] flex flex-col overflow-hidden">

      {/* ════════════════════════════════════════════
          MAIN LAYOUT
      ════════════════════════════════════════════ */}
      <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] gap-0 flex-1 min-h-0">

        {/* ══════════════════════════════
            LEFT — MENU CATALOG
        ══════════════════════════════ */}
        <div className="flex flex-col min-h-0 overflow-hidden border-r border-[var(--kravy-border)]">

          {/* Left Header — STICKY & SOLID */}
          <div className="bg-[var(--kravy-surface)] border-b border-[var(--kravy-border)] px-4 md:px-6 py-3 flex-shrink-0 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {searchParams.get("returnTo") && (
                  <button 
                    onClick={() => { kravy.click(); router.push(searchParams.get("returnTo")!); }}
                    className="h-8 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm"
                  >
                    <ArrowLeft size={14} strokeWidth={3} /> Back
                  </button>
                )}
                <h2 className="text-sm md:text-base font-black text-[var(--kravy-text-primary)] tracking-tight whitespace-nowrap">
                  Browse Products
                </h2>
                <button
                  onClick={() => { kravy.toggle(); setCategoryLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal'); }}
                  className="p-1 px-2 rounded-lg border border-[var(--kravy-border)] hover:bg-slate-100 transition-all flex items-center gap-1.5 text-[9px] font-black text-[var(--kravy-text-secondary)] shrink-0 bg-white shadow-sm"
                  title="Switch Layout"
                >
                  {categoryLayout === 'horizontal' ? <Columns size={10} /> : <LayoutGrid size={10} />}
                  <span className="hidden sm:inline tracking-widest">{categoryLayout === 'horizontal' ? 'SIDEBAR' : 'CHIPS'}</span>
                </button>
                {business && (
                  <div className="hidden lg:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg shrink-0">
                    <Layers size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter whitespace-nowrap">Tokens: {business.lastTokenNumber || 0}</span>
                  </div>
                )}

                {/* Compact Zone Dropdown */}
                {business?.multiZoneMenuEnabled && availableZones.length > 0 && (
                  <div className="relative group/zone ml-1">
                    <button className="h-8 px-3 rounded-lg border border-[var(--kravy-border)] bg-white hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm">
                      <Layers size={12} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight truncate max-w-[80px]">
                        {activeZone === "All" ? "Global" : activeZone}
                      </span>
                      <ChevronDown size={10} className="text-indigo-400" />
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[var(--kravy-border)] rounded-xl shadow-2xl p-1 z-50 opacity-0 invisible group-hover/zone:opacity-100 group-hover/zone:visible transition-all">
                       <button
                         onClick={() => { 
                           kravy.click(); 
                           setActiveZone("All");
                           if (confirm("Set Global as default for direct visits?")) {
                             localStorage.setItem('kravy_default_zone', 'All');
                             toast.success("Default zone updated");
                           }
                         }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all mb-0.5 last:mb-0 ${activeZone === "All" ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-slate-600"}`}
                       >
                         All Items (Global)
                       </button>
                       {availableZones.map(zone => (
                         <div key={zone} className="relative group/zoneitem">
                           <button
                             onClick={() => { kravy.click(); setActiveZone(zone); }}
                             className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all mb-0.5 last:mb-0 ${activeZone === zone ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-slate-600"}`}
                           >
                             {zone}
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               localStorage.setItem('kravy_default_zone', zone);
                               toast.success(`${zone} set as default`);
                             }}
                             className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/zoneitem:opacity-100 p-1 hover:text-indigo-600 text-[8px] font-black"
                           >
                             SET DEFAULT
                           </button>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Combined Search & New Category — COMPACT */}
              <div className="flex items-center gap-1.5 flex-1 max-w-[400px]">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-faint)]" size={12} />
                  <input
                    type="text"
                    placeholder="Search menu…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)]
                      h-8 pl-8 pr-3 rounded-lg text-xs outline-none
                      focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                      transition-all placeholder:text-[var(--kravy-text-muted)] font-bold"
                  />
                </div>
                {canEdit && (
                  <button
                    onClick={() => setQuickAddCat(categoriesList[0] || { id: "others", name: "Others" })}
                    className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center shrink-0"
                    title="Quick Add Item"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuLoading(true);
                    fetch(`/api/menu/items?t=${Date.now()}`, { cache: "no-store" })
                      .then(r => r.json())
                      .then(data => {
                        const mapped = normalizeMenuItems(data || []);
                        setMenuItems(mapped);
                        localStorage.setItem(menuCacheKey, JSON.stringify(mapped));
                        toast.success("Catalog Updated");
                      })
                      .catch(() => toast.error("Catalog sync failed"))
                      .finally(() => setMenuLoading(false));
                  }}
                  className="h-8 w-8 rounded-lg border border-[var(--kravy-border)] hover:bg-indigo-50 hover:text-indigo-600 transition-all bg-[var(--kravy-bg)] flex items-center justify-center shrink-0"
                  title="Refresh Menu"
                >
                  <RefreshCw size={12} className={menuLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Horizontal Categories — ONLY IF layout is horizontal */}
            {categoryLayout === 'horizontal' && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-2">
                <button
                  onClick={() => { kravy.click(); setActiveCategory("All"); }}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${activeCategory === "All"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-[var(--kravy-surface)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-indigo-500/50"
                    }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { kravy.click(); setActiveCategory(cat); }}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${activeCategory === cat
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-[var(--kravy-surface)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-indigo-500/50"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
                {canEdit && (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="px-2 py-1 rounded-full bg-white border border-[var(--kravy-border)] text-indigo-600 hover:border-indigo-500 transition-all shadow-sm shrink-0"
                    title="Add Category"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* 🚀 CATEGORY SLIDER (Vertical Rail) — Fixed on Side — ONLY IF layout is vertical */}
            {categoryLayout === 'vertical' && (
              <div className="w-[120px] md:w-[150px] flex-shrink-0 bg-[var(--kravy-bg-2)] border-r border-[var(--kravy-border)] overflow-y-auto no-scrollbar py-3 px-2 space-y-2">
                <button
                  onClick={() => { kravy.click(); setActiveCategory("All"); }}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all text-center flex flex-col items-center gap-1 ${activeCategory === "All"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-[var(--kravy-surface)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-indigo-500/50"
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === "All" ? "bg-white" : "bg-indigo-500/20"}`} />
                  All
                </button>
                
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { kravy.click(); setActiveCategory(cat); }}
                    className={`w-full py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all text-center flex flex-col items-center gap-1 ${activeCategory === cat
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-[var(--kravy-surface)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-indigo-500/50"
                      }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === cat ? "bg-white" : "bg-indigo-500/20"}`} />
                    <span className="truncate w-full">{cat}</span>
                  </button>
                ))}

                {canEdit && (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--kravy-border)] text-[var(--kravy-text-muted)] hover:text-indigo-500 hover:border-indigo-400/50 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">New Section</span>
                  </button>
                )}
              </div>
            )}

            {/* Menu Grid: Scrollable Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden md:scrollbar-default scrollbar-hide">
            {menuLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[var(--kravy-brand)]/20 border-t-[var(--kravy-brand)] rounded-full animate-spin" />
                  <p className="text-sm font-bold text-[var(--kravy-text-muted)] animate-pulse">Loading menu…</p>
                </div>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="opacity-40">
                  <Search size={40} className="mx-auto mb-3 text-[var(--kravy-text-muted)]" />
                  <p className="font-bold text-[var(--kravy-text-primary)]">No items found</p>
                  <p className="text-xs mt-1 text-[var(--kravy-text-muted)]">Try a different search or category</p>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-4 md:px-5 py-4 scrollbar-hide">
                {activeCategory === "All" && !searchQuery ? (
                  categories.map(catName => {
                    const catItems = filteredMenuItems.filter(i => (i.category?.name || "Others") === catName);
                    if (catItems.length === 0) return null;
                    const catObj = categoriesList.find(c => c.name === catName) || { id: "others", name: catName };

                    return (
                      <div key={catName} className="mb-8">
                        <h3 className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-3">
                          <span className="w-8 h-[2px] bg-indigo-500/20 rounded-full" /> 
                          {catName} 
                          <span className="ml-auto text-[9px] font-bold px-2 py-0.5 bg-[var(--kravy-bg-2)] rounded border border-[var(--kravy-border)]">
                            {catItems.length} Items
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 mb-6">
                          {catItems.map(m => (
                            <MenuItemCard key={m.id} m={m} items={items} addToCart={addToCart} reduceFromCart={reduceFromCart} />
                          ))}
                            {canEdit && <QuickAddCard cat={catObj} onClick={() => { setQuickAddCat(catObj); toast.info(`Quick add to ${catName}`); }} />}
                        </div>

                        {/* Category Addons Section */}
                        {(() => {
                          const catAddons = addonGroups.filter(ag => (ag.categoryIds || []).includes(catObj.id));
                          if (catAddons.length === 0) return null;
                          return (
                            <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl p-4 border border-dashed border-indigo-200 dark:border-indigo-900/50">
                              <div className="flex items-center gap-2 mb-3">
                                 <Layers size={12} className="text-indigo-500" />
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">Category Addons (Linked to {catName})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {catAddons.map(ag => (
                                   <div key={ag.id} className="flex flex-col gap-2">
                                     <div className="flex flex-wrap gap-1.5 items-center">
                                     {(Array.isArray(ag.items) ? ag.items : [])
                                       .filter((addon: any) => {
                                         if (addon.categoryIds && addon.categoryIds.length > 0) {
                                           return addon.categoryIds.includes(catObj.id);
                                         }
                                         return true;
                                       })
                                       .map((addon: any, idx: number) => {
                                       const fullName = `${addon.name} (${ag.name} - ${catName})`;
                                       const inCart = items.find(i => i.name === fullName);
                                       return (
                                        <div key={idx} className="relative group/addon">
                                         <button
                                           onClick={() => addAddonToCart(addon, ag.name, catName)}
                                           className={`flex items-center border-[0.5px] rounded-full overflow-hidden shadow-sm transition-all group
                                             ${inCart 
                                               ? 'bg-indigo-600 border-indigo-700 shadow-indigo-500/20 scale-[1.02]' 
                                               : 'bg-[#EEEDFE] dark:bg-indigo-950/40 border-[#AFA9EC] dark:border-indigo-800 hover:border-indigo-500 hover:shadow-md hover:scale-[1.02]'
                                             }`}
                                         >
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 border-r ${inCart ? 'border-white/20' : 'border-[#AFA9EC]/50 dark:border-indigo-800'}`}>
                                               {inCart ? (
                                                 <span className="text-[9px] font-black bg-white/20 px-1.5 rounded-md text-white mr-1 animate-in zoom-in-50 duration-300">x{inCart.qty}</span>
                                               ) : (
                                                 <Plus size={10} className="text-indigo-500 group-hover:text-indigo-700" />
                                               )}
                                               <span className={`text-[10px] font-black uppercase tracking-wide ${inCart ? 'text-white' : 'text-indigo-900 dark:text-indigo-100'}`}>{addon.name}</span>
                                            </div>
                                            <div className={`px-2.5 py-1.5 ${inCart ? 'bg-indigo-700' : 'bg-[#E5E3FC] dark:bg-indigo-900/60'}`}>
                                               <span className={`text-[9px] font-black tracking-tighter ${inCart ? 'text-white/90' : 'text-indigo-700 dark:text-indigo-300'}`}>₹{addon.price}</span>
                                            </div>
                                         </button>
                                         {inCart && (
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); reduceAddonFromCart(addon.name, ag.name, catName); }}
                                              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-90 transition-all z-10 border border-white dark:border-slate-900"
                                            >
                                              <X size={10} strokeWidth={4} />
                                            </button>
                                         )}
                                        </div>
                                      )})}
                                       {canEdit && <QuickAddAddonChip onClick={() => setQuickAddAddonGroup(ag)} />}
                                     </div>
                                   </div>
                                 ))}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {filteredMenuItems.map((m) => (
                        <MenuItemCard key={m.id} m={m} items={items} addToCart={addToCart} reduceFromCart={reduceFromCart} />
                      ))}
                      {!searchQuery && activeCategory !== "All" && (() => {
                        const fallbackCat = categoriesList.find(c => c.name.toLowerCase() === activeCategory.toLowerCase()) || { id: "", name: activeCategory };
                        if (canEdit) return <QuickAddCard cat={fallbackCat} onClick={() => setQuickAddCat(fallbackCat)} />;
                        return null;
                      })()}
                    </div>

                      {/* Category Addons Section */}
                      {(() => {
                        const currentCat = categoriesList.find(c => c.name.toLowerCase() === activeCategory.toLowerCase());
                        if (!currentCat) return null;
                        const catAddons = addonGroups.filter(ag => (ag.categoryIds || []).includes(currentCat.id));
                        if (catAddons.length === 0) return null;
                        return (
                          <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl p-4 border border-dashed border-indigo-200 dark:border-indigo-900/50 mt-6">
                             <div className="flex items-center gap-2 mb-3">
                               <Layers size={12} className="text-indigo-500" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">Addons for {activeCategory}</span>
                             </div>
                             <div className="flex flex-wrap gap-4">
                               {catAddons.map(ag => (
                                 <div key={ag.id} className="flex flex-col gap-2">
                                   <div className="flex flex-wrap gap-1.5 items-center">
                                     {(Array.isArray(ag.items) ? ag.items : [])
                                       .filter((addon: any) => {
                                         if (addon.categoryIds && addon.categoryIds.length > 0) {
                                           return addon.categoryIds.includes(currentCat.id);
                                         }
                                         return true;
                                       })
                                       .map((addon: any, idx: number) => {
                                       const fullName = `${addon.name} (${ag.name} - ${activeCategory})`;
                                       const inCart = items.find(i => i.name === fullName);
                                       return (
                                        <div key={idx} className="relative group/addon">
                                         <button
                                           onClick={() => addAddonToCart(addon, ag.name, activeCategory)}
                                           className={`flex items-center border-[0.5px] rounded-full overflow-hidden shadow-sm transition-all group
                                             ${inCart 
                                               ? 'bg-indigo-600 border-indigo-700 shadow-indigo-500/20 scale-[1.02]' 
                                               : 'bg-[#EEEDFE] dark:bg-indigo-950/40 border-[#AFA9EC] dark:border-indigo-800 hover:border-indigo-500 hover:shadow-md hover:scale-[1.02]'
                                             }`}
                                         >
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 border-r ${inCart ? 'border-white/20' : 'border-[#AFA9EC]/50 dark:border-indigo-800'}`}>
                                               {inCart ? (
                                                 <span className="text-[9px] font-black bg-white/20 px-1.5 rounded-md text-white mr-1 animate-in zoom-in-50 duration-300">x{inCart.qty}</span>
                                               ) : (
                                                 <Plus size={10} className="text-indigo-500 group-hover:text-indigo-700" />
                                               )}
                                               <span className={`text-[10px] font-black uppercase tracking-wide ${inCart ? 'text-white' : 'text-indigo-900 dark:text-indigo-100'}`}>{addon.name}</span>
                                            </div>
                                            <div className={`px-2.5 py-1.5 ${inCart ? 'bg-indigo-700' : 'bg-[#E5E3FC] dark:bg-indigo-900/60'}`}>
                                               <span className={`text-[9px] font-black tracking-tighter ${inCart ? 'text-white/90' : 'text-indigo-700 dark:text-indigo-300'}`}>₹{addon.price}</span>
                                            </div>
                                         </button>
                                         {inCart && (
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); reduceAddonFromCart(addon.name, ag.name, activeCategory); }}
                                              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-90 transition-all z-10 border border-white dark:border-slate-900"
                                            >
                                              <X size={10} strokeWidth={4} />
                                            </button>
                                         )}
                                        </div>
                                      )})}
                                     {canEdit && <QuickAddAddonChip onClick={() => setQuickAddAddonGroup(ag)} />}
                                   </div>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )
                      })()}

                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


        {/* ══════════════════════════════
            RIGHT — CART / BILLING
        ══════════════════════════════ */}
        <div 
          ref={checkoutSidebarRef}
          className="bg-[var(--kravy-surface)] flex flex-col border-l border-[var(--kravy-border)] overflow-hidden min-h-0
          fixed bottom-0 left-0 right-0 md:static
          rounded-t-3xl md:rounded-none
          shadow-2xl md:shadow-none
          border-t-2 md:border-t-0
          transition-transform duration-300
          z-30 md:z-auto
          max-h-[82vh] md:max-h-none"
          style={{ transform: 'translateY(0)' }}
        >

          {/* Mobile Drag Handle */}
          <div className="lg:hidden flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0">
            <div className="w-10 h-1 bg-[var(--kravy-border)] rounded-full mb-2" />
            <div className="w-full flex items-center justify-between px-5 pb-2">
              <div>
                <p className="text-sm font-black text-[var(--kravy-text-primary)]">Billing Invoice</p>
                <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-0.5">
                  {totalItems} items · ₹{finalTotal.toFixed(2)}
                </p>
              </div>
              <span className="text-xl font-black text-[var(--kravy-brand)]">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Cart Header */}
          <div className="border-b border-[var(--kravy-border)] px-4 md:px-5 py-3.5 bg-[var(--kravy-bg)]/40 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[var(--kravy-text-primary)] hidden md:block">Billing Invoice</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black px-2.5 py-1 bg-[var(--kravy-brand)]/10 text-[var(--kravy-brand)] rounded-lg uppercase tracking-wider">
                    {billNumber}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--kravy-text-muted)] hidden sm:block">{billDate}</span>
                </div>
              </div>

              {/* Note & Held Bills Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotesModal(true)}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${orderNotes ? "bg-blue-500/10 border-blue-500/25 text-blue-500" : "bg-[var(--kravy-surface)] border-[var(--kravy-border)] text-[var(--kravy-text-muted)]"}`}
                  title="Add Order Note"
                >
                  <StickyNote size={17} className={orderNotes ? "animate-pulse" : ""} />
                </button>

                <button
                  onClick={() => { setShowHeldBills(true); fetchHeldBills(); }}
                  className="relative group flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-500
                    border border-amber-500/25 rounded-xl hover:bg-amber-500/20 transition-all"
                  title="View Held Bills"
                >
                  <Clock size={16} />
                  <span className="text-xs font-black hidden sm:block">Held</span>
                  {heldBills.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-black
                      w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--kravy-surface)] shadow">
                      {heldBills.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Order Type Selection - COMPACT */}
          <div className="px-4 md:px-5 py-2 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg)]/20">
            <div className="flex items-center gap-1 p-0.5 bg-[var(--kravy-bg)] rounded-xl border border-[var(--kravy-border)] shadow-inner">
              {[
                { id: 'DINING', label: 'Dining', icon: <Utensils size={13} />, activeClass: 'bg-indigo-600 shadow-indigo-500/20' },
                { id: 'TAKEAWAY', label: 'Takeaway', icon: <ShoppingBag size={13} />, activeClass: 'bg-amber-600 shadow-amber-500/20' },
                { id: 'DELIVERY', label: 'Delivery', icon: <Truck size={13} />, activeClass: 'bg-rose-600 shadow-rose-500/20' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    kravy.click();
                    setOrderType(type.id as any);
                    if (type.id !== 'DINING') {
                      setSelectedTable(type.id);
                    } else if (selectedTable === 'TAKEAWAY' || selectedTable === 'DELIVERY') {
                      setSelectedTable('POS');
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all
                    ${orderType === type.id 
                      ? `${type.activeClass} text-white shadow-md scale-[1.01]` 
                      : `text-[var(--kravy-text-muted)] hover:bg-slate-50`}`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
            
            {orderType === 'DINING' && (
              <div className="mt-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-1.5">
                  <LayoutGrid size={11} className="text-[var(--kravy-brand)]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">Table</span>
                </div>
                <select
                  value={selectedTable === 'TAKEAWAY' || selectedTable === 'DELIVERY' ? 'POS' : selectedTable}
                  onChange={(e) => { kravy.click(); setSelectedTable(e.target.value); }}
                  className="bg-white border border-[var(--kravy-brand)]/20 text-[var(--kravy-brand)]
                    px-2.5 py-1 rounded-md text-[9px] font-black outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                    transition-all cursor-pointer shadow-sm min-w-[100px]"
                >
                  <option value="POS">Counter</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Scrollable Middle Content (Customer + Items) */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">
            {/* Customer Section Toggle */}
            <button
              onClick={() => setShowCustomer(!showCustomer)}
              className="px-4 md:px-5 py-3 text-left border-b border-[var(--kravy-border)]
                flex items-center justify-between hover:bg-[var(--kravy-bg)] transition-colors flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <User size={13} className="text-[var(--kravy-text-muted)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">
                  Customer Details
                </span>
                {(customerName || customerPhone) && (
                  <span className="text-[10px] font-bold text-[var(--kravy-brand)] bg-[var(--kravy-brand)]/10 px-2 py-0.5 rounded-md">
                    {customerName || customerPhone}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--kravy-text-muted)] transition-transform duration-200 ${showCustomer ? "rotate-180" : ""}`}
              />
            </button>

            {showCustomer && (
              <div 
                ref={customerSectionRef}
                className="px-4 md:px-5 py-3 space-y-3 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg)]/30 flex-shrink-0 relative focus-within:z-10"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Name</label>
                    <input
                      placeholder="Customer name"
                      value={customerName}
                      autoComplete="off"
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      onFocus={() => {
                        handleCustomerNameChange(customerName);
                        setCustomerSuggestions([]);
                      }}
                      className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                        p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                        focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)] font-medium"
                    />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Phone</label>
                  <input
                    placeholder="Phone number"
                    value={customerPhone}
                    autoComplete="off"
                    onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                    onFocus={() => handleCustomerPhoneChange(customerPhone)}
                    className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                      p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                      focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)] font-mono"
                  />
                </div>

                {/* Suggestions Dropdown - MOVED HIGHER */}
                {customerSuggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute left-4 right-4 bg-[var(--kravy-surface)] border border-[var(--kravy-border-strong)] rounded-2xl shadow-2xl z-[60] mt-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ top: '115px' }} // Positioned below Name/Phone fields
                  >
                    <div className="p-2 border-b border-[var(--kravy-border)] bg-indigo-50/30">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest pl-1">Matching Customers</p>
                    </div>
                    {customerSuggestions.map((p, idx) => (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => selectCustomer(p)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-[var(--kravy-border)] last:border-0 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black text-sm text-[var(--kravy-text-primary)]">{p.name}</p>
                          <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-0.5">{p.phone}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <User size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
    
                 {selectedParty && (
                   <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl flex items-center justify-between">
                     <div>
                       <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Active Balance</p>
                       <p className="text-lg font-black text-indigo-600 mt-0.5">₹{selectedParty.walletBalance?.toFixed(2) || "0.00"}</p>
                     </div>
                     <button 
                       onClick={() => {
                         const amt = prompt("Enter amount to deposit (₹):");
                         if (amt && !isNaN(Number(amt))) {
                           handleDeposit(Number(amt));
                         }
                       }}
                       className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                     >
                       Add
                     </button>
                   </div>
                 )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Address</label>
                    <textarea
                      placeholder="Enter customer address..."
                      value={customerAddress}
                      onFocus={() => setCustomerSuggestions([])}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={2}
                      className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                        p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                        focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)] font-medium resize-none"
                    />
                  </div>

                {business?.taxEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Buyer GSTIN</label>
                      <input
                        placeholder="Customer GSTIN"
                        value={buyerGSTIN}
                        autoComplete="off"
                        onChange={(e) => setBuyerGSTIN(e.target.value.toUpperCase())}
                        className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                          p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                          focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)] uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Place of Supply</label>
                      <input
                        placeholder="e.g. Haryana"
                        value={placeOfSupply}
                        autoComplete="off"
                        onChange={(e) => setPlaceOfSupply(e.target.value)}
                        className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                          p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                          focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Cart Items List */}
            <div className="flex-1 px-4 md:px-5 py-3 space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-20 h-20 rounded-[32px] bg-[var(--kravy-brand)]/5 flex items-center justify-center mb-6 animate-pulse">
                    <ShoppingBag size={40} className="text-[var(--kravy-brand)]/20" />
                  </div>
                  <p className="font-black text-[var(--kravy-text-primary)] text-sm tracking-tight">Cart is empty</p>
                  <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-1 max-w-[180px] mx-auto uppercase tracking-widest leading-relaxed">
                    Select items from the menu to start a new billing session
                  </p>
                  
                  {/* Quick Insights (Placeholder for density) */}
                  <div className="mt-10 grid grid-cols-2 gap-3 w-full">
                    <div className="bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl p-3 text-left">
                       <p className="text-[8px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.1em] mb-1">Today's Sales</p>
                       <p className="text-sm font-black text-[var(--kravy-text-primary)] tracking-tighter">₹{subtotal.toFixed(0)}+</p>
                    </div>
                    <div className="bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl p-3 text-left">
                       <p className="text-[8px] font-black text-[var(--kravy-text-muted)] uppercase tracking-[0.1em] mb-1">Active KOTs</p>
                       <p className="text-sm font-black text-[var(--kravy-text-primary)] tracking-tighter">Running</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl
                        bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                        hover:border-[var(--kravy-brand)]/30 transition-all group shrink-0 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[var(--kravy-text-primary)] truncate text-sm">{i.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-black text-[var(--kravy-brand)]">
                            {i.qty} × ₹{Number(i.rate ?? 0).toFixed(2)}
                          </p>
                          {(taxActive || perProductEnabled) && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-[var(--kravy-brand)]/5 text-[var(--kravy-brand)] border border-[var(--kravy-brand)]/10 rounded-md uppercase tracking-tighter">
                              GST: {(perProductEnabled && i.gst !== null) ? i.gst : globalRate}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => dec(i.id)}
                          className="w-7 h-7 rounded-lg border border-[var(--kravy-border)] bg-[var(--kravy-surface)]
                            text-[var(--kravy-text-secondary)] font-black text-base flex items-center justify-center
                            hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-all"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-black text-sm text-[var(--kravy-text-primary)]">{i.qty}</span>
                        <button
                          onClick={() => inc(i.id)}
                          className="w-7 h-7 rounded-lg border border-[var(--kravy-border)] bg-[var(--kravy-surface)]
                            text-[var(--kravy-text-secondary)] font-black text-base flex items-center justify-center
                            hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-500 transition-all"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-[var(--kravy-text-primary)] text-sm min-w-[52px] text-right flex-shrink-0">
                        ₹{(Number(i.qty ?? 0) * Number(i.rate ?? 0)).toFixed(2)}
                      </span>

                      <button
                        onClick={() => remove(i.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center
                          text-[var(--kravy-text-muted)] hover:bg-rose-50 hover:text-rose-500 transition-all flex-shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Subtle Density Filler at bottom of list */}
                  <div className="pt-4 pb-2 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
                       <Zap size={10} className="text-amber-500" />
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kravy Smart Terminal Active</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Checkout Footer (Pinned at Bottom) */}
          <div className="border-t border-[var(--kravy-border)] px-4 md:px-5 py-2.5 bg-[var(--kravy-surface)] space-y-2.5 shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">

            {/* Totals - Dynamic Height */}
            <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">
                  <span>Items Base</span>
                  <span>₹{totalTaxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  <span>GST Total {(taxActive || perProductEnabled) ? `(Active)` : `(Disabled)`}</span>
                  <span>+ ₹{gstAmount.toFixed(2)}</span>
                </div>
                {(deliveryCharge > 0 || packagingCharge > 0 || serviceCharge > 0) && (
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-600">
                    <span>Other Charges</span>
                    <span>+ ₹{(totalCharges + totalChargesGst).toFixed(2)}</span>
                  </div>
                )}
              </div>
            <div className="flex justify-between items-center border-b border-dashed border-[var(--kravy-border)] pb-2 gap-4">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 flex-1">
                <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-tighter leading-none">Sub: ₹{subtotal.toFixed(2)}</p>
                {discountAmt > 0 && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter leading-none">Disc: -₹{discountAmt.toFixed(2)}</p>}
                {(taxActive || perProductEnabled) && <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-tighter leading-none">Tax: ₹{gstAmount.toFixed(2)}</p>}
                {deliveryCharge > 0 && <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter leading-none">Del: ₹{deliveryCharge.toFixed(2)}</p>}
                {packagingCharge > 0 && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter leading-none">Pkg: ₹{packagingCharge.toFixed(2)}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest leading-none mb-0.5">PAYABLE</p>
                <p className="text-2xl font-black text-[var(--kravy-brand)] leading-none">₹{finalTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* 🎟️ ADJUSTMENTS SECTION (Discount / Charges) */}
            <div className="space-y-1.5">
              <div className="flex border border-[var(--kravy-border)] rounded-xl overflow-hidden p-0.5 bg-[var(--kravy-bg-2)]">
                 <button 
                  onClick={() => {
                    if (userRole === "STAFF" && !userPermissions.includes("pos-discount")) {
                      toast.error("Permission Denied: Cannot apply discounts.");
                      return;
                    }
                    setDiscountMode('PROMO');
                  }}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${discountMode === 'PROMO' ? 'bg-[var(--kravy-brand)] text-white' : 'text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)]'}`}
                 >
                   Promo
                 </button>
                 <button 
                  onClick={() => {
                    if (userRole === "STAFF" && !userPermissions.includes("pos-discount")) {
                      toast.error("Permission Denied: Cannot apply discounts.");
                      return;
                    }
                    setDiscountMode('INSTANT');
                  }}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${discountMode === 'INSTANT' ? 'bg-[var(--kravy-brand)] text-white' : 'text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)]'}`}
                 >
                   Discount
                 </button>
                 <button 
                  onClick={() => setDiscountMode('CHARGES')}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${discountMode === 'CHARGES' ? 'bg-indigo-600 text-white' : 'text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)]'}`}
                 >
                   Charges
                 </button>
              </div>

              {discountMode === 'CHARGES' ? (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 flex items-center border-r border-[var(--kravy-border)]">
                      <Truck size={10} className="text-slate-500" />
                    </div>
                    <input 
                      type="number"
                      placeholder="Delivery..."
                      value={manualDeliveryCharge || ""}
                      onChange={e => setManualDeliveryCharge(Number(e.target.value))}
                      className="bg-transparent text-[var(--kravy-text-primary)] px-2 py-1.5 w-full outline-none text-[10px] font-black"
                    />
                  </div>
                  <div className="flex bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 flex items-center border-r border-[var(--kravy-border)]">
                      <ShoppingBag size={10} className="text-slate-500" />
                    </div>
                    <input 
                      type="number"
                      placeholder="Package..."
                      value={manualPackagingCharge || ""}
                      onChange={e => setManualPackagingCharge(Number(e.target.value))}
                      className="bg-transparent text-[var(--kravy-text-primary)] px-2 py-1.5 w-full outline-none text-[10px] font-black"
                    />
                  </div>
                  <div className="flex bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 flex items-center border-r border-[var(--kravy-border)]">
                      <Star size={10} className="text-slate-500" />
                    </div>
                    <input 
                      type="number"
                      placeholder="Service..."
                      value={serviceCharge || ""}
                      onChange={e => setServiceCharge(Number(e.target.value))}
                      className="bg-transparent text-[var(--kravy-text-primary)] px-2 py-1.5 w-full outline-none text-[10px] font-black"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                   {discountMode === 'PROMO' ? (
                     <input 
                       placeholder="PROMO CODE..."
                       value={discountCode}
                       onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                       disabled={!!appliedOffer}
                       className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] px-3 py-1.5 flex-1 rounded-xl outline-none text-[10px] font-black tracking-widest uppercase"
                     />
                   ) : (
                     <div className="flex flex-1 bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-xl overflow-hidden shadow-sm">
                        <select 
                          value={customDiscountType}
                          onChange={(e) => { kravy.click(); setCustomDiscountType(e.target.value as 'PERCENT' | 'FLAT'); }}
                          className="bg-slate-100 dark:bg-slate-800 border-r border-[var(--kravy-border)] text-[var(--kravy-text-primary)] px-2.5 text-[10px] font-black outline-none cursor-pointer"
                        >
                          <option value="PERCENT">%</option>
                          <option value="FLAT">₹</option>
                        </select>
                        <input 
                          type="number"
                          placeholder="Amount..."
                          value={customDiscountValue}
                          onChange={e => setCustomDiscountValue(e.target.value)}
                          className="bg-transparent text-[var(--kravy-text-primary)] px-3 py-1.5 flex-1 outline-none text-[10px] font-black"
                        />
                     </div>
                   )}
                   <button 
                     onClick={appliedOffer || (discountMode === 'INSTANT' && customDiscountValue) ? removeCoupon : handleApplyCoupon}
                     className={`px-4 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                       appliedOffer || (discountMode === 'INSTANT' && customDiscountValue) 
                       ? "bg-rose-500 text-white" 
                       : "bg-[var(--kravy-brand)] text-white"
                     }`}
                   >
                     {appliedOffer || (discountMode === 'INSTANT' && customDiscountValue) ? "Clear" : "Apply"}
                   </button>
                </div>
              )}
            </div>

            {/* 💳 PAYMENT METHODS (Compact Grid) */}
            <div 
              className="grid gap-2 mb-4"
              style={{ 
                gridTemplateColumns: `repeat(${
                  (["Cash", "UPI", "Card", "Pay on Counter", "Wallet"] as const).filter(mode => {
                    if (mode === "Cash") return business?.posCashEnabled !== false;
                    if (mode === "UPI") return business?.posUpiEnabled !== false;
                    if (mode === "Card") return business?.posCardEnabled !== false;
                    if (mode === "Pay on Counter") return business?.posCounterEnabled !== false;
                    if (mode === "Wallet") return business?.posWalletEnabled !== false;
                    return true;
                  }).length
                }, 1fr)` 
              }}
            >
              {(["Cash", "UPI", "Card", "Pay on Counter", "Wallet"] as const)
                .filter(mode => {
                  if (mode === "Cash") return business?.posCashEnabled !== false;
                  if (mode === "UPI") return business?.posUpiEnabled !== false;
                  if (mode === "Card") return business?.posCardEnabled !== false;
                  if (mode === "Pay on Counter") return business?.posCounterEnabled !== false;
                  if (mode === "Wallet") return business?.posWalletEnabled !== false;
                  return true;
                })
                .map((mode) => (
                <button
                  key={mode}
                  onClick={() => { kravy.toggle(); setPaymentMode(mode); }}
                  className={`py-2 px-1 rounded-xl border-2 font-black text-[8px] transition-all flex flex-col items-center justify-center gap-1 ${paymentMode === mode
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-white border-slate-200 text-slate-900 hover:border-indigo-400 hover:bg-indigo-50/30"
                    }`}
                >
                  <span className="text-[14px] leading-none">{mode === "Cash" ? "💵" : mode === "UPI" ? "📱" : mode === "Card" ? "💳" : mode === "Wallet" ? "👛" : "🏪"}</span>
                  <span className="truncate w-full text-center uppercase tracking-tighter">{mode === "Pay on Counter" ? "Counter" : mode}</span>
                </button>
              ))}
            </div>

            {/* UPI Details - Conditional */}
            {paymentMode === "UPI" && (
              <div className="space-y-2 p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <a href={upiLink} className="text-center text-indigo-700 font-black text-[10px] py-2 border-2 border-dashed border-indigo-300 rounded-xl bg-white flex items-center justify-center gap-2">
                    📱 UPI App
                  </a>
                  <div className="grid grid-cols-2 gap-1">
                    {(["Pending", "Paid"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setPaymentStatus(s)}
                        className={`py-1.5 rounded-lg border-2 font-black text-[8px] transition-all uppercase tracking-wider ${paymentStatus === s
                          ? s === "Paid" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/20"
                          : "bg-white border-slate-200 text-slate-500"
                          }`}
                      >
                        {s === "Pending" ? "🕒 PENDING" : "✅ PAID"}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  placeholder="Txn Ref No."
                  value={upiTxnRef}
                  onChange={(e) => setUpiTxnRef(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-900 p-2 w-full rounded-xl text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>
            )}

            {/* 💎 SMART DYNAMIC ACTIONS: Prominent if few, Compact if many */}
            {(() => {
              if (!business) return <div className="h-10 animate-pulse bg-slate-50 rounded-xl mb-4" />;

              const enabledActions = [
                { id: 'hold', enabled: business.posHoldEnabled !== false },
                { id: 'save', enabled: business.posSaveEnabled !== false },
                { id: 'preview', enabled: business.posPreviewEnabled !== false },
                { id: 'kot', enabled: business.posKotEnabled !== false }
              ].filter(a => a.enabled);

              const isCompact = enabledActions.length > 2;

              return (
                <div 
                  className={`grid gap-2 mb-4 ${isCompact ? "" : "grid-cols-2"}`}
                  style={isCompact ? { 
                    gridTemplateColumns: `repeat(${enabledActions.length}, 1fr)`
                  } : {}}
                >
                  {(business.posHoldEnabled !== false) && (
                    <button
                      onClick={async () => {
                        const bill = await saveBill(true);
                        if (!bill) return;
                        kravy.ping(); 
                        resetForm();
                        fetchHeldBills();
                        if (resumeBillId) router.replace("/dashboard/billing/checkout");
                      }}
                      disabled={items.length === 0 || isSaving}
                      className={`flex ${isCompact ? "flex-col py-2" : "flex-row py-4"} items-center justify-center gap-2 rounded-xl border-2 border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-all font-black active:scale-95`}
                    >
                      <PauseCircle size={isCompact ? 14 : 18} strokeWidth={3} />
                      <span className={`${isCompact ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider`}>Hold</span>
                    </button>
                  )}

                  {(business.posSaveEnabled !== false) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const bill = await saveBill();
                        if (!bill) return;
                        kravy.success(); 
                        resetForm();
                        if (resumeBillId) router.replace("/dashboard/billing/checkout");
                      }}
                      disabled={items.length === 0 || isSaving}
                      className={`flex ${isCompact ? "flex-col py-2" : "flex-row py-4"} items-center justify-center gap-2 rounded-xl border-2 border-slate-300 text-slate-900 bg-slate-50 hover:bg-slate-200 transition-all font-black active:scale-95`}
                    >
                      <Save size={isCompact ? 14 : 18} strokeWidth={3} />
                      <span className={`${isCompact ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider`}>Save</span>
                    </button>
                  )}

                  {(business.posPreviewEnabled !== false) && (
                    <button
                      onClick={() => { kravy.open(); setPreviewZoom(1); setShowPreview(true); }}
                      disabled={items.length === 0 || isSaving}
                      className={`flex ${isCompact ? "flex-col py-2" : "flex-row py-4"} items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-all font-black active:scale-95`}
                    >
                      <Eye size={isCompact ? 14 : 18} strokeWidth={3} />
                      <span className={`${isCompact ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider`}>Preview</span>
                    </button>
                  )}

                  {(business.posKotEnabled !== false) && (
                    <button
                      onClick={handlePrintKOT}
                      disabled={items.length === 0 || isSaving}
                      className={`flex ${isCompact ? "flex-col py-2" : "flex-row py-4"} items-center justify-center gap-2 rounded-xl border-2 border-orange-300 text-orange-800 bg-orange-50 hover:bg-orange-100 transition-all font-black active:scale-95`}
                    >
                      <Printer size={isCompact ? 14 : 18} strokeWidth={3} />
                      <span className={`${isCompact ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider`}>KOT</span>
                    </button>
                  )}
                </div>
              );
            })()}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                if (paymentMode === "Wallet" && selectedParty) {
                  setPrevWalletBalance(selectedParty.walletBalance);
                } else {
                  setPrevWalletBalance(null);
                }
                const bill = await saveBill();
                if (!bill) return;
                kravy.payment(); 
                // Wait slightly for state to settle and DOM to update
                setTimeout(() => {
                  printReceipt(business?.enableKOTWithBill);
                  resetForm();
                  if (resumeBillId) router.replace("/dashboard/billing/checkout");
                }, 500);
              }}
              disabled={items.length === 0 || (paymentMode === "UPI" && paymentStatus !== "Paid") || isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500
                text-white font-black text-xs uppercase tracking-widest
                shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} strokeWidth={3} />} 
              {business?.enableKOTWithBill ? "KOT & Print Bill" : "Print Bill / Receipt"}
            </motion.button>
          </div>
        </div>
      </div>

        <PrintTemplates 
          receiptRef={receiptRef}
          kotRef={kotRef}
          business={business}
          billNumber={billNumber}
          billDate={billDate}
          tokenNumber={tokenNumber}
          selectedTable={selectedTable}
          customerName={customerName}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          orderNotes={orderNotes}
          buyerGSTIN={buyerGSTIN}
          placeOfSupply={placeOfSupply}
          items={items}
          subtotal={subtotal}
          discountAmt={discountAmt}
          appliedOffer={appliedOffer}
          taxActive={taxActive}
          perProductEnabled={perProductEnabled}
          globalRate={globalRate}
          totalTaxable={totalTaxable}
          totalGst={totalGst}
          taxBreakup={taxBreakup}
          deliveryCharge={deliveryCharge}
          deliveryGst={deliveryGst}
          packagingCharge={packagingCharge}
          packagingGst={packagingGst}
          serviceCharge={serviceCharge}
          finalTotal={finalTotal}
          paymentMode={paymentMode}
          paymentStatus={paymentStatus}
          upiTxnRef={upiTxnRef}
          qrUrl={qrUrl}
          kotNumbers={kotNumbers}
          prevWalletBalance={prevWalletBalance}
          selectedParty={selectedParty}
          numberToWords={numberToWords}
        />

      


      {/* ════════════════════════════════════════════
          HELD BILLS DRAWER
      ════════════════════════════════════════════ */}
      {showHeldBills && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowHeldBills(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-[var(--kravy-surface)] h-full shadow-2xl flex flex-col
            border-l border-[var(--kravy-border)] animate-in slide-in-from-right duration-300">

            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[var(--kravy-border)] flex items-center justify-between
              bg-[var(--kravy-bg)]/50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-[var(--kravy-text-primary)]">Held Bills</h3>
                <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mt-1">
                  {heldBills.length} Orders Paused
                </p>
              </div>
              <button
                onClick={() => setShowHeldBills(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl
                  hover:bg-rose-500/10 text-[var(--kravy-text-muted)] hover:text-rose-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {heldBillsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-4 border-[var(--kravy-brand)]/20 border-t-[var(--kravy-brand)] rounded-full animate-spin" />
                  <p className="text-sm font-bold text-[var(--kravy-text-muted)]">Loading bills…</p>
                </div>
              ) : heldBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-40 p-8">
                  <Clock size={44} className="mb-4 text-[var(--kravy-text-muted)]" />
                  <p className="font-black text-[var(--kravy-text-primary)]">No held bills</p>
                  <p className="text-xs mt-1 text-[var(--kravy-text-muted)]">Orders on hold will appear here</p>
                </div>
              ) : (
                heldBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`rounded-2xl border overflow-hidden transition-all ${resumeBillId === bill.id
                      ? "bg-[var(--kravy-brand)]/5 border-[var(--kravy-brand)] shadow-md shadow-indigo-500/10"
                      : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] hover:border-[var(--kravy-brand)]/50"
                      }`}
                  >
                    {/* Card Top */}
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[10px] font-black text-[var(--kravy-brand)] bg-[var(--kravy-brand)]/10 px-2 py-0.5 rounded-md">
                            #{bill.billNumber}
                          </span>
                          {resumeBillId === bill.id && (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="font-black text-[var(--kravy-text-primary)] text-sm truncate">
                          {bill.customerName || "Walk-in Customer"}
                        </p>
                        {bill.customerPhone && (
                          <p className="text-[10px] font-bold text-indigo-500 font-mono mt-0.5">
                            {bill.customerPhone}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-[var(--kravy-text-muted)]">
                            {new Date(bill.createdAt).toLocaleString()}
                          </p>
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            {bill.tableName || "POS"}
                          </span>
                        </div>
                        {(bill.notes || bill.auditNote) && (
                          <div className="mt-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">Note:</p>
                            <p className="text-[10px] font-medium text-blue-800 italic line-clamp-2">
                              {bill.notes || bill.auditNote}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-[var(--kravy-brand)]">₹{bill.total.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-[var(--kravy-text-muted)]">
                          {bill.items.length} items
                        </p>
                      </div>
                    </div>

                    {/* Item chips */}
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {bill.items.slice(0, 3).map((item: any, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold bg-[var(--kravy-surface)] border border-[var(--kravy-border)] px-2.5 py-1 rounded-lg text-[var(--kravy-text-secondary)]">
                          {item.name} ×{item.qty}
                        </span>
                      ))}
                      {bill.items.length > 3 && (
                        <span className="text-[10px] font-semibold bg-[var(--kravy-surface)] border border-[var(--kravy-border)] px-2.5 py-1 rounded-lg text-[var(--kravy-text-muted)]">
                          +{bill.items.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-[var(--kravy-border)]">
                      <button
                        onClick={() => {
                          setShowHeldBills(false);
                          router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`);
                        }}
                        disabled={resumeBillId === bill.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3
                          bg-[var(--kravy-brand)]/8 text-[var(--kravy-brand)] font-black text-xs
                          hover:bg-[var(--kravy-brand)] hover:text-white
                          disabled:opacity-40 disabled:cursor-not-allowed transition-all
                          border-r border-[var(--kravy-border)]"
                      >
                        <Play size={13} fill="currentColor" /> Resume
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(bill.id)}
                        className="w-14 flex items-center justify-center
                          bg-rose-500/8 text-rose-500 hover:bg-rose-500 hover:text-white
                          transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-[var(--kravy-border)] flex-shrink-0">
              <button
                onClick={() => setShowHeldBills(false)}
                className="w-full py-3 bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                  rounded-2xl font-black text-sm text-[var(--kravy-text-secondary)]
                  hover:bg-[var(--kravy-surface-hover)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DELETE CONFIRM MODAL (Beautiful Bottom Sheet)
      ════════════════════════════════════════════ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full sm:max-w-sm bg-[var(--kravy-surface)] rounded-t-3xl sm:rounded-3xl
            shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

            {/* Handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--kravy-border)] rounded-full" />
            </div>

            <div className="p-6 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-rose-500" />
              </div>

              <h3 className="text-xl font-black text-[var(--kravy-text-primary)] mb-2">Move to Trash?</h3>
              <p className="text-sm text-[var(--kravy-text-muted)] font-medium leading-relaxed mb-6">
                Yeh order checkout se hat jaayega.<br />Aap ise baad mein "Deleted Bills" mein dekh sakte hain.
              </p>

              {/* Bill preview */}
              {(() => {
                const bill = heldBills.find(b => b.id === deleteConfirmId);
                return bill ? (
                  <div className="bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-xl p-3 mb-6 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-black text-[var(--kravy-text-primary)]">
                        {bill.customerName || "Walk-in Customer"}
                      </p>
                      <p className="text-[10px] text-[var(--kravy-text-muted)] font-bold mt-0.5">
                        #{bill.billNumber} · {bill.items.length} items
                      </p>
                    </div>
                    <span className="text-lg font-black text-[var(--kravy-brand)]">₹{bill.total.toFixed(2)}</span>
                  </div>
                ) : null;
              })()}

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={async () => {
                    const ok = await deleteHeldBill(deleteConfirmId!);
                    if (ok) { fetchHeldBills(); setDeleteConfirmId(null); }
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white
                    font-black text-sm shadow-lg shadow-rose-500/30
                    hover:shadow-rose-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Haan, Delete Karo
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full py-3.5 rounded-2xl bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                    text-[var(--kravy-text-secondary)] font-black text-sm
                    hover:bg-[var(--kravy-surface-hover)] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          RESUME CONFIRM MODAL
      ════════════════════════════════════════════ */}
      {resumeConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setResumeConfirmId(null)}
          />
          <div className="relative w-full sm:max-w-sm bg-[var(--kravy-surface)] rounded-t-3xl sm:rounded-3xl
            shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--kravy-border)] rounded-full" />
            </div>

            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Play size={28} className="text-emerald-500" fill="currentColor" />
              </div>
              <h3 className="text-xl font-black text-[var(--kravy-text-primary)] mb-2">Resume Order?</h3>
              <p className="text-sm text-[var(--kravy-text-muted)] font-medium leading-relaxed mb-6">
                Current cart ke items replace ho jaayenge.<br />Kya aap continue karna chahte hain?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowHeldBills(false);
                    router.push(`/dashboard/billing/checkout?resumeBillId=${resumeConfirmId}`);
                    setResumeConfirmId(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white
                    font-black text-sm shadow-lg shadow-emerald-500/30
                    hover:-translate-y-0.5 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Haan, Resume Karo
                </button>
                <button
                  onClick={() => setResumeConfirmId(null)}
                  className="w-full py-3.5 rounded-2xl bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                    text-[var(--kravy-text-secondary)] font-black text-sm hover:bg-[var(--kravy-surface-hover)] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <BillPreview 
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        previewZoom={previewZoom}
        setPreviewZoom={setPreviewZoom}
        business={business}
        billNumber={billNumber}
        billDate={billDate}
        tokenNumber={tokenNumber}
        selectedTable={selectedTable}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        orderNotes={orderNotes}
        placeOfSupply={placeOfSupply}
        items={items}
        subtotal={subtotal}
        discountAmt={discountAmt}
        appliedOffer={appliedOffer}
        taxActive={taxActive}
        perProductEnabled={perProductEnabled}
        totalTaxable={totalTaxable}
        totalGst={totalGst}
        taxBreakup={taxBreakup}
        deliveryCharge={deliveryCharge}
        deliveryGst={deliveryGst}
        packagingCharge={packagingCharge}
        packagingGst={packagingGst}
        finalTotal={finalTotal}
        paymentMode={paymentMode}
        paymentStatus={paymentStatus}
        qrUrl={qrUrl}
        numberToWords={numberToWords}
        kravy={kravy}
        kotNumbers={kotNumbers}
        printKOT={printKOT}
        printReceipt={printReceipt}
        saveBill={saveBill}
        resetForm={resetForm}
        isSaving={isSaving}
        lastSavedBillId={lastSavedBillId}
        userRole={userRole}
        userPermissions={userPermissions}
        resumeBillId={resumeBillId}
        router={router}
      />

      {/* 📝 ORDER NOTES MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotesModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--kravy-surface)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--kravy-border)] flex items-center justify-between bg-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <StickyNote size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--kravy-text-primary)]">Order Remarks</h3>
                  <p className="text-[9px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider">Kitchen Instructions</p>
                </div>
              </div>
              <button onClick={() => setShowNotesModal(false)} className="text-[var(--kravy-text-muted)] hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                autoFocus
                placeholder="E.g. Extra spicy, No onions, Fast delivery, Handle with care..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full min-h-[120px] bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-2xl p-4
                  text-sm font-bold text-[var(--kravy-text-primary)] outline-none focus:ring-2 focus:ring-blue-500/20
                  focus:border-blue-500 transition-all placeholder:text-[var(--kravy-text-muted)] resize-none"
              />
              <button
                onClick={() => { kravy.toggle(); setShowNotesModal(false); }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest
                  shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          QUICK ADD ITEM MODAL
      ════════════════════════════════════════════ */}
      {quickAddCat && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/10" onClick={() => setQuickAddCat(null)} />
          <div className="relative bg-[var(--kravy-surface)] w-full max-w-sm rounded-[2rem] shadow-2xl border border-[var(--kravy-border)] overflow-hidden scale-100 animate-in fade-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[var(--kravy-border)]/50">
                <div className="w-12 h-12 rounded-2xl bg-[var(--kravy-brand)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black text-[var(--kravy-brand)]">+</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-[var(--kravy-text-primary)] leading-tight">Quick Add</h3>
                  <p className="text-[10px] text-[var(--kravy-text-muted)] font-black uppercase tracking-widest mt-0.5 truncate">
                    Adding to <span className="text-[var(--kravy-brand)]">{quickAddCat.name}</span>
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Category</label>
                  <select
                    value={quickAddCat.id}
                    onChange={(e) => {
                      const selected = categoriesList.find(c => c.id === e.target.value) || { id: e.target.value, name: "General" };
                      setQuickAddCat(selected);
                    }}
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all font-bold"
                  >
                    {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {!categoriesList.some(c => c.id === quickAddCat.id) && <option value={quickAddCat.id}>{quickAddCat.name}</option>}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Name</label>
                    <input
                      name="name"
                      autoFocus
                      autoComplete="off"
                      placeholder="Burger"
                      required
                      className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Price</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      required
                      className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Description (Optional)</label>
                  <input
                    name="description"
                    placeholder="Short description..."
                    autoComplete="off"
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Image URL (Optional)</label>
                  <input
                    name="imageUrl"
                    type="url"
                    autoComplete="off"
                    placeholder="https://..."
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] p-3 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all font-medium"
                  />
                </div>

                {/* Tax Options */}
                {taxActive && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2 p-1 bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl">
                      {["Without Tax", "With Tax"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setQuickAddTaxStatus(status)}
                          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                            quickAddTaxStatus === status
                              ? "bg-[var(--kravy-brand)] text-white shadow-lg shadow-[var(--kravy-brand)]/20"
                              : "text-[var(--kravy-text-muted)] hover:bg-[var(--kravy-border)]/50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[0, 5, 12, 18, 28].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setQuickAddGst(val)}
                          className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            quickAddGst === val
                              ? "bg-[var(--kravy-brand)] text-white border-[var(--kravy-brand)]"
                              : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] text-[var(--kravy-text-muted)] hover:border-[var(--kravy-brand)]/50"
                          }`}
                        >
                          GST @ {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickAddCat(null)}
                    className="flex-1 py-3 rounded-xl border border-[var(--kravy-border)] bg-[var(--kravy-bg)] text-[var(--kravy-text-secondary)] font-black text-xs hover:bg-[var(--kravy-surface-hover)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 rounded-xl bg-[var(--kravy-brand)] text-white font-black text-xs shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98] transition-all"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ════════════════════════════════════════════
          QUICK ADD CATEGORY MODAL
      ════════════════════════════════════════════ */}
      {showAddCategory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/10" onClick={() => setShowAddCategory(false)} />
          <div className="relative bg-[var(--kravy-surface)] w-full max-w-sm rounded-[2rem] shadow-2xl border border-[var(--kravy-border)] overflow-hidden scale-100 animate-in fade-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[var(--kravy-border)]/50">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Plus size={24} className="text-amber-500" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--kravy-text-primary)] leading-tight">New Category</h3>
                  <p className="text-[10px] text-[var(--kravy-text-muted)] font-black uppercase tracking-widest mt-0.5">
                    Add menu section
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleQuickAddCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Category Name</label>
                  <input
                    name="name"
                    autoFocus
                    autoComplete="off"
                    placeholder="e.g. Desserts"
                    required
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="flex-1 py-3 rounded-xl border border-[var(--kravy-border)] bg-[var(--kravy-bg)] text-[var(--kravy-text-secondary)] font-black text-xs hover:bg-[var(--kravy-surface-hover)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 rounded-xl bg-amber-500 text-white font-black text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          QUICK ADD ADDON MODAL
      ════════════════════════════════════════════ */}
      {quickAddAddonGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setQuickAddAddonGroup(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                     <Plus size={20} strokeWidth={3} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Quick Add Addon</h3>
                     <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Adding to {quickAddAddonGroup.name}</p>
                  </div>
               </div>

               <form onSubmit={handleQuickAddAddon} className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Addon Name</label>
                     <input 
                        autoFocus
                        name="name"
                        placeholder="e.g. Extra Cheese"
                        className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Price (₹)</label>
                     <input 
                        name="price"
                        type="number"
                        placeholder="0.00"
                        className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-mono"
                     />
                  </div>

                  <div className="space-y-1.5 pt-1">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Map to Categories</label>
                     <div className="max-h-28 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 space-y-2">
                        {categoriesList.filter(c => c.name !== 'All').map(cat => (
                           <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <input 
                                 type="checkbox" 
                                 name="categoryIds" 
                                 value={cat.id}
                                 defaultChecked={(quickAddAddonGroup.categoryIds || []).includes(cat.id)}
                                 className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                     <button 
                        type="button"
                        onClick={() => setQuickAddAddonGroup(null)}
                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[0.7rem] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                     >
                        Abort
                     </button>
                     <button 
                        type="submit"
                        className="h-12 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.15em] text-[0.75rem] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                     >
                        Register Node
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
