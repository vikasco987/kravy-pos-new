"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import {
  UserButton,
  useUser
} from "@clerk/nextjs";
import { useAuthContext } from "@/components/AuthContext";
import { useSearch } from "@/components/SearchContext";
import { useTheme } from "@/components/ThemeProvider";
import { Search, Bell, MapPin, Menu, X, Sun, Moon, Monitor, Volume2, Package, Receipt, Users, ArrowRight, Loader2, XCircle, LogOut } from "lucide-react";
import { kravy } from "@/lib/sounds";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  isMobile?: boolean;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function Navbar({ isMobile = false, onMenuToggle, sidebarOpen = false }: NavbarProps) {
  const { user: clerkUser } = useUser();
  const { user: customUser, loading: authLoading } = useAuthContext();
  
  // Effective user for display
  const user = customUser || clerkUser;
  
  const { query, setQuery } = useSearch();
  const { collapsed } = useSidebar();
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [greeting, setGreeting] = useState("Good Day");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ items: any[], bills: any[], parties: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("SEARCH ERROR:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.dispatchEvent(
      new CustomEvent("kravy-search", {
        detail: query.trim(),
      })
    );
    setQuery("");
  };

  const isDark = resolvedTheme === "dark";

  const themeOptions = [
    { key: "light", label: "Light", icon: <Sun size={14} /> },
    { key: "dark", label: "Dark", icon: <Moon size={14} /> },
    { key: "system", label: "System", icon: <Monitor size={14} /> },
  ] as const;

  return (
    <header style={{
      height: "72px",
      background: "var(--kravy-navbar-bg)",
      borderBottom: "1px solid var(--kravy-border)",
      backdropFilter: "blur(20px)",
      display: "flex",
      alignItems: "center",
      padding: isMobile ? "0 16px" : "0 28px",
      transition: "background 0.4s ease",
      zIndex: 40,
      position: "sticky",
      top: 0,
      boxShadow: isDark
        ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)"
        : "0 1px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
      }}>
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              background: "var(--kravy-surface)",
              border: "1px solid var(--kravy-border)",
              borderRadius: "10px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--kravy-text-primary)",
              marginRight: "12px",
              flexShrink: 0
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Welcome Section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? "1rem" : "1.1rem",
            fontWeight: 800,
            color: "var(--kravy-text-primary)",
            letterSpacing: "-0.4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            lineHeight: 1.2
          }}>
            {/* Live dot */}
            <span className="kravy-live-dot" style={{ flexShrink: 0 }} />
            {greeting},{" "}
            <span style={{
              background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {(user as any)?.name || (user as any)?.firstName || "User"}
            </span>
            <span style={{ fontSize: isMobile ? "1.1rem" : "1.25rem", marginLeft: "2px" }}>👋</span>
          </div>
          {!isMobile && (
            <div style={{
              fontSize: "0.7rem",
              color: "var(--kravy-text-muted)",
              fontWeight: 500,
              marginTop: "3px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              letterSpacing: "0.1px"
            }}>
              <MapPin size={10} strokeWidth={2.5} />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span style={{ color: "var(--kravy-border-strong)" }}>·</span>
              <span style={{ color: "var(--kravy-text-faint)" }}>Main Branch</span>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", alignItems: "center" }}>

          {/* Search Bar - Hidden on mobile */}
          {!isMobile && (
            <div style={{ position: "relative" }}>
              <form onSubmit={handleSearch} style={{ position: "relative" }}>
                {isSearching ? (
                  <Loader2 style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--kravy-brand)",
                    width: "14px",
                    height: "14px"
                  }} className="animate-spin" />
                ) : (
                  <Search style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--kravy-text-faint)",
                    width: "15px",
                    height: "15px"
                  }} />
                )}
                <input
                  type="text"
                  placeholder="Universal Search..."
                  className="kravy-input"
                  style={{
                    paddingLeft: "38px",
                    width: "320px",
                    height: "40px",
                    border: searchResults ? "1px solid var(--kravy-brand)" : "1px solid var(--kravy-border)",
                    transition: "all 0.3s ease"
                  }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </form>

              {/* Universal Search Results Dropdown */}
              <AnimatePresence>
                {searchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.98 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 12px)",
                      right: 0,
                      width: "420px",
                      background: isDark ? "#0A0C14" : "#ffffff",
                      border: "1px solid var(--kravy-border)",
                      borderRadius: "20px",
                      boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.6)" : "0 12px 40px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                      zIndex: 1000,
                      backdropFilter: "blur(20px)"
                    }}
                  >
                    <div style={{ padding: "16px", maxHeight: "80vh", overflowY: "auto" }} className="custom-scrollbar">
                      {/* Results Header */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid var(--kravy-border)"
                      }}>
                        <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", color: "var(--kravy-text-muted)", letterSpacing: "2px" }}>
                          Universal Matches
                        </span>
                        <button onClick={() => setSearchResults(null)} style={{ color: "var(--kravy-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                          <X size={14} />
                        </button>
                      </div>

                      {/* Items Section */}
                      {searchResults.items.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", fontWeight: 800, color: "var(--kravy-brand)", marginBottom: "8px", textTransform: "uppercase" }}>
                            <Package size={10} /> Inventory Assets
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {searchResults.items.map(item => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  router.push("/dashboard/inventory");
                                  window.dispatchEvent(new CustomEvent("kravy-search", { detail: item.name }));
                                  setSearchResults(null);
                                  setQuery("");
                                }}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "8px 12px", borderRadius: "12px", background: "var(--kravy-bg-2)",
                                  border: "none", width: "100%", cursor: "pointer", textAlign: "left"
                                }}
                                className="hover:bg-[var(--kravy-brand)]/[0.05] transition-colors group"
                              >
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--kravy-text-primary)" }}>{item.name}</span>
                                  <span style={{ fontSize: "9px", color: "var(--kravy-text-muted)" }}>Stock: {item.currentStock ?? 0} · ₹{item.price}</span>
                                </div>
                                <ArrowRight size={12} style={{ color: "var(--kravy-text-faint)" }} className="group-hover:translate-x-1 group-hover:text-[var(--kravy-brand)] transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bills Section */}
                      {searchResults.bills.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", fontWeight: 800, color: "var(--kravy-brand)", marginBottom: "8px", textTransform: "uppercase" }}>
                            <Receipt size={10} /> Transactions
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {searchResults.bills.map(bill => (
                              <Link
                                key={bill.id}
                                href={`/dashboard/reports/sales/daily`}
                                onClick={() => setSearchResults(null)}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "8px 12px", borderRadius: "12px", background: "var(--kravy-bg-2)",
                                  textDecoration: "none", color: "inherit"
                                }}
                                className="hover:bg-[var(--kravy-brand)]/[0.05] transition-colors group"
                              >
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--kravy-text-primary)" }}>{bill.billNumber}</div>
                                  <div style={{ fontSize: "9px", color: "var(--kravy-text-muted)" }}>Total: ₹{bill.total} · {new Date(bill.createdAt).toLocaleDateString()}</div>
                                </div>
                                <ArrowRight size={12} style={{ color: "var(--kravy-text-faint)" }} className="group-hover:translate-x-1 transition-all" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parties Section */}
                      {searchResults.parties.length > 0 && (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", fontWeight: 800, color: "var(--kravy-brand)", marginBottom: "8px", textTransform: "uppercase" }}>
                            <Users size={10} /> High-Value Clients
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {searchResults.parties.map(party => (
                              <Link
                                key={party.id}
                                href={`/dashboard/parties`}
                                onClick={() => setSearchResults(null)}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "8px 12px", borderRadius: "12px", background: "var(--kravy-bg-2)",
                                  textDecoration: "none", color: "inherit"
                                }}
                                className="hover:bg-[var(--kravy-brand)]/[0.05] transition-colors group"
                              >
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--kravy-text-primary)" }}>{party.name}</div>
                                  <div style={{ fontSize: "9px", color: "var(--kravy-text-muted)" }}>Tel: {party.phone}</div>
                                </div>
                                <ArrowRight size={12} style={{ color: "var(--kravy-text-faint)" }} className="group-hover:translate-x-1 transition-all" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.items.length === 0 && searchResults.bills.length === 0 && searchResults.parties.length === 0 && (
                        <div style={{ padding: "32px 16px", textAlign: "center", opacity: 0.5 }}>
                          <XCircle size={32} style={{ margin: "0 auto 12px", display: "block" }} />
                          <div style={{ fontSize: "12px", fontWeight: 800 }}>No Global Matches Found</div>
                          <div style={{ fontSize: "9px", fontWeight: 500 }}>Try generic terms like "Item" or "Bill"</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Theme Toggle ── */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setThemeMenuOpen(o => !o)}
              title="Switch theme"
              style={{
                width: isMobile ? "38px" : "40px",
                height: isMobile ? "38px" : "40px",
                borderRadius: "12px",
                background: "var(--kravy-surface)",
                border: "1px solid var(--kravy-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: isDark ? "#F59E0B" : "#7C3AED",
                transition: "all 0.2s",
                flexShrink: 0
              }}
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Theme dropdown */}
            {themeMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 100 }}
                  onClick={() => setThemeMenuOpen(false)}
                />
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  background: isDark ? "#0D0F1A" : "#ffffff",
                  border: "1px solid var(--kravy-border)",
                  borderRadius: "14px",
                  padding: "8px",
                  boxShadow: isDark
                    ? "0 16px 40px rgba(0,0,0,0.5)"
                    : "0 8px 30px rgba(0,0,0,0.15)",
                  zIndex: 101,
                  minWidth: "150px"
                }}>
                  <div style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "var(--kravy-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    padding: "4px 8px 8px",
                    fontFamily: "monospace"
                  }}>
                    Appearance
                  </div>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setTheme(opt.key); setThemeMenuOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        borderRadius: "10px",
                        border: "none",
                        background: theme === opt.key
                          ? "var(--kravy-accent-purple)20"
                          : "transparent",
                        color: theme === opt.key
                          ? "var(--kravy-accent-purple)"
                          : "var(--kravy-text-secondary)",
                        fontSize: "0.85rem",
                        fontWeight: theme === opt.key ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left"
                      }}
                      onMouseEnter={(e) => {
                        if (theme !== opt.key)
                          e.currentTarget.style.background = "var(--kravy-surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (theme !== opt.key)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                      {theme === opt.key && (
                        <span style={{ marginLeft: "auto", fontSize: "0.7rem" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div style={{
            width: isMobile ? "38px" : "40px",
            height: isMobile ? "38px" : "40px",
            borderRadius: "12px",
            background: "var(--kravy-surface)",
            border: "1px solid var(--kravy-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--kravy-accent-purple)",
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
            transition: "all 0.2s"
          }}>
            <Bell size={isMobile ? 17 : 19} />
            <div style={{
              position: "absolute",
              top: "9px",
              right: "9px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#EF4444",
              border: "2px solid var(--kravy-bg)"
            }} />
          </div>

          {/* 🔊 Sound Test Button — Click to test audio */}
          <button
            onClick={() => kravy.orderBell()}
            title="Test Sound 🔊"
            style={{
              width: isMobile ? "38px" : "40px",
              height: isMobile ? "38px" : "40px",
              borderRadius: "12px",
              background: "var(--kravy-surface)",
              border: "1px solid var(--kravy-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#10B981",
              flexShrink: 0,
              transition: "all 0.2s"
            }}
          >
            <Volume2 size={isMobile ? 17 : 19} />
          </button>

          {/* User Button */}
          {!isMobile && (
            <div style={{
              paddingLeft: "8px",
              borderLeft: "1px solid var(--kravy-border)",
              marginLeft: "4px"
            }}>
              {clerkUser ? (
                <UserButton afterSignOutUrl="/" />
              ) : customUser ? (
                <div className="flex items-center gap-3">
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#10B981"
                  }}>
                    <Users size={16} />
                  </div>
                  {/* Logout Button for Custom Session */}
                  <button 
                    onClick={() => {
                      kravy.close();
                      document.cookie = "kravy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                      document.cookie = "staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                      window.location.href = "/";
                    }}
                    className="group flex items-center justify-center p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 transition-all active:scale-95"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link href="/">
                  <button style={{
                    background: "var(--kravy-brand)",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(255,107,53,0.2)"
                  }}>Sign In</button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
