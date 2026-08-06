"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/AuthContext";
import { toast } from "react-hot-toast";
import { Fuel, Car, IndianRupee, Printer, Save, FileText, Droplet } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function FuelBillingPage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Form State
  const [fuelType, setFuelType] = useState<"PETROL" | "DIESEL">("DIESEL");
  const [rate, setRate] = useState<string>("101.20");
  const [saleAmount, setSaleAmount] = useState<string>("500");
  const [volume, setVolume] = useState<string>("4.94");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  
  // Print State
  const [lastBill, setLastBill] = useState<any>(null);
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(() => {});
  }, []);

  // Auto-calculate volume when sale or rate changes
  useEffect(() => {
    const r = parseFloat(rate);
    const s = parseFloat(saleAmount);
    if (!isNaN(r) && r > 0 && !isNaN(s)) {
      setVolume((s / r).toFixed(2));
    }
  }, [saleAmount, rate]);

  const handleGenerate = async () => {
    if (!rate || !saleAmount || !volume) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/fuel-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNo,
          fuelType,
          rate,
          saleAmount,
          volume,
        }),
      });

      if (!res.ok) throw new Error("Failed to save bill");
      const billData = await res.json();
      setLastBill(billData);
      
      toast.success("Bill generated successfully!");
      
      // Reset vehicle for next customer
      setVehicleNo("");
      
      // Trigger Print after a tiny delay for state to settle
      setTimeout(() => {
        handlePrint(billData);
      }, 500);

    } catch (error) {
      toast.error("Error generating bill");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (bill: any) => {
    if (!profile) return;

    const iframe = printIframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const dateStr = format(new Date(bill.createdAt), "dd/MM/yyyy");
    const timeStr = format(new Date(bill.createdAt), "HH:mm");
    
    // Hardcoded demo values based on IndianOil receipt
    const fpId = "1";
    const nozzleNo = "2";
    const businessName = profile.businessName || "FILLING POINT";

    const printHTML = `
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              width: 80mm;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.5;
              color: black;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .text-xl { font-size: 16px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .divider { border-bottom: 1px dashed black; margin: 6px 0; }
            
            .row { display: flex; justify-content: space-between; }
            .col { display: flex; flex-direction: column; }
            .ml-2 { margin-left: 8px; }
          </style>
        </head>
        <body>
          <div class="center bold text-xl mb-1">${businessName}</div>
          <div class="center mb-2">${profile.businessAddress || ""}</div>
          
          <div class="row">
            <div>Bill No: ${bill.billNumber}</div>
            <div>${dateStr} ${timeStr}</div>
          </div>
          
          <div class="divider"></div>
          <div class="center bold mb-1">Receipt : Physical Receipt</div>
          <div class="divider"></div>
          
          <div class="row">
            <div>Vehi.No : ${bill.vehicleNo || "N/A"}</div>
            <div>Mob.No  : ${profile.contactPersonPhone || ""}</div>
          </div>
          
          <div class="row">
            <div>FP. ID  : ${fpId}</div>
            <div>Nozl No : ${nozzleNo}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="bold mb-1">Fuel: ${bill.fuelType}</div>
          
          <div class="row">
            <div>Preset  : Rs.</div>
            <div class="bold">${parseFloat(bill.saleAmount).toFixed(2)}</div>
          </div>
          
          <div class="row">
            <div>Rate    : Rs.</div>
            <div>${parseFloat(bill.rate).toFixed(2)}</div>
          </div>
          
          <div class="row">
            <div class="bold">Sale    : Rs.</div>
            <div class="bold text-xl">${parseFloat(bill.saleAmount).toFixed(2)}</div>
          </div>
          
          <div class="row">
            <div>Volume  : L</div>
            <div class="bold">${parseFloat(bill.volume).toFixed(2)}</div>
          </div>
          
          <div class="divider"></div>
          <div class="center bold mt-2">Thank You. Please Visit Again</div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(printHTML);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 kravy-page-fade">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center text-pink-600">
          <Fuel size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--kravy-text-primary)]">Fuel Station Billing</h1>
          <p className="text-sm text-[var(--kravy-text-muted)] font-medium">Generate physical receipts for Petrol/Diesel sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ENTRY FORM */}
        <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-black text-[var(--kravy-text-primary)] flex items-center gap-2 mb-2">
            <FileText size={18} className="text-pink-500" />
            Bill Details
          </h3>

          {/* Fuel Type Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
            <button
              onClick={() => setFuelType("PETROL")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                fuelType === "PETROL" ? "bg-amber-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <div className="flex justify-center items-center gap-2">
                <Droplet size={16} />
                PETROL
              </div>
            </button>
            <button
              onClick={() => setFuelType("DIESEL")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                fuelType === "DIESEL" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <div className="flex justify-center items-center gap-2">
                <Fuel size={16} />
                DIESEL
              </div>
            </button>
          </div>

          <div className="space-y-4">
            {/* Vehicle Number */}
            <div>
              <label className="text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider mb-2 block">
                Vehicle Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Car size={18} />
                </div>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MH12AB1234"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-[var(--kravy-text-primary)] font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/50 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rate */}
              <div>
                <label className="text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider mb-2 block">
                  Rate (₹ / L)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-[var(--kravy-text-primary)] font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
              </div>

              {/* Volume (Liters) */}
              <div>
                <label className="text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider mb-2 block">
                  Volume (Liters)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={volume}
                    readOnly
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-transparent rounded-xl py-3 px-4 text-slate-500 font-bold opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Sale Amount */}
            <div>
              <label className="text-xs font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider mb-2 block">
                Sale Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500">
                  <IndianRupee size={22} />
                </div>
                <input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  className="w-full bg-pink-50 dark:bg-pink-900/10 border-2 border-pink-200 dark:border-pink-800 rounded-2xl py-4 pl-12 pr-4 text-3xl text-pink-700 dark:text-pink-400 font-black focus:outline-none focus:ring-4 focus:ring-pink-500/20"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-600/20 active:scale-[0.98]"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Printer size={20} />
                GENERATE & PRINT BILL
              </>
            )}
          </button>
        </div>

        {/* RECENT BILLS OR PREVIEW */}
        <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-black text-[var(--kravy-text-primary)] flex items-center gap-2 mb-6">
            <Save size={18} className="text-indigo-500" />
            Last Generated Bill
          </h3>
          
          <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {!lastBill ? (
              <div className="text-center text-slate-400 font-medium space-y-3">
                <Printer size={48} className="mx-auto opacity-20" />
                <p>No bill generated yet in this session.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[280px] bg-white text-black p-6 shadow-2xl font-mono text-sm leading-tight space-y-4 relative"
                style={{
                  backgroundImage: "radial-gradient(circle at 100% 100%, rgba(200,200,200,0.1) 0, transparent 20px)",
                  borderTop: "4px dashed #cbd5e1"
                }}
              >
                <div className="text-center font-bold text-lg mb-2">{profile?.businessName || "FILLING POINT"}</div>
                
                <div className="flex justify-between text-xs">
                  <span>Bill No: {lastBill.billNumber}</span>
                  <span>{format(new Date(lastBill.createdAt), "HH:mm")}</span>
                </div>
                
                <div className="border-b border-dashed border-slate-400"></div>
                <div className="text-center font-bold text-xs">Receipt : Physical Receipt</div>
                <div className="border-b border-dashed border-slate-400"></div>

                <div className="flex justify-between text-xs">
                  <span>Vehi.No : {lastBill.vehicleNo || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>FP. ID  : 1</span>
                  <span>Nozl No : 2</span>
                </div>
                
                <div className="border-b border-dashed border-slate-400"></div>
                
                <div className="font-bold text-xs">Fuel: {lastBill.fuelType}</div>
                
                <div className="flex justify-between text-xs">
                  <span>Preset  : Rs.</span>
                  <span className="font-bold">{parseFloat(lastBill.saleAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Rate    : Rs.</span>
                  <span>{parseFloat(lastBill.rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold my-1">
                  <span>Sale    : Rs.</span>
                  <span>{parseFloat(lastBill.saleAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volume  : L</span>
                  <span className="font-bold">{parseFloat(lastBill.volume).toFixed(2)}</span>
                </div>
                
                <div className="border-b border-dashed border-slate-400"></div>
                <div className="text-center font-bold text-xs">Thank You. Please Visit Again</div>
              </motion.div>
            )}
          </div>
          
          {lastBill && (
             <button
               onClick={() => handlePrint(lastBill)}
               className="mt-4 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 transition-all"
             >
               <Printer size={16} />
               REPRINT LAST BILL
             </button>
          )}
        </div>

      </div>
      
      {/* Invisible Iframe for Printing */}
      <iframe ref={printIframeRef} style={{ display: 'none' }} title="Print Receipt" />
    </div>
  );
}
