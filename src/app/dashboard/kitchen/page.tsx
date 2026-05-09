"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useTerminalContext } from "@/components/TerminalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { kravy } from "@/lib/sounds";
import {
    LayoutDashboard, ChefHat, MapPin, CreditCard,
    Clock, Bell, TrendingUp, ArrowRight, Check,
    Flame, UtensilsCrossed, Plus, Trash2, Eye,
    Printer, X, Filter, Search, User, ChevronRight,
    Edit3, LogOut, Table as TableIcon, History,
    RotateCcw, MoreHorizontal, Zap, Star, ShieldCheck, Layers, CheckCircle2,
    Wifi, Battery, Signal, Smartphone, Timer, AlertTriangle, ChevronUp, Package2,
    Terminal as TerminalIcon, LayoutGrid, ListTodo, ZoomIn, ZoomOut, Phone, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
    DndContext, 
    useSensor, 
    useSensors, 
    PointerSensor, 
    DragEndEvent,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import PrintTemplates from "@/components/printing/PrintTemplates";
import BillPreview from "@/components/printing/BillPreview";
import { CSS } from '@dnd-kit/utilities';
import OrderAlertLoop from "./components/order-alert-loop";
import { useAuthContext } from "@/components/AuthContext";

// --- TYPES ---
type OrderItem = {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    isVeg?: boolean;
    isNew?: boolean;
    instruction?: string;
    variants?: any[];
    taxStatus?: string;
    gst?: number;
};

type Order = {
    id: string;
    items: OrderItem[];
    total: number;
    status: "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "COMPLETED";
    table?: { id: string; name: string };
    customerName?: string;
    customerPhone?: string;
    createdAt: string;
    caseType?: string;
    parentOrderId?: string;
    isMerged?: boolean;
    isKotPrinted?: boolean;
    customerAddress?: string;
    updatedAt: string;
    notes?: string;
    preferences?: {
        dontSendCutlery?: boolean;
    };
    isDeleted?: boolean;
    tokenNumber?: number;
    kotNumbers?: number[];
};

type TableStatus = {
    id: string;
    name: string;
    isOccupied: boolean;
    activeOrderId?: string;
    status: "FREE" | "PENDING" | "ACCEPTED" | "PREPARING" | "READY";
    activeCount: number;
    startTime?: string;
};

const TableTimer = ({ startTime, className = "" }: { startTime?: string, className?: string }) => {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        if (!startTime) {
            setElapsed("");
            return;
        }

        const update = () => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
            
            if (diff < 0) {
                setElapsed("0s");
                return;
            }

            const secs = diff % 60;
            const mins = Math.floor(diff / 60);
            const hrs = Math.floor(mins / 60);
            
            if (hrs > 0) {
                setElapsed(`${hrs}h ${mins % 60}m`);
            } else if (mins > 0) {
                setElapsed(`${mins}m ${secs}s`);
            } else {
                setElapsed(`${secs}s`);
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime) return null;

    return (
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 text-[8px] font-mono font-bold text-slate-500 dark:text-slate-400 ${className}`}>
            <Clock size={8} strokeWidth={3} className="opacity-70" />
            {elapsed}
        </span>
    );
};

const TABS = [
    { key: "live-orders", label: "Live Orders", icon: ChefHat },
    { key: "kitchen", label: "Kitchen", icon: ChefHat },
    { key: "track", label: "Tracking", icon: MapPin },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
        const q = Number(it.qty || it.quantity || 0);
        const p = Number(it.rate || it.price || 0);
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

// --- DND HELPERS ---
const DraggableOrderCard = ({ children, id, order }: any) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { order }
    });
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as any,
    };
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
            {children}
        </div>
    );
};

const DroppableColumn = ({ children, id, className, isOverStyle }: any) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={`${className} ${isOver ? isOverStyle : ""}`}>
            {children}
        </div>
    );
};

function KravyPOS() {
    const router = useRouter();
    const billReceiptRef = useRef<HTMLDivElement | null>(null);
    const kotReceiptRef = useRef<HTMLDivElement | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("live-orders");
    const [liveOrderTab, setLiveOrderTab] = useState<"PREPARING" | "READY" | "COMPLETED">("PREPARING");
    const [liveOrderSearch, setLiveOrderSearch] = useState("");
    const { 
        orders, 
        tablesList, 
        business, 
        isLoading, 
        fetchData, 
        updateTableStatus,
        setOrders 
    } = useTerminalContext();
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [payMethod, setPayMethod] = useState("upi");
    const [tableSearch, setTableSearch] = useState("");
    const searchParams = useSearchParams();
    const { user: authUser } = useAuthContext();
    const userRole = authUser?.type || null;
    const userPermissions = authUser?.permissions || [];
    const [tableFilter, setTableFilter] = useState<"ALL" | "RUNNING" | "READY">("ALL");
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
    const [isMobile, setIsMobile] = useState(false);
    const [selectedParty, setSelectedParty] = useState<any>(null);
    const [clock, setClock] = useState("");
    const [dateStr, setDateStr] = useState("");

    
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
            const q = Number(it.quantity || 0);
            const p = Number(it.price || 0);
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
        fetchMenu();
        fetchData(); 
        const orderId = searchParams.get("orderId");

        setActiveTab("live-orders");

        if (orderId) {
            setSelectedOrderId(orderId);
        }
    }, [searchParams]);

    const fetchMenu = async () => {
        try {
            const res = await fetch("/api/items");
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data);
            }
        } catch (err) {
            console.error("Failed to fetch menu:", err);
        }
    };
    const [printMode, setPrintMode] = useState<"KOT" | "BILL" | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState<"KOT" | "BILL">("BILL");
    const [previewZoom, setPreviewZoom] = useState(1);
    const [printOrder, setPrintOrder] = useState<Order | null>(null);
    const [printTable, setPrintTable] = useState<TableStatus | null>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
    const [itemSearch, setItemSearch] = useState("");
    const [selectedItemForAdd, setSelectedItemForAdd] = useState<any>(null);
    const [addQty, setAddQty] = useState(1);

    // Manual Combination States
    const [showCombineModal, setShowCombineModal] = useState(false);
    const [combineSelection, setCombineSelection] = useState<Set<string>>(new Set());

    const handlePrint = async (type: "KOT" | "BILL" | "COMBINED_BILL" | "MANUAL_COMBINE" | "KOT_BILL", customOrder?: Order, customTable?: TableStatus) => {
        kravy.click();

        let targetOrder = customOrder || printOrder || activeOrderForSelected;
        let targetTable = customTable || printTable || selectedTable;

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

        // Wait for state update
        console.log(`[PRINT] Starting ${type} flow...`);

        setTimeout(() => {
            const isBill = type === "BILL" || type === "COMBINED_BILL" || type === "MANUAL_COMBINE" || type === "KOT_BILL";
            const autoBoth = type === "KOT_BILL" || (isBill && business?.enableKOTWithBill && type !== "MANUAL_COMBINE" && type !== "COMBINED_BILL");
            
            let printHTML = "";
            if (autoBoth) {
                const kotContent = kotReceiptRef.current?.innerHTML || "";
                const billContent = billReceiptRef.current?.innerHTML || "";
                printHTML = `
                    <div class="kot-section">${kotContent}</div>
                    <div style="border-top: 2px dashed #000; margin: 30px 0; position: relative;">
                        <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 10px; font-size: 8px; font-weight: bold; text-transform: uppercase;">Final Bill Follows</span>
                    </div>
                    <div class="bill-section">${billContent}</div>
                `;
            } else {
                const targetRef = isBill ? billReceiptRef.current : kotReceiptRef.current;
                if (!targetRef) return;
                printHTML = targetRef.innerHTML;
            }

            const printStyles = `
                @media print {
                    html, body { 
                        height: auto !important; 
                        overflow: visible !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }
                    body > *:not(#print-receipt-container) { display: none !important; }
                    @page { margin: 0; size: auto; }
                    #print-receipt-container {
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
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    img { 
                        filter: grayscale(100%) contrast(300%) !important; 
                        max-width: 100% !important;
                        display: block !important;
                        margin: 0 auto !important;
                    }
                }
            `;

            const styleSheet = document.createElement("style");
            styleSheet.textContent = printStyles;
            document.head.appendChild(styleSheet);

            const printContainer = document.createElement("div");
            printContainer.id = "print-receipt-container";
            printContainer.className = "font-mono text-[11px] leading-tight font-bold";
            printContainer.innerHTML = printHTML;
            document.body.appendChild(printContainer);

            kravy.print();
            window.print();

            setTimeout(() => {
                if (document.head.contains(styleSheet)) document.head.removeChild(styleSheet);
                if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
            }, 1000);

            if (targetOrder && type !== "MANUAL_COMBINE") {
                const body: any = { orderId: (targetOrder as any).id.includes("Combined") ? customOrder?.id || printOrder?.id : targetOrder.id };
                if (type === "KOT" || autoBoth) {
                    body.isKotPrinted = true;
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
        }, 100);
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
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: newItems, total: finalTotal } : o));
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

    useEffect(() => {
        fetchData(false, true); // ✅ Force fetch on mount to see new orders instantly
    }, [fetchData]);
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
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to delete order");
        }
    };

    const handleCheckout = async (targetOrderId: string, silent = false) => {
        const order = orders.find(o => o.id === targetOrderId);
        if (!order) return;

        const { subtotal: orderSubtotal, gst: orderGst, total: orderTotal } = calculateOrderTotals(order.items, isTaxEnabled, globalRate, perProductEnabled);

        try {
            if (payMethod === "wallet") {
                if (!selectedParty) {
                    toast.error("Please link a customer to use Wallet payment");
                    return;
                }
                if ((selectedParty.walletBalance || 0) < orderTotal) {
                    toast.error("Insufficient wallet balance");
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
                paymentMode: payMethod.toUpperCase(),
                paymentStatus: "Paid",
                customerName: order.customerName || "Walk-in",
                tableName: order.table?.name || "Counter",
                tokenNumber: order.tokenNumber,
                kotNumbers: order.kotNumbers || []
            };
            const res = await fetch("/api/bill-manager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(billData) });
            if (!res.ok) throw new Error("fail");

            // Only update status if not already COMPLETED (to avoid loop)
            if (order.status !== "COMPLETED") {
                await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: targetOrderId, status: "COMPLETED" }) });
            }

            if (!silent) {
                kravy.payment();
                toast.success("Transaction Finalized! 💰");
                setSelectedTableId(null);
                setActiveTab("dashboard");
            }
            fetchData();
        } catch {
            if (!silent) {
                kravy.error();
                toast.error("Checkout failed");
            }
        }
    };


    const upiLink = business?.upi ? `upi://pay?pa=${business.upi}&pn=${encodeURIComponent(business.businessName || "Store")}&am=${grandTotal.toFixed(2)}&cu=INR` : "";
    const qrUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}` : "";
    const filteredTables = useMemo(() => tablesList.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(tableSearch.toLowerCase());
        const matchFilter = tableFilter === "ALL" || (tableFilter === "RUNNING" && t.status === "PREPARING") || (tableFilter === "READY" && t.status === "READY");
        return matchSearch && matchFilter;
    }), [tablesList, tableSearch, tableFilter]);

    const stats = {
        running: orders.filter(o => o.status === "PREPARING" && !o.isDeleted).length,
        pending: orders.filter(o => (o.status === "PENDING" || o.status === "ACCEPTED") && !o.isDeleted).length, // Total active queue
        incoming: orders.filter(o => o.status === "PENDING" && !o.isDeleted).length, // Just new ones
        ready: orders.filter(o => o.status === "READY" && !o.isDeleted).length,
        sales: orders.filter(o => o.status === "COMPLETED" && !o.isDeleted).reduce((s, o) => s + o.total, 0)
    };

    const statusConfig = {
        FREE: { bg: "bg-slate-50", text: "text-slate-400", dot: "bg-slate-300", ring: "ring-slate-100", label: "Vacant", btn: "bg-slate-900" },
        PENDING: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200", label: "Reviewing", btn: "bg-rose-600 hover:bg-rose-700" },
        ACCEPTED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200", label: "Accepted", btn: "bg-amber-600 hover:bg-amber-700" },
        PREPARING: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", ring: "ring-indigo-200", label: "Preparing", btn: "bg-indigo-600 hover:bg-indigo-700" },
        READY: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200", label: "Serve Now", btn: "bg-emerald-600 hover:bg-emerald-700" }
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
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
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
            <header className="flex flex-col lg:flex-row items-center justify-between px-4 lg:px-8 min-h-[64px] lg:h-[64px] shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-[50] py-3 lg:py-0 gap-4 lg:gap-8 transition-colors duration-300">
                {/* Brand & Mobile Actions */}
                <div className="flex items-center justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center font-mono text-lg font-bold text-white shadow-lg shadow-slate-900/20 flex-shrink-0">
                            <span>K</span>
                        </div>
                        <div>
                            <div className="text-base font-black text-slate-900 dark:text-white leading-none">Kravy <em className="text-rose-500 not-italic">POS</em></div>
                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Management</div>
                        </div>
                    </div>

                    <div className="flex lg:hidden items-center gap-2">
                        <button className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400"><User size={14} /></button>
                    </div>
                </div>

                {/* Navigation Tabs (Scrollable on mobile) */}
                {(
                    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full lg:w-auto justify-start lg:justify-center -mx-4 px-4 lg:mx-0 lg:px-0">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.key;
                            let badgeCount = 0;
                            if (t.key === "live-orders") badgeCount = stats.pending + stats.running;
                            if (t.key === "kitchen") badgeCount = stats.pending + stats.running;


                            return (
                                <button
                                    key={t.key}
                                    onClick={() => { kravy.click(); setActiveTab(t.key); }}
                                    className={`relative flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-[11px] lg:text-xs font-bold transition-all whitespace-nowrap ${isActive ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                                >
                                    <Icon size={14} />
                                    <span>{t.label}</span>
                                    {badgeCount > 0 && (
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm bg-rose-500">
                                            {badgeCount}
                                        </span>
                                    )}
                                    {isActive && <motion.div layoutId="nav-ind" className="absolute -bottom-[21px] lg:-bottom-[17px] left-3 right-3 h-0.5 bg-slate-900 dark:bg-white rounded-t-full" />}
                                </button>
                            );
                        })}
                    </nav>
                )}

                {/* Right Controls (Hidden on mobile stats, shown buttons on desktop) */}
                <div className="hidden lg:flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span>Live Sync</span>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center">
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mr-2">Pulse:</span>
                                <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200 leading-none">{clock}</div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">{dateStr}</div>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-center gap-3">
                        <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"><User size={16} /></button>
                    </div>
                </div>
            </header>

            {/* ═══ MAIN ═══ */}
            <main className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* ── LIVE ORDERS / QR MANAGER TAB ── */}
                    {activeTab === "live-orders" && (
                        <motion.div
                            key="live-orders"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
                        >
                            {/* Live Orders Sub-Header */}
                            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
                                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                    {(["PREPARING", "READY", "COMPLETED"] as const).map(tab => {
                                        const count = tab === "PREPARING"
                                            ? orders.filter(o => ["PENDING", "ACCEPTED", "PREPARING"].includes(o.status) && !o.isDeleted).length
                                            : tab === "READY"
                                                ? orders.filter(o => o.status === "READY" && !o.isDeleted).length
                                                : orders.filter(o => o.status === "COMPLETED" && !o.isDeleted).length;

                                        const isActive = liveOrderTab === tab;
                                        const label = tab === "PREPARING" ? "Preparing" : tab === "READY" ? "Ready" : "Served";

                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => { kravy.click(); setLiveOrderTab(tab); }}
                                                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 border ${isActive
                                                        ? "bg-[#EF6C00] text-white border-[#EF6C00] shadow-sm"
                                                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                {label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by the 4 digit order ID"
                                            className="w-full h-10 pl-11 pr-4 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                            value={liveOrderSearch}
                                            onChange={e => setLiveOrderSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative group">
                                        <select className="h-10 px-4 pr-10 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none cursor-pointer">
                                            <option>Placed At</option>
                                        </select>
                                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-blue-600" />
                                    </div>
                                    <button onClick={fetchData} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"><RotateCcw size={18} /></button>
                                </div>
                            </div>

                            {/* Orders Grid */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <div className="max-w-7xl mx-auto space-y-6">
                                    {orders
                                        .filter(o => {
                                            const statusMatch = liveOrderTab === "PREPARING"
                                                ? ["PENDING", "ACCEPTED", "PREPARING"].includes(o.status)
                                                : o.status === liveOrderTab && !o.isDeleted;
                                            const searchMatch = !liveOrderSearch || o.id.toLowerCase().includes(liveOrderSearch.toLowerCase()) || (o.customerName && o.customerName.toLowerCase().includes(liveOrderSearch.toLowerCase()));
                                            return statusMatch && searchMatch && !o.isDeleted;
                                        })
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .map((order, idx) => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[180px] hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
                                            >
                                                {/* Left Section: Info & Buttons */}
                                                <div className="md:w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                                                    <div className="bg-[#E8EAF6] dark:bg-indigo-900/30 text-[#3F51B5] dark:text-indigo-300 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                                        QR ORDER - {order.caseType || "DINE-IN"}
                                                    </div>
                                                    <div className="p-4 flex-1 space-y-4">
                                                        <div>
                                                            <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{business?.businessName || "Terminal kitchen"}</h3>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{order.table?.name || "Counter"}</p>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">ID: {order.id.slice(-4).toUpperCase()}</p>
                                                            {(order.kotNumbers && order.kotNumbers.length > 0) ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Tokens</span>
                                                                    <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 font-mono leading-none">{order.kotNumbers.join(', ')}</span>
                                                                </div>
                                                            ) : order.tokenNumber ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Token</span>
                                                                    <span className="text-[14px] font-black text-indigo-600 dark:text-indigo-400 font-mono leading-none">{String(order.tokenNumber).padStart(2, '0')}</span>
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 flex flex-col gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            const tbl = tablesList.find(t => t.id === order.table?.id);
                                                                            setPrintOrder(order);
                                                                            setPrintTable(tbl || null);
                                                                            setTimeout(() => handlePrint("KOT", order, tbl || undefined), 100);
                                                                        }}
                                                                        className="w-full h-8 rounded border border-blue-600 bg-white text-[10px] font-black uppercase text-blue-600 flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-all font-mono"
                                                                    >
                                                                        <Printer size={12} /> KOT
                                                                    </button>
                                                                    <button onClick={() => handleSaveAction("KOT", order)} className="text-[7px] font-black uppercase text-indigo-500 hover:underline tracking-tighter text-center">Save KOT</button>
                                                                </div>
                                                                <div className="flex-1 flex flex-col gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            const tbl = tablesList.find(t => t.id === order.table?.id);
                                                                            setPrintOrder(order);
                                                                            setPrintTable(tbl || null);
                                                                            setPreviewMode("BILL");
                                                                            setShowPreview(true);
                                                                        }}
                                                                        className="w-full h-8 rounded border border-emerald-600 bg-white text-[10px] font-black uppercase text-emerald-600 flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all font-mono"
                                                                    >
                                                                        <CreditCard size={12} /> Bill
                                                                    </button>
                                                                    <button onClick={() => handleSaveAction("BILL", order)} className="text-[7px] font-black uppercase text-emerald-500 hover:underline tracking-tighter text-center">Save Bill</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* COMBINED BILL ACTION */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowCombineModal(true);
                                                                setCombineSelection(new Set([order.id]));
                                                            }}
                                                            className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50 text-[10px] font-black uppercase text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm italic"
                                                        >
                                                            <Layers size={14} /> Merge & Combine Bill
                                                        </button>

                                                        <div className="pt-2 border-t border-slate-100 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight truncate">{order.customerName || "WALK-IN"}</span>
                                                                <Phone size={12} className="text-slate-400" />
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-500">{order.customerPhone || "No contact"}</p>
                                                            <p className="text-[10px] text-slate-400 leading-tight">1st order</p>
                                                            {order.customerAddress && (
                                                                <p className="text-[10px] font-bold text-blue-600 leading-tight border-l-2 border-blue-200 pl-2 mt-2 bg-blue-50/50 py-1">
                                                                    <MapPin size={10} className="inline mr-1" /> {order.customerAddress}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline">
                                                            <Clock size={10} /> Timeline
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle Section: Items & Status */}
                                                <div className="flex-1 p-6 flex flex-col border-r border-slate-200 dark:border-slate-800" style={{ minWidth: 0 }}>
                                                    <div className={`flex items-center gap-2 mb-4 text-[11px] font-black uppercase tracking-wider ${order.preferences?.dontSendCutlery ? "text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100" : "text-emerald-600"}`}>
                                                        {order.preferences?.dontSendCutlery ? (
                                                            <>
                                                                <AlertTriangle size={12} />
                                                                Don't send cutlery
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 size={12} />
                                                                Send cutlery
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        {order.items.map((it, i) => (
                                                            <div key={i} className="flex items-start justify-between group/item">
                                                                <div className="flex items-start gap-2 min-w-0">
                                                                    <div className={`mt-1 w-3 h-3 border border-slate-300 flex items-center justify-center shrink-0`}>
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${it.isVeg === false ? "bg-rose-600" : "bg-emerald-600"}`} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                            <span className="font-bold">{it.quantity} x</span> {it.name}
                                                                            {it.isNew && (
                                                                                <span className="ml-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter animate-pulse shadow-sm">NEW ITEM</span>
                                                                            )}
                                                                        </span>
                                                                        {it.variants && it.variants.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                                                {it.variants.map((v: any, idx: number) => (
                                                                                    <span key={idx} className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-indigo-100 italic">
                                                                                        {v.option}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{it.instruction || "Standard Prepared"}</span>
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 shrink-0">₹{it.price * it.quantity}</span>
                                                            </div>
                                                        ))}
                                                        
                                                        <button 
                                                            onClick={() => {
                                                                kravy.click();
                                                                setOrderToUpdate(order);
                                                                setShowAddItemModal(true);
                                                            }}
                                                            className="flex items-center gap-2 text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest mt-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800 transition-all active:scale-95"
                                                        >
                                                            <Plus size={14} strokeWidth={3} /> Add More Items
                                                        </button>

                                                        {order.notes && (
                                                            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-2.5 items-start">
                                                                <MessageSquare size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                                                <div>
                                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Global Instruction</p>
                                                                    <p className="text-[12px] font-bold text-blue-800 leading-tight italic">"{order.notes}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-6 pt-4 border-t border-slate-200 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-800 dark:text-white uppercase">Total Bill</span>
                                                                <span className="px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                                                                    {order.isBillPrinted ? "PAID" : "UNPAID"}
                                                                </span>
                                                                {order.isKotPrinted && (
                                                                    <span className="px-1.5 py-0.5 rounded border border-emerald-500 bg-emerald-500 text-[9px] font-black text-white uppercase flex items-center gap-1">
                                                                        <Check size={8} /> KOT Printed
                                                                    </span>
                                                                )}
                                                                {(order as any).paymentMode && (
                                                                    <span className="px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">
                                                                        {(order as any).paymentMode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800 dark:text-white">₹{order.total}</span>
                                                        </div>

                                                        {liveOrderTab !== "COMPLETED" && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between text-[11px]">
                                                                    <span className="text-slate-500 font-medium">
                                                                        {order.status === 'READY' ? 'Handover food in' : 'Preparing food'}
                                                                    </span>
                                                                    <span className="font-bold text-slate-700">
                                                                        {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m elapsed
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: "65%" }}
                                                                        className="h-full bg-emerald-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Section: Partner & Support */}
                                                <div className="md:w-72 p-6 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        {order.status === "READY" ? (
                                                            <div className="p-3 border border-slate-200 rounded-lg flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                                    <User size={20} className="text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-slate-800">Server awaiting</p>
                                                                    <p className="text-[10px] text-blue-600 flex items-center gap-1 font-bold cursor-pointer">Call | OTP: 8381</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                                                                    <ChefHat size={24} className="text-slate-300" />
                                                                </div>
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Incoming Workflow</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            disabled={updatingOrders.has(order.id)}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const nextStatus = order.status === "PENDING" ? "ACCEPTED" : order.status === "ACCEPTED" ? "PREPARING" : order.status === "PREPARING" ? "READY" : "COMPLETED";
                                                                updateOrderStatus(order.id, nextStatus);
                                                            }}
                                                            className={`w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-lg ${updatingOrders.has(order.id)
                                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                                    : (statusConfig[order.status as keyof typeof statusConfig]?.btn || "bg-slate-900") + " text-white"
                                                                }`}
                                                        >
                                                            {updatingOrders.has(order.id) ? (
                                                                <RotateCcw className="animate-spin" size={16} />
                                                            ) : (
                                                                <>
                                                                    {order.status === 'PENDING' && <><Check size={16} strokeWidth={3} /> Confirm Accept</>}
                                                                    {order.status === 'ACCEPTED' && <><Flame size={16} /> Start Cooking</>}
                                                                    {order.status === 'PREPARING' && <><Bell size={16} /> Mark as Ready</>}
                                                                    {order.status === 'READY' && <><CheckCircle2 size={16} /> Order Handover</>}
                                                                    {order.status === 'COMPLETED' && 'Done'}
                                                                </>
                                                            )}
                                                        </motion.button>
                                                        <div className="flex flex-col gap-2">
                                                            <button className="h-8 rounded border border-blue-600 text-[10px] font-bold text-blue-600 flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-all uppercase">
                                                                <MoreHorizontal size={14} /> Live order chat support
                                                            </button>
                                                            <button className="h-8 rounded border border-blue-600 text-[10px] font-bold text-blue-600 flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-all uppercase">
                                                                <User size={14} /> Order help
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                    {orders.filter(o => {
                                        const statusMatch = liveOrderTab === "PREPARING"
                                            ? ["PENDING", "ACCEPTED", "PREPARING"].includes(o.status)
                                            : o.status === liveOrderTab && !o.isDeleted;
                                        return statusMatch && !o.isDeleted;
                                    }).length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center">
                                                <div className="w-24 h-24 bg-slate-200 rounded-[3rem] flex items-center justify-center text-slate-400 mb-8 shadow-inner"><Layers size={48} strokeWidth={1} /></div>
                                                <p className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">No Live Orders ({orders.length} in memory)</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">Safe and Sound. Everything is handled.</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* ── TERMINAL TAB ── */}
                    {/* ── KITCHEN (KDS) TAB ── */}
                    {activeTab === "kitchen" && (
                        <motion.div
                            key="kitchen"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col p-5 gap-5 items-center"
                        >
                            <div className="flex items-center justify-between w-full max-w-[1000px]">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Kitchen Display</h2>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live from Chef Hub
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        <Flame size={15} className="text-rose-500" />
                                        <span>{stats.running} Active</span>
                                    </div>
                                    <button onClick={fetchData} className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"><RotateCcw size={16} /></button>
                                </div>
                            </div>

                            <div className="flex-1 w-full overflow-x-auto pb-6 no-scrollbar px-4">
                                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                                    <div className="flex flex-col md:flex-row gap-5 md:justify-center items-center md:items-start min-w-max h-full">
                                        {[
                                            { status: "PENDING", title: "Accept Order", emoji: "🛎️", next: "ACCEPTED", btnLabel: "Accept Order", color: "rose", bg: "bg-rose-500" },
                                            { status: "ACCEPTED", title: "New Orders", emoji: "🔔", next: "PREPARING", btnLabel: "Start Cooking", color: "blue", bg: "bg-blue-500" },
                                            { status: "PREPARING", title: "In Preparation", emoji: "🍳", next: "READY", btnLabel: "Mark Ready", color: "amber", bg: "bg-amber-500" },
                                            { status: "READY", title: "Ready to Serve", emoji: "✅", next: "COMPLETED", btnLabel: "Handed Over", color: "emerald", bg: "bg-emerald-500" },
                                        ].map(col => {
                                            const colOrders = orders.filter(o => o.status === col.status && !o.isDeleted);
                                            return (
                                                <DroppableColumn 
                                                    key={col.status} 
                                                    id={col.status} 
                                                    className="flex-shrink-0 w-full max-w-[340px] md:w-[320px] h-fit md:h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-300"
                                                    isOverStyle="ring-4 ring-indigo-500/20 bg-indigo-50/30"
                                                >
                                                    <div className="p-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-xl leading-none">{col.emoji}</span>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{col.title}</span>
                                                        </div>
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white shadow-lg ${col.bg}`}>{colOrders.length}</span>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                                        {colOrders.map(o => (
                                                            <DraggableOrderCard key={o.id} id={o.id} order={o}>
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.96 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all active:scale-98"
                                                                >
                                                        <div className="flex items-center justify-between mb-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic shadow-inner ${col.status === 'PENDING' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : col.status === 'ACCEPTED' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : col.status === 'PREPARING' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'}`}>{o.table?.name}</div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs font-black text-slate-900 dark:text-white">#{o.id.slice(-4).toUpperCase()}</p>
                                                                        {o.isKotPrinted && (
                                                                            <span className="text-indigo-500" title="KOT Printed">
                                                                                <Printer size={10} strokeWidth={3} />
                                                                            </span>
                                                                        )}
                                                                        {o.isBillPrinted && (
                                                                            <span className="text-rose-500" title="Bill Printed">
                                                                                <CreditCard size={10} strokeWidth={3} />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1 flex items-center gap-1">
                                                                        <TableTimer startTime={o.createdAt} />
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] font-black bg-slate-900 dark:bg-slate-800 text-white px-2.5 py-1 rounded-full">{o.items.length} items</span>
                                                        </div>
                                                        <div className="space-y-2 mb-6">
                                                            {o.items.map((it, idx) => (
                                                                <div key={idx} className="flex justify-between items-start gap-4">
                                                                    <div className="flex items-start gap-2 max-w-[80%]">
                                                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${it.isVeg === false ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                                                                        <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase leading-snug">
                                                                            {it.name}
                                                                            {it.isNew && (
                                                                                <span className="ml-2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">NEW</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[11px] font-black italic text-slate-400 dark:text-slate-500">×{it.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex flex-col gap-2 mb-2">
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const tbl = tablesList.find(t => t.id === o.table?.id);
                                                                            setPrintOrder(o);
                                                                            setPrintTable(tbl || null);
                                                                            setTimeout(() => handlePrint("KOT", o, tbl || undefined), 100);
                                                                        }}
                                                                        className="w-full h-11 rounded-xl border-2 border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/10 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-all shadow-sm"
                                                                    >
                                                                        <Printer size={14} /> KOT
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleSaveAction("KOT", o); }} className="text-[8px] font-black uppercase text-indigo-500 hover:underline tracking-tighter text-center">Save KOT</button>
                                                                </div>
                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const tbl = tablesList.find(t => t.id === o.table?.id);
                                                                            setPrintOrder(o);
                                                                            setPrintTable(tbl || null);
                                                                            setTimeout(() => handlePrint("BILL", o, tbl || undefined), 100);
                                                                        }}
                                                                        className="w-full h-11 rounded-xl border-2 border-emerald-100 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/10 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all shadow-sm"
                                                                    >
                                                                        <CreditCard size={14} /> BILL
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleSaveAction("BILL", o); }} className="text-[8px] font-black uppercase text-emerald-500 hover:underline tracking-tighter text-center">Save Bill</button>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    alert("[TC] Click registered. Opening Modal.");
                                                                    setShowCombineModal(true);
                                                                    setCombineSelection(new Set([o.id]));
                                                                }}
                                                                className="w-full h-10 rounded-xl border-2 border-dashed border-indigo-400 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-all"
                                                            >
                                                                <Layers size={14} /> Merge & Combine Bill
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id, col.next); }}
                                                            className={`w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg active:scale-95 ${col.status === 'PENDING' ? 'bg-rose-500 text-white shadow-rose-500/10' : col.status === 'ACCEPTED' ? 'bg-blue-500 text-white shadow-blue-500/10' : col.status === 'PREPARING' ? 'bg-amber-500 text-white shadow-amber-500/10' : 'bg-emerald-900 text-white shadow-emerald-900/10'}`}
                                                        >
                                                            {col.btnLabel}
                                                        </button>
                                                                </motion.div>
                                                            </DraggableOrderCard>
                                                        ))}
                                                        {colOrders.length === 0 && (
                                                            <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                                                <ChefHat size={48} strokeWidth={0.8} />
                                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6">Chill Mode 😌</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </DroppableColumn>
                                            );
                                        })}
                                    </div>
                                </DndContext>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CASHIER / BILLING TAB ── */}

                    {/* ── TRACKING TAB ── */}
                    {activeTab === "track" && (
                        <motion.div
                            key="track"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
                        >
                            {/* Live Orders Sub-Header */}
                            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
                                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
                                    {(["PREPARING", "READY", "COMPLETED"] as const).map(tab => {
                                        const count = tab === "PREPARING"
                                            ? orders.filter(o => ["PENDING", "ACCEPTED", "PREPARING"].includes(o.status) && !o.isDeleted).length
                                            : tab === "READY"
                                                ? orders.filter(o => o.status === "READY" && !o.isDeleted).length
                                                : orders.filter(o => o.status === "COMPLETED" && !o.isDeleted).length;

                                        const isActive = liveOrderTab === tab;
                                        const label = tab === "PREPARING" ? "Preparing" : tab === "READY" ? "Ready" : "Past Bills";

                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => { kravy.click(); setLiveOrderTab(tab); }}
                                                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${isActive
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20"
                                                        : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                                                    }`}
                                            >
                                                {label} <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Order ID or Customer..."
                                            className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-400 font-bold"
                                            value={liveOrderSearch}
                                            onChange={e => setLiveOrderSearch(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => { kravy.click(); fetchData(); }} 
                                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Orders Pipeline Table */}
                            <div className="flex-1 overflow-x-auto p-4 md:p-8">
                                <div className="max-w-full mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Table</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order/Customer</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Items</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time In</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Stage</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {orders
                                                .filter(o => {
                                                    const statusMatch = liveOrderTab === "PREPARING"
                                                        ? ["PENDING", "ACCEPTED", "PREPARING"].includes(o.status)
                                                        : o.status === liveOrderTab && !o.isDeleted;
                                                    const searchMatch = !liveOrderSearch || o.id.toLowerCase().includes(liveOrderSearch.toLowerCase()) || (o.customerName && o.customerName.toLowerCase().includes(liveOrderSearch.toLowerCase()));
                                                    return statusMatch && searchMatch && !o.isDeleted;
                                                })
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((order) => {
                                                    const age = getOrderAge(order.createdAt);
                                                    return (
                                                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                                            <td className="px-6 py-8">
                                                                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800 shadow-inner">
                                                                    <span className="text-xs font-black text-rose-600 uppercase italic tracking-tighter">{order.table?.name || "GUEST"}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-8">
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-1.5">{order.customerName || "WALK-IN GUEST"}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ORDER ID: #{order.id.slice(-6).toUpperCase()}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-8">
                                                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                                    {order.items.map((it, i) => (
                                                                        <span key={i} className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                                            {it.quantity}X {it.name.toUpperCase()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-8">
                                                                <p className="text-sm font-black text-slate-900 dark:text-white italic">₹{Math.round(order.total)}</p>
                                                            </td>
                                                            <td className="px-6 py-8">
                                                                <div>
                                                                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${age.alert ? "text-rose-500 animate-pulse" : "text-slate-400"}`}>
                                                                        <Clock size={12} />
                                                                        {age.alert ? "DELAYED" : "FRESH"}
                                                                    </div>
                                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-8 text-center">
                                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                                                    order.status === "READY" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                                    order.status === "PREPARING" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                                    order.status === "COMPLETED" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                                                    "bg-rose-50 text-rose-600 border-rose-200"
                                                                }`}>
                                                                    • {order.status === "PENDING" ? "PENDING" : order.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-8 text-right">
                                                                <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                                    <button
                                                                        onClick={() => {
                                                                            setPrintOrder(order);
                                                                            handlePrint("KOT", order);
                                                                        }}
                                                                        className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                        title="Print KOT"
                                                                    >
                                                                        <Printer size={16} />
                                                                    </button>
                                                                    
                                                                    {order.status === "COMPLETED" && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setPrintOrder(order);
                                                                                handlePrint("BILL", order);
                                                                            }}
                                                                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                            title="Print Final Bill"
                                                                        >
                                                                            <CreditCard size={16} />
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => {
                                                                            setOrderToUpdate(order);
                                                                            setShowAddItemModal(true);
                                                                        }}
                                                                        className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                        title="Edit / Add Items"
                                                                    >
                                                                        <Edit3 size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => softDeleteOrder(order.id)}
                                                                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                        title="Delete Order"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                    {order.status !== "COMPLETED" && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if (order.status === "PENDING" || order.status === "ACCEPTED") updateOrderStatus(order.id, "PREPARING");
                                                                                else if (order.status === "PREPARING") updateOrderStatus(order.id, "READY");
                                                                                else if (order.status === "READY") updateOrderStatus(order.id, "COMPLETED");
                                                                            }}
                                                                            className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                                                                            title="Next Stage"
                                                                        >
                                                                            <ArrowRight size={18} strokeWidth={3} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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
                tokenNumber={printOrder?.tokenNumber ? printOrder.tokenNumber.toString().padStart(3, '0') : "---"}
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
                    gst: it.gst
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
                prevWalletBalance={null}
                selectedParty={null}
                numberToWords={numberToWords}
                kotNumbers={printOrder?.kotNumbers || []}
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
                tokenNumber={printOrder?.tokenNumber ? printOrder.tokenNumber.toString().padStart(3, '0') : "---"}
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
                printReceipt={(enableKOT) => handlePrint("BILL", printOrder || undefined)}
                saveBill={async () => printOrder} // Order is already saved in database
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
        if (!orderToUpdate) return;
        
        try {
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
            const { total: newTotal } = calculateOrderTotals(updatedItems, isTaxEnabled, globalRate, perProductEnabled);

            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderToUpdate.id,
                    items: updatedItems,
                    total: newTotal
                })
            });

            if (res.ok) {
                toast.success(`Added ${menuItem.name} to order`);
                fetchData(); // Refresh orders
                setShowAddItemModal(false);
                setItemSearch("");
            } else {
                toast.error("Failed to add item");
            }
        } catch (err) {
            console.error("Add item error:", err);
            toast.error("An error occurred");
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
