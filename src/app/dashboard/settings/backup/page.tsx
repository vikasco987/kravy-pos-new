"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Database, Download, CloudUpload, AlertCircle, CheckCircle2, Clock, 
  RotateCcw, Sparkles, Trash2, CheckSquare
} from "lucide-react";
import toast from "react-hot-toast";

type BackupRecord = {
  id: string;
  filename: string;
  fileSize: number;
  s3Url: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error: string | null;
  createdAt: string;
};

export default function BackupSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backup");
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (error) {
      console.error("Failed to fetch backups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    // Poll every 5 seconds if there is a pending backup
    const interval = setInterval(() => {
      fetchBackups();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerBackup = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Backup started!");
        fetchBackups();
      } else {
        toast.error(data.error || "Failed to start backup");
      }
    } catch (error) {
      toast.error("An error occurred while starting the backup");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(backups.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} backup(s)?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/backup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupIds: Array.from(selectedIds) })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Backups deleted successfully!");
        setSelectedIds(new Set());
        fetchBackups();
      } else {
        toast.error(data.error || "Failed to delete backups");
      }
    } catch (error) {
      toast.error("An error occurred while deleting backups");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "---";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isBackupPending = backups.some(b => b.status === 'PENDING');
  const allSelected = backups.length > 0 && selectedIds.size === backups.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < backups.length;

  return (
    <div className="max-w-4xl space-y-8 pb-20 kravy-page-fade">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[var(--kravy-surface)] border border-[var(--kravy-border)] flex items-center justify-center hover:bg-[var(--kravy-surface-hover)] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--kravy-text-primary)]">Data Backup</h1>
            <p className="text-sm text-[var(--kravy-text-muted)] font-medium">Create and manage your AWS S3 database backups</p>
          </div>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
          <Database size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4">
              <Sparkles size={14} />
              <span>AWS S3 Integration</span>
            </div>
            <h2 className="text-3xl font-black text-[var(--kravy-text-primary)] mb-3">
              Secure Cloud Backup
            </h2>
            <p className="text-base text-[var(--kravy-text-muted)] font-medium leading-relaxed">
              Generate a full snapshot of your store's database and securely upload it to your AWS S3 bucket. Depending on your data size, this might take a few minutes.
            </p>
          </div>
          
          <div className="shrink-0">
            <button
              onClick={triggerBackup}
              disabled={isTriggering || isBackupPending}
              className={`
                flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-lg transition-all shadow-xl
                ${(isTriggering || isBackupPending)
                  ? "bg-[var(--kravy-surface-hover)] text-[var(--kravy-text-muted)] cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                }
              `}
            >
              {(isTriggering || isBackupPending) ? (
                <>
                  <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                  Backup in Progress...
                </>
              ) : (
                <>
                  <CloudUpload size={24} />
                  Trigger Backup Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
          <h3 className="text-lg font-black text-[var(--kravy-text-primary)]">Recent Backups</h3>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <button 
                onClick={deleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Clock size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete Selected ({selectedIds.size})
              </button>
            )}
            <button 
              onClick={fetchBackups}
              className="flex items-center gap-2 text-sm font-bold text-[var(--kravy-brand)] hover:opacity-80 transition-opacity"
            >
              <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[24px] overflow-hidden">
          {/* Header row for bulk actions */}
          {backups.length > 0 && (
            <div className="flex items-center gap-4 p-4 border-b border-[var(--kravy-border)] bg-[var(--kravy-surface-hover)]">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded cursor-pointer accent-[var(--kravy-brand)]"
                checked={allSelected}
                ref={(input) => { if (input) input.indeterminate = someSelected }}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="text-sm font-bold text-[var(--kravy-text-muted)]">Select All</span>
            </div>
          )}

          {loading && backups.length === 0 ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-[var(--kravy-brand)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center text-[var(--kravy-text-muted)] font-medium flex flex-col items-center">
              <Database size={48} className="opacity-20 mb-4" />
              <p>No backups found</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--kravy-border)]">
              {backups.map((backup) => (
                <div key={backup.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--kravy-surface-hover)] transition-colors">
                  <div className="flex items-start sm:items-center gap-4">
                    
                    <div className="flex items-center justify-center h-12 w-6">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded cursor-pointer accent-[var(--kravy-brand)]"
                        checked={selectedIds.has(backup.id)}
                        onChange={(e) => handleSelectOne(backup.id, e.target.checked)}
                      />
                    </div>

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      backup.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      backup.status === 'FAILED' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                      'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {backup.status === 'SUCCESS' && <CheckCircle2 size={24} />}
                      {backup.status === 'FAILED' && <AlertCircle size={24} />}
                      {backup.status === 'PENDING' && <Clock size={24} className="animate-pulse" />}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-[var(--kravy-text-primary)] break-all max-w-[200px] sm:max-w-xs md:max-w-md truncate" title={backup.filename}>
                        {backup.filename}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-sm font-medium text-[var(--kravy-text-muted)]">
                        <span>{formatDate(backup.createdAt)}</span>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-[var(--kravy-border)]"></span>
                        <span className="hidden sm:inline">{formatSize(backup.fileSize)}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--kravy-border)]"></span>
                        <span className={`font-bold ${
                          backup.status === 'SUCCESS' ? 'text-emerald-500' :
                          backup.status === 'FAILED' ? 'text-rose-500' :
                          'text-amber-500 animate-pulse'
                        }`}>
                          {backup.status}
                        </span>
                      </div>
                      {backup.error && (
                        <p className="mt-2 text-xs text-rose-500 font-medium">Error: {backup.error}</p>
                      )}
                    </div>
                  </div>
                  
                  {backup.status === 'SUCCESS' && backup.s3Url && (
                    <a
                      href={backup.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[var(--kravy-bg)] border border-[var(--kravy-border)] hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)] transition-all"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
