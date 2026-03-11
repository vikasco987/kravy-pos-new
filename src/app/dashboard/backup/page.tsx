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
    switch (status) {
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
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>
            Data Backup & Recovery
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", marginTop: "4px" }}>
            Secure your business data with automatic and manual backups.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              const res = await fetch("/api/bill-manager/export"); // Reusing bills export for now as primary data
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Kravy_Full_Data_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              } else {
                alert("Export failed");
              }
            }}
            style={{
              background: "var(--kravy-surface)",
              color: "#10B981",
              border: "1px solid var(--kravy-border)",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "var(--kravy-card-shadow)",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
          >
            <FileText size={18} /> Export Excel
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            style={{
              background: isCreatingBackup ? "var(--kravy-border)" : "var(--kravy-brand)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: isCreatingBackup ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: isCreatingBackup ? "none" : "0 8px 20px rgba(139,92,246,0.3)",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                Creating...
              </>
            ) : (
              <>
                <Download size={18} /> Create Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backup Progress */}
      {isCreatingBackup && (
        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "var(--kravy-card-shadow)"
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
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--kravy-text-primary)", marginBottom: "4px" }}>
                Creating Backup...
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)" }}>
                Please wait while we secure your data
              </p>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#F59E0B" }}>
              {backupProgress}%
            </div>
          </div>
          <div style={{
            width: "100%", height: "8px", background: "var(--kravy-bg-2)",
            borderRadius: "10px", overflow: "hidden"
          }}>
            <div style={{
              width: `${backupProgress}%`, height: "100%",
              background: "var(--kravy-brand)",
              borderRadius: "10px", transition: "width 0.3s ease",
              boxShadow: "0 0 12px rgba(139,92,246,0.4)"
            }} />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "var(--kravy-card-shadow)"
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
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--kravy-text-primary)" }}>4</div>
              <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)" }}>Total Backups</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "20px",
          padding: "20px",
          boxShadow: "var(--kravy-card-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(139, 92, 246, 0.15)", color: "var(--kravy-brand)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <HardDrive size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-0.5px" }}>9.3</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Total Size (MB)</div>
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "var(--kravy-card-shadow)"
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
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--kravy-text-primary)" }}>Auto</div>
              <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)" }}>Backup Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div style={{
        background: "var(--kravy-surface)",
        border: "1px solid var(--kravy-border)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "var(--kravy-card-shadow)"
      }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "20px" }}>
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
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--kravy-text-primary)", marginBottom: "2px" }}>
                Automatic Backup
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Daily at 2:00 AM</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.15)", color: "var(--kravy-brand)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "2px" }}>
                Encryption
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontStyle: "italic" }}>AES-256 Enabled</div>
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
              <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "2px" }}>
                Retention Period
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontStyle: "italic" }}>30 Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "20px" }}>
          Backup History
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
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Date & Time</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Size</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Type</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Status</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map((backup) => (
                  <tr key={backup.id} style={{ borderBottom: "1px solid var(--kravy-border)" }}>
                    <td style={{ padding: "16px", color: "var(--kravy-text-primary)", fontWeight: 500 }}>{backup.date}</td>
                    <td style={{ padding: "16px", color: "var(--kravy-text-muted)" }}>{backup.size}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background: backup.type === "Automatic" ? "rgba(16,185,129,0.1)" : "rgba(139, 92, 246, 0.15)",
                        color: backup.type === "Automatic" ? "#10B981" : "var(--kravy-brand)"
                      }}>
                        {backup.type}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {getStatusIcon(backup.status)}
                        <span style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", fontWeight: 500 }}>
                          {backup.status === "completed" ? "Completed" : backup.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <DownloadButton fileName={`kravy-backup-${backup.id}.gz`} />
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

function DownloadButton({ fileName }: { fileName: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/backups/download?file=${fileName}`);
      const data = await res.json();
      
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Failed to generate download link. Please check your AWS configuration.");
      }
    } catch (error) {
      console.error("Download Error:", error);
      alert("Error generating download link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      style={{
        background: loading ? "var(--kravy-bg-2)" : "rgba(59,130,246,0.1)", 
        color: loading ? "var(--kravy-text-muted)" : "#3B82F6",
        border: "none", borderRadius: "8px", padding: "6px", cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px"
      }}
      title="Download Backup"
    >
      {loading ? (
        <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Download size={16} />
      )}
    </button>
  );
}
