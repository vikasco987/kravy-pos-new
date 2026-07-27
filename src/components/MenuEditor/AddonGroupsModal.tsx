'use client'
import { useState, useEffect } from 'react'
import { Plus, X, ArrowLeft, MoreVertical, Trash2, Edit2, Layers, Check, ChevronDown, PlusCircle, Search, UtensilsCrossed, Sparkles, Info, ShieldCheck, LayoutGrid, CheckCircle2 } from 'lucide-react'
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
        items: Array.isArray(initialGroup.items) ? JSON.parse(JSON.stringify(initialGroup.items)) : (typeof initialGroup.items === 'string' ? JSON.parse(initialGroup.items) : []),
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
      items: Array.isArray(group.items) ? JSON.parse(JSON.stringify(group.items)) : (typeof group.items === 'string' ? JSON.parse(group.items) : []),
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
    const currentItems = Array.isArray(form.items) ? form.items : [];
    update('items', [...currentItems, { id: Math.random().toString(36).substr(2, 9), name: '', price: 0, foodType: 'veg', isAvailable: true }])
  }

  function removeItem(index: number) {
    update('items', form.items.filter((_: any, i: number) => i !== index))
  }

  function handleSave() {
    if (!form.name) return alert('Group name is required')
    onSave({ ...form, id: editingGroup?.id })
    setShowForm(false)
  }

  const filteredItems = allItems.filter((i: any) => 
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    categories.find((c: any) => c.id === i.categoryId)?.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const sectionLabelRef = "text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1 mb-2 block"
  const inputBaseRef = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-12 text-[0.9rem] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white dark:bg-slate-950 w-full max-w-[800px] rounded-3xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col border border-slate-200 dark:border-slate-800"
      >
        {/* MODAL HEADER */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            {showForm && (
              <button 
                onClick={() => setShowForm(false)} 
                className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                 <ArrowLeft size={18} />
              </button>
            )}
            <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {showForm ? (editingGroup ? 'Edit Add-on Group' : 'Create New Add-on Group') : 'Manage Add-on Groups'}
                  <Sparkles size={18} className="text-indigo-500" />
               </h2>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                 {showForm ? 'Configure add-on options and linking' : 'Select an add-on group to edit or create a new one.'}
               </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 rounded-xl transition-all">
             <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
          {!showForm ? (
            <div className="p-8 space-y-6">
              {/* PRIMARY ACTION */}
              <button 
                onClick={openCreate}
                className="w-full py-8 bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex flex-col items-center justify-center gap-3 text-indigo-500 dark:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all shadow-sm"
              >
                 <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <Plus size={24} strokeWidth={3} />
                 </div>
                 <span className="font-black text-sm uppercase tracking-widest">Create New Add-on Group</span>
              </button>

              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 pl-1">All Add-on Groups</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {groups.map((group: any) => (
                      <div key={group.id} className="group flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all relative overflow-hidden">
                         <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                               <Layers size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => openEdit(group)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                                  <Edit2 size={14} />
                               </button>
                               <button onClick={() => onDelete(group.id)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-all">
                                  <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                         <h5 className="text-[1.05rem] font-black text-slate-900 dark:text-white mb-2">{group.name}</h5>
                         <div className="flex flex-wrap items-center gap-2 mt-auto">
                            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                               {group.items?.length || 0} Add-ons
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${group.isCompulsory ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/50' : 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800'}`}>
                               {group.isCompulsory ? 'Required' : 'Optional'}
                            </span>
                         </div>
                      </div>
                    ))}
                    {groups.length === 0 && (
                      <div className="col-span-full py-16 text-center">
                         <Layers size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                         <p className="text-sm font-bold text-slate-400">No Add-on Groups found. Create your first one above.</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-8 pb-32 space-y-10">
               <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                     <div>
                        <label className={sectionLabelRef}>Add-on Group Name *</label>
                        <input 
                          className={inputBaseRef}
                          value={form.name}
                          onChange={e => update('name', e.target.value)}
                          placeholder="e.g. Extra Toppings"
                        />
                     </div>

                     <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid gap-6 sm:grid-cols-2">
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                           <div>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white">Required?</h5>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Must customer select an option?</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => update('isCompulsory', !form.isCompulsory)}
                            className={`w-12 h-7 rounded-full relative transition-all border-2 ${form.isCompulsory ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                           >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isCompulsory ? 'left-6' : 'left-0.5'}`} />
                           </button>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                           <div>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white">Multiple Units</h5>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Can they add same item twice?</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => update('allowMultipleUnits', !form.allowMultipleUnits)}
                            className={`w-12 h-7 rounded-full relative transition-all border-2 ${form.allowMultipleUnits ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                           >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.allowMultipleUnits ? 'left-6' : 'left-0.5'}`} />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className={sectionLabelRef}>Min Selection</label>
                           <input 
                             type="number"
                             className={inputBaseRef}
                             value={form.minSelection}
                             onChange={e => update('minSelection', Number(e.target.value))}
                           />
                        </div>
                        <div>
                           <label className={sectionLabelRef}>Max Selection</label>
                           <input 
                             type="number"
                             className={inputBaseRef}
                             value={form.maxSelection}
                             onChange={e => update('maxSelection', Number(e.target.value))}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Add-on Items */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                              <Layers size={16} />
                           </div>
                           <h4 className="text-sm font-black text-slate-900 dark:text-white">Add-on Items</h4>
                        </div>
                        <button 
                          type="button"
                          onClick={addItem}
                          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                           <Plus size={14} strokeWidth={3} />
                           Add Item
                        </button>
                     </div>

                     <div className="space-y-3">
                        {form.items.map((it: any, index: number) => (
                          <div 
                            key={it.id} 
                            className="grid grid-cols-[1fr_120px_110px_40px] gap-3 items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl"
                          >
                             <div className="relative">
                                <input 
                                   className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 h-11 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                   value={it.name}
                                   onChange={e => updateItem(index, 'name', e.target.value)}
                                   placeholder="Item Name (e.g. Extra Cheese)"
                                />
                             </div>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₹</span>
                                <input 
                                  type="number"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 h-11 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                                  value={it.price}
                                  onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                  placeholder="0"
                                />
                             </div>
                             <select 
                               className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 h-11 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none cursor-pointer transition-all"
                               value={it.foodType}
                               onChange={e => updateItem(index, 'foodType', e.target.value)}
                             >
                               <option value="veg">🌿 VEG</option>
                               <option value="nonveg">🍗 NON-VEG</option>
                             </select>
                             <button type="button" onClick={() => removeItem(index)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all">
                                <Trash2 size={16} />
                             </button>
                          </div>
                        ))}
                        {form.items.length === 0 && (
                          <div className="text-center py-6 text-sm font-bold text-slate-400">
                            No add-on items added yet. Click "Add Item" above.
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Linking to Categories */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                           <LayoutGrid size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">Link to Categories</h4>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">Automatically show these add-ons for all items in selected categories.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {categories.map((cat: any) => {
                            const isLinked = (form.categoryIds || []).includes(cat.id)
                            return (
                              <button 
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategoryLink(cat.id)}
                                className={`p-3 rounded-2xl border text-left transition-all relative flex items-center justify-between ${isLinked ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-slate-300'}`}
                              >
                                 <span className={`text-xs font-black ${isLinked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {cat.name}
                                 </span>
                                 <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${isLinked ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                                    <Check size={10} strokeWidth={4} />
                                 </div>
                              </button>
                            )
                         })}
                      </div>
                  </div>

                   {/* Linking to Specific Items */}
                   <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <UtensilsCrossed size={16} />
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">Link to Specific Items</h4>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Attach these add-ons to specific menu items.</p>
                             </div>
                          </div>
                          <div className="relative max-w-[250px] w-full">
                             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input 
                               value={itemSearch}
                               onChange={e => setItemSearch(e.target.value)}
                               placeholder="Search items..."
                               className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                             />
                          </div>
                       </div>
 
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto no-scrollbar">
                          {filteredItems.map((item: any) => {
                             const category = categories.find((c: any) => c.id === item.categoryId)
                             const isLinked = (form.itemIds || []).includes(item.id)
                             return (
                               <button 
                                 key={item.id}
                                 type="button"
                                 onClick={() => toggleItemLink(item.id)}
                                 className={`p-3 rounded-2xl border text-left transition-all relative flex items-center justify-between ${isLinked ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-slate-300'}`}
                               >
                                  <div className="flex flex-col gap-0.5">
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${isLinked ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'}`}>
                                        {category?.name || 'Asset'}
                                     </span>
                                     <h6 className={`text-xs font-black ${isLinked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {item.name}
                                     </h6>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${isLinked ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                                     <Check size={10} strokeWidth={4} />
                                  </div>
                               </button>
                             )
                          })}
                          {filteredItems.length === 0 && (
                            <div className="col-span-full py-8 text-center text-xs font-bold text-slate-400">
                               No matching items found.
                            </div>
                          )}
                       </div>
                    </div>
                </div>
             </div>
           )}
         </div>
 
         {/* MODAL FOOTER */}
         {showForm && (
           <div className="px-8 py-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end z-[100]">
              <div className="flex items-center gap-3">
                 <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 h-12 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleSave}
                   className="px-8 h-12 bg-indigo-600 text-white rounded-xl font-black tracking-wide text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                 >
                    Save Add-on Group
                 </button>
              </div>
           </div>
         )}
      </motion.div>
    </div>
  )
}
