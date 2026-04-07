'use client'
import { useState, useEffect } from 'react'
import { Plus, X, ArrowLeft, MoreVertical, Trash2, Edit2, Layers, Check, ChevronDown, PlusCircle, Search, UtensilsCrossed, Sparkles, Zap, Info, ShieldCheck, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddonGroupsModal({ groups, onSave, onDelete, onClose, initialGroup, allItems = [], categories = [] }: any) {
  const [editingGroup, setEditingGroup] = useState<any>(initialGroup || null)
  const [showForm, setShowForm] = useState(!!initialGroup)
  const [itemSearch, setItemSearch] = useState('')

  const [form, setForm] = useState({
    name: initialGroup?.name || '',
    isCompulsory: initialGroup?.isCompulsory || false,
    minSelection: initialGroup?.minSelection || 0,
    maxSelection: initialGroup?.maxSelection || 5,
    allowMultipleUnits: initialGroup?.allowMultipleUnits || false,
    items: initialGroup?.items ? JSON.parse(JSON.stringify(initialGroup.items)) : [{ id: Math.random().toString(36).substr(2, 9), name: '', price: 0, foodType: 'veg', isAvailable: true }],
    itemIds: initialGroup?.itemIds || []
  })

  useEffect(() => {
    if (initialGroup) {
      setEditingGroup(initialGroup)
      setForm({
        name: initialGroup.name,
        isCompulsory: initialGroup.isCompulsory,
        minSelection: initialGroup.minSelection,
        maxSelection: initialGroup.maxSelection,
        allowMultipleUnits: initialGroup.allowMultipleUnits,
        items: initialGroup.items ? JSON.parse(JSON.stringify(initialGroup.items)) : [],
        itemIds: initialGroup.itemIds || []
      })
      setShowForm(true)
    }
  }, [initialGroup])

  function openCreate() {
    setEditingGroup(null)
    setForm({
      name: '',
      isCompulsory: false,
      minSelection: 0,
      maxSelection: 5,
      allowMultipleUnits: false,
      items: [{ id: Math.random().toString(36).substr(2, 9), name: '', price: 0, foodType: 'veg', isAvailable: true }],
      itemIds: []
    })
    setShowForm(true)
  }

  function openEdit(group: any) {
    setEditingGroup(group)
    setForm({
      name: group.name,
      isCompulsory: group.isCompulsory,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
      allowMultipleUnits: group.allowMultipleUnits,
      items: group.items ? JSON.parse(JSON.stringify(group.items)) : [],
      itemIds: group.itemIds || []
    })
    setShowForm(true)
  }

  function update(key: string, val: any) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function toggleItemLink(itemId: string) {
    const current = form.itemIds || []
    if (current.includes(itemId)) {
      update('itemIds', current.filter((id: string) => id !== itemId))
    } else {
      update('itemIds', [...current, itemId])
    }
  }

  function updateItem(index: number, field: string, val: any) {
    const updated = form.items.map((it: any, i: number) => i === index ? { ...it, [field]: val } : it)
    update('items', updated)
  }

  function addItem() {
    update('items', [...form.items, { id: Math.random().toString(36).substr(2, 9), name: '', price: 0, foodType: 'veg', isAvailable: true }])
  }

  function removeItem(index: number) {
    update('items', form.items.filter((_: any, i: number) => i !== index))
  }

  function handleSave() {
    if (!form.name) return alert('Configuration name is required')
    onSave({ ...form, id: editingGroup?.id })
    setShowForm(false)
  }

  const filteredItems = allItems.filter((i: any) => 
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    categories.find((c: any) => c.id === i.categoryId)?.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const sectionLabelRef = "text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-400 pl-1"
  const inputBaseRef = "w-full border-2 border-slate-100 rounded-2xl px-5 h-14 text-[1rem] font-black text-slate-950 bg-white outline-none focus:border-red-500 focus:shadow-xl focus:shadow-red-500/5 transition-all placeholder:text-slate-200/60"

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="bg-[#FBFBFD] w-full max-w-[1000px] rounded-[3.5rem] max-h-[92vh] overflow-hidden shadow-[0_48px_96px_-12px_rgba(0,0,0,0.2)] relative flex flex-col border border-white/50"
      >
        {/* MODAL HEADER */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-5">
            {showForm && (
              <button 
                onClick={() => setShowForm(false)} 
                className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
              >
                 <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div className="space-y-1">
               <h2 className="text-[1.5rem] font-black text-slate-900 leading-none tracking-tight flex items-center gap-3">
                  {showForm ? (editingGroup ? 'Modify Node' : 'Initialise Group') : 'Ecosystem Nodes'}
                  <Sparkles size={20} className="text-amber-400" />
               </h2>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[0.65rem] font-black text-slate-400 tracking-[0.25em] uppercase">Ecosystem Configuration Interface</p>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all active:scale-90 border border-slate-100">
             <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {!showForm ? (
            <div className="p-10 space-y-10">
              {/* PRIMARY ACTION */}
              <button 
                onClick={openCreate}
                className="group relative w-full h-32 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-red-400 hover:bg-red-50/20 transition-all duration-500 shadow-sm"
              >
                 <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-red-500 group-hover:text-white transition-all flex items-center justify-center mb-1">
                    <Plus size={32} strokeWidth={3} />
                 </div>
                 <span className="font-black text-[0.8rem] tracking-[0.3em] uppercase group-hover:text-red-600">Forge New Cluster Node</span>
              </button>

              <div className="space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <LayoutGrid size={14} className="text-slate-300" />
                    <span className={sectionLabelRef}>Active Configurations</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group: any) => (
                      <div key={group.id} className="group flex flex-col border-2 border-slate-50 bg-white rounded-[2.5rem] p-6 hover:border-red-100 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500 relative overflow-hidden">
                         <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-red-500 group-hover:bg-red-50 transition-all">
                               <Layers size={20} />
                            </div>
                            <div className="flex items-center gap-1.5">
                               <button onClick={() => openEdit(group)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                                  <Edit2 size={16} />
                               </button>
                               <button onClick={() => onDelete(group.id)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                         <h5 className="text-[1.15rem] font-black tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">{group.name}</h5>
                         <div className="flex items-center gap-3 mt-4">
                            <span className="text-[0.6rem] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider">
                               {group.items?.length || 0} Nodes
                            </span>
                            {group.isCompulsory && (
                               <span className="text-[0.6rem] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-wider">
                                  Compulsory
                               </span>
                            )}
                         </div>
                      </div>
                    ))}
                    {groups.length === 0 && (
                      <div className="col-span-full py-24 text-center">
                         <Layers size={48} className="mx-auto text-slate-100 mb-4" />
                         <p className="text-[0.8rem] font-black text-slate-300 uppercase tracking-[0.3em]">No clusters identified in archive</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-10 pb-40 space-y-12">
               {/* NODE ARCHITECTURE FORM */}
               <div className="space-y-10">
                  {/* Basic Metadata */}
                  <div className="grid grid-cols-1 gap-8">
                     <div className="space-y-3">
                        <label className={sectionLabelRef}>Cluster Node Identifier *</label>
                        <div className="relative group">
                           <Zap size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-red-500 transition-colors" />
                           <input 
                             className={`${inputBaseRef} pl-16 py-8 text-[1.2rem]`}
                             value={form.name}
                             onChange={e => update('name', e.target.value)}
                             placeholder="e.g. CORE_TOPPINGS_ALPHA"
                           />
                        </div>
                     </div>

                     <div className="bg-slate-50/80 rounded-[3rem] p-10 border border-slate-100 space-y-10 shadow-inner">
                        <div className="flex items-center justify-between">
                           <div className="space-y-1.5">
                              <h5 className="text-[1.1rem] font-black text-slate-900 tracking-tight">Requirement Protocol</h5>
                              <p className="text-[0.7rem] font-bold text-slate-400 leading-relaxed uppercase tracking-[0.1em]">Enforce selection mandatory attribute for customers</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => update('isCompulsory', !form.isCompulsory)}
                            className={`w-16 h-9 rounded-full relative transition-all shadow-inner border-2 ${form.isCompulsory ? 'bg-red-500 border-red-600 shadow-red-200/50' : 'bg-slate-200 border-slate-300'}`}
                           >
                            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${form.isCompulsory ? 'left-8' : 'left-1'}`} />
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                           <div className="space-y-3">
                              <label className={sectionLabelRef}>Minimum Resolution</label>
                              <div className="relative">
                                 <PlusCircle size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                 <input 
                                   type="number"
                                   className={`${inputBaseRef} pl-14 h-14 !bg-white/50`}
                                   value={form.minSelection}
                                   onChange={e => update('minSelection', Number(e.target.value))}
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className={sectionLabelRef}>Maximum Resolution</label>
                              <div className="relative">
                                 <MoreVertical size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                 <input 
                                   type="number"
                                   className={`${inputBaseRef} pl-14 h-14 !bg-white/50`}
                                   value={form.maxSelection}
                                   onChange={e => update('maxSelection', Number(e.target.value))}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="h-[1px] bg-slate-200" />

                        <div className="flex items-center justify-between">
                           <div className="space-y-1.5">
                              <h5 className="text-[1.1rem] font-black text-slate-900 tracking-tight">Recursive Logic</h5>
                              <p className="text-[0.7rem] font-bold text-slate-400 leading-relaxed uppercase tracking-[0.1em]">Allow multiple units of the same node configuration (x2, x3)</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => update('allowMultipleUnits', !form.allowMultipleUnits)}
                            className={`w-16 h-9 rounded-full relative transition-all shadow-inner border-2 ${form.allowMultipleUnits ? 'bg-emerald-500 border-emerald-600 shadow-emerald-200/50' : 'bg-slate-200 border-slate-300'}`}
                           >
                            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${form.allowMultipleUnits ? 'left-8' : 'left-1'}`} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Node Items Mapping */}
                  <div className="space-y-8">
                     <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                             <Layers size={20} />
                          </div>
                          <h4 className={sectionLabelRef}>Option Nodes Registry</h4>
                        </div>
                        <button 
                          type="button"
                          onClick={addItem}
                          className="px-6 py-3 bg-white hover:bg-slate-900 hover:text-white border-2 border-slate-100 rounded-2xl font-black text-slate-900 text-[0.7rem] uppercase tracking-widest transition-all shadow-sm flex items-center gap-3"
                        >
                           <Plus size={18} strokeWidth={3} />
                           Add Option Node
                        </button>
                     </div>

                     <div className="space-y-4">
                        {form.items.map((it: any, index: number) => (
                          <motion.div 
                            key={it.id} 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="group grid grid-cols-[1fr_140px_130px_60px] gap-6 items-center p-6 bg-white border-2 border-slate-50 hover:border-red-100 rounded-[2.5rem] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/10"
                          >
                             <div className="relative">
                                <Info size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-red-400 transition-colors" />
                                <input 
                                   className="w-full border-2 border-slate-100 bg-slate-50/10 rounded-2xl pl-14 pr-6 h-14 text-[0.95rem] font-black text-slate-900 outline-none focus:bg-white focus:border-red-100 transition-all"
                                   value={it.name}
                                   onChange={e => updateItem(index, 'name', e.target.value)}
                                   placeholder="Identification (e.g. Truffle Glaze)"
                                />
                             </div>
                             <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[0.8rem] font-black text-slate-300">₹</span>
                                <input 
                                  type="number"
                                  className="w-full border-2 border-slate-100 bg-slate-50/10 rounded-2xl pl-12 pr-6 h-14 text-[1rem] font-black text-slate-900 outline-none focus:bg-white focus:border-red-100 transition-all font-mono"
                                  value={it.price}
                                  onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                  placeholder="00.00"
                                />
                             </div>
                             <select 
                               className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl px-4 h-14 text-[0.7rem] font-black uppercase tracking-widest bg-white outline-none cursor-pointer hover:border-red-100 transition-all appearance-none"
                               value={it.foodType}
                               onChange={e => updateItem(index, 'foodType', e.target.value)}
                             >
                               <option value="veg">🌿 VEG</option>
                               <option value="nonveg">🍗 NON-VEG</option>
                             </select>
                             <button type="button" onClick={() => removeItem(index)} className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                                <Trash2 size={24} />
                             </button>
                          </motion.div>
                        ))}
                     </div>
                  </div>

                  {/* Surface Mapping (Items select) */}
                  <div className="space-y-8 pt-12 border-t border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                               <UtensilsCrossed size={20} />
                            </div>
                            <h4 className={sectionLabelRef}>Deployment Surface Mapping</h4>
                         </div>
                         <div className="relative flex-1 max-w-[340px] group">
                            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                              value={itemSearch}
                              onChange={e => setItemSearch(e.target.value)}
                              placeholder="Locate deployment assets..."
                              className="w-full h-12 pl-14 pr-6 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[0.85rem] font-black outline-none focus:border-blue-100 shadow-sm transition-all"
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto no-scrollbar p-2">
                         {filteredItems.map((item: any) => {
                            const category = categories.find((c: any) => c.id === item.categoryId)
                            const isLinked = (form.itemIds || []).includes(item.id)
                            return (
                              <button 
                                key={item.id}
                                type="button"
                                onClick={() => toggleItemLink(item.id)}
                                className={`p-6 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group ${isLinked ? 'border-blue-500 bg-blue-50/50 shadow-xl shadow-blue-500/5' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                              >
                                 <div className="flex flex-col gap-1.5 relative z-10 transition-transform duration-500 group-hover:translate-x-1">
                                    <span className={`text-[0.6rem] font-black uppercase tracking-[0.2em] ${isLinked ? 'text-blue-500' : 'text-slate-300'}`}>
                                       {category?.name || 'Asset Registry'}
                                    </span>
                                    <h6 className={`text-[1rem] font-black leading-tight ${isLinked ? 'text-blue-700' : 'text-slate-900'}`}>
                                       {item.name}
                                    </h6>
                                 </div>
                                 <div className={`absolute top-6 right-6 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${isLinked ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-200 group-hover:bg-slate-200'}`}>
                                    <CheckCircle2 size={16} strokeWidth={3} />
                                 </div>
                                 
                                 {/* Decorative Glow */}
                                 {isLinked && (
                                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                 )}
                              </button>
                            )
                         })}
                         {filteredItems.length === 0 && (
                           <div className="col-span-full py-24 text-center rounded-[3rem] border-4 border-dashed border-slate-50 bg-slate-50/30">
                              <Search size={32} className="mx-auto text-slate-200 mb-3" />
                              <p className="text-[0.7rem] font-black text-slate-300 uppercase tracking-[0.3em]">No matching assets identified</p>
                           </div>
                         )}
                      </div>
                   </div>
               </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER - ACTION HUB */}
        {showForm && (
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-white/80 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-center z-[100] shadow-[0_-24px_48px_rgba(0,0,0,0.05)]">
             <div className="w-full max-w-2xl flex items-center gap-6">
                <button 
                   type="button"
                   onClick={() => setShowForm(false)}
                   className="hidden md:flex px-8 h-16 rounded-[1.5rem] bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[0.75rem] hover:bg-slate-100 transition-all border border-slate-100"
                >
                   Abort
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 group relative h-16 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[1rem] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
                   <div className="flex items-center justify-center gap-3 relative z-10 font-black">
                      <span>FINALIZE ARCHITECTURE</span>
                      <ShieldCheck size={22} className="opacity-50" />
                   </div>
                </button>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
