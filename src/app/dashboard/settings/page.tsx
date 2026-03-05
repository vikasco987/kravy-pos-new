"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserCircle, Activity, Users, BarChart3,
  ChevronRight, Shield, Bell, Palette, HelpCircle, Database
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const [role, setRole] = useState<string>("");
  const { resolvedTheme, theme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => { });
  }, []);

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          href: "/dashboard/profile",
          icon: <UserCircle size={20} />,
          color: "#8B5CF6",
          label: "Business Profile",
          desc: "Update your store name, address and branding"
        },
        {
          href: "/dashboard/settings/activity",
          icon: <Activity size={20} />,
          color: "#10B981",
          label: "Activity Log",
          desc: "View recent actions and login history"
        },
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          href: "#",
          icon: <Bell size={20} />,
          color: "#FF6B35",
          label: "Notifications",
          desc: "Configure alert preferences and reminders"
        },
        {
          href: "/dashboard/security",
          icon: <Shield size={20} />,
          color: "#EF4444",
          label: "Security",
          desc: "Password, 2FA and access control settings"
        },
        {
          href: "/dashboard/backup",
          icon: <Database size={20} />,
          color: "#F59E0B",
          label: "Data Backup",
          desc: "Export and backup your billing data"
        },
      ]
    },
    {
      title: "Support",
      items: [
        {
          href: "/dashboard/help",
          icon: <HelpCircle size={20} />,
          color: "#06B6D4",
          label: "Help & Support",
          desc: "Get assistance and read documentation"
        },
      ]
    },
    ...(role === "ADMIN" ? [{
      title: "Administration",
      items: [
        {
          href: "/admin/users",
          icon: <Users size={20} />,
          color: "#EC4899",
          label: "User Management",
          desc: "Manage team members, roles and permissions"
        },
        {
          href: "/admin/reports",
          icon: <BarChart3 size={20} />,
          color: "#8B5CF6",
          label: "System Reports",
          desc: "Access advanced sales and system analytics"
        },
      ]
    }] : [])
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "860px" }} className="kravy-page-fade">

      {/* ── Page Header ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: "6px", height: "32px",
            background: "linear-gradient(180deg, #8B5CF6, #6D28D9)",
            borderRadius: "10px"
          }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>
            Settings
          </h1>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--kravy-text-muted)", marginLeft: "16px", fontFamily: "monospace" }}>
          Manage your account, preferences and business configuration
        </p>
      </div>

      {/* ── Appearance Card ── */}
      <div className="kravy-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(139,92,246,0.4)"
          }}>
            <Palette size={18} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--kravy-text-primary)" }}>Appearance</h3>
            <p style={{ fontSize: "0.72rem", color: "var(--kravy-text-muted)", fontFamily: "monospace" }}>Choose your preferred display theme</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { key: "light", label: "☀️ Light", desc: "Bright, clean interface" },
            { key: "dark", label: "🌙 Dark", desc: "Easy on the eyes" },
            { key: "system", label: "💻 System", desc: "Follows device setting" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key as any)}
              style={{
                flex: "1 1 160px", padding: "16px 18px", borderRadius: "14px",
                border: `2px solid ${theme === opt.key ? "var(--kravy-accent-purple)" : "var(--kravy-border)"}`,
                background: theme === opt.key
                  ? "var(--kravy-accent-purple)12"
                  : "var(--kravy-surface)",
                cursor: "pointer", textAlign: "left", transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "1rem", marginBottom: "4px" }}>{opt.label}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--kravy-text-muted)", fontFamily: "monospace" }}>{opt.desc}</div>
              {theme === opt.key && (
                <div style={{
                  marginTop: "8px", fontSize: "0.62rem", fontWeight: 700,
                  color: "var(--kravy-accent-purple)", fontFamily: "monospace"
                }}>
                  ✓ Active
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Settings Groups ── */}
      {settingsGroups.map((group, gi) => (
        <div key={gi}>
          <div style={{
            fontSize: "0.65rem", fontWeight: 700, color: "var(--kravy-text-muted)",
            textTransform: "uppercase", letterSpacing: "1.5px",
            fontFamily: "monospace", marginBottom: "12px", paddingLeft: "4px"
          }}>
            {group.title}
          </div>
          <div className="kravy-card" style={{ padding: 0, overflow: "hidden" }}>
            {group.items.map((item, ii) => (
              <motion.div
                key={ii}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (gi * 0.1) + (ii * 0.06) }}
              >
                <Link href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: "16px",
                      padding: "18px 24px",
                      borderBottom: ii < group.items.length - 1 ? "1px solid var(--kravy-border)" : "none",
                      transition: "background 0.15s", cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--kravy-surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "12px",
                      background: `${item.color}15`, border: `1px solid ${item.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: item.color, flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--kravy-text-primary)", marginBottom: "2px" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)" }}>
                        {item.desc}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--kravy-text-faint)" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Version Footer ── */}
      <div style={{
        textAlign: "center", fontSize: "0.65rem", color: "var(--kravy-text-faint)",
        fontFamily: "monospace", paddingBottom: "8px"
      }}>
        KravyPOS · v2.0.0 · All systems operational ✓
      </div>
    </div>
  );
}
