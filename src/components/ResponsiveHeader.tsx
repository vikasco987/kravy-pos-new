
// src/components/ResponsiveHeader.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactDOM from "react-dom";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { FiSearch } from "react-icons/fi";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";

export default function ResponsiveHeader() {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // profile dropdown
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // read initial theme from html class
    if (typeof document !== "undefined") {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      const tgt = e.target as Node | null;
      if (!open) return;
      if (btnRef.current && tgt && btnRef.current.contains(tgt)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // toggle theme (client-only)
  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setTheme("light");
    } else {
      root.classList.add("dark");
      setTheme("dark");
    }
  };

  // compute display name and email once (safe for SSR)
  const displayName =
    isLoaded && isSignedIn
      ? user?.fullName || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.primaryEmailAddress?.emailAddress || "User"
      : "Guest";

  const profileEmail =
    isLoaded && isSignedIn
      ? user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? ""
      : "";

  const profileMenu = (
    <div className="w-56 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</div>
        {profileEmail && <div className="text-xs text-slate-500 dark:text-slate-300 truncate">{profileEmail}</div>}
      </div>

      <div className="flex flex-col">
        <Link href="/profile" className="px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">My Profile</Link>
        <Link href="/settings" className="px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Settings</Link>
        <div className="px-4 py-2">
          <SignOutButton>
            <button className="w-full text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 px-0 py-2">Sign out</button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-shadow bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* left - logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold">K</div>
                <div className="hidden sm:block">
                  <div className="text-lg font-semibold dark:text-white">Kravy</div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">Billing</div>
                </div>
              </Link>
            </div>

            {/* middle - search (responsive) */}
            <div className="flex-1 px-4">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-slate-400" />
                  </div>
                  <input
                    aria-label="Search"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                    placeholder="Search invoices, products, orders..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* right - actions */}
            <div className="flex items-center gap-3">
              {/* navigation short links (desktop) */}
              <nav className="hidden md:flex items-center gap-3">
                <Link href="/dashboard" className={`text-sm px-2 py-1 rounded ${pathname === "/dashboard" ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>Dashboard</Link>
                <Link href="/products" className={`text-sm px-2 py-1 rounded ${pathname?.startsWith("/products") ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>Products</Link>
              </nav>

              {/* theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {mounted && theme === "dark" ? <HiOutlineSun /> : <HiOutlineMoon />}
              </button>

              {/* profile */}
              <div className="relative">
                <button
                  ref={btnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((s) => !s);
                  }}
                  aria-haspopup="true"
                  aria-expanded={open}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    {isLoaded && isSignedIn && user?.imageUrl ? (
                      // use plain img to avoid next/image domain config here
                      <img src={user.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-sm font-semibold dark:text-white">{(isLoaded && isSignedIn && displayName.charAt(0)) || "U"}</span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm">{isLoaded && isSignedIn ? displayName : "Guest"}</span>
                </button>

                {mounted && open && typeof document !== "undefined"
                  ? ReactDOM.createPortal(
                      <div style={{ position: "fixed", top: 64, right: 28, zIndex: 9999 }}>{profileMenu}</div>,
                      document.body
                    )
                  : null}
              </div>

              {/* mobile menu button */}
              <button aria-label="open mobile menu" className="md:hidden p-2 rounded-md border border-slate-200 dark:border-slate-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
