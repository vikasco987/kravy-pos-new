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
    UtensilsCrossed,
    FileText,
    Utensils,
    Locate,
    Bell,
    Trash2
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
    isEgg: boolean;
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
    addonGroups?: any[] | null;
    tags?: string[];
    zones?: string[];
    _count?: {
        reviews: number;
    };
};

/* hide placeholder for missing images */
const ModernPlaceholder = (props: any) => null;

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
    qrMenuPriceInclusive?: boolean;
    contactPersonPhone?: string;
    contactPhone?: string;
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
    const [serviceType, setServiceType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in");
    const [deliveryAddress, setDeliveryAddress] = useState<string>("");
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [instructions, setInstructions] = useState<Record<string, string>>({});
    const [searchQ, setSearchQ] = useState("");
    const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg">("all");
    const [activeLang, setActiveLang] = useState<"en" | "hi" | "mr" | "ta">("en");
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
    const [showCartSheet, setShowCartSheet] = useState(false);
    const [showReviewSheet, setShowReviewSheet] = useState(false);
    const [showCategorySheet, setShowCategorySheet] = useState(false);
    const [loyaltyOn, setLoyaltyOn] = useState(false);
    const [orderNote, setOrderNote] = useState("");
    const [showNoteSheet, setShowNoteSheet] = useState(false);
    const [dontSendCutlery, setDontSendCutlery] = useState(false);
    const [activeZoneFilter, setActiveZoneFilter] = useState("ALL");

    // User Data
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("UPI / QR");

    // Delivery Address Fields
    const [delivHouseNo, setDelivHouseNo] = useState("");
    const [delivStreet, setDelivStreet] = useState("");
    const [delivNearby, setDelivNearby] = useState("");
    const [delivState, setDelivState] = useState("");
    const [delivPin, setDelivPin] = useState("");

    // Favorites & Addresses State (Swiggy/Zomato style)
    const [favorites, setFavorites] = useState<string[]>([]);
    type SavedAddress = { id: string; label: string; houseNo: string; street: string; nearby: string; state: string; pin: string; };
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [profileActiveTab, setProfileActiveTab] = useState<"orders" | "addresses" | "favorites">("orders");
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [newAddrLabel, setNewAddrLabel] = useState("Home");
    const [newAddrHouseNo, setNewAddrHouseNo] = useState("");
    const [newAddrStreet, setNewAddrStreet] = useState("");
    const [newAddrNearby, setNewAddrNearby] = useState("");
    const [newAddrState, setNewAddrState] = useState("");
    const [newAddrPin, setNewAddrPin] = useState("");

    // Coupon State
    const [showCouponSheet, setShowCouponSheet] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const DELIVERY_CHARGE = 49;

    // Order Flow
    const [orderStatus, setOrderStatus] = useState<"none" | "placing" | "placed">("none");
    const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
    const [lastOrderItems, setLastOrderItems] = useState<any[]>([]);
    const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
    const [showRecentOrders, setShowRecentOrders] = useState(false);
    const [pastOrders, setPastOrders] = useState<any[]>([]);
    const [loadingPastOrders, setLoadingPastOrders] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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

    const toggleFavorite = (itemId: string) => {
        setFavorites(prev => {
            const updated = prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId];
            localStorage.setItem(`fav_items_${clerkId}`, JSON.stringify(updated));
            if (prev.includes(itemId)) {
                kravy.remove();
                toast.info("Removed from favorites");
            } else {
                kravy.success();
                toast.success("Added to favorites! ❤️");
            }
            return updated;
        });
    };

    const detectNewAddressLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsGettingLocation(true);
        kravy.click();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        const houseNo = addr.house_number || addr.house_name || addr.building || addr.amenity || addr.office || "";
                        const street = addr.road || addr.street || addr.path || "";
                        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.commercial || addr.industrial || addr.village || addr.townland || addr.locality || "";
                        const district = addr.city_district || addr.district || addr.county || addr.city || addr.town || addr.municipality || "";
                        const state = addr.state || addr.state_district || addr.region || "";
                        const pin = addr.postcode || "";

                        setNewAddrHouseNo(houseNo);
                        setNewAddrStreet([street, area].filter(Boolean).join(", ") || area || street);
                        setNewAddrNearby(district);
                        setNewAddrState(state);
                        setNewAddrPin(pin);

                        kravy.success();
                        toast.success("Location detected! 📍");
                    } else {
                        kravy.error();
                        toast.error("Could not parse location");
                    }
                } catch (error) {
                    kravy.error();
                    toast.error("Failed to detect location");
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                kravy.error();
                toast.error("Please allow location access");
                setIsGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const detectExactLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsGettingLocation(true);
        kravy.click();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Use Nominatim to get details of the address components
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        
                        // Extract parts of address thoroughly
                        const houseNo = addr.house_number || addr.house_name || addr.building || addr.amenity || addr.office || "";
                        const street = addr.road || addr.street || addr.path || "";
                        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.commercial || addr.industrial || addr.village || addr.townland || addr.locality || "";
                        const district = addr.city_district || addr.district || addr.county || addr.city || addr.town || addr.municipality || "";
                        const state = addr.state || addr.state_district || addr.region || "";
                        const pin = addr.postcode || "";

                        const combinedStreetArea = [street, area].filter(Boolean).join(", ");

                        setDelivHouseNo(houseNo);
                        setDelivStreet(combinedStreetArea || area || street);
                        setDelivNearby(district);
                        setDelivState(state);
                        setDelivPin(pin);

                        // Build a nice concise deliveryAddress for the header
                        const headerComponents = [combinedStreetArea || area || street, district, addr.city || addr.town].filter(Boolean);
                        const shortAddress = headerComponents.length > 0 ? headerComponents.join(", ") : data.display_name;
                        setDeliveryAddress(shortAddress);
                        
                        // Also update customerAddress in case it is fallback
                        setCustomerAddress(data.display_name);

                        kravy.success();
                        toast.success("Exact location detected and form pre-filled! 📍");
                    } else if (data && data.display_name) {
                        setDeliveryAddress(data.display_name);
                        setCustomerAddress(data.display_name);
                        kravy.success();
                        toast.success("Location detected! Please enter details manually.");
                    } else {
                        kravy.error();
                        toast.error("Could not parse location data");
                    }
                } catch (error) {
                    kravy.error();
                    toast.error("Failed to reverse-geocode coordinates");
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                kravy.error();
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error("Location permission denied. Please allow location access.");
                } else {
                    toast.error("Error getting location. Please enter manually.");
                }
                setIsGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const addSavedAddress = () => {
        if (!newAddrHouseNo.trim() || !newAddrStreet.trim() || !newAddrState.trim() || !newAddrPin.trim()) {
            toast.error("Please fill all mandatory fields (*)");
            return;
        }
        const newAddress: SavedAddress = {
            id: Math.random().toString(36).substring(2, 11),
            label: newAddrLabel,
            houseNo: newAddrHouseNo,
            street: newAddrStreet,
            nearby: newAddrNearby,
            state: newAddrState,
            pin: newAddrPin
        };
        const updated = [...savedAddresses, newAddress];
        setSavedAddresses(updated);
        localStorage.setItem(`saved_addresses_${clerkId}`, JSON.stringify(updated));
        setSelectedAddressId(newAddress.id);
        
        // Reset fields
        setNewAddrHouseNo("");
        setNewAddrStreet("");
        setNewAddrNearby("");
        setNewAddrState("");
        setNewAddrPin("");
        setShowAddAddressForm(false);
        
        kravy.success();
        toast.success("Address saved successfully! 🏠");
    };

    const deleteSavedAddress = (id: string) => {
        const updated = savedAddresses.filter(a => a.id !== id);
        setSavedAddresses(updated);
        localStorage.setItem(`saved_addresses_${clerkId}`, JSON.stringify(updated));
        if (selectedAddressId === id) {
            setSelectedAddressId(updated.length > 0 ? updated[0].id : null);
        }
        kravy.remove();
        toast.info("Address deleted");
    };

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

    // Initialize favorites from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`fav_items_${clerkId}`);
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading favorites:", e);
            }
        }
    }, [clerkId]);

    // Load saved addresses from localStorage
    useEffect(() => {
        const savedAddrs = localStorage.getItem(`saved_addresses_${clerkId}`);
        if (savedAddrs) {
            try {
                const parsed = JSON.parse(savedAddrs);
                setSavedAddresses(parsed);
                if (parsed.length > 0) {
                    setSelectedAddressId(parsed[0].id);
                }
            } catch (e) {
                console.error("Error loading addresses:", e);
            }
        }
    }, [clerkId]);

    // Sync selected address to checkout fields automatically
    useEffect(() => {
        if (selectedAddressId && savedAddresses.length > 0) {
            const addr = savedAddresses.find(a => a.id === selectedAddressId);
            if (addr) {
                setDelivHouseNo(addr.houseNo);
                setDelivStreet(addr.street);
                setDelivNearby(addr.nearby);
                setDelivState(addr.state);
                setDelivPin(addr.pin);
                
                const components = [addr.street, addr.nearby].filter(Boolean);
                setDeliveryAddress(components.join(", "));
            }
        }
    }, [selectedAddressId, savedAddresses]);

    // Fetch detailed past orders when the profile drawer is opened
    useEffect(() => {
        if (!showRecentOrders || recentOrderIds.length === 0) return;
        
        async function fetchPastOrders() {
            setLoadingPastOrders(true);
            try {
                const fetched = await Promise.all(
                    recentOrderIds.map(async (id) => {
                        try {
                            const res = await fetch(`/api/public/orders?id=${id}`);
                            if (res.ok) return await res.json();
                        } catch (err) {
                            console.error(`Error fetching order ${id}:`, err);
                        }
                        return null;
                    })
                );
                setPastOrders(fetched.filter(Boolean));
            } catch (e) {
                console.error("Error fetching past orders:", e);
            } finally {
                setLoadingPastOrders(false);
            }
        }
        
        fetchPastOrders();
    }, [showRecentOrders, recentOrderIds]);

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
                    fetch(`/api/public/menu/${clerkId}?tableId=${tableId}`),
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

    // Geolocation for Delivery / Takeaway mode
    useEffect(() => {
        if (serviceType === "dine-in") {
            setDeliveryAddress("");
            return;
        }
        if (!navigator.geolocation) return;
        setIsGettingLocation(true);
        setDeliveryAddress("");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();
                    const addr = data.address;
                    const short = [
                        addr?.road || addr?.suburb || addr?.neighbourhood,
                        addr?.city || addr?.town || addr?.village,
                    ].filter(Boolean).join(", ");
                    setDeliveryAddress(short || data.display_name?.split(",").slice(0, 2).join(",") || "Current Location");
                } catch {
                    setDeliveryAddress("Current Location");
                } finally {
                    setIsGettingLocation(false);
                }
            },
            () => {
                setDeliveryAddress("Location unavailable");
                setIsGettingLocation(false);
            },
            { timeout: 8000 }
        );
    }, [serviceType]);

    // Derived Values
    const categoriesInfo = useMemo(() => {
        const cats = Array.from(new Set(items.map(it => it.category?.name || "Other")));
        const mapping: Record<string, string> = { "all": "🔥" };
        const usedIcons = new Set(["🔥"]);
        const pool = ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞", "🧇", "🍞", "🥐", "🥨", "🥯", "🥖", "🌮", "🌯", "🥙", "🧆", "🥘", "🍲", "🥣", "🥗", "🍱", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🥟", "🦪", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍩", "🍪", "🌰", "🥜", "🍯", "🥤", "🧋", "☕", "🍵", "🍼", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🧊", "🍐", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🍄"];
        
        cats.forEach(cat => {
            const lower = cat.toLowerCase();
            let icon = "";
            
            // 🌟 ROBUST KEYWORD MATCHING
            if (lower.includes("pizza")) icon = "🍕";
            else if (lower.includes("burger") || lower.includes("sandwich")) icon = "🍔";
            else if (lower.includes("biryani") || lower.includes("rice") || lower.includes("pulao")) icon = "🍛";
            else if (lower.includes("chicken") || lower.includes("non-veg") || lower.includes("mutton") || lower.includes("fish")) icon = "🍗";
            else if (lower.includes("drink") || lower.includes("beverage") || lower.includes("juice") || lower.includes("mocktail") || lower.includes("shake") || lower.includes("cold coffee")) icon = "🥤";
            else if (lower.includes("tea") || lower.includes("chai")) icon = "🍵";
            else if (lower.includes("coffee")) icon = "☕";
            else if (lower.includes("chinese") || lower.includes("noodle") || lower.includes("chowmein")) icon = "🍜";
            else if (lower.includes("momo") || lower.includes("dimsum")) icon = "🥟";
            else if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("cake") || lower.includes("pastry") || lower.includes("waffle")) icon = "🍰";
            else if (lower.includes("ice cream") || lower.includes("gelato") || lower.includes("kulfi")) icon = "🍦";
            else if (lower.includes("starter") || lower.includes("snack") || lower.includes("appetizer") || lower.includes("roll")) icon = "🍟";
            else if (lower.includes("paneer") || lower.includes("veg") || lower.includes("main course") || lower.includes("curry") || lower.includes("dal")) icon = "🥘";
            else if (lower.includes("soup")) icon = "🥣";
            else if (lower.includes("salad")) icon = "🥗";
            else if (lower.includes("south indian") || lower.includes("dosa") || lower.includes("idli") || lower.includes("vada")) icon = "🥞";
            else if (lower.includes("thali") || lower.includes("meal")) icon = "🍱";
            else if (lower.includes("bread") || lower.includes("roti") || lower.includes("naan") || lower.includes("paratha")) icon = "🫓";
            else if (lower.includes("pasta") || lower.includes("spaghetti")) icon = "🍝";
            else if (lower.includes("combos") || lower.includes("deals") || lower.includes("offers")) icon = "🎁";
            
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

    const availableZones = useMemo(() => {
        const zones = new Set<string>();
        items.forEach(it => {
            if (Array.isArray(it.zones)) {
                it.zones.forEach(z => zones.add(z.toUpperCase()));
            }
        });
        return Array.from(zones).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        const _filtered = items.filter(it => {
            const matchVeg = foodPref === "all" ? true : foodPref === "veg" ? it.isVeg : (!it.isVeg);
            const matchSearch = (it.name.toLowerCase().includes(searchQ.toLowerCase())) ||
                (it.hiName?.includes(searchQ));
            
            // Zone Filter Logic
            let matchZone = true;
            if (activeZoneFilter !== "ALL") {
                matchZone = Array.isArray(it.zones) && it.zones.some(z => z.toUpperCase() === activeZoneFilter);
            }

            return matchVeg && matchSearch && matchZone;
        });

        const grouped: Record<string, MenuItem[]> = {};
        _filtered.forEach(it => {
            let baseName = it.name;
            const suffixMatch = it.name.match(/\s*\(([^)]+)\)$/);
            if (suffixMatch) {
                baseName = it.name.substring(0, suffixMatch.index).trim();
            }
            if (!grouped[baseName]) grouped[baseName] = [];
            grouped[baseName].push(it);
        });

        const finalItems: MenuItem[] = [];
        Object.entries(grouped).forEach(([baseName, group]) => {
            if (group.length === 1) {
                finalItems.push(group[0]);
            } else {
                const minPrice = Math.min(...group.map(i => i.sellingPrice || i.price || 0));
                const virtualVariants = [{
                    id: 'virtual_group',
                    name: 'Size / Portion',
                    type: 'radio',
                    required: true,
                    options: group.map(i => {
                        const match = i.name.match(/\((.*?)\)/)?.[1] || i.name;
                        let niceName = match;
                        if (match.toUpperCase() === 'F' || match.toUpperCase() === 'FULL') niceName = 'Full Portion';
                        if (match.toUpperCase() === 'H' || match.toUpperCase() === 'HALF') niceName = 'Half Portion';
                        if (match.toUpperCase() === 'S' || match.toUpperCase() === 'SMALL') niceName = 'Small';
                        if (match.toUpperCase() === 'R' || match.toUpperCase() === 'REGULAR') niceName = 'Regular';
                        if (match.toUpperCase() === 'M' || match.toUpperCase() === 'MEDIUM') niceName = 'Medium';
                        if (match.toUpperCase() === 'L' || match.toUpperCase() === 'LARGE') niceName = 'Large';
                        
                        return {
                            id: i.id,
                            name: niceName,
                            price: i.sellingPrice || i.price || 0,
                            originalId: i.id,
                            imageUrl: i.imageUrl || i.image || null
                        };
                    })
                }];
                finalItems.push({
                    ...group[0],
                    id: "virtual_" + baseName,
                    name: baseName,
                    price: minPrice,
                    sellingPrice: minPrice,
                    variants: virtualVariants,
                    addonGroups: [],
                    isVirtualGroup: true,
                    groupedItems: group
                } as any);
            }
        });

        return finalItems;
    }, [items, foodPref, searchQ, activeZoneFilter]);

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
    const { taxEnabled, perProductEnabled, globalRate, isInclusive } = useMemo(() => ({
        taxEnabled: profile?.taxEnabled ?? true,
        perProductEnabled: profile?.perProductTaxEnabled ?? false,
        globalRate: profile?.taxRate ?? 0,
        isInclusive: profile?.qrMenuPriceInclusive ?? false
    }), [profile]);

    const itemTax = useMemo(() => {
        if (!taxEnabled) return 0;
        
        let total = 0;
        
        // 1. Simple Cart Items
        Object.entries(cart).forEach(([id, qty]) => {
            const item = items.find(i => i.id === id);
            if (!item) return;

            let rate = globalRate;
            if (perProductEnabled && item.gst !== undefined && item.gst !== null) {
                rate = item.gst;
            }

            const price = (item.sellingPrice || item.price || 0);
            const lineTotal = price * qty;
            
            // Item's own tax status takes priority if perProductEnabled is on
            const itemIsInclusive = (perProductEnabled && item.taxStatus) 
                ? (item.taxStatus === "With Tax") 
                : isInclusive;

            if (itemIsInclusive) {
                total += (lineTotal * (1 - 1 / (1 + rate / 100)));
            } else {
                total += (lineTotal * rate / 100);
            }
        });

        // 2. Variant Cart Items
        variantCart.forEach((vit) => {
            const item = items.find(i => i.id === vit.id);
            let rate = globalRate;
            if (perProductEnabled && item?.gst !== undefined && item?.gst !== null) {
                rate = item.gst;
            }

            const lineTotal = vit.totalPrice * vit.qty;
            const itemIsInclusive = (perProductEnabled && item?.taxStatus) 
                ? (item.taxStatus === "With Tax") 
                : isInclusive;

            if (itemIsInclusive) {
                total += (lineTotal * (1 - 1 / (1 + rate / 100)));
            } else {
                total += (lineTotal * rate / 100);
            }
        });

        return total;
    }, [cart, variantCart, items, taxEnabled, globalRate, perProductEnabled, isInclusive]);

    const comboTax = useMemo(() => {
        if (!taxEnabled) return 0;
        return combosCart.reduce((sum, c) => {
            if (isInclusive) {
                return sum + (c.price * (1 - 1 / (1 + globalRate / 100)));
            }
            return sum + (c.price * globalRate / 100);
        }, 0);
    }, [combosCart, taxEnabled, isInclusive, globalRate]);

    const tax = itemTax + comboTax;
    const loyaltyDisc = loyaltyOn ? 32 : 0;
    const deliveryCharge = serviceType === "delivery" ? DELIVERY_CHARGE : 0;
    const couponDisc = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.discountType === 'PERCENTAGE') return Math.floor(subtotal * appliedCoupon.discountValue / 100);
        return Math.min(appliedCoupon.discountValue, subtotal);
    }, [appliedCoupon, subtotal]);
    const total = useMemo(() => {
        const base = isInclusive ? subtotal : subtotal + tax;
        return Math.max(0, base - loyaltyDisc - couponDisc + deliveryCharge);
    }, [isInclusive, subtotal, loyaltyDisc, tax, couponDisc, deliveryCharge]);

    // Actions
    // Auto-initialize selectedVariants when an item is selected for customization or detail view
    useEffect(() => {
        const item = customizingItem || selectedMenuItem;
        if (!item) {
            setSelectedVariants({});
            return;
        }

        const initial: Record<string, any> = {};
        
        // Handle virtual groups
        if ((item as any).isVirtualGroup) {
            initial['virtual_group'] = (item.variants as any[])[0].options[0];
            setSelectedVariants(initial);
            return;
        }

        // Handle standard Variants
        (item.variants as any[])?.forEach((v: any) => {
            if (v.required && v.options?.length > 0) {
                initial[v.id] = v.type === "radio" ? v.options[0] : [v.options[0]];
            }
        });

        // Handle Addon Groups
        (item.addonGroups as any[])?.forEach((ag: any) => {
            if (ag.isCompulsory && ag.items?.length > 0) {
                initial[`ag_${ag.id}`] = [ag.items[0]];
            }
        });

        setSelectedVariants(initial);
    }, [customizingItem?.id, selectedMenuItem?.id]);

    const addToCart = (id: string) => {
        // Search in both items and filteredItems (which contains virtual grouped items)
        const item = items.find(it => it.id === id) || filteredItems.find(it => it.id === id);
        if (!item) return;

        // ✅ If item has variants OR addon groups, open selection sheet
        if ((item.variants && (item.variants as any[]).length > 0) || (item.addonGroups && (item.addonGroups as any[]).length > 0)) {
            setCustomizingItem(item);
            return;
        }

        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        kravy.add();
        toast.success("Added to cart", { duration: 800, position: "top-center" });
    };

    const addVariantItemToCart = () => {
        const item = customizingItem || selectedMenuItem;
        if (!item) return;

        let extra = 0;
        const selections: any[] = [];
        
        // Validation check for mandatory addon groups
        const missingMandatoryGroups: string[] = [];
        ((item as any).addonGroups as any[] || []).forEach((ag: any) => {
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

        // Handle Virtual Group Items (Full/Half)
        if ((item as any).isVirtualGroup) {
            const selectedOption = selectedVariants['virtual_group'];
            if (!selectedOption) {
                toast.error("Please select a size / portion");
                return;
            }
            const originalItem = (item as any).groupedItems.find((i:any) => i.id === selectedOption.originalId);
            if (originalItem) {
                setCart(prev => ({ ...prev, [originalItem.id]: (prev[originalItem.id] || 0) + 1 }));
                kravy.add();
                toast.success("Added to cart", { duration: 800, position: "top-center" });
                setCustomizingItem(null);
                setSelectedMenuItem(null);
                return;
            }
        }

        Object.entries(selectedVariants).forEach(([groupId, val]) => {
            if (groupId.startsWith('ag_')) {
               const agId = groupId.replace('ag_', '');
               const ag = ((item as any).addonGroups as any[])?.find(g => g.id === agId);
               if (ag && Array.isArray(val)) {
                   val.forEach((opt: any) => {
                       extra += (opt.price || 0);
                       selections.push({ group: ag.name, option: opt.name, price: opt.price });
                   });
               }
               return;
            }

            const group = (item.variants as any[])?.find((g: any) => g.id === groupId);
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
            id: item.id,
            name: item.name,
            totalPrice: (item.sellingPrice || item.price || 0) + extra,
            qty: 1,
            variants: selections,
            isVeg: item.isVeg
        };

        setVariantCart(prev => [...prev, newCartItem]);
        setCustomizingItem(null);
        setSelectedMenuItem(null);
        kravy.success();
        toast.success("Added customized item!");
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
        // Always require name & phone
        if (!customerName.trim()) {
            toast.error("Please enter your full name");
            return;
        }
        if (!customerPhone || customerPhone.length < 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }
        // Require full delivery address when delivery is selected
        if (serviceType === "delivery") {
            if (!delivHouseNo.trim()) { toast.error("Please enter House / Flat No."); return; }
            if (!delivStreet.trim()) { toast.error("Please enter Street / Area"); return; }
            if (!delivState.trim()) { toast.error("Please enter State"); return; }
            if (!delivPin.trim() || delivPin.length < 6) { toast.error("Please enter a valid 6-digit PIN code"); return; }
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
                        isVeg: item?.isVeg,
                        taxStatus: item?.taxStatus || (isInclusive ? "With Tax" : "Without Tax"),
                        gst: (perProductEnabled && item?.gst !== undefined && item?.gst !== null) ? item.gst : globalRate
                    };
                });

            const variantOrderItems = variantCart.map((vit) => {
                const item = items.find(i => i.id === vit.id);
                return {
                    itemId: vit.id,
                    name: vit.name,
                    price: vit.totalPrice,
                    quantity: vit.qty,
                    total: vit.totalPrice * vit.qty,
                    variants: vit.variants,
                    isVeg: vit.isVeg,
                    taxStatus: item?.taxStatus || (isInclusive ? "With Tax" : "Without Tax"),
                    gst: (perProductEnabled && item?.gst !== undefined && item?.gst !== null) ? item.gst : globalRate
                };
            });

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

            const computedAddress = serviceType === "delivery"
                ? `H.No: ${delivHouseNo}, Street: ${delivStreet}${delivNearby ? `, Landmark: ${delivNearby}` : ""}, State: ${delivState} - ${delivPin}`
                : customerAddress;

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
                    customerAddress: computedAddress || null,
                    caseType: "new",
                    paymentMethod, // ✅ NEW: capturing intent
                    notes: orderNote, // 📝 Global order note
                    preferences: { dontSendCutlery } // 🍴 Cutlery preference
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#701cf5]"></div>
        </div>
    );

    return (
        <div className="bg-[#F8F9FA] min-h-screen font-sans text-[#1C1C1C]">

            {/* ── TOP NAV (Blinkit Style Header) — truly sticky ── */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">

                    {/* Row 1: Location + Icons */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Dynamic Location Info */}
                        <div
                            onClick={() => {
                                if (serviceType === "delivery" && !isGettingLocation) {
                                    detectExactLocation();
                                }
                            }}
                            className={`flex items-center gap-2 min-w-0 flex-1 ${
                                serviceType === "delivery" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                serviceType === "dine-in" ? "bg-[#ede9fe]/40 text-[#5a14d4]" :
                                serviceType === "takeaway" ? "bg-orange-50 text-orange-500" :
                                "bg-purple-50 text-purple-500"
                            }`}>
                                {serviceType === "dine-in" ? <MapPin size={20} strokeWidth={2.5} /> :
                                 serviceType === "takeaway" ? <span className="text-lg">🛍️</span> :
                                 isGettingLocation ? <RefreshCw size={16} className="animate-spin" /> :
                                 <Locate size={20} strokeWidth={2.5} />}
                            </div>
                            <div className="min-w-0">
                                <div className="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider">
                                    {serviceType === "dine-in" ? "Dining at Table" :
                                     serviceType === "takeaway" ? "Pickup Location" : "Delivering to"}
                                </div>
                                <div className="text-[0.92rem] font-black text-gray-900 leading-tight truncate">
                                    {serviceType === "dine-in" ? tableName :
                                     serviceType === "takeaway" ? (profile?.businessAddress || "Hotel Location") :
                                     isGettingLocation ? "Detecting location..." :
                                     deliveryAddress || "Tap to detect location"}
                                </div>
                            </div>
                        </div>

                        {/* Right side: Notification + Profile */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <button className="relative w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                                <Bell size={20} strokeWidth={2.2} />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#701cf5] rounded-full border border-white" />
                            </button>
                            <button
                                onClick={() => { kravy.click(); setShowRecentOrders(true); }}
                                className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-bold text-sm"
                            >
                                {customerName ? customerName.slice(0, 2).toUpperCase() : <User size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Search Bar + Veg Toggle */}
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1 bg-[#F5F5F5] rounded-2xl flex items-center gap-2 px-4 py-2.5 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all shadow-inner">
                            <Search size={18} className="text-gray-400" strokeWidth={2.5} />
                            <input
                                ref={searchInputRef}
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                placeholder={`Search in ${profile?.businessName || "Restaurant"}...`}
                                className="bg-transparent text-[0.92rem] w-full outline-none font-[600] text-gray-800 placeholder:text-gray-400"
                            />
                            {searchQ && (
                                <button onClick={() => setSearchQ("")} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setFoodPref(foodPref === 'veg' ? 'all' : 'veg')}
                            className="flex items-center gap-2.5 border border-gray-200 bg-white rounded-2xl py-2 px-3 shadow-sm shrink-0 transition-all hover:bg-gray-50/50 active:scale-98 select-none focus:outline-none"
                        >
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 border-[1.5px] border-green-600 rounded flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-gray-600">Veg Only</span>
                            </div>
                            <div
                                className={`w-9 h-5 rounded-full transition-colors relative duration-300 flex items-center shrink-0 ${
                                    foodPref === 'veg' ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 absolute ${
                                        foodPref === 'veg' ? 'left-[19px]' : 'left-[3px]'
                                    }`}
                                />
                            </div>
                        </button>
                    </div>

                    {/* Row 3: Dine-in / Takeaway / Delivery tabs */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl mt-3 border border-gray-200/50">
                        {(["dine-in", "takeaway", "delivery"] as const).map((mode) => {
                            const isActive = serviceType === mode;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => { kravy.click(); setServiceType(mode); }}
                                    className={`py-2.5 px-1 rounded-xl text-xs font-black tracking-wide transition-all duration-200 ${
                                        isActive
                                            ? "bg-white text-gray-900 shadow-sm border border-gray-200/30"
                                            : "text-gray-500 hover:text-gray-700 bg-transparent"
                                    }`}
                                >
                                    {mode === "dine-in" ? "🍽️ Dine-in" : mode === "takeaway" ? "🛍️ Takeaway" : "🚴 Delivery"}
                                </button>
                            );
                        })}
                    </div>

                </div>
            </nav>

            {/* ── CONTENT SCREENS ── */}
            {/* pt accounts for the fixed nav height (~160px) */}
            <main className="pb-32 pt-[180px] max-w-7xl mx-auto px-4 md:px-6">
                <ActiveOrderBanner tableId={tableId} clerkId={clerkId} />

                {/* RESTAURANT DETAILS CARD (Pizza Point) */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80 mb-4">
                    <div className="flex gap-4 items-start">
                        {/* Logo on the Left */}
                        {(profile?.logoUrl || profile?.profileImageUrl) ? (
                            <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 shrink-0 bg-gray-50">
                                <Image
                                    src={profile.logoUrl || profile.profileImageUrl || ""}
                                    alt={profile.businessName || "Restaurant Logo"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ede9fe]/40 to-[#a855f7]/20 border border-gray-100 flex items-center justify-center shrink-0">
                                <UtensilsCrossed size={28} className="text-[#5a14d4]" />
                            </div>
                        )}

                        {/* Name and details on the right */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight truncate">
                                    {profile?.businessName || "Kravy Restaurant"}
                                </h1>
                                {/* Calling Button */}
                                {(profile?.contactPersonPhone || profile?.contactPhone) && (
                                    <a
                                        href={`tel:${profile.contactPersonPhone || profile.contactPhone}`}
                                        className="w-9 h-9 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 hover:bg-green-100 hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
                                        title="Call Restaurant"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Phone size={16} strokeWidth={2.5} />
                                    </a>
                                )}
                            </div>
                            
                            <p className="text-xs text-gray-500 font-semibold mt-1 mb-2">North Indian · Fast Food · Cuisines</p>
                            
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <div className="flex items-center gap-1 bg-[#F0FDF4] border border-[#b2dfc8] rounded-lg px-2 py-0.5 text-xs font-black text-green-700">
                                    ★ 4.3 (2.1K+ reviews)
                                </div>
                                <div className="w-[1px] h-3 bg-gray-200" />
                                <div className="text-xs text-gray-500 font-black">⏱ 20–30 mins</div>
                                <div className="w-[1px] h-3 bg-gray-200" />
                                <div className="text-xs text-gray-500 font-black">₹350 for two</div>
                            </div>
                        </div>
                    </div>
                    {profile?.businessTagLine && (
                        <div className="mt-4 pt-3.5 border-t border-gray-50 text-xs text-gray-400 italic font-semibold">
                            "{profile.businessTagLine}"
                        </div>
                    )}
                </div>

                {/* Sub-tabs: Menu, Reviews, Gallery, Loyalty */}
                <div className="flex border-b border-gray-100 bg-white rounded-2xl mb-4 overflow-x-auto no-scrollbar scrollbar-none px-4 py-1.5 shadow-sm border border-gray-100/50">
                    {(["menu", "reviews", "gallery", "loyalty"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { kravy.click(); setActiveTab(tab); }}
                            className={`flex-1 py-3 text-xs font-[800] capitalize transition-all border-b-2 text-center min-w-[80px] ${activeTab === tab ? "text-[#5a14d4] border-[#5a14d4]" : "text-gray-500 border-transparent hover:text-gray-700"}`}
                        >
                            {tab === "menu" ? "🍛 Menu" : tab === "reviews" ? "⭐ Reviews" : tab === "gallery" ? "📸 Gallery" : "🎁 Loyalty"}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* MENU SCREEN */}
                    {activeTab === "menu" && (
                        <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                            {/* COMBOS STRIP */}
                            {combos.length > 0 && (
                                <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-black uppercase tracking-wider text-gray-400">Bundle & Save ✨</div>
                                        <span className="text-[0.65rem] font-[800] text-[#8B5CF6] px-2 py-0.5 bg-[#8B5CF6]/10 rounded-full italic">Best Value</span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                        {combos.map(combo => (
                                            <div
                                                key={combo.id}
                                                className="flex-shrink-0 w-[240px] bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer"
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
                                                    <h4 className="text-[0.88rem] font-black text-gray-800 truncate mb-1">{combo.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}</h4>
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

                            {/* TWO-COLUMN MENU (Blinkit Style) */}
                            <div className="flex flex-col md:flex-row gap-4 items-start relative min-h-[500px]">
                                {/* Left Category Sidebar */}
                                <aside className="w-full md:w-[220px] shrink-0 md:sticky md:top-[200px] bg-white border border-gray-100 rounded-3xl p-3 shadow-sm flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar max-h-none md:max-h-[calc(100vh-240px)] z-40">
                                    {categories.filter(c => c !== "all").map(c => {
                                        const isActive = activeCategory === c;
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => {
                                                    kravy.click();
                                                    const el = document.getElementById(`cat-${c}`);
                                                    if (el) {
                                                        const offset = 220;
                                                        window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' });
                                                    }
                                                    setActiveCategory(c);
                                                }}
                                                className={`py-2.5 px-4 flex items-center gap-2 rounded-2xl transition-all whitespace-nowrap md:whitespace-normal shrink-0 md:shrink ${isActive ? "bg-[#ede9fe]/30 text-[#5a14d4] border-l-4 border-[#5a14d4] md:border-l-4 md:border-t-0 font-black" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-bold"}`}
                                            >
                                                <span className="text-xl shrink-0">{categoryIcons[c]}</span>
                                                <span className="text-xs md:text-sm font-black capitalize truncate w-full text-left">{c}</span>
                                            </button>
                                        );
                                    })}
                                </aside>

                                {/* Right Items Panel */}
                                <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-sm space-y-8">
                                    {categories.filter(c => c !== "all").map(categoryName => {
                                        const categoryItems = filteredItems.filter(it => (it.category?.name || "Other") === categoryName);
                                        if (categoryItems.length === 0) return null;

                                        return (
                                            <div key={categoryName} id={`cat-${categoryName}`} className="pt-2">
                                                {/* Category Header */}
                                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                                    <span className="text-xl">{categoryIcons[categoryName]}</span>
                                                    <h2 className="text-base font-black text-gray-900 tracking-tight">{categoryName}</h2>
                                                    <span className="text-xs text-gray-400 font-bold ml-auto bg-gray-50 px-2 py-0.5 rounded-md">{categoryItems.length} items</span>
                                                </div>

                                                {/* Category Items list */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    {categoryItems.map(item => (
                                                        <div
                                                            key={item.id}
                                                            className="flex gap-4 p-4 border border-gray-50 hover:border-gray-100 rounded-2xl transition-all cursor-pointer hover:shadow-sm items-start"
                                                            onClick={() => { kravy.open(); setSelectedMenuItem(item); }}
                                                        >
                                                            {/* Item Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`w-[14px] h-[14px] border-[1.5px] rounded-sm flex items-center justify-center mb-1.5 ${item.isVeg && !item.name.includes("(NV)") && !item.name.toLowerCase().includes("egg") ? "border-green-600" : (item.isEgg || item.name.toLowerCase().includes("egg") || item.name.includes("(E)")) ? "border-amber-500" : "border-red-600"}`}>
                                                                    <div className={`w-[6px] h-[6px] rounded-full ${item.isVeg && !item.name.includes("(NV)") && !item.name.toLowerCase().includes("egg") ? "bg-green-600" : (item.isEgg || item.name.toLowerCase().includes("egg") || item.name.includes("(E)")) ? "bg-amber-500" : "bg-red-600"}`} />
                                                                </div>

                                                                <h3 className="text-[0.95rem] font-[800] text-gray-800 leading-tight mb-1">
                                                                    {(activeLang === "hi" && item.hiName ? item.hiName : item.name).replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                                                                </h3>

                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-sm font-black text-gray-900">₹{item.sellingPrice || item.price}</span>
                                                                    {item.price && item.sellingPrice && item.sellingPrice < item.price && (
                                                                        <span className="text-[0.7rem] text-gray-400 line-through font-bold">₹{item.price}</span>
                                                                    )}
                                                                </div>

                                                                <p className="text-[0.78rem] text-gray-400 font-[500] leading-relaxed line-clamp-2 mb-2">{item.description || "A delicious treat prepared with love and fresh ingredients."}</p>
                                                            </div>

                                                            {/* Item Image and Add button */}
                                                            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                                <div className={`w-24 h-24 rounded-xl overflow-hidden relative shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center`}>
                                                                    {item.imageUrl || item.image ? (
                                                                        <Image src={(item.imageUrl || item.image) as string} alt={item.name} fill className="object-cover" />
                                                                    ) : (
                                                                        <Utensils className="text-gray-300" size={24} />
                                                                    )}

                                                                    {/* Favorite Heart Toggle */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleFavorite(item.id);
                                                                        }}
                                                                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10 transition-transform active:scale-75"
                                                                    >
                                                                        <span className={`text-[10px] leading-none transition-colors ${favorites.includes(item.id) ? "text-red-500 scale-110 font-bold" : "text-gray-400"}`}>
                                                                            {favorites.includes(item.id) ? "❤️" : "🤍"}
                                                                        </span>
                                                                    </button>
                                                                </div>

                                                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%]">
                                                                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                                                        {cart[item.id] ? (
                                                                            <div className="text-[#701cf5] flex items-center justify-between w-full h-[32px] px-1 font-black">
                                                                                <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }} className="w-7 h-full flex items-center justify-center text-lg hover:bg-[#ede9fe]/25 transition-colors">−</button>
                                                                                <span className="text-xs">{cart[item.id]}</span>
                                                                                <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }} className="w-7 h-full flex items-center justify-center text-lg hover:bg-[#ede9fe]/25 transition-colors">+</button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); addToCart(item.id); }}
                                                                                className="text-[#701cf5] rounded-xl py-1.5 text-xs font-black tracking-wider transition-all w-full flex items-center justify-center gap-1 hover:bg-[#ede9fe]/25"
                                                                            >
                                                                                ADD <Plus size={10} strokeWidth={3} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                                    <div className="text-white text-[0.78rem] font-[900] tracking-wider uppercase">100% Verified QR Reviews</div>
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
                                                            className={`h-full rounded-full ${reviewFilter === star ? 'bg-[#5a14d4]' : 'bg-[#D4A353]'}`}
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
                                        className="mt-3 w-full bg-[#ede9fe]/10 border border-[#ede9fe]/30 rounded-xl py-2 text-[0.72rem] font-[900] text-[#5a14d4] flex items-center justify-center gap-1.5"
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
                                    <div className="bg-[#701cf5] text-white text-[0.65rem] font-[900] px-2.5 py-1.5 rounded-lg shrink-0">Write ✍️</div>
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
                                                            ? 'bg-purple-50 border-purple-200 text-purple-600'
                                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-purple-200 hover:text-purple-500'
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
                                    <div className="text-[0.8rem] text-[#F0EAD6]/55 mb-4 px-10 leading-relaxed">Restaurant Rewards - Earn points on every order!</div>
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
                                        <Clock size={18} className="text-[#701cf5]" /> Active/Recent Orders
                                    </div>
                                    <button
                                        onClick={() => window.location.href = `/track?clerkUserId=${clerkId}`}
                                        className="text-[10px] font-black text-[#701cf5] uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md"
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
                                                        <div className="text-[0.8rem] font-[900] text-[#701cf5]">Order #{id.slice(-6).toUpperCase()}</div>
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
                        className="fixed bottom-8 right-5 z-[105] bg-[#701cf5]/95 backdrop-blur-md text-white rounded-full px-5 py-3 flex items-center gap-2.5 shadow-[0_15px_40px_rgba(21,145,220,0.4)] active:scale-90 border border-white/10"
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
                                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-all group bg-white border border-transparent active:border-[#701cf5]"
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

            {/* ── STICKY CART PILL (Blinkit Style) ── */}
            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[110] px-3 pb-5 transition-all duration-500 ease-out ${cartCount > 0 && !showCartSheet ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
                <div
                    onClick={() => { kravy.open(); setShowCartSheet(true); }}
                    className="bg-[#701cf5] text-white rounded-2xl flex items-center justify-between shadow-[0_8px_40px_rgba(112,28,245,0.45)] active:scale-[0.97] transition-all cursor-pointer overflow-hidden"
                >
                    {/* Left — count badge + item name */}
                    <div className="flex items-center gap-0 flex-1 min-w-0">
                        <div className="bg-white/15 px-4 py-4 shrink-0 flex flex-col items-center justify-center border-r border-white/20 min-w-[60px]">
                            <span className="text-[1.3rem] font-black leading-none">{cartCount}</span>
                            <span className="text-[0.5rem] font-bold text-white/70 uppercase tracking-wider mt-0.5">ITEMS</span>
                        </div>
                        <div className="px-4 min-w-0">
                            <div className="text-[0.8rem] font-black leading-tight truncate">View Cart</div>
                            <div className="text-[0.62rem] font-bold text-white/65 truncate">{profile?.businessName}</div>
                        </div>
                    </div>
                    {/* Right — total + arrow */}
                    <div className="flex items-center gap-1.5 px-4 py-4 shrink-0">
                        <span className="text-[1.05rem] font-black">₹{total}</span>
                        <ChevronRight size={20} strokeWidth={3} className="opacity-80" />
                    </div>
                </div>
            </div>

            {/* ── CART FULL PAGE (Blinkit / Swiggy Style) ── */}
            <AnimatePresence mode="wait">
                {showCartSheet && (
                    <>
                        <motion.div
                            key="cart-page"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="fixed inset-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#F4F4F8] z-[210] flex flex-col overflow-hidden"
                        >
                            {/* ── HEADER ── */}
                            <div className="bg-white px-4 py-3.5 border-b border-[#EBEBEB] flex items-center gap-3 shrink-0 shadow-sm">
                                <button
                                    onClick={() => { kravy.close(); setShowCartSheet(false); }}
                                    className="w-9 h-9 bg-[#F4F4F4] rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                                >
                                    <ChevronRight size={20} className="rotate-180 text-gray-700" strokeWidth={2.5} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[1rem] font-[900] leading-tight truncate">My Cart</h3>
                                    <p className="text-[0.62rem] font-bold text-gray-400 truncate">{profile?.businessName}{tableName ? ` · Table ${tableName}` : ""}</p>
                                </div>
                                <button
                                    onClick={() => { kravy.close(); setShowCartSheet(false); }}
                                    className="text-[0.7rem] font-black text-[#701cf5] uppercase tracking-widest hover:opacity-70 transition-opacity"
                                >
                                    + Add more
                                </button>
                            </div>

                            {/* ── SCROLLABLE BODY ── */}
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-36">
                                {/* ── SECTION: ITEMS ── */}
                                <div className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                    <div className="px-4 pt-4 pb-1 flex items-center gap-2">
                                        <span className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest">🛒 Items in your cart</span>
                                    </div>

                                {/* Combos List */}
                                {combosCart.map((combo, cIdx) => (
                                    <div key={`combo-${cIdx}`} className="px-4 py-3.5 border-b border-[#F5F5F5] flex items-start gap-3">
                                        <div className="w-4 h-4 mt-0.5 bg-indigo-500/20 border border-indigo-400 rounded-sm flex items-center justify-center shrink-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-[800] text-[0.88rem] text-gray-900 truncate">{combo.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}</div>
                                            <div className="space-y-0.5 mt-1">
                                                {combo.selections.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className="text-[0.65rem] text-gray-400 font-bold">• {s.name}</div>
                                                ))}
                                            </div>
                                            <div className="text-[0.78rem] font-black text-gray-800 mt-1.5">₹{combo.price}</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newCart = [...combosCart];
                                                newCart.splice(cIdx, 1);
                                                setCombosCart(newCart);
                                            }}
                                            className="text-[0.62rem] font-black text-red-400 uppercase tracking-widest mt-0.5"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                {/* Variant Items List */}
                                {variantCart.map((vit, vIdx) => (
                                    <div key={vit.uniqueId} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F5F5F5]">
                                        <div className={`w-3.5 h-3.5 border-[1.5px] rounded-sm flex items-center justify-center shrink-0 ${vit.isVeg ? "border-[#22C55E]" : vit.isEgg ? "border-[#F59E0B]" : "border-[#701cf5]"}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${vit.isVeg ? "bg-[#22C55E]" : vit.isEgg ? "bg-[#F59E0B]" : "bg-[#701cf5]"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-[800] text-[0.88rem] text-gray-900 truncate">{vit.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}</div>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {vit.variants.map((v: any, idx: number) => (
                                                    <span key={idx} className="text-[0.6rem] font-[800] text-gray-400 capitalize whitespace-nowrap">
                                                        {v.option}{idx < vit.variants.length - 1 ? " · " : ""}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-[0.75rem] font-black text-gray-700 mt-0.5">₹{vit.totalPrice * vit.qty}</div>
                                        </div>
                                        <div className="flex items-center bg-[#701cf5] rounded-xl h-[32px] w-[88px] shadow-md shadow-[#701cf5]/20 shrink-0">
                                            <button onClick={() => {
                                                const newCart = [...variantCart];
                                                if (vit.qty > 1) { newCart[vIdx].qty -= 1; } 
                                                else { newCart.splice(vIdx, 1); }
                                                setVariantCart(newCart);
                                            }} className="flex-1 text-lg font-black text-white/90 active:bg-white/10 transition-colors rounded-l-xl">−</button>
                                            <span className="w-7 text-center text-[0.82rem] font-black text-white">{vit.qty}</span>
                                            <button onClick={() => {
                                                const newCart = [...variantCart];
                                                newCart[vIdx].qty += 1;
                                                setVariantCart(newCart);
                                            }} className="flex-1 text-lg font-black text-white/90 active:bg-white/10 transition-colors rounded-r-xl">+</button>
                                        </div>
                                    </div>
                                ))}

                                {/* Regular Item List */}
                                <div>
                                    {Object.entries(cart).map(([id, qty]) => {
                                        const item = items.find(i => i.id === id);
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F5F5F5] last:border-0">
                                                <div className={`w-3.5 h-3.5 border-[1.5px] rounded-sm flex items-center justify-center shrink-0 ${item.isVeg ? "border-[#22C55E]" : item.isEgg ? "border-[#F59E0B]" : "border-[#701cf5]"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-[#22C55E]" : item.isEgg ? "bg-[#F59E0B]" : "bg-[#701cf5]"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-[800] text-[0.88rem] text-gray-900 truncate">{item.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}</div>
                                                    <div className="text-[0.7rem] font-bold text-gray-400 mt-0.5">₹{item.sellingPrice || item.price} each</div>
                                                </div>
                                                <div className="flex items-center bg-[#701cf5] rounded-xl h-[32px] w-[88px] shadow-md shadow-[#701cf5]/20 shrink-0">
                                                    <button onClick={() => updateQty(id, -1)} className="flex-1 text-lg font-black text-white/90 active:bg-white/10 transition-colors rounded-l-xl">−</button>
                                                    <span className="w-7 text-center text-[0.82rem] font-black text-white">{qty}</span>
                                                    <button onClick={() => updateQty(id, 1)} className="flex-1 text-lg font-black text-white/90 active:bg-white/10 transition-colors rounded-r-xl">+</button>
                                                </div>
                                                <div className="text-[0.88rem] font-black w-[52px] text-right text-gray-900 shrink-0">₹{(item.sellingPrice || item.price || 0) * qty}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                </div> {/* end items card */}

                                {/* ── PREFERENCES ROW ── */}
                                <div className="mx-3 mt-3 flex gap-2.5">
                                    <button 
                                        onClick={() => { kravy.open(); setShowNoteSheet(true); }}
                                        className={`flex-1 flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all active:scale-95 ${orderNote ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100 shadow-sm"}`}
                                    >
                                        <FileText size={16} className={orderNote ? "text-amber-500" : "text-gray-400"} />
                                        <div className="flex flex-col items-start leading-none gap-0.5 min-w-0">
                                            <span className="text-[0.72rem] font-[800] text-gray-800 whitespace-nowrap">{orderNote ? "Note added" : "Add a note"}</span>
                                            {orderNote && <span className="text-[0.58rem] font-bold text-amber-600 truncate max-w-[100px]">{orderNote}</span>}
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => { kravy.toggle(); setDontSendCutlery(!dontSendCutlery); }}
                                        className={`flex-1 flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all active:scale-95 ${dontSendCutlery ? "bg-purple-50 border-purple-200" : "bg-white border-gray-100 shadow-sm"}`}
                                    >
                                        <Utensils size={16} className={dontSendCutlery ? "text-[#701cf5]" : "text-gray-400"} />
                                        <span className="text-[0.72rem] font-[800] text-gray-800 whitespace-nowrap">No cutlery</span>
                                    </button>
                                </div>

                                {/* ── POPULAR ADDITIONS ── */}
                                {items.filter(it => !cart[it.id] && it.isBestseller).length > 0 && (
                                <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
                                    <div className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Star size={11} fill="currentColor" /> People also order
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                        {items.filter(it => !cart[it.id] && it.isBestseller).slice(0, 8).map(it => (
                                            <div key={it.id} className="min-w-[120px] bg-[#F8F8FB] rounded-xl p-2.5 border border-gray-100 shrink-0">
                                                {(it.imageUrl || it.image) && (
                                                    <div className="relative h-20 w-full rounded-lg overflow-hidden mb-2">
                                                        <img src={it.imageUrl || it.image || "/no-image.png"} alt={it.name} className="w-full h-full object-cover" />
                                                        <div className="absolute top-1 left-1">
                                                            <div className={`w-3 h-3 border border-white rounded-sm flex items-center justify-center ${it.isVeg ? "bg-green-600" : it.isEgg ? "bg-amber-500" : "bg-[#701cf5]"}`}>
                                                                <div className="w-[3px] h-[3px] rounded-full bg-white transition-transform" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="text-[0.7rem] font-black text-gray-800 truncate mb-1.5">{it.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}</div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[0.72rem] font-black text-gray-900">₹{it.sellingPrice || it.price}</span>
                                                    <button 
                                                        onClick={() => { kravy.click(); addToCart(it.id); }}
                                                        className="px-2.5 py-1 bg-[#701cf5] text-white rounded-lg text-[0.6rem] font-black uppercase tracking-widest active:scale-90 transition-transform"
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}

                                {/* ── LOYALTY REDEEM ── */}
                                {customerPhone && (
                                    <div className="mx-3 mt-3 bg-[#FFF8E7] border border-[#D4A353]/25 rounded-2xl p-3.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award size={15} className="text-[#D4A353]" />
                                                <div className="text-[0.78rem] font-[900] text-[#7A5A00]">{loyaltyPoints} Loyalty Points</div>
                                            </div>
                                            <div className={`w-[38px] h-[21px] rounded-full relative cursor-pointer transition-all ${loyaltyOn ? "bg-[#D4A353]" : "bg-gray-200"}`} onClick={() => { kravy.toggle(); setLoyaltyOn(!loyaltyOn); }}>
                                                <div className={`absolute top-[3px] w-[15px] h-[15px] bg-white rounded-full shadow-md transition-all ${loyaltyOn ? "left-[20px]" : "left-[3px]"}`} />
                                            </div>
                                        </div>
                                        {rewards.length > 0 && (
                                            <div className="mt-2">
                                                {(() => {
                                                    const nextReward = rewards.filter(r => r.pointsRequired > loyaltyPoints).sort((a, b) => a.pointsRequired - b.pointsRequired)[0];
                                                    const unlockedRewards = rewards.filter(r => r.pointsRequired <= loyaltyPoints);
                                                    if (nextReward) {
                                                        const progress = (loyaltyPoints / nextReward.pointsRequired) * 100;
                                                        return (<>
                                                            <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#D4A353] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                            </div>
                                                            <p className="text-[0.6rem] font-black text-[#B5892F] uppercase tracking-widest text-center mt-1">
                                                                {nextReward.pointsRequired - loyaltyPoints} pts to unlock {nextReward.title}
                                                            </p>
                                                        </>);
                                                    } else if (unlockedRewards.length > 0) {
                                                        return <p className="text-[0.6rem] font-black text-green-600 uppercase tracking-widest text-center animate-pulse mt-1">✨ Rewards unlocked!</p>;
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── COUPONS ── */}
                                {offers.length > 0 && (
                                    <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag size={14} className="text-[#701cf5]" />
                                            <span className="text-[0.7rem] font-black uppercase tracking-widest text-gray-500">Offers & Coupons</span>
                                        </div>
                                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                                            {offers.map(offer => {
                                                const isDisabled = subtotal < (offer.minOrderValue || 0);
                                                return (
                                                    <div
                                                        key={offer.id}
                                                        className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl border-2 border-dashed flex flex-col gap-0.5 min-w-[120px] transition-all ${isDisabled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-[#f3e8ff] border-[#701cf5]/30'}`}
                                                    >
                                                        <div className={`text-[0.75rem] font-black uppercase tracking-tighter ${isDisabled ? 'text-gray-400' : 'text-[#5a14d4]'}`}>{offer.code || "OFFER"}</div>
                                                        <div className="text-[0.6rem] font-bold text-gray-500">{offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}</div>
                                                        {isDisabled && <div className="text-[0.55rem] font-black text-gray-400">Add ₹{(offer.minOrderValue || 0) - subtotal} more</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── CUSTOMER DETAILS ── */}
                                <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                    <div className="px-4 pt-3.5 pb-3 border-b border-gray-50 flex items-center justify-between">
                                        <div className="text-[0.72rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><User size={11} /> Contact Details</div>
                                        <span className="text-[0.6rem] text-red-400 font-black">* Mandatory</span>
                                    </div>
                                    <div className="px-4 py-3 space-y-2.5">
                                        {/* Name — always mandatory */}
                                        <div className="relative">
                                            <input
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Full Name *"
                                                className={`w-full bg-[#F8F8FB] rounded-xl px-4 py-3 pr-10 text-[0.88rem] font-bold outline-none focus:ring-2 transition-all ${
                                                    customerName.trim() ? "focus:ring-green-400/30" : "focus:ring-red-400/30"
                                                }`}
                                            />
                                            <User size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                        </div>
                                        {/* Phone — always mandatory */}
                                        <div className="relative">
                                            <input
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                placeholder="Mobile Number * (10 digits)"
                                                type="tel"
                                                maxLength={10}
                                                className={`w-full bg-[#F8F8FB] rounded-xl px-4 py-3 pr-10 text-[0.88rem] font-bold outline-none focus:ring-2 transition-all ${
                                                    customerPhone.length === 10 ? "focus:ring-green-400/30" : "focus:ring-red-400/30"
                                                }`}
                                            />
                                            <Phone size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                        </div>
                                    </div>
                                </div>

                                {/* ── DELIVERY ADDRESS (only for delivery) ── */}
                                {serviceType === "delivery" && (
                                    <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-red-100">
                                        <div className="px-4 pt-3.5 pb-3 border-b border-gray-50 flex items-center justify-between gap-2">
                                            <div className="text-[0.72rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={11} /> Delivery Address</div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={detectExactLocation}
                                                    type="button"
                                                    disabled={isGettingLocation}
                                                    className="text-[0.65rem] bg-[#701cf5]/10 text-[#701cf5] hover:bg-[#701cf5]/20 font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 active:scale-95 shrink-0"
                                                >
                                                    {isGettingLocation ? (
                                                        <RefreshCw size={10} className="animate-spin" />
                                                    ) : (
                                                        <Locate size={10} />
                                                    )}
                                                    Detect Location
                                                </button>
                                                <span className="text-[0.6rem] text-red-400 font-black shrink-0">* Mandatory</span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3">
                                            {savedAddresses.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="text-[0.68rem] font-black text-gray-400 uppercase tracking-wider pl-1">Choose Saved Address</div>
                                                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                                                        {savedAddresses.map((addr) => (
                                                            <div
                                                                key={addr.id}
                                                                onClick={() => { kravy.click(); setSelectedAddressId(addr.id); }}
                                                                className={`min-w-[140px] max-w-[180px] p-3 rounded-2xl border-2 transition-all cursor-pointer flex-shrink-0 flex flex-col justify-between ${
                                                                    selectedAddressId === addr.id
                                                                        ? "border-[#701cf5] bg-[#701cf5]/5 shadow-sm"
                                                                        : "border-gray-100 bg-[#F8F8FB]"
                                                                }`}
                                                            >
                                                                <div>
                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                        <span className="text-sm">{addr.label === "Home" ? "🏠" : addr.label === "Work" ? "💼" : "📍"}</span>
                                                                        <span className={`text-[0.72rem] font-black uppercase tracking-wider ${selectedAddressId === addr.id ? "text-[#5a14d4]" : "text-gray-600"}`}>
                                                                            {addr.label}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[0.62rem] text-gray-400 font-bold leading-tight line-clamp-2">
                                                                        {addr.houseNo}, {addr.street}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div
                                                            onClick={() => { kravy.click(); setShowRecentOrders(true); setProfileActiveTab("addresses"); }}
                                                            className="min-w-[120px] p-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#701cf5]/30 cursor-pointer flex-shrink-0 flex flex-col items-center justify-center text-center gap-1"
                                                        >
                                                            <span className="text-xl">+</span>
                                                            <span className="text-[0.65rem] font-black text-[#701cf5] uppercase tracking-wider">Add / Edit</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Selected address summary */}
                                                    {(() => {
                                                        const activeAddr = savedAddresses.find(a => a.id === selectedAddressId);
                                                        if (!activeAddr) return null;
                                                        return (
                                                            <div className="bg-[#F8F8FB] border border-gray-100 rounded-xl p-3 text-[0.72rem] font-bold text-gray-600 leading-normal flex items-start gap-2">
                                                                <span className="text-base shrink-0">📍</span>
                                                                <div>
                                                                    <span className="text-gray-900 font-black uppercase text-[0.65rem] block mb-0.5">{activeAddr.label} Address</span>
                                                                    {activeAddr.houseNo}, {activeAddr.street}, {activeAddr.nearby && `${activeAddr.nearby}, `}{activeAddr.state} - {activeAddr.pin}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <input
                                                            value={delivHouseNo}
                                                            onChange={(e) => setDelivHouseNo(e.target.value)}
                                                            placeholder="House / Flat No. *"
                                                            className="w-full bg-[#F8F8FB] rounded-xl px-3 py-3 text-[0.82rem] font-bold outline-none focus:ring-2 focus:ring-[#701cf5]/20 transition-all"
                                                        />
                                                        <input
                                                            value={delivNearby}
                                                            onChange={(e) => setDelivNearby(e.target.value)}
                                                            placeholder="Nearby Landmark / District"
                                                            className="w-full bg-[#F8F8FB] rounded-xl px-3 py-3 text-[0.82rem] font-bold outline-none focus:ring-2 focus:ring-[#701cf5]/20 transition-all"
                                                        />
                                                    </div>
                                                    <input
                                                        value={delivStreet}
                                                        onChange={(e) => setDelivStreet(e.target.value)}
                                                        placeholder="Street / Colony / Area *"
                                                        className="w-full bg-[#F8F8FB] rounded-xl px-3 py-3 text-[0.82rem] font-bold outline-none focus:ring-2 focus:ring-[#701cf5]/20 transition-all"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <input
                                                            value={delivState}
                                                            onChange={(e) => setDelivState(e.target.value)}
                                                            placeholder="State *"
                                                            className="w-full bg-[#F8F8FB] rounded-xl px-3 py-3 text-[0.82rem] font-bold outline-none focus:ring-2 focus:ring-[#701cf5]/20 transition-all"
                                                        />
                                                        <input
                                                            value={delivPin}
                                                            onChange={(e) => setDelivPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                            placeholder="PIN Code *"
                                                            type="tel"
                                                            maxLength={6}
                                                            className="w-full bg-[#F8F8FB] rounded-xl px-3 py-3 text-[0.82rem] font-bold outline-none focus:ring-2 focus:ring-[#701cf5]/20 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── APPLY COUPON ── */}
                                <div
                                    className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-all"
                                    onClick={() => setShowCouponSheet(true)}
                                >
                                    <div className="px-4 py-3.5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#f3e8ff] rounded-lg flex items-center justify-center">
                                                <Tag size={15} className="text-[#701cf5]" />
                                            </div>
                                            <div>
                                                {appliedCoupon ? (
                                                    <>
                                                        <div className="text-[0.82rem] font-black text-green-600">{appliedCoupon.code} Applied 🎉</div>
                                                        <div className="text-[0.62rem] font-bold text-gray-400">−₹{couponDisc} saved</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-[0.82rem] font-black text-gray-800">Apply Coupon</div>
                                                        <div className="text-[0.62rem] font-bold text-gray-400">{offers.length > 0 ? `${offers.length} offer${offers.length > 1 ? "s" : ""} available` : "Check available offers"}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </div>
                                </div>

                                {/* ── BILL SUMMARY ── */}
                                <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                    <div className="px-4 pt-4 pb-2 border-b border-gray-50">
                                        <div className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">🧾 Bill Summary</div>
                                    </div>
                                    <div className="px-4 py-3 space-y-2.5">
                                        <div className="flex justify-between text-[0.82rem] text-gray-600 font-bold">
                                            <span>Item Total {isInclusive && <span className="text-[0.65rem] text-gray-400 font-normal">(incl. GST)</span>}</span>
                                            <span>₹{subtotal}</span>
                                        </div>
                                        {taxEnabled && tax > 0 && (
                                            <div className="flex justify-between text-[0.82rem] text-gray-600 font-bold">
                                                <span>{isInclusive ? "GST Content" : "GST"} <span className="text-[0.65rem] text-gray-400 font-normal">@ {globalRate}%</span></span>
                                                <span className="text-gray-600">{isInclusive ? "" : "+"}₹{tax.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {serviceType === "delivery" && (
                                            <div className="flex justify-between text-[0.82rem] text-gray-600 font-bold">
                                                <span className="flex items-center gap-1">🛵 Delivery Charge</span>
                                                <span className="text-orange-500">+₹{DELIVERY_CHARGE}</span>
                                            </div>
                                        )}
                                        {couponDisc > 0 && (
                                            <div className="flex justify-between text-[0.82rem] text-green-600 font-bold">
                                                <span>🏷️ Coupon ({appliedCoupon?.code})</span>
                                                <span>−₹{couponDisc}</span>
                                            </div>
                                        )}
                                        {loyaltyDisc > 0 && (
                                            <div className="flex justify-between text-[0.82rem] text-[#D4A353] font-bold">
                                                <span>👑 Loyalty Discount</span>
                                                <span>−₹{loyaltyDisc}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-dashed border-gray-100">
                                            <span className="text-[0.95rem] font-black">To Pay</span>
                                            <span className="text-[1.15rem] font-black text-[#701cf5]">₹{total}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── PAYMENT METHOD ── */}
                                <div className="mx-3 mt-3 mb-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                    <div className="px-4 pt-4 pb-2 border-b border-gray-50">
                                        <div className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest">💳 Payment Method</div>
                                    </div>
                                    <div className="p-3 grid grid-cols-4 gap-2">
                                        {["UPI / QR", "Cash", "Card", "Counter"].map((opt) => (
                                            <div
                                                key={opt}
                                                onClick={() => { kravy.click(); setPaymentMethod(opt === "Counter" ? "Pay on Counter" : opt); }}
                                                className={`rounded-xl p-2.5 text-center cursor-pointer transition-all active:scale-95 border-[1.5px] ${
                                                    (paymentMethod === opt || (opt === "Counter" && paymentMethod === "Pay on Counter"))
                                                        ? "border-[#701cf5] bg-[#f3e8ff]"
                                                        : "border-gray-100 bg-[#F8F8FB]"
                                                }`}
                                            >
                                                <div className="text-[1.3rem] mb-1">
                                                    {opt === "UPI / QR" ? "📱" : opt === "Cash" ? "💵" : opt === "Card" ? "💳" : "🏪"}
                                                </div>
                                                <div className={`text-[0.55rem] font-[800] leading-tight ${
                                                    (paymentMethod === opt || (opt === "Counter" && paymentMethod === "Pay on Counter"))
                                                        ? "text-[#5a14d4]"
                                                        : "text-gray-500"
                                                }`}>
                                                    {opt}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div> {/* end scrollable body */}

                            {/* ── STICKY PAY NOW BUTTON ── */}
                            <div className="shrink-0 bg-white border-t border-gray-100 px-4 pt-3.5 pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
                                <button
                                    onClick={placeOrder}
                                    disabled={orderStatus === "placing"}
                                    className="w-full bg-[#701cf5] text-white rounded-2xl py-4 font-black text-[1rem] shadow-[0_8px_32px_rgba(112,28,245,0.35)] flex items-center justify-between px-5 active:scale-[0.98] transition-all"
                                >
                                    {orderStatus === "placing" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-white/20 rounded-lg w-7 h-7 flex items-center justify-center text-sm font-black">{cartCount}</div>
                                                <span>Place Order</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white/15 px-3 py-1.5 rounded-xl">
                                                <span className="text-[0.95rem] font-black">₹{total}</span>
                                                <ChevronRight size={16} strokeWidth={3} />
                                            </div>
                                        </>
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
                                            <span className="text-[0.8rem] font-bold text-[#333]">{item.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()} × {item.quantity}</span>
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
                                className="w-full bg-[#701cf5] text-white rounded-[14px] py-4 font-black text-sm uppercase tracking-widest shadow-lg shadow-[#701cf5]/30 flex items-center justify-center gap-2"
                            >
                                <History size={20} />
                                Live Status Track Karein
                            </button>
                            <button
                                onClick={() => setOrderStatus("none")}
                                className="w-full border-2 border-[#701cf5] text-[#701cf5] rounded-[14px] py-4 font-black text-sm uppercase tracking-widest active:scale-95 transition-all text-center"
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
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                                {(customizingItem.imageUrl || customizingItem.image) && (
                                    <div className={`relative h-[260px] overflow-hidden bg-gray-50 ${!((customizingItem as any).imageUrl || (customizingItem as any).image) ? "hidden" : ""}`}>
                                        <Image 
                                            src={((customizingItem as any).imageUrl || (customizingItem as any).image) as string} 
                                            alt={customizingItem.name} 
                                            fill 
                                            className="object-cover" 
                                            priority
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                                        <button 
                                            onClick={() => setCustomizingItem(null)}
                                            className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-[210] transition-all"
                                        >
                                            <X size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                )}
                                
                                {!((customizingItem as any).imageUrl || (customizingItem as any).image) && (
                                     <button 
                                        onClick={() => setCustomizingItem(null)}
                                        className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 z-[210] transition-all"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                )}

                                <div className="p-6">
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3.5 h-3.5 border-[1.5px] rounded-sm flex items-center justify-center ${customizingItem.isVeg ? "border-green-600" : (customizingItem as any).isEgg ? "border-amber-500" : "border-[#701cf5]"}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${customizingItem.isVeg ? "bg-green-600" : (customizingItem as any).isEgg ? "bg-amber-500" : "bg-[#701cf5]"}`} />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Curating Selections</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">
                                            {(activeLang === "hi" && customizingItem.hiName ? customizingItem.hiName : customizingItem.name).replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                                        </h3>
                                        <p className="text-[0.78rem] text-gray-500 font-bold leading-relaxed line-clamp-3 opacity-90">{customizingItem.description}</p>
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
                                                            className={`flex items-center justify-between p-4 rounded-[1.25rem] border-2 transition-all cursor-pointer ${isSelected ? "border-[#701cf5] bg-[#ede9fe]/15 shadow-sm" : "border-gray-100 bg-white"}`}
                                                        >
                                                            <div className="flex items-center gap-3.5">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-[#701cf5] bg-[#701cf5] shadow-inner" : "border-gray-300 bg-white"}`}>
                                                                    {isSelected && (
                                                                        vGroup.type === 'radio' 
                                                                            ? <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                            : <Check size={12} className="text-white" strokeWidth={4} />
                                                                    )}
                                                                </div>
                                                                {opt.imageUrl && (
                                                                    <div className="w-10 h-10 rounded-lg overflow-hidden relative shadow-sm border border-gray-100 shrink-0">
                                                                        <Image src={opt.imageUrl} alt={opt.name} fill className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <span className={`text-[0.88rem] font-[800] ${isSelected ? "text-[#5a14d4]" : "text-gray-700"}`}>{opt.name}</span>
                                                            </div>
                                                            {opt.price > 0 && (
                                                                <span className={`text-[0.85rem] font-black italic ${isSelected ? "text-[#701cf5]" : "text-emerald-600"}`}>
                                                                    {vGroup.id === 'virtual_group' ? `₹${opt.price}` : `+₹${opt.price}`}
                                                                </span>
                                                            )}
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
                                                            className={`flex items-center justify-between p-4 rounded-[1.25rem] border-2 transition-all cursor-pointer ${isSelected ? "border-[#701cf5] bg-[#ede9fe]/15 shadow-sm" : "border-gray-100 bg-white"}`}
                                                        >
                                                            <div className="flex items-center gap-3.5">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#701cf5] bg-[#701cf5] shadow-inner" : "border-gray-300 bg-white"}`}>
                                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                </div>
                                                                <span className={`text-[0.88rem] font-[800] ${isSelected ? "text-[#5a14d4]" : "text-gray-700"}`}>{opt.name}</span>
                                                            </div>
                                                            {opt.price > 0 && <span className={`text-[0.85rem] font-black italic ${isSelected ? "text-[#701cf5]" : "text-emerald-600"}`}>+₹{opt.price}</span>}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                            {/* Footer Action */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-100 z-30">
                                <button 
                                    onClick={addVariantItemToCart}
                                    className="w-full bg-[#701cf5] text-white rounded-[1.25rem] h-[64px] font-black uppercase tracking-[0.15em] text-[0.9rem] shadow-2xl shadow-[#701cf5]/20 flex items-center justify-between px-10 active:scale-95 transition-all"
                                >
                                    <span className="flex items-center gap-2">Add To Cart <ArrowRight size={18} /></span>
                                    <span className="text-lg italic tracking-tighter">₹{
                                        (
                                            (customizingItem as any).isVirtualGroup 
                                                ? (selectedVariants['virtual_group']?.price || 0) 
                                                : (customizingItem.sellingPrice || customizingItem.price || 0)
                                        ) + 
                                        Object.entries(selectedVariants).reduce((acc, [gid, val]) => {
                                            if (gid === 'virtual_group') return acc;
                                            if (gid.startsWith('ag_')) {
                                               return acc + ((val as any[])?.reduce?.((s, o) => s + (o.price || 0), 0) || 0);
                                            }
                                            const group = (customizingItem.variants as any[])?.find((g: any) => g.id === gid);
                                            if (group?.type === "radio") return acc + (val?.price || 0);
                                            if (group?.type === "checkbox") return acc + (val?.reduce?.((s: number, o: any) => s + (o.price || 0), 0) || 0);
                                            return acc;
                                        }, 0)
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

                            {/* Favorite Heart Toggle inside detailed modal */}
                            <button 
                                onClick={() => toggleFavorite(selectedMenuItem.id)}
                                className="absolute top-6 right-17 w-9 h-9 bg-gray-100/30 hover:bg-gray-200/50 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 z-[210] transition-transform active:scale-75"
                            >
                                <span className="text-sm leading-none">
                                    {favorites.includes(selectedMenuItem.id) ? "❤️" : "🤍"}
                                </span>
                            </button>

                            <div className="overflow-y-auto max-h-[85vh] no-scrollbar pt-6">
                                {(selectedMenuItem.imageUrl || selectedMenuItem.image) && (
                                    <div className={`relative h-[280px] mx-4 rounded-2xl overflow-hidden bg-gray-100/50 ${!(selectedMenuItem.imageUrl || selectedMenuItem.image) ? "hidden" : ""}`}>
                                        <Image 
                                            src={(selectedMenuItem.imageUrl || selectedMenuItem.image) as string} 
                                            alt={selectedMenuItem.name} 
                                            fill 
                                            className="object-cover"
                                            priority
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                )}

                                {/* Content Details */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-4 h-4 border-[1.5px] rounded-sm flex items-center justify-center ${selectedMenuItem.isVeg ? "border-green-600" : (selectedMenuItem as any).isEgg ? "border-amber-500" : "border-[#701cf5]"}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedMenuItem.isVeg ? "bg-green-600" : (selectedMenuItem as any).isEgg ? "bg-amber-500" : "bg-[#701cf5]"}`} />
                                        </div>
                                        {selectedMenuItem.isBestseller && (
                                            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Star size={10} fill="currentColor" /> Bestseller
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h2 className="text-[1.5rem] font-black text-gray-900 leading-[1.1]">
                                            {(activeLang === "hi" && selectedMenuItem.hiName ? selectedMenuItem.hiName : selectedMenuItem.name).replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                                        </h2>
                                    </div>
                                    
                                    {/* Base Price in Modal */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[1.2rem] font-[800] text-gray-900 leading-tight">₹{selectedMenuItem.sellingPrice || selectedMenuItem.price || 0}</span>
                                        {selectedMenuItem.price && selectedMenuItem.sellingPrice && selectedMenuItem.sellingPrice < selectedMenuItem.price && (
                                            <>
                                                <span className="text-[0.9rem] text-gray-400 line-through font-bold">₹{selectedMenuItem.price}</span>
                                                <span className="text-[0.85rem] font-black text-[#701cf5]">{Math.round(((selectedMenuItem.price - selectedMenuItem.sellingPrice) / selectedMenuItem.price) * 100)}% OFF</span>
                                            </>
                                        )}
                                    </div>

                                    {(selectedMenuItem as any)._count?.reviews > 0 && (
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="flex items-center gap-0.5">
                                                {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= (selectedMenuItem.rating || 5) ? "text-amber-400" : "text-gray-200"} fill={s <= (selectedMenuItem.rating || 5) ? "currentColor" : "none"} />)}
                                            </div>
                                            <div className="w-[1px] h-3 bg-gray-200" />
                                            <div className="h-2 w-20 bg-green-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[85%] rounded-full" />
                                            </div>
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                                                {(selectedMenuItem as any)._count.reviews} { (selectedMenuItem as any)._count.reviews === 1 ? 'Review' : 'Reviews' }
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Chef's Description</div>
                                        <p className="text-[15px] text-gray-600 font-medium leading-[1.6]">
                                            {selectedMenuItem.description || "A delicious treat prepared with love and fresh ingredients."}
                                        </p>
                                    </div>

                                    {/* Link Addon Groups Interactive Selection (Zomato Style) */}
                                    {(selectedMenuItem.addonGroups || selectedMenuItem.variants) && (
                                        <div className="mt-10 space-y-10 pb-20">
                                            {/* Standard Variants */}
                                            {(selectedMenuItem.variants as any[])?.map((vGroup: any) => (
                                                <div key={vGroup.id} className="space-y-4">
                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                        <h4 className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-gray-500">{vGroup.name}</h4>
                                                        {vGroup.required && <span className="text-[0.55rem] font-black text-white bg-[#5a14d4] px-2 py-0.5 rounded uppercase tracking-widest">Required</span>}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {vGroup.options.map((opt: any) => {
                                                            const isSelected = vGroup.type === "radio" 
                                                                ? selectedVariants[vGroup.id]?.id === opt.id
                                                                : selectedVariants[vGroup.id]?.some((o: any) => o.id === opt.id);
                                                            return (
                                                                <div 
                                                                    key={opt.id} 
                                                                    onClick={() => {
                                                                        kravy.click();
                                                                        const updated = { ...selectedVariants };
                                                                        if (vGroup.type === "radio") updated[vGroup.id] = opt;
                                                                        else {
                                                                            const arr = updated[vGroup.id] || [];
                                                                            updated[vGroup.id] = isSelected ? arr.filter((o: any) => o.id !== opt.id) : [...arr, opt];
                                                                        }
                                                                        setSelectedVariants(updated);
                                                                    }}
                                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-[#701cf5] bg-[#ede9fe]/15" : "border-gray-100 bg-white"}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#701cf5] bg-[#701cf5]" : "border-gray-300 bg-white"}`}>
                                                                            {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={`text-[0.85rem] font-[800] ${isSelected ? "text-[#5a14d4]" : "text-gray-700"}`}>{opt.name}</span>
                                                                    </div>
                                                                    {opt.price > 0 && <span className="text-[0.8rem] font-black text-gray-900">+₹{opt.price}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Addon Groups Mapping */}
                                            {(selectedMenuItem.addonGroups as any[])?.map((ag: any) => (
                                                <div key={ag.id} className="space-y-4">
                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                        <h4 className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-gray-500">{ag.name}</h4>
                                                        {ag.isCompulsory && <span className="text-[0.55rem] font-black text-white bg-[#5a14d4] px-2 py-0.5 rounded uppercase tracking-widest">Mandatory</span>}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {(ag.items as any[]).map((opt: any) => {
                                                            const isSelected = selectedVariants[`ag_${ag.id}`]?.some((o: any) => o.name === opt.name);
                                                            return (
                                                                <div 
                                                                    key={opt.name} 
                                                                    onClick={() => {
                                                                        kravy.click();
                                                                        const updated = { ...selectedVariants };
                                                                        const arr = updated[`ag_${ag.id}`] || [];
                                                                        if (isSelected) updated[`ag_${ag.id}`] = arr.filter((o: any) => o.name !== opt.name);
                                                                        else {
                                                                            if (ag.maxSelection && arr.length >= ag.maxSelection) return toast.error(`Max ${ag.maxSelection} selections allowed`);
                                                                            updated[`ag_${ag.id}`] = [...arr, opt];
                                                                        }
                                                                        setSelectedVariants(updated);
                                                                    }}
                                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-[#701cf5] bg-[#ede9fe]/15" : "border-gray-100 bg-white"}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#701cf5] bg-[#701cf5]" : "border-gray-300 bg-white"}`}>
                                                                            {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={`text-[0.85rem] font-[800] ${isSelected ? "text-[#5a14d4]" : "text-gray-700"}`}>{opt.name}</span>
                                                                    </div>
                                                                    {opt.price > 0 && <span className="text-[0.8rem] font-black text-gray-900">+₹{opt.price}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Action Footer */}
                            <div className="p-5 bg-white border-t border-gray-100/50 flex items-center gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] box-border">
                                {(!selectedMenuItem.addonGroups || selectedMenuItem.addonGroups.length === 0) && (!selectedMenuItem.variants || (selectedMenuItem.variants as any[]).length === 0) ? (
                                    <>
                                        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl h-[60px] px-2 min-w-[130px]">
                                            <button 
                                                onClick={() => updateQty(selectedMenuItem.id, -1)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#701cf5] transition-colors text-2xl font-black active:scale-75"
                                            >
                                                −
                                            </button>
                                            <span className="text-xl font-black text-gray-800">{cart[selectedMenuItem.id] || 1}</span>
                                            <button 
                                                onClick={() => addToCart(selectedMenuItem.id)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#701cf5] transition-colors text-2xl font-black active:scale-75"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!cart[selectedMenuItem.id]) addToCart(selectedMenuItem.id);
                                                setSelectedMenuItem(null);
                                            }}
                                            className="flex-1 bg-[#701cf5] text-white rounded-2xl h-[60px] font-black text-[1.1rem] shadow-xl shadow-[#701cf5]/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                        >
                                            Add item · ₹{(selectedMenuItem.sellingPrice || selectedMenuItem.price || 0) * (cart[selectedMenuItem.id] || 1)}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={addVariantItemToCart}
                                        className="flex-1 bg-[#701cf5] text-white rounded-2xl h-[60px] font-black text-[1.1rem] shadow-xl shadow-[#ede9fe]/30 flex items-center justify-between px-6 active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-2 uppercase tracking-widest text-[0.85rem] font-black group">
                                            <span>Add to cart</span>
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <span className="font-mono text-lg">₹{
                                            ((selectedMenuItem.sellingPrice || selectedMenuItem.price || 0) + 
                                            Object.entries(selectedVariants).reduce((acc, [gid, val]) => {
                                                if (gid.startsWith('ag_')) return acc + ((val as any[])?.reduce?.((s, o) => s + (o.price || 0), 0) || 0);
                                                const group = (selectedMenuItem.variants as any[])?.find((g: any) => g.id === gid);
                                                if (group?.type === "radio") return acc + (val?.price || 0);
                                                if (group?.type === "checkbox") return acc + (val?.reduce?.((s: number, o: any) => s + (o.price || 0), 0) || 0);
                                                return acc;
                                            }, 0)).toFixed(0)
                                        }</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STORE COUPONS BOTTOM SHEET */}
            <AnimatePresence>
                {showCouponSheet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[320] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => { kravy.close(); setShowCouponSheet(false); }}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[480px] bg-white rounded-t-[2.5rem] flex flex-col shadow-2xl relative max-h-[85vh]"
                        >
                            {/* Drag Handle / Accent */}
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-xl font-[Syne] font-black text-gray-900 flex items-center gap-2">
                                        Store Coupons <span className="text-lg">🏷️</span>
                                    </h3>
                                    <p className="text-[0.68rem] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        Select a discount for your order
                                    </p>
                                </div>
                                <button
                                    onClick={() => { kravy.close(); setShowCouponSheet(false); }}
                                    className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Coupon Body Container */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                                {offers.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                                            😔
                                        </div>
                                        <h4 className="text-[1.05rem] font-black text-gray-800">No coupons available</h4>
                                        <p className="text-[0.78rem] text-gray-400 font-bold max-w-[220px] mt-1 leading-relaxed">
                                            Currently there are no active promotional offers at this store.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {offers.map((offer) => {
                                            const minVal = offer.minOrderValue || 0;
                                            const isApplicable = subtotal >= minVal;
                                            const isCurrentlyApplied = appliedCoupon?.id === offer.id;

                                            return (
                                                <div
                                                    key={offer.id}
                                                    className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col justify-between ${
                                                        isCurrentlyApplied
                                                            ? "border-[#701cf5] bg-[#701cf5]/5 shadow-sm"
                                                            : isApplicable
                                                            ? "border-gray-200 bg-white hover:border-gray-300"
                                                            : "border-gray-100 bg-gray-50/50 opacity-70"
                                                    }`}
                                                >
                                                    {/* Coupon Left Semi-Circle Notch */}
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[9px] w-4 h-4 rounded-full bg-white border border-gray-200 border-l-transparent z-10" />
                                                    {/* Coupon Right Semi-Circle Notch */}
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[9px] w-4 h-4 rounded-full bg-white border border-gray-200 border-r-transparent z-10" />

                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-[Syne] font-black text-[#701cf5] tracking-tight text-[1.1rem]">
                                                                    {offer.code}
                                                                </span>
                                                                {isCurrentlyApplied && (
                                                                    <span className="bg-green-100 text-green-700 text-[0.58rem] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">
                                                                        Applied
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h5 className="text-[0.82rem] font-black text-gray-800 leading-tight">
                                                                {offer.title}
                                                            </h5>
                                                            {offer.description && (
                                                                <p className="text-[0.7rem] text-gray-400 font-bold leading-normal">
                                                                    {offer.description}
                                                                </p>
                                                            )}
                                                            {minVal > 0 && (
                                                                <p className="text-[0.65rem] text-[#701cf5] font-bold">
                                                                    Min order: ₹{minVal}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            <div className="text-right">
                                                                <span className="text-[1.05rem] font-black text-gray-900 leading-tight">
                                                                    {offer.discountType === "PERCENTAGE"
                                                                        ? `${offer.discountValue}% OFF`
                                                                        : `₹${offer.discountValue} OFF`}
                                                                </span>
                                                            </div>

                                                            {isCurrentlyApplied ? (
                                                                <button
                                                                    onClick={() => {
                                                                        kravy.remove();
                                                                        setAppliedCoupon(null);
                                                                        toast.info("Coupon removed");
                                                                    }}
                                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-[0.68rem] px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest"
                                                                >
                                                                    Remove
                                                                </button>
                                                            ) : isApplicable ? (
                                                                <button
                                                                    onClick={() => {
                                                                        kravy.success();
                                                                        setAppliedCoupon(offer);
                                                                        setShowCouponSheet(false);
                                                                        toast.success(`Coupon ${offer.code} applied! 🎉`);
                                                                    }}
                                                                    className="bg-[#701cf5] hover:bg-[#5a14d4] text-white font-black text-[0.68rem] px-4 py-1.5 rounded-xl transition-all uppercase tracking-widest shadow-md shadow-[#701cf5]/10 active:scale-95"
                                                                >
                                                                    Apply
                                                                </button>
                                                            ) : (
                                                                <div className="text-right space-y-0.5">
                                                                    <span className="text-[0.62rem] font-bold text-gray-400 block leading-tight">
                                                                        Add ₹{minVal - subtotal} more
                                                                    </span>
                                                                    <span className="text-[0.58rem] font-black text-red-400 uppercase tracking-widest block leading-tight">
                                                                        Locked
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer / Remove Active Coupon Action */}
                            {appliedCoupon && (
                                <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">
                                            ✓
                                        </div>
                                        <div>
                                            <span className="text-[0.7rem] font-black text-gray-400 uppercase tracking-wider block">Currently Applied</span>
                                            <span className="text-[0.82rem] font-black text-green-700">{appliedCoupon.code}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            kravy.remove();
                                            setAppliedCoupon(null);
                                            toast.info("Coupon removed");
                                        }}
                                        className="text-[0.72rem] font-black text-red-500 hover:text-red-600 uppercase tracking-widest hover:underline transition-all"
                                    >
                                        Remove Code
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PROFILE & PAST ORDERS BOTTOM DRAWER */}
            <AnimatePresence>
                {showRecentOrders && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[320] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => { kravy.close(); setShowRecentOrders(false); }}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[480px] bg-[#F8F9FA] rounded-t-[2.5rem] flex flex-col shadow-2xl relative max-h-[90vh]"
                        >
                            {/* Drag Handle / Accent */}
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                            {/* Header */}
                            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-xl font-[Syne] font-black text-gray-900 flex items-center gap-2">
                                        My Profile 👤
                                    </h3>
                                    <p className="text-[0.68rem] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        Manage account & view past orders
                                    </p>
                                </div>
                                <button
                                    onClick={() => { kravy.close(); setShowRecentOrders(false); }}
                                    className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Body Scrollable Area */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
                                {/* Profile Edit details Card */}
                                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4 shrink-0">
                                    <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(customerName || "Guest")} flex items-center justify-center relative overflow-hidden shadow-md shadow-[#701cf5]/10`}>
                                            <Image
                                                src={getAvatarUrl(customerName, "profile")}
                                                alt={customerName || "G"}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-[1.05rem] font-black text-gray-900 leading-tight">
                                                {customerName || "Guest Account"}
                                            </h4>
                                            <p className="text-[0.72rem] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                {customerPhone || "Mobile number not linked"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider pl-1 mb-1 block">Full Name</label>
                                            <input
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full bg-[#F8F8FB] border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#701cf5] focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider pl-1 mb-1 block">Mobile Number</label>
                                            <input
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                placeholder="Enter mobile number"
                                                type="tel"
                                                maxLength={10}
                                                className="w-full bg-[#F8F8FB] border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#701cf5] focus:bg-white transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                localStorage.setItem("kravy_customer_name", customerName);
                                                localStorage.setItem("kravy_customer_phone", customerPhone);
                                                kravy.success();
                                                toast.success("Profile details updated successfully! 💾");
                                            }}
                                            className="w-full bg-[#701cf5] hover:bg-[#5a14d4] text-white text-xs font-black uppercase tracking-widest py-3 rounded-2xl transition-all shadow-md shadow-[#701cf5]/15 active:scale-[0.98]"
                                        >
                                            Save Details
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Swiggy/Zomato Tabs Switcher */}
                                <div className="flex bg-white border border-gray-100 p-1.5 rounded-2xl shrink-0 gap-1.5 shadow-sm">
                                    {(["orders", "addresses", "favorites"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => {
                                                kravy.click();
                                                setProfileActiveTab(tab);
                                            }}
                                            className={`flex-1 py-2.5 rounded-xl text-[0.72rem] font-black uppercase tracking-wider transition-all ${
                                                profileActiveTab === tab
                                                    ? "bg-[#701cf5] text-white shadow-sm"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            }`}
                                        >
                                            {tab === "orders" ? "📦 Orders" : tab === "addresses" ? "🏠 Addresses" : "❤️ Favorites"}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Tab Panels */}
                                <div className="space-y-4">
                                    {/* 📦 ORDERS PANEL */}
                                    {profileActiveTab === "orders" && (
                                        <div className="space-y-3">
                                            <h4 className="text-[0.8rem] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                                <History size={13} /> Order History ({recentOrderIds.length})
                                            </h4>

                                            {loadingPastOrders ? (
                                                <div className="space-y-3">
                                                    {[1, 2].map((i) => (
                                                        <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-3">
                                                            <div className="h-4 bg-gray-100 rounded w-1/3" />
                                                            <div className="h-3 bg-gray-50 rounded w-2/3" />
                                                            <div className="h-10 bg-gray-50 rounded-2xl w-full" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : pastOrders.length === 0 ? (
                                                <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
                                                    <span className="text-3xl mb-2.5 block">🍔</span>
                                                    <h5 className="text-[0.92rem] font-black text-gray-800">No past orders</h5>
                                                    <p className="text-[0.72rem] text-gray-400 font-bold max-w-[200px] mx-auto mt-1 leading-relaxed">
                                                        Order some delicious items from our menu to see them here!
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {pastOrders.map((order) => {
                                                        const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        });
                                                        
                                                        const itemsList = (order.items as any[])?.map(it => {
                                                            const itName = it.name?.replace(/\s?\((V|NV|R)\)/gi, "").trim();
                                                            return `${itName} × ${it.quantity}`;
                                                        }).join(", ") || "Order details";

                                                        const isOrderPending = ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(order.status);
                                                        
                                                        return (
                                                            <div key={order.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:border-[#701cf5]/20 transition-all flex flex-col gap-3">
                                                                <div className="flex items-start justify-between border-b border-gray-50 pb-2.5">
                                                                    <div className="min-w-0 flex-1 pr-2">
                                                                        <span className="text-[0.7rem] font-black text-gray-400 block uppercase tracking-wide">ID: #{order.id.slice(-6).toUpperCase()}</span>
                                                                        <span className="text-[0.72rem] text-gray-500 font-bold block mt-0.5 leading-tight">{dateStr}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-sm font-black text-gray-900 block leading-tight">₹{order.total}</span>
                                                                        <span className={`text-[0.58rem] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mt-1 border ${
                                                                            order.status === "COMPLETED" ? "bg-green-50 border-green-200 text-green-700" :
                                                                            order.status === "CANCELLED" ? "bg-red-50 border-red-200 text-red-700" :
                                                                            "bg-purple-50 border-purple-200 text-[#701cf5]"
                                                                        }`}>
                                                                            {order.status}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="text-[0.78rem] text-gray-600 font-medium line-clamp-2 leading-relaxed">
                                                                        {itemsList}
                                                                    </span>
                                                                    {order.table?.name && (
                                                                        <span className="text-[0.62rem] font-black uppercase bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-md inline-block mt-2 tracking-widest">
                                                                            Table: {order.table.name}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2 mt-1 shrink-0">
                                                                    {isOrderPending ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                kravy.click();
                                                                                window.location.href = `/order-tracking/${order.id}`;
                                                                            }}
                                                                            className="bg-[#701cf5] text-white font-black text-[0.68rem] uppercase tracking-widest py-3 rounded-2xl text-center active:scale-95 transition-all shadow-md shadow-[#701cf5]/15 flex items-center justify-center gap-1"
                                                                        >
                                                                            <Locate size={12} /> Track Live
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => {
                                                                                kravy.success();
                                                                                // Auto re-add items to cart
                                                                                const updatedCart = { ...cart };
                                                                                (order.items as any[])?.forEach(it => {
                                                                                    if (!it.isCombo && !it.variants) {
                                                                                        updatedCart[it.itemId] = (updatedCart[it.itemId] || 0) + (it.quantity || 1);
                                                                                    }
                                                                                });
                                                                                setCart(updatedCart);
                                                                                setShowRecentOrders(false);
                                                                                toast.success("Items re-added to cart! 🛒");
                                                                            }}
                                                                            className="bg-purple-50 hover:bg-[#ede9fe]/40 text-[#701cf5] font-black text-[0.68rem] uppercase tracking-widest py-3 rounded-2xl text-center active:scale-95 transition-all"
                                                                        >
                                                                            Reorder 🔄
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => {
                                                                            kravy.success();
                                                                            setSelectedInvoice(order);
                                                                        }}
                                                                        className="border-[1.5px] border-gray-100 hover:border-gray-200 bg-white text-gray-700 font-black text-[0.68rem] uppercase tracking-widest py-3 rounded-2xl text-center active:scale-95 transition-all flex items-center justify-center gap-1"
                                                                    >
                                                                        <FileText size={12} /> Invoice 🧾
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 🏠 ADDRESSES PANEL */}
                                    {profileActiveTab === "addresses" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between pl-1">
                                                <h4 className="text-[0.8rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <MapPin size={13} /> Saved Addresses ({savedAddresses.length})
                                                </h4>
                                                {!showAddAddressForm && (
                                                    <button
                                                        onClick={() => { kravy.click(); setShowAddAddressForm(true); }}
                                                        className="text-[0.7rem] bg-[#701cf5] text-white hover:bg-[#5a14d4] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                                                    >
                                                        + Add New
                                                    </button>
                                                )}
                                            </div>

                                            {showAddAddressForm ? (
                                                <div className="bg-white rounded-3xl p-5 border border-[#701cf5]/20 shadow-md space-y-4 animate-fadeIn">
                                                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                                        <span className="text-[0.78rem] font-black text-gray-800 uppercase tracking-wide">Add New Address</span>
                                                        <button
                                                            onClick={() => { kravy.click(); setShowAddAddressForm(false); }}
                                                            className="text-[0.68rem] font-black text-red-500 hover:text-red-600 uppercase tracking-wider"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[0.62rem] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Address Label</label>
                                                            <div className="flex gap-2">
                                                                {(["Home", "Work", "Other"] as const).map((lbl) => (
                                                                    <button
                                                                        key={lbl}
                                                                        type="button"
                                                                        onClick={() => { kravy.click(); setNewAddrLabel(lbl); }}
                                                                        className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                                                            newAddrLabel === lbl
                                                                                ? "bg-[#701cf5]/10 border-[#701cf5] text-[#701cf5]"
                                                                                : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200"
                                                                        }`}
                                                                    >
                                                                        {lbl === "Home" ? "🏠 Home" : lbl === "Work" ? "💼 Work" : "📍 Other"}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={detectNewAddressLocation}
                                                            type="button"
                                                            disabled={isGettingLocation}
                                                            className="w-full bg-[#701cf5]/10 hover:bg-[#701cf5]/20 text-[#701cf5] font-black py-2.5 rounded-xl text-[0.72rem] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                                        >
                                                            {isGettingLocation ? (
                                                                <>
                                                                    <RefreshCw size={12} className="animate-spin" />
                                                                    Detecting coordinates...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Locate size={12} />
                                                                    Auto-Detect Location (GPS) 📍
                                                                </>
                                                            )}
                                                        </button>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[0.62rem] font-black text-gray-400 uppercase tracking-wider block mb-1">House / Flat No. *</label>
                                                                <input
                                                                    value={newAddrHouseNo}
                                                                    onChange={(e) => setNewAddrHouseNo(e.target.value)}
                                                                    placeholder="e.g. 102, 1st Floor"
                                                                    className="w-full bg-[#F8F8FB] border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#701cf5] transition-all"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[0.62rem] font-black text-gray-400 uppercase tracking-wider block mb-1">Landmark / District</label>
                                                                <input
                                                                    value={newAddrNearby}
                                                                    onChange={(e) => setNewAddrNearby(e.target.value)}
                                                                    placeholder="e.g. Near Metro Station"
                                                                    className="w-full bg-[#F8F8FB] border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#701cf5] transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-[0.62rem] font-black text-gray-400 uppercase tracking-wider block mb-1">Street / Colony / Area *</label>
                                                            <input
                                                                value={newAddrStreet}
                                                                onChange={(e) => setNewAddrStreet(e.target.value)}
                                                                placeholder="e.g. Main Street, Sector 4"
                                                                className="w-full bg-[#F8F8FB] border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#701cf5] transition-all"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[0.62rem] font-black text-gray-400 uppercase tracking-wider block mb-1">State *</label>
                                                                <input
                                                                    value={newAddrState}
                                                                    onChange={(e) => setNewAddrState(e.target.value)}
                                                                    placeholder="e.g. Delhi"
                                                                    className="w-full bg-[#F8F8FB] border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#701cf5] transition-all"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[0.62rem] font-black text-gray-400 uppercase tracking-wider block mb-1">PIN Code *</label>
                                                                <input
                                                                    value={newAddrPin}
                                                                    onChange={(e) => setNewAddrPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                                    placeholder="e.g. 110001"
                                                                    type="tel"
                                                                    maxLength={6}
                                                                    className="w-full bg-[#F8F8FB] border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#701cf5] transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={addSavedAddress}
                                                            className="w-full bg-[#701cf5] hover:bg-[#5a14d4] text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-[0.98] mt-2"
                                                        >
                                                            Save Address
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {savedAddresses.length === 0 ? (
                                                <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
                                                    <span className="text-3xl mb-2.5 block">📍</span>
                                                    <h5 className="text-[0.92rem] font-black text-gray-800">No saved addresses</h5>
                                                    <p className="text-[0.72rem] text-gray-400 font-bold max-w-[220px] mx-auto mt-1 leading-relaxed">
                                                        Add a saved address to quickly checkout next time you order!
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {savedAddresses.map((addr) => (
                                                        <div
                                                            key={addr.id}
                                                            onClick={() => {
                                                                kravy.click();
                                                                setSelectedAddressId(addr.id);
                                                            }}
                                                            className={`bg-white rounded-3xl p-4 border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                                                selectedAddressId === addr.id
                                                                    ? "border-[#701cf5] shadow-sm shadow-[#701cf5]/5"
                                                                    : "border-gray-100"
                                                            }`}
                                                        >
                                                            <div className="flex gap-3 min-w-0">
                                                                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-base">
                                                                    {addr.label === "Home" ? "🏠" : addr.label === "Work" ? "💼" : "📍"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className={`text-[0.78rem] font-black uppercase tracking-wide block ${
                                                                        selectedAddressId === addr.id ? "text-[#701cf5]" : "text-gray-700"
                                                                    }`}>
                                                                        {addr.label} Address {selectedAddressId === addr.id && "✓"}
                                                                    </span>
                                                                    <p className="text-[0.72rem] text-gray-500 font-bold mt-1 leading-relaxed">
                                                                        {addr.houseNo}, {addr.street}, {addr.nearby && `${addr.nearby}, `}{addr.state} - {addr.pin}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteSavedAddress(addr.id);
                                                                }}
                                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors shrink-0"
                                                                title="Delete Address"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ❤️ FAVORITES PANEL */}
                                    {profileActiveTab === "favorites" && (() => {
                                        const favItems = items.filter((it) => favorites.includes(it.id));
                                        return (
                                            <div className="space-y-4">
                                                <h4 className="text-[0.8rem] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                                    ❤️ Favorite Dishes ({favItems.length})
                                                </h4>

                                                {favItems.length === 0 ? (
                                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
                                                        <span className="text-3xl mb-2.5 block">❤️</span>
                                                        <h5 className="text-[0.92rem] font-black text-gray-800">No favorite dishes</h5>
                                                        <p className="text-[0.72rem] text-gray-400 font-bold max-w-[220px] mx-auto mt-1 leading-relaxed">
                                                            Tap the heart icon on any dish in the menu to save it here!
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {favItems.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="bg-white rounded-3xl p-3 border border-gray-100 flex items-center justify-between gap-3 shadow-sm"
                                                            >
                                                                <div className="flex gap-3 items-center min-w-0">
                                                                    {/* Thumbnail */}
                                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-sm border border-gray-50 bg-gray-50 flex items-center justify-center shrink-0">
                                                                        {item.imageUrl || item.image ? (
                                                                            <Image
                                                                                src={(item.imageUrl || item.image) as string}
                                                                                alt={item.name}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        ) : (
                                                                            <Utensils className="text-gray-300" size={18} />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5 mb-1">
                                                                            <div className={`w-[11px] h-[11px] border-[1px] rounded-sm flex items-center justify-center shrink-0 ${item.isVeg && !item.name.includes("(NV)") && !item.name.toLowerCase().includes("egg") ? "border-green-600" : (item.isEgg || item.name.toLowerCase().includes("egg") || item.name.includes("(E)")) ? "border-amber-500" : "border-red-600"}`}>
                                                                                <div className={`w-[5px] h-[5px] rounded-full ${item.isVeg && !item.name.includes("(NV)") && !item.name.toLowerCase().includes("egg") ? "bg-green-600" : (item.isEgg || item.name.toLowerCase().includes("egg") || item.name.includes("(E)")) ? "bg-amber-500" : "bg-red-600"}`} />
                                                                            </div>
                                                                            <span className="text-xs font-black text-gray-900 leading-tight truncate">
                                                                                {item.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[0.72rem] font-bold text-gray-400">₹{item.sellingPrice || item.price}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {/* Add to Cart component */}
                                                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-20 h-[30px] flex items-center justify-center">
                                                                        {cart[item.id] ? (
                                                                            <div className="text-[#701cf5] flex items-center justify-between w-full h-full px-1.5 font-black">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        updateQty(item.id, -1);
                                                                                    }}
                                                                                    className="text-sm shrink-0"
                                                                                >
                                                                                    −
                                                                                </button>
                                                                                <span className="text-[0.68rem]">{cart[item.id]}</span>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        updateQty(item.id, 1);
                                                                                    }}
                                                                                    className="text-sm shrink-0"
                                                                                >
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    addToCart(item.id);
                                                                                }}
                                                                                className="text-[#701cf5] text-[0.68rem] font-black tracking-wider w-full h-full flex items-center justify-center gap-0.5 hover:bg-[#ede9fe]/25"
                                                                            >
                                                                                ADD <Plus size={8} strokeWidth={3} />
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Remove Favorite Button */}
                                                                    <button
                                                                        onClick={() => toggleFavorite(item.id)}
                                                                        className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors shrink-0"
                                                                        title="Remove from favorites"
                                                                    >
                                                                        ❤️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DETAILED RESTAURANT RECEIPT / INVOICE MODAL OVERLAY */}
            <AnimatePresence>
                {selectedInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[330] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => { kravy.close(); setSelectedInvoice(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-[380px] rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
                        >
                            {/* Receipt Top Wave Accent */}
                            <div className="h-2 bg-[#701cf5] w-full shrink-0" />

                            {/* Close Button */}
                            <button
                                onClick={() => { kravy.close(); setSelectedInvoice(null); }}
                                className="absolute top-4 right-4 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 transition-colors z-10"
                            >
                                <X size={15} strokeWidth={3} />
                            </button>

                            {/* Receipt Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
                                {/* Header / Business Logo */}
                                <div className="text-center space-y-1">
                                    <div className="text-3xl">🧾</div>
                                    <h3 className="text-lg font-[Syne] font-black text-gray-900 tracking-tight leading-tight">
                                        {profile?.businessName || "Restaurant Invoice"}
                                    </h3>
                                    {profile?.businessAddress && (
                                        <p className="text-[0.62rem] text-gray-400 font-bold max-w-[220px] mx-auto leading-normal">
                                            {profile.businessAddress}
                                        </p>
                                    )}
                                </div>

                                {/* Order Metadata Details */}
                                <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1 text-[0.72rem] text-gray-500 font-bold">
                                    <div className="flex justify-between">
                                        <span>Order ID</span>
                                        <span className="text-gray-900 font-black">#{selectedInvoice.id.toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date & Time</span>
                                        <span className="text-gray-900">
                                            {new Date(selectedInvoice.createdAt).toLocaleString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Status</span>
                                        <span className={`font-black uppercase ${
                                            selectedInvoice.status === "COMPLETED" ? "text-green-600" :
                                            selectedInvoice.status === "CANCELLED" ? "text-red-500" : "text-[#701cf5]"
                                        }`}>{selectedInvoice.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Customer</span>
                                        <span className="text-gray-900">{selectedInvoice.customerName || "Guest"}</span>
                                    </div>
                                    {selectedInvoice.customerPhone && (
                                        <div className="flex justify-between">
                                            <span>Phone</span>
                                            <span className="text-gray-900">{selectedInvoice.customerPhone}</span>
                                        </div>
                                    )}
                                    {selectedInvoice.table?.name && (
                                        <div className="flex justify-between">
                                            <span>Table Number</span>
                                            <span className="text-gray-900">{selectedInvoice.table.name}</span>
                                        </div>
                                    )}
                                    {selectedInvoice.paymentMode && (
                                        <div className="flex justify-between">
                                            <span>Payment Method</span>
                                            <span className="text-[#701cf5] font-black uppercase tracking-tight">{selectedInvoice.paymentMode}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Items Divider */}
                                <div className="border-t border-dashed border-gray-200 pt-1" />

                                {/* Ordered Items List */}
                                <div className="space-y-3">
                                    <span className="text-[0.62rem] font-black text-gray-400 uppercase tracking-widest block pl-1">Ordered Items</span>
                                    
                                    <div className="space-y-2.5 pl-1">
                                        {(selectedInvoice.items as any[])?.map((item, idx) => {
                                            const cleanName = item.name?.replace(/\s?\((V|NV|R)\)/gi, "").trim();
                                            return (
                                                <div key={idx} className="flex justify-between text-[0.8rem] leading-snug">
                                                    <div className="min-w-0 flex-1 pr-4">
                                                        <span className="font-black text-gray-800">{cleanName}</span>
                                                        <span className="text-gray-400 font-bold text-[0.7rem] block mt-0.5">₹{item.price} × {item.quantity}</span>
                                                    </div>
                                                    <span className="font-black text-gray-900 shrink-0">₹{item.total || (item.price * item.quantity)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Invoice Charges Summary */}
                                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-[0.78rem]">
                                    {(() => {
                                        const itemsTotal = (selectedInvoice.items as any[])?.reduce((sum, item) => sum + (item.total || (item.price * item.quantity)), 0) || 0;
                                        const hasDeliveryFee = selectedInvoice.customerAddress && selectedInvoice.customerAddress.includes("H.No:");
                                        const delivFee = hasDeliveryFee ? 49 : 0;
                                        const adjustment = selectedInvoice.total - (itemsTotal + delivFee);

                                        return (
                                            <>
                                                <div className="flex justify-between text-gray-500 font-bold">
                                                    <span>Subtotal</span>
                                                    <span className="text-gray-800">₹{itemsTotal}</span>
                                                </div>

                                                {hasDeliveryFee && (
                                                    <div className="flex justify-between text-gray-500 font-bold">
                                                        <span>🛵 Delivery Charge</span>
                                                        <span className="text-gray-800">+₹49</span>
                                                    </div>
                                                )}

                                                {adjustment !== 0 && (
                                                    <div className={`flex justify-between font-bold ${adjustment < 0 ? "text-green-600" : "text-gray-500"}`}>
                                                        <span>{adjustment < 0 ? "🏷️ Offers & Discounts" : "🧾 Taxes & Packaging"}</span>
                                                        <span>{adjustment < 0 ? "−" : "+"}₹{Math.abs(adjustment).toFixed(0)}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
                                                    <span className="text-[0.88rem] font-black text-gray-900">Total Paid</span>
                                                    <span className="text-[1.1rem] font-black text-[#701cf5]">₹{selectedInvoice.total}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Delivery Address Summary if any */}
                                {selectedInvoice.customerAddress && (
                                    <div className="bg-purple-50/40 rounded-2xl p-3.5 space-y-1 text-[0.7rem] leading-relaxed border border-[#701cf5]/5">
                                        <span className="font-black text-[#701cf5] uppercase tracking-wider block mb-1">📍 Destination Address</span>
                                        <span className="text-gray-600 font-bold block">{selectedInvoice.customerAddress}</span>
                                    </div>
                                )}

                                {/* Footer message */}
                                <div className="text-center pt-2 shrink-0">
                                    <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-widest">Thank you for dining with us! ❤️</p>
                                    <p className="text-[0.55rem] text-gray-300 font-bold mt-1">Kravy POS System</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ORDER NOTE BOTTOM SHEET */}
            <AnimatePresence>
                {showNoteSheet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[320] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => setShowNoteSheet(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[480px] bg-white rounded-t-[3rem] px-6 pt-10 pb-12 flex flex-col shadow-2xl relative"
                        >
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
                            
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Order Note</h3>
                            <p className="text-sm font-bold text-gray-400 mb-6">Tell us about any specific instructions (e.g. No onion, extra spicy)</p>
                            
                            <textarea
                                autoFocus
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                placeholder="Type your instruction here..."
                                className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-base font-bold text-gray-800 outline-none focus:border-[#701cf5] transition-colors resize-none mb-8"
                            />
                            
                            <button 
                                onClick={() => { kravy.success(); setShowNoteSheet(false); }}
                                className="w-full h-16 bg-[#701cf5] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#ede9fe]/30 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                Save Instruction
                            </button>
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
