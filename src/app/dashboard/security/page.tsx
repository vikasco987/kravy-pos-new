"use client";

import { useState } from "react";
import { Shield, Lock, Key, Eye, EyeOff, AlertTriangle, CheckCircle, User, Bell, Smartphone, Mail, ShieldCheck, KeyRound } from "lucide-react";

export default function SecurityPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const securitySettings = [
    {
      icon: <Lock size={20} />,
      title: "Password Security",
      description: "Strong password with special characters",
      status: "secure",
      lastUpdated: "2 days ago"
    },
    {
      icon: <Smartphone size={20} />,
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security",
      status: twoFactorEnabled ? "enabled" : "disabled",
      lastUpdated: "Never"
    },
    {
      icon: <Bell size={20} />,
      title: "Login Alerts",
      description: "Get notified of new login attempts",
      status: "enabled",
      lastUpdated: "Always active"
    },
    {
      icon: <Mail size={20} />,
      title: "Email Verification",
      description: "Verified email address",
      status: "verified",
      lastUpdated: "1 month ago"
    }
  ];

  const recentActivity = [
    { id: 1, action: "Login successful", location: "Mumbai, India", time: "2 hours ago", status: "success" },
    { id: 2, action: "Password changed", location: "Mumbai, India", time: "2 days ago", status: "success" },
    { id: 3, action: "Login attempt failed", location: "Unknown", time: "3 days ago", status: "warning" },
    { id: 4, action: "Profile updated", location: "Mumbai, India", time: "1 week ago", status: "success" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "secure": case "enabled": case "verified": return { color: "#10B981", background: "rgba(16,185,129,0.1)" };
      case "disabled": return { color: "#F59E0B", background: "rgba(245,158,11,0.1)" };
      case "warning": return { color: "#EF4444", background: "rgba(239,68,68,0.1)" };
      default: return { color: "#6B7280", background: "rgba(107,114,128,0.1)" };
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle size={16} style={{ color: "#10B981" }} />;
      case "warning": return <AlertTriangle size={16} style={{ color: "#F59E0B" }} />;
      default: return <Shield size={16} style={{ color: "#6B7280" }} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>
            Security Settings
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", marginTop: "4px" }}>
            Manage your account security and privacy settings.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{
            background: "var(--kravy-surface)",
            color: "var(--kravy-text-primary)",
            border: "1px solid var(--kravy-border)",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "var(--kravy-card-shadow)"
          }}>
            <ShieldCheck size={18} /> Security Audit
          </button>
        </div>
      </div>

      {/* Security Overview */}
      <div style={{
        background: "var(--kravy-bg-2)",
        border: "1px solid var(--kravy-border)",
        borderRadius: "20px",
        padding: "32px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "120px",
          height: "120px",
          background: "var(--kravy-brand)",
          opacity: 0.1,
          borderRadius: "50%",
          filter: "blur(40px)"
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px",
            background: "rgba(16, 185, 129, 0.15)", color: "#10B981",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Shield size={32} />
          </div>
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "8px" }}>
              Your Security Score: Excellent
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--kravy-text-muted)", marginBottom: "16px" }}>
              Your account is well-protected with strong security measures in place.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={16} style={{ color: "#10B981" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)" }}>Strong Password</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={16} style={{ color: "#10B981" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)" }}>Login Alerts Active</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)" }}>2FA Recommended</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings Grid */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "20px" }}>
          Security Features
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {securitySettings.map((setting, index) => (
            <div
              key={index}
              style={{
                background: "var(--kravy-surface)",
                border: "1px solid var(--kravy-border)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "var(--kravy-card-shadow)"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: "var(--kravy-brand)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  {setting.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--kravy-text-primary)", marginBottom: "8px" }}>
                    {setting.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", marginBottom: "12px" }}>
                    {setting.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "0.75rem", color: "var(--kravy-text-faint)"
                    }}>
                      Updated {setting.lastUpdated}
                    </span>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      ...getStatusColor(setting.status)
                    }}>
                      {setting.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password Change Section */}
      <div style={{
        background: "var(--kravy-surface)",
        border: "1px solid var(--kravy-border)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "var(--kravy-card-shadow)"
      }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "20px" }}>
          Change Password
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--kravy-text-primary)", marginBottom: "8px", display: "block" }}>
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 16px",
                  background: "var(--kravy-input-bg)",
                  border: "1px solid var(--kravy-input-border)",
                  borderRadius: "12px",
                  color: "var(--kravy-text-primary)",
                  fontSize: "0.9rem",
                  outline: "none"
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", color: "var(--kravy-text-faint)", cursor: "pointer"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-primary)", marginBottom: "8px", display: "block", textTransform: "uppercase", letterSpacing: "1px" }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "var(--kravy-input-bg)",
                border: "1px solid var(--kravy-input-border)",
                borderRadius: "12px",
                color: "var(--kravy-text-primary)",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-primary)", marginBottom: "8px", display: "block", textTransform: "uppercase", letterSpacing: "1px" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "var(--kravy-input-bg)",
                border: "1px solid var(--kravy-input-border)",
                borderRadius: "12px",
                color: "var(--kravy-text-primary)",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <button style={{
            background: "var(--kravy-brand)",
            color: "white",
            border: "none",
            padding: "14px 28px",
            borderRadius: "14px",
            fontWeight: 800,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 8px 20px rgba(139,92,246,0.3)",
            width: "fit-content",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            <KeyRound size={18} /> Update Password
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "20px" }}>
          Recent Security Activity
        </h2>
        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "var(--kravy-card-shadow)"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--kravy-bg-2)" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Activity</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Location</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Time</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id} style={{ borderTop: "1px solid var(--kravy-border)" }}>
                    <td style={{ padding: "16px", color: "var(--kravy-text-primary)", fontWeight: 500 }}>{activity.action}</td>
                    <td style={{ padding: "16px", color: "var(--kravy-text-muted)" }}>{activity.location}</td>
                    <td style={{ padding: "16px", color: "var(--kravy-text-muted)" }}>{activity.time}</td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {getActivityIcon(activity.status)}
                        <span style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", fontWeight: 500 }}>
                          {activity.status === "success" ? "Success" : activity.status === "warning" ? "Warning" : "Unknown"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
