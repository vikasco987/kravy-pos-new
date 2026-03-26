"use client";
// Force re-compilation to fix vendor-chunks error

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { kravy } from "@/lib/sounds";
import {
    ChevronLeft,
    Search,
    Star,
    ShoppingBag,
    X,
    Minus,
    Plus,
    ChevronRight,
    Flame,
    Clock,
    Gift,
    MessageSquare,
    CheckCircle2,
    Phone,
    User,
    ArrowRight,
    Info,
    Tag,
    Users,
    MapPin,
    Terminal,
    History,
    AlertCircle,
    RefreshCw,
    Award,
    Sparkles,
    ChevronDown,
    Check,
    UtensilsCrossed
} from "lucide-react";
import { saveOrderLocally } from "@/lib/orderStorage";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";

/**
 * TYPES
 */
type MenuItem = {
    id: string;
    name: string;
    description?: string;
    price?: number | null;
    sellingPrice?: number | null;
    imageUrl?: string | null;
    image?: string | null;
    unit?: string | null;
    categoryId?: string | null;
    category?: { id: string; name: string };
    isVeg: boolean;
    isBestseller: boolean;
    isRecommended: boolean;
    isNew: boolean;
    spiciness?: string;
    rating?: number;
    hiName?: string;
    mrName?: string;
    taName?: string;
    upsellText?: string;
    gst?: number;
    taxStatus?: string;
    ico?: string;
    variants?: any[] | null;
};

type BusinessProfile = {
    businessName: string;
    logoUrl?: string;
    profileImageUrl?: string;
    businessAddress?: string;
    businessTagLine?: string;
    taxEnabled?: boolean;
    taxRate?: number;
    perProductTaxEnabled?: boolean;
    collectCustomerName?: boolean;
    requireCustomerName?: boolean;
    collectCustomerPhone?: boolean;
    requireCustomerPhone?: boolean;
    collectCustomerAddress?: boolean;
    requireCustomerAddress?: boolean;
};

type ComboSelection = {
    type: 'fixed' | 'choice';
    itemId?: string;
    categoryId?: string;
    qty?: number;
    label?: string;
};

type Combo = {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    selections: ComboSelection[];
};

type Offer = {
    id: string;
    title: string;
    description?: string;
    code?: string;
    discountType: string;
    discountValue: number;
    minOrderValue?: number;
};

type Reward = {
    id: string;
    title: string;
    description: string;
    pointsRequired: number;
    isActive: boolean;
};

type ReviewData = {
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
    tableId?: string;
    imageUrl?: string | null;
};

/**
 * COMPONENTS
 */
function PublicMenu() {
    const { clerkId } = useParams() as { clerkId: string };
    const searchParams = useSearchParams();
    const tableId = searchParams.get("tableId") || "Counter";
    const tableName = searchParams.get("tableName") || tableId;

    // Data State
    const [items, setItems] = useState<MenuItem[]>([]);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [combos, setCombos] = useState<Combo[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<"menu" | "reviews" | "loyalty" | "gallery">("menu");
    const [cart, setCart] = useState<Record<string, number>>({});
    const [instructions, setInstructions] = useState<Record<string, string>>({});
    const [searchQ, setSearchQ] = useState("");
    const [vegOnly, setVegOnly] = useState(false);
    const [activeLang, setActiveLang] = useState<"en" | "hi" | "mr" | "ta">("en");
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
    const [showCartSheet, setShowCartSheet] = useState(false);
    const [showReviewSheet, setShowReviewSheet] = useState(false);
    const [showCategorySheet, setShowCategorySheet] = useState(false);
    const [loyaltyOn, setLoyaltyOn] = useState(false);

    // User Data
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("UPI / QR");

    // Order Flow
    const [orderStatus, setOrderStatus] = useState<"none" | "placing" | "placed">("none");
    const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
    const [lastOrderItems, setLastOrderItems] = useState<any[]>([]);
    const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
    const [showRecentOrders, setShowRecentOrders] = useState(false);
    const [activeCombo, setActiveCombo] = useState<Combo | null>(null);
    const [comboSelections, setComboSelections] = useState<Record<number, string>>({});
    const [combosCart, setCombosCart] = useState<{ id: string, name: string, price: number, selections: any[] }[]>([]);
    const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
    const [variantCart, setVariantCart] = useState<any[]>([]);

    // Review State
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewImageUrl, setReviewImageUrl] = useState("");
    const [reviewImageUploading, setReviewImageUploading] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [helpfulReviews, setHelpfulReviews] = useState<Record<string, boolean>>({});
    const [reviewFilter, setReviewFilter] = useState<number | null>(null);

    // Gallery State
    type GalleryImg = { id: string; imageUrl: string; category: string; caption: string | null; };
    const [galleryImages, setGalleryImages] = useState<GalleryImg[]>([]);
    const [galleryFilter, setGalleryFilter] = useState("all");
    const [galleryLightbox, setGalleryLightbox] = useState<GalleryImg | null>(null);

    // Realistic curated avatar images for a "Genuine" feel
    const getAvatarUrl = (name: string, seed?: string) => {
        const avatars = [
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1542178243-ed2003b5adad?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1544717297-fa15739a5443?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=120&h=120&fit=crop&q=80',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&q=80'
        ];
        let hash = 0;
        const seedValue = (name === "Guest" || name === "Anonymous" || !name) && seed ? seed : (name || "Guest");
        for (let i = 0; i < seedValue.length; i++) {
            hash = seedValue.charCodeAt(i) + ((hash << 5) - hash);
        }
        return avatars[Math.abs(hash) % avatars.length];
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'from-pink-500 to-rose-500',
            'from-purple-500 to-indigo-500',
            'from-blue-500 to-cyan-500',
            'from-teal-500 to-emerald-500',
            'from-green-500 to-lime-500',
            'from-yellow-500 to-amber-500',
            'from-orange-500 to-orange-600',
            'from-red-500 to-red-600',
            'from-fuchsia-500 to-purple-600',
            'from-violet-500 to-purple-500',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getIndianName = (seed: string) => {
        const names = [
            "Rahul S.", "Priya P.", "Amit K.", "Neha S.", "Vikram G.",
            "Anjali D.", "Suresh R.", "Kavita J.", "Deepak V.", "Pooja M.",
            "Rohan M.", "Sneha K.", "Aditya N.", "Kriti S.", "Varun D.",
            "Vivek T.", "Megha C.", "Siddharth B.", "Tara R.", "Karan S."
        ];
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return names[Math.abs(hash) % names.length];
    };

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize recent orders from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`recent_orders_${clerkId}`);
        if (saved) {
            try {
                setRecentOrderIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent orders");
            }
        }
    }, [clerkId]);

    // Save recent orders to localStorage
    useEffect(() => {
        if (recentOrderIds.length > 0) {
            localStorage.setItem(`recent_orders_${clerkId}`, JSON.stringify(recentOrderIds));
        }
    }, [recentOrderIds, clerkId]);

    // Initialize customer details from localStorage
    useEffect(() => {
        const savedPhone = localStorage.getItem('kravy_customer_phone');
        const savedName = localStorage.getItem('kravy_customer_name');
        if (savedPhone) setCustomerPhone(savedPhone);
        if (savedName) setCustomerName(savedName);
    }, []);

    // Save customer details to localStorage automatically
    useEffect(() => {
        if (customerPhone && customerPhone.length === 10) localStorage.setItem('kravy_customer_phone', customerPhone);
    }, [customerPhone]);

    useEffect(() => {
        if (customerName) localStorage.setItem('kravy_customer_name', customerName);
    }, [customerName]);

    // Fetch Data
    useEffect(() => {
        if (!clerkId) return;
        async function fetchData() {
            try {
                const [menuRes, reviewsRes] = await Promise.all([
                    fetch(`/api/public/menu/${clerkId}`),
                    fetch(`/api/public/reviews?clerkUserId=${clerkId}`)
                ]);

                const menuData = await menuRes.json();
                const reviewsData = await reviewsRes.json();

                if (menuData.items) setItems(menuData.items);
                if (menuData.profile) setProfile(menuData.profile);
                if (menuData.combos) setCombos(menuData.combos);
                if (menuData.offers) setOffers(menuData.offers);
                if (menuData.rewards) setRewards(menuData.rewards);
                if (Array.isArray(reviewsData)) setReviews(reviewsData);

                // Fetch gallery
                const galRes = await fetch(`/api/public/gallery/${clerkId}`);
                if (galRes.ok) {
                    const galData = await galRes.json();
                    if (Array.isArray(galData)) setGalleryImages(galData);
                }
            } catch (err) {
                toast.error("Connection lost");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [clerkId]);

    // Handle Phone Change for Loyalty
    useEffect(() => {
        if (customerPhone.length === 10) {
            fetch(`/api/public/loyalty?phone=${customerPhone}&clerkUserId=${clerkId}`)
                .then(r => r.json())
                .then(d => {
                    setLoyaltyPoints(d.loyaltyPoints || 0);
                    if (d.name) setCustomerName(d.name);
                });
        }
    }, [customerPhone, clerkId]);

    // Derived Values
    const categoriesInfo = useMemo(() => {
        const cats = Array.from(new Set(items.map(it => it.category?.name || "Other")));
        const mapping: Record<string, string> = { "all": "🔥" };
        const usedIcons = new Set(["🔥"]);
        const pool = ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞", "🧇", "🍞", "🥐", "🥨", "🥯", "🥖", "🌮", "🌯", "🥙", "🧆", "🥘", "🍲", "🥣", "🥗", "🍱", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🥟", "🦪", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍩", "🍪", "🌰", "🥜", "🍯", "🥤", "🧋", "☕", "🍵", "🍼", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🧊", "🍐", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🍄"];
        
        cats.forEach(cat => {
            const lower = cat.toLowerCase();
            let icon = "";
            if (lower.includes("pizza")) icon = "🍕";
            else if (lower.includes("burger")) icon = "🍔";
            else if (lower.includes("biryani") || lower.includes("rice")) icon = "🍛";
            else if (lower.includes("chicken")) icon = "🍗";
            else if (lower.includes("drink") || lower.includes("beverage")) icon = "🥤";
            else if (lower.includes("tea")) icon = "🍵";
            else if (lower.includes("coffee")) icon = "☕";
            else if (lower.includes("chinese") || lower.includes("noodle")) icon = "🍜";
            else if (lower.includes("ice cream")) icon = "🍦";
            
            if (!icon || usedIcons.has(icon)) {
                let hash = 0;
                for (let i = 0; i < cat.length; i++) { hash = cat.charCodeAt(i) + ((hash << 5) - hash); }
                let idx = Math.abs(hash) % pool.length;
                while (usedIcons.has(pool[idx])) { idx = (idx + 1) % pool.length; }
                icon = pool[idx];
            }
            mapping[cat] = icon;
            usedIcons.add(icon);
        });
        return { names: ["all", ...cats], mapping };
    }, [items]);

    const categories = categoriesInfo.names;
    const categoryIcons = categoriesInfo.mapping;

    const filteredItems = useMemo(() => {
        return items.filter(it => {
            const matchVeg = vegOnly ? it.isVeg : true;
            const matchSearch = (it.name.toLowerCase().includes(searchQ.toLowerCase())) ||
                (it.hiName?.includes(searchQ));
            return matchVeg && matchSearch;
        });
    }, [items, vegOnly, searchQ]);

    const categorized = useMemo(() => {
        const groups: Record<string, any[]> = {};
        filteredItems.forEach(it => {
            const catName = it.category?.name || "Other";
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push(it);
        });
        return groups;
    }, [filteredItems]);

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0) + combosCart.length + variantCart.reduce((a, b) => a + b.qty, 0);
    const itemSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = items.find(i => i.id === id);
        return sum + (item ? (item.sellingPrice || item.price || 0) * qty : 0);
    }, 0);
    const comboSubtotal = combosCart.reduce((sum, c) => sum + c.price, 0);
    const variantSubtotal = variantCart.reduce((sum, vit) => sum + (vit.totalPrice * vit.qty), 0);
    const subtotal = itemSubtotal + comboSubtotal + variantSubtotal;
    // 🥇 PRIORITY LOGIC: Product GST > Default GST
    const taxEnabled = profile?.taxEnabled ?? true;
    const perProductEnabled = profile?.perProductTaxEnabled ?? false;
    const globalRate = profile?.taxRate ?? 0;

    const itemTax = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = items.find(i => i.id === id);
        if (!item || !taxEnabled) return sum;

        let rate = globalRate;
        if (perProductEnabled && item.gst !== undefined && item.gst !== null && item.gst > 0) {
            rate = item.gst;
        }

        const price = (item.sellingPrice || item.price || 0);
        return sum + Math.round((price * qty) * rate / 100);
    }, 0);

    // Also handle combos (usually combos use global tax or are tax-inclusive, but here we fallback to global)
    const comboTax = combosCart.reduce((sum, c) => {
        if (!taxEnabled) return sum;
        return sum + Math.round(c.price * globalRate / 100);
    }, 0);

    const tax = itemTax + comboTax;
    const loyaltyDisc = loyaltyOn ? 32 : 0;
    const total = subtotal + tax - loyaltyDisc;

    // Actions
    const addToCart = (id: string) => {
        const item = items.find(it => it.id === id);
        if (!item) return;

        // ✅ If item has variants OR addon groups, open selection sheet
        if ((item.variants && (item.variants as any[]).length > 0) || ((item as any).addonGroups && ((item as any).addonGroups as any[]).length > 0)) {
            setCustomizingItem(item);
            const initial: Record<string, any> = {};
            
            // Item-specific variants
            (item.variants as any[] || []).forEach((v: any) => {
                if (v.type === "radio" && v.options?.length > 0) {
                    initial[v.id] = v.options[0];
                } else if (v.type === "checkbox") {
                    initial[v.id] = [];
                }
            });

            // Global Addon Groups
            ((item as any).addonGroups as any[] || []).forEach((ag: any) => {
                initial[`ag_${ag.id}`] = [];
            });

            setSelectedVariants(initial);
            kravy.open();
            return;
        }

        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        kravy.add();
        toast.success("Added to cart", { duration: 800, position: "top-center" });
    };

    const addVariantItemToCart = () => {
        if (!customizingItem) return;

        let extra = 0;
        const selections: any[] = [];
        
        // Validation check for mandatory addon groups
        const missingMandatoryGroups: string[] = [];
        ((customizingItem as any).addonGroups as any[] || []).forEach((ag: any) => {
            if (ag.isCompulsory) {
                const selected = selectedVariants[`ag_${ag.id}`];
                if (!selected || selected.length === 0) {
                    missingMandatoryGroups.push(ag.name);
                }
            }
        });

        if (missingMandatoryGroups.length > 0) {
            toast.error(`Required: ${missingMandatoryGroups.join(", ")}`);
            return;
        }

        Object.entries(selectedVariants).forEach(([groupId, val]) => {
            if (groupId.startsWith('ag_')) {
               const agId = groupId.replace('ag_', '');
               const ag = ((customizingItem as any).addonGroups as any[])?.find(g => g.id === agId);
               if (ag && Array.isArray(val)) {
                   val.forEach((opt: any) => {
                       extra += (opt.price || 0);
                       selections.push({ group: ag.name, option: opt.name, price: opt.price });
                   });
               }
               return;
            }

            const group = (customizingItem.variants as any[])?.find((g: any) => g.id === groupId);
            if (!group) return;
            if (group.type === "radio" && val) {
                extra += (val.price || 0);
                selections.push({ group: group.name, option: (val.name || val.label), price: val.price });
            } else if (group.type === "checkbox" && Array.isArray(val)) {
                val.forEach((opt: any) => {
                    extra += (opt.price || 0);
                    selections.push({ group: group.name, option: (opt.name || opt.label), price: opt.price });
                });
            }
        });

        const newCartItem = {
            uniqueId: Date.now().toString(),
            id: customizingItem.id,
            name: customizingItem.name,
            totalPrice: (customizingItem.sellingPrice || customizingItem.price || 0) + extra,
            qty: 1,
            variants: selections,
            isVeg: customizingItem.isVeg
        };

        setVariantCart(prev => [...prev, newCartItem]);
        setCustomizingItem(null);
        kravy.success();
        toast.success("Added with customizations!");
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => {
            const newVal = (prev[id] || 0) + delta;
            if (newVal <= 0) {
                kravy.remove();
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            kravy.click();
            return { ...prev, [id]: newVal };
        });
    };

    const addComboToCart = () => {
        if (!activeCombo) return;
        const completeSelections = activeCombo.selections.map((s, idx) => {
            if (s.type === 'choice' && !comboSelections[idx]) return null;
            return s.type === 'fixed'
                ? { type: 'fixed', itemId: s.itemId, name: items.find(it => it.id === s.itemId)?.name, price: items.find(it => it.id === s.itemId)?.price || 0 }
                : { type: 'choice', itemId: comboSelections[idx], name: items.find(it => it.id === comboSelections[idx])?.name, price: items.find(it => it.id === comboSelections[idx])?.price || 0 };
        });

        if (completeSelections.some(s => s === null)) {
            toast.error("Please complete all selections");
            return;
        }

        setCombosCart(prev => [...prev, {
            id: activeCombo.id,
            name: activeCombo.name,
            price: activeCombo.price,
            selections: completeSelections
        }]);
        setActiveCombo(null);
        setComboSelections({});
        kravy.success();
        toast.success("Combo added to cart!");
    };

    const placeOrder = async () => {
        const { 
            collectCustomerName = true, 
            requireCustomerName = false, 
            collectCustomerPhone = true, 
            requireCustomerPhone = false,
            collectCustomerAddress = false,
            requireCustomerAddress = false
        } = profile || {};

        if (collectCustomerPhone && requireCustomerPhone && (!customerPhone || customerPhone.length < 10)) {
            toast.error("Valid mobile number is required");
            return;
        }

        if (collectCustomerName && requireCustomerName && !customerName.trim()) {
            toast.error("Please enter your name");
            return;
        }

        if (collectCustomerAddress && requireCustomerAddress && !customerAddress.trim()) {
            toast.error("Delivery address is required");
            return;
        }

        setOrderStatus("placing");
        try {
            const orderItems = Object.entries(cart)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => {
                    const item = items.find(i => i.id === id);
                    return {
                        itemId: id,
                        name: item?.name,
                        price: item?.sellingPrice || item?.price,
                        quantity: qty,
                        total: (item?.sellingPrice || item?.price || 0) * qty,
                        instruction: instructions[id],
                        isVeg: item?.isVeg
                    };
                });

            const variantOrderItems = variantCart.map((vit) => ({
                itemId: vit.id,
                name: vit.name,
                price: vit.totalPrice,
                quantity: vit.qty,
                total: vit.totalPrice * vit.qty,
                variants: vit.variants,
                isVeg: vit.isVeg
            }));

            const comboOrderItems = combosCart.map((combo) => ({
                itemId: combo.id,
                name: combo.name,
                price: combo.price,
                quantity: 1,
                total: combo.price,
                isCombo: true,
                selections: combo.selections
            }));

            const allOrderItems = [...orderItems, ...variantOrderItems, ...comboOrderItems];

            const res = await fetch("/api/public/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerkUserId: clerkId,
                    tableId,
                    items: allOrderItems,
                    total,
                    customerName: customerName || "Guest",
                    customerPhone: customerPhone || null,
                    customerAddress: customerAddress || null,
                    caseType: "new",
                    paymentMethod // ✅ NEW: capturing intent
                })
            });

            if (res.ok) {
                const orderData = await res.json();
                setPlacedOrderId(orderData.id);
                setLastOrderItems(allOrderItems);
                setOrderStatus("placed");
                setCart({});
                setVariantCart([]);
                setCombosCart([]);
                setShowCartSheet(false);
                kravy.payment(); // 💰 Cash register sound on order placed

                // Add to recent orders if not already there
                setRecentOrderIds(prev => {
                    if (prev.includes(orderData.id)) return prev;
                    return [orderData.id, ...prev].slice(0, 5); // Keep last 5
                });

                // Auto-save for tracking recovery
                saveOrderLocally({
                    orderId: orderData.id,
                    phone: customerPhone,
                    tableId: tableId,
                    total: total,
                    status: "PENDING",
                    clerkUserId: clerkId
                });
            } else {
                const error = await res.json();
                kravy.error();
                toast.error(error.error || "Failed to place order");
                setOrderStatus("none");
            }
        } catch (err) {
            kravy.error();
            toast.error("Failed to place order");
            setOrderStatus("none");
        }
    };

    const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setReviewImageUploading(true);
        kravy.upload();
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.secure_url) {
                setReviewImageUrl(data.secure_url);
                kravy.success();
                toast.success("Photo added successfully!");
            } else {
                kravy.error();
                toast.error("Failed to upload photo");
            }
        } catch (error) {
            kravy.error();
            toast.error("Something went wrong");
        } finally {
            setReviewImageUploading(false);
        }
    };

    const handlePostReview = async () => {
        if (!customerPhone || customerPhone.length < 10) {
            kravy.error();
            toast.error("Review ke liye phone number zaroori hai (+50 pts ke liye)");
            return;
        }

        setReviewSubmitting(true);
        try {
            const res = await fetch("/api/public/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerkUserId: clerkId,
                    rating: reviewRating,
                    comment: reviewComment,
                    customerName: customerName || "Guest",
                    customerPhone,
                    tableId,
                    imageUrl: reviewImageUrl
                })
            });

            if (res.ok) {
                kravy.review();
                toast.success("Review posted! +50 points added 👑");
                setShowReviewSheet(false);
                setReviewComment("");
                setReviewImageUrl("");
                setReviewRating(5);
                // Refresh reviews
                const reviewRes = await fetch(`/api/public/reviews?clerkUserId=${clerkId}`);
                if (reviewRes.ok) {
                    const data = await reviewRes.json();
                    setReviews(data);
                }
                // Update loyalty points locally
                setLoyaltyPoints(p => Number(p) + 50);
            } else {
                kravy.error();
                toast.error("Failed to post review");
            }
        } catch (err) {
            kravy.error();
            toast.error("Error posting review");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleRedeemReward = async (rewardId: string, pointsRequired: number) => {
        if (!customerPhone || customerPhone.length < 10) {
            toast.error("Rewards ke liye phone number zaroori hai");
            return;
        }

        if (loyaltyPoints < pointsRequired) {
            toast.error("Insufficient points");
            return;
        }

        try {
            const res = await fetch("/api/public/loyalty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: customerPhone,
                    clerkUserId: clerkId,
                    pointsToRedeem: pointsRequired
                })
            });

            if (res.ok) {
                toast.success("Reward Redeemed! Check your order or bill for details.");
                setLoyaltyPoints(prev => prev - pointsRequired);
            } else {
                const err = await res.json();
                toast.error(err.error || "Redemption failed");
            }
        } catch (err) {
            toast.error("Something went wrong");
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F4F4F4]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E23744]"></div>
        </div>
    );

    return (
        <div className="max-w-[480px] mx-auto bg-[#F4F4F4] min-h-screen relative font-sans text-[#1C1C1C]">

            {/* ── TOP NAV (Fixed Layout) ── */}
            <nav className="sticky top-0 z-[100] bg-white shadow-sm">
                <div className="pt-3 pb-2 px-4 border-b border-gray-50">
                    <div className="flex items-center gap-3 mb-4">
                        <button className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm" onClick={() => window.history.back()}>
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                        <div className="flex-1 bg-[#F5F5F5] rounded-2xl flex items-center gap-2 px-4 py-2.5 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all shadow-inner">
                            <Search size={18} className="text-[#E23744]" strokeWidth={3} />
                            <input
                                ref={searchInputRef}
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                placeholder={`Search in ${profile?.businessName || "Restaurant"}`}
                                className="bg-transparent text-[0.92rem] w-full outline-none font-[600] text-gray-800 placeholder:text-gray-400"
                            />
                        </div>
                        <button className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm text-gray-400">
                            <div className="flex flex-col gap-0.5 items-center">
                              <div className="w-1 h-1 rounded-full bg-gray-400"/>
                              <div className="w-1 h-1 rounded-full bg-gray-400"/>
                              <div className="w-1 h-1 rounded-full bg-gray-400"/>
                            </div>
                        </button>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button 
                          onClick={() => setVegOnly(!vegOnly)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[0.72rem] font-black transition-all whitespace-nowrap ${vegOnly ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            <div className="w-3.5 h-3.5 border border-gray-300 rounded-sm flex items-center justify-center bg-white">
                              <div className={`w-1.5 h-1.5 rounded-full ${vegOnly ? 'bg-green-500' : 'bg-gray-300 opacity-0'}`} />
                            </div>
                            Filters <ChevronDown size={14} />
                        </button>
                        {offers.map(offer => (
                          <div key={offer.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 text-[0.72rem] font-black whitespace-nowrap shadow-sm">
                            <div className="bg-blue-600 text-white rounded p-0.5 w-4 h-4 flex items-center justify-center"><Tag size={10} fill="currentColor" /></div>
                            Items @ {offer.discountValue}% OFF
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-[0.72rem] font-black whitespace-nowrap">
                           Fast Delivery
                        </div>
                    </div>
                </div>

                {recentOrderIds.length > 0 && (
                    <div className="flex bg-[#F0FDF4] px-4 py-2 overflow-x-auto no-scrollbar gap-2.5 border-b border-[#DCFCE7]">
                        <span className="text-[0.65rem] font-[900] text-[#166534] uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Clock size={12} /> Active:
                        </span>
                        {recentOrderIds.map(id => (
                            <button
                                key={id}
                                onClick={() => window.location.href = `/order-tracking/${id}`}
                                className="bg-white border border-[#22C55E]/30 rounded-full px-2.5 py-1 text-[0.65rem] font-[800] text-[#15803d] flex items-center gap-1 shrink-0 shadow-sm shadow-green-50"
                            >
                                Track Order #{id.slice(-4).toUpperCase()} ↗
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="flex border-b border-[#EBEBEB] overflow-x-auto no-scrollbar scrollbar-none px-2">
                    {(["menu", "reviews", "gallery", "loyalty"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { kravy.click(); setActiveTab(tab); }}
                            className={`flex-shrink-0 flex-1 py-3 text-[0.72rem] font-[800] capitalize transition-all border-b-[2.5px] min-w-[70px] ${activeTab === tab ? "text-[#E23744] border-[#E23744]" : "text-[#696969] border-transparent"}`}
                        >
                            {tab === "menu" ? "🍛 Menu" : tab === "reviews" ? "⭐ Reviews" : tab === "gallery" ? "📸 Gallery" : "🎁 Loyalty"}
                        </button>
                    ))}
                </div>
            </nav>

            {/* ── CONTENT SCREENS ── */}
            <main className="pb-32">
                <AnimatePresence mode="wait">

                    {/* MENU SCREEN */}
                    {activeTab === "menu" && (
                        <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ActiveOrderBanner tableId={tableId} clerkId={clerkId} />

                            {/* RESTAURANT HERO */}
                            <div className="bg-white mb-2">
                                <div className="relative overflow-hidden h-[180px]">
                                    <Image src={profile?.profileImageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80"} alt="Restaurant" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/45" />
                                    <div className="absolute bottom-3 left-3.5 z-10 bg-black/65 backdrop-blur-md rounded-md px-2.5 py-1.5 flex items-center gap-1.5 border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4CD964] animate-pulse" />
                                        <span className="text-[0.7rem] font-[800] text-white">Table {tableName} · Active</span>
                                    </div>
                                    {loyaltyPoints > 0 && (
                                        <div className="absolute bottom-3 right-3.5 z-10 bg-gradient-to-br from-[#D4A353] to-[#F0C060] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg">
                                            <span className="text-[0.7rem] font-[900] text-white">👑 {loyaltyPoints} pts</span>
                                        </div>
                                    )}
                                </div>
                                <div className="px-3.5 py-3">
                                    <div className="text-[1.25rem] font-[900] mb-0.5">{profile?.businessName || "Masala House"}</div>
                                    <div className="text-[0.75rem] text-[#696969] font-[600] mb-2">North Indian, Mughlai, Biryani</div>
                                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                        <div className="flex items-center gap-1 border border-[#b2dfc8] bg-[#F0FDF4] rounded-md px-2 py-1 text-[0.72rem] font-[700] text-[#22C55E]">★ 4.3 (2.1K)</div>
                                        <div className="w-[1px] h-4 bg-[#EBEBEB]" />
                                        <div className="flex items-center gap-1 border border-[#EBEBEB] rounded-md px-2 py-1 text-[0.72rem] font-[700]">⏱ 20–30 min</div>
                                        <div className="w-[1px] h-4 bg-[#EBEBEB]" />
                                        <div className="flex items-center gap-1 border border-[#EBEBEB] rounded-md px-2 py-1 text-[0.72rem] font-[700]">₹350 for two</div>
                                    </div>

                                    {/* DYNAMIC OFFERS SLIDER */}
                                    {offers.length > 0 ? (
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-4 py-1">
                                            {offers.map((offer) => (
                                                <div key={offer.id} className="flex-shrink-0 min-w-[200px] bg-gradient-to-r from-orange-50 to-white border border-orange-200 rounded-xl p-3 relative overflow-hidden group shadow-sm">
                                                    <div className="absolute top-0 right-0 w-8 h-8 bg-orange-100 rounded-full -mr-3 -mt-3 opacity-50" />
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                                                            <Tag size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[0.8rem] font-[900] text-gray-800 leading-tight">
                                                                {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                                            </div>
                                                            <div className="text-[0.6rem] font-[800] text-orange-600 uppercase tracking-wider mt-1 flex items-center gap-1">
                                                                USE: <span className="bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">{offer.code}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {offer.minOrderValue && (
                                                        <div className="mt-2 text-[0.55rem] font-bold text-gray-400 italic">
                                                            Above ₹{offer.minOrderValue}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-[#FFF6E6] border border-[#FFD980] rounded-md px-3 py-2 flex items-center gap-2 text-[0.73rem] font-[700] text-[#995500] mb-3">
                                            🏷️ Great deals arriving soon!
                                        </div>
                                    )}

                                    {/* LOYALTY MINI BAR */}
                                    <div className="bg-gradient-to-br from-[#D4A353]/10 to-[#F0C060]/5 border border-[#D4A353]/30 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 mb-2" onClick={() => { kravy.toggle(); setActiveTab("loyalty"); }}>
                                        <span className="text-[1.3rem]">👑</span>
                                        <div className="flex-1">
                                            <div className="text-[0.78rem] font-[800] text-[#7A5A00]">{loyaltyPoints} Loyalty Points</div>
                                            <div className="text-[0.65rem] text-[#696969] mt-0.5">350 more for FREE Butter Chicken!</div>
                                            <div className="h-1 bg-[#D4A353]/20 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#D4A353] to-[#F0C060]" style={{ width: `${(loyaltyPoints / 1000) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="text-[#D4A353] text-[1.1rem] font-extrabold">{loyaltyPoints}</div>
                                    </div>
                                </div>
                            </div>

                            {/* COMBOS STRIP */}
                            {combos.length > 0 && (
                                <div className="bg-white border-b border-[#EBEBEB] py-3.5 px-3.5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-[0.68rem] font-[800] uppercase tracking-wider text-[#ABABAB]">Bundle & Save ✨</div>
                                        <span className="text-[0.65rem] font-[800] text-[#8B5CF6] px-2 py-0.5 bg-[#8B5CF6]/10 rounded-full italic">Best Value</span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                        {combos.map(combo => (
                                            <div
                                                key={combo.id}
                                                className="flex-shrink-0 w-[240px] bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm relative group"
                                                onClick={() => {
                                                    setActiveCombo(combo);
                                                    setComboSelections({});
                                                }}
                                            >
                                                {/* Combo Image */}
                                                <div className="h-28 relative overflow-hidden">
                                                    {combo.imageUrl ? (
                                                        <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-indigo-200">
                                                            <Sparkles size={32} />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md rounded-lg px-2 py-1 shadow-sm">
                                                        <div className="text-[0.75rem] font-black text-indigo-600 leading-none">₹{combo.price}</div>
                                                    </div>
                                                </div>

                                                <div className="p-3">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h4 className="text-[0.88rem] font-black text-gray-800 truncate flex-1">{combo.name}</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {combo.selections.slice(0, 3).map((s, idx) => (
                                                            <div key={idx} className="bg-white/60 border border-black/5 rounded-md px-1.5 py-0.5 text-[0.55rem] font-black text-gray-500 truncate max-w-[80px]">
                                                                {s.type === 'fixed' ? items.find(it => it.id === s.itemId)?.name || "Item" : s.label}
                                                            </div>
                                                        ))}
                                                        {combo.selections.length > 3 && <div className="text-[0.6rem] font-black text-indigo-400">+{combo.selections.length - 3} more</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* REORDER STRIP */}
                            <div className="bg-white border-b border-[#EBEBEB] py-2.5 px-3.5">
                                <div className="text-[0.68rem] font-[800] uppercase tracking-wider text-[#ABABAB] mb-2">🔄 Order Again</div>
                                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                                    {items.filter(i => i.isBestseller).slice(0, 5).map(it => (
                                        <div key={it.id} className="flex-shrink-0 bg-[#F4F4F4] border border-[#EBEBEB] rounded-xl px-3 py-2.5 flex items-center gap-2" onClick={() => addToCart(it.id)}>
                                            <span className="text-[1.2rem]">{it.ico || "🍽️"}</span>
                                            <div>
                                                <div className="text-[0.75rem] font-[800]">{it.name}</div>
                                                <div className="text-[0.65rem] font-[700] text-[#696969]">₹{it.sellingPrice || it.price}</div>
                                            </div>
                                            <span className="text-[0.72rem] font-[900] text-[#E23744] ml-1">+ADD</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* GROUP ORDER BANNER */}
                            <div className="m-3.5 bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/5 border border-[#8B5CF6]/20 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                                <span className="text-[1.4rem]">👥</span>
                                <div className="flex-1">
                                    <div className="text-[0.8rem] font-[800] text-[#5B21B6]">Group Ordering</div>
                                    <div className="text-[0.65rem] text-[#696969] mt-0.5">Sab log apna apna order karein ek saath</div>
                                </div>
                                <button className="bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-[800] text-[#7C3AED]">Start →</button>
                            </div>

                            {/* LANGUAGE STRIP */}
                            <div className="bg-white border-b border-[#EBEBEB] px-3.5 py-2 flex items-center justify-between">
                                <span className="text-[0.7rem] font-[700] text-[#696969]">🌐 Menu Language</span>
                                <div className="flex gap-1.5">
                                    {(["en", "hi", "mr", "ta"] as const).map(ln => (
                                        <button
                                            key={ln}
                                            onClick={() => setActiveLang(ln)}
                                            className={`px-2.5 py-1 rounded-md text-[0.7rem] font-[800] transition-all border ${activeLang === ln ? "bg-blue-50 border-blue-500 text-blue-500" : "bg-gray-50 border-[#EBEBEB] text-[#696969]"}`}
                                        >
                                            {ln === "en" ? "English" : ln === "hi" ? "हिंदी" : ln === "mr" ? "मराठी" : "தமிழ்"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SEARCH */}
                            <div className="bg-white p-2.5 mb-2">
                                <div className="bg-[#F4F4F4] rounded-xl flex items-center gap-2 px-3.5 py-2.5 border border-transparent focus-within:border-[#E23744] focus-within:bg-white transition-all">
                                    <Search size={16} className="text-[#ABABAB]" />
                                    <input
                                        ref={searchInputRef}
                                        value={searchQ}
                                        onChange={(e) => setSearchQ(e.target.value)}
                                        placeholder="Search dishes..."
                                        className="bg-transparent text-sm w-full outline-none font-[600]"
                                    />
                                </div>
                            </div>

                            {/* VEG TOGGLE */}
                            <div className="bg-white px-3.5 py-2.5 flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        onClick={() => setVegOnly(!vegOnly)}
                                        className={`w-10 h-[22px] rounded-full relative cursor-pointer transition-colors ${vegOnly ? "bg-[#22C55E]" : "bg-[#EBEBEB]"}`}
                                    >
                                        <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-all ${vegOnly ? "left-[19px]" : "left-0.5"}`} />
                                    </div>
                                    <span className="text-[0.8rem] font-[700]">Veg Only</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[0.7rem] font-[700] text-[#696969]">
                                        <div className="w-[13px] h-[13px] border-[1.5px] border-[#22C55E] flex items-center justify-center rounded-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                                        </div> Veg
                                    </div>
                                    <div className="flex items-center gap-1 text-[0.7rem] font-[700] text-[#696969]">
                                        <div className="w-[13px] h-[13px] border-[1.5px] border-[#E23744] flex items-center justify-center rounded-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#E23744]" />
                                        </div> Non-veg
                                    </div>
                                </div>
                            </div>

                            {/* CAT TABS (STIKY) */}
                            <div className="sticky top-[93px] z-[50] bg-white border-b border-[#EBEBEB] overflow-x-auto no-scrollbar">
                                <div className="inline-flex">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { 
                                                kravy.click(); 
                                                const el = document.getElementById(`cat-${c}`);
                                                if (el) {
                                                    const offset = 140;
                                                    window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' });
                                                }
                                                setActiveCategory(c); 
                                            }}
                                            className={`px-4 py-2.5 flex items-center gap-1.5 text-[0.84rem] font-[800] capitalize whitespace-nowrap border-b-[3px] transition-all ${activeCategory === c ? "text-[#E23744] border-[#E23744] bg-red-50/30" : "text-[#696969] border-transparent opacity-60"}`}
                                        >
                                            <span className="text-base">{categoryIcons[c]}</span>
                                            {c === "all" ? "All" : c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MENU CONTENT LIST (Zomato Split Layout) */}
                            <div className="bg-white">
                                {categories.filter(c => c !== "all").map(categoryName => {
                                  const categoryItems = filteredItems.filter(it => (it.category?.name || "Other") === categoryName);
                                  if (categoryItems.length === 0) return null;
                                  
                                  return (
                                    <div key={categoryName} id={`cat-${categoryName}`} className="mb-6 pt-4">
                                      {/* Category Header */}
                                      <div className="px-4 flex items-center gap-2 mb-2">
                                        <span className="text-[1.2rem]">{categoryIcons[categoryName]}</span>
                                        <h2 className="text-[1.12rem] font-[900] text-gray-900 tracking-tight">{categoryName}</h2>
                                      </div>

                                      {categoryItems.map(item => (
                                        <div 
                                          key={item.id} 
                                          className="flex gap-5 px-4 py-8 border-b border-gray-100 last:border-0 items-start group"
                                          onClick={() => { kravy.open(); setSelectedMenuItem(item); }}
                                        >
                                          {/* Item Details (Left) */}
                                          <div className="flex-1 min-w-0">
                                              <div className={`w-[15px] h-[15px] border-[1.5px] rounded-sm flex items-center justify-center mb-1.5 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                                                  <div className={`w-[7px] h-[7px] rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                                              </div>
                                              
                                              <div className="mb-1">
                                                <h3 className="text-[1.05rem] font-[800] text-gray-800 leading-tight mb-0.5">
                                                    {activeLang === "hi" && item.hiName ? item.hiName : item.name}
                                                </h3>
                                              </div>

                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[1.05rem] font-[800] text-gray-900 leading-tight">₹{item.sellingPrice || item.price}</span>
                                                {item.price && item.sellingPrice && item.sellingPrice < item.price && (
                                                  <>
                                                    <span className="text-[0.8rem] text-gray-400 line-through font-bold">₹{item.price}</span>
                                                    <span className="text-[0.75rem] font-black text-blue-600">{Math.round(((item.price - item.sellingPrice) / item.price) * 100)}% OFF</span>
                                                  </>
                                                )}
                                              </div>

                                              <p className="text-[0.82rem] text-gray-400 font-[500] leading-relaxed line-clamp-2 mb-4 pr-2">{item.description || "A delicious treat prepared with love and fresh ingredients."}</p>
                                              
                                              {/* Badges/Tags */}
                                              <div className="flex flex-wrap gap-2 mb-4">
                                                {item.isBestseller && <span className="bg-red-50 text-red-600 text-[0.6rem] font-[800] px-2 py-0.5 rounded shadow-sm">NOT ELIGIBLE FOR COUPONS</span>}
                                                {item.isRecommended && <span className="bg-green-50 text-green-600 text-[0.6rem] font-[800] px-2 py-0.5 rounded shadow-sm">STAY SAFE</span>}
                                              </div>

                                              {/* Action Area Spacer */}
                                              <div className="h-2" />
                                          </div>

                                          {/* Item Image & ADD Button (Right) */}
                                          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                                              <div className="w-[124px] h-[124px] rounded-2xl overflow-hidden relative shadow-md border border-gray-50">
                                                  {item.imageUrl || item.image ? (
                                                      <Image src={(item.imageUrl || item.image) as string} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                                  ) : (
                                                      <div className="w-full h-full bg-gradient-to-br from-[#FFF0F1] to-[#FFF8EC] flex items-center justify-center text-5xl">{item.ico || "🥘"}</div>
                                                  )}
                                              </div>
                                              
                                              {/* Floating Add Card */}
                                              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full px-2.5">
                                                  <div className="bg-white rounded-xl shadow-xl shadow-red-100 border border-red-50 overflow-hidden">
                                                    {cart[item.id] ? (
                                                        <div className="text-red-500 flex items-center justify-between w-full h-[38px] px-1 font-black">
                                                            <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }} className="w-9 h-full flex items-center justify-center text-xl hover:bg-red-50 transition-colors">−</button>
                                                            <span className="text-[0.95rem]">{cart[item.id]}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }} className="w-9 h-full flex items-center justify-center text-xl hover:bg-red-50 transition-colors">+</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); addToCart(item.id); }}
                                                            className="text-[#E23744] rounded-xl py-2 text-[0.95rem] font-[800] tracking-wider transition-all w-full flex items-center justify-center gap-2 hover:bg-red-50"
                                                        >
                                                            ADD <Plus size={14} strokeWidth={3} />
                                                        </button>
                                                    )}
                                                  </div>
                                                  <div className="text-[0.55rem] text-center text-gray-400 mt-1 font-black uppercase tracking-widest">customisable</div>
                                              </div>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      <div className="h-1.5 bg-gray-50 mt-4" />
                                    </div>
                                  );
                                })}
                            </div>

                        </motion.div>
                    )}

                    {/* REVIEWS SCREEN */}
                    {activeTab === "reviews" && (() => {
                        const totalReviews = reviews.length;
                        const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) : 4.3;
                        const starCounts = [5, 4, 3, 2, 1].map(s => reviews.filter(r => r.rating === s).length);
                        const filteredReviews = reviewFilter ? reviews.filter(r => r.rating === reviewFilter) : reviews;
                        return (
                        <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#F4F4F4] min-h-screen">

                            {/* TRUST BANNER */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} className="text-white" fill="currentColor" />
                                </div>
                                <div>
                                    <div className="text-white text-[0.78rem] font-[900]">100% Verified QR Reviews</div>
                                    <div className="text-emerald-100 text-[0.62rem] font-[600] mt-0.5">Only from walk-in customers who scanned the table QR menu</div>
                                </div>
                            </div>

                            {/* RATING HERO */}
                            <div className="bg-white px-5 pt-5 pb-4 mb-2">
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="font-[Syne] text-[4rem] font-[900] text-[#1C1C1C] leading-none">{avgRating.toFixed(1)}</div>
                                        <div className="flex justify-center gap-0.5 mt-1">
                                            {[1,2,3,4,5].map(s => (
                                                <span key={s} className={`text-[1.1rem] ${s <= Math.round(avgRating) ? 'text-[#D4A353]' : 'text-gray-200'}`}>★</span>
                                            ))}
                                        </div>
                                        <div className="text-[0.65rem] text-[#ABABAB] font-[700] mt-1">{totalReviews} reviews</div>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        {[5,4,3,2,1].map((star, i) => {
                                            const cnt = starCounts[i];
                                            const pct = totalReviews > 0 ? (cnt / totalReviews) * 100 : (star === 5 ? 58 : star === 4 ? 25 : 10);
                                            return (
                                                <button key={star} onClick={() => setReviewFilter(reviewFilter === star ? null : star)} className="flex items-center gap-2 w-full group">
                                                    <span className="text-[0.68rem] font-[800] text-[#696969] w-2.5 shrink-0">{star}</span>
                                                    <span className="text-[#D4A353] text-[0.6rem]">★</span>
                                                    <div className="flex-1 h-1.5 bg-[#F4F4F4] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                                            className={`h-full rounded-full ${reviewFilter === star ? 'bg-[#E23744]' : 'bg-[#D4A353]'}`}
                                                        />
                                                    </div>
                                                    <span className="text-[0.6rem] font-[700] text-[#ABABAB] w-3 text-right shrink-0">{cnt}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {reviewFilter && (
                                    <motion.button
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setReviewFilter(null)}
                                        className="mt-3 w-full bg-red-50 border border-red-100 rounded-xl py-2 text-[0.72rem] font-[900] text-[#E23744] flex items-center justify-center gap-1.5"
                                    >
                                        <X size={12} /> Showing {reviewFilter}★ only — Clear Filter
                                    </motion.button>
                                )}
                            </div>

                            {/* WRITE REVIEW CTA */}
                            <div className="px-3.5 mb-2">
                                <motion.div
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => { kravy.open(); setShowReviewSheet(true); }}
                                    className="bg-white rounded-2xl p-4 border border-[#EBEBEB] shadow-sm flex items-center gap-3 cursor-pointer"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-amber-100">
                                        <MessageSquare size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[0.85rem] font-[900] text-gray-800">Share Your Experience</div>
                                        <div className="text-[0.65rem] text-[#ABABAB] font-[600] mt-0.5">Earn +50 loyalty points 👑 instantly</div>
                                    </div>
                                    <div className="bg-[#E23744] text-white text-[0.65rem] font-[900] px-2.5 py-1.5 rounded-lg shrink-0">Write ✍️</div>
                                </motion.div>
                            </div>

                            {/* REVIEWS LIST */}
                            <div className="px-3.5 space-y-3 pb-6">
                                {filteredReviews.length === 0 && (
                                    <div className="text-center py-10 text-[#ABABAB] text-[0.8rem] font-bold">No {reviewFilter}★ reviews yet.</div>
                                )}
                                {filteredReviews.map((r, idx) => {
                                    const displayName = r.customerName && r.customerName !== "Guest" ? r.customerName : getIndianName(r.id);
                                    const isGuest = !r.customerName || r.customerName === "Guest";
                                    const isHelpful = helpfulReviews[r.id];
                                    return (
                                        <motion.div
                                            key={r.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="bg-white rounded-2xl border border-[#F0F0F0] shadow-sm overflow-hidden"
                                        >
                                            <div className="p-4">
                                                {/* HEADER */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="relative shrink-0">
                                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(displayName)} overflow-hidden flex items-center justify-center shadow-md`}>
                                                            <Image src={getAvatarUrl(r.customerName, r.id)} alt={displayName} fill className="object-cover" />
                                                            <span className="text-white font-black text-base absolute">{displayName[0]?.toUpperCase()}</span>
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-50">
                                                            <CheckCircle2 size={11} className="text-emerald-500" fill="currentColor" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-[900] text-[0.88rem] text-gray-900 truncate">{displayName}</div>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span className="text-[0.58rem] font-[900] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                                <CheckCircle2 size={8} className="text-emerald-500" /> Verified QR Customer
                                                            </span>
                                                            {isGuest && (
                                                                <span className="text-[0.58rem] font-[800] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">✨ Guest</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className="flex gap-0.5 justify-end mb-0.5">
                                                            {[1,2,3,4,5].map(s => (
                                                                <span key={s} className={`text-[0.7rem] ${s <= r.rating ? 'text-[#D4A353]' : 'text-gray-200'}`}>★</span>
                                                            ))}
                                                        </div>
                                                        <div className="text-[0.6rem] text-[#ABABAB] font-[700]">
                                                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* REVIEW TEXT */}
                                                {r.comment && (
                                                    <div className="relative mb-3">
                                                        <span className="absolute -left-1 -top-1 text-4xl text-gray-100 font-serif leading-none select-none">“</span>
                                                        <p className="text-[0.82rem] text-gray-600 leading-relaxed font-[600] pl-4">{r.comment}</p>
                                                    </div>
                                                )}

                                                {/* REVIEW IMAGE */}
                                                {r.imageUrl && (
                                                    <div className="w-full h-36 relative rounded-xl overflow-hidden border border-gray-100 mb-3">
                                                        <Image src={r.imageUrl} alt="Review photo" fill className="object-cover" />
                                                        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full">📸 Customer Photo</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* FOOTER — HELPFUL */}
                                            <div className="border-t border-gray-50 px-4 py-2.5 flex items-center justify-between">
                                                <span className="text-[0.62rem] text-[#ABABAB] font-[700] italic">Was this review helpful?</span>
                                                <button
                                                    onClick={() => setHelpfulReviews(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                                                    className={`flex items-center gap-1.5 text-[0.65rem] font-[800] px-2.5 py-1 rounded-full border transition-all ${
                                                        isHelpful
                                                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-500'
                                                    }`}
                                                >
                                                    👍 {isHelpful ? 'Helpful!' : 'Helpful'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                        );
                    })()}


                    {/* GALLERY SCREEN */}
                    {activeTab === "gallery" && (
                        <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#F4F4F4] min-h-screen">

                            {/* Hero Banner */}
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-5 py-6 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                                <div className="relative z-10">
                                    <div className="text-white font-black text-lg">📸 Restaurant Gallery</div>
                                    <div className="text-violet-200 text-[0.72rem] font-[600] mt-1">Real photos from our kitchen &amp; ambience</div>
                                    <div className="flex gap-2 mt-3">
                                        <span className="bg-white/20 text-white text-[0.6rem] font-black px-2.5 py-1 rounded-full">{galleryImages.length} Photos</span>
                                        <span className="bg-white/20 text-white text-[0.6rem] font-black px-2.5 py-1 rounded-full">✅ Authentic</span>
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            {galleryImages.length > 0 && (
                                <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
                                    {(["all", "food", "interior", "promo", "other"] as const).map(cat => {
                                        const count = cat === "all" ? galleryImages.length : galleryImages.filter(i => i.category === cat).length;
                                        if (count === 0 && cat !== "all") return null;
                                        const labels: Record<string, string> = { all: "🌟 All", food: "🍛 Food", interior: "🪑 Interior", promo: "🎉 Offers", other: "📦 Other" };
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setGalleryFilter(cat)}
                                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[0.7rem] font-black border transition-all ${galleryFilter === cat ? "bg-violet-600 text-white border-violet-600 shadow-md" : "bg-white text-gray-500 border-gray-200"}`}
                                            >
                                                {labels[cat]} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Images Grid */}
                            <div className="px-4 pb-8">
                                {galleryImages.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="text-5xl mb-4">📷</div>
                                        <p className="text-sm font-bold text-gray-500">Gallery coming soon!</p>
                                        <p className="text-xs text-gray-400 mt-1">Restaurant is uploading photos</p>
                                    </div>
                                ) : (
                                    <div className="columns-2 gap-3">
                                        {(galleryFilter === "all" ? galleryImages : galleryImages.filter(i => i.category === galleryFilter)).map((img, idx) => (
                                            <motion.div
                                                key={img.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-white shadow-sm cursor-pointer group"
                                                onClick={() => setGalleryLightbox(img)}
                                            >
                                                <div className="relative w-full" style={{ paddingTop: idx % 3 === 0 ? "130%" : "80%" }}>
                                                    <Image src={img.imageUrl} alt={img.caption || img.category} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className={`absolute top-2 left-2 text-[0.55rem] font-black px-1.5 py-0.5 rounded-full backdrop-blur-sm ${img.category === "food" ? "bg-orange-500/80 text-white" : img.category === "interior" ? "bg-blue-500/80 text-white" : img.category === "promo" ? "bg-purple-500/80 text-white" : "bg-gray-600/70 text-white"}`}>
                                                        {img.category === "food" ? "🍛" : img.category === "interior" ? "🪑" : img.category === "promo" ? "🎉" : "📦"}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-sm shadow-lg">🔍</div>
                                                    </div>
                                                </div>
                                                {img.caption && (
                                                    <div className="px-3 py-2">
                                                        <p className="text-[0.68rem] font-[700] text-gray-600 leading-snug">{img.caption}</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lightbox */}
                            <AnimatePresence>
                                {galleryLightbox && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setGalleryLightbox(null)}
                                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0.8 }}
                                            onClick={e => e.stopPropagation()}
                                            className="relative max-w-sm w-full"
                                        >
                                            <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: "90%" }}>
                                                <Image src={galleryLightbox.imageUrl} alt={galleryLightbox.caption || ""} fill className="object-contain" />
                                            </div>
                                            {galleryLightbox.caption && (
                                                <div className="text-white text-center text-sm font-bold mt-3 px-4">{galleryLightbox.caption}</div>
                                            )}
                                            <button
                                                onClick={() => setGalleryLightbox(null)}
                                                className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xl text-gray-700 font-black text-lg"
                                            >
                                                ✕
                                            </button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* LOYALTY SCREEN */}
                    {activeTab === "loyalty" && (
                        <motion.div key="loyalty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#F4F4F4] min-h-screen">
                            <div className="bg-gradient-to-br from-[#1a0a00] to-[#2d1500] p-7 text-center relative overflow-hidden mb-2">
                                <div className="relative z-10">
                                    <span className="text-3xl mb-2.5 block">👑</span>
                                    <div className="font-[Syne] text-2xl font-[800] text-[#F0EAD6] mb-1">Gold Member</div>
                                    <div className="text-[0.8rem] text-[#F0EAD6]/55 mb-4 px-10 leading-relaxed">Masala House Rewards - Earn points on every order!</div>
                                    <div className="inline-flex items-baseline gap-1 mt-2">
                                        <span className="font-[Syne] text-5xl font-[800] bg-gradient-to-br from-[#F0C060] to-[#D4A353] bg-clip-text text-transparent">{loyaltyPoints}</span>
                                        <span className="text-[0.85rem] font-[800] text-[#D4A353]">pts</span>
                                    </div>
                                    <div className="mt-6">
                                        <div className="flex justify-between text-[0.7rem] text-[#F0EAD6]/50 mb-1.5 font-bold">
                                            <span>Gold (500 pts)</span>
                                            <span>Platinum (1000 pts)</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#D4A353] to-[#F0C060] transition-all duration-1000" style={{ width: `${(loyaltyPoints / 1000) * 100}%` }} />
                                        </div>
                                        <div className="text-[0.7rem] text-[#F0EAD6]/50 mt-2">350 pts aur — Platinum Member ban jao! 🚀</div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,163,83,0.15),transparent)]" />
                            </div>

                            <div className="grid grid-cols-3 gap-2 px-3.5 mb-2">
                                <div className="bg-white rounded-xl p-3 text-center border border-[#EBEBEB]">
                                    <div className="font-[Syne] text-lg font-[800]">{loyaltyPoints}</div>
                                    <div className="text-[0.6rem] font-[700] text-[#ABABAB] uppercase">Total Points</div>
                                </div>
                                <div className="bg-white rounded-xl p-3 text-center border border-[#EBEBEB]">
                                    <div className="font-[Syne] text-lg font-[800]">12</div>
                                    <div className="text-[0.6rem] font-[700] text-[#ABABAB] uppercase">Visits</div>
                                </div>
                                <div className="bg-white rounded-xl p-3 text-center border border-[#EBEBEB]">
                                    <div className="font-[Syne] text-lg font-[800]">₹4.2K</div>
                                    <div className="text-[0.6rem] font-[700] text-[#ABABAB] uppercase">Total Spent</div>
                                </div>
                            </div>

                            <div className="bg-white p-4 mb-2">
                                <div className="font-[Syne] text-[0.9rem] font-[800] mb-3.5 flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-[#3B82F6]" /> Active/Recent Orders
                                    </div>
                                    <button
                                        onClick={() => window.location.href = `/track?clerkUserId=${clerkId}`}
                                        className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md"
                                    >
                                        Find All 🔍
                                    </button>
                                </div>
                                {recentOrderIds.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentOrderIds.map(id => (
                                            <div key={id} onClick={() => window.location.href = `/order-tracking/${id}`} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 flex items-center justify-between active:scale-95 transition-all cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-[#EBEBEB] flex items-center justify-center text-xl">🍛</div>
                                                    <div>
                                                        <div className="text-[0.8rem] font-[900]">Order #{id.slice(-6).toUpperCase()}</div>
                                                        <div className="text-[0.65rem] text-[#696969] font-[700]">Table {tableName} · View Live Tracking ↗</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-[#ABABAB]" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-[#ABABAB] text-[0.75rem] font-bold">No recent orders found on this device.</div>
                                )}
                            </div>

                            <div className="bg-white p-4 mb-2">
                                <div className="font-[Syne] text-[0.9rem] font-[800] mb-3.5 px-0.5">🎁 Rewards Redeem Karo</div>
                                <div className="space-y-3.5">
                                    {rewards.length > 0 ? (
                                        rewards.map((rew) => (
                                            <div key={rew.id} className="flex items-center gap-3 py-3 border-b border-[#F7F7F7] last:border-0 hover:bg-gray-50/50 transition-all rounded-lg px-1">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${loyaltyPoints >= rew.pointsRequired ? "bg-amber-50" : "bg-gray-100 opacity-60"}`}>
                                                    🎁
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[0.7rem] text-[#696969] mt-0.5">{rew.description}</div>
                                                    <div className="text-[0.7rem] font-[800] text-amber-600 mt-1 flex items-center gap-1">
                                                        <Star size={12} fill="currentColor" /> {rew.pointsRequired} pts required
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRedeemReward(rew.id, rew.pointsRequired)}
                                                    className={`px-4 py-2 rounded-lg text-[0.72rem] font-[900] shadow-sm transition-all ${loyaltyPoints >= rew.pointsRequired
                                                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-100 active:scale-95"
                                                        : "bg-gray-100 text-gray-400 border border-gray-200"
                                                        }`}
                                                    disabled={loyaltyPoints < rew.pointsRequired}
                                                >
                                                    {loyaltyPoints >= rew.pointsRequired ? "Redeem" : "Locked"}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-[#ABABAB] text-[0.75rem] font-bold">Stay tuned! More rewards coming soon.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
            
            {/* ── FLOATING CATEGORY BUTTON ── */}
            <AnimatePresence>
                {activeTab === "menu" && !showCartSheet && !showCategorySheet && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            y: cartCount > 0 ? -110 : 0 
                        }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        onClick={() => { kravy.open(); setShowCategorySheet(true); }}
                        className="fixed bottom-8 right-5 z-[105] bg-[#2D2D32]/95 backdrop-blur-md text-white rounded-full px-5 py-3 flex items-center gap-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.4)] active:scale-90 border border-white/10"
                    >
                        <UtensilsCrossed size={18} className="text-white fill-white/10" />
                        <span className="font-black text-[0.85rem] uppercase tracking-wider">Menu</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── CATEGORY SELECTION SHEET ── */}
            <AnimatePresence>
                {showCategorySheet && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCategorySheet(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[210]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[2.5rem] z-[211] p-6 pb-12 shadow-2xl"
                        >
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="text-xl font-black font-[Syne]">Browse Menu</h3>
                                <button onClick={() => setShowCategorySheet(false)} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">✕</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto no-scrollbar px-1">
                                {Object.keys(categorized).map((catName) => (
                                    <button
                                        key={catName}
                                        onClick={() => {
                                            setShowCategorySheet(false);
                                            const el = document.getElementById(`cat-${catName}`);
                                            if (el) {
                                                const offset = 140;
                                                window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' });
                                            }
                                        }}
                                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-all group bg-white border border-transparent active:border-red-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                                                {categoryIcons[catName]}
                                            </div>
                                            <span className="font-[Syne] font-[800] text-[1.1rem] text-gray-800 tracking-tight">{catName}</span>
                                        </div>
                                        <div className="bg-gray-50 px-3 py-1 rounded-lg text-gray-400 font-black text-xs">
                                            {categorized[catName].length} items
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── STICKY CART BAR (Zomato Style) ── */}
            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[110] px-4 pt-2 pb-6 transition-transform duration-500 ease-in-out ${cartCount > 0 && !showCartSheet ? "translate-y-0" : "translate-y-full"}`}>
                
                {/* Coupon Hint */}
                <div className="bg-[#E8F3FF] border border-blue-100 rounded-t-xl px-4 py-2 flex items-center gap-2 mb-[-5px] relative z-0">
                  <div className="bg-blue-600 text-white rounded p-0.5"><Tag size={12} fill="currentColor"/></div>
                  <span className="text-[0.72rem] font-black text-blue-700">You have unlocked 60% OFF up to ₹120</span>
                </div>

                <div onClick={() => { kravy.open(); setShowCartSheet(true); }} className="bg-[#E23744] text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl active:scale-95 transition-all cursor-pointer relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                           {/* Show thumb of first 2 items */}
                           {Object.keys(cart).slice(0, 2).map((id, i) => {
                             const it = items.find(x => x.id === id);
                             return (
                               <div key={id} className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-white">
                                 <img src={it?.imageUrl || it?.image || ""} className="w-full h-full object-cover" />
                               </div>
                             )
                           })}
                        </div>
                        <div>
                          <div className="text-[0.95rem] font-black leading-none mb-0.5">{cartCount} items added</div>
                          <div className="text-[0.65rem] font-bold text-white/70 uppercase tracking-wider">From {profile?.businessName}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                        <span className="text-[0.92rem] font-black">View cart</span>
                        <ChevronRight size={18} strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* ── ORDER SHEET (CART) ── */}
            <AnimatePresence mode="wait">
                {showCartSheet && (
                    <>
                        <motion.div
                            key="cart-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { kravy.close(); setShowCartSheet(false); }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                        />
                        <motion.div
                            key="cart-sheet"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl z-[201] max-h-[88vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl"
                        >
                            <div className="w-10 h-1 bg-[#EBEBEB] rounded-full mx-auto mt-3" />
                            <div className="px-4 py-3.5 border-b border-[#EBEBEB] flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="text-lg font-[900]">🛒 Your Order — T-{tableName}</h3>
                                <button onClick={() => { kravy.close(); setShowCartSheet(false); }} className="w-7 h-7 bg-[#F4F4F4] rounded-lg flex items-center justify-center text-lg">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4">
                                {/* Combos List */}
                                {combosCart.map((combo, cIdx) => (
                                    <div key={`combo-${cIdx}`} className="py-4 border-b border-[#F7F7F7] bg-indigo-50/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={16} className="text-indigo-500" />
                                                <div className="font-[800] text-[0.88rem] text-indigo-700">{combo.name}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newCart = [...combosCart];
                                                    newCart.splice(cIdx, 1);
                                                    setCombosCart(newCart);
                                                }}
                                                className="text-red-500 text-[0.65rem] font-black uppercase tracking-widest"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="space-y-1.5 pl-6">
                                            {combo.selections.map((s: any, sIdx: number) => (
                                                <div key={sIdx} className="text-[0.7rem] text-[#64748B] font-bold flex items-center justify-between italic">
                                                    <span>• {s.name}</span>
                                                    <span className="text-[0.6rem]">Included</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-right mt-3 text-[0.84rem] font-black text-indigo-600">₹{combo.price}</div>
                                    </div>
                                ))}

                                {/* Variant Items List */}
                                {variantCart.map((vit, vIdx) => (
                                    <div key={vit.uniqueId} className="py-4 border-b border-[#F7F7F7] space-y-3">
                                        <div className="flex items-start gap-2.5">
                                            <div className={`mt-1 w-3.5 h-3.5 border-[1.5px] rounded-sm flex items-center justify-center ${vit.isVeg ? "border-[#22C55E]" : "border-[#E23744]"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${vit.isVeg ? "bg-[#22C55E]" : "bg-[#E23744]"}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-[700] text-[0.84rem]">{vit.name}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {vit.variants.map((v: any, idx: number) => (
                                                        <span key={idx} className="text-[0.6rem] font-black text-indigo-500 uppercase italic bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                            {v.option}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center bg-[#E23744] text-white rounded-lg h-7 gap-3 px-1.5 shadow-sm">
                                                <button onClick={() => {
                                                    const newCart = [...variantCart];
                                                    if (vit.qty > 1) { newCart[vIdx].qty -= 1; } 
                                                    else { newCart.splice(vIdx, 1); }
                                                    setVariantCart(newCart);
                                                }} className="text-lg font-bold">−</button>
                                                <span className="text-[0.8rem] font-black">{vit.qty}</span>
                                                <button onClick={() => {
                                                    const newCart = [...variantCart];
                                                    newCart[vIdx].qty += 1;
                                                    setVariantCart(newCart);
                                                }} className="text-lg font-bold">+</button>
                                            </div>
                                            <div className="text-[0.84rem] font-[800] min-w-[50px] text-right">₹{vit.totalPrice * vit.qty}</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Item List with Instructions */}
                                {Object.entries(cart).map(([id, qty]) => {
                                    const item = items.find(i => i.id === id);
                                    if (!item) return null;
                                    return (
                                        <div key={id} className="py-4 border-b border-[#F7F7F7] space-y-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-3.5 h-3.5 border-[1.5px] rounded-sm flex items-center justify-center ${item.isVeg ? "border-[#22C55E]" : "border-[#E23744]"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-[#22C55E]" : "bg-[#E23744]"}`} />
                                                </div>
                                                <div className="flex-1 font-[700] text-[0.84rem]">{item.name}</div>
                                                <div className="flex items-center bg-[#E23744] text-white rounded-lg h-7 gap-3 px-1.5 overflow-hidden">
                                                    <button onClick={() => updateQty(id, -1)} className="text-lg font-bold">−</button>
                                                    <span className="text-[0.8rem] font-black">{qty}</span>
                                                    <button onClick={() => updateQty(id, 1)} className="text-lg font-bold">+</button>
                                                </div>
                                                <div className="text-[0.84rem] font-[800] min-w-[50px] text-right">₹{(item.sellingPrice || item.price || 0) * qty}</div>
                                            </div>
                                            <input
                                                key={`instruction-${id}`}
                                                value={instructions[id] || ""}
                                                onChange={(e) => setInstructions(prev => ({ ...prev, [id]: e.target.value }))}
                                                placeholder="Instructions? (e.g. No onion)"
                                                autoComplete="off"
                                                className="w-full bg-[#F4F4F4] border-none rounded-lg px-3 py-2 text-[0.72rem] font-[600] outline-none"
                                            />
                                        </div>
                                    );
                                })}

                                {/* Loyalty Redeem */}
                                <div className="bg-[#D4A353]/10 border border-[#D4A353]/25 rounded-xl m-4 p-3 flex items-center justify-between">
                                    <div className="text-[0.78rem] font-[700] text-[#7A5A00]">👑 {loyaltyPoints} pts — ₹32.50 discount unlock?</div>
                                    <div className={`w-[38px] h-[21px] rounded-full relative cursor-pointer transition-colors ${loyaltyOn ? "bg-[#D4A353]" : "bg-[#EBEBEB]"}`} onClick={() => { kravy.toggle(); setLoyaltyOn(!loyaltyOn); }}>
                                        <div className={`absolute top-[3px] w-[15px] h-[15px] bg-white rounded-full shadow-md transition-all ${loyaltyOn ? "left-[20px]" : "left-[3px]"}`} />
                                    </div>
                                </div>

                                {/* Active Coupons Section */}
                                {offers.length > 0 && (
                                    <div className="p-4 bg-white border-t border-[#F7F7F7]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag size={16} className="text-[#E23744]" />
                                            <span className="text-[0.68rem] font-black uppercase tracking-widest text-[#ABABAB]">Available Coupons</span>
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                            {offers.map(offer => {
                                                const isDisabled = subtotal < (offer.minOrderValue || 0);
                                                return (
                                                    <div
                                                        key={offer.id}
                                                        className={`flex-shrink-0 px-4 py-3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 min-w-[130px] transition-all ${isDisabled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-red-50/30 border-[#E23744]/30'}`}
                                                    >
                                                        <div className={`text-[0.78rem] font-black uppercase tracking-tighter ${isDisabled ? 'text-gray-400' : 'text-[#E23744]'}`}>
                                                            {offer.code || "OFFER"}
                                                        </div>
                                                        <div className="text-[0.6rem] font-bold text-gray-600">
                                                            {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                                        </div>
                                                        {isDisabled && (
                                                            <div className="text-[0.55rem] font-black text-gray-400 italic">Add ₹{(offer.minOrderValue || 0) - subtotal} more</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Checkout Form (Dynamic via Profile Settings) */}
                                <div className="px-4 space-y-3.5 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[0.78rem] font-[900] uppercase tracking-wider">Customer Details</div>
                                        <span className="text-[10px] text-gray-400 font-bold">* Indicates Required</span>
                                    </div>
                                    <div className="space-y-3">
                                        {(profile?.collectCustomerName ?? true) && (
                                            <div className="relative">
                                                <input
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    placeholder={`Your Name${profile?.requireCustomerName ? ' *' : ' (Optional)'}`}
                                                    className="w-full bg-[#F4F4F4] border border-[#EBEBEB] rounded-xl px-4 py-3.5 text-sm font-bold outline-none border-none shadow-sm"
                                                />
                                                <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                            </div>
                                        )}
                                        
                                        {(profile?.collectCustomerPhone ?? true) && (
                                            <div className="relative">
                                                <input
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                    placeholder={`Mobile Number${profile?.requireCustomerPhone ? ' *' : ' (Optional)'}`}
                                                    type="tel"
                                                    className="w-full bg-[#F4F4F4] border border-[#EBEBEB] rounded-xl px-4 py-3.5 text-sm font-bold outline-none border-none shadow-sm"
                                                />
                                                <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                            </div>
                                        )}

                                        {profile?.collectCustomerAddress && (
                                            <div className="relative">
                                                <textarea
                                                    value={customerAddress}
                                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                                    placeholder={`Complete Address${profile?.requireCustomerAddress ? ' *' : ' (Optional)'}`}
                                                    rows={2}
                                                    className="w-full bg-[#F4F4F4] border border-[#EBEBEB] rounded-xl px-4 py-3.5 text-sm font-bold outline-none border-none shadow-sm resize-none"
                                                />
                                                <MapPin size={16} className="absolute right-4 top-4 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="px-4 py-3.5 border-t-8 border-[#F4F4F4] space-y-1.5">
                                    <div className="text-[0.78rem] font-[900] uppercase tracking-wider mb-2">Order Summary</div>
                                    <div className="flex justify-between text-[0.8rem] text-[#696969] font-bold"><span>Subtotal</span><span>₹{subtotal}</span></div>
                                    {taxEnabled && tax > 0 && (
                                        <div className="flex justify-between text-[0.8rem] text-[#696969] font-bold">
                                            <span>GST ({globalRate}%)</span><span>₹{tax}</span>
                                        </div>
                                    )}
                                    {loyaltyDisc > 0 && <div className="flex justify-between text-[0.8rem] text-[#D4A353] font-bold"><span>👑 Loyalty Discount</span><span>−₹{loyaltyDisc}</span></div>}
                                    <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-dashed border-[#EBEBEB]">
                                        <span className="text-[0.9rem] font-black italic">To Pay</span>
                                        <span className="text-xl font-black text-[#E23744] italic tracking-tighter">₹{total}</span>
                                    </div>
                                </div>

                                {/* Payment grid */}
                                <div className="px-4 py-3.5 bg-white space-y-3">
                                    <div className="text-[0.78rem] font-[900] uppercase tracking-wider">Payment Method</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["UPI / QR", "Cash", "Card"].map((opt) => (
                                            <div 
                                                key={opt} 
                                                onClick={() => { kravy.click(); setPaymentMethod(opt); }} 
                                                className={`border-[1.5px] rounded-xl p-2 text-center cursor-pointer transition-all ${paymentMethod === opt ? "border-[#E23744] bg-red-50" : "border-[#EBEBEB]"}`}
                                            >
                                                <div className="text-xl mb-1">{opt === "UPI / QR" ? "📱" : opt === "Cash" ? "💵" : "💳"}</div>
                                                <div className={`text-[0.62rem] font-[800] upper ${paymentMethod === opt ? "text-[#E23744]" : "text-[#696969]"}`}>{opt}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* STICKY BOTTOM BUTTON */}
                            <div className="p-4.5 pb-8 bg-white border-t border-[#F4F4F4] z-50">
                                <button
                                    onClick={placeOrder}
                                    disabled={orderStatus === "placing"}
                                    className="w-full bg-[#E23744] text-white rounded-[14px] p-4.5 font-black text-[0.95rem] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                                >
                                    {orderStatus === "placing" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Place Order <span className="opacity-80">₹{total}</span></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── SUCCESS SCREEN ── */}
            <AnimatePresence>
                {orderStatus === "placed" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white z-[300] flex flex-col p-6 overflow-y-auto no-scrollbar">
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }} className="text-[4rem] mb-2">🎉</motion.div>
                            <h2 className="text-[1.3rem] font-[900] mb-1 tracking-tight">Order Placed Successfully!</h2>
                            <p className="text-[0.78rem] text-[#696969] leading-relaxed mb-6 max-w-[280px] mx-auto">Kitchen mein order pahunch gaya hai.<br />Jaldi ready ho jaayega.</p>

                            {/* Ordered Items Summary */}
                            <div className="w-full bg-[#f9f9f9] rounded-2xl p-4 mb-6 border border-[#eee] text-left">
                                <p className="text-[0.65rem] font-bold text-[#999] uppercase tracking-widest mb-2">Aapne Mangwaya:</p>
                                <div className="space-y-2">
                                    {lastOrderItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span className="text-[0.8rem] font-bold text-[#333]">{item.name} × {item.quantity}</span>
                                            <span className="text-[0.8rem] text-[#666]">₹{item.total || (item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#D4A353]/10 border border-[#D4A353]/30 rounded-xl px-5 py-2.5 flex items-center justify-between w-full mb-8">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">👑</span>
                                    <span className="text-[0.75rem] font-[700] text-[#7A5A00]">Loyalty points earned!</span>
                                </div>
                                <span className="font-[Syne] text-[1.1rem] font-[800] text-[#D4A353]">+{Math.floor(total / 10)} pts</span>
                            </div>

                            <div className="flex w-full mb-8 gap-1">
                                {[
                                    { ico: "✅", lbl: "Received", done: true },
                                    { ico: "👨🍳", lbl: "Preparing", done: false },
                                    { ico: "🔥", lbl: "Cooking", done: false },
                                    { ico: "🍽️", lbl: "Ready!", done: false }
                                ].map((step, i) => (
                                    <div key={i} className="flex-1 text-center relative">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mx-auto mb-1.5 relative z-10 border transition-all ${step.done ? "bg-[#22C55E] border-transparent text-white" : "bg-[#F4F4F4] border-[#EBEBEB] text-[#ABABAB]"}`}>
                                            {step.ico}
                                        </div>
                                        <div className={`text-[0.55rem] font-[800] ${step.done ? "text-[#22C55E]" : "text-[#ABABAB]"}`}>{step.lbl}</div>
                                        {i < 3 && <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-1 transition-all ${step.done ? "bg-[#22C55E]" : "bg-[#EBEBEB]"}`} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pb-4">
                            <button
                                onClick={() => window.location.href = `/order-tracking/${placedOrderId}`}
                                className="w-full bg-[#3B82F6] text-white rounded-[14px] py-4 font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <History size={20} />
                                Live Status Track Karein
                            </button>
                            <button
                                onClick={() => setOrderStatus("none")}
                                className="w-full border-2 border-[#E23744] text-[#E23744] rounded-[14px] py-4 font-black text-sm uppercase tracking-widest active:scale-95 transition-all text-center"
                            >
                                + Add More Items
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* REVIEW SHEET (Modal) */}
            <AnimatePresence>
                {showReviewSheet && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { if (!reviewSubmitting) { kravy.close(); setShowReviewSheet(false); } }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                        />
                        <motion.div
                            key="review-sheet"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[40px] z-[201] max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.15)]"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2" />

                            {/* Premium Header */}
                            <div className="px-8 pt-4 pb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-[Syne] font-[900] text-gray-900 tracking-tight leading-tight">Maza Aaya? ✨</h2>
                                        <p className="text-[11px] font-[800] text-amber-600 uppercase tracking-[0.15em] mt-1 flex items-center gap-1.5">
                                            <Award size={14} className="animate-pulse" /> Unlock Luxury Rewards
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { kravy.close(); setShowReviewSheet(false); }}
                                        className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 transition-colors"
                                    >
                                        <span className="text-xl">✕</span>
                                    </button>
                                </div>
                            </div>

                            <div className="px-8 space-y-8 pb-10">
                                {/* Interactive Star Rating */}
                                <div className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100/80">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center mb-4">Aapka Anubhav</div>
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <motion.button
                                                key={star}
                                                whileHover={{ scale: 1.2, rotate: 5 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => { 
                                                    // Different pitch sounds for each star rating
                                                    if (star === 1) kravy.error();
                                                    else if (star === 2) kravy.remove();
                                                    else if (star === 3) kravy.click();
                                                    else if (star === 4) kravy.add();
                                                    else kravy.success();
                                                    setReviewRating(star);
                                                }}
                                                className={`text-4xl transition-all ${star <= reviewRating ? "text-[#D4A353] drop-shadow-[0_0_8px_rgba(212,163,83,0.4)]" : "text-gray-200"}`}
                                            >
                                                ★
                                            </motion.button>
                                        ))}
                                    </div>
                                    <motion.div
                                        key={reviewRating}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[0.75rem] font-black text-[#D4A353] text-center mt-4 tracking-wide"
                                    >
                                        {reviewRating === 1 ? "EKDUM BEKAAR" : reviewRating === 2 ? "THIK THAK" : reviewRating === 3 ? "ACHA THA" : reviewRating === 4 ? "BOHAT BADIYA" : "LAJAWAAB! 😍"}
                                    </motion.div>
                                </div>

                                {/* Review Typography Box */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] pl-1 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-amber-500 rounded-full" /> Comments & Photo
                                    </label>
                                    <div className="relative group">
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Khana kaisa laga? Service kaisi thi?"
                                            rows={4}
                                            className="w-full bg-white border-2 border-gray-50 rounded-[24px] p-5 text-sm font-[700] outline-none focus:border-[#D4A353]/30 focus:bg-gray-50/30 transition-all resize-none shadow-sm"
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                            {reviewImageUploading ? (
                                                <div className="w-6 h-6 border-2 border-amber-500 border-t-white rounded-full animate-spin shadow-md" />
                                            ) : reviewImageUrl ? (
                                                <div className="relative w-10 h-10 rounded-md overflow-hidden border border-amber-200 shadow-sm cursor-pointer" onClick={() => document.getElementById("review-image-upload")?.click()}>
                                                    <Image src={reviewImageUrl} alt="Review" fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="flex bg-gray-50/80 rounded-full p-2 hover:bg-amber-50 cursor-pointer shadow-sm transition-colors border border-gray-100" onClick={() => document.getElementById("review-image-upload")?.click()} title="Add a photo">
                                                    <span className="text-xl leading-none">📸</span>
                                                </div>
                                            )}
                                            <input type="file" id="review-image-upload" accept="image/*" className="hidden" onChange={handleReviewImageUpload} />
                                        </div>
                                    </div>
                                </div>

                                {/* Luxury Loyalty Card Section */}
                                <div className="relative group">
                                    {customerPhone.length < 10 ? (
                                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-200/50 overflow-hidden relative">
                                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                                        <Sparkles size={20} className="fill-white" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">VIP Member Benefit</span>
                                                        <h3 className="text-sm font-black leading-tight">Claim +50 Coins Instantly</h3>
                                                    </div>
                                                </div>
                                                <div className="relative mb-3">
                                                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60" />
                                                    <input
                                                        value={customerName}
                                                        onChange={(e) => setCustomerName(e.target.value)}
                                                        placeholder="Your Name (Optional)"
                                                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-10 py-3.5 text-sm font-black placeholder:text-white/40 focus:bg-white/20 outline-none backdrop-blur-sm transition-all"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60" />
                                                    <input
                                                        value={customerPhone}
                                                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                        placeholder="Mobile Number (Required)"
                                                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-10 py-3.5 text-sm font-black placeholder:text-white/40 focus:bg-white/20 outline-none backdrop-blur-sm transition-all shadow-md focus:shadow-indigo-500/20"
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold opacity-60 text-center uppercase tracking-widest pt-1">Valid for loyalty redemption</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-emerald-50 rounded-[32px] p-6 border-2 border-emerald-100 flex items-center justify-between shadow-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(customerName && customerName !== "Guest" ? customerName : getIndianName("preview"))} overflow-hidden shadow-lg shadow-black/5 flex items-center justify-center relative`}>
                                                    <Image
                                                        src={getAvatarUrl(customerName, "preview")}
                                                        alt={customerName || "G"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Rewards Profile Linked</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-emerald-900">
                                                            {customerName && customerName !== "Guest" ? customerName : `${getIndianName("preview")} (Verified Guest) ✨`} · {customerPhone}
                                                        </span>
                                                        <button
                                                            onClick={() => setCustomerPhone("")}
                                                            className="text-[10px] font-bold text-emerald-600/60 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter animate-bounce">
                                                +50 Pts
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* High-Impact Submit Button */}
                                <button
                                    onClick={handlePostReview}
                                    disabled={reviewSubmitting || !reviewComment}
                                    className="w-full h-16 bg-black text-white rounded-[24px] font-black text-[0.85rem] uppercase tracking-[0.25em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {reviewSubmitting ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-3 border-gray-600 border-t-white rounded-full animate-spin" />
                                            <span>Posting Story...</span>
                                        </div>
                                    ) : "Post My Review 💎"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ITEM CUSTOMIZATION SHEET */}
            <AnimatePresence>
                {customizingItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[310] bg-black/60 backdrop-blur-sm flex items-end justify-center p-0"
                        onClick={() => setCustomizingItem(null)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] w-full max-w-[480px] max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
                        >
                            {/* Close Handle */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full z-20" />
                            
                            <div className="p-6 pt-10 overflow-y-auto no-scrollbar flex-1 pb-32">
                                <div className="flex gap-4 items-start mb-8">
                                    <div className="w-24 h-24 rounded-3xl overflow-hidden relative border border-gray-100 shadow-sm shrink-0">
                                        {(customizingItem as any).imageUrl || (customizingItem as any).image ? (
                                            <Image src={((customizingItem as any).imageUrl || (customizingItem as any).image) as string} alt={customizingItem.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">{customizingItem.ico || "🥘"}</div>
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-xl font-black text-gray-900 leading-tight mb-1.5">{customizingItem.name}</h3>
                                        <p className="text-[0.72rem] text-gray-500 font-bold line-clamp-2 leading-relaxed mb-2 opacity-80">{customizingItem.description}</p>
                                        <div className="text-[1.1rem] font-black text-[#E23744] italic">₹{customizingItem.sellingPrice || customizingItem.price}</div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {(customizingItem.variants as any[])?.map((vGroup: any) => (
                                        <div key={vGroup.id} className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <h4 className="text-[0.85rem] font-black uppercase tracking-[0.15em] text-gray-800">{vGroup.name}</h4>
                                                {vGroup.required && (
                                                    <span className="text-[0.58rem] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-100/50">
                                                        Choice Required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {vGroup.options.map((opt: any) => {
                                                    const isSelected = vGroup.type === "radio" 
                                                        ? selectedVariants[vGroup.id]?.id === opt.id
                                                        : selectedVariants[vGroup.id]?.some((o: any) => o.id === opt.id);
                                                    
                                                    return (
                                                        <motion.div 
                                                            key={opt.id}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                kravy.click();
                                                                const updated = { ...selectedVariants };
                                                                if (vGroup.type === "radio") {
                                                                    updated[vGroup.id] = opt;
                                                                } else {
                                                                    const arr = updated[vGroup.id] || [];
                                                                    if (isSelected) {
                                                                        updated[vGroup.id] = arr.filter((o: any) => o.id !== opt.id);
                                                                    } else {
                                                                        updated[vGroup.id] = [...arr, opt];
                                                                    }
                                                                }
                                                                setSelectedVariants(updated);
                                                            }}
                                                            className={`flex items-center justify-between p-4 rounded-[1.25rem] border-2 transition-all cursor-pointer ${isSelected ? "border-red-600 bg-red-50/20 shadow-sm" : "border-gray-100 bg-white"}`}
                                                        >
                                                            <div className="flex items-center gap-3.5">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-red-600 bg-red-600 shadow-inner" : "border-gray-300 bg-white"}`}>
                                                                    {isSelected && (
                                                                        vGroup.type === 'radio' 
                                                                            ? <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                            : <Check size={12} className="text-white" strokeWidth={4} />
                                                                    )}
                                                                </div>
                                                                <span className={`text-[0.88rem] font-[800] ${isSelected ? "text-red-700" : "text-gray-700"}`}>{opt.name}</span>
                                                            </div>
                                                            {opt.price > 0 && <span className={`text-[0.85rem] font-black italic ${isSelected ? "text-red-600" : "text-emerald-600"}`}>+₹{opt.price}</span>}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Addon Groups */}
                                    {((customizingItem as any).addonGroups as any[])?.map((ag: any) => (
                                        <div key={ag.id} className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <h4 className="text-[0.85rem] font-black uppercase tracking-[0.15em] text-gray-800">{ag.name}</h4>
                                                {ag.isCompulsory && (
                                                    <span className="text-[0.58rem] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-100/50">
                                                        Selection Mandatory
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {(ag.items as any[]).map((opt: any) => {
                                                    const isSelected = selectedVariants[`ag_${ag.id}`]?.some((o: any) => o.name === opt.name);
                                                    return (
                                                        <motion.div 
                                                            key={opt.name}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                kravy.click();
                                                                const updated = { ...selectedVariants };
                                                                const arr = updated[`ag_${ag.id}`] || [];
                                                                if (isSelected) {
                                                                    updated[`ag_${ag.id}`] = arr.filter((o: any) => o.name !== opt.name);
                                                                } else {
                                                                    if (ag.maxSelection && arr.length >= ag.maxSelection) {
                                                                        toast.error(`Max ${ag.maxSelection} items only`);
                                                                        return;
                                                                    }
                                                                    updated[`ag_${ag.id}`] = [...arr, opt];
                                                                }
                                                                setSelectedVariants(updated);
                                                            }}
                                                            className={`flex items-center justify-between p-4 rounded-[1.25rem] border-2 transition-all cursor-pointer ${isSelected ? "border-red-600 bg-red-50/20 shadow-sm" : "border-gray-100 bg-white"}`}
                                                        >
                                                            <div className="flex items-center gap-3.5">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-red-600 bg-red-600 shadow-inner" : "border-gray-300 bg-white"}`}>
                                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                </div>
                                                                <span className={`text-[0.88rem] font-[800] ${isSelected ? "text-red-700" : "text-gray-700"}`}>{opt.name}</span>
                                                            </div>
                                                            {opt.price > 0 && <span className={`text-[0.85rem] font-black italic ${isSelected ? "text-red-600" : "text-emerald-600"}`}>+₹{opt.price}</span>}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-100 z-30">
                                <button 
                                    onClick={addVariantItemToCart}
                                    className="w-full bg-[#E23744] text-white rounded-[1.25rem] h-[64px] font-black uppercase tracking-[0.15em] text-[0.9rem] shadow-2xl shadow-red-500/20 flex items-center justify-between px-10 active:scale-95 transition-all"
                                >
                                    <span className="flex items-center gap-2">Add To Cart <ArrowRight size={18} /></span>
                                    <span className="text-lg italic tracking-tighter">₹{
                                        ((customizingItem.sellingPrice || customizingItem.price || 0) + 
                                        Object.entries(selectedVariants).reduce((acc, [gid, val]) => {
                                            if (gid.startsWith('ag_')) {
                                               return acc + ((val as any[])?.reduce?.((s, o) => s + (o.price || 0), 0) || 0);
                                            }
                                            const group = (customizingItem.variants as any[])?.find((g: any) => g.id === gid);
                                            if (group?.type === "radio") return acc + (val?.price || 0);
                                            if (group?.type === "checkbox") return acc + (val?.reduce?.((s: number, o: any) => s + (o.price || 0), 0) || 0);
                                            return acc;
                                        }, 0)).toFixed(0)
                                    }</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ITEM DETAIL POPUP (ZOMATO PRECISED) */}
            <AnimatePresence>
                {selectedMenuItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => setSelectedMenuItem(null)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[480px] bg-white rounded-t-[3rem] overflow-hidden flex flex-col shadow-[0_-15px_60px_rgba(0,0,0,0.3)] relative"
                        >
                            {/* Drag Handle */}
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full z-20" />

                            {/* Close Button Inside */}
                            <button 
                                onClick={() => setSelectedMenuItem(null)}
                                className="absolute top-6 right-6 w-9 h-9 bg-gray-100/30 hover:bg-gray-200/50 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 z-[210] transition-colors"
                            >
                                <X size={18} strokeWidth={3} />
                            </button>

                            <div className="overflow-y-auto max-h-[85vh] no-scrollbar pt-6">
                                {/* Large Image Area */}
                                <div className="relative h-[280px] mx-4 rounded-2xl overflow-hidden bg-gray-100/50">
                                    {selectedMenuItem.imageUrl || selectedMenuItem.image ? (
                                        <Image 
                                            src={(selectedMenuItem.imageUrl || selectedMenuItem.image) as string} 
                                            alt={selectedMenuItem.name} 
                                            fill 
                                            className="object-cover"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#FFF0F1] to-[#FFF8EC] flex items-center justify-center text-6xl">
                                            {selectedMenuItem.ico || "🥘"}
                                        </div>
                                    )}
                                    {/* Bottom Image Fade */}
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>

                                {/* Content Details */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-4 h-4 border-[1.5px] rounded-sm flex items-center justify-center ${selectedMenuItem.isVeg ? "border-green-600" : "border-red-600"}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedMenuItem.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                                        </div>
                                        {selectedMenuItem.isBestseller && (
                                            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Star size={10} fill="currentColor" /> Bestseller
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <h2 className="text-[1.5rem] font-black text-gray-900 leading-[1.1]">
                                            {activeLang === "hi" && selectedMenuItem.hiName ? selectedMenuItem.hiName : selectedMenuItem.name}
                                        </h2>
                                    </div>

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex items-center gap-0.5">
                                            {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= (selectedMenuItem.rating || 5) ? "text-amber-400" : "text-gray-200"} fill={s <= (selectedMenuItem.rating || 5) ? "currentColor" : "none"} />)}
                                        </div>
                                        <div className="w-[1px] h-3 bg-gray-200" />
                                        <div className="h-2 w-20 bg-green-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 w-[85%] rounded-full" />
                                        </div>
                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Highly Popular</span>
                                    </div>

                                    {selectedMenuItem.description && (
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Chef's Description</div>
                                            <p className="text-[15px] text-gray-600 font-medium leading-[1.6]">
                                                {selectedMenuItem.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Action Footer */}
                            <div className="p-5 bg-white border-t border-gray-100/50 flex items-center gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl h-[60px] px-2 min-w-[130px]">
                                    <button 
                                        onClick={() => updateQty(selectedMenuItem.id, -1)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors text-2xl font-black active:scale-75"
                                    >
                                        −
                                    </button>
                                    <span className="text-xl font-black text-gray-800">{cart[selectedMenuItem.id] || 1}</span>
                                    <button 
                                        onClick={() => addToCart(selectedMenuItem.id)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-green-500 transition-colors text-2xl font-black active:scale-75"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!cart[selectedMenuItem.id]) addToCart(selectedMenuItem.id);
                                        setSelectedMenuItem(null);
                                    }}
                                    className="flex-1 bg-[#10854d] text-white rounded-2xl h-[60px] font-black text-[1.1rem] shadow-xl shadow-green-100/50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                >
                                    Add item · ₹{(selectedMenuItem.sellingPrice || selectedMenuItem.price || 0) * (cart[selectedMenuItem.id] || 1)}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
      `}</style>
        </div >
    );
}

export default function PublicMenuPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <PublicMenu />
        </Suspense>
    );
}
