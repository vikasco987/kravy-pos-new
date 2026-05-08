'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  ClipboardList, 
  Printer, 
  Download,
  ArrowLeft,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface Material {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  purchasePrice?: number;
  category?: string;
}

interface Item {
  id: string;
  name: string;
  currentStock: number;
  criticalFloor: number;
  sellingPrice: number;
  costPrice?: number;
  categoryName?: string;
}

export default function InventoryReportsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'raw' | 'finished'>('summary');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [matRes, itemRes] = await Promise.all([
        fetch('/api/inventory/materials'),
        fetch('/api/menu/items')
      ]);

      if (matRes.ok) setMaterials(await matRes.json());
      if (itemRes.ok) setItems(await itemRes.json());
    } catch (err) {
      console.error("Failed to fetch report data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations
  const lowStockMaterials = materials.filter(m => m.stock <= m.minStock && m.stock > 0);
  const outOfStockMaterials = materials.filter(m => m.stock <= 0);
  const lowStockItems = items.filter(i => i.currentStock <= i.criticalFloor && i.currentStock > 0);
  const outOfStockItems = items.filter(i => i.currentStock <= 0);

  const totalMaterialValuation = materials.reduce((acc, m) => acc + (m.stock * (m.purchasePrice || 0)), 0);
  const totalItemValuation = items.reduce((acc, i) => acc + (i.currentStock * (i.sellingPrice || 0)), 0);

  const printReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--kravy-bg-alt)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--kravy-brand)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--kravy-text-muted)] font-bold animate-pulse">Generating Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--kravy-bg-alt)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--kravy-bg-alt)]/80 backdrop-blur-xl border-b border-[var(--kravy-border)] px-6 py-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory" className="p-2 hover:bg-[var(--kravy-bg)] rounded-xl transition-all text-[var(--kravy-text-muted)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-[var(--kravy-text-primary)] flex items-center gap-2">
              <BarChart3 className="text-[var(--kravy-brand)]" />
              Inventory Reports
            </h1>
            <p className="text-[10px] font-bold text-[var(--kravy-text-faint)] uppercase tracking-widest">Analytics & Insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-xl text-xs font-black text-[var(--kravy-text-primary)] hover:border-[var(--kravy-brand)] transition-all"
          >
            <Printer size={14} />
            PRINT REPORT
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Print Header (Only visible on print) */}
        <div className="hidden print:block text-center mb-8">
            <h1 className="text-3xl font-black mb-2">KRAVY POS - INVENTORY REPORT</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Date: {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}</p>
            <div className="h-1 w-20 bg-black mx-auto mt-4"></div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Material Valuation" 
            value={`₹${totalMaterialValuation.toLocaleString()}`} 
            icon={<DollarSign size={20} />} 
            color="bg-emerald-500" 
            subtitle="Total value of raw stock"
          />
          <StatCard 
            title="Product Valuation" 
            value={`₹${totalItemValuation.toLocaleString()}`} 
            icon={<TrendingUp size={20} />} 
            color="bg-blue-500" 
            subtitle="Value at selling price"
          />
          <StatCard 
            title="Critical Stock" 
            value={lowStockMaterials.length + lowStockItems.length} 
            icon={<AlertTriangle size={20} />} 
            color="bg-amber-500" 
            subtitle="Items needing reorder"
          />
          <StatCard 
            title="Out of Stock" 
            value={outOfStockMaterials.length + outOfStockItems.length} 
            icon={<Package size={20} />} 
            color="bg-rose-500" 
            subtitle="Zero inventory items"
          />
        </div>

        {/* Tab Switcher (No Print) */}
        <div className="flex p-1 bg-[var(--kravy-bg)] rounded-2xl w-fit border border-[var(--kravy-border)] shadow-sm no-print">
          {[
            { id: 'summary', label: 'Summary', icon: <Layers size={14} /> },
            { id: 'raw', label: 'Raw Ingredients', icon: <ClipboardList size={14} /> },
            { id: 'finished', label: 'Finished Products', icon: <Package size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id 
                ? 'bg-[var(--kravy-brand)] text-white shadow-lg shadow-[var(--kravy-brand)]/20' 
                : 'text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)]'
              }`}
            >
              {tab.icon}
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {(activeTab === 'summary' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Material Status Chart (Simplified Bars) */}
              <ReportBox title="Stock Status (Raw Materials)" icon={<BarChart3 />}>
                <div className="space-y-6 pt-4">
                  <StockProgress label="In Stock" count={materials.length - lowStockMaterials.length - outOfStockMaterials.length} total={materials.length} color="bg-emerald-500" />
                  <StockProgress label="Low Stock" count={lowStockMaterials.length} total={materials.length} color="bg-amber-500" />
                  <StockProgress label="Out of Stock" count={outOfStockMaterials.length} total={materials.length} color="bg-rose-500" />
                </div>
              </ReportBox>

              {/* Finished Products Status */}
              <ReportBox title="Stock Status (Products)" icon={<TrendingUp />}>
                <div className="space-y-6 pt-4">
                  <StockProgress label="In Stock" count={items.length - lowStockItems.length - outOfStockItems.length} total={items.length} color="bg-blue-500" />
                  <StockProgress label="Low Stock" count={lowStockItems.length} total={items.length} color="bg-amber-500" />
                  <StockProgress label="Out of Stock" count={outOfStockItems.length} total={items.length} color="bg-rose-500" />
                </div>
              </ReportBox>

              {/* Critical Reorder List */}
              <div className="lg:col-span-2">
                <ReportBox title="Critical Reorder Alerts" icon={<AlertTriangle className="text-amber-500" />}>
                  <div className="divide-y divide-[var(--kravy-border)] -mx-6">
                    {[...lowStockMaterials, ...lowStockItems].length === 0 ? (
                      <div className="p-12 text-center">
                        <Package size={40} className="mx-auto mb-3 text-[var(--kravy-text-faint)] opacity-20" />
                        <p className="text-sm font-bold text-[var(--kravy-text-muted)]">Everything looks good! No critical stock alerts.</p>
                      </div>
                    ) : (
                      <>
                        {lowStockMaterials.map(m => (
                          <CriticalRow key={m.id} name={m.name} stock={m.stock} min={m.minStock} unit={m.unit} type="RAW" />
                        ))}
                        {lowStockItems.map(i => (
                          <CriticalRow key={i.id} name={i.name} stock={i.currentStock} min={i.criticalFloor} unit="pcs" type="PRODUCT" />
                        ))}
                      </>
                    )}
                  </div>
                </ReportBox>
              </div>
            </div>
          )}

          {(activeTab === 'raw' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
            <ReportTable 
              title="Raw Ingredients Detailed Report" 
              data={materials} 
              headers={['Name', 'Current Stock', 'Alert Floor', 'Status', 'Valuation']}
              renderRow={(m: any) => {
                const status = m.stock <= 0 ? 'Out of Stock' : (m.stock <= m.minStock ? 'Low Stock' : 'In Stock');
                const color = m.stock <= 0 ? 'text-rose-500' : (m.stock <= m.minStock ? 'text-amber-500' : 'text-emerald-500');
                return (
                  <tr key={m.id} className="border-b border-[var(--kravy-border)] hover:bg-[var(--kravy-bg)] transition-all">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--kravy-text-primary)]">{m.name}</td>
                    <td className="px-6 py-4 text-sm font-black">{m.stock} <span className="text-[10px] text-[var(--kravy-text-faint)]">{m.unit}</span></td>
                    <td className="px-6 py-4 text-sm text-[var(--kravy-text-muted)] font-bold">{m.minStock}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[var(--kravy-text-primary)]">₹{(m.stock * (m.purchasePrice || 0)).toLocaleString()}</td>
                  </tr>
                );
              }}
            />
          )}

          {(activeTab === 'finished' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
            <ReportTable 
              title="Finished Products Detailed Report" 
              data={items} 
              headers={['Product Name', 'Current Stock', 'Alert Floor', 'Status', 'Est. Value']}
              renderRow={(i: any) => {
                const status = i.currentStock <= 0 ? 'Out of Stock' : (i.currentStock <= i.criticalFloor ? 'Low Stock' : 'In Stock');
                const color = i.currentStock <= 0 ? 'text-rose-500' : (i.currentStock <= i.criticalFloor ? 'text-amber-500' : 'text-blue-500');
                return (
                  <tr key={i.id} className="border-b border-[var(--kravy-border)] hover:bg-[var(--kravy-bg)] transition-all">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--kravy-text-primary)]">{i.name}</td>
                    <td className="px-6 py-4 text-sm font-black">{i.currentStock} <span className="text-[10px] text-[var(--kravy-text-faint)]">pcs</span></td>
                    <td className="px-6 py-4 text-sm text-[var(--kravy-text-muted)] font-bold">{i.criticalFloor}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[var(--kravy-text-primary)]">₹{(i.currentStock * (i.sellingPrice || 0)).toLocaleString()}</td>
                  </tr>
                );
              }}
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .bg-\\[var\\(--kravy-bg-alt\\)\\] { background: white !important; }
          .bg-\\[var\\(--kravy-bg\\)\\] { background: white !important; border: 1px solid #eee !important; }
          .shadow-sm, .shadow-md, .shadow-lg { shadow: none !important; box-shadow: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  return (
    <div className="bg-[var(--kravy-bg)] p-6 rounded-3xl border border-[var(--kravy-border)] shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${color} text-white rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-black text-[var(--kravy-text-faint)] uppercase tracking-widest">{title}</p>
          <h2 className="text-2xl font-black text-[var(--kravy-text-primary)]">{value}</h2>
        </div>
      </div>
      <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-2">{subtitle}</p>
    </div>
  );
}

function ReportBox({ title, icon, children }: any) {
  return (
    <div className="bg-[var(--kravy-bg)] rounded-3xl border border-[var(--kravy-border)] shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-[var(--kravy-border)] flex items-center justify-between">
        <h3 className="text-xs font-black text-[var(--kravy-text-primary)] uppercase tracking-widest flex items-center gap-2">
          <span className="text-[var(--kravy-brand)]">{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function StockProgress({ label, count, total, color }: any) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-[var(--kravy-text-primary)]">{count} <span className="text-[10px] font-bold text-[var(--kravy-text-faint)]">/ {total}</span></p>
      </div>
      <div className="h-2.5 bg-[var(--kravy-bg-alt)] rounded-full overflow-hidden border border-[var(--kravy-border)]">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out rounded-full shadow-inner shadow-black/10`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CriticalRow({ name, stock, min, unit, type }: any) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-[var(--kravy-bg-alt)]/50 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${stock <= 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
        <div>
          <p className="text-sm font-black text-[var(--kravy-text-primary)]">{name}</p>
          <span className="text-[9px] font-bold text-[var(--kravy-text-faint)] uppercase tracking-widest">{type} ITEM</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-rose-500">{stock} {unit}</p>
        <p className="text-[9px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-widest">THRESHOLD: {min}</p>
      </div>
    </div>
  );
}

function ReportTable({ title, data, headers, renderRow }: any) {
  return (
    <div className="bg-[var(--kravy-bg)] rounded-3xl border border-[var(--kravy-border)] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--kravy-border)]">
        <h3 className="text-xs font-black text-[var(--kravy-text-primary)] uppercase tracking-widest">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--kravy-bg-alt)]/50 border-b border-[var(--kravy-border)]">
              {headers.map((h: string) => (
                <th key={h} className="px-6 py-3 text-[10px] font-black text-[var(--kravy-text-faint)] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item: any) => renderRow(item))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
