'use client'
import { Plus, Edit2, CheckCircle, Clock, Trash2, Tag, Star, Activity, PlusCircle, Bookmark, Layers, Zap, ChevronRight, HelpCircle } from 'lucide-react'
import Image from 'next/image'

function VegDot({ type }: any) {
  const isVeg = type === 'veg'
  return (
    <div className={`w-3.5 h-3.5 border-[1.5px] rounded-sm flex items-center justify-center flex-shrink-0 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
    </div>
  )
}

export default function ItemsList({ items, onAddItem, onEditItem, onToggleItem }: any) {
  return (
    <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto no-scrollbar pb-32 scroll-smooth transition-colors">
      
      {/* 🚀 STICKY HEADER MATCHING IMAGE 7 */}
      <div className="px-10 py-10 flex justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sticky top-0 z-[10] border-b border-gray-50/50 dark:border-slate-800 shadow-sm shadow-gray-50/20 dark:shadow-none mb-4 transition-all duration-300">
        <div className="space-y-2">
           <h2 className="text-[1.35rem] font-black text-[#1C1C1C] dark:text-white tracking-tight flex items-center gap-3 group">
              Dish Management
              <div className="w-1.5 h-1.5 bg-[#EB0029] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
           </h2>
           <p className="text-[0.7rem] font-black text-gray-300 dark:text-gray-500 uppercase tracking-[0.25em] flex items-center gap-1.5">
              {items.length} items in category <HelpCircle size={10} className="text-gray-200 dark:text-gray-700" />
           </p>
        </div>

        <button
          onClick={onAddItem}
          className="bg-[#EB0029] text-white px-8 py-3.5 rounded-[1.25rem] text-[0.85rem] font-black hover:bg-black dark:hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 active:scale-95 flex items-center gap-3 tracking-[0.2em] uppercase group"
        >
          <Plus size={20} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
          <span>Add New Item</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-32 text-center flex flex-col items-center justify-center gap-10 opacity-60">
           <div className="relative w-24 h-24 bg-[#FAFAFA] dark:bg-slate-800 rounded-[2rem] flex items-center justify-center animate-bounce shadow-inner transition-colors">
              <PlusCircle size={48} strokeWidth={1} className="text-gray-200 dark:text-gray-600" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-black text-[0.6rem]">!</div>
           </div>
           <p className="text-[1rem] text-gray-400 dark:text-gray-500 font-bold max-w-[280px] leading-relaxed italic font-mono uppercase tracking-widest opacity-80">
             Your menu is empty. Start building your legacy by adding a dish.
           </p>
        </div>
      ) : (
        <div className="px-10 space-y-6">
          {items.map((item: any) => (
            <div 
              key={item.id} 
              className="flex gap-8 p-6 items-center bg-white dark:bg-slate-900 border border-gray-50 dark:border-slate-800 rounded-[2.5rem] hover:border-red-500 dark:hover:border-red-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-300 group relative"
            >
              {/* IMAGE AREA (MATCHING IMAGE 7 SQUARES/CIRCLES) */}
              <div className="w-[85px] h-[85px] rounded-[1.75rem] bg-[#FAFAFA] dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm relative transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                {item.image || item.imageUrl ? (
                   <Image src={item.image || item.imageUrl} alt={item.name} fill className="object-cover transition-opacity duration-300 group-hover:opacity-90 grayscale-[20%] group-hover:grayscale-0" />
                ) : (
                   <div className="text-4xl opacity-10 group-hover:opacity-25 transition-all grayscale">🍽️</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* DYNAMIC TEXT AREA */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3">
                  <VegDot type={item.isVeg ? 'veg' : 'nonveg'} />
                  <span className="font-black text-[1.1rem] text-[#1C1C1C] dark:text-white tracking-tight truncate group-hover:text-red-500 transition-colors">{item.name}</span>
                  {item.isBestseller && (
                    <div className="bg-[#FFF8E6] dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 text-[0.6rem] px-2.5 py-1 rounded-full font-black uppercase tracking-[0.1em] border border-[#FFE7A3]/50 dark:border-amber-900/30 flex items-center gap-1.5 shadow-sm">
                       <Zap size={10} fill="currentColor" /> Bestseller
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2">
                   <div className="text-[1.25rem] font-black text-[#1C1C1C] dark:text-white tracking-tighter italic">₹{item.sellingPrice || item.price}</div>
                   {item.price > (item.sellingPrice || item.price) && (
                      <div className="text-[0.9rem] text-gray-300 dark:text-gray-600 line-through opacity-80 font-bold italic transition-colors">₹{item.price}</div>
                   )}
                </div>

                {/* STATUS PILLS (MATCHING IMAGE 7) */}
                <div className="flex gap-2 flex-wrap pt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2 text-[0.62rem] px-3 py-1.5 rounded-lg bg-[#F8F9FA] dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.15em] border border-gray-100 dark:border-slate-800 transition-all group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:text-slate-500 dark:group-hover:text-slate-400">
                      <Zap size={10} className="text-amber-500" /> {item.spiciness || 'Medium'} spice
                   </div>
                   {item.variants && (
                     <div className="flex items-center gap-2 text-[0.62rem] px-3 py-1.5 rounded-lg bg-[#EEF2FF] dark:bg-blue-950/20 text-[#4F46E5] dark:text-blue-400 font-black uppercase tracking-[0.15em] border border-[#E0E7FF] dark:border-blue-900/30 transition-all group-hover:bg-white dark:group-hover:bg-slate-800">
                       <Layers size={10} /> 2 Variants
                     </div>
                   )}
                </div>
              </div>

              {/* ACTION AREA (MATCHING IMAGE 7 PIXELS) */}
              <div className="flex items-center gap-6 flex-shrink-0 pr-4">
                <button
                  onClick={() => onEditItem(item)}
                  className="flex items-center gap-2.5 px-6 py-2.5 border border-gray-100 dark:border-slate-800 rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-[#1C1C1C] dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-[#EB0029] hover:text-[#EB0029] hover:shadow-xl hover:shadow-red-500/5 transition-all active:scale-95"
                >
                  <Edit2 size={16} strokeWidth={3} />
                  <span>Edit</span>
                </button>
                
                {/* LIVE INDICATOR TOGGLE */}
                <div className="flex flex-col items-center gap-1.5 group/toggle">
                   <button
                    onClick={() => onToggleItem(item.id, !(item.isActive ?? true))}
                    className={`w-12 h-7 rounded-full relative transition-all shadow-inner border-[1px] ${item.isActive ?? true ? 'bg-[#00BFA5] border-[#00BFA5]/20 shadow-[#00BFA5]/30' : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}
                   >
                    <span className={`absolute top-0.5 w-[22px] h-[22px] bg-white dark:bg-slate-200 rounded-full shadow-lg transition-all duration-300 ${item.isActive ?? true ? 'left-[22px]' : 'left-0.5'}`} />
                   </button>
                   <span className={`text-[0.6rem] font-black uppercase tracking-[0.25em] transition-colors ${item.isActive ?? true ? 'text-[#00BFA5]' : 'text-gray-300 dark:text-gray-600'}`}>
                      {item.isActive ?? true ? 'LIVE' : 'HIDE'}
                   </span>
                </div>
              </div>

              {/* Interactive Shadow Accent */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 pointer-events-none transition-all duration-700" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
