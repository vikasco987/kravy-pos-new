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

  /* CASE BANNERS & STRIPS */
  .case-banner { padding: 12px 16px; background: var(--white); border-bottom: 1px solid var(--border); }
  .cb-badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; padding: 3px 9px; font-size: 0.62rem; font-weight: 800; margin-bottom: 3px; }
  .cb-badge.merge { background: var(--green-bg); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
  .cb-badge.new { background: var(--orange-bg); color: #F97316; border: 1px solid rgba(249,115,22,0.3); }
  .cb-badge.round2 { background: var(--blue-bg); color: #3B82F6; border: 1px solid rgba(59,130,246,0.3); }
  .cb-title { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; }
  .cb-sub { font-size: 0.65rem; color: var(--text2); margin-top: 1px; }
  .prev-order-strip { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin: 10px 16px; display: flex; align-items: center; gap: 8px; }
  .pos-icon { font-size: 1rem; flex-shrink: 0; }
  .pos-info { flex: 1; }
  .pos-title { font-size: 0.72rem; font-weight: 800; color: var(--text); }
  .pos-items { font-size: 0.65rem; color: var(--text2); }
  .pos-total { font-size: 0.78rem; font-weight: 900; color: var(--text); }

  /* WARNING SHEET */
  .warn-box { background: var(--orange-bg); border: 1.5px solid rgba(249,115,22,0.3); border-radius: 14px; padding: 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: flex-start; }
  .wb-icon { font-size: 1.6rem; flex-shrink: 0; }
  .wb-title { font-size: 0.88rem; font-weight: 800; color: #92400E; margin-bottom: 4px; }
  .wb-desc { font-size: 0.75rem; color: #B45309; line-height: 1.6; }
  .info-box { background: var(--blue-bg); border: 1.5px solid rgba(59,130,246,0.25); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; font-size: 0.75rem; color: #1E40AF; line-height: 1.6; }
  .sheet-btn { width: 100%; padding: 13px; border-radius: 12px; border: none; cursor: pointer; font-size: 0.88rem; font-weight: 900; font-family: 'Nunito', sans-serif; transition: all 0.15s; margin-bottom: 8px; }
  .sheet-btn.orange { background: #F97316; color: #fff; box-shadow: 0 4px 14px rgba(249,115,22,0.28); }
  .sheet-btn.ghost { background: var(--bg); color: var(--text2); border: 1px solid var(--border); }
  .cs-detail-box { background: var(--bg); border-radius: 14px; padding: 14px; margin-top: 12px; margin-bottom: 18px; text-align: left; width: 100%; }
  .cdb-row { display: flex; justify-content: space-between; font-size: 0.78rem; padding: 4px 0; border-bottom: 1px solid var(--border); }
  .cdb-row:last-child { border-bottom: none; font-weight: 900; font-size: 0.85rem; }

  /* CART COLORS */
  .cart-inner.green { background: var(--green); }
  .cart-inner.orange { background: #F97316; }
  .cart-inner.blue { background: #3B82F6; }

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
  .tstep.active-s::after { background: linear-gradient(90deg, var(--green), var(--border)); }
  .tdot { width: 26px; height: 26px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; margin: 0 auto 4px; position: relative; z-index: 1; }
  .tstep.done .tdot { background: var(--green); }
  .tstep.active-s .tdot { background: #F97316; box-shadow: 0 0 0 4px rgba(249,115,22,0.2); animation: sPulse 1.5s infinite; }
  @keyframes sPulse { 0%,100%{box-shadow:0 0 0 4px rgba(249,115,22,0.2)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0.08)} }
  .tlabel { font-size: 0.58rem; font-weight: 800; color: var(--text3); }
  .tstep.done .tlabel { color: var(--green); }
  .tstep.active-s .tlabel { color: #F97316; }
  .more-btn { width: 100%; background: var(--red); border: none; border-radius: 12px; color: #fff; font-size: 0.9rem; font-weight: 900; font-family: 'Nunito', sans-serif; padding: 14px; cursor: pointer; }
  .track-btn { width: 100%; background: var(--green); border: none; border-radius: 12px; color: #fff; font-size: 0.9rem; font-weight: 900; font-family: 'Nunito', sans-serif; padding: 14px; cursor: pointer; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }

  /* TRACKING VIEW */
  .track-view { position: fixed; inset: 0; z-index: 300; background: var(--bg); overflow-y: auto; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
  .track-view.show { opacity: 1; pointer-events: all; }
  .tv-hero { background: linear-gradient(135deg, #1a1a26, #12121a); padding: 32px 20px; text-align: center; position: relative; overflow: hidden; }
  .tv-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,163,83,0.15), transparent); pointer-events: none; }
  .tv-oid { display: inline-block; background: rgba(212,163,83,0.15); border: 1px solid rgba(212,163,83,0.3); border-radius: 20px; padding: 4px 14px; font-size: 0.68rem; font-weight: 800; color: #D4A353; letter-spacing: 1px; margin-bottom: 14px; }
  .tv-icon { font-size: 3.5rem; margin-bottom: 10px; animation: float 3s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .tv-title { font-size: 1.4rem; font-weight: 900; color: #F0EAD6; margin-bottom: 4px; }
  .tv-sub { font-size: 0.8rem; color: rgba(240,234,214,0.55); font-weight: 600; }
  .tv-table-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; padding: 6px 14px; margin-top: 14px; }
  .tv-table-pill span { font-size: 0.75rem; font-weight: 800; color: #F97316; }
  .tv-stepper { background: var(--white); padding: 20px; margin-bottom: 8px; }
  .tv-step-title { font-size: 0.72rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); margin-bottom: 18px; }
  .tv-items { background: var(--white); padding: 18px 20px; margin-bottom: 8px; }
  .tv-items-title { font-size: 0.72rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); margin-bottom: 14px; }
  .tv-item { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F5F5F5; }
  .tv-item:last-child { border-bottom: none; }
  .tv-i-left { display: flex; align-items: center; gap: 8px; }
  .tv-i-name { font-size: 0.82rem; font-weight: 700; }
  .tv-i-qty { font-size: 0.72rem; color: var(--text3); }
  .tv-i-price { font-size: 0.82rem; font-weight: 800; }
  .tv-bill { background: var(--white); padding: 18px 20px; margin-bottom: 8px; }
  .tv-bill-row { display: flex; justify-content: space-between; font-size: 0.8rem; padding: 4px 0; color: var(--text2); font-weight: 600; }
  .tv-bill-row.total { font-weight: 900; font-size: 0.92rem; color: var(--text); padding-top: 10px; margin-top: 6px; border-top: 1px dashed var(--border); }
  .tv-bill-row.total span:last-child { color: var(--red); }
  .tv-close-wrap { padding: 14px 20px 28px; display: flex; gap: 10px; }
  .tv-back-btn { flex: 1; background: var(--white); border: 2px solid var(--red); color: var(--red); border-radius: 12px; padding: 14px; font-size: 0.9rem; font-weight: 900; font-family: 'Nunito', sans-serif; cursor: pointer; text-align: center; }
  .tv-add-btn { flex: 1; background: var(--red); border: none; border-radius: 12px; color: #fff; padding: 14px; font-size: 0.9rem; font-weight: 900; font-family: 'Nunito', sans-serif; cursor: pointer; text-align: center; }

  /* FLOATING TRACK BTN */
  .floating-track { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; z-index: 90; padding: 10px 14px 22px; background: linear-gradient(180deg, transparent, rgba(244,244,244,0.95) 20%); }
  .ft-inner { background: var(--green); border-radius: 14px; padding: 13px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-shadow: 0 6px 24px rgba(61,155,110,0.38); }
  .ft-inner:active { transform: scale(0.99); }
  .ft-l { display: flex; align-items: center; gap: 10px; }
  .ft-badge { background: rgba(255,255,255,0.22); border-radius: 7px; padding: 3px 9px; font-size: 0.78rem; font-weight: 900; color: #fff; }
  .ft-lbl { font-size: 0.88rem; font-weight: 800; color: #fff; }
  .ft-arrow { color: rgba(255,255,255,0.75); font-size: 1.1rem; }
`;

export default function PublicMenuPage() {
    const { clerkId } = useParams() as { clerkId: string };
    const searchParams = useSearchParams();
    // QR url will pass the actual table record id; optionally also a human-readable name
    const tableId = searchParams.get("tableId") || "Counter";
    const tableName = searchParams.get("tableName") || tableId;

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

    // ADD MORE ITEMS STATE
    const [actionCase, setActionCase] = useState<"merge" | "separate" | "round2" | null>(null);
    const [showWarning, setShowWarning] = useState(false);

    // ORDER TRACKING STATE
    const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
    const [trackingStatus, setTrackingStatus] = useState<string>("PENDING");
    const [trackingOrder, setTrackingOrder] = useState<any>(null);
    const [showTracking, setShowTracking] = useState(false);

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

    // POLL ORDER STATUS when we have a tracking order
    useEffect(() => {
        if (!trackingOrderId) return;
        const poll = async () => {
            try {
                const res = await fetch(`/api/public/orders?id=${trackingOrderId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrackingStatus(data.status);
                    setTrackingOrder(data);
                }
            } catch { }
        };
        poll();
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, [trackingOrderId]);

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

    const handleAddMore = () => {
        setShowSuccess(false);
        setShowTracking(false);
        setCart({}); // clear cart for new items

        if (trackingStatus === 'PENDING') {
            setActionCase('merge');
            toast.success("Merge mode — items will be added to your exact order");
        } else if (trackingStatus === 'PREPARING') {
            setShowWarning(true);
        } else {
            setActionCase('round2');
            toast.success("Round 2 — menu is open for more items!");
        }
    };

    const confirmSeparateOrder = () => {
        setShowWarning(false);
        setActionCase('separate');
        toast.success("New Order #2 started");
    };

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
                    tableId: tableId, // actual record id
                    items: orderItems,
                    total: cartTotal,
                    customerName: "QR Customer",
                    caseType: actionCase || "new",
                    parentOrderId: actionCase ? trackingOrderId : null,
                }),
            });

            if (res.ok) {
                const orderData = await res.json();
                setShowSheet(false);
                const realId = orderData.id;
                setOrderId('ORD-' + realId.slice(-6).toUpperCase());

                // If merge, keep the old trackingOrderId, else use new
                if (actionCase !== 'merge') {
                    setTrackingOrderId(realId);
                    setTrackingOrder(orderData);
                } else {
                    setTrackingOrder(orderData);
                }

                setTrackingStatus('PENDING');
                setActionCase(null);
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
                        <div className="table-badge"><div className="live-dot"></div><span>Table {tableName} · Active</span></div>
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
                {!searchQ && !actionCase && (
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

                {/* CASE BANNERS */}
                {actionCase === 'merge' && (
                    <div className="case-banner">
                        <div className="cb-badge merge">🔀 Merge Mode</div>
                        <div className="cb-title">Add More Items</div>
                        <div className="cb-sub">These items will be merged into your exact order #{orderId}</div>
                    </div>
                )}
                {actionCase === 'separate' && (
                    <div className="case-banner">
                        <div className="cb-badge new">📋 New Order</div>
                        <div className="cb-title">Starting Order #2</div>
                        <div className="cb-sub">Your previous items are preparing. These will come separately.</div>
                    </div>
                )}
                {actionCase === 'round2' && (
                    <div className="case-banner">
                        <div className="cb-badge round2">🔄 Round 2</div>
                        <div className="cb-title">What's Next? 😊</div>
                        <div className="cb-sub">Desserts, drinks or anything else for Round 2!</div>
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
                    <div className={`cart-inner ${actionCase === 'merge' ? 'green' : actionCase === 'separate' ? 'orange' : actionCase === 'round2' ? 'blue' : ''}`} onClick={() => setShowSheet(true)}>
                        <div className="cart-l">
                            <div className="cart-cnt">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}</div>
                            <span className="cart-lbl">
                                {actionCase === 'merge' ? 'Merge & Update' : actionCase === 'separate' ? 'Place Order #2' : actionCase === 'round2' ? 'Place Round 2' : 'View Cart'}
                            </span>
                        </div>
                        <div className="cart-r">
                            <span className="cart-tot">₹{cartTotal.toLocaleString('en-IN')}</span>
                            <span className="cart-arrow">›</span>
                        </div>
                    </div>
                </div>

                {/* DIM OVERLAY */}
                <div className={`dim ${showSheet || showWarning ? 'show' : ''}`} onClick={() => { setShowSheet(false); setShowWarning(false); }}></div>

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
                        <span>{actionCase === 'merge' ? 'Merge Order' : actionCase === 'round2' ? 'Place Round 2' : 'Place Order'}</span>
                        <span style={{ opacity: 0.82 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                    </button>
                </div>

                {/* WARNING SHEET */}
                <div className={`sheet ${showWarning ? 'show' : ''}`}>
                    <div className="sheet-pill"></div>
                    <div className="sheet-head">
                        <div style={{ fontSize: '1rem', fontWeight: 900 }}>⚠️ Order is already cooking</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '2px' }}>New items will start as a separate order</div>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                        <div className="warn-box">
                            <div className="wb-icon">🔥</div>
                            <div>
                                <div className="wb-title">Kitchen is preparing Order 1!</div>
                                <div className="wb-desc">We cannot merge into the existing order anymore. These new items will go as a separate order.</div>
                            </div>
                        </div>
                        <div className="info-box">
                            💡 <b>Bill Summary:</b> Both orders will show up on a single final bill.
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="sheet-btn orange" onClick={confirmSeparateOrder}>➕ Yes, Create New Order</button>
                            <button className="sheet-btn ghost" onClick={() => setShowWarning(false)}>Cancel</button>
                        </div>
                    </div>
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
                    <button className="track-btn" onClick={() => { setShowSuccess(false); setShowTracking(true); }}>📍 Track Your Order</button>
                    <button className="more-btn" onClick={handleAddMore}>+ Add More Items</button>
                </div>

                {/* ═══ ORDER TRACKING VIEW ═══ */}
                <div className={`track-view ${showTracking ? 'show' : ''}`}>
                    <div className="tv-hero">
                        <div className="tv-oid">{orderId}</div>
                        <div className="tv-icon">
                            {trackingStatus === 'PENDING' ? '✅' : trackingStatus === 'PREPARING' ? '🔥' : trackingStatus === 'READY' ? '🍽️' : '😊'}
                        </div>
                        <div className="tv-title">
                            {trackingStatus === 'PENDING' ? 'Order Received!' : trackingStatus === 'PREPARING' ? 'Being Prepared...' : trackingStatus === 'READY' ? 'Ready to Serve!' : 'Served! Enjoy!'}
                        </div>
                        <div className="tv-sub">
                            {trackingStatus === 'PENDING' ? 'Waiting for kitchen to confirm' : trackingStatus === 'PREPARING' ? 'Chef is cooking your food 🔥' : trackingStatus === 'READY' ? 'Waiter is bringing your food' : 'Thank you for dining with us!'}
                        </div>
                        <div className="tv-table-pill"><span>🪑 Table {tableName}</span></div>
                    </div>

                    {/* Stepper */}
                    <div className="tv-stepper">
                        <div className="tv-step-title">Order Progress</div>
                        <div className="track">
                            {[
                                { label: 'Received', icon: '✅', key: 'PENDING' },
                                { label: 'Confirmed', icon: '👨‍🍳', key: 'CONFIRMED' },
                                { label: 'Preparing', icon: '🔥', key: 'PREPARING' },
                                { label: 'Ready!', icon: '🍽️', key: 'READY' },
                            ].map((step, idx) => {
                                const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
                                const currentIdx = statusOrder.indexOf(trackingStatus);
                                const stepIdx = statusOrder.indexOf(step.key);
                                const isDone = stepIdx < currentIdx;
                                const isActive = stepIdx === currentIdx;
                                return (
                                    <div key={step.key} className={`tstep ${isDone ? 'done' : isActive ? 'active-s' : ''}`}>
                                        <div className="tdot">{step.icon}</div>
                                        <div className="tlabel">{step.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Items Ordered */}
                    {trackingOrder?.items && (
                        <div className="tv-items">
                            <div className="tv-items-title">Your Items</div>
                            {(trackingOrder.items as any[]).map((it: any, idx: number) => (
                                <div className="tv-item" key={idx}>
                                    <div className="tv-i-left">
                                        <span className="tv-i-name">{it.name}</span>
                                        <span className="tv-i-qty">×{it.quantity}</span>
                                    </div>
                                    <span className="tv-i-price">₹{(it.price || 0) * (it.quantity || 1)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bill */}
                    {trackingOrder && (
                        <div className="tv-bill">
                            <div className="tv-items-title">Bill Summary</div>
                            <div className="tv-bill-row"><span>Subtotal</span><span>₹{(trackingOrder.total / 1.05).toFixed(2)}</span></div>
                            <div className="tv-bill-row"><span>GST (5%)</span><span>₹{(trackingOrder.total - trackingOrder.total / 1.05).toFixed(2)}</span></div>
                            <div className="tv-bill-row total"><span>Total</span><span>₹{trackingOrder.total}</span></div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="tv-close-wrap">
                        <button className="tv-back-btn" onClick={() => setShowTracking(false)}>← Back to Menu</button>
                        <button className="tv-add-btn" onClick={handleAddMore}>+ Add More Items</button>
                    </div>
                </div>

                {/* FLOATING TRACK BUTTON — visible when order exists and not in tracking/success/sheet */}
                {trackingOrderId && !showTracking && !showSuccess && !showSheet && !actionCase && (
                    <div className="floating-track">
                        <div className="ft-inner" onClick={() => setShowTracking(true)}>
                            <div className="ft-l">
                                <div className="ft-badge">📍 LIVE</div>
                                <span className="ft-lbl">Track Your Order</span>
                            </div>
                            <span className="ft-arrow">›</span>
                        </div>
                    </div>
                )}

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
