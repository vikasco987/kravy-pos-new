"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthContext } from "@/components/AuthContext";
import Link from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, Plus, Trash2, User as UserIcon, Shield, Camera, X } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { user: customUser, loading: customLoading, refresh: refreshAuth } = useAuthContext();

  const [copied, setCopied] = useState(false);
  const [dbRole, setDbRole] = useState<string>("");

  // Determine effective user
  const user = customUser || clerkUser;
  const isLoaded = !clerkLoaded ? false : !customLoading;

  /* --------------------------------
     SYNC USER + ACTIVITY LOGGING
  ---------------------------------*/
 useEffect(() => {
  if (!user) return;

  const profileKey = "profile_view_logged";

  // 🔹 Only sync if it's a Clerk user (Legacy)
  if (clerkUser) {
    fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clerkUser.fullName || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress,
      }),
    }).catch(() => {});
  }

  // 🔹 PROFILE VIEW (once per session)
  if (!sessionStorage.getItem(profileKey)) {
    fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "PROFILE_VIEW",
        meta: "User opened profile page",
      }),
    }).then(() => {
      sessionStorage.setItem(profileKey, "true");
    });
  }

  // 🔹 REFRESH ROLE FROM DB
  fetch("/api/user/me")
    .then((res) => res.json())
    .then((data) => setDbRole(data?.role || ""))
    .catch(() => {});
}, [user, clerkUser]);

  /* --------------------------------
     STATES
  ---------------------------------*/
  if (!isLoaded) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6 text-red-500">Not logged in</div>;
  }

  /* --------------------------------
     HELPERS
  ---------------------------------*/
  const copyId = async () => {
    const idToCopy = (user as any).id;
    await navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
        await fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "LOGOUT",
            meta: "User logged out",
          }),
        }).catch(() => {});

        // 1. Clear Custom Token (if exists) via an API or manual cookie clear
        document.cookie = "kravy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        
        // 2. Clear Clerk Session (if exists)
        if (clerkUser) {
           await clerkSignOut();
        }

        sessionStorage.clear();
        toast.success("Logged out successfully");
        router.push("/");
        router.refresh();
    } catch (err) {
        toast.error("Logout failed");
    }
  };

  const deleteAccount = async () => {
    if (customUser) {
        toast.error("Custom accounts cannot be deleted from here yet. Contact support.");
        return;
    }
    const ok = confirm(
      "This will permanently delete your account. Continue?"
    );
    if (!ok) return;

    if (clerkUser) await clerkUser.delete();
  };

  /* --------------------------------
     UI
  ---------------------------------*/
  const name = (user as any).name || (user as any).fullName || "User";
  const email = (user as any).email || (clerkUser?.primaryEmailAddress?.emailAddress) || "No email";
  const phone = (user as any).phone || (clerkUser?.primaryPhoneNumber?.phoneNumber) || "";
  const avatar = (clerkUser as any)?.imageUrl || "https://avatar.iran.liara.run/public/38";

  const [identifiers, setIdentifiers] = useState<{ secondaryEmails: string[], secondaryPhones: string[] }>({
    secondaryEmails: [],
    secondaryPhones: []
  });
  const [showAddModal, setShowAddModal] = useState<{ show: boolean, type: 'email' | 'phone' }>({ show: false, type: 'email' });
  const [newValue, setNewValue] = useState("");

  const fetchIdentifiers = async () => {
    try {
        const res = await fetch("/api/user/identifiers");
        if (res.ok) {
            const data = await res.json();
            setIdentifiers({
                secondaryEmails: data.secondaryEmails || [],
                secondaryPhones: data.secondaryPhones || []
            });
        }
    } catch (e) {}
  };

  useEffect(() => {
    fetchIdentifiers();
  }, []);

  const handleAddIdentifier = async () => {
    if (!newValue) return;
    try {
        const res = await fetch("/api/user/identifiers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: showAddModal.type, value: newValue })
        });
        if (res.ok) {
            toast.success(`${showAddModal.type === 'email' ? 'Email' : 'Phone'} added`);
            setNewValue("");
            setShowAddModal({ ...showAddModal, show: false });
            fetchIdentifiers();
        } else {
            const err = await res.json();
            toast.error(err.error || "Failed to add");
        }
    } catch (e) {
        toast.error("Network error");
    }
  };

  const handleDeleteIdentifier = async (type: 'email' | 'phone', value: string) => {
    try {
        const res = await fetch("/api/user/identifiers", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, value })
        });
        if (res.ok) {
            toast.success("Removed successfully");
            fetchIdentifiers();
        }
    } catch (e) {}
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* PERSONAL INFORMATION (Matching Screenshot) */}
      <div className="border border-[var(--kravy-border)] rounded-[40px] bg-[#0a0a0a] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-[var(--kravy-border)]">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-50">Personal Information</h2>
        </div>
        <div className="p-10 space-y-12">
            <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-[32px] bg-indigo-500/10 flex items-center justify-center border-2 border-dashed border-indigo-500/20 group-hover:border-indigo-500/40 transition-all overflow-hidden">
                        <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl hover:bg-indigo-500 transition-colors border-4 border-[#0a0a0a]">
                        <Camera size={14} />
                    </button>
                </div>
                <div className="flex-1 grid sm:grid-cols-2 gap-8 w-full">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="bg-[#141414] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold text-sm focus-within:border-indigo-500/50 transition-all">
                            {name}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Contact Phone</label>
                        <div className="bg-[#141414] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold text-sm focus-within:border-indigo-500/50 transition-all">
                            {phone || "Not Set"}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-10 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20">
                    Edit Details
                </button>
            </div>
        </div>
      </div>

      {/* CONTACT METHODS (Clerk Style) */}
      <div className="border border-[var(--kravy-border)] rounded-[40px] bg-[#0a0a0a] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-[var(--kravy-border)] flex items-center justify-between">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-50">Contact Methods</h2>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowAddModal({ show: true, type: 'email' })}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
        <div className="p-8 space-y-6">
            {/* Primary Email */}
            <div className="flex items-center justify-between bg-[#141414] p-5 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Mail size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">{email}</p>
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500/80">Primary Email</span>
                    </div>
                </div>
            </div>

            {/* Secondary Emails */}
            {identifiers.secondaryEmails.map(e => (
                <div key={e} className="flex items-center justify-between bg-[#141414] p-5 rounded-3xl border border-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                            <Mail size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">{e}</p>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Secondary Email</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDeleteIdentifier('email', e)}
                        className="p-2 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}

            {/* Secondary Phones */}
            {identifiers.secondaryPhones.map(p => (
                <div key={p} className="flex items-center justify-between bg-[#141414] p-5 rounded-3xl border border-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                            <Phone size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">{p}</p>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Secondary Phone</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDeleteIdentifier('phone', p)}
                        className="p-2 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}

            {/* Add Phone Button */}
            <button 
                onClick={() => setShowAddModal({ show: true, type: 'phone' })}
                className="w-full py-4 border border-dashed border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:border-white/20 hover:text-white/50 transition-all"
            >
                Add another phone number
            </button>
        </div>
      </div>

      {/* MODAL (Simple Add) */}
      <AnimatePresence>
        {showAddModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Add {showAddModal.type}</h3>
                        <button onClick={() => setShowAddModal({ ...showAddModal, show: false })} className="text-white/40 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                    <input 
                        autoFocus
                        type={showAddModal.type === 'email' ? 'email' : 'text'}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={`Enter ${showAddModal.type}...`}
                        className="w-full bg-[#141414] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500/50 mb-6"
                    />
                    <button 
                        onClick={handleAddIdentifier}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
                    >
                        Confirm Addition
                    </button>
                </div>
            </div>
        )}
      </AnimatePresence>

      {/* SECURITY CARD */}
      <div className="border border-[var(--kravy-border)] rounded-[40px] bg-[#0a0a0a] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-[var(--kravy-border)]">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                <Shield size={14} className="text-indigo-500" />
                Security & Identifiers
            </h2>
        </div>
        <div className="p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-[#141414] p-6 rounded-3xl border border-white/5">
                <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Unique Identifier (UID)</p>
                    <p className="font-mono text-[10px] break-all text-indigo-500">{(user as any).id}</p>
                </div>
                <button
                    onClick={copyId}
                    className="bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl text-white/60 transition-all border border-white/5"
                >
                    {copied ? "Copied" : "Copy UID"}
                </button>
            </div>
        </div>
      </div>

      {/* ACTIONS CARD */}
      <div className="border border-[var(--kravy-border)] rounded-[40px] bg-[#0a0a0a] overflow-hidden shadow-2xl border-rose-500/20">
        <div className="p-8 border-b border-rose-500/10">
            <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] opacity-80">Danger Zone</h2>
        </div>
        <div className="p-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all border border-white/5"
          >
            Logout Securely
          </button>
          <button
            onClick={deleteAccount}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all border border-rose-500/10"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
