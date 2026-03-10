import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface NotificationData {
    type: 'connected' | 'new_orders' | 'new_reviews';
    orders?: any[];
    reviews?: any[];
}

export function useRealTimeNotifications() {
    const { userId } = useAuth();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const eventSource = new EventSource(`/api/notifications`);

        eventSource.onopen = () => {
            setIsConnected(true);
            console.log("Connected to real-time notifications");
        };

        eventSource.onmessage = (event) => {
            try {
                const data: NotificationData = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'connected':
                        console.log("Notifications connected");
                        break;
                    
                    case 'new_orders':
                        if (data.orders && data.orders.length > 0) {
                            data.orders.forEach((order) => {
                                toast.success(`New order received!`, {
                                    description: `${order.customerName} - ₹${order.total}`,
                                    action: {
                                        label: "View Order",
                                        onClick: () => {
                                            window.open(`/order-tracking/${order.id}`, '_blank');
                                        }
                                    }
                                });
                            });
                        }
                        break;
                    
                    case 'new_reviews':
                        if (data.reviews && data.reviews.length > 0) {
                            data.reviews.forEach((review) => {
                                toast.success(`New review received!`, {
                                    description: `${review.customerName} rated ${review.rating} stars`,
                                    action: {
                                        label: "View Review",
                                        onClick: () => {
                                            window.open(`/dashboard/qr-management?tab=reviews`, '_blank');
                                        }
                                    }
                                });
                            });
                        }
                        break;
                }
            } catch (error) {
                console.error("Error parsing notification data:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            setIsConnected(false);
        };

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, [userId]);

    return { isConnected };
}
