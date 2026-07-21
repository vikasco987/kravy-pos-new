"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Printer, Power, FileCode, ImageIcon } from "lucide-react";
let qz: any = null;

export default function QZTestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [qzVersion, setQzVersion] = useState("");
  const [qzLoaded, setQzLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import qz-tray only on client-side to avoid SSR errors
    import("qz-tray").then((module) => {
      qz = module.default || module;
      setQzLoaded(true);
      // Check if already connected on mount
      if (qz.websocket.isActive()) {
        setIsConnected(true);
        fetchPrinters();
      }
    }).catch(err => {
      console.error("Failed to load qz-tray", err);
    });
  }, []);

  const connectQZ = async () => {
    if (!qzLoaded || !qz) return toast.error("QZ Tray library is still loading");
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
      toast.error("Failed to connect to QZ Tray. Please make sure the QZ Tray app is running on your computer.");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchPrinters = async () => {
    try {
      const list = await qz.printers.find();
      setPrinters(list);
      if (list.length > 0) setSelectedPrinter(list[0]); // Select first by default
    } catch (err: any) {
      toast.error("Failed to fetch printers: " + err.message);
    }
  };

  const testPrintRaw = async () => {
    if (!selectedPrinter) return toast.error("Please select a printer first");
    
    try {
      const config = qz.configs.create(selectedPrinter);
      
      // Basic ESC/POS payload for thermal printers
      const data = [
        '\x1B' + '\x40',          // Initialize printer
        '\x1B' + '\x61' + '\x31', // Center align
        '\x1B' + '\x21' + '\x30', // Double height & width text
        'KRAVY POS TEST\n',
        '\x1B' + '\x21' + '\x00', // Normal text
        '--------------------------------\n',
        'Direct Print Successful!\n',
        'Raw ESC/POS Command Test\n',
        'Time: ' + new Date().toLocaleTimeString() + '\n',
        '--------------------------------\n',
        '\n\n\n',                 // Feed lines before cut
        '\x1D' + '\x56' + '\x41', // Cut paper (partial cut)
        '\x1B' + '\x70' + '\x00' + '\x19' + '\xFA' // Open cash drawer (pulse pin 2)
      ];
      
      await qz.print(config, data);
      toast.success("Raw ESC/POS command sent to printer!");
    } catch (err: any) {
      console.error(err);
      toast.error("Print Failed: " + err.message);
    }
  };

  const testPrintHTML = async () => {
    if (!selectedPrinter) return toast.error("Please select a printer first");
    
    try {
      const config = qz.configs.create(selectedPrinter, { margins: 0 });
      
      const htmlData = `
        <html>
        <body style="font-family: sans-serif; text-align: center; margin: 0; padding: 10px;">
          <h1 style="margin: 0;">Kravy POS</h1>
          <h3 style="margin: 5px 0;">HTML Raster Test</h3>
          <hr style="border-top: 1px dashed black;" />
          <p style="font-size: 14px; font-weight: bold;">This is a test of pixel-based printing.</p>
          <p style="font-size: 12px;">It preserves all HTML styling and layouts.</p>
          <hr style="border-top: 1px dashed black;" />
          <br/><br/><br/>
        </body>
        </html>
      `;
      
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
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Printer size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">QZ Tray Tester</h2>
          <p className="text-indigo-200 text-sm font-medium mt-1">Direct Hardware Printing Setup</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
              <div className="flex items-center gap-2">
                <div className={\`w-2.5 h-2.5 rounded-full \${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}\`} />
                <span className={\`font-black text-sm \${isConnected ? 'text-emerald-700' : 'text-rose-600'}\`}>
                  {isConnected ? \`Connected (v\${qzVersion})\` : "Disconnected"}
                </span>
              </div>
            </div>
            
            <button
              onClick={connectQZ}
              disabled={isConnecting || isConnected || !qzLoaded}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {isConnecting ? "..." : (isConnected ? "Connected" : <><Power size={14} /> {qzLoaded ? "Connect" : "Loading..."}</>)}
            </button>
          </div>

          {isConnected && (
            <div className="space-y-5 animate-in slide-in-from-bottom-2 fade-in duration-300">
              
              {/* Printer Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Printer</label>
                <select 
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="" disabled>-- Select a printer --</option>
                  {printers.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="flex justify-end">
                  <button onClick={fetchPrinters} className="text-xs text-indigo-600 font-bold hover:underline">
                    Refresh List
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={testPrintRaw}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
                >
                  <FileCode size={24} className="text-emerald-400" />
                  <div className="text-center">
                    <div className="font-black text-sm">ESC/POS Test</div>
                    <div className="text-[10px] text-slate-400">Fast & Raw</div>
                  </div>
                </button>

                <button
                  onClick={testPrintHTML}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <ImageIcon size={24} className="text-amber-300" />
                  <div className="text-center">
                    <div className="font-black text-sm">HTML Test</div>
                    <div className="text-[10px] text-indigo-200">Styling & Layout</div>
                  </div>
                </button>
              </div>

            </div>
          )}

          {!isConnected && (
            <div className="text-center p-4">
              <p className="text-sm text-slate-500">
                Please make sure <a href="https://qz.io/download/" target="_blank" className="text-indigo-600 font-bold hover:underline">QZ Tray</a> is installed and running on your computer.
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
