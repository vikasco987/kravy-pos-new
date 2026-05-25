"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useTerminalContext, Order, Table } from "@/components/TerminalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { kravy } from "@/lib/sounds";
import {
    LayoutDashboard, ChefHat, MapPin, CreditCard,
    Clock, Bell, TrendingUp, ArrowRight, Check,
    Flame, UtensilsCrossed, Plus, Trash2, Eye,
    Printer, X, Filter, Search, User, ChevronRight,
    Edit3, LogOut, Table as TableIcon, History,
    RotateCcw, RefreshCw, MoreHorizontal, Zap, Star, ShieldCheck, Layers, CheckCircle2,
    Wifi, Battery, Signal, Smartphone, Timer, AlertTriangle, ChevronUp, Package2,
    Terminal as TerminalIcon, LayoutGrid, ListTodo, ZoomIn, ZoomOut, Phone, MessageSquare,
    Crown, Building, Wind, Monitor, Layout, Navigation, ArrowLeft, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
    DndContext, 
    useSensor, 
    useSensors, 
    PointerSensor, 
    DragEndEvent,
} from '@dnd-kit/core';
import PrintTemplates from "@/components/printing/PrintTemplates";
import BillPreview from "@/components/printing/BillPreview";
import OrderAlertLoop from "./components/order-alert-loop";
import { useAuthContext } from "@/components/AuthContext";

const SatoshiFont = () => (
    <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
);


// --- TYPES ---
type OrderItem = {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    qty?: number;
    rate?: number;
    isVeg?: boolean;
    isNew?: boolean;
    instruction?: string;
    variants?: any[];
    taxStatus?: string;
    gst?: number;
};


const TableTimer = ({ startTime, className = "" }: { startTime?: string, className?: string }) => {
    const [timeData, setTimeData] = useState<{ h: number, m: number }>({ h: 0, m: 0 });
    const [ageStatus, setAgeStatus] = useState<"fresh" | "medium" | "old">("fresh");

    useEffect(() => {
        if (!startTime) return;

        const update = () => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
            const mins = Math.floor(diff / 60);
            
            if (mins < 30) setAgeStatus("fresh");
            else if (mins < 60) setAgeStatus("medium");
            else setAgeStatus("old");

            const h = Math.floor(mins / 60);
            const m = mins % 60;
            setTimeData({ h, m });
        };

        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime) return null;

    const ageColors = {
        fresh: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
        medium: "text-amber-600 bg-amber-50/50 border-amber-100",
        old: "text-rose-600 bg-rose-50/80 border-rose-100"
    };

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 ${ageColors[ageStatus]} ${className}`}>
            <Clock size={12} className="shrink-0 opacity-70" />
            <div className="flex items-baseline gap-0.5 leading-none">
                {timeData.h > 0 && (
                    <span className="text-[11px] font-black tracking-tight">{timeData.h}H</span>
                )}
                <span className="text-[11px] font-black tracking-tight">{timeData.m}M</span>
            </div>
        </div>
    );
};

const getTableIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("vip")) return <Crown size={14} />;
    if (n.includes("balcony")) return <Building size={14} />;
    if (n.includes("window")) return <Layout size={14} />;
    if (n.includes("rooftop")) return <Wind size={14} />;
    if (n.includes("floor")) return <Navigation size={14} />;
    return <TableIcon size={14} />;
};


type TabKey = "dashboard" | "kitchen" | "payment" | "track";

const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    };
    if (num === 0) return 'Zero Only';
    const integerPart = Math.floor(Math.abs(num));
    const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);
    let result = convert(integerPart) + ' Rupees';
    if (decimalPart > 0) result += ' and ' + convert(decimalPart) + ' Paise';
    return result + ' Only';
};

const calculateOrderTotals = (items: any[], isTaxEnabled: boolean, globalRate: number, perProductEnabled: boolean) => {
    let subtotal = 0;
    let gst = 0;

    items.forEach(it => {
        const q = Number(it.quantity || it.qty || 0);
        const p = Number(it.price || it.rate || 0);
        const gross = q * p;
        const rate = (perProductEnabled && it.gst !== undefined && it.gst !== null) ? it.gst : (isTaxEnabled ? globalRate : 0);
        const ts = it.taxStatus || "Without Tax";

        if (ts === "With Tax") {
            const base = gross / (1 + rate / 100);
            subtotal += base;
            gst += (gross - base);
        } else {
            subtotal += gross;
            gst += (gross * rate) / 100;
        }
    });

    return { subtotal, gst, total: subtotal + gst };
};


function KravyPOS() {
    const router = useRouter();
    const billReceiptRef = useRef<HTMLDivElement | null>(null);
    const kotReceiptRef = useRef<HTMLDivElement | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
    const { 
        tablesList, 
        orders, 
        business, 
        isLoading, 
        fetchData, 
        updateTableStatus,
        setOrders
    } = useTerminalContext();

    const switchTab = (tab: TabKey) => {
        kravy.click();
        setActiveTab(tab);
    };

    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [payMethod, setPayMethod] = useState("CASH");
    const [discountType, setDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
    const [discountValue, setDiscountValue] = useState<string>("");
    const [isCgstEnabled, setIsCgstEnabled] = useState(true);
    const [isSgstEnabled, setIsSgstEnabled] = useState(true);
    const [printBillOnConfirm, setPrintBillOnConfirm] = useState(false);
    const [settleTab, setSettleTab] = useState<"ITEMS" | "KOT" | "RESERVATION">("ITEMS");
    const [tableSearch, setTableSearch] = useState("");
    const searchParams = useSearchParams();
    const { user: authUser } = useAuthContext();
    const userRole = authUser?.type || null;
    const userPermissions = authUser?.permissions || [];
    const [tableFilter, setTableFilter] = useState<"ALL" | "RUNNING" | "READY">("ALL");
    const [activeZone, setActiveZone] = useState<string>("ALL");
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
    const [showQRTemplate, setShowQRTemplate] = useState(false);
    const [qrContext, setQrContext] = useState<{ tableId: string, tableName: string } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedParty, setSelectedParty] = useState<any>(null);
    const [clock, setClock] = useState("");
    const [dateStr, setDateStr] = useState("");

    // Persist and restore selection
    useEffect(() => {
        fetchData(false, true); // ✅ Force fetch on mount to see new orders instantly
        const savedTableId = sessionStorage.getItem("terminal_selected_table");
        const savedOrderId = sessionStorage.getItem("terminal_selected_order");
        if (savedTableId) setSelectedTableId(savedTableId);
        if (savedOrderId) setSelectedOrderId(savedOrderId);
        
        router.prefetch("/dashboard/billing/checkout");
    }, [router, fetchData]);

    useEffect(() => {
        if (selectedTableId) sessionStorage.setItem("terminal_selected_table", selectedTableId);
        else sessionStorage.removeItem("terminal_selected_table");
    }, [selectedTableId]);

    useEffect(() => {
        if (selectedOrderId) sessionStorage.setItem("terminal_selected_order", selectedOrderId);
        else sessionStorage.removeItem("terminal_selected_order");
    }, [selectedOrderId]);
    
    const selectedTable = tablesList.find(t => t.id === selectedTableId);
    const tableOrders = selectedTable ? orders.filter(o => o.table?.id === selectedTable.id && o.status !== "COMPLETED" && !o.isDeleted) : [];
    const activeOrderForSelected = orders.find(o => o.id === (selectedOrderId || selectedTable?.activeOrderId));

    // Dynamic Totals Calculation
    const isTaxEnabled = business?.taxEnabled ?? true;
    const globalRate = business?.taxRate ?? 5.0;
    const perProductEnabled = business?.perProductTaxEnabled ?? false;

    let subtotalCost = 0;
    let calculatedGst = 0;
    let grandTotal = 0;

    if (activeOrderForSelected) {
        activeOrderForSelected.items.forEach((it: any) => {
            const q = Number(it.quantity || it.qty || 0);
            const p = Number(it.price || it.rate || 0);
            const lineTotal = q * p;
            const rate = (perProductEnabled && it.gst !== undefined && it.gst !== null) ? it.gst : (isTaxEnabled ? globalRate : 0);

            if (it.taxStatus === "With Tax") {
                const taxable = lineTotal / (1 + rate / 100);
                calculatedGst += (lineTotal - taxable);
                subtotalCost += taxable;
                grandTotal += lineTotal;
            } else {
                const gst = (lineTotal * rate / 100);
                calculatedGst += gst;
                subtotalCost += lineTotal;
                grandTotal += (lineTotal + gst);
            }
        });
    }
    
    useEffect(() => {
        const tableId = searchParams.get("tableId");
        const orderId = searchParams.get("orderId");

        if (tableId) {
            setSelectedTableId(tableId);
        }

        if (orderId) {
            setSelectedOrderId(orderId);
        }
    }, [searchParams]);

    const [printMode, setPrintMode] = useState<"KOT" | "BILL" | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState<"KOT" | "BILL">("BILL");
    const [previewZoom, setPreviewZoom] = useState(1);
    const [printOrder, setPrintOrder] = useState<Order | null>(null);
    const [printTable, setPrintTable] = useState<Table | null>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
    const [itemSearch, setItemSearch] = useState("");
    const [selectedItemForAdd, setSelectedItemForAdd] = useState<any>(null);
    const [addQty, setAddQty] = useState(1);

    // ✅ Fetch Menu Items for "Add Item" Modal
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch("/api/menu/items");
                if (res.ok) {
                    const data = await res.json();
                    setMenuItems(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch menu items for terminal", err);
            }
        };
        fetchItems();
    }, []);

    // Manual Combination States
    const [showCombineModal, setShowCombineModal] = useState(false);
    const [combineSelection, setCombineSelection] = useState<Set<string>>(new Set());

    const handlePrint = async (type: "KOT" | "BILL" | "COMBINED_BILL" | "MANUAL_COMBINE" | "KOT_BILL", customOrder?: Order, customTable?: Table) => {
        kravy.click();

        console.log(`[PRINT_DEBUG] handlePrint called. Type: ${type}`, { customOrder, customTable });
        let targetOrder = customOrder || printOrder || activeOrderForSelected;
        let targetTable = customTable || printTable || selectedTable;
        console.log(`[PRINT_DEBUG] Target Order Token:`, targetOrder?.tokenNumber);

        if (type === "COMBINED_BILL" && targetOrder) {
            try {
                const res = await fetch(`/api/public/orders/${targetOrder.id}/combined-bill`);
                const data = await res.json();
                if (data.success) {
                    const mergedItems = data.orders.flatMap((o: any) => o.items);
                    targetOrder = {
                        ...targetOrder,
                        id: `Combined #${targetOrder.id.slice(-4).toUpperCase()}`,
                        items: mergedItems,
                        total: data.grandTotal
                    } as any;
                    setPrintOrder(targetOrder);
                } else {
                    alert("Combined bill failed: " + data.error);
                    return;
                }
            } catch (err) {
                console.error("Combined bill fetch error:", err);
                return;
            }
        } else if (type === "MANUAL_COMBINE") {
            const selectedOrders = orders.filter(o => combineSelection.has(o.id));
            if (selectedOrders.length === 0) return;

            const mergedItems = selectedOrders.flatMap(o => o.items);
            const subtotal = mergedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
            const gst = isTaxEnabled ? (subtotal * globalRate) / 100 : 0;
            const total = subtotal + gst;

            targetOrder = {
                id: `ManualMerge-${new Date().getTime().toString().slice(-4)}`,
                items: mergedItems,
                total: total,
                table: selectedOrders[0].table,
                customerName: "Combined Group",
                createdAt: new Date().toISOString(),
                status: "ACCEPTED"
            } as any;
            setPrintOrder(targetOrder);
            setPrintTable(targetTable || (selectedOrders[0].table as any));
        } else {
            if (customOrder) setPrintOrder(customOrder);
            if (customTable) setPrintTable(customTable);
        }

        // ✅ Print Execution
        setTimeout(() => {
            const isBill = type === "BILL" || type === "COMBINED_BILL" || type === "MANUAL_COMBINE" || type === "KOT_BILL";
            const targetRef = isBill ? billReceiptRef.current : kotReceiptRef.current;
            
            if (!targetRef) {
                console.error(`[PRINT ERROR] No DOM reference found for ${type}. billReceiptRef: ${!!billReceiptRef.current}, kotReceiptRef: ${!!kotReceiptRef.current}`);
                return;
            }

            const containerId = `print-container-terminal-${type}`;
            const styleId = `print-style-terminal-${type}`;

            // Clean ONLY this specific type's old containers to prevent interrupting concurrent KOT/Bill spooling
            document.getElementById(containerId)?.remove();
            document.getElementById(styleId)?.remove();

            console.log(`[PRINT_DEBUG] targetRef found. Starting print sequence...`);
            const ps = (business as any)?.printSettings || {};
            const is80 = ps.paperWidth === '80mm';
            const paperWidth = is80 ? '74mm' : '58mm';
            const paperBottomPadding = ps.paperBottomPadding !== undefined && ps.paperBottomPadding !== null ? `${ps.paperBottomPadding}px` : '80px';

            const fontFamilyVal = ps.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const kotFontFamilyVal = ps.kotFontFamily || '"Courier New", Courier, monospace';
            const fontWeightVal = ps.fontWeight || '';
            const kotFontWeightVal = ps.kotFontWeight || '';

            const getClamped = (val: any, def: number, min: number, max: number) => {
                if (val === undefined || val === null || val === "") return def;
                return Math.max(min, Math.min(max, Number(val)));
            };
            const rawBusinessNameSize = getClamped(ps.businessNameSize, 18, 14, 32);
            const businessAddressSize = getClamped(ps.businessAddressSize, 11, 8, 16);
            const taglineSize = getClamped(ps.taglineSize, 11, 8, 14);
            const receiptTokenSize = getClamped(ps.receiptTokenSize, 28, 18, 40);
            const detailsFontSize = getClamped(ps.detailsFontSize, 10, 8, 14);
            const itemsFontSize = getClamped(ps.itemsFontSize, 11, 9, 18);
            const totalFontSize = getClamped(ps.totalFontSize, 13, 11, 24);
            const greetingFontSize = getClamped(ps.greetingFontSize, 12, 9, 18);
            const kotTokenSize = getClamped(ps.kotTokenSize, 16, 12, 28);
            const kotItemsFontSize = getClamped(ps.kotItemsFontSize, 11, 9, 18);
            const kotQtyFontSize = getClamped(ps.kotQtyFontSize, 14, 10, 22);

            const nameLen = ((business as any)?.businessName || "").length;
            let finalBusinessNameSize = rawBusinessNameSize;
            if (nameLen > 25) finalBusinessNameSize -= 2;
            if (nameLen > 35) finalBusinessNameSize -= 2;
            finalBusinessNameSize = Math.max(14, finalBusinessNameSize);

            const addrLen = ((business as any)?.businessAddress || "").length;
            let finalAddressSize = businessAddressSize;
            if (addrLen > 60) finalAddressSize -= 1;
            if (addrLen > 100) finalAddressSize -= 1;
            finalAddressSize = Math.max(8, finalAddressSize);

            const isKotType = type === "KOT";

            const printHTML = targetRef.innerHTML;
            const printStyles = `
                @media print {
                    html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
                    body > *:not(#${containerId}) { display: none !important; }
                    @page { 
                        margin: 0; 
                        size: ${is80 ? '80mm' : '58mm'} auto; 
                    }
                    #${containerId} {
                        display: block !important; 
                        width: 100% !important; 
                        max-width: ${paperWidth} !important; 
                        height: auto !important;
                        overflow: visible !important; 
                        margin: 0 auto !important; 
                        padding: ${is80 ? `2mm 6mm ${paperBottomPadding} 6mm` : `2mm 4% ${paperBottomPadding} 4%`} !important; 
                        background: #fff !important; 
                        position: relative !important; 
                        box-sizing: border-box !important;
                    }
                    #${containerId}.receipt-container-dynamic {
                        --r-font-family: ${fontFamilyVal};
                        --r-business-size: ${finalBusinessNameSize}px;
                        --r-address-size: ${finalAddressSize}px;
                        --r-tagline-size: ${taglineSize}px;
                        --r-items-size: ${itemsFontSize}px;
                        --r-total-size: ${totalFontSize}px;
                        --r-token-size: ${receiptTokenSize}px;
                        --r-details-size: ${detailsFontSize}px;
                        --r-greeting-size: ${greetingFontSize}px;
                        font-family: var(--r-font-family) !important;
                        font-size: var(--r-details-size) !important;
                    }
                    #${containerId}.receipt-container-dynamic, #${containerId}.receipt-container-dynamic * {
                        font-family: var(--r-font-family) !important;
                    }
                    #${containerId}.kot-container-dynamic {
                        --k-font-family: ${kotFontFamilyVal};
                        --k-items-size: ${kotItemsFontSize}px;
                        --k-qty-size: ${kotQtyFontSize}px;
                        --k-token-size: ${kotTokenSize}px;
                        font-family: var(--k-font-family) !important;
                        font-size: var(--k-items-size) !important;
                    }
                    #${containerId}.kot-container-dynamic, #${containerId}.kot-container-dynamic * {
                        font-family: var(--k-font-family) !important;
                    }
                    ${fontWeightVal ? `
                    #${containerId}.receipt-container-dynamic, #${containerId}.receipt-container-dynamic * {
                        font-weight: ${fontWeightVal} !important;
                    }` : ''}
                    ${kotFontWeightVal ? `
                    #${containerId}.kot-container-dynamic, #${containerId}.kot-container-dynamic * {
                        font-weight: ${kotFontWeightVal} !important;
                    }` : ''}
                    * { color: #000 !important; border-color: #000 !important; overflow: visible !important;  }
                    img { filter: grayscale(100%) contrast(300%) !important; max-width: 100% !important; display: block !important; margin: 0 auto !important; }
                }
            `;

            const styleSheet = document.createElement("style");
            styleSheet.id = styleId;
            styleSheet.textContent = printStyles;
            document.head.appendChild(styleSheet);

            const printContainer = document.createElement("div");
            printContainer.id = containerId;
            printContainer.className = isKotType
                ? "kot kot-container kot-container-dynamic text-black bg-white"
                : "receipt receipt-container receipt-container-dynamic text-black bg-white";
            printContainer.innerHTML = printHTML;

            // Add physical bottom spacer for thermal feeds past cutter to prevent jamming
            const spacer = document.createElement("div");
            spacer.style.height = paperBottomPadding;
            spacer.style.minHeight = paperBottomPadding;
            spacer.style.display = "block";
            spacer.style.clear = "both";
            printContainer.appendChild(spacer);

            document.body.appendChild(printContainer);

            // Dynamic Image Preloader: Ensure all images are 100% loaded before showing the print dialog
            const images = printContainer.querySelectorAll("img");
            const imagePromises = Array.from(images).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // continue even if an image fails
              });
            });

            Promise.all(imagePromises).then(() => {
                setTimeout(() => {
                    window.print();
                    
                    // Cleanup significantly delayed to ensure slow spoolers finish reading the DOM
                    setTimeout(() => {
                        if (document.head.contains(styleSheet)) document.head.removeChild(styleSheet);
                        if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
                    }, 2500);
                }, 300);
            });

            // 🔥 Post-Print Updates
            if (targetOrder && type !== "MANUAL_COMBINE") {
                const body: any = { orderId: (targetOrder as any).id.includes("Combined") ? customOrder?.id || printOrder?.id : targetOrder.id };
                const autoBoth = isBill && business?.enableKOTWithBill && type !== "MANUAL_COMBINE" && type !== "COMBINED_BILL";

                if (type === "KOT" || autoBoth) {
                    body.isKotPrinted = true;
                    if (targetOrder.items) body.items = targetOrder.items.map((it: any) => ({ ...it, isNew: false }));
                    if (targetOrder.status === "PENDING" || targetOrder.status === "ACCEPTED") body.status = "PREPARING";
                }
                if (isBill || autoBoth) {
                    body.isBillPrinted = true;
                    if (targetOrder.status === "READY") body.status = "COMPLETED";
                }

                fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                }).then(() => {
                    setOrders(prev => prev.map(o => o.id === (body.orderId || targetOrder.id) ? { ...o, ...body } : o));
                    if (body.status === "COMPLETED") handleCheckout(body.orderId || targetOrder.id, true);
                });
            }

            if (type === "BILL" && business?.enableKOTWithBill) {
                const ps = (business as any)?.printSettings || {};
                const delay = ps.spoolerDelay !== undefined && ps.spoolerDelay !== null ? Number(ps.spoolerDelay) : 2500;
                setTimeout(() => {
                    handlePrint("KOT", targetOrder, targetTable);
                }, delay);
            }
        }, 50);
    };

    const handleSaveAction = async (type: "KOT" | "BILL", order: Order) => {
        kravy.click();
        const body: any = { orderId: order.id };
        if (type === "KOT") {
            body.isKotPrinted = true;
            if (order.status === "PENDING" || order.status === "ACCEPTED") body.status = "PREPARING";
        } else {
            body.isBillPrinted = true;
            if (order.status === "READY") body.status = "COMPLETED";
        }

        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                toast.success(`Order ${type} Saved & Updated`);
                // ✅ Local update
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...body } : o));

                if (body.status === "COMPLETED") {
                    await handleCheckout(order.id, true);
                }
            }
        } catch (err) {
            toast.error("Failed to save action");
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleUpdateItemQty = async (orderId: string, itemIndex: number, newQty: number) => {
        if (newQty < 1) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const newItems = [...order.items];
        newItems[itemIndex].quantity = newQty;

        // Recalculate total for this order
        const newTotal = newItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        const finalTotal = isTaxEnabled ? newTotal + (newTotal * globalRate / 100) : newTotal;

        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    orderId, 
                    items: newItems,
                    total: Number(finalTotal.toFixed(2))
                })
            });
            if (res.ok) {
                // ✅ Local update
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: newItems, total: Number(finalTotal.toFixed(2)) } : o));
            }
        } catch (err) {
            toast.error("Failed to update quantity");
        }
    };

    const handleRemoveItem = async (orderId: string, itemIndex: number) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        if (order.items.length === 1) {
            if (confirm("This is the last item. Delete the whole order?")) {
                const res = await fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId, isDeleted: true })
                });
                if (res.ok) {
                    // ✅ Local update
                    setOrders(prev => prev.filter(o => o.id !== orderId));
                }
            }
            return;
        }

        const newItems = order.items.filter((_, idx) => idx !== itemIndex);
        const newTotal = newItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        const finalTotal = isTaxEnabled ? newTotal + (newTotal * globalRate / 100) : newTotal;

        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    orderId, 
                    items: newItems,
                    total: Number(finalTotal.toFixed(2))
                })
            });
            if (res.ok) {
                toast.success("Item removed");
                // ✅ Local update
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: newItems, total: Number(finalTotal.toFixed(2)) } : o));
            }
        } catch (err) {
            toast.error("Failed to remove item");
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const newStatus = over.id as Order["status"];
        const order = orders.find(o => o.id === orderId);

        if (order && order.status !== newStatus) {
            updateOrderStatus(orderId, newStatus);
        }
    };

    // fetchData is now provided by TerminalContext
    // fetchBusiness is now managed by TerminalContext

    useEffect(() => {
        if (activeTab === "payment" && activeOrderForSelected?.customerPhone) {
            const fetchParty = async () => {
                try {
                    const res = await fetch(`/api/parties?phone=${activeOrderForSelected.customerPhone}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            setSelectedParty(data[0]);
                        } else {
                            setSelectedParty(null);
                        }
                    }
                } catch (err) {
                    console.error("Party fetch failed", err);
                }
            };
            fetchParty();
        } else if (activeTab !== "payment") {
            setSelectedParty(null);
        }
    }, [activeTab, activeOrderForSelected?.customerPhone]);

    // Polling is now managed by TerminalContext
    useEffect(() => {
        const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
    }, []);
    useEffect(() => {
        setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
        // Permission check for Staff
        if (userRole === "STAFF") {
            if (newStatus === "READY" && !userPermissions.includes("kit-complete-order")) {
                toast.error("Permission Denied: Cannot mark order as ready.");
                return;
            }
            if (newStatus === "COMPLETED" && !userPermissions.includes("kit-complete-order")) {
                toast.error("Permission Denied: Cannot complete order.");
                return;
            }
        }

        try {
            // ✅ Sound on Interaction
            kravy.click();
            setUpdatingOrders(prev => new Set(prev).add(orderId));

            const res = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status: newStatus }) });
            if (res.ok) {
                if (newStatus === "ACCEPTED") {
                    kravy.orderAccept();
                    toast.success("Order Accepted 🧑‍🍳");
                } else if (newStatus === "PREPARING") {
                    kravy.orderAccept();
                    toast.success("Cooking Started 🔥");
                } else if (newStatus === "READY") {
                    kravy.orderReady();
                    toast.success("Order Ready! 🛎️");
                } else if (newStatus === "COMPLETED") {
                    kravy.success();
                    toast.success("Order Delivered! ✅");
                } else {
                    kravy.success();
                }

                // ✅ Local update (Optimistic)
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

                if (newStatus === "COMPLETED") {
                    await handleCheckout(orderId, true);
                }
            }
        } catch {
            kravy.error();
            toast.error("Update failed");
        } finally {
            setUpdatingOrders(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    const softDeleteOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to delete this order? It will be removed from workflow but kept in records.")) return;
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, isDeleted: true })
            });
            if (res.ok) {
                toast.success("Order removed from workflow");
                // ✅ Local update (Optimistic)
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isDeleted: true } : o));
            }
        } catch (err) {
            toast.error("Failed to delete order");
        }
    };

    const settlementBill = useMemo(() => {
        if (!activeOrderForSelected) return null;
        let subtotal = 0;
        activeOrderForSelected.items.forEach(it => {
            subtotal += (it.price * it.quantity);
        });

        let dVal = Number(discountValue) || 0;
        let discountAmt = 0;
        if (discountType === "PERCENT") {
            discountAmt = (subtotal * dVal) / 100;
        } else {
            discountAmt = dVal;
        }

        let taxableAmount = subtotal - discountAmt;
        let cgst = isCgstEnabled ? (taxableAmount * (globalRate / 2)) / 100 : 0;
        let sgst = isSgstEnabled ? (taxableAmount * (globalRate / 2)) / 100 : 0;
        
        let total = taxableAmount + cgst + sgst;

        return { subtotal, discountAmt, cgst, sgst, total };
    }, [activeOrderForSelected, discountType, discountValue, isCgstEnabled, isSgstEnabled, globalRate]);

    const [isSettling, setIsSettling] = useState(false);

    const handleCheckout = async (targetOrderId: string, silent = false) => {
        if (isSettling) return;
        
        const order = orders.find(o => o.id === targetOrderId);
        if (!order) return;

        // Re-calculate with current settlement modifiers
        let orderSubtotal = 0;
        order.items.forEach(it => orderSubtotal += (it.price * it.quantity));
        let dVal = Number(discountValue) || 0;
        let discountAmt = discountType === "PERCENT" ? (orderSubtotal * dVal) / 100 : dVal;
        let taxable = orderSubtotal - discountAmt;
        let orderCgst = isCgstEnabled ? (taxable * (globalRate / 2)) / 100 : 0;
        let orderSgst = isSgstEnabled ? (taxable * (globalRate / 2)) / 100 : 0;
        let orderTotal = taxable + orderCgst + orderSgst;

        try {
            setIsSettling(true);
            if (payMethod === "wallet") {
                if (!selectedParty) {
                    toast.error("Please link a customer to use Wallet payment");
                    setIsSettling(false);
                    return;
                }
                if ((selectedParty.walletBalance || 0) < orderTotal) {
                    toast.error("Insufficient wallet balance");
                    setIsSettling(false);
                    return;
                }

                const walletRes = await fetch("/api/wallet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "payment",
                        partyId: selectedParty.id,
                        amount: orderTotal,
                        description: `Order #${targetOrderId.slice(-6).toUpperCase()}`
                    })
                });
                if (!walletRes.ok) throw new Error("Wallet payment failed");
                const walletData = await walletRes.json();
                setSelectedParty((prev: any) => ({ ...prev, walletBalance: walletData.balance }));
            }

            const billData = {
                items: order.items.map(it => ({
                    name: it.name,
                    price: it.price,
                    quantity: it.quantity,
                    total: it.price * it.quantity,
                    taxStatus: it.taxStatus || "Without Tax",
                    gst: (perProductEnabled && it.gst !== undefined && it.gst !== null) ? it.gst : (isTaxEnabled ? globalRate : 0)
                })),
                subtotal: orderSubtotal,
                total: orderTotal,
                discount: discountAmt,
                cgst: orderCgst,
                sgst: orderSgst,
                paymentMode: payMethod.toUpperCase(),
                paymentStatus: "Paid",
                customerName: order.customerName || "Walk-in",
                customerPhone: order.customerPhone || null,
                customerAddress: order.customerAddress || null,
                tableName: order.table?.name || "Counter",
                tokenNumber: order.tokenNumber,
                kotNumbers: order.kotNumbers || []
            };
            const res = await fetch("/api/bill-manager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(billData) });
            const data = await res.json();
            console.log("[CHECKOUT_DEBUG] Bill-Manager Response:", data);
            const savedBill = data.bill || data;
            
            // Only update status if not already COMPLETED (to avoid loop)
            if (order.status !== "COMPLETED") {
                await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: targetOrderId, status: "COMPLETED" }) });
            }

            if (!silent) {
                kravy.payment();
                toast.success("Transaction Finalized! 💰");
                // ✅ IMPORTANT: Switch tab BEFORE clearing selection to avoid render crash
                setActiveTab("dashboard"); 
                setSelectedTableId(null);
                fetchData(false, true); 
            } else {
                fetchData(false, true); 
            }
            
            // Important: return the bill so the caller (like BillPreview) can use the real billNumber
            if (savedBill) {
                // Merge savedBill with order to keep tokenNumber if savedBill doesn't have it
                const mergedBill = { ...order, ...savedBill };
                console.log("[CHECKOUT_DEBUG] Merged Bill with Token:", mergedBill.tokenNumber);
                setPrintOrder(mergedBill);
                setIsSettling(false);
                return mergedBill;
            }
            setIsSettling(false);
            return null;
        } catch (error) {
            setIsSettling(false);
            if (!silent) {
                kravy.error();
                toast.error("Checkout failed");
            }
        }
    };


    const upiLink = business?.upi ? `upi://pay?pa=${business.upi}&pn=${encodeURIComponent(business.businessName || "Store")}&am=${grandTotal.toFixed(2)}&cu=INR` : "";
    const qrUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}` : "";
    const filteredTables = useMemo(() => {
        return tablesList
            .filter(t => {
                const matchSearch = t.name.toLowerCase().includes(tableSearch.toLowerCase());
                const matchFilter = tableFilter === "ALL" || (tableFilter === "RUNNING" && t.status === "PREPARING") || (tableFilter === "READY" && t.status === "READY");
                const matchZone = activeZone === "ALL" || (t.zone ? t.zone.trim().toUpperCase() === activeZone.toUpperCase() : false);
                return matchSearch && matchFilter && matchZone;
            })
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }, [tablesList, tableSearch, tableFilter, activeZone]);

    const availableZones = useMemo(() => {
        const zones = new Set<string>();
        tablesList.forEach(t => { 
            if (t.zone) {
                const normalized = t.zone.trim().toUpperCase();
                if (normalized) {
                    zones.add(normalized);
                }
            }
        });
        return Array.from(zones).sort();
    }, [tablesList]);

    const stats = {
        running: orders.filter(o => o.status === "PREPARING" && !o.isDeleted).length,
        pending: orders.filter(o => (o.status === "PENDING" || o.status === "ACCEPTED") && !o.isDeleted).length, // Total active queue
        incoming: orders.filter(o => o.status === "PENDING" && !o.isDeleted).length, // Just new ones
        ready: orders.filter(o => o.status === "READY" && !o.isDeleted).length,
        sales: orders.filter(o => o.status === "COMPLETED" && !o.isDeleted).reduce((s, o) => s + o.total, 0)
    };

    const statusConfig = {
        FREE: { bg: "bg-gradient-to-br from-white to-slate-100/50 dark:from-slate-900 dark:to-slate-950", border: "border-slate-200 dark:border-slate-800", text: "text-slate-400", dot: "bg-slate-300", ring: "ring-slate-100", label: "Vacant", glass: "bg-slate-500/5 border-slate-500/10", glow: "shadow-sm" },
        PENDING: { bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20", border: "border-amber-100 dark:border-amber-900/40", text: "text-amber-600", dot: "bg-amber-500", ring: "ring-amber-100", label: "Reserved", glass: "bg-amber-500/10 border-amber-500/20", glow: "shadow-lg shadow-amber-500/5" },
        ACCEPTED: { bg: "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20", border: "border-indigo-100 dark:border-indigo-900/40", text: "text-indigo-600", dot: "bg-indigo-500", ring: "ring-indigo-100", label: "Accepted", glass: "bg-indigo-500/10 border-indigo-500/20", glow: "shadow-lg shadow-indigo-500/5" },
        PREPARING: { bg: "bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20", border: "border-violet-100 dark:border-violet-900/40", text: "text-violet-600", dot: "bg-violet-600", ring: "ring-violet-200", label: "Preparing", glass: "bg-violet-600/10 border-violet-600/20", glow: "shadow-xl shadow-violet-500/10" },
        READY: { bg: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20", border: "border-emerald-100 dark:border-emerald-900/40", text: "text-emerald-600", dot: "bg-emerald-600", ring: "ring-emerald-200", label: "Serve Now", glass: "bg-emerald-600/10 border-emerald-600/20", glow: "shadow-2xl shadow-emerald-500/20" }
    };

    // Helper: Aggregate items for Chef
    const productionSummary = useMemo(() => {
        const counts: Record<string, number> = {};
        orders.filter(o => (o.status === "PENDING" || o.status === "PREPARING") && !o.isDeleted).forEach(o => {
            o.items.forEach(it => {
                counts[it.name] = (counts[it.name] || 0) + it.quantity;
            });
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [orders]);

    const getOrderAge = (createdAt: string) => {
        const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
        if (diff < 5) return { color: "text-emerald-500", label: "Fresh" };
        if (diff < 15) return { color: "text-amber-500", label: "Warning" };
        return { color: "text-rose-500", label: "Delayed", alert: true };
    };

    return (
        <div 
            className={`flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative scale-[0.98] origin-top`}
            style={{
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}
        >
            {/* ═══ COMBINATION SELECTION MODAL (MOVED TO TOP) ═══ */}
            <AnimatePresence>
                {showCombineModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => {
                                console.log("[CI] Closing Modal via Backdrop");
                                setShowCombineModal(false);
                            }}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-[500px] h-[80vh] flex flex-col rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Merge Pipelines</h3>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Select orders to combine</p>
                                </div>
                                <button onClick={() => setShowCombineModal(false)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {orders.filter(o => o.status !== "COMPLETED" && !o.isDeleted).map(o => (
                                    <button
                                        key={o.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCombineSelection(prev => {
                                                const next = new Set(prev);
                                                if (next.has(o.id)) next.delete(o.id);
                                                else next.add(o.id);
                                                return next;
                                            });
                                        }}
                                        className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left ${combineSelection.has(o.id) ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-600 shadow-lg shadow-indigo-600/10 -translate-y-1" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${combineSelection.has(o.id) ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                                            {o.table?.name}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-1">ID: #{o.id.slice(-6).toUpperCase()}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{o.items.length} items</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-black text-emerald-500 italic">₹{o.total}</span>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${combineSelection.has(o.id) ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 dark:border-slate-700"}`}>
                                            {combineSelection.has(o.id) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                    </button>
                                ))}

                                {orders.filter(o => o.status !== "COMPLETED" && !o.isDeleted).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                        <Layers size={48} strokeWidth={1} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6">No Active orders to merge</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    disabled={combineSelection.size < 2}
                                    onClick={() => {
                                        setShowCombineModal(false);
                                        handlePrint("MANUAL_COMBINE");
                                    }}
                                    className={`w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${combineSelection.size >= 2 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/20 active:scale-95 translate-y-0" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed translate-y-2 opacity-50"}`}
                                >
                                    <Printer size={18} /> Combine & Print {combineSelection.size > 0 && `(${combineSelection.size})`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <OrderAlertLoop pendingCount={stats.incoming} />
            {/* ── HEADER ── */}
            <header className="flex flex-col lg:flex-row items-center justify-between px-4 lg:px-6 min-h-[60px] lg:h-[60px] shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/40 shadow-lg z-[50] py-2 lg:py-0 gap-4 lg:gap-6 transition-colors duration-300">
                {/* Brand & Navigation */}
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center font-mono text-xl font-black text-white shadow-xl shadow-slate-950/20 flex-shrink-0 border border-white/10">
                            <span>K</span>
                        </div>
                        <div>
                            <div className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tighter">Kravy <em className="text-rose-500 not-italic">Terminal</em></div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Main Branch v2.4</span>
                            </div>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                        {[
                            { key: "dashboard", label: "Terminal", icon: TerminalIcon },
                            { key: "payment", label: "Cashier", icon: CreditCard },
                        ].map(t => {
                            const isActive = activeTab === t.key;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => { kravy.click(); setActiveTab(t.key as TabKey); }}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                >
                                    <Icon size={12} />
                                    <span>{t.label}</span>
                                    {isActive && <motion.div layoutId="nav-ind" className="absolute -bottom-[20px] left-3 right-3 h-0.5 bg-slate-900 dark:bg-white rounded-t-full shadow-[0_-4px_10px_rgba(0,0,0,0.1)]" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>


                {/* Right Controls (Hidden on mobile stats, shown buttons on desktop) */}
                <div className="hidden lg:flex items-center gap-6">
                    <div className="flex items-center gap-6 pr-4 border-r border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex flex-col items-end">
                            <div className="font-mono text-base font-black text-[#0B1B48] dark:text-slate-200 leading-none tracking-tight">{clock}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Live Sync</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weather</span>
                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none mt-1 flex items-center gap-1">☁️ 24°C</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 pr-2">
                            <div className="text-right">
                                <div className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{authUser?.name || "Rahul Sharma"}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Kitchen Manager</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden">
                                <User size={18} className="text-slate-400" />
                            </div>
                        </div>
                        <button
                            onClick={() => { 
                                kravy.click(); 
                                router.push("/dashboard/billing/checkout?returnTo=/dashboard/terminal"); 
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10"
                        >
                            <Plus size={16} strokeWidth={3} />
                            <span>Quick Bill</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══ MAIN ═══ */}
            <main className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* ── TERMINAL TAB ── */}
                    {activeTab === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col md:flex-row h-full gap-3 p-3 overflow-hidden"
                        >
                            {/* LEFT PANEL */}
                            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 rounded-3xl shadow-sm w-full md:w-[280px] lg:w-[300px] xl:w-[340px] shrink-0 flex flex-col overflow-hidden h-[45vh] md:h-full transition-all duration-300">
                                {/* Panel Header */}
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                            <Layers size={12} />
                                            Dining Tables
                                        </span>
                                        <button onClick={() => fetchData()} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><RotateCcw size={13} /></button>
                                    </div>

                                    {/* Search */}
                                    <div className="relative mb-3">
                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search table..."
                                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all"
                                            value={tableSearch}
                                            onChange={e => setTableSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Filter Pills */}
                                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
                                        {(["ALL", "RUNNING", "READY"] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { kravy.click(); setTableFilter(f); }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tableFilter === f ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/10" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Floor/Zone Selection */}
                                    {availableZones.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Floor Management</span>
                                            </div>
                                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                                <button
                                                    onClick={() => { kravy.click(); setActiveZone("ALL"); }}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${activeZone === "ALL" ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300"}`}
                                                >
                                                    All Floors
                                                </button>
                                                {availableZones.map(z => (
                                                    <button
                                                        key={z}
                                                        onClick={() => { kravy.click(); setActiveZone(z); }}
                                                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${activeZone === z ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300"}`}
                                                    >
                                                        {z}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tables Grid */}
                                <div className="flex-1 overflow-y-auto p-3 scrollbar-hide bg-[#F8FAFC]/50 dark:bg-slate-950/50 backdrop-blur-sm">
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                                        {filteredTables.map((t) => {
                                            const cfg = statusConfig[t.status as keyof typeof statusConfig] || statusConfig.FREE;
                                            const isActive = selectedTableId === t.id;
                                            const displayName = t.name?.startsWith("T-") ? t.name.slice(2) : t.name;
                                            
                                            // Dynamic Font Scaling
                                            const nameLength = displayName?.length || 0;

                                            return (
                                                <motion.div
                                                    key={t.id}
                                                    title={displayName} // Tooltip on hover
                                                    onClick={() => { 
                                                        kravy.click(); 
                                                        setSelectedTableId(t.id); 
                                                        setSelectedOrderId(null); 
                                                    }}
                                                    className={`relative group h-[96px] flex flex-col rounded-2xl transition-all duration-300 cursor-pointer ${isActive ? "z-20 scale-[1.02] -translate-y-0.5" : "z-10 hover:scale-[1.01]"}`}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={`w-full h-full rounded-2xl flex flex-col justify-between p-2.5 border transition-all duration-300 overflow-hidden relative ${cfg.bg} ${cfg.border} ${isActive ? "ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : cfg.glow}`}>
                                                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '16px 16px' }} />
                                                        
                                                        {/* Compact Status Indicator - Top Left */}
                                                        <div className="w-full flex items-center justify-between z-10">
                                                            <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider ${cfg.text}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${t.status !== 'FREE' ? 'animate-pulse' : ''}`} />
                                                                <span>{cfg.label}</span>
                                                            </div>
                                                        </div>

                                                        {/* Table Number - Dynamic & Auto-Scaling */}
                                                        <div className="w-full flex flex-col items-center justify-center flex-1 z-10 py-1">
                                                            <span 
                                                                className="text-center font-black leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-sm break-normal whitespace-normal"
                                                                style={{
                                                                    fontSize: nameLength <= 3 ? '18px' : nameLength <= 8 ? '14px' : '11px',
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    width: '100%'
                                                                }}
                                                            >
                                                                {displayName}
                                                            </span>
                                                        </div>

                                                        {/* Compact Timer - Clean Bottom */}
                                                        <div className="w-full flex justify-center z-10">
                                                            {t.startTime ? (
                                                                <TableTimer 
                                                                    startTime={t.startTime} 
                                                                    className="!bg-transparent !p-0 !border-none !shadow-none !text-[9px] !font-black"
                                                                />
                                                            ) : (
                                                                <div className="h-[14px]" />
                                                            )}
                                                        </div>

                                                    </div>
                                                    {/* Notification Badge */}
                                                    {(t.activeCount ?? 0) > 0 && (
                                                        <div className="absolute -top-1.5 -right-1.5 z-[40] animate-bounce">
                                                            <div className="bg-rose-500 text-white text-[9px] font-black min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                                                                {t.activeCount}
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    {filteredTables.length === 0 && (
                                        <div className="flex flex-col items-center justify-center opacity-30 mt-16 text-center">
                                            <TableIcon size={36} strokeWidth={1.2} />
                                            <p className="text-xs font-bold uppercase tracking-widest mt-4">Sab kuch khali hai!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Footer - Professional Stats Bar */}
                                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-1">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Preparing</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{stats.running}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Ready</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{stats.ready}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Queue</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{stats.pending}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 shrink-0" />
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Sales Today</span>
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{stats.sales.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 rounded-3xl shadow-sm transition-colors duration-300">
                                {selectedTable ? (
                                    <motion.div
                                        key={selectedTable.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="h-full flex flex-col"
                                    >
                                        {/* Order Header: Horizontal Flow Design */}
                                        <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-3 transition-colors duration-300">
                                            {/* 1. Avatar (Table ID) */}
                                                <motion.div
                                                    initial={{ rotate: -10, scale: 0.8 }}
                                                    animate={{ rotate: 0, scale: 1 }}
                                                    className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-slate-900/10 shrink-0 text-base sm:text-lg"
                                                >
                                                    {selectedTable.name}
                                                </motion.div>

                                            {/* 2. Customer Info */}
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <h2 className="text-xs font-black text-slate-900 dark:text-white leading-none truncate uppercase tracking-tight">
                                                    {activeOrderForSelected?.customerName || "Walk-in Customer"}
                                                </h2>
                                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                    <span className="flex items-center gap-1"><User size={8} /> 4 GUESTS</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                                                    <span className="flex items-center gap-1"><ShieldCheck size={8} /> RAHUL S.</span>
                                                </div>
                                            </div>

                                            {/* 3. Divider */}
                                            <div className="h-8 w-[1.5px] bg-slate-100 dark:bg-slate-800 mx-1" />

                                            {/* 4. Status Tags */}
                                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
                                                <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 sm:px-2 py-1 rounded-lg border border-emerald-100/50">● LIVE</span>
                                                {activeOrderForSelected?.isKotPrinted && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/50">
                                                        <Printer size={10} /> KOT PRINTED
                                                    </span>
                                                )}
                                                {activeOrderForSelected?.isBillPrinted && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg border border-rose-100/50">
                                                        <CreditCard size={10} /> BILL PRINTED
                                                    </span>
                                                )}
                                            </div>

                                            {/* 5. Divider */}
                                            <div className="h-8 w-[1.5px] bg-slate-100 dark:bg-slate-800 mx-1" />

                                            {/* 6. Timer (Waiting Time) */}
                                            {(activeOrderForSelected?.createdAt || selectedTable?.startTime) && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10">
                                                    <TableTimer startTime={activeOrderForSelected?.createdAt || selectedTable.startTime} className="!bg-transparent !p-0 !border-none !text-[11px] !font-black !text-emerald-600" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black text-emerald-500/60 uppercase leading-none">SINCE</span>
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase">
                                                            {new Date(activeOrderForSelected?.createdAt || selectedTable.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 7. Items Count */}
                                            {activeOrderForSelected && (
                                                <div className="flex flex-col items-center px-3 border-l border-slate-100 dark:border-slate-800">
                                                    <span className="text-[12px] font-black text-slate-900 dark:text-white leading-none">{activeOrderForSelected.items.length}</span>
                                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ITEMS</span>
                                                </div>
                                            )}

                                            {/* 8. Spacer */}
                                            <div className="flex-1" />

                                            {/* 9. Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        kravy.click();
                                                        router.push(`/dashboard/billing/checkout?tableId=${selectedTable.id}&tableName=${selectedTable.name}&returnTo=/dashboard/terminal`);
                                                    }}
                                                    className="h-10 px-5 rounded-2xl bg-[#6D3BFF] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all group"
                                                >
                                                    <Plus size={14} className="group-hover:rotate-90 transition-transform" /> New Order
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        kravy.click();
                                                        if (activeOrderForSelected) {
                                                            sessionStorage.setItem("quick_pos_handoff_order", JSON.stringify(activeOrderForSelected));
                                                            router.push(`/dashboard/billing/checkout?orderId=${activeOrderForSelected.id}&tableId=${selectedTable.id}&tableName=${selectedTable.name}&returnTo=/dashboard/terminal`);
                                                        } else {
                                                            toast.error("Please select a table/order first");
                                                        }
                                                    }}
                                                    className="h-10 px-5 bg-white dark:bg-slate-800 text-[#0B1B48] dark:text-white rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                                                >
                                                    <Plus size={14} /> Add Item
                                                </button>
                                            </div>
                                        </div>

                                        {/* Multi-Order Selection (if table has multiple orders) */}
                                        {selectedTable && tableOrders.length > 1 && (
                                            <div className="px-6 py-3 border-b border-slate-50 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-hide bg-slate-50/30">
                                                {tableOrders.map(o => (
                                                    <button 
                                                        key={o.id}
                                                        onClick={() => { kravy.click(); setSelectedOrderId(o.id); }}
                                                        className={`shrink-0 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-3 ${activeOrderForSelected?.id === o.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 shadow-lg shadow-slate-900/10" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300"}`}
                                                    >
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeOrderForSelected?.id === o.id ? "bg-white/10" : "bg-slate-50 dark:bg-slate-700"}`}>
                                                            <User size={14} className={activeOrderForSelected?.id === o.id ? "text-white dark:text-slate-900" : "text-slate-400"} />
                                                        </div>
                                                        <div className="flex flex-col items-start gap-0.5">
                                                            <span className="leading-none">{o.customerName || `Order #${o.id.slice(-4).toUpperCase()}`}</span>
                                                            <div className="flex items-center gap-1.5 opacity-60">
                                                                <TableTimer startTime={o.createdAt} className="!bg-transparent !p-0 !border-none !text-[10px] !font-black !text-inherit" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Items - SCROLLABLE ONLY THIS AREA */}
                                        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                                            {activeOrderForSelected ? (
                                                    <div className="space-y-4">
                                                        {/* Enterprise Workflow Stepper */}
                                                        <div className="flex items-center justify-between mb-3 px-4 py-2 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_4px_20px_rgba(15,23,42,0.02)] h-[60px]">
                                                            {[
                                                                { label: "Accepted", active: true },
                                                                { label: "Cooking", active: activeOrderForSelected?.status === "PREPARING" || activeOrderForSelected?.status === "READY" },
                                                                { label: "Ready", active: activeOrderForSelected?.status === "READY" }
                                                            ].map((step, i, arr) => (
                                                                <React.Fragment key={step.label}>
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-700 ${step.active ? "bg-[#0B1B48] text-white shadow-xl scale-110" : "bg-slate-50 text-slate-300 border border-slate-100"}`}>
                                                                            {step.active ? "✓" : i + 1}
                                                                        </div>
                                                                        <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${step.active ? "text-[#0B1B48]" : "text-slate-300"}`}>{step.label}</span>
                                                                    </div>
                                                                    {i < arr.length - 1 && (
                                                                        <div className={`flex-1 h-0.5 max-w-[40px] mx-1 rounded-full transition-all duration-1000 ${step.active && arr[i+1].active ? "bg-[#0B1B48]" : "bg-slate-100"}`} />
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center justify-between px-2 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-6 bg-[#6D3BFF] rounded-full shadow-[0_0_10px_rgba(109,59,255,0.4)]" />
                                                                <span className="text-[11px] font-black uppercase tracking-widest text-[#0B1B48] flex items-center gap-1.5">Order Breakdown</span>
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100/50">Kitchen Priority: HIGH</span>
                                                        </div>
                                                    {(() => {
                                                        const rounds = activeOrderForSelected.items.reduce((acc: any, item: any) => {
                                                            const r = item.kotNumber || "New Items";
                                                            if (!acc[r]) acc[r] = [];
                                                            acc[r].push(item);
                                                            return acc;
                                                        }, {});

                                                        const kotList = activeOrderForSelected.kotNumbers || [];
                                                        
                                                        // Sort rounds: first all KOTs in sequence, then New Items
                                                        const sortedRounds = [
                                                            ...kotList.map((kn: number, i: number) => ({ id: kn, label: `Round ${i + 1} - KOT #${kn}`, items: rounds[kn] })),
                                                            ...(rounds["New Items"] ? [{ id: "New Items", label: "🛒 Current Cart (Not Printed)", items: rounds["New Items"] }] : [])
                                                        ].filter(r => r.items && r.items.length > 0);

                                                        return sortedRounds.map((roundObj, rIdx) => (
                                                            <div key={roundObj.id} className="space-y-2 pb-6 last:pb-2">
                                                                <div className="flex items-center gap-3 px-2 py-1">
                                                                    <div className={`h-[1.5px] flex-1 ${roundObj.id === "New Items" ? "bg-amber-100" : "bg-indigo-100"}`} />
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${roundObj.id === "New Items" ? "text-amber-500" : "text-indigo-500"}`}>
                                                                            {roundObj.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`h-[1.5px] flex-1 ${roundObj.id === "New Items" ? "bg-amber-100" : "bg-indigo-100"}`} />
                                                                </div>
                                                                {roundObj.items.map((item: any, idx: number) => (
                                                                    <motion.div
                                                                        key={`${roundObj.id}-${idx}`}
                                                                        initial={{ opacity: 0, y: 8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: idx * 0.03 }}
                                                                        className={`flex items-center justify-between px-3 py-1.5 min-h-[52px] rounded-xl border transition-all duration-300 group bg-white dark:bg-slate-900/70 border-slate-100 dark:border-slate-800 hover:border-[#6D3BFF]/20 hover:shadow-[0_8px_30px_rgba(15,23,42,0.04)] ${roundObj.id === "New Items" ? "ring-1 ring-amber-200/40" : ""}`}
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            {(() => {
                                                                                const isNonVeg = item.isVeg === false || item.name?.toUpperCase().includes("(NV)");
                                                                                return (
                                                                                    <>
                                                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm border border-white/50 dark:border-slate-800 shrink-0 ${isNonVeg ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
                                                                                            {isNonVeg ? "🍗" : "🥗"}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <p className="text-[11px] font-black text-[#0B1B48] dark:text-white truncate leading-tight uppercase tracking-tight">{item.name}</p>
                                                                                                <div className={`w-1 h-1 rounded-full shrink-0 ${activeOrderForSelected?.status === "READY" ? "bg-emerald-500" : "bg-amber-400"}`} />
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md ${isNonVeg ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"} uppercase tracking-widest border border-current/10`}>
                                                                                                    {isNonVeg ? "Non-Veg" : "Veg"}
                                                                                                </span>
                                                                                                <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                                                                                    ⏱ 12M
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>

                                                                        <div className="flex items-center gap-3">
                                                                            <div className="font-mono text-xs font-black text-[#0B1B48] dark:text-white min-w-[45px] text-right">
                                                                                ₹{item.price}
                                                                            </div>
                                                                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                                                                <button 
                                                                                    onClick={() => { kravy.remove(); handleUpdateItemQty(activeOrderForSelected.id, activeOrderForSelected.items.indexOf(item), item.quantity - 1); }}
                                                                                    className="w-4 h-4 rounded flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-slate-400 transition-all font-black text-[10px]"
                                                                                >
                                                                                    −
                                                                                </button>
                                                                                <span className="w-4 text-center text-[10px] font-black text-[#0B1B48] dark:text-white">
                                                                                    {item.quantity}
                                                                                </span>
                                                                                <button 
                                                                                    onClick={() => { kravy.click(); handleUpdateItemQty(activeOrderForSelected.id, activeOrderForSelected.items.indexOf(item), item.quantity + 1); }}
                                                                                    className="w-4 h-4 rounded flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-[#6D3BFF] transition-all font-black text-[10px]"
                                                                                >
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                            <span className="w-12 text-right text-[11px] font-black text-slate-900">₹{item.price * item.quantity}</span>
                                                                            <button 
                                                                                onClick={() => { kravy.trash(); handleRemoveItem(activeOrderForSelected.id, activeOrderForSelected.items.indexOf(item)); }}
                                                                                className="w-5 h-5 rounded flex items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <Trash2 size={10} />
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
                                                        <UtensilsCrossed size={32} className="text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">🍽 No items added yet</p>
                                                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Start adding dishes to this order</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="text-[8px] font-black px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full uppercase tracking-tighter border border-indigo-100 dark:border-indigo-900/40">🔥 Top Recommendations Available</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Premium Hero Footer Actions - FIXED AT BOTTOM */}
                                        <div className="flex-shrink-0 p-4 border-t border-white/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl">
                                            <div className="flex gap-3 mb-3">
                                                {/* Advanced Workflow Control */}
                                                <div className="flex-1 bg-white/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-3 shadow-[0_4px_20px_rgba(15,23,42,0.02)] flex flex-col justify-between">
                                                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5 mb-2">
                                                        <ChefHat size={10} className="text-[#6D3BFF]" /> 
                                                        Kitchen Operations
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { s: "PREPARING", label: "Start Cooking", icon: <ChefHat size={11} />, active: activeOrderForSelected?.status === "PENDING", color: "bg-[#0B1B48] text-white shadow-[#0B1B48]/20" },
                                                            { s: "READY", label: "Mark Ready", icon: <Check size={11} />, active: activeOrderForSelected?.status === "PREPARING", color: "bg-emerald-600 text-white shadow-emerald-600/20" },
                                                        ].map((btn, i) => (
                                                            <button
                                                                key={i}
                                                                disabled={!activeOrderForSelected || !btn.active}
                                                                onClick={() => updateOrderStatus(activeOrderForSelected!.id, btn.s)}
                                                                className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${btn.active ? `${btn.color} shadow-lg hover:scale-[1.02] active:scale-95` : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed"}`}
                                                            >
                                                                {btn.icon} {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Hero Total Card */}
                                                <div className="w-[200px] h-[100px] bg-gradient-to-br from-[#0B1739] via-[#111C44] to-[#1E293B] text-white rounded-2xl p-4 shadow-[0_15px_40px_rgba(15,23,42,0.4)] flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
                                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 blur-[50px] group-hover:bg-indigo-500/30 transition-all duration-700" />
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6D3BFF]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex justify-between items-start relative z-10">
                                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Grand Total</span>
                                                        <div className="px-1 py-0.5 bg-white/10 rounded text-[6px] font-black uppercase tracking-tighter backdrop-blur-sm border border-white/10">TAX INCLUDED</div>
                                                    </div>
                                                    <div className="relative z-10 flex items-baseline gap-1">
                                                        <span className="text-xl font-light opacity-50">₹</span>
                                                        <strong className="text-4xl font-black italic tracking-tighter drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)]">{activeOrderForSelected?.total ?? "0"}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2.5">
                                                <div className="flex-1 flex gap-2">
                                                    <button
                                                        onClick={() => { 
                                                            if (activeOrderForSelected) setPrintOrder(activeOrderForSelected);
                                                            setPreviewMode("KOT"); 
                                                            setShowPreview(true); 
                                                        }}
                                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 hover:text-white hover:bg-[#0B1B48] hover:border-[#0B1B48] transition-all bg-white dark:bg-slate-900 shadow-sm"
                                                        title="Preview KOT"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const tbl = tablesList.find(t => t.id === activeOrderForSelected?.table?.id);
                                                            if (activeOrderForSelected) {
                                                                setPrintOrder(activeOrderForSelected);
                                                                setPrintTable(tbl || null);
                                                                setTimeout(() => handlePrint("KOT", activeOrderForSelected, tbl || undefined), 100);
                                                            }
                                                        }}
                                                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Printer size={12} /> KOT
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const tbl = tablesList.find(t => t.id === activeOrderForSelected?.table?.id);
                                                            if (activeOrderForSelected) {
                                                                setPrintOrder(activeOrderForSelected);
                                                                setPrintTable(tbl || null);
                                                                const printType = business?.enableKOTWithBill ? "KOT_BILL" : "BILL";
                                                                setTimeout(() => handlePrint(printType, activeOrderForSelected, tbl || undefined), 100);
                                                            }
                                                        }}
                                                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                                                    >
                                                        <Printer size={12} /> {business?.enableKOTWithBill ? "KOT + BILL" : "PRINT BILL"}
                                                    </button>
                                                </div>
                                                <button
                                                    disabled={!activeOrderForSelected}
                                                    onClick={() => {
                                                        if (!activeOrderForSelected || !selectedTable) return;
                                                        kravy.payment();
                                                        setSelectedOrderId(activeOrderForSelected.id);
                                                        setActiveTab("payment");
                                                    }}
                                                    className="flex-[1.5] h-11 rounded-full flex items-center justify-center gap-3 bg-[#6D3BFF] text-white font-black text-[10px] uppercase tracking-[0.25em] shadow-[0_8px_20px_rgba(109,59,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 group"
                                                >
                                                    <span>Print Final Bill</span>
                                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>

                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-12">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6 shadow-inner">
                                            <TableIcon size={32} strokeWidth={1.2} />
                                        </div>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-2">Select a Table</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">Click any table to view active orders</p>
                                    </div>
                                )}
                             </div>
                         </motion.div>
                     )}

                    {/* ── CASHIER / BILLING TAB ── */}
                    {activeTab === "payment" && (
                        <motion.div
                            key="payment"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center p-4 lg:p-8 overflow-y-auto no-scrollbar bg-[#0f111a]"
                        >
                            {selectedTable && activeOrderForSelected ? (
                                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 w-full max-w-7xl h-full lg:h-auto max-h-[90vh]">
                                    
                                    {/* LEFT PANEL: Order Summary */}
                                    <div className="bg-[#1a1d27] rounded-xl flex flex-col overflow-hidden border border-slate-800 shadow-2xl">
                                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-slate-200">Order Summary</h3>
                                        </div>
                                        
                                        <div className="p-5 flex gap-8 items-start border-b border-slate-800/50 text-slate-300">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">ID</p>
                                                <span className="px-2 py-1 text-xs font-semibold bg-emerald-900/30 text-emerald-400 rounded">Active</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Table</p>
                                                <span className="px-2 py-1 text-xs font-semibold bg-indigo-900/30 text-indigo-400 rounded">{selectedTable.name}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Order Type</p>
                                                <span className="px-2 py-1 text-xs font-semibold bg-indigo-900/30 text-indigo-400 rounded">Dine In</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Waiter</p>
                                                <span className="text-sm font-semibold">-</span>
                                            </div>
                                        </div>

                                        <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <User size={18} className="text-emerald-500" />
                                                <span className="text-sm font-medium">{activeOrderForSelected.customerName || "Guest (+1)"}</span>
                                            </div>
                                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 transition-colors">
                                                <Edit3 size={14} /> Edit Details
                                            </button>
                                        </div>

                                        {/* Tabs */}
                                        <div className="flex px-5 border-b border-slate-800 pt-2 gap-6">
                                            {["ITEMS", "KOT", "RESERVATION"].map(tab => (
                                                <button 
                                                    key={tab}
                                                    onClick={() => setSettleTab(tab as any)}
                                                    className={`pb-3 text-sm font-medium transition-colors ${settleTab === tab ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-400"}`}
                                                >
                                                    {tab === "ITEMS" ? "Ordered Items" : tab === "KOT" ? "KOT History" : "User Reservation History"}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Table */}
                                        <div className="flex-1 overflow-y-auto">
                                            {settleTab === "ITEMS" ? (
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-xs text-slate-400 bg-slate-800/20">
                                                        <tr>
                                                            <th className="px-5 py-4 font-medium">Item Name</th>
                                                            <th className="px-5 py-4 font-medium text-center">Qty</th>
                                                            <th className="px-5 py-4 font-medium text-right">Price</th>
                                                            <th className="px-5 py-4 font-medium text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activeOrderForSelected.items.map((it, idx) => (
                                                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                                                <td className="px-5 py-4 font-medium">{it.name}</td>
                                                                <td className="px-5 py-4 text-center">{it.quantity}</td>
                                                                <td className="px-5 py-4 text-right">₹{it.price}</td>
                                                                <td className="px-5 py-4 text-right font-semibold">₹{it.price * it.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-8 text-center text-slate-500 text-sm">
                                                    No history available.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT PANEL: Billing Calculation */}
                                    <div className="bg-[#1a1d27] rounded-xl flex flex-col border border-slate-800 shadow-2xl relative">
                                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-slate-200">Billing Calculation</h3>
                                            <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors">
                                                Add Charges
                                            </button>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col gap-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-300 font-medium">Subtotal</span>
                                                <span className="text-slate-200 font-semibold">₹{settlementBill?.subtotal.toFixed(2)}</span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-slate-300 font-medium whitespace-nowrap">Discount</span>
                                                <div className="flex flex-1 items-center justify-end gap-2">
                                                    <div className="flex border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50 w-24">
                                                        <input 
                                                            type="number"
                                                            value={discountValue}
                                                            onChange={e => setDiscountValue(e.target.value)}
                                                            placeholder="0"
                                                            className="w-full bg-transparent text-slate-200 text-right px-3 py-1.5 text-sm outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => setDiscountType("PERCENT")}
                                                            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${discountType === "PERCENT" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                                                        >
                                                            %
                                                        </button>
                                                        <button 
                                                            onClick={() => setDiscountType("FLAT")}
                                                            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${discountType === "FLAT" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                                                        >
                                                            ₹
                                                        </button>
                                                    </div>
                                                </div>
                                                <span className="text-slate-200 font-semibold w-20 text-right">
                                                    ₹{settlementBill?.discountAmt.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-300 font-medium">CGST</span>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => setIsCgstEnabled(!isCgstEnabled)}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${isCgstEnabled ? "bg-slate-300" : "bg-slate-700"}`}
                                                    >
                                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${isCgstEnabled ? "bg-white left-[22px]" : "bg-slate-400 left-0.5"}`} />
                                                    </button>
                                                    <span className="text-slate-200 font-semibold w-20 text-right">₹{settlementBill?.cgst.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-300 font-medium">SGST</span>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => setIsSgstEnabled(!isSgstEnabled)}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${isSgstEnabled ? "bg-slate-300" : "bg-slate-700"}`}
                                                    >
                                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${isSgstEnabled ? "bg-white left-[22px]" : "bg-slate-400 left-0.5"}`} />
                                                    </button>
                                                    <span className="text-slate-200 font-semibold w-20 text-right">₹{settlementBill?.sgst.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
                                                <span className="text-slate-200 font-semibold text-lg">Total</span>
                                                <span className="text-emerald-400 bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-900/50 font-bold text-lg">
                                                    ₹{settlementBill?.total.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5 border-t border-slate-800 bg-[#161821] rounded-b-xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                                    <CreditCard size={16} />
                                                    <span className="font-medium">Payment Method</span>
                                                </div>
                                                <select 
                                                    value={payMethod}
                                                    onChange={e => setPayMethod(e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg outline-none text-sm w-32"
                                                >
                                                    <option value="CASH">CASH</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="CARD">CARD</option>
                                                    <option value="WALLET">WALLET</option>
                                                </select>

                                                <button className="flex items-center gap-1 border border-slate-700 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm transition-colors ml-auto">
                                                    <X size={14} /> Clear
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={printBillOnConfirm}
                                                        onChange={e => setPrintBillOnConfirm(e.target.checked)}
                                                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-blue-500" 
                                                    />
                                                    <span className="text-slate-300 text-sm font-medium">Print Bill</span>
                                                </label>

                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => setActiveTab("dashboard")}
                                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors"
                                                    >
                                                        <ArrowLeft size={16} /> Back
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            await handleCheckout(activeOrderForSelected.id);
                                                            if (printBillOnConfirm) {
                                                                setPrintOrder(activeOrderForSelected);
                                                                setPrintTable(selectedTable);
                                                                setPrintMode("BILL");
                                                            } else {
                                                                setActiveTab("dashboard");
                                                            }
                                                        }}
                                                        disabled={isSettling}
                                                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                                                    >
                                                        <ShoppingBag size={16} /> {isSettling ? "Confirming..." : "Confirm"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center max-w-sm opacity-50 animate-in fade-in zoom-in-95">
                                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-6 border border-slate-700 shadow-inner">
                                        <CreditCard size={40} />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-200 mb-2">Billing Vault</p>
                                    <p className="text-sm text-slate-400 mb-8">Select an active table from Terminal to initiate checkout flow.</p>
                                    <button onClick={() => setActiveTab("dashboard")} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-500 transition-colors">
                                        Back to Terminal
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>



            {/* ═══ ADD ITEM MODAL ═══ */}
            <AnimatePresence>
                {showAddItemModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAddItemModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-[600px] h-[80vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Add Items</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Updating Order #{orderToUpdate?.id.slice(-4).toUpperCase()}</p>
                                </div>
                                <button onClick={() => setShowAddItemModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search menu items..."
                                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={itemSearch}
                                        onChange={e => setItemSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {menuItems
                                    .filter(it => it.isActive !== false) // 🛡️ Hide Offline Items
                                    .filter(it => !itemSearch || it.name.toLowerCase().includes(itemSearch.toLowerCase()))
                                    .map(it => (
                                        <div 
                                            key={it.id} 
                                            onClick={() => {
                                                kravy.click();
                                                addItemToOrder(it);
                                            }}
                                            className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 border border-slate-300 flex items-center justify-center shrink-0`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${it.isVeg === false ? "bg-rose-600" : "bg-emerald-600"}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{it.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">₹{it.price}</p>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <Plus size={20} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Modular Shared Templates for Thermal Printing */}
            <PrintTemplates
                receiptRef={billReceiptRef}
                kotRef={kotReceiptRef}
                business={business}
                billNumber={printOrder?.billNumber || (printOrder?.id ? `ORD-${printOrder.id.slice(-4).toUpperCase()}` : "DRAFT")}
                billDate={printOrder?.createdAt ? new Date(printOrder.createdAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\//g, '|').replace(',', ' -') : new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\//g, '|').replace(',', ' -')}
                tokenNumber={(() => {
                    const tn = printOrder?.tokenNumber;
                    if (tn == null || tn === "" || tn === 0) return "---";
                    if (typeof tn === 'object' && (tn as any).$numberLong) return (tn as any).$numberLong.toString().padStart(3, '0');
                    return tn.toString().padStart(3, '0');
                })()}
                selectedTable={printOrder?.table?.name || "Counter"}
                customerName={printOrder?.customerName?.trim() || "Walk-in Customer"}
                customerPhone={printOrder?.customerPhone || ""}
                customerAddress={printOrder?.customerAddress || ""}
                orderNotes={printOrder?.notes || ""}
                buyerGSTIN=""
                placeOfSupply=""
                items={printOrder?.items.map(it => ({
                    name: it.name,
                    qty: it.quantity,
                    rate: it.price,
                    gst: it.gst,
                    isNew: it.isNew
                })) || []}
                subtotal={printOrder ? calculateOrderTotals(printOrder.items, isTaxEnabled, globalRate, perProductEnabled).subtotal : 0}
                discountAmt={0}
                appliedOffer={null}
                taxActive={isTaxEnabled}
                perProductEnabled={perProductEnabled}
                globalRate={globalRate}
                totalTaxable={printOrder ? calculateOrderTotals(printOrder.items, isTaxEnabled, globalRate, perProductEnabled).subtotal : 0}
                totalGst={printOrder ? calculateOrderTotals(printOrder.items, isTaxEnabled, globalRate, perProductEnabled).gst : 0}
                taxBreakup={[]}
                deliveryCharge={0}
                deliveryGst={0}
                packagingCharge={0}
                packagingGst={0}
                serviceCharge={0}
                finalTotal={printOrder?.total || 0}
                paymentMode={payMethod || "Cash"}
                paymentStatus="Paid"
                upiTxnRef=""
                qrUrl={qrUrl}
                kotNumbers={printOrder?.kotNumbers || []}
                prevWalletBalance={null}
                selectedParty={null}
                numberToWords={numberToWords}
            />

            {/* Modular Bill Preview Modal */}
            <BillPreview 
                showPreview={showPreview}
                setShowPreview={setShowPreview}
                previewZoom={previewZoom}
                setPreviewZoom={setPreviewZoom}
                business={business}
                billNumber={printOrder?.billNumber || (printOrder?.id ? `ORD-${printOrder.id.slice(-4).toUpperCase()}` : "DRAFT")}
                billDate={printOrder?.createdAt ? new Date(printOrder.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                tokenNumber={(() => {
                    const tn = printOrder?.tokenNumber || activeOrderForSelected?.tokenNumber;
                    if (tn == null || tn === "" || tn === 0) return "---";
                    if (typeof tn === 'object' && (tn as any).$numberLong) return (tn as any).$numberLong.toString().padStart(3, '0');
                    return tn.toString().padStart(3, '0');
                })()}
                selectedTable={printOrder?.table?.name || "Counter"}
                customerName={printOrder?.customerName?.trim() || "Walk-in Customer"}
                customerPhone={printOrder?.customerPhone || ""}
                customerAddress={printOrder?.customerAddress || ""}
                orderNotes={printOrder?.notes || ""}
                placeOfSupply=""
                items={printOrder?.items.map((it: any) => ({
                    name: it.name,
                    qty: Number(it.qty || it.quantity || 0),
                    rate: Number(it.rate || it.price || 0),
                    gst: it.gst || 0,
                    taxStatus: it.taxStatus || "Without Tax"
                })) || []}
                subtotal={printOrder ? calculateOrderTotals(printOrder.items, isTaxEnabled, globalRate, perProductEnabled).subtotal : 0}
                discountAmt={0}
                appliedOffer={null}
                taxActive={isTaxEnabled}
                perProductEnabled={perProductEnabled}
                totalTaxable={printOrder ? calculateOrderTotals(printOrder.items, isTaxEnabled, globalRate, perProductEnabled).subtotal : 0}
                totalGst={printOrder ? calculateOrderTotals(printOrder.items, isTaxEnabled, globalRate, perProductEnabled).gst : 0}
                taxBreakup={[]}
                deliveryCharge={0}
                deliveryGst={0}
                packagingCharge={0}
                packagingGst={0}
                finalTotal={printOrder?.total || 0}
                paymentMode={payMethod || "Cash"}
                paymentStatus="Paid"
                qrUrl={qrUrl}
                numberToWords={numberToWords}
                kravy={kravy}
                kotNumbers={printOrder?.kotNumbers || []}
                // Actions - Adapting for workflow
                printKOT={() => handlePrint("KOT", printOrder || undefined)}
                printReceipt={(enableKOT, customBill) => {
                    handlePrint("BILL", customBill || printOrder || undefined);
                    setTimeout(resetForm, 500);
                }}
                saveBill={async () => {
                    if (printOrder?.id) {
                        return await handleCheckout(printOrder.id, true);
                    }
                    return null;
                }}
                resetForm={() => setShowPreview(false)}
                isSaving={false}
                lastSavedBillId={printOrder?.id || null}
                userRole={userRole || "ADMIN"}
                userPermissions={userPermissions || []}
                resumeBillId={null}
                router={router}
            />
        </div>
    );

    async function addItemToOrder(menuItem: any) {
        console.log("[DEBUG] addItemToOrder started. MenuItem:", menuItem);
        if (!orderToUpdate) {
            console.error("[ERROR] No order selected to update!");
            toast.error("Please select an order first");
            return;
        }
        
        try {
            console.log("[DEBUG] Current Order to update:", orderToUpdate);
            const newItem: OrderItem = {
                itemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: 1,
                isVeg: menuItem.isVeg,
                isNew: true,
                taxStatus: menuItem.taxStatus || "Without Tax",
                gst: menuItem.gst ?? 0
            };

            const updatedItems = [...orderToUpdate.items, newItem];
            console.log("[DEBUG] Updated items list:", updatedItems);

            const { total: newTotal } = calculateOrderTotals(updatedItems, isTaxEnabled, globalRate, perProductEnabled);
            console.log("[DEBUG] Calculated new total:", newTotal);

            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderToUpdate.id,
                    items: updatedItems,
                    total: newTotal
                })
            });

            console.log("[DEBUG] API Response Status:", res.status);
            if (res.ok) {
                toast.success(`Added ${menuItem.name} to order`);
                console.log("[SUCCESS] Item added. Refreshing data...");
                fetchData(false, true); // ✅ Force refresh
                setShowAddItemModal(false);
                setItemSearch("");
            } else {
                const errData = await res.json();
                console.error("[ERROR] API Failure:", errData);
                toast.error("Failed to add item: " + (errData.message || "Unknown error"));
            }
        } catch (err) {
            console.error("[CRITICAL] addItemToOrder caught error:", err);
            toast.error("An error occurred while adding item");
        }
    }
}
export default function WorkflowPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center font-black uppercase tracking-[0.2em] animate-pulse">Loading Workflow...</div>}>
            <KravyPOS />
        </Suspense>
    );
}
