"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Lock, 
  Check, 
  X, 
  Save, 
  AlertCircle,
  Loader2,
  Trash2,
  UserCheck,
  UserX,
  Ban,
  LayoutGrid,
  ShoppingCart,
  Receipt,
  UtensilsCrossed,
  PlusCircle,
  Upload,
  Settings,
  Package,
  QrCode,
  Key,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Camera,
  TrendingUp,
  PieChart,
  UserCircle,
  Percent,
  Archive,
  HelpCircle,
  BarChart3,
  IndianRupee,
  Edit3,
  CheckCircle2,
  MessageCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const ALL_PATHS = [
  { path: "/dashboard", label: "Store Dashboard", icon: <LayoutGrid size={16} /> },
  { path: "/dashboard/billing/checkout", label: "Quick POS Billing", icon: <ShoppingCart size={16} /> },
  { path: "edit", label: "Edit POS (Add Products/Categories)", icon: <Settings size={16} /> },
  { path: "/dashboard/workflow", label: "Kitchen Workflow", icon: <Activity size={16} /> },
  { path: "/dashboard/tables", label: "Table Status", icon: <LayoutGrid size={16} /> },
  { path: "/dashboard/billing", label: "Past Bills / History", icon: <Receipt size={16} /> },
  
  // Detailed Action Permissions
  { path: "header-pos-actions", label: "--- POS Billing Actions ---", icon: <ShoppingCart size={16} />, isHeader: true },
  { path: "pos-discount", label: "Allow: Apply Discounts", icon: <Percent size={16} /> },
  { path: "pos-edit-price", label: "Allow: Edit Item Prices", icon: <IndianRupee size={16} /> },
  { path: "pos-delete-item", label: "Allow: Delete Items from Cart", icon: <Trash2 size={16} /> },

  { path: "header-bill-actions", label: "--- Bill History Actions ---", icon: <Receipt size={16} />, isHeader: true },
  { path: "edit-bill", label: "Allow: Edit Past Bills", icon: <Edit3 size={16} /> },
  { path: "delete-bill", label: "Allow: Delete Past Bills", icon: <Trash2 size={16} /> },
  { path: "mark-as-paid", label: "Allow: Change Payment Status", icon: <CheckCircle2 size={16} /> },
  { path: "whatsapp-bill", label: "Allow: WhatsApp Billing", icon: <MessageCircle size={16} /> },

  { path: "header-kit-actions", label: "--- Kitchen Actions ---", icon: <Activity size={16} />, isHeader: true },
  { path: "kit-complete-order", label: "Allow: Mark Order as Ready", icon: <CheckCircle2 size={16} /> },
  { path: "kit-cancel-order", label: "Allow: Cancel/Remove KOT", icon: <X size={16} /> },

  { path: "header-inv-actions", label: "--- Inventory & Menu Actions ---", icon: <Package size={16} />, isHeader: true },
  { path: "inv-edit-stock", label: "Allow: Update Stock Levels", icon: <Layers size={16} /> },
  { path: "menu-delete-item", label: "Allow: Delete Menu Items", icon: <Trash2 size={16} /> },

  { path: "/dashboard/menu/view", label: "Browse Products", icon: <UtensilsCrossed size={16} /> },
  { path: "/dashboard/menu-editor", label: "Interactive Editor", icon: <Sparkles size={16} /> },
  { path: "/dashboard/menu/addons", label: "Add-on clusters", icon: <Layers size={16} /> },
  { path: "/dashboard/ai-scraper", label: "AI Menu Scraper", icon: <Zap size={16} /> },
  { path: "/dashboard/menu/upload", label: "Add Single Item", icon: <PlusCircle size={16} /> },
  { path: "/dashboard/store-item-upload", label: "Excel Bulk Import", icon: <Upload size={16} /> },
  { path: "/dashboard/menu/edit", label: "Category & Editor", icon: <Settings size={16} /> },
  { path: "/dashboard/parties", label: "Customer Parties", icon: <Users size={16} /> },
  { path: "/dashboard/staff", label: "Staff Management", icon: <UserPlus size={16} /> },
  { path: "/dashboard/inventory", label: "Inventory Stock", icon: <Package size={16} /> },
  { path: "/dashboard/qr-orders", label: "QR Order Terminal", icon: <QrCode size={16} /> },
  { path: "/dashboard/combos", label: "Marketing Hub", icon: <Sparkles size={16} /> },
  { path: "/dashboard/gallery", label: "Gallery Manager", icon: <Camera size={16} /> },
  { path: "/dashboard/reports/sales/daily", label: "Daily Sales Report", icon: <TrendingUp size={16} /> },
  { path: "/dashboard/reports/sales/revenue", label: "Revenue Analysis", icon: <BarChart3 size={16} /> },
  { path: "/dashboard/reports/payments", label: "Mode of Payment", icon: <PieChart size={16} /> },
  { path: "/dashboard/reports/performance", label: "Business Growth", icon: <TrendingUp size={16} /> },
  { path: "/dashboard/reports/gst", label: "GST Reports", icon: <PieChart size={16} /> },
  { path: "/dashboard/profile", label: "Business Profile", icon: <UserCircle size={16} /> },
  { path: "/dashboard/settings", label: "POS Settings", icon: <Settings size={16} /> },
  { path: "/dashboard/settings/tax", label: "Tax Management", icon: <Percent size={16} /> },
  { path: "/dashboard/backup", label: "Security & Backup", icon: <Shield size={16} /> },
  { path: "/dashboard/billing/deleted", label: "Archive & Trash", icon: <Archive size={16} /> },
  { path: "/dashboard/help", label: "Help & Support", icon: <HelpCircle size={16} /> },
];

type StaffMember = {
  id: string;
  name: string;
  email: string;
  clerkId: string;
  role: string;
  allowedPaths: string[];
  isDisabled: boolean;
};

export default function StaffManagementPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", phone: "" });
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState("");

  useEffect(() => {
    fetch("/api/user/me")
      .then(res => res.json())
      .then(data => {
        const isOwner = data.role === "OWNER" || data.role === "SELLER" || data.role === "ADMIN";
        const hasPerm = data.allowedPaths?.includes("/dashboard/staff");
        setIsAdmin(isOwner);
        setCanManage(isOwner || hasPerm);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/seller/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (error) {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/seller/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff)
      });

      if (res.ok) {
        toast.success("Staff member added successfully");
        setNewStaff({ name: "", email: "", password: "", phone: "" });
        fetchStaff();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add staff");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleTogglePath = (path: string) => {
    if (!selectedStaff) return;
    const currentPaths = selectedStaff.allowedPaths || [];
    const newPaths = currentPaths.includes(path)
      ? currentPaths.filter(p => p !== path)
      : [...currentPaths, path];
    
    setSelectedStaff({ ...selectedStaff, allowedPaths: newPaths });
  };

  const savePermissions = async () => {
    if (!selectedStaff) return;
    setSavingPermissions(true);
    try {
      const res = await fetch("/api/seller/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          clerkId: selectedStaff.clerkId,
          allowedPaths: selectedStaff.allowedPaths,
          newPassword: updatingPassword || undefined
        })
      });

      if (res.ok) {
        toast.success(updatingPassword ? "Permissions & Password updated" : "Permissions updated");
        setUpdatingPassword("");
        fetchStaff();
        setSelectedStaff(null);
      } else {
        toast.error("Failed to update staff member");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSavingPermissions(false);
    }
  };

  const deleteStaff = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) return;
    
    try {
      const url = new URL("/api/seller/staff", window.location.origin);
      if (member.clerkId) url.searchParams.set("clerkId", member.clerkId);
      url.searchParams.set("id", member.id);

      const res = await fetch(url.toString(), { method: "DELETE" });
      if (res.ok) {
        toast.success("Staff member deleted");
        fetchStaff();
        if (selectedStaff?.id === member.id) setSelectedStaff(null);
      } else {
        toast.error("Failed to delete staff");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const toggleBlockStaff = async (member: StaffMember) => {
    const action = member.isDisabled ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} ${member.name}?`)) return;

    try {
      const res = await fetch("/api/seller/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: member.id,
          clerkId: member.clerkId,
          isDisabled: !member.isDisabled
        })
      });

      if (res.ok) {
        toast.success(`Staff member ${action}ed`);
        fetchStaff();
        if (selectedStaff?.id === member.id) {
          setSelectedStaff({ ...selectedStaff, isDisabled: !member.isDisabled });
        }
      } else {
        toast.error(`Failed to ${action} staff`);
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Manage Staff Access</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Control what your restaurant staff can see and do.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => router.push("/dashboard/docs/staff-access")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-2xl border border-indigo-700 hover:bg-indigo-500 transition-all font-bold text-sm shadow-lg shadow-indigo-200"
            >
              <Zap size={16} /> Technical Docs
            </button>
          )}
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={18} />
            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Owner Controls Active</span>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {canManage && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-slate-900 dark:text-white">
                <UserPlus size={80} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-indigo-600 dark:text-indigo-400" size={20} />
                Add New Staff Member
              </h2>
              <form onSubmit={handleAddStaff} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Singh"
                    value={newStaff.name}
                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <input
                      required
                      type="email"
                      placeholder="rahul@kravypos.com"
                       value={newStaff.email}
                      onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const random = Math.random().toString(36).slice(-5);
                        setNewStaff({...newStaff, email: `staff.${random}@kravypos.com`});
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 dark:text-white"
                    >
                      Auto-Generate
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                     value={newStaff.phone}
                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Generate Password</label>
                  <div className="relative">
                     <input
                      required
                      type="text"
                      placeholder="Set a secure password"
                       value={newStaff.password}
                      onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const pass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + "!";
                        setNewStaff({...newStaff, password: pass});
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 dark:text-white"
                    >
                      Auto-Generate
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="sm:col-span-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  Add Staff to Restaurant
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 ml-2">
              <Users className="text-blue-600 dark:text-blue-400" size={20} />
              Current Staff ({staff.length})
            </h2>
            <div className="grid gap-3">
              {staff.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center">
                   <AlertCircle className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 dark:text-slate-400 font-medium">No staff members found.</p>
                </div>
              ) : (
                staff.map(member => (
                  <motion.div
                    key={member.id}
                    layoutId={member.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between transition-all ${selectedStaff?.id === member.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${member.isDisabled ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                          {member.isDisabled ? <UserX size={20} /> : <UserCheck size={20} />}
                       </div>
                       <div>
                          <div className={`font-bold transition-all ${member.isDisabled ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
                            {member.name}
                            {member.isDisabled && <span className="ml-2 text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md uppercase font-black">Blocked</span>}
                          </div>
                          <div className={`text-xs font-medium transition-all ${member.isDisabled ? 'text-slate-300 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>{member.email}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBlockStaff(member)}
                        title={member.isDisabled ? "Unblock Staff" : "Block Staff"}
                        className={`p-2 rounded-xl transition-all ${member.isDisabled ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60' : 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-950/80'}`}
                      >
                        {member.isDisabled ? <UserCheck size={18} /> : <Ban size={18} />}
                      </button>
                      <button
                        onClick={() => deleteStaff(member)}
                        title="Delete Staff"
                        className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/80 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedStaff(member)}
                        className="ml-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                      >
                        Manage Access
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
           <AnimatePresence mode="wait">
             {selectedStaff ? (
               <motion.div
                 key="terminal-active"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 sticky top-8 h-fit"
               >
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                          <Lock size={16} />
                       </div>
                       <h3 className="text-white font-black">Edit Visibility: <span className="text-orange-400">{selectedStaff.name}</span></h3>
                    </div>
                    <button onClick={() => setSelectedStaff(null)} className="text-slate-500 hover:text-white transition-colors">
                       <X size={20} />
                    </button>
                 </div>

                 <p className="text-slate-400 text-xs mb-6 font-medium leading-relaxed">
                   Select the modules this staff member can access. Unticked items will be hidden from their sidebar immediately.
                 </p>
                 <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                       <Key size={12} className="text-orange-400" />
                       Reset Staff Password
                    </label>
                    <div className="flex gap-2">
                       <input 
                         type="text"
                         placeholder="New password (optional)"
                         value={updatingPassword}
                         onChange={(e) => setUpdatingPassword(e.target.value)}
                         className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-orange-500 outline-none"
                       />
                       <button 
                         type="button"
                         onClick={() => setUpdatingPassword(Math.random().toString(36).slice(-8))}
                         className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-xl"
                       >
                         <Sparkles size={14} />
                       </button>
                    </div>
                    {updatingPassword && (
                       <p className="text-[9px] text-orange-300/70 font-medium">⚠️ Password will be updated when you save.</p>
                    )}
                 </div>

                 <div className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     {ALL_PATHS.map(item => {
                        if ((item as any).isHeader) {
                          return (
                            <div key={item.path} className="pt-4 pb-1">
                              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest text-center">
                                {item.label}
                              </p>
                            </div>
                          );
                        }
                        const isActive = selectedStaff.allowedPaths?.includes(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleTogglePath(item.path)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isActive ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                          >
                            <div className="flex items-center gap-3">
                              {item.icon}
                              <span className="text-xs font-bold">{item.label}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 text-white' : 'border border-slate-700'}`}>
                               {isActive && <Check size={12} />}
                            </div>
                          </button>
                        );
                     })}
                  </div>

                 <button
                    onClick={savePermissions}
                    disabled={savingPermissions}
                    className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                 >
                    {savingPermissions ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Access Rules
                 </button>
               </motion.div>
             ) : (
               <motion.div
                 key="terminal-empty"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
               >
                 <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <Lock size={32} />
                 </div>
                 <h3 className="text-slate-800 font-black">Staff Control Terminal</h3>
                 <p className="text-slate-500 text-sm max-w-[250px] mt-2">
                   Select a staff member from the list to manage their dashboard visibility.
                 </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
