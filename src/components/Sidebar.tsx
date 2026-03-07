"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useTheme } from "./ThemeProvider";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  LayoutGrid,
  PlusCircle,
  ClipboardList,
  QrCode,
  UtensilsCrossed,
  Package,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  History,
  UserCircle,
  Receipt,
  ShoppingCart,
  Home,
  PieChart,
  Database,
  Shield,
  HelpCircle,
  Archive,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  Filter,
  Search,
  Menu,
  Percent,
  X,
  Check,
  AlertCircle,
  Zap,
  Target,
  Award,
  Star,
  Heart,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Tag,
  DollarSign,
  TrendingDown,
  Activity,
  Globe,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Printer,
  Save,
  FolderOpen,
  Folder,
  File,
  FilePlus,
  Edit,
  Trash,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  Maximize2,
  Minimize2,
  Fullscreen,
  LogIn,
  UserPlus,
  UserMinus,
  Crown,
  Gem,
  Gift,
  Sparkles,
  Flame,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Server,
  HardDrive,
  Wifi,
  Battery,
  BatteryCharging,
  Power,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    group: "OPERATIONS",
    items: [
      { icon: <Home size={18} />, label: "Store Dashboard", href: "/dashboard", badge: "Live", badgeColor: "#10B981" },
      { icon: <ShoppingCart size={18} />, label: "Quick POS Billing", href: "/dashboard/billing/checkout", badge: "Fast", badgeColor: "#FF6B35" },
      { icon: <LayoutGrid size={18} />, label: "Table Status", href: "/dashboard/tables" },
      { icon: <Receipt size={18} />, label: "Past Bills / History", href: "/dashboard/billing" },
      { icon: <Activity size={18} />, label: "Kitchen Workflow", href: "/dashboard/workflow", badge: "Queue", badgeColor: "#EF4444" },
    ]
  },
  {
    group: "STORE CATALOG",
    items: [
      { icon: <UtensilsCrossed size={18} />, label: "Browse Products", href: "/dashboard/menu/view" },
      { icon: <PlusCircle size={18} />, label: "Add Single Item", href: "/dashboard/menu/upload" },
      { icon: <Upload size={18} />, label: "Excel Bulk Import", href: "/dashboard/store-item-upload", badge: "Import", badgeColor: "#FF6B35" },
      { icon: <Settings size={18} />, label: "Category & Editor", href: "/dashboard/menu/edit" },
    ]
  },
  {
    group: "RESOURCES",
    items: [
      { icon: <Users size={18} />, label: "Customer Parties", href: "/dashboard/parties" },
      { icon: <Package size={18} />, label: "Inventory Stock", href: "/dashboard/inventory" },
      { icon: <QrCode size={18} />, label: "QR Order Terminal", href: "/dashboard/qr-orders", badge: "Scan", badgeColor: "#8B5CF6" },
    ]
  },
  {
    group: "INSIGHTS",
    items: [
      { icon: <BarChart3 size={18} />, label: "Revenue Analysis", href: "#", badge: "Soon", badgeColor: "#64748B" },
      { icon: <PieChart size={18} />, label: "Mode of Payment", href: "#", badge: "Soon", badgeColor: "#64748B" },
      { icon: <TrendingUp size={18} />, label: "Business Growth", href: "#", badge: "Soon", badgeColor: "#64748B" },
    ]
  },
  {

    group: "ADMINISTRATION",
    items: [
      { icon: <UserCircle size={18} />, label: "Business Profile", href: "/dashboard/profile" },
      { icon: <Settings size={18} />, label: "POS Settings", href: "/dashboard/settings" },
      { icon: <Percent size={18} />, label: "Tax Management", href: "/dashboard/settings/tax", badge: "GST", badgeColor: "#F59E0B" },
      { icon: <Shield size={18} />, label: "Security & Backup", href: "/dashboard/backup" },
      { icon: <Archive size={18} />, label: "Archive & Trash", href: "/dashboard/billing/deleted" },
      { icon: <HelpCircle size={18} />, label: "Help & Support", href: "/dashboard/help" },
    ]
  }
];

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const { user } = useUser();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <aside style={{
      width: collapsed ? "72px" : "260px",
      minWidth: collapsed ? "72px" : "260px",
      height: "100vh",
      background: isDark
        ? "linear-gradient(145deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)"
        : "linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)",
      borderRight: isDark
        ? "1px solid rgba(139,92,246,0.15)"
        : "1px solid rgba(139,92,246,0.1)",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
      boxShadow: isDark
        ? "4px 0 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)"
        : "4px 0 24px rgba(0,0,0,0.04), 0 0 0 1px rgba(139,92,246,0.05)",
      overflow: "hidden",
    }}>

      {/* Animated Gradient Background */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59,130,246,0.12) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(236,72,153,0.1) 0%, transparent 50%),
          linear-gradient(180deg, rgba(139,92,246,0.03) 0%, transparent 100%)
        `,
        pointerEvents: "none",
      }} />

      {/* Floating Particles Effect */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(139,92,246,0.3) 0%, transparent 2px),
          radial-gradient(circle at 75% 75%, rgba(59,130,246,0.3) 0%, transparent 2px),
          radial-gradient(circle at 50% 10%, rgba(236,72,153,0.3) 0%, transparent 2px),
          radial-gradient(circle at 10% 90%, rgba(34,197,94,0.3) 0%, transparent 2px)
        `,
        backgroundSize: "60px 60px, 80px 80px, 100px 100px, 40px 40px",
        backgroundPosition: "0 0, 30px 30px, 60px 10px, 10px 70px",
        pointerEvents: "none",
        opacity: 0.6,
      }} />

      {/* LOGO */}
      <div style={{
        padding: collapsed ? "24px 0" : "24px 24px",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        borderBottom: isDark
          ? "1px solid rgba(139,92,246,0.15)"
          : "1px solid rgba(0,0,0,0.05)",
        minHeight: "80px",
        background: isDark
          ? "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.04))"
          : "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))",
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Glow Effect Behind Logo */}
        <div style={{
          position: "absolute", top: "50%", left: collapsed ? "50%" : "36px",
          transform: "translate(-50%, -50%)",
          width: collapsed ? "60px" : "80px", height: collapsed ? "60px" : "80px",
          background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }} />

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", zIndex: 5 }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: "48px", height: "48px", borderRadius: "16px",
                background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 40px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.2)",
                flexShrink: 0,
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Inner Glow */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                transform: "translateX(-100%)",
              }} />
              <UtensilsCrossed size={26} color="white" style={{ position: "relative", zIndex: 1 }} />
            </motion.div>
            <div>
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, ease: "easeOut" }}
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  color: isDark ? "#FFFFFF" : "#1E293B",
                  letterSpacing: "-1px",
                  lineHeight: 1
                }}
              >
                kravy<span style={{ color: "#8B5CF6", textShadow: isDark ? "0 0 20px rgba(139,92,246,0.7)" : "none" }}>POS</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ease: "easeOut" }}
                style={{ fontSize: "0.6rem", color: "rgba(139,92,246,0.8)", letterSpacing: "3px", fontWeight: 700, marginTop: "3px" }}
              >
                BILLING SYSTEM
              </motion.div>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <motion.div
            whileHover={{ scale: 1.15, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: "48px", height: "48px", borderRadius: "16px",
              background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 12px 40px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.2)",
              position: "relative",
              zIndex: 5
            }}
          >
            <UtensilsCrossed size={26} color="white" />
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "12px", width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#8B5CF6", fontSize: "0.75rem",
            flexShrink: 0, transition: "all 0.3s",
            position: "relative", zIndex: 5
          }}
        >
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="expand"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <ChevronRight size={18} />
              </motion.div>
            ) : (
              <motion.div
                key="collapse"
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <ChevronLeft size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* OUTLET STATUS */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ease: "easeOut" }}
          style={{
            margin: "16px 20px",
            background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "16px", padding: "16px 18px",
            display: "flex", alignItems: "center", gap: "14px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Animated Glow Background */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(34,197,94,0.2) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "12px", height: "12px", borderRadius: "50%",
              background: "linear-gradient(135deg, #22C55E, #10B981)",
              boxShadow: "0 0 20px #22C55E, 0 0 40px rgba(34,197,94,0.5)",
              position: "relative",
              zIndex: 2
            }}
          >
            {/* Inner Pulse */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "6px", height: "6px", borderRadius: "50%",
              background: "rgba(255,255,255,0.8)",
            }} />
          </motion.div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ease: "easeOut" }}
              style={{ fontSize: "0.8rem", fontWeight: 800, color: "#22C55E", textShadow: "0 0 10px rgba(34,197,94,0.5)" }}
            >
              SYSTEM ACTIVE
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ease: "easeOut" }}
              style={{ fontSize: "0.68rem", color: "#10B981", fontFamily: "monospace", fontWeight: 600 }}
            >
              ⚡ Cloud Connected
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* NAV ITEMS */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px", scrollbarWidth: "none" }}>
        {navGroups.map((group) => (
          <div key={group.group} style={{ marginBottom: "12px" }}>
            {!collapsed && (
              <div style={{
                fontSize: "0.58rem", fontWeight: 800,
                color: isDark ? "rgba(255,255,255,0.25)" : "var(--kravy-text-muted)",
                letterSpacing: "2px", padding: "12px 10px 6px",
                textTransform: "uppercase",
                opacity: isDark ? 1 : 0.7,
              }}>{group.group}</div>
            )}
            {group.items.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={item.href} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        gap: "12px", padding: collapsed ? "13px 0" : "11px 12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderRadius: "14px",
                        cursor: item.href === "#" ? "not-allowed" : "pointer",
                        pointerEvents: item.href === "#" ? "none" : "auto",
                        opacity: item.href === "#" ? 0.6 : 1,
                        marginBottom: "3px", transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(255,107,53,0.22) 0%, rgba(245,158,11,0.08) 100%)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(255,107,53,0.2)"
                          : "1px solid transparent",
                        position: "relative",
                        boxShadow: isActive ? "0 2px 12px rgba(255,107,53,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                      }}
                      onHoverStart={() => { }}
                      onHoverEnd={() => { }}
                    >
                      <motion.span
                        animate={{
                          color: isActive ? "#FF6B35" : (isDark ? "rgba(255,255,255,0.38)" : "var(--kravy-text-muted)"),
                          scale: isActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          filter: isActive ? (isDark ? "drop-shadow(0 0 8px rgba(255,107,53,0.6))" : "none") : "none",
                        }}
                      >
                        {item.icon}
                      </motion.span>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          transition={{ delay: 0.1 }}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                        >
                          <motion.span
                            animate={{
                              fontWeight: isActive ? 700 : 500,
                              color: isActive
                                ? (isDark ? "#FFFFFF" : "var(--kravy-orange)")
                                : (isDark ? "rgba(255,255,255,0.5)" : "var(--kravy-text-secondary)"),
                            }}
                            transition={{ duration: 0.2 }}
                            style={{ flex: 1, textAlign: "left", fontSize: "0.875rem", letterSpacing: "-0.01em" }}
                          >
                            {item.label}
                          </motion.span>
                          {item.badge && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              style={{
                                fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px",
                                borderRadius: "20px", fontFamily: "monospace",
                                background: `${item.badgeColor}22`,
                                color: item.badgeColor,
                                border: `1px solid ${item.badgeColor}55`,
                                boxShadow: `0 2px 8px ${item.badgeColor}33`,
                              }}
                            >
                              {item.badge}
                            </motion.span>
                          )}
                        </motion.div>
                      )}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          transition={{ delay: 0.3 }}
                          style={{
                            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                            width: "4px", height: "70%", borderRadius: "2px 0 0 2px",
                            background: "linear-gradient(#FF6B35, #F59E0B)",
                            boxShadow: "0 0 12px rgba(255,107,53,0.5)",
                          }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* USER SECTION AT BOTTOM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          padding: collapsed ? "12px 0" : "16px 14px",
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: "12px",
          marginTop: "auto",
          background: "linear-gradient(135deg, rgba(255,107,53,0.02), transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          {user?.imageUrl ? (
            <motion.img
              src={user.imageUrl}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                border: "2px solid #FF6B35", flexShrink: 0,
                boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
              }}
              alt="User Avatar"
              whileHover={{ boxShadow: "0 6px 24px rgba(255,107,53,0.5)" }}
            />
          ) : (
            <motion.div
              whileHover={{ boxShadow: "0 6px 24px rgba(255,107,53,0.5)" }}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.9rem", fontWeight: 800, color: "#fff",
                flexShrink: 0, boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
              }}
            >
              {user?.firstName?.[0] || 'U'}
            </motion.div>
          )}
        </motion.div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            style={{ flex: 1, minWidth: 0 }}
          >
            <motion.div
              style={{
                fontSize: "0.82rem", fontWeight: 700,
                color: isDark ? "#E2E8F0" : "#1E293B",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}
              whileHover={{ color: "#FF6B35" }}
            >
              {user?.fullName || "Admin User"}
            </motion.div>
            <motion.div
              style={{
                fontSize: "0.62rem", color: "#4A5568", fontFamily: "monospace",
                display: "flex", alignItems: "center", gap: "4px"
              }}
            >
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#10B981", boxShadow: isDark ? "0 0 6px #10B981" : "none",
              }} />
              {user?.primaryEmailAddress?.emailAddress ? "Authorized Access" : "Admin Panel"}
            </motion.div>
          </motion.div>
        )}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
          >
            <SignOutButton>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,107,53,0.1)", color: "#FF6B35" }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: "none", border: "none",
                  color: isDark ? "#6B7280" : "var(--kravy-text-muted)",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  padding: "6px", borderRadius: "8px", transition: "all 0.3s",
                }}
              >
                <LogOut size={18} />
              </motion.button>
            </SignOutButton>
          </motion.div>
        )}
      </motion.div>
    </aside>
  );
}