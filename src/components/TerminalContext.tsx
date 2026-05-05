"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type OrderStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "COMPLETED";

export interface Order {
    id: string;
    items: any[];
    total: number;
    status: OrderStatus;
    tableId?: string; // ✅ Added for fast lookups
    table?: { id: string; name: string };
    customerName?: string;
    customerPhone?: string;
    createdAt: string;
    isDeleted?: boolean;
    kotNumbers?: string[];
    billNumber?: string;
    tokenNumber?: string | number;
}

export interface Table {
    id: string;
    name: string;
    status: "FREE" | "PENDING" | "ACCEPTED" | "PREPARING" | "READY";
    activeOrderId?: string;
    zone?: string;
    isOccupied?: boolean;
    activeCount?: number;
    startTime?: string;
}

interface TerminalContextType {
    tablesList: Table[];
    orders: Order[];
    ordersByTableId: Record<string, Order[]>; // Fast lookup map
    business: any;
    isLoading: boolean;
    lastUpdated: number | null;
    fetchData: (showLoading?: boolean) => any;
    updateTableStatus: (tableId: string, status: string) => void;
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const TerminalProvider = ({ children }: { children: React.ReactNode }) => {
    const [rawTables, setRawTables] = useState<Table[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [business, setBusiness] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    // Group orders by table ID for fast lookup
    const ordersByTableId = React.useMemo(() => {
        const map: Record<string, Order[]> = {};
        orders.forEach(order => {
            if (order.tableId) {
                if (!map[order.tableId]) map[order.tableId] = [];
                map[order.tableId].push(order);
            }
        });
        return map;
    }, [orders]);

    // Reactively compute tablesList whenever orders or rawTables change
    const tablesList = React.useMemo(() => {
        return rawTables.map(table => {
            const tableOrders = (ordersByTableId[table.id] || []).filter(o => !o.isDeleted && o.status !== "COMPLETED");
            
            let status: Table["status"] = "FREE";
            if (tableOrders.some(o => o.status === "READY")) status = "READY";
            else if (tableOrders.some(o => o.status === "PREPARING")) status = "PREPARING";
            else if (tableOrders.some(o => o.status === "ACCEPTED")) status = "ACCEPTED";
            else if (tableOrders.some(o => o.status === "PENDING")) status = "PENDING";

            const activeCount = tableOrders.length;
            const sortedOrders = [...tableOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const startTime = sortedOrders.length > 0 ? sortedOrders[0].createdAt : undefined;
            const activeOrderId = tableOrders.length > 0 ? tableOrders[0].id : undefined;

            return { ...table, status, activeCount, startTime, activeOrderId };
        });
    }, [rawTables, ordersByTableId]);

    const fetchData = useCallback(async (showLoading = true, force = false) => {
        // ✅ Stale-time logic: Avoid fetching if data is recent (< 30s) unless forced
        if (!force && lastUpdated && Date.now() - lastUpdated < 30000) {
            console.log("[TerminalContext] Data is fresh, skipping fetch");
            return;
        }

        if (showLoading && rawTables.length === 0) setIsLoading(true);
        
        try {
            const [tablesRes, ordersRes, profileRes] = await Promise.all([
                fetch("/api/tables").catch(() => null),
                fetch("/api/orders?active=true").catch(() => null),
                fetch("/api/profile").catch(() => null)
            ]);

            if (tablesRes?.ok) {
                const tData = await tablesRes.json();
                setRawTables(tData);
            }
            if (ordersRes?.ok) {
                const oData = await ordersRes.json();
                setOrders(oData);
            }
            if (profileRes?.ok) {
                const bData = await profileRes.json();
                setBusiness(bData);
            }
            
            if (tablesRes?.ok || ordersRes?.ok || profileRes?.ok) {
                setLastUpdated(Date.now());
            }
        } catch (err) {
            console.error("Failed to fetch terminal data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [rawTables.length, lastUpdated]);

    const updateTableStatus = useCallback((tableId: string, status: Table["status"]) => {
        // Optional: Manual override if needed
        setRawTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
        // Background polling every 30 seconds
        const interval = setInterval(() => fetchData(false), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <TerminalContext.Provider value={{ 
            tablesList, 
            orders, 
            business, 
            isLoading, 
            lastUpdated, 
            fetchData, 
            updateTableStatus,
            setOrders
        }}>
            {children}
        </TerminalContext.Provider>
    );
};

export const useTerminalContext = () => {
    const context = useContext(TerminalContext);
    if (context === undefined) {
        throw new Error("useTerminalContext must be used within a TerminalProvider");
    }
    return context;
};
