"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  useUser
} from "@clerk/nextjs";
import { useSearch } from "@/components/SearchContext";
import { useTheme } from "@/components/ThemeProvider";
import { Search, Bell, MapPin, Menu, X, Sun, Moon, Monitor } from "lucide-react";

interface NavbarProps {
  isMobile?: boolean;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function Navbar({ isMobile = false, onMenuToggle, sidebarOpen = false }: NavbarProps) {
  const { user } = useUser();
  const { query, setQuery } = useSearch();
  const { collapsed } = useSidebar();
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [greeting, setGreeting] = useState("Good Day");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

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
      marginLeft: isMobile ? 0 : (collapsed ? "72px" : "260px"),
      transition: "margin-left 0.4s cubic-bezier(.4,0,.2,1), background 0.4s ease",
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
              {user?.firstName || "User"}
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
            <form onSubmit={handleSearch} style={{ position: "relative" }}>
              <Search style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--kravy-text-faint)",
                width: "15px",
                height: "15px"
              }} />
              <input
                type="text"
                placeholder="Search bills, items..."
                className="kravy-input"
                style={{
                  paddingLeft: "38px",
                  width: "260px",
                  height: "40px"
                }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
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

          {/* User Button */}
          {!isMobile && (
            <div style={{
              paddingLeft: "8px",
              borderLeft: "1px solid var(--kravy-border)",
              marginLeft: "4px"
            }}>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button style={{
                    background: "var(--kravy-accent)",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}>Sign In</button>
                </SignInButton>
              </SignedOut>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
