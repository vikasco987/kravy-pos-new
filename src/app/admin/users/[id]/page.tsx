"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Copy, 
  Mail, 
  Calendar, 
  Shield, 
  User, 
  Lock, 
  Settings as SettingsIcon,
  ChevronRight,
  Upload,
  Check,
  X,
  Loader2,
  Activity,
  History,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type UserData = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  accessType?: string;
  clerkId?: string;
  createdAt: string;
  updatedAt?: string;
  isStaffModel: boolean;
  status?: string;
  business?: {
    businessName: string;
  };
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setEditData({ name: data.name || "", phone: data.phone || "", password: "" });
      } else {
        const data = await res.json();
        toast.error(data?.error || "User not found");
        router.push("/admin/users");
      }
    } catch (error) {
      toast.error("Error loading user");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: editData.name,
          phone: editData.phone,
          password: editData.password || undefined,
          isStaffModel: user.isStaffModel
        })
      });

      if (res.ok) {
        toast.success("Profile updated");
        setIsEditing(false);
        fetchUser();
      } else {
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
       <Loader2 className="text-indigo-500 animate-spin" size={32} />
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f12] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* HEADER BAR */}
      <header className="border-b border-white/5 bg-[#0f0f12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/admin/users")}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  {user.name?.[0] || 'U'}
               </div>
               <div>
                  <h1 className="text-lg font-bold text-white leading-none">{user.name || "Unnamed User"}</h1>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Last active {new Date(user.updatedAt || user.createdAt).toLocaleDateString()}</p>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">Show JSON</button>
             <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                Actions <ChevronRight size={14} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* TABS */}
        <nav className="flex items-center gap-8 border-b border-white/5 mb-10">
           {["Profile", "Organizations", "Settings"].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`py-4 text-sm font-bold relative transition-all ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {tab}
               {activeTab === tab && (
                 <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
               )}
             </button>
           ))}
        </nav>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* ACTIVITY SECTION */}
            <section className="bg-[#16161a] border border-white/5 rounded-3xl p-8 shadow-2xl">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Activity size={16} /> User Activity
                  </h2>
                  <select className="bg-white/5 border-none rounded-lg px-3 py-1 text-[10px] font-bold outline-none">
                     <option>2026</option>
                  </select>
               </div>
               {/* Mock Heatmap */}
               <div className="grid grid-cols-52 gap-1 h-32">
                  {Array.from({length: 364}).map((_, i) => (
                    <div key={i} className={`rounded-sm ${i === 120 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                  ))}
               </div>
               <div className="flex items-center justify-between mt-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="flex gap-4">
                     <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <span>Less</span>
                     <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white/5 rounded-sm" />
                        <div className="w-2 h-2 bg-indigo-900 rounded-sm" />
                        <div className="w-2 h-2 bg-indigo-700 rounded-sm" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-sm" />
                     </div>
                     <span>More</span>
                  </div>
               </div>
            </section>

            {/* PERSONAL INFO SECTION */}
            <section className="bg-[#16161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Personal Information</h2>
               </div>
               <div className="p-8 space-y-8">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-600/20">
                        {user.name?.[0] || 'U'}
                     </div>
                     <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">
                        <Upload size={14} /> Upload image
                     </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contact Phone</label>
                        <input 
                          type="tel"
                          disabled={!isEditing}
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                        />
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                     {!isEditing ? (
                       <button 
                         onClick={() => setIsEditing(true)}
                         className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                       >
                         Edit Details
                       </button>
                     ) : (
                       <>
                         <button 
                           onClick={() => {
                             setIsEditing(false);
                             setEditData({ name: user.name, phone: user.phone || "", password: "" });
                           }}
                           className="px-6 py-3 bg-white/5 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                         >
                           Cancel
                         </button>
                         <button 
                           onClick={handleUpdate}
                           disabled={saving}
                           className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-2"
                         >
                           {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                           Save Changes
                         </button>
                       </>
                     )}
                  </div>
               </div>
            </section>

            {/* SECURITY SECTION */}
            <section className="bg-[#16161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Key size={16} /> Password & Security
                  </h2>
               </div>
               <div className="p-8">
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-8 flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Lock size={20} />
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-amber-500">Security Notice</h3>
                        <p className="text-xs text-slate-500 mt-1">Changing a user's password will immediately invalidate all their active sessions and they will need to login again.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Password</label>
                        <div className="flex gap-3">
                           <div className="relative flex-1">
                              <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Set a new secure password"
                                value={editData.password}
                                onChange={(e) => setEditData({...editData, password: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all pr-12"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                           <button 
                             onClick={() => {
                               const newPass = Math.random().toString(36).slice(-10) + "!";
                               setEditData({...editData, password: newPass});
                               setShowPassword(true); // Show it automatically when generated
                             }}
                             className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-xs font-bold"
                           >
                             Generate
                           </button>
                        </div>
                     </div>
                     <button 
                       onClick={handleUpdate}
                       disabled={!editData.password || saving}
                       className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-20"
                     >
                       Update Password
                     </button>
                  </div>
               </div>
            </section>

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-[#16161a] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">User ID</p>
                  <div className="flex items-center justify-between group">
                     <p className="text-xs font-mono font-bold text-white truncate max-w-[180px]">{user.id}</p>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(user.id);
                         toast.success("ID Copied");
                       }}
                       className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all"
                     >
                        <Copy size={12} />
                     </button>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Primary email</p>
                  <div className="flex items-center justify-between group">
                     <p className="text-xs font-bold text-white truncate max-w-[180px]">{user.email}</p>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(user.email);
                         toast.success("Email Copied");
                       }}
                       className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all"
                     >
                        <Copy size={12} />
                     </button>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">User since</p>
                  <p className="text-xs font-bold text-white">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
               </div>

               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Last updated</p>
                  <p className="text-xs font-bold text-slate-400">about {Math.floor((new Date().getTime() - new Date(user.updatedAt || user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
               </div>

               <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-slate-500">Auth Method</span>
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${user.isStaffModel ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.isStaffModel ? 'Custom' : 'Clerk'}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-slate-500">Current Role</span>
                     <span className="text-[10px] font-black text-white">{user.role || user.accessType || "Standard User"}</span>
                  </div>
                  {user.business && (
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-slate-500">Business</span>
                       <span className="text-[10px] font-black text-indigo-400">{user.business.businessName}</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-[#16161a] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Actions</h3>
               <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-rose-500 border border-rose-500/10">
                  Suspend Account
               </button>
               <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Send Reset Link
               </button>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        .grid-cols-52 {
          grid-template-columns: repeat(52, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
}
