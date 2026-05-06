"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Key, ChevronRight, 
  Camera, Check, X, RefreshCw, LogOut, ArrowLeft,
  Bell, Plus, Trash2, Globe, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  // Form State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    imageUrl: '',
    secondaryEmails: [] as string[],
    secondaryPhones: [] as string[],
  });

  // UI state for adding new entries
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData({ 
          name: data.name || '', 
          phone: data.phone || '',
          imageUrl: data.imageUrl || '',
          secondaryEmails: data.secondaryEmails || [],
          secondaryPhones: data.secondaryPhones || [],
        });
      }
    } catch (err) {
      toast.error("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: Partial<typeof formData>) => {
    setSaving(true);
    try {
      const payload = { ...formData, ...updates };
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account updated successfully");
        setUser({ ...user, ...data.user });
        setFormData(prev => ({ ...prev, ...data.user }));
        setEditMode(false);
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addSecondaryEmail = () => {
    if (!newEmail.includes('@')) return toast.error("Invalid email");
    if (formData.secondaryEmails.includes(newEmail) || user.email === newEmail) {
      return toast.error("Email already added");
    }
    const updated = [...formData.secondaryEmails, newEmail];
    handleUpdateProfile({ secondaryEmails: updated });
    setNewEmail('');
  };

  const removeSecondaryEmail = (email: string) => {
    const updated = formData.secondaryEmails.filter(e => e !== email);
    handleUpdateProfile({ secondaryEmails: updated });
  };

  const addSecondaryPhone = () => {
    const clean = newPhone.replace(/\D/g, '');
    if (clean.length < 10) return toast.error("Invalid phone");
    if (formData.secondaryPhones.includes(clean) || user.phone === clean) {
      return toast.error("Phone already added");
    }
    const updated = [...formData.secondaryPhones, clean];
    handleUpdateProfile({ secondaryPhones: updated });
    setNewPhone('');
  };

  const removeSecondaryPhone = (phone: string) => {
    const updated = formData.secondaryPhones.filter(p => p !== phone);
    handleUpdateProfile({ secondaryPhones: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0a0a0a]">
        <div className="text-center space-y-4">
           <X className="w-12 h-12 text-rose-500 mx-auto" />
           <h2 className="text-xl font-black text-slate-900 dark:text-white">Account Not Found</h2>
           <p className="text-slate-400">We couldn't load your account details. Please try logging in again.</p>
           <button 
             onClick={() => router.push('/')}
             className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase text-[10px] tracking-widest"
           >
             Go to Login
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
            <ShieldCheck size={12} /> Kravy Secure Profile
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Manage your profile</h1>
          <p className="text-slate-400 font-medium mt-1">Control your identity and login identifiers.</p>
        </div>
        
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm self-start md:self-auto"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'profile', label: 'Personal Profile', icon: User },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 translate-x-2" 
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}

          <div className="pt-8 border-t border-slate-200 dark:border-white/10 mt-8">
             <button
              onClick={() => {
                document.cookie = "kravy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                window.location.href = "/";
              }}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/5 transition-all"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Profile Detail Card */}
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                  
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="relative group/avatar">
                      {formData.imageUrl ? (
                        <img 
                          src={formData.imageUrl} 
                          alt="Profile" 
                          className="w-32 h-32 rounded-[2rem] object-cover shadow-xl ring-8 ring-emerald-500/10 transition-transform hover:scale-105" 
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-4xl font-black shadow-xl ring-8 ring-emerald-500/10">
                          {user.name?.[0].toUpperCase() || "U"}
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          const url = prompt("Enter Image URL for profile photo:", formData.imageUrl);
                          if (url !== null) handleUpdateProfile({ imageUrl: url });
                        }}
                        className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-slate-50 dark:border-white/10 flex items-center justify-center text-emerald-500 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Camera size={20} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Profile details</h2>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update your primary information</p>
                        </div>
                        <button 
                          onClick={() => setEditMode(!editMode)}
                          className={`px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            editMode 
                            ? "bg-rose-500/10 text-rose-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {editMode ? "Cancel" : "Edit Profile"}
                        </button>
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile({}); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <User size={12} /> Full Name
                          </label>
                          <input 
                            disabled={!editMode}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full h-14 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Phone size={12} /> Primary Phone
                          </label>
                          <input 
                            disabled={!editMode}
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full h-14 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 transition-all"
                          />
                        </div>

                        {editMode && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="md:col-span-2 pt-4"
                          >
                            <button 
                              disabled={saving}
                              type="submit"
                              className="h-14 px-10 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                            >
                              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                              Save Profile Changes
                            </button>
                          </motion.div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>

                {/* Email Section */}
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-10 space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Email addresses</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add multiple emails for account recovery and login</p>
                  </div>

                  <div className="space-y-4">
                    {/* Primary */}
                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400">
                           <Mail size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{user.email}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Verified · Primary</p>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Emails */}
                    {formData.secondaryEmails.map(email => (
                      <div key={email} className="flex items-center justify-between p-6 bg-white dark:bg-white/2 rounded-2xl border border-slate-100 dark:border-white/5 group/item">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                             <Mail size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{email}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secondary Identifier</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeSecondaryEmail(email)}
                          className="w-10 h-10 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}

                    {/* Add Email */}
                    <div className="flex gap-4 p-2 bg-slate-50 dark:bg-black/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                      <input 
                        placeholder="Add email address..."
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="flex-1 bg-transparent px-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button 
                        onClick={addSecondaryEmail}
                        disabled={saving || !newEmail}
                        className="h-12 px-6 bg-slate-900 dark:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phone Section */}
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-10 space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Phone numbers</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login via any of your linked phone numbers</p>
                  </div>

                  <div className="space-y-4">
                    {/* Primary */}
                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400">
                           <Phone size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{user.phone}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Primary Identifier</p>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Phones */}
                    {formData.secondaryPhones.map(phone => (
                      <div key={phone} className="flex items-center justify-between p-6 bg-white dark:bg-white/2 rounded-2xl border border-slate-100 dark:border-white/5 group/item">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                             <Phone size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{phone}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secondary Identifier</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeSecondaryPhone(phone)}
                          className="w-10 h-10 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}

                    {/* Add Phone */}
                    <div className="flex gap-4 p-2 bg-slate-50 dark:bg-black/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                      <input 
                        placeholder="Add phone number..."
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="flex-1 bg-transparent px-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button 
                        onClick={addSecondaryPhone}
                        disabled={saving || !newPhone}
                        className="h-12 px-6 bg-slate-900 dark:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Phone
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                 <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-10 shadow-sm">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-8">Password & Authentication</h2>
                    
                    <div className="space-y-4">
                       <button className="w-full flex items-center justify-between p-6 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                             <Key size={18} />
                           </div>
                           <div className="text-left">
                             <p className="text-sm font-bold text-slate-900 dark:text-white">Change Password</p>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Update your login credentials</p>
                           </div>
                         </div>
                         <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                       </button>

                       <button className="w-full flex items-center justify-between p-6 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                             <Shield size={18} />
                           </div>
                           <div className="text-left">
                             <p className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Add an extra layer of security</p>
                           </div>
                         </div>
                         <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                           Disabled
                         </div>
                       </button>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
