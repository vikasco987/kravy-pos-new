import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Phone, MapPin, Calendar, CreditCard, ArrowDownLeft, ArrowUpRight, Clock, Award } from "lucide-react";

export const revalidate = 0; // Fetch fresh data on every request

interface PageProps {
  params: Promise<{ partyId: string }>;
}

export default async function PublicLedgerPage({ params }: PageProps) {
  const { partyId } = await params;

  // 1. Fetch Customer
  const party = await prisma.party.findUnique({
    where: { id: partyId },
  });

  if (!party) {
    notFound();
  }

  // 2. Fetch Customer Transactions
  const transactions = await prisma.walletTransaction.findMany({
    where: { partyId: party.id },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch Business Profile to display name
  const business = await prisma.businessProfile.findFirst({
    where: { userId: party.createdBy },
  });

  const businessName = business?.name || "Merchant";

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[80px]" />
        <div className="absolute top-[-5%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-600/10 blur-[80px]" />
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-8 pb-16 z-10 relative flex flex-col gap-6">
        
        {/* Header / Merchant Info */}
        <div className="flex flex-col items-center text-center gap-1.5 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black tracking-widest text-lg shadow-lg shadow-indigo-500/5">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-sm font-black uppercase tracking-widest text-indigo-400">{businessName}</h1>
          <p className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest">Customer Account Ledger</p>
        </div>

        {/* Customer Balance Card */}
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center group">
          {/* Accent glow line at top */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-500/20 mb-4">
            {party.name.charAt(0).toUpperCase()}
          </div>

          <h2 className="text-xl font-black text-white tracking-tight mb-1">{party.name}</h2>
          <div className="flex items-center gap-1 text-slate-300 font-black text-xs font-mono mb-4 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-700/30">
            <Phone size={11} className="text-indigo-400" /> {party.phone}
          </div>

          <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-2xl py-4 px-6 flex flex-col items-center justify-center gap-1.5 shadow-inner">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Current Balance</span>
            <span className="text-3xl font-black text-white tracking-tight flex items-center font-mono">
              ₹{(party.walletBalance || 0).toFixed(2)}
            </span>
          </div>

          {/* Details (Address & Joined) */}
          <div className="w-full grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-800/60 text-left">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <MapPin size={9} /> Address
              </span>
              <span className="text-xs font-medium text-slate-300 truncate">
                {party.address || "Address hidden"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Calendar size={9} /> Created On
              </span>
              <span className="text-xs font-medium text-slate-300">
                {new Date(party.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History Heading */}
        <div className="flex items-center justify-between mt-2 px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Clock size={12} className="text-indigo-400" /> Wallet History
          </h3>
          <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
            {transactions.length} Transactions
          </span>
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-800/40 rounded-2xl flex items-center justify-center text-slate-500">
              <CreditCard size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400">No transactions recorded yet</p>
            <p className="text-[10px] text-slate-500 max-w-[200px]">Whenever you deposit or withdraw funds, they will appear here in real-time.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((tx) => {
              const isCredit = tx.type === "CREDIT";
              return (
                <div
                  key={tx.id}
                  className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="text-xs font-black text-white truncate">
                        {tx.description || (isCredit ? "Deposit" : "Withdrawal")}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {new Date(tx.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0 flex flex-col gap-0.5">
                    <span
                      className={`text-sm font-black font-mono ${
                        isCredit ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isCredit ? "+" : "-"} ₹{tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                      {isCredit ? "Received" : "Paid Out"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
      </main>

      {/* Mini Footer */}
      <footer className="w-full text-center py-6 border-t border-slate-900/80 bg-slate-950/30 text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-auto z-10 relative">
        Powered by Kravy POS
      </footer>
    </div>
  );
}
