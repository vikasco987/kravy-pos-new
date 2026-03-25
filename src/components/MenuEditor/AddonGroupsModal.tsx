'use client'
import { useState } from 'react'
import { Plus, X, ArrowLeft, MoreVertical, Trash2, Edit2, Layers, Check, ChevronDown, PlusCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddonGroupsModal({ groups, onSave, onDelete, onClose }: any) {
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    isCompulsory: false,
    minSelection: 0,
    maxSelection: 5,
    allowMultipleUnits: false,
    items: [{ id: Math.random().toString(36).substr(2, 9), name: '', price: 0, foodType: 'veg', isAvailable: true }]
  })

  function openCreate() {
    setEditingGroup(null)
    setForm({
      name: '',
      isCompulsory: false,
      minSelection: 0,
      maxSelection: 5,
      allowMultipleUnits: false,
      items: [{ id: Math.random().toString(36).substr(2, 9), name: '', price: 0, foodType: 'veg', isAvailable: true }]
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
      items: group.items ? JSON.parse(JSON.stringify(group.items)) : []
    })
    setShowForm(true)
  }

  function update(key: string, val: any) {
    setForm(prev => ({ ...prev, [key]: val }))
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
    if (!form.name) return alert('Name is required')
    onSave({ ...form, id: editingGroup?.id })
    setShowForm(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-[800px] rounded-[2.5rem] max-h-[90vh] overflow-hidden shadow-3xl relative flex flex-col"
      >
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-4">
            {showForm && (
              <button 
                onClick={() => setShowForm(false)} 
                className="hover:bg-gray-50 p-2 rounded-xl transition-all border border-gray-100/50"
              >
                 <ArrowLeft size={24} />
              </button>
            )}
            <div className="space-y-1">
               <h2 className="text-[1.2rem] font-black text-gray-900 leading-tight tracking-tight">
                  {showForm ? (editingGroup ? 'Modify Group' : 'Create Add-on Group') : 'Manage Add-on Clusters'}
               </h2>
               <p className="text-[0.68rem] font-bold text-gray-400 tracking-widest uppercase">Global customization library</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-50 border border-gray-100 p-2 rounded-xl transition-all active:scale-90">
             <X size={20} />
          </button>
        </div>

        {!showForm ? (
          <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">
            <button 
              onClick={openCreate}
              className="w-full h-24 border-2 border-dashed border-red-200 rounded-[2rem] flex flex-col items-center justify-center gap-1.5 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all font-black text-[1rem] tracking-widest uppercase shadow-sm"
            >
               <Plus size={28} strokeWidth={3} />
               <span>Fresh Cluster Setup</span>
            </button>

            <div className="grid grid-cols-1 gap-4">
              {groups.map((group: any) => (
                <div key={group.id} className="border-2 border-gray-50 bg-white rounded-[2rem] p-6 flex items-center justify-between hover:border-red-100 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-red-300 group-hover:bg-red-50/50 transition-all">
                         <Layers size={24} />
                      </div>
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <h5 className="text-[1.05rem] font-black tracking-tight">{group.name}</h5>
                            <span className="text-[0.65rem] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50 tracking-[.15em] uppercase">
                               {(group.items as any[])?.length || 0} Options
                            </span>
                         </div>
                         <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            {group.isCompulsory ? <span className="text-amber-600 flex items-center gap-1"><Check size={12} /> Compulsory</span> : <span className="opacity-50">Optional Selection</span>}
                            <span>•</span>
                            <span>Min: {group.minSelection} / Max: {group.maxSelection}</span>
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(group)} className="p-3.5 rounded-2xl bg-gray-50 text-gray-600 hover:bg-white hover:shadow-md transition-all active:scale-90">
                         <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDelete(group.id)} className="p-3.5 rounded-2xl border border-red-50/50 text-red-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="py-20 text-center opacity-30 italic font-medium">
                   "Your addon library is empty. Let's create something delicious!"
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 overflow-y-auto no-scrollbar flex-1 pb-32">
             <div className="space-y-10">
                {/* Basic Group Info */}
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-3">
                      <label className="text-[0.7rem] font-black uppercase tracking-widest text-gray-400 px-1">Cluster Name *</label>
                      <input 
                        className="w-full border-2 border-gray-100/50 bg-gray-50/30 rounded-2xl px-5 h-14 text-[1.1rem] font-black focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        placeholder="e.g. Choose Your Toppings"
                      />
                   </div>

                   <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 shadow-inner space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h5 className="text-[1rem] font-black text-gray-800 tracking-tight">Compulsory Selection</h5>
                            <p className="text-[0.75rem] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">Force users to select at least one option</p>
                         </div>
                         <button 
                          onClick={() => update('isCompulsory', !form.isCompulsory)}
                          className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${form.isCompulsory ? 'bg-red-500 shadow-red-700/20' : 'bg-gray-200'}`}
                         >
                          <span className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${form.isCompulsory ? 'left-8' : 'left-1'}`} />
                         </button>
                      </div>

                      <div className="grid grid-cols-2 gap-10">
                         <div className="space-y-2">
                            <label className="text-[0.7rem] font-black uppercase tracking-widest text-gray-400 px-1">Min Selection</label>
                            <input 
                              type="number"
                              className="w-full border-2 border-gray-100/50 bg-white rounded-xl px-4 h-11 text-[1rem] font-black italic focus:outline-none"
                              value={form.minSelection}
                              onChange={e => update('minSelection', Number(e.target.value))}
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[0.7rem] font-black uppercase tracking-widest text-gray-400 px-1">Max Selection</label>
                            <input 
                              type="number"
                              className="w-full border-2 border-gray-100/50 bg-white rounded-xl px-4 h-11 text-[1rem] font-black italic focus:outline-none"
                              value={form.maxSelection}
                              onChange={e => update('maxSelection', Number(e.target.value))}
                            />
                         </div>
                      </div>

                      <div className="h-[1.5px] bg-gray-200/50" />

                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h5 className="text-[1rem] font-black text-gray-800 tracking-tight">Allow Multi-Units</h5>
                            <p className="text-[0.75rem] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">Customers can pick 'Extra Cheese' x 2 etc.</p>
                         </div>
                         <button 
                          onClick={() => update('allowMultipleUnits', !form.allowMultipleUnits)}
                          className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${form.allowMultipleUnits ? 'bg-emerald-500 shadow-emerald-700/20' : 'bg-gray-200'}`}
                         >
                          <span className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${form.allowMultipleUnits ? 'left-8' : 'left-1'}`} />
                         </button>
                      </div>
                   </div>
                </div>

                {/* Options List */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                           <Layers size={16} />
                        </div>
                        <h4 className="text-[0.8rem] font-black uppercase tracking-[0.2em] text-gray-500">Available Choices</h4>
                      </div>
                      <button 
                        onClick={addItem}
                        className="text-[0.7rem] px-5 py-2.5 bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-xl font-black text-emerald-600 uppercase tracking-widest transition-all"
                      >
                         + Insert Option
                      </button>
                   </div>

                   <div className="space-y-3">
                      {form.items.map((it: any, index: number) => (
                        <div key={it.id} className="grid grid-cols-[1fr_120px_100px_40px] gap-4 items-center animate-in slide-in-from-left-2 transition-all p-4 bg-gray-50/30 border border-gray-100 rounded-2xl">
                           <input 
                              className="w-full border-2 border-gray-100 rounded-xl px-4 h-11 text-[0.9rem] font-bold focus:outline-none bg-white transition-all focus:border-red-500"
                              value={it.name}
                              onChange={e => updateItem(index, 'name', e.target.value)}
                              placeholder="Name (e.g. Cheese Slice)"
                           />
                           <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[0.7rem] font-black text-gray-400">₹</span>
                              <input 
                                type="number"
                                className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 h-11 text-[1rem] font-black italic focus:outline-none bg-white transition-all focus:border-red-500"
                                value={it.price}
                                onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                placeholder="0"
                              />
                           </div>
                           <select 
                             className="w-full border-2 border-gray-100 rounded-xl px-2 h-11 text-[0.7rem] font-black uppercase tracking-tighter bg-white focus:outline-none"
                             value={it.foodType}
                             onChange={e => updateItem(index, 'foodType', e.target.value)}
                           >
                             <option value="veg">Veg</option>
                             <option value="nonveg">Nonveg</option>
                           </select>
                           <button onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-500 transition-colors self-center p-2">
                              <Trash2 size={20} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="absolute bottom-0 left-0 right-0 p-8 bg-white border-t border-gray-50 flex items-center justify-center z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
                <button 
                  onClick={handleSave}
                  className="w-full max-w-[600px] bg-[#E23744] text-white py-4.5 h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[1.1rem] shadow-2xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   <span>Finalize Cluster</span>
                   <Layers size={22} className="opacity-50" />
                </button>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
