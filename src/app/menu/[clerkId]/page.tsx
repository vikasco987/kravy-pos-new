"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type MenuItem = {
    id: string;
    name: string;
    description?: string;
    price?: number | null;
    sellingPrice?: number | null;
    imageUrl?: string | null;
    unit?: string | null;
    categoryId?: string | null;
    category?: { name: string };
    isVeg?: boolean;
};

type BusinessProfile = {
    businessName: string;
    logoUrl?: string;
    businessAddress?: string;
};

const ZOMATO_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .qr-wrapper {
    --red: #E23744; --red-bg: #FFF0F1; --green: #3D9B6E; --green-bg: #EAF7F0;
    --text: #1C1C1C; --text2: #696969; --text3: #ABABAB;
    --border: #EBEBEB; --bg: #F4F4F4; --white: #FFFFFF;
    
    background: var(--bg); font-family: 'Nunito', sans-serif; color: var(--text); 
    max-width: 480px; margin: 0 auto; min-height: 100vh; position: relative;
  }
  .qr-wrapper * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

  /* STICKY HEADER */
  .sticky-hdr { position: sticky; top: 0; z-index: 60; background: var(--white); box-shadow: 0 1px 0 var(--border); }
  .top-bar { display: flex; align-items: center; gap: 10px; padding: 11px 14px; }
  .back-btn { width: 34px; height: 34px; border-radius: 50%; background: var(--bg); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
  .top-info { flex: 1; min-width: 0; }
  .top-name { font-size: 0.95rem; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .top-sub { font-size: 0.67rem; color: var(--text3); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .top-actions { display: flex; gap: 6px; }
  .action-btn { width: 34px; height: 34px; border-radius: 50%; background: var(--bg); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; }

  /* RESTAURANT CARD */
  .rest-card { background: var(--white); margin-bottom: 8px; }
  .rest-img-wrap { position: relative; overflow: hidden; background: #EEE; }
  .rest-img-wrap img { width: 100%; height: 190px; object-fit: cover; display: block; }
  .rest-img-wrap::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.48) 100%); }
  .table-badge { position: absolute; bottom: 12px; left: 14px; z-index: 1; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); border-radius: 6px; padding: 5px 10px; display: flex; align-items: center; gap: 5px; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4CD964; animation: blink 1.4s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .table-badge span { font-size: 0.7rem; font-weight: 800; color: #fff; }
  .rest-body { padding: 14px 14px 0; }
  .rest-name { font-size: 1.3rem; font-weight: 900; margin-bottom: 3px; }
  .rest-cuisine { font-size: 0.75rem; color: var(--text2); font-weight: 600; margin-bottom: 10px; }
  .rest-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .chip { display: flex; align-items: center; gap: 4px; border: 1px solid var(--border); border-radius: 6px; padding: 4px 9px; font-size: 0.72rem; font-weight: 700; background: var(--white); }
  .chip.g { color: var(--green); border-color: #b2dfc8; background: var(--green-bg); }
  .chip-divider { width: 1px; height: 16px; background: var(--border); }
  .offer-row { background: #FFF6E6; border: 1px solid #FFD980; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; display: flex; align-items: center; gap: 7px; font-size: 0.73rem; font-weight: 700; color: #995500; }

  /* SEARCH */
  .search-wrap { background: var(--white); padding: 10px 14px; margin-bottom: 8px; }
  .search-inner { display: flex; align-items: center; gap: 8px; background: var(--bg); border-radius: 10px; padding: 10px 14px; border: 1.5px solid transparent; transition: border-color 0.2s; }
  .search-inner:focus-within { border-color: var(--red); background: var(--white); }
  .search-inner input { flex: 1; border: none; background: transparent; outline: none; font-size: 0.85rem; font-family: 'Nunito', sans-serif; color: var(--text); margin: 0; padding: 0; }
  .search-inner input::placeholder { color: var(--text3); }

  /* VEG TOGGLE */
  .veg-row { background: var(--white); padding: 9px 14px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .veg-left { display: flex; align-items: center; gap: 8px; }
  .veg-track { width: 40px; height: 22px; border-radius: 11px; background: var(--border); position: relative; cursor: pointer; transition: background 0.22s; }
  .veg-track.on { background: var(--green); }
  .veg-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.18); transition: left 0.22s; }
  .veg-track.on .veg-thumb { left: 21px; }
  .veg-lbl { font-size: 0.8rem; font-weight: 700; }
  .legend { display: flex; align-items: center; gap: 10px; }
  .leg-item { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 700; color: var(--text2); }
  .leg-dot { width: 13px; height: 13px; border-radius: 2px; border: 1.5px solid; display: flex; align-items: center; justify-content: center; }
  .leg-dot::after { content: ''; width: 6px; height: 6px; border-radius: 50%; }
  .leg-dot.v { border-color: var(--green); }
  .leg-dot.v::after { background: var(--green); }
  .leg-dot.nv { border-color: var(--red); }
  .leg-dot.nv::after { background: var(--red); }

  /* CATEGORY TABS */
  .cat-tabs-wrap { position: sticky; top: 57px; z-index: 50; background: var(--white); border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; }
  .cat-tabs-wrap::-webkit-scrollbar { display: none; }
  .tabs-inner { display: inline-flex; }
  .ctab { padding: 12px 15px; font-size: 0.8rem; font-weight: 700; color: var(--text2); border-bottom: 2.5px solid transparent; cursor: pointer; white-space: nowrap; background: none; border-left: none; border-right: none; border-top: none; transition: all 0.18s; font-family: 'Nunito', sans-serif; }
  .ctab.active { color: var(--red); border-bottom-color: var(--red); }
  .ctab-n { font-size: 0.6rem; font-weight: 800; background: var(--bg); border-radius: 10px; padding: 1px 5px; margin-left: 3px; }
  .ctab.active .ctab-n { background: var(--red-bg); color: var(--red); }

  /* SECTION */
  .section { background: var(--white); margin-bottom: 8px; }
  .sec-hdr { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 6px; cursor: pointer; }
  .sec-left { display: flex; align-items: center; gap: 7px; }
  .sec-ico { font-size: 1.1rem; }
  .sec-name { font-size: 0.95rem; font-weight: 900; }
  .sec-cnt { font-size: 0.7rem; color: var(--text3); font-weight: 600; }
  .sec-arr { font-size: 0.7rem; color: var(--text3); transition: transform 0.2s; }
  .sec-arr.down { transform: rotate(-90deg); }
  .sec-line { height: 1px; background: var(--border); margin: 6px 14px; }

  /* MENU ITEM */
  .mitem { display: flex; gap: 10px; padding: 14px 14px; border-bottom: 1px solid #F7F7F7; align-items: flex-start; }
  .mitem:last-child { border-bottom: none; }
  .mitem-left { flex: 1; min-width: 0; }
  .type-dot { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; }
  .type-dot.v { border-color: var(--green); }
  .type-dot.v::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
  .type-dot.nv { border-color: var(--red); }
  .type-dot.nv::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--red); }
  .mname-row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .mname { font-size: 0.9rem; font-weight: 800; line-height: 1.25; }
  .mdesc { font-size: 0.73rem; color: var(--text2); line-height: 1.5; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }
  .mprice { font-size: 0.95rem; font-weight: 900; }
  .mitem-right { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .mthumb { width: 108px; height: 92px; border-radius: 12px; overflow: hidden; position: relative; background: var(--bg); }
  .mthumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mthumb-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; background: linear-gradient(135deg, #FFF0F1, #FFF8EC); color: #ccc; }
  .add-wrap { margin-top: -13px; position: relative; z-index: 1; }
  .add-btn { background: var(--white); border: 1.5px solid var(--red); color: var(--red); border-radius: 8px; padding: 6px 18px; font-size: 0.82rem; font-weight: 900; cursor: pointer; font-family: 'Nunito', sans-serif; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(226,55,68,0.13); transition: all 0.15s; }
  .add-btn:hover { background: var(--red-bg); }
  .add-btn:active { transform: scale(0.95); }
  .qty-wrap { display: flex; align-items: center; background: var(--red); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(226,55,68,0.28); }
  .qbtn { width: 30px; height: 32px; background: transparent; border: none; color: #fff; font-size: 1.1rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.12s; font-family: 'Nunito', sans-serif; }
  .qbtn:active { background: rgba(255,255,255,0.15); }
  .qnum { font-size: 0.88rem; font-weight: 900; color: #fff; min-width: 22px; text-align: center; }

  /* CART BAR */
  .cart-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%) translateY(110%); width: 100%; max-width: 480px; z-index: 100; padding: 10px 14px 22px; transition: transform 0.3s cubic-bezier(.4,0,.2,1); background: linear-gradient(180deg, transparent, rgba(244,244,244,0.92) 20%); }
  .cart-bar.show { transform: translateX(-50%) translateY(0); }
  .cart-inner { background: var(--red); border-radius: 14px; padding: 13px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-shadow: 0 6px 24px rgba(226,55,68,0.38); transition: transform 0.14s; }
  .cart-inner:active { transform: scale(0.99); }
  .cart-l { display: flex; align-items: center; gap: 10px; }
  .cart-cnt { background: rgba(255,255,255,0.22); border-radius: 7px; padding: 3px 9px; font-size: 0.78rem; font-weight: 900; color: #fff; }
  .cart-lbl { font-size: 0.88rem; font-weight: 800; color: #fff; }
  .cart-r { display: flex; align-items: center; gap: 5px; }
  .cart-tot { font-size: 0.9rem; font-weight: 900; color: #fff; }
  .cart-arrow { color: rgba(255,255,255,0.75); font-size: 1.1rem; }

  /* ORDER SHEET */
  .dim { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.48); opacity: 0; pointer-events: none; transition: opacity 0.25s; }
  .dim.show { opacity: 1; pointer-events: all; }
  .sheet { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%) translateY(100%); width: 100%; max-width: 480px; z-index: 201; background: var(--white); border-radius: 20px 20px 0 0; max-height: 86vh; overflow-y: auto; scrollbar-width: none; transition: transform 0.3s cubic-bezier(.4,0,.2,1); padding-bottom: 20px;}
  .sheet::-webkit-scrollbar { display: none; }
  .sheet.show { transform: translateX(-50%) translateY(0); }
  .sheet-pill { width: 36px; height: 4px; background: var(--border); border-radius: 2px; margin: 12px auto 0; }
  .sheet-head { padding: 13px 16px 12px; border-bottom: 1px solid var(--border); font-size: 1rem; font-weight: 900; }
  .s-item { display: flex; align-items: center; gap: 9px; padding: 11px 16px; border-bottom: 1px solid #F7F7F7; }
  .si-dot { width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .si-dot.v { border-color: var(--green); }
  .si-dot.v::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
  .si-dot.nv { border-color: var(--red); }
  .si-dot.nv::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--red); }
  .si-name { flex: 1; font-size: 0.84rem; font-weight: 700; }
  .si-ctrl { display: flex; align-items: center; background: var(--red); border-radius: 7px; overflow: hidden; }
  .si-btn { width: 26px; height: 26px; background: transparent; border: none; color: #fff; font-size: 1rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Nunito', sans-serif; }
  .si-n { font-size: 0.8rem; font-weight: 900; color: #fff; min-width: 18px; text-align: center; }
  .si-price { font-size: 0.84rem; font-weight: 800; min-width: 54px; text-align: right; }
  .bill-sec { padding: 14px 16px; border-top: 7px solid var(--bg); }
  .bill-sec-hd { font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .bill-ln { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; padding: 3px 0; color: var(--text2); }
  .bill-ln.tot { font-weight: 900; font-size: 0.9rem; color: var(--text); padding-top: 10px; margin-top: 6px; border-top: 1px dashed var(--border); }
  .bill-ln.tot span:last-child { color: var(--red); }
  .pay-sec { padding: 14px 16px; border-top: 7px solid var(--bg); }
  .pay-sec-hd { font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .pay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .pay-opt { border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 6px; text-align: center; cursor: pointer; transition: all 0.15s; background: var(--white); }
  .pay-opt.sel { border-color: var(--red); background: var(--red-bg); }
  .pay-opt-ico { font-size: 1.3rem; display: block; margin-bottom: 3px; }
  .pay-opt-lbl { font-size: 0.62rem; font-weight: 800; color: var(--text2); }
  .pay-opt.sel .pay-opt-lbl { color: var(--red); }
  .place-btn { margin: 12px 16px 12px; width: calc(100% - 32px); background: var(--red); border: none; border-radius: 12px; color: #fff; font-size: 0.95rem; font-weight: 900; font-family: 'Nunito', sans-serif; padding: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 18px rgba(226,55,68,0.32); transition: all 0.14s; }
  .place-btn:active { transform: scale(0.99); }

  /* SUCCESS */
  .success { position: fixed; inset: 0; z-index: 300; background: var(--white); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
  .success.show { opacity: 1; pointer-events: all; }
  .success-ico { font-size: 5.5rem; margin-bottom: 14px; animation: popIn 0.5s cubic-bezier(.4,0,.2,1); }
  @keyframes popIn { 0%{transform:scale(0.4);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  .success-h { font-size: 1.5rem; font-weight: 900; margin-bottom: 6px; text-align: center; }
  .success-p { font-size: 0.83rem; color: var(--text2); text-align: center; line-height: 1.65; margin-bottom: 16px; font-weight: 600; }
  .success-id { background: var(--bg); border-radius: 8px; padding: 8px 18px; font-size: 0.75rem; font-weight: 800; color: var(--text2); font-family: monospace; margin-bottom: 22px; }
  .track { display: flex; width: 100%; margin-bottom: 24px; }
  .tstep { flex: 1; text-align: center; position: relative; }
  .tstep::after { content: ''; position: absolute; top: 13px; left: 55%; width: 90%; height: 2px; background: var(--border); }
  .tstep:last-child::after { display: none; }
  .tstep.done::after { background: var(--green); }
  .tdot { width: 26px; height: 26px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; margin: 0 auto 4px; position: relative; z-index: 1; }
  .tstep.done .tdot { background: var(--green); }
  .tlabel { font-size: 0.58rem; font-weight: 800; color: var(--text3); }
  .tstep.done .tlabel { color: var(--green); }
  .more-btn { width: 100%; background: var(--red); border: none; border-radius: 12px; color: #fff; font-size: 0.9rem; font-weight: 900; font-family: 'Nunito', sans-serif; padding: 14px; cursor: pointer; }
`;

export default function PublicMenuPage() {
    const { clerkId } = useParams() as { clerkId: string };
    const searchParams = useSearchParams();
    const tableId = searchParams.get("tableId") || "Counter";

    const [items, setItems] = useState<MenuItem[]>([]);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState<Record<string, number>>({});
    const [searchQ, setSearchQ] = useState("");
    const [vegOnly, setVegOnly] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [payM, setPayM] = useState("upi");

    const [showSheet, setShowSheet] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [activeTab, setActiveTab] = useState("All");

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!clerkId) return;
        async function fetchData() {
            try {
                const res = await fetch(`/api/public/menu/${clerkId}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setItems(data.items || []);
                setProfile(data.profile || null);
            } catch (err) {
                console.error("Fetch error:", err);
                toast.error("Failed to load menu");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [clerkId]);

    const CATS = useMemo(() => {
        const cats = Array.from(new Set(items.map(it => it.category?.name || "Other")));
        return cats.map((name) => ({ id: name.replace(/\s+/g, '-'), name: name, icon: '🍽️' }));
    }, [items]);

    const getItems = () => {
        return items.filter(m => {
            // If vegOnly is true, only include items that are explicitly veg. 
            // If isVeg is undefined, we assume it's NOT exclusively veg to be safe, or we can assume it's veg. Let's assume isVeg === true for veg items.
            const isVegMatch = vegOnly ? (m.isVeg === true) : true;
            const isSearchMatch = !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase());
            return isVegMatch && isSearchMatch;
        });
    };

    const filteredItems = getItems();

    const getItemPrice = (item: MenuItem) => item.sellingPrice || item.price || 0;

    const toggleSec = (id: string) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateCart = (itemId: string, delta: number) => {
        setCart(prev => {
            const newQty = (prev[itemId] || 0) + delta;
            if (newQty <= 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: newQty };
        });
    };

    // Cart summary
    const cartItemsCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
    const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = items.find(i => i.id === id);
        return sum + (item ? getItemPrice(item) * qty : 0);
    }, 0);
    const gst = Math.round(cartSubtotal * 0.05);
    const cartTotal = cartSubtotal + gst;

    const placeOrder = async () => {
        if (Object.keys(cart).length === 0) return;

        const orderItems = items
            .filter(it => cart[it.id])
            .map(it => ({
                id: it.id,
                name: it.name,
                price: getItemPrice(it),
                quantity: cart[it.id],
                total: getItemPrice(it) * cart[it.id]
            }));

        try {
            const res = await fetch("/api/public/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerkUserId: clerkId,
                    tableId: tableId,
                    items: orderItems,
                    total: cartTotal,
                    customerName: "QR Customer",
                }),
            });

            if (res.ok) {
                setShowSheet(false);
                const newOrderId = 'ORD' + Date.now().toString(36).toUpperCase().slice(-6);
                setOrderId(newOrderId);
                setShowSuccess(true);
                setCart({});

                setTimeout(() => {
                    setShowSuccess(false);
                }, 7000);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to place order");
            }
        } catch (err) {
            toast.error("Failed to place order");
        }
    };

    // ScrollSpy
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const id = e.target.id.replace('sec-', '');
                    setActiveTab(id);
                }
            });
        }, { threshold: 0.25, rootMargin: '-60px 0px -55% 0px' });

        document.querySelectorAll('.section').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [filteredItems, collapsed]);

    const goSec = (id: string) => {
        setActiveTab(id);
        const el = document.getElementById('sec-' + id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F4F4F4', flexDirection: 'column' }}>
            <div style={{ fontSize: '2rem', animation: 'blink 1s infinite' }}>🍽️</div>
            <div style={{ marginTop: '10px', color: '#666', fontFamily: 'sans-serif' }}>Loading menu...</div>
        </div>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: ZOMATO_CSS }} />
            <div className="qr-wrapper">

                {/* HEADER */}
                <div className="sticky-hdr">
                    <div className="top-bar">
                        <button className="back-btn" onClick={() => window.history.back()}>←</button>
                        <div className="top-info">
                            <div className="top-name">{profile?.businessName || "Digital Menu"}</div>
                            <div className="top-sub">{profile?.businessAddress || "Restaurant • Dine-in"}</div>
                        </div>
                        <div className="top-actions">
                            <button className="action-btn" onClick={() => searchInputRef.current?.focus()}>🔍</button>
                            <button className="action-btn">♡</button>
                        </div>
                    </div>
                </div>

                {/* RESTAURANT CARD */}
                <div className="rest-card">
                    <div className="rest-img-wrap">
                        {profile?.logoUrl ? (
                            <img src={profile.logoUrl} alt={profile.businessName} />
                        ) : (
                            <div style={{ width: '100%', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', fontSize: '3rem' }}>🍽️</div>
                        )}
                        <div className="table-badge"><div className="live-dot"></div><span>Table {tableId} · Active</span></div>
                    </div>
                    <div className="rest-body">
                        <div className="rest-name">{profile?.businessName || "Restaurant Menu"}</div>
                        <div className="rest-cuisine">{profile?.businessAddress || "Various cuisines available"}</div>
                        <div className="rest-chips">
                            <div className="chip g">★ 4.5 <span style={{ fontWeight: 500, color: '#3D9B6E', fontSize: '0.68rem' }}>(1.2K)</span></div>
                            <div className="chip-divider"></div>
                            <div className="chip">⏱ 20–30 mins</div>
                        </div>
                        <div className="offer-row">🏷️ Online Menu Powered by KravyPOS</div>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="search-wrap">
                    <div className="search-inner">
                        <span style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search within menu"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            ref={searchInputRef}
                        />
                    </div>
                </div>

                {/* VEG TOGGLE */}
                <div className="veg-row">
                    <div className="veg-left">
                        <div className={`veg-track ${vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(!vegOnly)}>
                            <div className="veg-thumb"></div>
                        </div>
                        <span className="veg-lbl">Veg Only</span>
                    </div>
                    <div className="legend">
                        <div className="leg-item"><div className="leg-dot v"></div> Veg</div>
                        <div className="leg-item"><div className="leg-dot nv"></div> Non-veg</div>
                    </div>
                </div>

                {/* CATEGORY TABS */}
                {!searchQ && (
                    <div className="cat-tabs-wrap">
                        <div className="tabs-inner">
                            {CATS.map(c => {
                                const count = filteredItems.filter(m => (m.category?.name || "Other").replace(/\s+/g, '-') === c.id).length;
                                return (
                                    <button
                                        key={c.id}
                                        className={`ctab ${activeTab === c.id ? 'active' : ''}`}
                                        onClick={() => goSec(c.id)}
                                    >
                                        {c.name}<span className="ctab-n">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* MENU LIST */}
                <div style={{ paddingBottom: '88px' }}>
                    {searchQ ? (
                        <div className="section">
                            <div className="sec-hdr">
                                <div className="sec-left">
                                    <span className="sec-ico">🔍</span>
                                    <span className="sec-name">Results</span>
                                    <span className="sec-cnt">({filteredItems.length})</span>
                                </div>
                            </div>
                            <div className="sec-line"></div>
                            {filteredItems.map(item => <MenuItemCard key={item.id} item={item} qty={cart[item.id] || 0} onUpdate={updateCart} />)}
                        </div>
                    ) : (
                        CATS.map(c => {
                            const its = filteredItems.filter(i => (i.category?.name || "Other").replace(/\s+/g, '-') === c.id);
                            if (!its.length) return null;
                            const isCol = collapsed[c.id];
                            return (
                                <div className="section" id={`sec-${c.id}`} key={c.id}>
                                    <div className="sec-hdr" onClick={() => toggleSec(c.id)}>
                                        <div className="sec-left">
                                            <span className="sec-ico">{c.icon}</span>
                                            <span className="sec-name">{c.name}</span>
                                            <span className="sec-cnt">({its.length})</span>
                                        </div>
                                        <span className={`sec-arr ${isCol ? 'down' : ''}`}>▾</span>
                                    </div>
                                    <div className="sec-line"></div>
                                    {!isCol && its.map(item => <MenuItemCard key={item.id} item={item} qty={cart[item.id] || 0} onUpdate={updateCart} />)}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* CART BAR */}
                <div className={`cart-bar ${cartItemsCount > 0 && !showSheet ? 'show' : ''}`}>
                    <div className="cart-inner" onClick={() => setShowSheet(true)}>
                        <div className="cart-l">
                            <div className="cart-cnt">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}</div>
                            <span className="cart-lbl">View Cart</span>
                        </div>
                        <div className="cart-r">
                            <span className="cart-tot">₹{cartTotal.toLocaleString('en-IN')}</span>
                            <span className="cart-arrow">›</span>
                        </div>
                    </div>
                </div>

                {/* DIM OVERLAY */}
                <div className={`dim ${showSheet ? 'show' : ''}`} onClick={() => setShowSheet(false)}></div>

                {/* SHEET */}
                <div className={`sheet ${showSheet ? 'show' : ''}`}>
                    <div className="sheet-pill"></div>
                    <div className="sheet-head">🛒 Your Order — Table {tableId}</div>

                    <div>
                        {Object.entries(cart).map(([id, qty]) => {
                            const item = items.find(i => i.id === id);
                            if (!item) return null;
                            return (
                                <div className="s-item" key={id}>
                                    <div className={`si-dot ${item.isVeg !== false ? 'v' : 'nv'}`}></div>
                                    <div className="si-name">{item.name}</div>
                                    <div className="si-ctrl">
                                        <button className="si-btn" onClick={() => updateCart(id, -1)}>−</button>
                                        <span className="si-n">{qty}</span>
                                        <button className="si-btn" onClick={() => updateCart(id, 1)}>+</button>
                                    </div>
                                    <div className="si-price">₹{(getItemPrice(item) * qty).toLocaleString('en-IN')}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bill-sec">
                        <div className="bill-sec-hd">Bill Details</div>
                        <div>
                            <div className="bill-ln"><span>Item Total</span><span>₹{cartSubtotal.toLocaleString('en-IN')}</span></div>
                            <div className="bill-ln"><span>GST & Charges (5%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
                            <div className="bill-ln tot"><span>To Pay</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>

                    <div className="pay-sec">
                        <div className="pay-sec-hd">Payment Method</div>
                        <div className="pay-grid">
                            <div className={`pay-opt ${payM === 'upi' ? 'sel' : ''}`} onClick={() => setPayM('upi')}>
                                <span className="pay-opt-ico">📱</span><span className="pay-opt-lbl">UPI / QR</span>
                            </div>
                            <div className={`pay-opt ${payM === 'cash' ? 'sel' : ''}`} onClick={() => setPayM('cash')}>
                                <span className="pay-opt-ico">💵</span><span className="pay-opt-lbl">Cash</span>
                            </div>
                            <div className={`pay-opt ${payM === 'card' ? 'sel' : ''}`} onClick={() => setPayM('card')}>
                                <span className="pay-opt-ico">💳</span><span className="pay-opt-lbl">Card</span>
                            </div>
                        </div>
                    </div>

                    <button className="place-btn" onClick={placeOrder}>
                        <span>Place Order</span>
                        <span style={{ opacity: 0.82 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                    </button>
                </div>

                {/* SUCCESS */}
                <div className={`success ${showSuccess ? 'show' : ''}`}>
                    <div className="success-ico">🎉</div>
                    <div className="success-h">Order Placed!</div>
                    <div className="success-p">Your order has been sent to the kitchen.<br />It will be ready soon!</div>
                    <div className="success-id">{orderId}</div>
                    <div className="track">
                        <div className="tstep done"><div className="tdot">✅</div><div className="tlabel">Received</div></div>
                        <div className="tstep"><div className="tdot">👨‍🍳</div><div className="tlabel">Preparing</div></div>
                        <div className="tstep"><div className="tdot">🔥</div><div className="tlabel">Cooking</div></div>
                        <div className="tstep"><div className="tdot">🍽️</div><div className="tlabel">Ready!</div></div>
                    </div>
                    <button className="more-btn" onClick={() => setShowSuccess(false)}>+ Add More Items</button>
                </div>

            </div>
        </>
    );
}

function MenuItemCard({ item, qty, onUpdate }: { item: MenuItem, qty: number, onUpdate: (id: string, d: number) => void }) {
    const price = item.sellingPrice || item.price || 0;
    return (
        <div className="mitem">
            <div className="mitem-left">
                <div className={`type-dot ${item.isVeg !== false ? 'v' : 'nv'}`}></div>
                <div className="mname-row">
                    <span className="mname">{item.name}</span>
                </div>
                {item.description && <div className="mdesc">{item.description}</div>}
                <div className="mprice">₹{price.toLocaleString('en-IN')}</div>
            </div>
            <div className="mitem-right">
                <div className="mthumb">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                    ) : (
                        <div className="mthumb-ph">🍽️</div>
                    )}
                </div>
                <div className="add-wrap">
                    {qty === 0 ? (
                        <button className="add-btn" onClick={() => onUpdate(item.id, 1)}>ADD</button>
                    ) : (
                        <div className="qty-wrap">
                            <button className="qbtn" onClick={() => onUpdate(item.id, -1)}>−</button>
                            <span className="qnum">{qty}</span>
                            <button className="qbtn" onClick={() => onUpdate(item.id, 1)}>+</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
