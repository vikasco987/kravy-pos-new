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
  Zap
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const ALL_PATHS = [
  { path: "/dashboard", label: "Store Dashboard", icon: <LayoutGrid size={16} /> },
  { path: "/dashboard/billing/checkout", label: "Quick POS Billing", icon: <ShoppingCart size={16} /> },
  { path: "/dashboard/tables", label: "Table Status", icon: <LayoutGrid size={16} /> },
  { path: "/dashboard/billing", label: "Past Bills / History", icon: <Receipt size={16} /> },
  { path: "/dashboard/menu/view", label: "Browse Products", icon: <UtensilsCrossed size={16} /> },
  { path: "/dashboard/menu/upload", label: "Add Single Item", icon: <PlusCircle size={16} /> },
  { path: "/dashboard/store-item-upload", label: "Excel Bulk Import", icon: <Upload size={16} /> },
  { path: "/dashboard/menu/edit", label: "Category & Editor", icon: <Settings size={16} /> },
  { path: "/dashboard/parties", label: "Customer Parties", icon: <Users size={16} /> },
  { path: "/dashboard/inventory", label: "Inventory Stock", icon: <Package size={16} /> },
  { path: "/dashboard/qr-orders", label: "QR Order Terminal", icon: <QrCode size={16} /> },
  { path: "/dashboard/settings", label: "Store Settings", icon: <Settings size={16} /> },
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

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function StaffManagementPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/user/me")
        .then(res => res.json())
        .then(data => setIsAdmin(data.role === "ADMIN" || data.role === "SELLER"))
        .catch(() => {});
    }
  }, [user]);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState("");

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
        setNewStaff({ name: "", email: "", password: "" });
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
          staffClerkId: selectedStaff.clerkId,
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manage Staff Access</h1>
          <p className="text-slate-500 font-medium">Control what your restaurant staff can see and do.</p>
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
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <Shield className="text-indigo-600" size={18} />
            <span className="text-sm font-bold text-indigo-900">Owner Controls Active</span>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Form & List */}
        <div className="lg:col-span-7 space-y-8">
          {/* Add Staff Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <UserPlus size={80} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={20} />
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const random = Math.random().toString(36).slice(-5);
                      setNewStaff({...newStaff, email: `staff.${random}@kravypos.com`});
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-white px-2 py-1 rounded-lg border shadow-sm hover:bg-slate-50"
                  >
                    Auto-Generate
                  </button>
                </div>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const pass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + "!";
                      setNewStaff({...newStaff, password: pass});
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-white px-2 py-1 rounded-lg border shadow-sm hover:bg-slate-50"
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isAdding}
                className="sm:col-span-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Add Staff to Restaurant
              </button>
            </form>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 ml-2">
              <Users className="text-blue-600" size={20} />
              Current Staff ({staff.length})
            </h2>
            <div className="grid gap-3">
              {staff.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-10 text-center">
                   <AlertCircle className="mx-auto text-slate-400 mb-2" />
                   <p className="text-slate-500 font-medium">No staff members found.</p>
                </div>
              ) : (
                staff.map(member => (
                  <motion.div
                    key={member.id}
                    layoutId={member.id}
                    className={`bg-white border rounded-2xl p-4 flex items-center justify-between transition-all ${selectedStaff?.id === member.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <UserCheck size={20} />
                       </div>
                       <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500 font-medium">{member.email}</div>
                       </div>
                    </div>
                    <button
                      onClick={() => setSelectedStaff(member)}
                      className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                    >
                      Manage Access
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Permission Terminal */}
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

                 <div className="space-y-2 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {ALL_PATHS.map(item => {
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
