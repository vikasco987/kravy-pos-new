"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
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
};

type TableStatus = {
    id: string;
    name: string;
    isOccupied: boolean;
    activeOrderId?: string;
    status: "FREE" | "PENDING" | "ACCEPTED" | "PREPARING" | "READY";
    activeCount: number;
};

const TABS = [
    { key: "live-orders", label: "Live Orders", icon: ChefHat },
    { key: "dashboard", label: "Terminal", icon: LayoutDashboard },
    { key: "kitchen", label: "Kitchen", icon: ChefHat },
    { key: "payment", label: "Cashier", icon: CreditCard },
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

export default function KravyPOS() {
    const receiptRef = useRef<HTMLDivElement | null>(null);
    const billReceiptRef = useRef<HTMLDivElement | null>(null);
    const kotReceiptRef = useRef<HTMLDivElement | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("live-orders");
    const [liveOrderTab, setLiveOrderTab] = useState<"PREPARING" | "READY" | "COMPLETED">("PREPARING");
    const [liveOrderSearch, setLiveOrderSearch] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [tablesList, setTablesList] = useState<TableStatus[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [payMethod, setPayMethod] = useState("upi");
    const [tableSearch, setTableSearch] = useState("");
    const { user: authUser } = useAuthContext();
    const userRole = authUser?.type || null;
    const userPermissions = authUser?.permissions || [];
    const [tableFilter, setTableFilter] = useState<"ALL" | "RUNNING" | "READY">("ALL");
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
    const [isMobile, setIsMobile] = useState(false);
    const [selectedParty, setSelectedParty] = useState<any>(null);
    const [clock, setClock] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [business, setBusiness] = useState<any>(null);

    const selectedTable = tablesList.find(t => t.id === selectedTableId);
    const activeOrderForSelected = orders.find(o => o.id === selectedTable?.activeOrderId);

    // Dynamic Totals Calculation
    const isTaxEnabled = business?.taxEnabled ?? true;
    const taxRate = business?.taxRate ?? 5.0;
    const subtotalCost = activeOrderForSelected?.items.reduce((acc, it) => acc + (it.price * it.quantity), 0) || 0;
    const calculatedGst = isTaxEnabled ? (subtotalCost * taxRate) / 100 : 0;
    const grandTotal = subtotalCost + calculatedGst;

    useEffect(() => {
        fetchMenu();
    }, []);

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

    const handlePrint = async (type: "KOT" | "BILL" | "COMBINED_BILL" | "MANUAL_COMBINE", customOrder?: Order, customTable?: TableStatus) => {
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
            const gst = isTaxEnabled ? (subtotal * taxRate) / 100 : 0;
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
        console.log(`[PRINT] Context: Order=${targetOrder?.id}, Table=${targetTable?.name || "None"}`);

        setTimeout(() => {
            const isBill = type === "BILL" || type === "COMBINED_BILL" || type === "MANUAL_COMBINE";
            const autoBoth = isBill && business?.enableKOTWithBill && type !== "MANUAL_COMBINE" && type !== "COMBINED_BILL";

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
                console.log("[PRINT] Combined KOT + Bill triggered via Auto-Both setting");
            } else {
                const targetRef = (showPreview && previewMode === (isBill ? "BILL" : "KOT"))
                    ? receiptRef.current
                    : (isBill ? billReceiptRef.current : kotReceiptRef.current);

                if (!targetRef) {
                    console.error(`[PRINT ERROR] No DOM reference found for ${type}. Check if printer zone is rendered.`);
                    return;
                }
                printHTML = targetRef.innerHTML;
            }

            console.log(`[PRINT] Template Found. HTML size: ${printHTML.length} chars`);

            if (printHTML.length < 50) {
                console.warn(`[PRINT WARNING] Template seems empty or too small. Receipt might be blank.`);
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
                        height: auto !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 10px 0 30px 0 !important; 
                        background: #fff !important;
                        color: #000 !important;
                        font-family: 'Courier New', Courier, monospace !important;
                        font-weight: 700 !important;
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
                const autoBoth = isBill && business?.enableKOTWithBill && type !== "MANUAL_COMBINE" && type !== "COMBINED_BILL";

                if (type === "KOT" || autoBoth) {
                    body.isKotPrinted = true;
                    // Auto transition PENDING/ACCEPTED -> PREPARING
                    if (targetOrder.status === "PENDING" || targetOrder.status === "ACCEPTED") {
                        body.status = "PREPARING";
                    }
                }
                if (isBill || autoBoth) {
                    body.isBillPrinted = true;
                    // Auto transition READY -> COMPLETED
                    if (targetOrder.status === "READY") {
                        body.status = "COMPLETED";
                    }
                }

                fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                }).then(() => {
                    if (body.status === "COMPLETED") {
                        handleCheckout(body.orderId, true);
                    } else {
                        fetchData();
                    }
                });
            }
        }, 400);
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
                if (body.status === "COMPLETED") {
                    await handleCheckout(order.id, true);
                } else {
                    fetchData();
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

    const fetchData = async () => {
        try {
            const [ordersRes, tablesRes] = await Promise.all([
                fetch("/api/orders?limit=50"),
                fetch("/api/tables")
            ]);
            if (ordersRes.ok && tablesRes.ok) {
                const ordersData: Order[] = await ordersRes.json();
                const rawTables = await tablesRes.json();
                setOrders(ordersData);
                const processed = rawTables.map((t: any) => {
                    const tableOrders = ordersData.filter(o => o.table?.id === t.id && o.status !== "COMPLETED" && !o.isDeleted);
                    const liveOrder = tableOrders[0]; // Primary display order
                    let status: "FREE" | "PENDING" | "ACCEPTED" | "PREPARING" | "READY" = "FREE";
                    if (liveOrder) {
                        if (liveOrder.status === "PENDING") status = "PENDING";
                        else if (liveOrder.status === "ACCEPTED") status = "ACCEPTED";
                        else if (liveOrder.status === "PREPARING") status = "PREPARING";
                        else if (liveOrder.status === "READY") status = "READY";
                    }
                    return { id: t.id, name: t.name, isOccupied: !!liveOrder, activeOrderId: liveOrder?.id, status, activeCount: tableOrders.length };
                });
                setTablesList(processed);
            }
        } catch (err) { console.error("Polling failed", err); }
    };

    const fetchBusiness = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setBusiness(data);
            }
        } catch (err) { console.error("Profile fetch failed", err); }
    };

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

    useEffect(() => {
        fetchData();
        fetchBusiness();
        // Set up auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);
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

                if (newStatus === "COMPLETED") {
                    await handleCheckout(orderId, true);
                } else {
                    fetchData();
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

        const orderSubtotal = order.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        const orderGst = isTaxEnabled ? (orderSubtotal * taxRate) / 100 : 0;
        const orderTotal = orderSubtotal + orderGst;

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
                    total: it.price * it.quantity
                })),
                subtotal: orderSubtotal,
                total: orderTotal,
                paymentMode: payMethod.toUpperCase(),
                paymentStatus: "Paid",
                customerName: order.customerName || "Walk-in",
                tableName: order.table?.name || "Counter"
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
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowCombineModal(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-[500px] h-[85vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="px-8 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Merge Pipeline</h3>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Layers size={12} /> Select orders to unify
                                    </p>
                                </div>
                                <button onClick={() => setShowCombineModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                                {orders.filter(o => o.status !== "COMPLETED" && !o.isDeleted).map(o => {
                                    const isSelected = combineSelection.has(o.id);
                                    return (
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
                                            className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 text-left relative overflow-hidden group ${isSelected ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-600 shadow-xl shadow-indigo-600/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"}`}
                                        >
                                            {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -mr-8 -mt-8 blur-2xl" />}
                                            
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-inner transition-colors ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                                                {o.table?.name}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-2">Order #{o.id.slice(-6).toUpperCase()}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">{o.items.length} Items</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 italic">₹{o.total}</span>
                                                </div>
                                            </div>

                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"}`}>
                                                {isSelected && <Check size={16} strokeWidth={4} />}
                                            </div>
                                        </button>
                                    );
                                })}

                                {orders.filter(o => o.status !== "COMPLETED" && !o.isDeleted).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                        <Layers size={56} strokeWidth={1} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-8 italic">Silence in the pipeline</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    disabled={combineSelection.size < 2}
                                    onClick={() => {
                                        setShowCombineModal(false);
                                        handlePrint("MANUAL_COMBINE");
                                    }}
                                    className={`w-full h-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${combineSelection.size >= 2 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/20 active:scale-95" : "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed opacity-50"}`}
                                >
                                    <Printer size={20} /> Combine & Generate Bill {combineSelection.size > 0 && `(${combineSelection.size})`}
                                </button>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 opacity-50 italic">Unify multiple tables into a single receipt</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <OrderAlertLoop pendingCount={stats.incoming} />
            {/* ── HEADER ── */}
            <header className="flex flex-col lg:flex-row items-center justify-between px-4 lg:px-8 min-h-[72px] lg:h-[72px] shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm z-[50] py-3 lg:py-0 gap-4 lg:gap-8 transition-all duration-500 sticky top-0">
                {/* Brand & Mobile Actions */}
                <div className="flex items-center justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab("live-orders")}>
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center font-mono text-xl font-bold text-white shadow-lg shadow-slate-900/20 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                            <span>K</span>
                        </div>
                        <div>
                            <div className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">Kravy <em className="text-rose-500 not-italic">POS</em></div>
                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1.5">Order Management</div>
                        </div>
                    </div>

                    <div className="flex lg:hidden items-center gap-2">
                        <button
                            onClick={() => { kravy.click(); setActiveTab("dashboard"); }}
                            className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                        >
                            New
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs (Scrollable on mobile) */}
                <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto justify-start lg:justify-center -mx-4 px-4 lg:mx-0 lg:px-0">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.key;
                        let badgeCount = 0;
                        if (t.key === "live-orders") badgeCount = stats.pending + stats.running;
                        if (t.key === "kitchen") badgeCount = stats.pending + stats.running;
                        if (t.key === "payment") badgeCount = stats.ready;

                        return (
                            <button
                                key={t.key}
                                onClick={() => { kravy.click(); setActiveTab(t.key); }}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold transition-all duration-300 whitespace-nowrap overflow-hidden group ${isActive ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                            >
                                <Icon size={16} className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                                <span className="tracking-wide relative z-10">{t.label}</span>
                                {badgeCount > 0 && (
                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm transition-transform duration-300 relative z-10 ${isActive ? "scale-100" : "scale-90 group-hover:scale-100"} ${t.key === "payment" ? "bg-blue-500" : "bg-rose-500"}`}>
                                        {badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Right Controls (Hidden on mobile stats, shown buttons on desktop) */}
                <div className="hidden lg:flex items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="text-right flex flex-col justify-center">
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">Time</span>
                                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{clock}</div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dateStr}</div>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200/60 dark:bg-slate-800/60" />
                    <button
                        onClick={() => { kravy.click(); setActiveTab("dashboard"); }}
                        className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                    >
                        <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                        <span>New Order</span>
                    </button>
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
                            {/* 💎 Premium Sub-Header */}
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-40">
                                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[1.5rem] shadow-inner border border-slate-200/40 dark:border-slate-700/40 overflow-x-auto w-full md:w-auto no-scrollbar">
                                    {(["PREPARING", "READY", "COMPLETED"] as const).map(tab => {
                                        const count = tab === "PREPARING"
                                            ? orders.filter(o => ["PENDING", "ACCEPTED", "PREPARING"].includes(o.status) && !o.isDeleted).length
                                            : tab === "READY"
                                                ? orders.filter(o => o.status === "READY" && !o.isDeleted).length
                                                : orders.filter(o => o.status === "COMPLETED" && !o.isDeleted).length;

                                        const isActive = liveOrderTab === tab;
                                        const label = tab === "PREPARING" ? "Processing" : tab === "READY" ? "Ready" : "Settled";

                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => { kravy.click(); setLiveOrderTab(tab); }}
                                                className={`px-6 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 whitespace-nowrap ${isActive
                                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5 border border-slate-200/50 dark:border-slate-800"
                                                    : "bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                    }`}
                                            >
                                                {label} 
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${isActive ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-[400px] group">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search active orders..."
                                            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-400 font-bold shadow-sm"
                                            value={liveOrderSearch}
                                            onChange={e => setLiveOrderSearch(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => { kravy.click(); fetchData(); }} className="w-14 h-14 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90 group">
                                        <RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>
                            </div>

                            {/* 🏗️ Optimized Grid Panel */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                                <div className="max-w-[1500px] mx-auto space-y-8">
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
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.08 }}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-slate-300 dark:hover:border-slate-700 transition-all group overflow-hidden flex flex-col xl:flex-row relative"
                                            >
                                                {/* ✨ High-Contrast Status Edge */}
                                                <div className={`h-2 xl:h-auto xl:w-4 shrink-0 ${order.status === 'PENDING' ? 'bg-[#FF0055] shadow-[0_0_20px_rgba(255,0,85,0.4)]' : order.status === 'ACCEPTED' ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : order.status === 'PREPARING' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : order.status === 'READY' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />

                                                {/* 📦 Left Panel: Header & Session Info */}
                                                <div className="xl:w-[400px] p-8 lg:p-10 border-b xl:border-b-0 xl:border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 relative">
                                                    <div className="flex items-center justify-between mb-10">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center text-3xl font-black italic tracking-tighter">
                                                                {order.table?.name?.substring(0, 2) || "T1"}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter uppercase italic">{order.table?.name || "Counter"}</h3>
                                                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em] opacity-60">Session #{order.id.slice(-6).toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-slate-900/10">
                                                            {order.caseType || "DINE-IN"}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-5 flex-1">
                                                        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.75rem] shadow-sm">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                                <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[15px] font-black text-slate-900 dark:text-white truncate leading-none uppercase">{order.customerName || "Walk-in Guest"}</p>
                                                                <p className="text-[11px] font-bold text-slate-400 mt-2 tracking-tight">{order.customerPhone || "No Linked Profile"}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => {
                                                                    const tbl = tablesList.find(t => t.id === order.table?.id);
                                                                    setPrintOrder(order); setPrintTable(tbl || null);
                                                                    setTimeout(() => handlePrint("KOT", order, tbl || undefined), 100);
                                                                }}
                                                                className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group"
                                                            >
                                                                <Printer size={18} className="group-hover:scale-110 transition-transform" /> KOT
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const tbl = tablesList.find(t => t.id === order.table?.id);
                                                                    setPrintOrder(order); setPrintTable(tbl || null);
                                                                    setTimeout(() => handlePrint("BILL", order, tbl || undefined), 100);
                                                                }}
                                                                className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
                                                            >
                                                                <CreditCard size={18} className="group-hover:scale-110 transition-transform" /> Bill
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-10 flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                        <span className="flex items-center gap-2"><Clock size={16} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="opacity-30">|</span>
                                                        <span>{order.items.length} Items</span>
                                                    </div>
                                                </div>

                                                {/* 🍲 Center Panel: Items Breakdown */}
                                                <div className="flex-1 p-8 lg:p-10 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 min-w-0">
                                                    <div className="flex justify-between items-center mb-8">
                                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Kitchen Orders</h4>
                                                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-2 border ${order.preferences?.dontSendCutlery ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
                                                            {order.preferences?.dontSendCutlery ? <><AlertTriangle size={12} /> No Cutlery Requested</> : <><CheckCircle2 size={12} /> Standard Cutlery</>}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2 mb-8">
                                                        {order.items.map((it, i) => (
                                                            <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                                                                <div className="flex items-center gap-5">
                                                                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 shrink-0 ${it.isVeg === false ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}>
                                                                        <div className={`w-2 h-2 rounded-sm ${it.isVeg === false ? "bg-rose-500" : "bg-emerald-500"}`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[16px] font-black text-slate-800 dark:text-slate-100 leading-none mb-2">
                                                                            <span className="text-slate-400 font-bold mr-1">x{it.quantity}</span> {it.name}
                                                                        </div>
                                                                        {it.variants && it.variants.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {it.variants.map((v: any, idx: number) => (
                                                                                    <span key={idx} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">
                                                                                        {v.option}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {it.instruction && <p className="text-[9px] font-black text-rose-500 mt-2 uppercase tracking-widest italic leading-none">Note: "{it.instruction}"</p>}
                                                                    </div>
                                                                </div>
                                                                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">₹{it.price * it.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => { kravy.click(); setOrderToUpdate(order); setShowAddItemModal(true); }}
                                                        className="mt-auto w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-98"
                                                    >
                                                        <Plus size={18} strokeWidth={3} /> Modify Order contents
                                                    </button>
                                                </div>

                                                {/* 💳 Right Panel: Settlement & Action */}
                                                <div className="xl:w-[420px] p-8 lg:p-10 flex flex-col justify-between bg-slate-50 dark:bg-slate-950/50">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${order.isBillPrinted ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"}`}>
                                                                    {order.isBillPrinted ? "SETTLED" : "PENDING BILL"}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Receivable</span>
                                                        </div>
                                                        <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-10 flex items-baseline gap-2">
                                                            <span className="text-slate-300 dark:text-slate-700 text-4xl font-bold">₹</span>{order.total}
                                                        </div>

                                                        {order.notes && (
                                                            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-[2rem] flex items-start gap-4 mb-8 shadow-sm">
                                                                <MessageSquare size={20} className="text-amber-500 shrink-0 mt-1" />
                                                                <div>
                                                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">Staff Instruction</p>
                                                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200 leading-snug">"{order.notes}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto space-y-4">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02, y: -4 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            disabled={updatingOrders.has(order.id)}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const nextStatusMap: any = { "PENDING": "ACCEPTED", "ACCEPTED": "PREPARING", "PREPARING": "READY", "READY": "COMPLETED" };
                                                                updateOrderStatus(order.id, nextStatusMap[order.status]);
                                                            }}
                                                            className={`w-full h-20 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${updatingOrders.has(order.id)
                                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                                : order.status === 'PENDING' ? "bg-[#FF0055] text-white shadow-[#FF0055]/30"
                                                                : order.status === 'ACCEPTED' ? "bg-indigo-600 text-white shadow-indigo-600/30"
                                                                : order.status === 'PREPARING' ? "bg-amber-500 text-white shadow-amber-500/30"
                                                                : "bg-emerald-600 text-white shadow-emerald-600/30"
                                                                }`}
                                                        >
                                                            {updatingOrders.has(order.id) ? (
                                                                <RotateCcw className="animate-spin" size={24} />
                                                            ) : (
                                                                <>
                                                                    {order.status === 'PENDING' && <><Check size={24} strokeWidth={4} /> Accept Order</>}
                                                                    {order.status === 'ACCEPTED' && <><Flame size={24} /> Start Cooking</>}
                                                                    {order.status === 'PREPARING' && <><Bell size={24} /> Mark as Ready</>}
                                                                    {order.status === 'READY' && <><CheckCircle2 size={24} /> Push to Settlement</>}
                                                                    {order.status === 'COMPLETED' && 'Settled'}
                                                                </>
                                                            )}
                                                        </motion.button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowCombineModal(true);
                                                                setCombineSelection(new Set([order.id]));
                                                            }}
                                                            className="w-full h-14 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                                                        >
                                                            <Layers size={18} /> Merge & Combine Bill
                                                        </button>
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
                                            <div className="flex flex-col items-center justify-center py-32 opacity-30 text-center">
                                                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[3rem] flex items-center justify-center text-slate-400 mb-8 shadow-sm border border-slate-200 dark:border-slate-700"><Layers size={40} strokeWidth={1.5} /></div>
                                                <p className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">No Active Orders</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">Safe and Sound. Everything is handled.</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* ── TERMINAL TAB ── */}
                    {activeTab === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex-1 flex flex-col md:flex-row h-full overflow-hidden p-4 md:p-8 gap-6 md:gap-8 bg-slate-50/50 dark:bg-[#0B1120]"
                        >
                            {/* LEFT PANEL: Table Selection */}
                            <div className="w-full md:w-[380px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden shrink-0">
                                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Terminal</h2>
                                        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                            {(["ALL", "RUNNING"] as const).map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => { kravy.click(); setTableFilter(f); }}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tableFilter === f ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search table..."
                                            className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold"
                                            value={tableSearch}
                                            onChange={e => setTableSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Tables Grid */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                        {filteredTables.map(t => {
                                            const cfg = statusConfig[t.status];
                                            const isActive = selectedTableId === t.id;
                                            return (
                                                <motion.button
                                                    layout
                                                    key={t.id}
                                                    onClick={() => { kravy.click(); setSelectedTableId(t.id); }}
                                                    className={`relative group h-28 flex flex-col items-center justify-center gap-2 rounded-[2rem] transition-all overflow-hidden border-2 ${isActive ? "border-slate-900 dark:border-white shadow-xl scale-105 z-10" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"}`}
                                                    whileHover={{ y: -4 }}
                                                    whileTap={{ scale: 0.96 }}
                                                >
                                                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${cfg.dot} ${t.isOccupied ? "animate-pulse" : ""}`} />
                                                    
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Table</span>
                                                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                                        {t.name?.startsWith("T-") ? t.name.slice(2) : t.name}
                                                    </span>

                                                    {t.activeCount > 0 && (
                                                        <div className="mt-2 px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black uppercase tracking-widest">
                                                            {t.activeCount} Items
                                                        </div>
                                                    )}

                                                    {isActive && (
                                                        <motion.div 
                                                            layoutId="table-active" 
                                                            className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 pointer-events-none"
                                                        />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    {filteredTables.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                            <TableIcon size={40} strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-widest mt-4 italic">No tables found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Footer */}
                                <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <span className="block text-lg font-black text-indigo-600 leading-none">{stats.running}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Cooking</span>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <span className="block text-lg font-black text-emerald-600 leading-none">{stats.ready}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ready</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: Order Details */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
                                {selectedTable ? (
                                    <motion.div
                                        key={selectedTable.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="h-full flex flex-col"
                                    >
                                        {/* Order Header */}
                                        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] flex items-center justify-center text-3xl font-black italic shadow-2xl">
                                                    {selectedTable.name}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                                            {activeOrderForSelected?.customerName || "Walk-in Guest"}
                                                        </h2>
                                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-800">
                                                            ● Active Session
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {activeOrderForSelected?.customerPhone ? (
                                                            <span className="flex items-center gap-1.5"><Phone size={12} /> {activeOrderForSelected.customerPhone}</span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5"><User size={12} /> No Profile Link</span>
                                                        )}
                                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {activeOrderForSelected ? new Date(activeOrderForSelected.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <button onClick={() => { kravy.click(); setOrderToUpdate(activeOrderForSelected || null); setShowAddItemModal(true); }} className="flex-1 md:flex-none h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                                                    <Plus size={16} strokeWidth={3} /> Add Item
                                                </button>
                                                <button className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center hover:text-slate-900 transition-all border border-slate-100 dark:border-slate-800">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 no-scrollbar">
                                            {activeOrderForSelected ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Order Contents</span>
                                                        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                            {activeOrderForSelected.items.length} Items Total
                                                        </div>
                                                    </div>
                                                    {activeOrderForSelected.items.map((item, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group"
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${item.isVeg === false ? "bg-rose-50 border border-rose-100 text-rose-500" : "bg-emerald-50 border border-emerald-100 text-emerald-500"}`}>
                                                                    {item.isVeg === false ? "🍗" : "🥗"}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[15px] font-black text-slate-900 dark:text-white leading-none mb-2">{item.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        ₹{item.price} per unit
                                                                        {item.instruction && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-600 dark:text-slate-400">"{item.instruction}"</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-10">
                                                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                    <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white font-black transition-colors">-</button>
                                                                    <span className="text-sm font-black italic w-6 text-center">x{item.quantity}</span>
                                                                    <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white font-black transition-colors">+</button>
                                                                </div>
                                                                <div className="w-24 text-right">
                                                                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">₹{item.price * item.quantity}</span>
                                                                </div>
                                                                <button className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
                                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-8"><UtensilsCrossed size={40} /></div>
                                                    <p className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Empty Table</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Start a new dining session to see items</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Checkout Section */}
                                        <div className="p-8 md:p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                                                <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2"><ChefHat size={14} /> Workflow Control</p>
                                                    <div className="flex gap-3">
                                                        <button 
                                                            disabled={!activeOrderForSelected || activeOrderForSelected.status !== "PENDING"}
                                                            onClick={() => updateOrderStatus(activeOrderForSelected!.id, "ACCEPTED")}
                                                            className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderForSelected?.status === "PENDING" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 opacity-50"}`}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button 
                                                            disabled={!activeOrderForSelected || activeOrderForSelected.status !== "ACCEPTED"}
                                                            onClick={() => updateOrderStatus(activeOrderForSelected!.id, "PREPARING")}
                                                            className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderForSelected?.status === "ACCEPTED" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 opacity-50"}`}
                                                        >
                                                            Start Cooking
                                                        </button>
                                                        <button 
                                                            disabled={!activeOrderForSelected || activeOrderForSelected.status !== "PREPARING"}
                                                            onClick={() => updateOrderStatus(activeOrderForSelected!.id, "READY")}
                                                            className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderForSelected?.status === "PREPARING" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 opacity-50"}`}
                                                        >
                                                            Mark Ready
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex items-center justify-between">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-10 -mt-10 rounded-full blur-3xl" />
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Grand Total</p>
                                                        <p className="text-5xl font-black text-white italic tracking-tighter">₹{activeOrderForSelected?.total ?? "0"}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block ${activeOrderForSelected?.isBillPrinted ? "bg-emerald-500 text-white" : "bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse"}`}>
                                                            {activeOrderForSelected?.isBillPrinted ? "PAID" : "UNPAID"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col xl:flex-row gap-4">
                                                <div className="flex-1 flex gap-3">
                                                    <button onClick={() => { setPreviewMode("KOT"); setShowPreview(true); }} className="w-16 h-16 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center hover:text-slate-900 transition-all shadow-sm">
                                                        <Eye size={20} />
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
                                                        className="flex-1 h-16 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center gap-3 hover:border-slate-900 transition-all shadow-sm"
                                                    >
                                                        <Printer size={18} /> Print KOT
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const tbl = tablesList.find(t => t.id === activeOrderForSelected?.table?.id);
                                                            if (activeOrderForSelected) {
                                                                setPrintOrder(activeOrderForSelected);
                                                                setPrintTable(tbl || null);
                                                                setTimeout(() => handlePrint("BILL", activeOrderForSelected, tbl || undefined), 100);
                                                            }
                                                        }}
                                                        className="flex-1 h-16 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center gap-3 hover:border-slate-900 transition-all shadow-sm"
                                                    >
                                                        <CreditCard size={18} /> Print Bill
                                                    </button>
                                                </div>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={!activeOrderForSelected}
                                                    onClick={() => { kravy.payment(); setActiveTab("payment"); }}
                                                    className="flex-[1.2] h-16 rounded-[1.25rem] bg-[#111827] dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Process Payment <ArrowRight size={18} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-20">
                                        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-10 shadow-inner">
                                            <TerminalIcon size={48} strokeWidth={1} />
                                        </div>
                                        <p className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Terminal Waiting</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Select a table to begin operations</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── KITCHEN (KDS) TAB ── */}
                    {activeTab === "kitchen" && (
                        <motion.div
                            key="kitchen"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col p-6 md:p-10 gap-8 bg-slate-50/50 dark:bg-[#0B1120]"
                        >
                            <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">Kitchen Operations</h2>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Real-time Chef Pipeline
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-sm">
                                        <Flame size={18} className="text-rose-500" />
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{stats.running + stats.pending} Active Orders</span>
                                    </div>
                                    <button onClick={() => { kravy.click(); fetchData(); }} className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                        <RotateCcw size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 w-full overflow-x-auto pb-8 no-scrollbar">
                                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                                    <div className="flex gap-6 h-full min-w-max justify-center">
                                        {[
                                            { status: "PENDING", title: "Incoming", emoji: "🛎️", color: "bg-rose-500" },
                                            { status: "ACCEPTED", title: "Waitlist", emoji: "🔔", color: "bg-indigo-500" },
                                            { status: "PREPARING", title: "Cooking", emoji: "🍳", color: "bg-amber-500" },
                                            { status: "READY", title: "Ready", emoji: "✅", color: "bg-emerald-500" },
                                        ].map(col => {
                                            const colOrders = orders.filter(o => o.status === col.status && !o.isDeleted);
                                            return (
                                                <DroppableColumn
                                                    key={col.status}
                                                    id={col.status}
                                                    className="w-[340px] flex flex-col bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-inner transition-all"
                                                    isOverStyle="ring-4 ring-indigo-500/20 bg-indigo-50/30"
                                                >
                                                    <div className="p-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{col.emoji}</span>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{col.title}</span>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg ${col.color}`}>{colOrders.length}</span>
                                                    </div>
                                                    
                                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                                        {colOrders.map(o => (
                                                            <DraggableOrderCard key={o.id} id={o.id} order={o}>
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all active:scale-95 group relative"
                                                                >
                                                                    <div className="flex items-center justify-between mb-6">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-xl font-black italic shadow-inner ${col.status === 'PENDING' ? 'bg-rose-50 text-rose-500' : col.status === 'ACCEPTED' ? 'bg-indigo-50 text-indigo-500' : col.status === 'PREPARING' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                                                {o.table?.name}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">#{o.id.slice(-6).toUpperCase()}</p>
                                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                                                    <Clock size={10} /> {Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)}m ago
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1.5">
                                                                            {o.isKotPrinted && <Printer size={12} className="text-indigo-400" />}
                                                                            {o.isBillPrinted && <CreditCard size={12} className="text-emerald-400" />}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                                        {o.items.map((it, idx) => (
                                                                            <div key={idx} className="flex justify-between items-start gap-4">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${it.isVeg === false ? "bg-rose-500" : "bg-emerald-500"}`} />
                                                                                    <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 leading-snug uppercase">
                                                                                        <span className="text-slate-400 font-bold mr-1">x{it.quantity}</span> {it.name}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handlePrint("KOT", o); }}
                                                                                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                                                                            >
                                                                                <Printer size={14} /> KOT
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handlePrint("BILL", o); }}
                                                                                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                                                                            >
                                                                                <CreditCard size={14} /> Bill
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const nextStageMap: any = { "PENDING": "ACCEPTED", "ACCEPTED": "PREPARING", "PREPARING": "READY", "READY": "COMPLETED" };
                                                                                updateOrderStatus(o.id, nextStageMap[o.status]);
                                                                            }}
                                                                            className={`w-full h-12 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${col.color}`}
                                                                        >
                                                                            {o.status === "PENDING" && <><Check size={16} strokeWidth={3} /> Accept Order</>}
                                                                            {o.status === "ACCEPTED" && <><Flame size={16} /> Start Cooking</>}
                                                                            {o.status === "PREPARING" && <><Bell size={16} /> Mark Ready</>}
                                                                            {o.status === "READY" && <><CheckCircle2 size={16} /> Handover</>}
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            </DraggableOrderCard>
                                                        ))}
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
                    {activeTab === "payment" && (
                        <motion.div
                            key="payment"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar"
                        >
                            {selectedTable && activeOrderForSelected ? (
                                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 max-w-6xl w-full h-full lg:h-auto overflow-visible">
                                    {/* Receipt column */}
                                    <div className="bg-white dark:bg-white shadow-2xl rounded-[2.5rem] p-8 flex flex-col border border-slate-100 relative overflow-hidden h-fit animate-in fade-in zoom-in-95 duration-500">
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900" />

                                        <div className="text-center pb-8 border-b border-dashed border-slate-200 mb-8 mt-4">
                                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 p-4 shadow-xl shadow-slate-900/10">
                                                <Printer size={32} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none uppercase">
                                                {business?.businessName || "Kravy POS"}
                                            </h3>
                                            <div className="flex flex-col gap-1 mt-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Settlement</span>
                                                <div className="flex items-center justify-center gap-2 text-[11px] font-black text-slate-600">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">Table {selectedTable.name}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">#{activeOrderForSelected.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto scrollbar-hide py-2">
                                            {activeOrderForSelected.items.map((it, idx) => (
                                                <div key={idx} className="flex justify-between items-start group">
                                                    <div className="flex-1 pr-4">
                                                        <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{it.name}</p>
                                                        {it.variants && it.variants.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-1">
                                                                {it.variants.map((v: any, idx: number) => (
                                                                    <span key={idx} className="text-[8px] font-black text-indigo-500 uppercase italic">
                                                                        • {v.option}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">{it.quantity} × ₹{it.price}</p>
                                                    </div>
                                                    <span className="text-xs font-black italic text-slate-900">₹{it.price * it.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-dashed border-slate-200 space-y-3">
                                            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                <span>Subtotal</span>
                                                <span>₹{(activeOrderForSelected.total / 1.05).toFixed(0)}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                <span>GST (5%)</span>
                                                <span>₹{(activeOrderForSelected.total - activeOrderForSelected.total / 1.05).toFixed(0)}</span>
                                            </div>
                                            {payMethod === "wallet" && (
                                                <div className="flex justify-between text-[11px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                                    <span>Remaining Bal</span>
                                                    <span>₹{((selectedParty?.walletBalance || 0) - activeOrderForSelected.total).toFixed(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-slate-900">
                                                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 italic">Bill Amount</span>
                                                <span className="text-3xl font-black italic tracking-tighter text-slate-900">₹{activeOrderForSelected.total}</span>
                                            </div>
                                        </div>

                                        <div className="mt-8 text-center opacity-20 text-[9px] font-black uppercase tracking-[0.4em] italic">
                                            Trusted by Kravy
                                        </div>
                                    </div>

                                    {/* Payment Options */}
                                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white dark:border-slate-800 rounded-[3rem] p-8 lg:p-12 shadow-sm flex flex-col h-full animate-in slide-in-from-right-8 duration-700">
                                        <div className="mb-10">
                                            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic mb-2 leading-none uppercase">Checkout</h3>
                                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Select Settlement Pipeline</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {[
                                                { id: "upi", label: "UPI", emoji: "📱", desc: "Digital Payment", theme: "emerald" },
                                                { id: "cash", label: "Cash", emoji: "💵", desc: "Hard Currency", theme: "amber" },
                                                { id: "wallet", label: "Wallet", emoji: "💰", desc: `Bal: ₹${selectedParty?.walletBalance?.toFixed(0) || 0}`, theme: "indigo" },
                                                { id: "card", label: "Card", emoji: "💳", desc: "Swipe / Dip", theme: "slate" },
                                                { id: "pay on counter", label: "Counter", emoji: "🏪", desc: "Pay at counter", theme: "slate" },
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => { kravy.click(); setPayMethod(m.id); }}
                                                    className={`relative flex flex-col items-start p-6 rounded-[2.5rem] border-2 transition-all group overflow-hidden ${payMethod === m.id ? "bg-white dark:bg-slate-800 border-slate-900 dark:border-white shadow-2xl -translate-y-1" : "bg-white/50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700"}`}
                                                >
                                                    {payMethod === m.id && (
                                                        <motion.div layoutId="pay-marker" className="absolute top-5 right-5 text-slate-900 dark:text-white">
                                                            <CheckCircle2 size={24} />
                                                        </motion.div>
                                                    )}
                                                    <span className="text-4xl mb-5 grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110">{m.emoji}</span>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">{m.label}</span>
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1.5 leading-none">{m.desc}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-[2.5rem] border border-white/80 dark:border-slate-700 shadow-inner p-8 mb-8 flex-1 flex flex-col justify-center min-h-[160px]">
                                            {payMethod === "upi" ? (
                                                <div className="flex items-center gap-8 animate-in fade-in slide-in-from-bottom-4">
                                                    <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/10 border border-slate-50 dark:border-slate-600">📱</div>
                                                    <div>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight mb-2 italic">Scan to Pay ₹{activeOrderForSelected.total}</p>
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Awaiting Digital Handshake...</p>
                                                        <div className="mt-4 flex items-center gap-2 text-emerald-500 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">Live Sync Active</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center animate-in fade-in scale-95">
                                                    <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Handover {payMethod.toUpperCase()} Settlement</p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Confirm once payment is physically received</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => { setPreviewMode("BILL"); setShowPreview(true); }}
                                                className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 dark:hover:border-white shadow-sm transition-all active:scale-90"
                                            >
                                                <Eye size={20} />
                                                <span className="text-[8px] font-black uppercase mt-1">Preview</span>
                                            </button>
                                            <button
                                                onClick={() => handlePrint("BILL")}
                                                className="flex-1 h-20 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 dark:hover:border-white shadow-sm transition-all active:scale-95"
                                            >
                                                <Printer size={18} /> Print Physical Receipt
                                            </button>
                                            <button
                                                onClick={() => handleCheckout(activeOrderForSelected.id)}
                                                className="flex-[2.5] h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.8rem] flex items-center justify-center gap-4 text-base font-black uppercase tracking-[0.15em] shadow-2xl shadow-slate-900/40 active:scale-95 transition-all hover:bg-slate-800 dark:hover:bg-slate-100"
                                            >
                                                Finalize Settlement <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center max-w-sm opacity-30 animate-in fade-in zoom-in-95">
                                    <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-8 border border-slate-200 shadow-inner">
                                        <CreditCard size={40} strokeWidth={1} />
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 mb-3 italic tracking-tighter uppercase leading-none">Billing Vault</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-10">Select an active table from Terminal to initiate checkout flow.</p>
                                    <button onClick={() => setActiveTab("dashboard")} className="h-14 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-110 active:scale-90 transition-all">
                                        <LayoutDashboard size={16} className="mr-2 inline" /> Back to Terminal
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

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
                                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${order.status === "READY" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
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

            {/* ═══ PREVIEW MODAL ═══ */}
            <AnimatePresence>
                {showPreview && selectedTable && activeOrderForSelected && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setShowPreview(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-[500px] h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{previewMode === "BILL" ? "Bill Preview" : "KOT Preview"}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Check before printing</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.1))} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ZoomOut size={14} /></button>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-9 text-center">{(previewZoom * 100).toFixed(0)}%</span>
                                    <button onClick={() => setPreviewZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ZoomIn size={14} /></button>
                                    <div className="w-px h-5 bg-slate-100 dark:bg-slate-800 mx-1" />
                                    <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="flex-1 overflow-auto bg-slate-200/80 dark:bg-zinc-900 p-8 flex flex-col items-center shadow-inner">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    ref={receiptRef}
                                    className="bg-white text-black p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] origin-top transition-all duration-300 mx-auto ring-1 ring-black/5"
                                    style={{
                                        width: '58mm',
                                        minHeight: '100px',
                                        transform: `scale(${previewZoom * 1.5})`,
                                        marginBottom: `${previewZoom * 120}px`
                                    }}
                                >
                                    {(() => {
                                        const targetO = printOrder || activeOrderForSelected;
                                        const targetT = printTable || selectedTable;
                                        if (!targetO || !targetT) return null;
                                        const sub = targetO.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
                                        const gst = isTaxEnabled ? (sub * taxRate) / 100 : 0;
                                        const total = sub + gst;

                                        return getReceiptJSX(
                                            previewMode,
                                            business,
                                            targetO,
                                            targetT,
                                            sub,
                                            isTaxEnabled,
                                            taxRate,
                                            gst,
                                            total,
                                            payMethod,
                                            qrUrl
                                        );
                                    })()}
                                </motion.div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handlePrint(previewMode);
                                        setShowPreview(false);
                                    }}
                                    className="flex-[2] py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer size={16} /> Print Direct
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


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

            {/* Hidden Printer Zone */}
            <div style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
                <div ref={billReceiptRef} style={{ width: '100%' }}>
                    {(() => {
                        const targetO = printOrder || activeOrderForSelected;
                        const targetT = printTable || selectedTable;
                        if (!targetO || !targetT) return null;
                        const sub = targetO.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
                        const gst = isTaxEnabled ? (sub * taxRate) / 100 : 0;
                        const total = sub + gst;
                        const predictedBalance = (payMethod.toLowerCase() === "wallet" && selectedParty)
                            ? (selectedParty.walletBalance - total)
                            : selectedParty?.walletBalance;
                        return getReceiptJSX("BILL", business, targetO, targetT, sub, isTaxEnabled, taxRate, gst, total, payMethod, qrUrl, predictedBalance);
                    })()}
                </div>
                <div ref={kotReceiptRef} style={{ width: '100%' }}>
                    {(() => {
                        const targetO = printOrder || activeOrderForSelected;
                        const targetT = printTable || selectedTable;
                        if (!targetO || !targetT) return null;
                        const sub = targetO.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
                        const gst = isTaxEnabled ? (sub * taxRate) / 100 : 0;
                        const total = sub + gst;
                        return getReceiptJSX("KOT", business, targetO, targetT, sub, isTaxEnabled, taxRate, gst, total, payMethod, qrUrl);
                    })()}
                </div>
            </div>

        </div>
    );

    function getReceiptJSX(
        mode: "BILL" | "KOT",
        business: any,
        activeOrder: Order | null | undefined,
        table: TableStatus | null | undefined,
        subtotal: number,
        taxEnabled: boolean,
        taxRate: number,
        gst: number,
        total: number,
        paymentMethod: string,
        qrCodeUrl: string,
        remainingBalance?: number
    ) {
        if (!activeOrder) return null;
        const displayTable = table || { name: activeOrder.table?.name || "Counter", id: "0" };

        if (mode === "BILL") {
            return (
                <div className="font-mono text-[10px] leading-tight text-black bg-white" style={{ width: '100%', paddingBottom: '15mm' }}>
                    {/* Header Section */}
                    <div className="text-center mb-2">
                        {business?.logoUrl && (
                            <div className="flex justify-center mb-1">
                                <img src={business.logoUrl} alt="Logo" className="max-h-[20mm] object-contain" style={{ filter: 'contrast(400%) grayscale(100%)' }} />
                            </div>
                        )}
                        <div className="font-black text-[16px] leading-none uppercase tracking-tight mb-1">{business?.businessName || "KRAVY RESTAURANT"}</div>
                        {(business?.businessAddress || business?.district) && (
                            <div className="text-[8px] font-black uppercase">
                                {business?.businessAddress} {business?.district && `| ${business.district}`}
                            </div>
                        )}
                        {business?.gstNumber && <div className="text-[9px] font-black border-y border-dotted border-black py-1 mt-1">GSTIN: {business.gstNumber}</div>}
                    </div>

                    {/* Order Details Section */}
                    <div className="flex justify-between text-[10px] font-black uppercase border-b border-dotted border-black pb-1 mb-1">
                        <span>INV: #{activeOrder?.id.slice(-6).toUpperCase()}</span>
                        <span>{new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span className="border border-black border-dotted px-1">TABLE: {displayTable.name}</span>
                        <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {(activeOrder.customerName || activeOrder.customerPhone || activeOrder.customerAddress) && (
                        <div className="mb-1 text-[9px] font-black uppercase border-y border-dotted border-black py-0.5">
                            {activeOrder.customerName && <div className="truncate">CUST: {activeOrder.customerName}</div>}
                            {activeOrder.customerPhone && <div>PH: {activeOrder.customerPhone}</div>}
                            {activeOrder.customerAddress && <div className="mt-0.5" style={{ whiteSpace: 'pre-wrap' }}>ADDR: {activeOrder.customerAddress}</div>}
                        </div>
                    )}

                    {/* Items Section */}
                    <div className="flex justify-between font-black text-[10px] uppercase border-b border-dotted border-black py-1 mt-1 mb-1">
                        <span className="flex-1">ITEM NAME</span>
                        <span className="w-[8mm] text-center">QTY</span>
                        <span className="w-[15mm] text-right">TOTAL</span>
                    </div>

                    <div className="space-y-1">
                        {activeOrder?.items.map((it: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[10px] font-black uppercase leading-tight border-b border-dotted border-black/20 pb-0.5">
                                <div className="flex-1 pr-1">
                                    <div className="truncate">{it.name}</div>
                                    <div className="text-[8px] opacity-70">{it.quantity} x {it.price.toFixed(2)}</div>
                                </div>
                                <span className="w-[8mm] text-center self-start pt-0.5">x{it.quantity}</span>
                                <span className="w-[15mm] text-right self-start pt-0.5">{(it.quantity * it.price).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals Section */}
                    <div className="mt-1 pt-1 space-y-0.5">
                        <div className="flex justify-between text-[10px] font-black">
                            <span>SUBTOTAL</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {taxEnabled && (
                            <div className="flex justify-between text-[9px] font-black">
                                <span>GST ({taxRate}%)</span>
                                <span>₹{gst.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-[16px] border-y-2 border-dotted border-black py-1.5 my-1 uppercase">
                            <span>GRAND TOTAL</span>
                            <span>₹{total.toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="mt-1 text-[8px] font-black uppercase italic leading-none">
                        RUPEES: {numberToWords(total)}
                    </div>

                    <div className="mt-3 text-center">
                        <div className="inline-block border border-dotted border-black px-4 py-1 text-[11px] font-black uppercase">
                            PAID VIA {paymentMethod.toUpperCase()}
                        </div>
                        {paymentMethod.toLowerCase() === "wallet" && remainingBalance !== undefined && (
                            <div className="mt-1 text-[10px] font-black uppercase border-t border-dotted border-black pt-1">
                                Remaining Balance: ₹{remainingBalance.toFixed(2)}
                            </div>
                        )}
                    </div>

                    {/* UPI QR Section */}
                    {(business?.upi && business?.upiQrEnabled !== false) && (
                        <div className="mt-3 text-center border-t border-dotted border-black pt-2">
                            <div className="text-[9px] font-black mb-1.5 uppercase tracking-[0.2em]">Scan to Pay Instantly</div>
                            <div className="inline-block border-2 border-dotted border-black p-1 bg-white rounded">
                                <img src={qrCodeUrl} alt="UPI QR" className="w-[30mm] h-[30mm] object-contain" style={{ filter: 'contrast(400%) grayscale(100%)' }} />
                            </div>
                            <div className="text-[8px] font-black mt-1 tracking-widest">{business.upi}</div>
                        </div>
                    )}

                    {/* Footer Section */}
                    <div className="mt-3 text-center border-t border-dotted border-black pt-2">
                        <div className="text-[12px] font-black uppercase italic tracking-tighter">THANK YOU 🙏 VISIT AGAIN</div>
                        {business?.businessTagLine && <div className="text-[8px] font-black mt-0.5 uppercase tracking-widest">{business.businessTagLine}</div>}
                        <div className="text-[7px] font-black opacity-30 mt-2 uppercase tracking-[0.3em]">Powered by Kravy AI</div>
                        {/* Buffer space to prevent cutting */}
                        <div className="h-[5mm]" />
                    </div>
                </div>
            );
        } else { // KOT
            return (
                <div className="kravy-kot-print text-black font-mono bg-white text-[10px] leading-tight" style={{ width: '100%', paddingBottom: '25mm' }}>
                    <div className="text-center font-bold text-[14px] border-b border-dashed border-black pb-1 mb-2 uppercase tracking-tighter">*** KOT ***</div>

                    <div className="space-y-0.5 mb-2">
                        <div className="flex justify-between items-center font-bold text-[10px]">
                            <span>TOKEN: #{activeOrder.id.slice(-4).toUpperCase()}</span>
                            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-[10px]">
                            <span>TIME: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>KOT NO: {Math.floor(Date.now() / 1000).toString().slice(-4)}</span>
                        </div>
                    </div>

                    <div className="text-center text-[16px] font-bold border border-dashed border-black py-1 my-2 uppercase">
                        TABLE: {displayTable.name}
                    </div>

                    {activeOrder.customerAddress && (
                        <div className="mt-1 mb-2 p-1 border border-dashed border-black text-[10px] font-bold uppercase">
                            DELIVERY ADDR: {activeOrder.customerAddress}
                        </div>
                    )}

                    {activeOrder.notes && (
                        <div className="mt-1 mb-2 p-1 border border-dashed border-black text-[10px] font-bold uppercase italic">
                            NOTE: {activeOrder.notes}
                        </div>
                    )}

                    <div className="flex justify-between font-bold text-[10px] uppercase border-b border-dashed border-black pb-0.5 mb-1.5">
                        <span>ITEM DESCRIPTION</span>
                        <span>QTY</span>
                    </div>

                    <div className="space-y-2">
                        {activeOrder?.items.map((it: any, i: number) => (
                            <div key={i} className="flex justify-between items-start border-b border-dotted border-black/20 pb-1.5">
                                <div className="flex-1 pr-2">
                                    <div className="text-[12px] font-bold leading-tight uppercase">{it.name}</div>
                                    {it.instruction && <div className="text-[9px] font-bold mt-0.5 uppercase">{"=>"} {it.instruction}</div>}
                                    {it.variants && it.variants.length > 0 && (
                                        <div className="text-[9px] font-medium mt-0.5 uppercase opacity-80">
                                            ({it.variants.map((v: any) => v.name).join(', ')})
                                        </div>
                                    )}
                                </div>
                                <div className="text-[14px] font-bold shrink-0 ml-2">x{it.quantity}</div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-5 pt-1.5 border-t border-dashed border-black">
                        <div className="text-[9px] font-bold uppercase tracking-widest mb-1">Kravy POS System</div>
                        <div className="text-[7px] font-medium">{new Date().toLocaleString('en-IN')}</div>
                        {/* Extended buffer for paper tearing */}
                        <div className="h-[20mm]" />
                        <div className="text-[7px] opacity-30 italic">... end of token ...</div>
                        <div className="h-[10mm]" />
                    </div>
                </div>
            );
        }
    }

    async function addItemToOrder(menuItem: any) {
        if (!orderToUpdate) return;

        try {
            const newItem: OrderItem = {
                itemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: 1,
                isVeg: menuItem.isVeg,
                isNew: true
            };

            const updatedItems = [...orderToUpdate.items, newItem];
            const newTotal = updatedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

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
