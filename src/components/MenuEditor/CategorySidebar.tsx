'use client'
import { PlusCircle, Search, ChevronRight, Hash, Layers, Settings, Plus } from 'lucide-react'

export default function CategorySidebar({ categories, activeCatId, onSelect, onAddOns }: any) {
  return (
    <div className="w-[320px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      
      {/* 🛠️ SEARCH & HEADER AREA */}
      <div className="px-8 py-8 space-y-6">
         <div className="flex justify-between items-center bg-white">
            <h3 className="text-[0.75rem] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
               Categories ({categories.length})
            </h3>
            <button className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all active:scale-95 group">
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
                       ? 'bg-red-50/20 text-red-600 font-black' 
                       : 'text-gray-500 hover:bg-gray-50/50 font-bold'
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
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
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
                              className={`text-[0.85rem] py-2.5 cursor-pointer flex justify-between items-center border-l border-gray-100 pl-4 hover:border-red-500 hover:text-red-500 transition-all ${activeCatId === sub.id ? 'text-red-600 font-bold border-red-500' : 'text-gray-400'}`}
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
      <div className="px-6 py-8 border-t border-gray-50 bg-[#FAFAFA]/50">
         <button
            onClick={onAddOns}
            className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-2xl text-[0.85rem] font-black text-slate-800 shadow-sm hover:shadow-md hover:border-red-100 hover:text-red-600 transition-all group active:scale-[0.98]"
         >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                  <Layers size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
               </div>
               <span>Global Add-ons</span>
            </div>
            <ChevronRight size={18} className="text-gray-200 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
         </button>
      </div>

    </div>
  )
}
