"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Printer, Power, FileCode, ImageIcon } from "lucide-react";

export default function QZTestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [qzVersion, setQzVersion] = useState("");
  const [qzLoaded, setQzLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById("qz-tray-script")) {
      setQzLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.min.js";
    script.id = "qz-tray-script";
    script.onload = () => {
      setQzLoaded(true);
      if (typeof window !== "undefined" && (window as any).qz?.websocket.isActive()) {
        setIsConnected(true);
        fetchPrinters();
      }
    };
    script.onerror = () => console.error("Failed to load QZ Tray library");
    document.body.appendChild(script);
  }, []);

  const [errorMessage, setErrorMessage] = useState("");

  const connectQZ = async () => {
    setErrorMessage("");
    const qz = (window as any).qz;
    if (!qzLoaded || !qz) {
      setErrorMessage("QZ Tray library is still loading or failed to load from CDN.");
      return toast.error("QZ Tray library is still loading");
    }
    setIsConnecting(true);
    try {
      if (qz.websocket.isActive()) {
        toast.success("Already connected to QZ Tray");
        setIsConnected(true);
        fetchPrinters();
        return;
      }
      
      await qz.websocket.connect({ retries: 2, delay: 1 });
      setIsConnected(true);
      toast.success("Successfully connected to QZ Tray!");
      
      const version = await qz.api.getVersion();
      setQzVersion(version);
      
      fetchPrinters();
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to connect. Is QZ Tray running on your computer? " + (err?.message || ""));
      toast.error("Failed to connect to QZ Tray.");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchPrinters = async () => {
    const qz = (window as any).qz;
    try {
      const list = await qz.printers.find();
      setPrinters(list);
      if (list.length > 0) setSelectedPrinter(list[0]);
    } catch (err: any) {
      toast.error("Failed to fetch printers: " + err.message);
    }
  };

  const testPrintRaw = async () => {
    const qz = (window as any).qz;
    if (!selectedPrinter) return toast.error("Please select a printer first");
    
    try {
      const config = qz.configs.create(selectedPrinter);
      const esc = String.fromCharCode(27);
      const gs = String.fromCharCode(29);
      const data = [
        esc + '@',
        esc + 'a' + '1',
        esc + '!' + '0',
        'KRAVY POS TEST\\n',
        esc + '!' + String.fromCharCode(0),
        '--------------------------------\\n',
        'Direct Print Successful!\\n',
        'Raw ESC/POS Command Test\\n',
        'Time: ' + new Date().toLocaleTimeString() + '\\n',
        '--------------------------------\\n',
        '\\n\\n\\n',
        gs + 'V' + 'A',
        esc + 'p' + String.fromCharCode(0) + String.fromCharCode(25) + String.fromCharCode(250)
      ];
      await qz.print(config, data);
      toast.success("Raw ESC/POS command sent to printer!");
    } catch (err: any) {
      console.error(err);
      toast.error("Print Failed: " + err.message);
    }
  };

  const testPrintHTML = async () => {
    const qz = (window as any).qz;
    if (!selectedPrinter) return toast.error("Please select a printer first");
    
    try {
      const config = qz.configs.create(selectedPrinter, { margins: 0 });
      const htmlData = "<html><body style='text-align: center; font-family: sans-serif; padding: 10px;'><h1>Kravy POS</h1><p>HTML Test</p></body></html>";
      
      const data = [{
        type: 'pixel',
        format: 'html',
        flavor: 'plain',
        data: htmlData
      }];
      
      await qz.print(config, data);
      toast.success("HTML print command sent!");
    } catch (err: any) {
      console.error(err);
      toast.error("HTML Print Failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Printer size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">QZ Tray Tester</h2>
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100">
              {errorMessage}
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            
            <button
              onClick={connectQZ}
              disabled={isConnecting || isConnected || !qzLoaded}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl disabled:opacity-50"
            >
              <Power size={14} /> {isConnecting ? "Connecting..." : (isConnected ? "Connected" : "Connect")}
            </button>
          </div>

          {isConnected && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Printer</label>
                <select 
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value="" disabled>-- Select a printer --</option>
                  {printers.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={testPrintRaw}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl"
                >
                  <FileCode size={24} className="text-emerald-400" />
                  <div className="text-center">
                    <div className="font-black text-sm">ESC/POS Test</div>
                  </div>
                </button>

                <button
                  onClick={testPrintHTML}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-2xl"
                >
                  <ImageIcon size={24} className="text-amber-300" />
                  <div className="text-center">
                    <div className="font-black text-sm">HTML Test</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
