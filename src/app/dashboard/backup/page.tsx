"use client";

import { useState } from "react";
import { Database, Download, Upload, RefreshCw, Shield, Clock, CheckCircle, AlertCircle, HardDrive, Cloud, FileText, Calendar } from "lucide-react";

export default function BackupPage() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const backupHistory = [
    { id: 1, date: "2024-01-15 14:30", size: "2.4 MB", type: "Automatic", status: "completed" },
    { id: 2, date: "2024-01-14 09:15", size: "2.3 MB", type: "Manual", status: "completed" },
    { id: 3, date: "2024-01-13 18:45", size: "2.4 MB", type: "Automatic", status: "completed" },
    { id: 4, date: "2024-01-12 12:00", size: "2.2 MB", type: "Manual", status: "completed" },
  ];

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    
    // Simulate backup progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setBackupProgress(i);
    }
    
    setIsCreatingBackup(false);
    setBackupProgress(0);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "completed": return <CheckCircle size={16} style={{ color: "#10B981" }} />;
      case "in-progress": return <RefreshCw size={16} style={{ color: "#F59E0B" }} />;
      case "failed": return <AlertCircle size={16} style={{ color: "#EF4444" }} />;
      default: return <Clock size={16} style={{ color: "#6B7280" }} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#F1F0EC", letterSpacing: "-1px" }}>
            Data Backup & Recovery
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#4A5568", marginTop: "4px" }}>
            Secure your business data with automatic and manual backups.
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
          style={{
            background: isCreatingBackup ? "rgba(107,114,128,0.3)" : "linear-gradient(135deg, #FF6B35, #F59E0B)",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: isCreatingBackup ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: isCreatingBackup ? "none" : "0 4px 16px rgba(255,107,53,0.3)"
          }}
        >
          {isCreatingBackup ? (
            <>
              <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
              Creating Backup...
            </>
          ) : (
            <>
              <Download size={18} /> Create Backup
            </>
          )}
        </button>
      </div>

      {/* Backup Progress */}
      {isCreatingBackup && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "24px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(245,158,11,0.1)", color: "#F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#F1F0EC", marginBottom: "4px" }}>
                Creating Backup...
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                Please wait while we secure your data
              </p>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#F59E0B" }}>
              {backupProgress}%
            </div>
          </div>
          <div style={{
            width: "100%", height: "8px", background: "rgba(255,255,255,0.1)",
            borderRadius: "4px", overflow: "hidden"
          }}>
            <div style={{
              width: `${backupProgress}%`, height: "100%",
              background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
              borderRadius: "4px", transition: "width 0.3s ease"
            }} />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(16,185,129,0.1)", color: "#10B981",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Database size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F1F0EC" }}>4</div>
              <div style={{ fontSize: "0.75rem", color: "#4A5568" }}>Total Backups</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <HardDrive size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F1F0EC" }}>9.3</div>
              <div style={{ fontSize: "0.75rem", color: "#4A5568" }}>Total Size (MB)</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(245,158,11,0.1)", color: "#F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Cloud size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F1F0EC" }}>Auto</div>
              <div style={{ fontSize: "0.75rem", color: "#4A5568" }}>Backup Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "24px",
        backdropFilter: "blur(10px)"
      }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F1F0EC", marginBottom: "20px" }}>
          Backup Settings
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "rgba(16,185,129,0.1)", color: "#10B981",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#F1F0EC", marginBottom: "2px" }}>
                Automatic Backup
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Daily at 2:00 AM</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#F1F0EC", marginBottom: "2px" }}>
                Encryption
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>AES-256 Enabled</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "rgba(245,158,11,0.1)", color: "#F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#F1F0EC", marginBottom: "2px" }}>
                Retention Period
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>30 Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F1F0EC", marginBottom: "20px" }}>
          Backup History
        </h2>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Date & Time</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Size</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Type</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Status</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "#4A5568" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map((backup) => (
                  <tr key={backup.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "16px", color: "#F1F0EC", fontWeight: 500 }}>{backup.date}</td>
                    <td style={{ padding: "16px", color: "#6B7280" }}>{backup.size}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: backup.type === "Automatic" ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.1)",
                        color: backup.type === "Automatic" ? "#10B981" : "#8B5CF6"
                      }}>
                        {backup.type}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {getStatusIcon(backup.status)}
                        <span style={{ fontSize: "0.85rem", color: "#6B7280", fontWeight: 500 }}>
                          {backup.status === "completed" ? "Completed" : backup.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button style={{
                          background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                          border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer"
                        }}>
                          <Download size={16} />
                        </button>
                        <button style={{
                          background: "rgba(245,158,11,0.1)", color: "#F59E0B",
                          border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer"
                        }}>
                          <Upload size={16} />
                        </button>
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
