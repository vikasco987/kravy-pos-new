"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Award, 
  ChevronLeft, 
  Save, 
  TrendingUp, 
  Gift, 
  MessageCircle,
  AlertCircle,
  Coins
} from "lucide-react";
import { toast } from "sonner";

export default function LoyaltySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Stats for visual flair
  const [stats, setStats] = useState({
    activeUsers: 42,
    pointsIssued: 12500,
    rewardsClaimed: 18
  });

  useEffect(() => {
    fetch("/api/public/profile") // We could use a private endpoint, but this usually returns the current user's profile if user-client is logged in
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loyaltyPointRatio: parseFloat(profile.loyaltyPointRatio),
          loyaltyMinRedeem: parseInt(profile.loyaltyMinRedeem)
        })
      });

      if (res.ok) {
        toast.success("Loyalty rules updated successfully");
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A353]"></div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-black tracking-tight text-[var(--kravy-text-primary)]">Loyalty Reward Program</h1>
            <p className="text-sm text-[var(--kravy-text-muted)] font-medium">Configure how customers earn and redeem points</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#D4A353] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#D4A353]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : <><Save size={18} /> Update Logic</>}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Configuration (Left - 2/3) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#D4A353]/10 flex items-center justify-center text-[#D4A353]">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--kravy-text-primary)]">Earning Rules</h3>
                <p className="text-xs text-[var(--kravy-text-muted)] font-monospace uppercase tracking-widest">Points Multiplier</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-[var(--kravy-text-muted)]">Points Calculation Ratio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#D4A353]">
                    <Coins size={18} />
                  </div>
                  <input
                    type="number"
                    value={profile.loyaltyPointRatio}
                    onChange={(e) => setProfile({ ...profile, loyaltyPointRatio: e.target.value })}
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl py-4 pl-12 pr-4 text-lg font-black focus:ring-2 focus:ring-[#D4A353]/20 outline-none transition-all"
                    placeholder="10"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[0.65rem] font-black uppercase text-gray-500">
                    per rupee
                  </div>
                </div>
                <p className="text-[0.7rem] text-gray-400 font-medium px-2 italic">Example: A value of <strong>10</strong> means customer earns 1 point for every ₹10 spent.</p>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-black text-[var(--kravy-text-muted)]">Minimum Redemption Threshold</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#D4A353]">
                    <Gift size={18} />
                  </div>
                  <input
                    type="number"
                    value={profile.loyaltyMinRedeem}
                    onChange={(e) => setProfile({ ...profile, loyaltyMinRedeem: e.target.value })}
                    className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-2xl py-4 pl-12 pr-4 text-lg font-black focus:ring-2 focus:ring-[#D4A353]/20 outline-none transition-all"
                    placeholder="100"
                  />
                </div>
                <p className="text-[0.7rem] text-gray-400 font-medium px-2 italic">Points required to unlock the first reward tier on the QR menu.</p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-[28px] p-6 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 shrink-0">
               <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-900 dark:text-blue-200 mb-1">Marketing Tip</h4>
              <p className="text-[0.78rem] text-blue-800/70 dark:text-blue-200/60 leading-relaxed font-medium">Lowering the ratio (e.g., 1 point per ₹5 instead of ₹10) encourages frequent visits as customers see points accumulate faster!</p>
            </div>
          </div>
        </div>

        {/* Sidebar Info (Right - 1/3) */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-[#D4A353] rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Award size={140} />
            </div>
            <h3 className="text-lg font-black mb-1">Program Status</h3>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full text-[0.6rem] font-black tracking-widest uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live & Tracking
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-bold opacity-80 uppercase tracking-wider">Happy Customers</span>
                <span className="text-xl font-black">{stats.activeUsers}</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="w-[65%] h-full bg-white rounded-fullShadow-sm" />
              </div>
              <p className="text-[0.65rem] font-medium opacity-70">Customers with at least 1 point earned in the last 30 days.</p>
            </div>
          </div>

          <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle size={18} className="text-[#D4A353]" />
              <h4 className="text-[0.85rem] font-black text-[var(--kravy-text-primary)]">Customer View</h4>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[0.6rem] font-black">75</div>
                <div className="text-[0.65rem] font-bold text-gray-500">Points available</div>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                <div className="w-[75%] h-full bg-[#D4A353] rounded-full" />
              </div>
              <div className="text-[0.6rem] font-black text-gray-400 text-center uppercase tracking-widest">
                25 pts more to unlock ₹50 off
              </div>
            </div>
            <p className="text-[0.65rem] text-[var(--kravy-text-muted)] mt-4 text-center italic">Calculated automatically on checkout.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
