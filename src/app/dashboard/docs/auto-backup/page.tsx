"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Database,
  Globe,
  Clock,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  Copy,
  ChevronLeft,
  Sparkles,
  ServerCog
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AutoBackupDocs() {
  const router = useRouter();
  
  const cronUrl = "https://billing.kravy.in/api/backup/cron?secret=kravy-pos-cron-secret-123";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cronUrl);
    toast.success("URL Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 text-xl font-black">
              K
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">Auto Backup <span className="text-emerald-600">Guide</span></span>
          </div>
          <button 
            onClick={() => router.back()}
            className="text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-2xl transition-all"
          >
            ← Back
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        
        {/* ── HERO SECTION ── */}
        <header className="relative mb-24">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-100/50 blur-[100px] rounded-full z-0"></div>
          
          <div className="relative z-10 space-y-8 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
            >
              <Sparkles size={14} className="text-emerald-400" /> Automated Cron Jobs
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1]">
              Automate Your <br/> 
              <span className="text-emerald-600 italic">Database Backups.</span>
            </h1>
            
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
              Learn how to configure a third-party cron service to trigger automatic, secure database backups to AWS S3 without any manual intervention.
            </p>
          </div>
        </header>

        <div className="space-y-16 relative z-10">
          
          {/* ── SECTION 1: THE CRON URL ── */}
          <section className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Globe size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">The Backup Endpoint</h2>
                <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                  This is the secure URL that triggers the backup process. It contains a secret key, so keep it safe and do not share it publicly.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 break-all">
                  <span className="text-emerald-400 font-mono text-sm block mb-1">GET Request</span>
                  <code className="text-slate-200 font-mono text-base md:text-lg select-all">
                    {cronUrl}
                  </code>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <Copy size={16} />
                  Copy URL
                </button>
              </div>
            </div>
          </section>

          {/* ── SECTION 2: HOW TO SET IT UP ── */}
          <section>
            <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-4">
              <ServerCog className="text-emerald-600" />
              Setup Instructions
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Option A: cron-job.org */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-lg shadow-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 mb-4">Option A: cron-job.org <span className="text-emerald-500 text-sm ml-2 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest font-bold">Free</span></h3>
                  
                  <ol className="space-y-4 text-slate-600 font-medium">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-black">1</span>
                      <p>Go to <a href="https://cron-job.org" target="_blank" className="text-emerald-600 font-bold hover:underline">cron-job.org</a> and sign up for a free account.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-black">2</span>
                      <p>Click on <strong>"CREATE CRONJOB"</strong>.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-black">3</span>
                      <p>Paste the Copied URL above into the <strong>URL</strong> field.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-black">4</span>
                      <p>Set the execution schedule (e.g., Every day at 12:00 AM).</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-black">5</span>
                      <p>Save and enable the cron job. You're done!</p>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Option B: Vercel Cron */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-lg shadow-slate-100 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 mb-4">Option B: Vercel Cron <span className="text-slate-500 text-sm ml-2 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest font-bold">Pro</span></h3>
                  
                  <p className="text-slate-600 font-medium mb-4">
                    If your project is hosted on Vercel, you can define a cron schedule directly in your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">vercel.json</code> file.
                  </p>

                  <div className="bg-slate-900 rounded-xl p-4 mt-4">
                    <pre className="text-slate-300 font-mono text-sm overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/backup/cron?secret=kravy-pos-cron-secret-123",
      "schedule": "0 0 * * *"
    }
  ]
}`}
                    </pre>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-3">
                    Note: Vercel limits the number of free cron jobs depending on your plan.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 3: IMPORTANT NOTES ── */}
          <section className="bg-orange-50 rounded-[32px] p-8 md:p-10 border border-orange-100">
            <h2 className="text-2xl font-black text-orange-900 mb-6 flex items-center gap-3">
              <ShieldAlert className="text-orange-600" />
              How It Works & Important Notes
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Clock size={20} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Asynchronous Execution</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  When the cron service pings the URL, our server instantly returns a <code className="text-emerald-600 bg-emerald-50 px-1 rounded">200 OK</code> response. The actual backup process continues running in the background. This prevents the cron service from throwing a timeout error.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Database size={20} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Database Load & Timing</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  To prevent the live POS from freezing, the backup script pauses slightly between copying collections. Because of this, it can take 15 to 30 minutes for a full backup to appear in AWS S3.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
