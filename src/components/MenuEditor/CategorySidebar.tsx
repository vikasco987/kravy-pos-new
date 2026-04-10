'use client'
import { PlusCircle, Search, ChevronRight, Hash, Layers, Settings, Plus } from 'lucide-react'

export default function CategorySidebar({ categories, activeCatId, onSelect, onAddOns }: any) {
  return (
    <div className="w-[320px] bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col h-full shrink-0 transition-colors">
      
      {/* 🛠️ SEARCH & HEADER AREA */}
      <div className="px-8 py-8 space-y-6">
         <div className="flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
            <h3 className="text-[0.75rem] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
               Categories ({categories.length})
            </h3>
            <button className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-full transition-all active:scale-95 group">
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
         </div>
      </div>

      {/* CATEGORY LISTING SCALED TO IMAGE 7 */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-2 pb-10">
         {categories.map((cat: any) => {
            const isActive = activeCatId === cat.id;
            return (
               <div key={cat.id} className="relative mb-0.5 last:mb-0">
                  <div
                    onClick={() => onSelect(cat.id)}
                    className={`group px-6 py-4.5 cursor-pointer flex justify-between items-center transition-all duration-300 rounded-2xl relative ${
                       isActive 
                       ? 'bg-red-50/20 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-black' 
                       : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 font-bold'
                    }`}
                  >
                     {/* Red Active Indicator Vertical Bar */}
                     {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-600 rounded-r-full shadow-[2px_0_10px_rgba(235,0,41,0.3)] anim-slide-in" />
                     )}
                     
                     <div className="flex items-center gap-4">
                        <span className={`text-[1.05rem] tracking-tight transition-all duration-300 ${isActive ? 'translate-x-1' : 'opacity-80'}`}>
                           {cat.name}
                        </span>
                     </div>

                     <div className={`text-[0.65rem] w-6 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${
                        isActive 
                        ? 'bg-red-600 text-white shadow-lg' 
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
                     }`}>
                        {cat.itemCount || 0}
                     </div>
                  </div>

                  {/* SUB-CATEGORIES IF ANY */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                     <div className="pl-14 pr-4 space-y-1 py-1">
                        {cat.subcategories.map((sub: any) => (
                           <div 
                              key={sub.id} 
                              onClick={() => onSelect(sub.id)}
                              className={`text-[0.85rem] py-2.5 cursor-pointer flex justify-between items-center border-l border-gray-100 dark:border-slate-800 pl-4 hover:border-red-500 hover:text-red-500 transition-all ${activeCatId === sub.id ? 'text-red-600 dark:text-red-500 font-bold border-red-500' : 'text-gray-400 dark:text-gray-500'}`}
                           >
                              <span>{sub.name}</span>
                              <span className="text-[0.6rem] font-bold opacity-30 tracking-widest">({sub.itemCount || 0})</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )
         })}
      </div>

      {/* 🚀 FIXED SETTINGS / ADDONS AREA */}
      <div className="px-6 py-8 border-t border-gray-50 dark:border-slate-800 bg-[#FAFAFA]/50 dark:bg-slate-900/50 transition-colors">
         <button
            onClick={onAddOns}
            className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-[0.85rem] font-black text-slate-800 dark:text-slate-200 shadow-sm hover:shadow-md hover:border-red-100 dark:hover:border-red-900/30 hover:text-red-600 transition-all group active:scale-[0.98]"
         >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 flex items-center justify-center transition-colors">
                  <Layers size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors" />
               </div>
               <span>Global Add-ons</span>
            </div>
            <ChevronRight size={18} className="text-gray-200 dark:text-gray-700 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
         </button>
      </div>

    </div>
  )
}
