import { useEffect, useState, useRef } from "react";
import { useAuthContext } from "@/components/AuthContext";
import { toast } from "sonner";

interface NotificationData {
    orders?: any[];
    reviews?: any[];
}

export function useRealTimeNotifications() {
    const { user } = useAuthContext();
    const userId = user?.id;
    const [isConnected, setIsConnected] = useState(false);
    
    // Use refs so we don't re-trigger the effect on every fetch
    const seenOrderIds = useRef<Set<string>>(new Set());
    const seenReviewIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;

        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        const pollNotifications = async () => {
            if (!isMounted) return;
            try {
                // Fetch standard JSON instead of SSE
                const response = await fetch(`/api/notifications`);
                if (!response.ok) throw new Error("Failed to fetch notifications");
                
                const data: NotificationData = await response.json();
                if (isMounted) setIsConnected(true);

                if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
                    data.orders.forEach((order) => {
                        if (!seenOrderIds.current.has(order.id)) {
                            seenOrderIds.current.add(order.id);
                            toast.success(`New order received!`, {
                                description: `${order.customerName} - ₹${order.total}`,
                                action: {
                                    label: "View Order",
                                    onClick: () => {
                                        window.open(`/order-tracking/${order.id}`, '_blank');
                                    }
                                }
                            });
                        }
                    });
                }
                
                if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
                    data.reviews.forEach((review) => {
                        if (!seenReviewIds.current.has(review.id)) {
                            seenReviewIds.current.add(review.id);
                            toast.success(`New review received!`, {
                                description: `${review.customerName} rated ${review.rating} stars`,
                                action: {
                                    label: "View Review",
                                    onClick: () => {
                                        window.open(`/dashboard/qr-management?tab=reviews`, '_blank');
                                    }
                                }
                            });
                        }
                    });
                }
            } catch (error) {
                console.error("Error polling notifications:", error);
                if (isMounted) setIsConnected(false);
            }
        };

        // Initial fetch
        pollNotifications();

        // Poll every 10 seconds to save on server compute cost
        pollInterval = setInterval(pollNotifications, 10000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            setIsConnected(false);
        };
    }, [userId]);

    return { isConnected };
}
