"use client";

export type SavedOrder = {
    orderId: string;
    phone: string;
    tableId: string;
    total: number;
    status: string;
    savedAt: string;
    clerkUserId: string;
};

const STORAGE_KEY = "kravy_saved_orders";

export function getSavedOrders(): SavedOrder[] {
    if (typeof window === "undefined") return [];
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to parse saved orders:", error);
        return [];
    }
}

export function saveOrderLocally(order: Omit<SavedOrder, "savedAt">) {
    if (typeof window === "undefined") return;
    try {
        const existing = getSavedOrders();
        const updated = [
            { ...order, savedAt: new Date().toISOString() },
            ...existing.filter((o) => o.orderId !== order.orderId),
        ].slice(0, 10); // Keep last 10 orders
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error("Failed to save order locally:", error);
    }
}

export function removeSavedOrder(orderId: string) {
    if (typeof window === "undefined") return;
    try {
        const existing = getSavedOrders();
        const updated = existing.filter((o) => o.orderId !== orderId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error("Failed to remove saved order:", error);
    }
}
