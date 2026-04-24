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
    itemIds: initialGroup?.itemIds || [],
    categoryIds: initialGroup?.categoryIds || []
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
        itemIds: initialGroup.itemIds || [],
        categoryIds: initialGroup.categoryIds || []
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
      itemIds: [],
      categoryIds: []
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
      itemIds: group.itemIds || [],
      categoryIds: group.categoryIds || []
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

  function toggleCategoryLink(catId: string) {
    const current = form.categoryIds || []
    if (current.includes(catId)) {
      update('categoryIds', current.filter((id: string) => id !== catId))
    } else {
      update('categoryIds', [...current, catId])
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

  const sectionLabelRef = "text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 pl-1"
  const inputBaseRef = "w-full border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 h-12 text-[0.9rem] font-bold text-slate-950 dark:text-white bg-white dark:bg-slate-900 outline-none focus:border-red-500 focus:shadow-lg focus:shadow-red-500/5 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-white dark:bg-slate-950 w-full max-w-[900px] rounded-3xl max-h-[92vh] overflow-hidden shadow-2xl relative flex flex-col border border-slate-100 dark:border-slate-800"
      >
        {/* MODAL HEADER */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-4">
            {showForm && (
              <button 
                onClick={() => setShowForm(false)} 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all shadow-sm group"
              >
                 <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div className="space-y-0.5">
               <h2 className="text-[1.2rem] font-black text-slate-900 dark:text-white leading-none tracking-tight flex items-center gap-2">
                  {showForm ? (editingGroup ? 'Modify Node' : 'Initialise Group') : 'Ecosystem Nodes'}
                  <Sparkles size={16} className="text-amber-400" />
               </h2>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[0.6rem] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">Ecosystem Configuration Interface</p>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all active:scale-90 border border-slate-100 dark:border-slate-700">
             <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {!showForm ? (
            <div className="p-10 space-y-10">
              {/* PRIMARY ACTION */}
              <button 
                onClick={openCreate}
                className="group relative w-full h-24 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-600 hover:border-red-400 dark:hover:border-red-900 hover:bg-red-50/20 dark:hover:bg-red-900/10 transition-all duration-300 shadow-sm"
              >
                 <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-red-500 group-hover:text-white transition-all flex items-center justify-center mb-1">
                    <Plus size={24} strokeWidth={3} />
                 </div>
                 <span className="font-black text-[0.7rem] tracking-[0.2em] uppercase group-hover:text-red-600 dark:group-hover:text-red-500">Forge New Cluster Node</span>
              </button>

              <div className="space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <LayoutGrid size={14} className="text-slate-300" />
                    <span className={sectionLabelRef}>Active Configurations</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {groups.map((group: any) => (
                      <div key={group.id} className="group flex flex-col border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-5 hover:border-red-100 dark:hover:border-red-900 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                         <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-red-500 dark:group-hover:text-red-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-all">
                               <Layers size={18} />
                            </div>
                            <div className="flex items-center gap-1">
                               <button onClick={() => openEdit(group)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all flex items-center justify-center">
                                  <Edit2 size={14} />
                               </button>
                               <button onClick={() => onDelete(group.id)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                                  <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                         <h5 className="text-[1rem] font-black tracking-tight text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">{group.name}</h5>
                         <div className="flex items-center gap-2 mt-3">
                            <span className="text-[0.6rem] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 uppercase tracking-wider">
                               {group.items?.length || 0} Nodes
                            </span>
                            {group.isCompulsory && (
                               <span className="text-[0.6rem] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/50 uppercase tracking-wider">
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
                     <div className="space-y-2">
                        <label className={sectionLabelRef}>Cluster Node Identifier *</label>
                        <div className="relative group">
                           <Zap size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                           <input 
                             className={`${inputBaseRef} pl-14 h-14 text-[1.1rem]`}
                             value={form.name}
                             onChange={e => update('name', e.target.value)}
                             placeholder="e.g. CORE_TOPPINGS_ALPHA"
                           />
                        </div>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <h5 className="text-[0.9rem] font-black text-slate-900 dark:text-white tracking-tight">Requirement Protocol</h5>
                              <p className="text-[0.6rem] font-bold text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-[0.1em]">Enforce selection mandatory attribute</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => update('isCompulsory', !form.isCompulsory)}
                            className={`w-12 h-7 rounded-full relative transition-all border-2 ${form.isCompulsory ? 'bg-red-500 border-red-600' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                           >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isCompulsory ? 'left-6' : 'left-0.5'}`} />
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className={sectionLabelRef}>Min Selection</label>
                              <div className="relative">
                                 <PlusCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input 
                                   type="number"
                                   className={`${inputBaseRef} pl-12 h-10 !bg-white dark:!bg-slate-900`}
                                   value={form.minSelection}
                                   onChange={e => update('minSelection', Number(e.target.value))}
                                 />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className={sectionLabelRef}>Max Selection</label>
                              <div className="relative">
                                 <MoreVertical size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input 
                                   type="number"
                                   className={`${inputBaseRef} pl-12 h-10 !bg-white dark:!bg-slate-900`}
                                   value={form.maxSelection}
                                   onChange={e => update('maxSelection', Number(e.target.value))}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <h5 className="text-[0.9rem] font-black text-slate-900 dark:text-white tracking-tight">Recursive Logic</h5>
                              <p className="text-[0.6rem] font-bold text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-[0.1em]">Allow multiple units (x2, x3)</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => update('allowMultipleUnits', !form.allowMultipleUnits)}
                            className={`w-12 h-7 rounded-full relative transition-all border-2 ${form.allowMultipleUnits ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                           >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.allowMultipleUnits ? 'left-6' : 'left-0.5'}`} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Node Items Mapping */}
                  <div className="space-y-8">
                     <div className="flex items-center justify-between px-2">
                         <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                             <Layers size={16} />
                          </div>
                          <h4 className={sectionLabelRef}>Option Nodes Registry</h4>
                        </div>
                        <button 
                          type="button"
                          onClick={addItem}
                          className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-slate-900 dark:text-white text-[0.65rem] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                        >
                           <Plus size={14} strokeWidth={3} />
                           Add Option Node
                        </button>
                     </div>

                     <div className="space-y-4">
                        {form.items.map((it: any, index: number) => (
                          <motion.div 
                            key={it.id} 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="group grid grid-cols-[1fr_120px_110px_40px] gap-3 items-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-red-100 dark:hover:border-red-900/50 transition-all"
                          >
                             <div className="relative">
                                <Info size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700" />
                                <input 
                                   className="w-full border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl pl-10 pr-4 h-10 text-[0.85rem] font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-red-100 dark:focus:border-red-900/30 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                   value={it.name}
                                   onChange={e => updateItem(index, 'name', e.target.value)}
                                   placeholder="Identification (e.g. Truffle Glaze)"
                                />
                             </div>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[0.75rem] font-black text-slate-300 dark:text-slate-600">₹</span>
                                <input 
                                  type="number"
                                  className="w-full border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl pl-9 pr-3 h-10 text-[0.85rem] font-black text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                                  value={it.price}
                                  onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                />
                             </div>
                             <select 
                               className="w-full border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl px-3 h-10 text-[0.65rem] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none cursor-pointer transition-all appearance-none"
                               value={it.foodType}
                               onChange={e => updateItem(index, 'foodType', e.target.value)}
                             >
                               <option value="veg" className="dark:bg-slate-900">🌿 VEG</option>
                               <option value="nonveg" className="dark:bg-slate-900">🍗 NON-VEG</option>
                             </select>
                             <button type="button" onClick={() => removeItem(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-rose-500 transition-all">
                                <Trash2 size={16} />
                             </button>
                          </motion.div>
                        ))}
                     </div>
                  </div>

                  {/* Category Mapping (NEW) */}
                  <div className="space-y-8 pt-12 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                               <LayoutGrid size={16} />
                            </div>
                            <h4 className={sectionLabelRef}>Category Deployment</h4>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
                         {categories.map((cat: any) => {
                            const isLinked = (form.categoryIds || []).includes(cat.id)
                            return (
                              <button 
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategoryLink(cat.id)}
                                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${isLinked ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                              >
                                 <div className="flex flex-col gap-0.5 relative z-10">
                                    <h6 className={`text-[0.8rem] font-black leading-tight ${isLinked ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                       {cat.name}
                                    </h6>
                                    <span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                                 </div>
                                 <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isLinked ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700'}`}>
                                    <CheckCircle2 size={12} strokeWidth={3} />
                                 </div>
                              </button>
                            )
                         })}
                      </div>
                  </div>

                   {/* Surface Mapping (Items select) */}
                   <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <UtensilsCrossed size={16} />
                             </div>
                             <h4 className={sectionLabelRef}>Deployment Surface Mapping</h4>
                          </div>
                          <div className="relative flex-1 max-w-[300px] group">
                             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                             <input 
                               value={itemSearch}
                               onChange={e => setItemSearch(e.target.value)}
                               placeholder="Locate deployment assets..."
                               className="w-full h-10 pl-11 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[0.8rem] font-bold outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900 dark:text-white"
                             />
                          </div>
                       </div>
 
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto no-scrollbar p-1">
                          {filteredItems.map((item: any) => {
                             const category = categories.find((c: any) => c.id === item.categoryId)
                             const isLinked = (form.itemIds || []).includes(item.id)
                             return (
                               <button 
                                 key={item.id}
                                 type="button"
                                 onClick={() => toggleItemLink(item.id)}
                                 className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${isLinked ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                               >
                                  <div className="flex flex-col gap-0.5 relative z-10">
                                     <span className={`text-[0.55rem] font-black uppercase tracking-[0.1em] ${isLinked ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'}`}>
                                        {category?.name || 'Asset'}
                                     </span>
                                     <h6 className={`text-[0.85rem] font-black leading-tight ${isLinked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {item.name}
                                     </h6>
                                  </div>
                                  <div className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isLinked ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700'}`}>
                                     <CheckCircle2 size={12} strokeWidth={3} />
                                  </div>
                               </button>
                             )
                          })}
                          {filteredItems.length === 0 && (
                            <div className="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                               <Search size={24} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                               <p className="text-[0.6rem] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">No matching assets identified</p>
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
           <div className="px-8 py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-center z-[100]">
              <div className="w-full max-w-2xl flex items-center gap-4">
                 <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="hidden md:flex px-6 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[0.65rem] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                 >
                    Abort
                 </button>
                 <button 
                   onClick={handleSave}
                   className="flex-1 group relative h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-[0.2em] text-[0.85rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
                    <div className="flex items-center justify-center gap-2 relative z-10 font-black">
                       <span>FINALIZE ARCHITECTURE</span>
                       <ShieldCheck size={18} className="opacity-50" />
                    </div>
                 </button>
              </div>
           </div>
         )}
      </motion.div>
    </div>
  )
}
