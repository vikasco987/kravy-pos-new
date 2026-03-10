"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
    QrCode,
    Plus,
    Edit,
    Trash2,
    Download,
    Eye,
    Clock,
    CheckCircle,
    ChefHat,
    Truck,
    Users,
    Star,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    Settings,
    Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRealTimeNotifications } from "@/hooks/useRealTimeNotifications";
import { kravy } from "@/lib/sounds";

interface TableData {
    id: string;
    name: string;
    qrUrl?: string;
    createdAt: string;
    _count: {
        orders: number;
    };
}

interface Order {
    id: string;
    items: any[];
    total: number;
    status: string;
    customerName: string;
    customerPhone?: string;
    table?: {
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Review {
    id: string;
    rating: number;
    comment?: string;
    customerName?: string;
    item?: {
        name: string;
    };
    createdAt: string;
}

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    activeTables: number;
}

const statusConfig = {
    PENDING: { icon: Clock, color: "bg-yellow-500", label: "Pending" },
    ACCEPTING: { icon: Eye, color: "bg-blue-500", label: "Confirming" },
    ACCEPTED: { icon: CheckCircle, color: "bg-green-500", label: "Confirmed" },
    PREPARING: { icon: ChefHat, color: "bg-orange-500", label: "Preparing" },
    READY: { icon: Truck, color: "bg-purple-500", label: "Ready" },
    SERVED: { icon: CheckCircle, color: "bg-green-600", label: "Served" },
    COMPLETED: { icon: CheckCircle, color: "bg-gray-500", label: "Completed" },
};

export default function QRManagementPage() {
    const { userId } = useAuth();
    const { isConnected } = useRealTimeNotifications();

    // State management
    const [tables, setTables] = useState<TableData[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [newTableName, setNewTableName] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Fetch data
    useEffect(() => {
        if (userId) {
            fetchAllData();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchAllData, 30000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [tablesRes, ordersRes, reviewsRes] = await Promise.all([
                fetch("/api/tables"),
                fetch("/api/orders"),
                fetch(`/api/reviews?clerkUserId=${userId}`)
            ]);

            if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                setTables(tablesData);
            }

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }

            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData);
            }

            // Calculate stats
            if (tablesRes.ok && ordersRes.ok && reviewsRes.ok) {
                const tablesData = await tablesRes.json();
                const ordersData = await ordersRes.json();
                const reviewsData = await reviewsRes.json();

                const calculatedStats: Stats = {
                    totalOrders: ordersData.length,
                    pendingOrders: ordersData.filter((o: Order) => 
                        ['PENDING', 'ACCEPTING', 'ACCEPTED'].includes(o.status)).length,
                    completedOrders: ordersData.filter((o: Order) => o.status === 'COMPLETED').length,
                    totalRevenue: ordersData
                        .filter((o: Order) => o.status === 'COMPLETED')
                        .reduce((sum: number, o: Order) => sum + o.total, 0),
                    averageRating: reviewsData.length > 0 
                        ? reviewsData.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewsData.length 
                        : 0,
                    totalReviews: reviewsData.length,
                    activeTables: tablesData.length,
                };
                setStats(calculatedStats);
            }
        } catch (error) {
            kravy.error();
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAllData();
    };

    const createTable = async () => {
        if (!newTableName.trim()) {
            kravy.error();
            toast.error("Table name is required");
            return;
        }

        try {
            const response = await fetch("/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTableName.trim() })
            });

            if (response.ok) {
                kravy.success();
                toast.success("Table created successfully");
                setNewTableName("");
                fetchAllData();
            } else {
                throw new Error("Failed to create table");
            }
        } catch (error) {
            kravy.error();
            toast.error("Failed to create table");
        }
    };

    const deleteTable = async (tableId: string) => {
        if (!confirm("Are you sure you want to delete this table?")) return;

        try {
            const response = await fetch(`/api/tables?id=${tableId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                kravy.success();
                toast.success("Table deleted successfully");
                fetchAllData();
            } else {
                throw new Error("Failed to delete table");
            }
        } catch (error) {
            kravy.error();
            toast.error("Failed to delete table");
        }
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            const response = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status })
            });

            if (response.ok) {
                kravy.success();
                toast.success("Order status updated");
                fetchAllData();
            } else {
                throw new Error("Failed to update order");
            }
        } catch (error) {
            kravy.error();
            toast.error("Failed to update order status");
        }
    };

    const downloadQR = (table: TableData) => {
        if (!table.qrUrl) return;

        const link = document.createElement('a');
        link.href = table.qrUrl;
        link.download = `qr-${table.name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        kravy.success();
        toast.success("QR code downloaded");
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${
                    i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
                }`}
            />
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <QrCode className="h-8 w-8 text-orange-500" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">QR Management</h1>
                                <p className="text-sm text-gray-600">Manage your QR ordering system</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm text-gray-600">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-8">
                        {["overview", "tables", "orders", "reviews"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                                    activeTab === tab
                                        ? "border-orange-500 text-orange-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Overview Tab */}
                {activeTab === "overview" && stats && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                                        </div>
                                        <Users className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                            <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                                        </div>
                                        <Clock className="h-8 w-8 text-yellow-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Revenue</p>
                                            <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue}</p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-2xl font-bold text-orange-600">
                                                    {stats.averageRating.toFixed(1)}
                                                </p>
                                                <div className="flex">
                                                    {renderStars(Math.round(stats.averageRating))}
                                                </div>
                                            </div>
                                        </div>
                                        <Star className="h-8 w-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Orders */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Table</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.slice(0, 5).map((order) => {
                                            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">
                                                        #{order.id.slice(-8)}
                                                    </TableCell>
                                                    <TableCell>{order.customerName}</TableCell>
                                                    <TableCell>{order.table?.name || "N/A"}</TableCell>
                                                    <TableCell>₹{order.total}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                                                            <StatusIcon className="h-3 w-3" />
                                                            <span>{statusConfig[order.status as keyof typeof statusConfig]?.label}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(order.createdAt).toLocaleTimeString()}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tables Tab */}
                {activeTab === "tables" && (
                    <div className="space-y-6">
                        {/* Create New Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex space-x-3">
                                    <Input
                                        placeholder="Enter table name..."
                                        value={newTableName}
                                        onChange={(e) => setNewTableName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && createTable()}
                                    />
                                    <Button onClick={createTable} className="bg-orange-500 hover:bg-orange-600">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Table
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tables List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Active Tables ({tables.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Table Name</TableHead>
                                            <TableHead>QR Code</TableHead>
                                            <TableHead>Orders</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tables.map((table) => (
                                            <TableRow key={table.id}>
                                                <TableCell className="font-medium">{table.name}</TableCell>
                                                <TableCell>
                                                    {table.qrUrl ? (
                                                        <div className="flex items-center space-x-2">
                                                            <QrCode className="h-4 w-4 text-green-500" />
                                                            <span className="text-sm text-gray-600">Generated</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Not generated</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{table._count.orders}</TableCell>
                                                <TableCell>
                                                    {new Date(table.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        {table.qrUrl && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => downloadQR(table)}
                                                            >
                                                                <Download className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => deleteTable(table.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === "orders" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>All Orders ({orders.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Table</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                #{order.id.slice(-8)}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{order.customerName}</p>
                                                    {order.customerPhone && (
                                                        <p className="text-sm text-gray-500">{order.customerPhone}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{order.table?.name || "N/A"}</TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="text-sm">
                                                        {order.items.length} items
                                                    </p>
                                                    <div className="text-xs text-gray-500">
                                                        {order.items.slice(0, 2).map((item: any, index: number) => (
                                                            <span key={index}>
                                                                {item.name} ({item.quantity})
                                                                {index < Math.min(1, order.items.length - 1) && ", "}
                                                            </span>
                                                        ))}
                                                        {order.items.length > 2 && "..."}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">₹{order.total}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(statusConfig).map(([status, config]) => (
                                                            <SelectItem key={status} value={status}>
                                                                <div className="flex items-center space-x-2">
                                                                    <config.icon className="h-3 w-3" />
                                                                    <span>{config.label}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(`/order-tracking/${order.id}`, '_blank')}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Reviews ({reviews.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex">{renderStars(review.rating)}</div>
                                                <div>
                                                    <p className="font-medium">{review.customerName || "Anonymous"}</p>
                                                    {review.item && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {review.item.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-600 text-sm">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                                {reviews.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p>No reviews yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
