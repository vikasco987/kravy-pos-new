"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    ShoppingCart, 
    Plus, 
    Minus, 
    Star,
    Clock,
    CheckCircle,
    IndianRupee,
    Utensils,
    Leaf
} from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price?: number | null;
    sellingPrice?: number | null;
    imageUrl?: string | null;
    isVeg?: boolean;
    isBestseller?: boolean;
    isRecommended?: boolean;
    isNew?: boolean;
    spiciness?: string;
    rating?: number;
    category?: { name: string };
}

interface CartItem extends MenuItem {
    quantity: number;
    addedAt: Date;
}

interface BusinessProfile {
    businessName?: string;
    logoUrl?: string;
    businessTagLine?: string;
}

export default function QRMenuPage() {
    const searchParams = useSearchParams();
    const clerkId = searchParams.get('clerkId');
    const tableId = searchParams.get('tableId');
    const tableName = searchParams.get('tableName');

    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    useEffect(() => {
        if (clerkId) {
            fetchData();
        }
    }, [clerkId]);

    const fetchData = async () => {
        try {
            const [itemsRes, profileRes] = await Promise.all([
                fetch(`/api/public/menu?clerkId=${clerkId}`),
                fetch(`/api/public/profile?clerkId=${clerkId}`)
            ]);

            if (itemsRes.ok && profileRes.ok) {
                const itemsData = await itemsRes.json();
                const profileData = await profileRes.json();
                
                setItems(itemsData);
                setProfile(profileData);
                
                // Extract categories
                const uniqueCategories = new Set<string>(
                    itemsData
                        .filter((item: MenuItem) => item.category?.name)
                        .map((item: MenuItem) => item.category!.name)
                );
                const cats = ["All", ...Array.from(uniqueCategories)];
                setCategories(cats);
            }
        } catch (error) {
            toast.error("Failed to load menu");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(cartItem => cartItem.id === item.id);
            if (existing) {
                return prev.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prev, { ...item, quantity: 1, addedAt: new Date() }];
        });
        toast.success(`${item.name} added to cart`);
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
            return prev.filter(item => item.id !== itemId);
        });
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => {
            const price = item.sellingPrice || item.price || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const placeOrder = async () => {
        if (cart.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        if (!customerName.trim()) {
            toast.error("Please enter your name");
            return;
        }

        setPlacingOrder(true);
        try {
            const orderData = {
                tableId,
                tableName,
                items: cart.map(item => ({
                    name: item.name,
                    price: item.sellingPrice || item.price || 0,
                    quantity: item.quantity,
                    itemId: item.id,
                    addedAt: item.addedAt,
                    addedInCase: "main"
                })),
                total: getTotalPrice(),
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim() || undefined
            };

            const response = await fetch('/api/public/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const order = await response.json();
                toast.success("Order placed successfully!");
                setCart([]);
                setCustomerName("");
                setCustomerPhone("");
                // Redirect to order tracking
                window.location.href = `/order-tracking/${order.id}`;
            } else {
                throw new Error("Failed to place order");
            }
        } catch (error) {
            toast.error("Failed to place order. Please try again.");
        } finally {
            setPlacingOrder(false);
        }
    };

    const filteredItems = selectedCategory === "All" 
        ? items 
        : items.filter(item => item.category?.name === selectedCategory);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <div className="text-center">
                    <Utensils className="h-12 w-12 text-orange-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Loading menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {profile?.logoUrl && (
                                <img src={profile.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg" />
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {profile?.businessName || "Restaurant"}
                                </h1>
                                {profile?.businessTagLine && (
                                    <p className="text-sm text-gray-600">{profile.businessTagLine}</p>
                                )}
                            </div>
                        </div>
                        {tableName && (
                            <Badge variant="outline" className="bg-orange-50">
                                Table: {tableName}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Menu Items */}
                    <div className="lg:col-span-2">
                        {/* Category Filter */}
                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category)}
                                        className={selectedCategory === category ? "bg-orange-500 hover:bg-orange-600" : ""}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredItems.map(item => (
                                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex space-x-4">
                                            {item.imageUrl && (
                                                <img 
                                                    src={item.imageUrl} 
                                                    alt={item.name}
                                                    className="w-20 h-20 rounded-lg object-cover"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                            {item.isVeg && <Leaf className="h-4 w-4 text-green-500" />}
                                                            {item.isBestseller && (
                                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                                    Bestseller
                                                                </Badge>
                                                            )}
                                                            {item.isNew && (
                                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                                    New
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-bold text-orange-600">
                                                                    <IndianRupee className="h-4 w-4 inline" />
                                                                    {item.sellingPrice || item.price || 0}
                                                                </span>
                                                                {item.rating && (
                                                                    <div className="flex items-center space-x-1">
                                                                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                                                        <span className="text-xs text-gray-600">{item.rating}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => addToCart(item)}
                                                                className="bg-orange-500 hover:bg-orange-600"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2 mb-4">
                                    <ShoppingCart className="h-5 w-5 text-orange-500" />
                                    <h2 className="font-semibold text-lg">Your Order</h2>
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            placeholder="Enter phone number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                {/* Cart Items */}
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                    {cart.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">Your cart is empty</p>
                                    ) : (
                                        cart.map(item => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-600">
                                                        <IndianRupee className="h-3 w-3 inline" />
                                                        {item.sellingPrice || item.price || 0} × {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="font-medium w-8 text-center">{item.quantity}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => addToCart(item)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {cart.length > 0 && (
                                    <>
                                        <Separator className="my-4" />
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-semibold">Total:</span>
                                            <span className="font-bold text-lg text-orange-600">
                                                <IndianRupee className="h-5 w-5 inline" />
                                                {getTotalPrice()}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={placeOrder}
                                            disabled={placingOrder || !customerName.trim()}
                                            className="w-full bg-orange-500 hover:bg-orange-600"
                                        >
                                            {placingOrder ? "Placing Order..." : "Place Order"}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
