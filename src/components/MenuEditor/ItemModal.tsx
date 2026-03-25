'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Tag, Sparkles, Layers, ArrowRight, Check, Trash2, Smartphone, ShieldCheck, Zap, Info, Upload, ChevronDown, Share2, HelpCircle, ChevronRight, ChevronLeft, Save, Redo2, Wand2, Ruler, Weight, ChefHat, Lightbulb, ArrowLeft, PlusCircle, LayoutGrid, Search, CheckCircle2, ImageIcon, Flame, PackageSearch } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function ItemModal({ item, addonGroups = [], onSave, onClose, categories = [] }: any) {
  const [mounted, setMounted] = useState(false)
  const [variantState, setVariantState] = useState<'list' | 'add'>('list')
  const [addonState, setAddonState] = useState<'list' | 'add'>('list')
  const [addonSearch, setAddonSearch] = useState('')
  
  const [form, setForm] = useState({
    name: item?.name || '',
    sellingPrice: item?.sellingPrice || item?.price || '',
    price: item?.price || '',
    description: item?.description || '',
    isVeg: item?.isVeg ?? true,
    isEgg: item?.isEgg ?? false,
    variants: item?.variants ? JSON.parse(JSON.stringify(item.variants)) : [],
    addonGroupIds: item?.addonGroupIds || [],
    imageUrl: item?.imageUrl || item?.image || '',
    categoryId: item?.categoryId || '',
    packagingCharges: item?.packagingCharges || 0,
    gstType: item?.gstType || 'goods',
    taxRate: item?.taxRate || '5.0%',
  })

  const [openSection, setOpenSection] = useState<string | null>('variants')
  
  const [newVariant, setNewVariant] = useState({ 
    groupName: '', 
    required: true, 
    multiSelect: false,
    options: [{ id: '1', name: '', price: '' }] 
  })

  const [newAddonGroup, setNewAddonGroup] = useState({ 
    name: '', 
    isCompulsory: false, 
    allowMultipleUnits: false,
    minSelection: 0, 
    maxSelection: 5,
    addons: [{ id: '1', name: '', price: '', foodType: 'veg', imageUrl: '' }] 
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      setMounted(false)
      document.body.style.overflow = 'unset'
    }
  }, [])

  function update(key: string, val: any) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // LOGIC HELPERS
  const addVariantOption = () => setNewVariant(p => ({ ...p, options: [...p.options, { id: Math.random().toString(), name: '', price: '' }] }))
  const saveVariant = () => { if(!newVariant.groupName) return; update('variants', [...form.variants, { ...newVariant, id: Math.random().toString() }]); setVariantState('list'); setNewVariant({ groupName: '', required: true, multiSelect: false, options: [{ id: '1', name: '', price: '' }] }) }
  const addAddonRow = () => setNewAddonGroup(p => ({ ...p, addons: [...p.addons, { id: Math.random().toString(), name: '', price: '', foodType: 'veg', imageUrl: '' }] }))
  const updateAddonRow = (id: string, k: string, v: any) => setNewAddonGroup(p => ({ ...p, addons: p.addons.map(a => a.id === id ? { ...a, [k]: v } : a) }))
  const saveNewAddonGroup = () => { if(!newAddonGroup.name) return; update('addonGroupIds', [...form.addonGroupIds, Math.random().toString()]); setAddonState('list'); }
  const toggleLink = (id: string) => update('addonGroupIds', form.addonGroupIds.includes(id) ? form.addonGroupIds.filter((i: string) => i !== id) : [...form.addonGroupIds, id])

  function handleSubmit() {
    if (!form.name || !form.sellingPrice) return alert('Name and Price are required')
    onSave({ ...form, price: Number(form.price || form.sellingPrice), sellingPrice: Number(form.sellingPrice) })
  }

  if (!mounted) return null

  const filteredAddons = addonGroups.filter((g: any) => g.name.toLowerCase().includes(addonSearch.toLowerCase()))

  const content = (
    <div className="fixed inset-0 bg-[#f5f5f5] z-[999999999] flex overflow-hidden font-sans no-scrollbar text-[0.82rem]">
      
      {/* 📱 LEFT: GLASS PREVIEW */}
      <div className="hidden lg:flex w-[480px] bg-white/40 backdrop-blur-[60px] border-r border-white/20 flex-col items-center justify-center p-6 sticky top-0 h-screen shrink-0 overflow-hidden shadow-[30px_0_60px_rgba(0,0,0,0.03)] border-l border-white/30">
        <p className="text-[0.65rem] text-gray-400 mb-8 uppercase tracking-[0.4em] font-black opacity-30">Zomato Mirror Preview</p>
        <div className="flex flex-col items-center transform scale-[0.68] origin-center shadow-[0_80px_160px_-40px_rgba(0,0,0,0.4)]">
           <div className="relative w-[340px] h-[700px] bg-[#000] rounded-[4.5rem] p-3 border border-white/10 ring-[8px] ring-gray-900/50">
              <div className="flex justify-center mb-3"><div className="w-24 h-6 bg-black rounded-full shadow-inner" /></div>
              <div className="bg-white rounded-[3.8rem] overflow-hidden min-h-[480px] flex flex-col relative no-scrollbar shadow-inner">
                 <div className="p-5 border-b border-gray-50 bg-white">
                    <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase mb-1">RESTAURANT NAME</p>
                    <div className="flex items-center gap-2"><span className="bg-[#48c479] text-white text-[10px] font-black px-1.5 py-0.5 rounded">4.2 ★</span></div>
                 </div>
                 <div className="p-5 pt-3 flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="bg-gray-100 rounded-[2.5rem] h-[160px] mb-5 border border-gray-50 relative overflow-hidden shadow-inner">
                       {form.imageUrl && <Image src={form.imageUrl} alt="item" fill className="object-cover" />}
                    </div>
                    <div className="flex justify-between items-start gap-3 mb-8">
                       <div className="flex-1 space-y-1">
                          <h3 className="text-[1.1rem] font-black text-gray-900 leading-tight">{form.name || 'Main Course Item'}</h3>
                          <p className="text-[1.1rem] font-black text-[#e23744]">₹{form.sellingPrice || '0'}</p>
                       </div>
                       <button className="bg-white border-2 border-rose-50 text-[#e23744] hover:border-rose-100 rounded-xl px-4 py-2 font-black text-[0.7rem] shadow-sm">ADD</button>
                    </div>
                    <div className="space-y-8">
                       {form.variants.map((v: any) => (
                          <div key={v.id} className="space-y-4">
                             <div className="flex justify-between items-center"><span className="text-[0.85rem] font-black text-gray-900 leading-none">{v.groupName}</span><span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">{v.required ? 'Required' : 'Optional'}</span></div>
                             <div className="space-y-2">
                                {v.options.map((opt: any) => (
                                   <div key={opt.id} className="flex justify-between items-center p-3.5 border border-gray-50 rounded-2xl bg-white/70 shadow-sm">
                                      <div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full border border-gray-200 ${v.multiSelect ? 'rounded-md' : 'rounded-full'}`} /><span className="text-[0.75rem] font-bold text-gray-700">{opt.name || 'Selection'}</span></div>
                                      <span className="text-[0.75rem] font-black text-gray-900">+₹{opt.price || '0'}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 🚀 RIGHT: PROFESSIONAL DASHBOARD (ARRANGED CAREFULLY) */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col items-center selection:bg-blue-100/50">
        
        {/* Sticky Utility Header (64px) */}
        <div className="sticky top-0 z-[100] bg-white border-b border-gray-100 w-full px-8 h-[64px] flex justify-between items-center shadow-sm backdrop-blur-3xl bg-white/95">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shadow-inner"><Flame size={18} className="text-[#e23744] fill-[#e23744]" /></div>
              <h1 className="text-[0.95rem] font-black text-gray-900 tracking-tight m-0">{form.name || 'New Item Detail'}</h1>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-gray-400 px-4 py-2 text-[0.65rem] font-black uppercase tracking-widest hover:text-gray-900 transition-all">Discard</button>
              <button onClick={handleSubmit} className="bg-[#1a6de0] text-white px-8 py-2.5 rounded-xl text-[0.65rem] font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest">Update Item</button>
           </div>
        </div>

        <div className="max-w-[760px] w-full px-12 py-10 space-y-12 pb-40">
           
           {/* SECTION 1: CORE IDENTITY (CLEAN GRID) */}
           <div className="grid grid-cols-12 gap-6 items-end">
              <div className="col-span-12 lg:col-span-8 space-y-2">
                 <label className={labelClass}>Dish Title *</label>
                 <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Kadai Paneer Gravy" className={inputClass} />
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-2">
                 <label className={labelClass}>Sub-Category</label>
                 <div className="relative group">
                    <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} className={`${inputClass} appearance-none pr-8 !h-9 border-gray-100 uppercase text-[0.68rem] font-black tracking-widest`}>
                       <option value="">Map Category</option>
                       {categories.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-blue-600 transition-all pointer-events-none" />
                 </div>
              </div>
           </div>

           {/* SECTION 2: SEGMENT & PRICING (ZOMATO STYLE 4-ROW) */}
           <div className="grid grid-cols-4 gap-4 pb-2">
              <div className="col-span-1 space-y-2">
                 <label className={labelClass}>Base Price</label>
                 <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₹</span>
                    <input type="number" value={form.sellingPrice} onChange={e => update('sellingPrice', e.target.value)} placeholder="0" className={`${inputClass} !h-10 pl-7 border-gray-100 group-hover:border-blue-500 transition-colors`} />
                 </div>
              </div>
              <div className="col-span-3 space-y-2">
                 <label className={labelClass}>Dietary Class (Select Segment)</label>
                 <div className="flex gap-2 h-10">
                    {['veg', 'nonveg', 'egg'].map(t => (
                       <label key={t} className={`flex-1 flex items-center justify-center gap-2 border cursor-pointer rounded-xl transition-all ${((form.isVeg && t === 'veg') || (form.isEgg && t === 'egg') || (!form.isVeg && !form.isEgg && t === 'nonveg')) ? 'border-rose-200 bg-rose-50/20 shadow-sm' : 'border-gray-50 bg-gray-50/50 opacity-50'}`}>
                          <input type="radio" className="hidden" onChange={() => { if(t === 'veg') { update('isVeg', true); update('isEgg', false); } else if(t === 'egg') { update('isVeg', false); update('isEgg', true); } else { update('isVeg', false); update('isEgg', false); } }} />
                          <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${t === 'veg' ? 'border-green-600' : t === 'egg' ? 'border-amber-500' : 'border-red-600'}`}><div className={`w-1.5 h-1.5 rounded-full ${t === 'veg' ? 'bg-green-600' : t === 'egg' ? 'bg-amber-500' : t === 'red' ? 'bg-red-600' : ''}`} style={{ backgroundColor: t === 'veg' ? '#0d9f3f' : t === 'egg' ? '#f59e0b' : '#d9001b' }} /></div>
                          <span className="text-[0.62rem] font-black text-gray-900 uppercase tracking-tighter">{t}</span>
                       </label>
                    ))}
                 </div>
              </div>
           </div>

           {/* SECTION 3: PRICING DRILL-DOWN (4 GATES) */}
           <div className="grid grid-cols-4 gap-4 bg-gray-50/40 p-5 rounded-[2rem] border border-gray-50 shadow-inner">
              {[
                { l: 'Packaging', k: 'packagingCharges' },
                { l: 'GST Model', k: 'gstType', toggle: true },
                { l: 'Tax Rate', k: 'taxRate', select: true }
              ].map((f, i) => (
                <div key={i} className="space-y-1.5">
                   <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest pl-1 opacity-80">{f.l}</label>
                   {f.toggle ? (
                      <div className="flex h-9 border border-gray-100 rounded-lg overflow-hidden font-black text-[0.6rem] bg-white">
                         <button onClick={() => update('gstType', 'goods')} className={`flex-1 ${form.gstType === 'goods' ? 'bg-[#1a6de0] text-white' : 'text-gray-300'}`}>GOODS</button>
                         <button onClick={() => update('gstType', 'services')} className={`flex-1 border-l border-gray-50 ${form.gstType === 'services' ? 'bg-[#1a6de0] text-white' : 'text-gray-300'}`}>SERV</button>
                      </div>
                   ) : f.select ? (
                      <div className="relative group">
                        <select value={form.taxRate} onChange={e => update('taxRate', e.target.value)} className={`${inputClass} !h-9 appearance-none border-gray-100 pr-8 text-[0.75rem]`}>
                           <option>5%</option><option>18%</option><option>0%</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300" />
                      </div>
                   ) : (
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₹</span><input type="number" value={(form as any)[f.k]} onChange={e => update(f.k, e.target.value)} placeholder="0" className={`${inputClass} !h-9 pl-7 border-gray-100 shadow-none`} /></div>
                   )}
                </div>
              ))}
              <div className="space-y-1.5 opacity-30 pointer-events-none">
                 <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest pl-1">Final (A.T.)</label>
                 <div className="h-9 border border-dashed border-gray-100 flex items-center px-3 font-black text-gray-300 text-[0.75rem]">₹ Calc...</div>
              </div>
           </div>

           {/* SECTION 4: CONFIGURATION STACK (VARIANTS & ADDONS) */}
           <div className="space-y-6">
              
              <AccordionItem title="Variant Config (Sizes/Crust)" subtitle="Customize required options for customers." isOpen={openSection === 'variants'} onToggle={() => setOpenSection(openSection === 'variants' ? null : 'variants')}>
                 <AnimatePresence mode="wait">
                    {variantState === 'list' ? (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-1">
                          {form.variants.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 pb-2">
                               {form.variants.map((v: any, idx: number) => (
                                  <div key={v.id} className="p-4 bg-gray-50/50 border border-gray-50 rounded-2xl flex justify-between items-center group shadow-sm transition-all hover:bg-white hover:border-blue-100">
                                     <div>
                                        <p className="text-[0.8rem] font-black text-gray-900 leading-tight mb-1">{v.groupName}</p>
                                        <div className="flex gap-2">
                                           <span className="text-[0.55rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">{v.options.length} Opt</span>
                                           {v.required && <span className="text-[0.55rem] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">Compulsory</span>}
                                        </div>
                                     </div>
                                     <button onClick={() => update('variants', form.variants.filter((_: any, i: number) => i !== idx))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                  </div>
                               ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                             {[
                                { t: 'Size', opts: ['Small', 'Medium', 'Large'], i: <Ruler size={14} /> },
                                { t: 'Spice Level', opts: ['Mild', 'Hot'], i: <Flame size={14} /> },
                                { t: 'Portion', opts: ['Half', 'Full'], i: <PackageSearch size={14} /> }
                             ].map((p, i) => (
                                <button key={i} onClick={() => { setNewVariant({ ...newVariant, groupName: p.t, options: p.opts.map(o => ({ id: Math.random().toString(), name: o, price: '' })) }); setVariantState('add'); }} className="px-4 py-2 border border-gray-100 rounded-full text-[0.68rem] font-black text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-all bg-white shadow-sm flex items-center gap-2">+ {p.t}</button>
                             ))}
                             <button onClick={() => setVariantState('add')} className="px-5 py-2 bg-blue-600 text-white rounded-full text-[0.68rem] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-500/20 ml-auto">+ Custom</button>
                          </div>
                       </motion.div>
                    ) : (
                       <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pt-2 bg-gray-50/50 p-6 rounded-[3rem] border border-white shadow-inner">
                          <div className="grid grid-cols-2 gap-4 items-end">
                             <div className="space-y-1.5"><label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest pl-1">Variant Label *</label><input value={newVariant.groupName} onChange={e => setNewVariant(p => ({ ...p, groupName: e.target.value }))} placeholder="e.g. Set Portion" className={`${inputClass} !h-10 border-white`} /></div>
                             <div className="flex gap-2 justify-end"><button onClick={() => setVariantState('list')} className="text-[0.68rem] font-black text-gray-400 uppercase tracking-widest px-4">Cancel</button><button onClick={saveVariant} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-[0.68rem] font-black uppercase shadow-lg shadow-blue-500/10">Save Group</button></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border-y border-white py-3">
                             <Toggle label="Selection mandatory (customer must choose)" value={newVariant.required} onChange={(v: boolean) => setNewVariant(p => ({ ...p, required: v }))} />
                             <Toggle label="Allow multiple items selection" value={newVariant.multiSelect} onChange={(v: boolean) => setNewVariant(p => ({ ...p, multiSelect: v }))} />
                          </div>
                          <div className="space-y-2.5">
                             {newVariant.options.map((opt, idx) => (
                                <div key={opt.id} className="flex gap-3 items-center">
                                   <input value={opt.name} onChange={e => setNewVariant(p => ({ ...p, options: p.options.map(o => o.id === opt.id ? { ...o, name: e.target.value } : o) }))} placeholder="e.g. Large" className={`${inputClass} !h-9 flex-1 border-white shadow-none`} />
                                   <div className="relative w-28 shrink-0"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₹</span><input type="number" value={opt.price} onChange={e => setNewVariant(p => ({ ...p, options: p.options.map(o => o.id === opt.id ? { ...o, price: e.target.value } : o) }))} placeholder="0" className={`${inputClass} !h-9 pl-7 border-white shadow-none`} /></div>
                                   <button onClick={() => setNewVariant(p => ({ ...p, options: p.options.filter(o => o.id !== opt.id) }))} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                             ))}
                             <button onClick={addVariantOption} className="text-[#1a6de0] text-[0.68rem] font-black uppercase tracking-widest pl-1 mt-2 hover:opacity-70 transition-opacity">+ Append Selection</button>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </AccordionItem>

              <AccordionItem title="Mapping Addons" subtitle="Link global topping or beverage groups." isOpen={openSection === 'addons'} onToggle={() => setOpenSection(openSection === 'addons' ? null : 'addons')}>
                 <div className="space-y-6 pt-2">
                    <div className="relative group">
                       <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                       <input value={addonSearch} onChange={e => setAddonSearch(e.target.value)} placeholder="Link from global addon list..." className={`${inputClass} !h-11 pl-12 border-none bg-gray-50/50 shadow-sm`} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto no-scrollbar py-1">
                       {filteredAddons.map((g: any) => (
                          <div key={g.id} className={`p-4 border rounded-2xl flex items-center justify-between transition-all duration-300 ${form.addonGroupIds.includes(g.id) ? 'border-blue-500 bg-blue-50/20' : 'border-gray-50 bg-white hover:border-gray-100 shadow-sm'}`}>
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.addonGroupIds.includes(g.id) ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-300'}`}><Layers size={18} /></div>
                                <span className={`text-[0.8rem] font-black ${form.addonGroupIds.includes(g.id) ? 'text-blue-600' : 'text-gray-900'}`}>{g.name}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">Sync</span>
                                <button onClick={() => toggleLink(g.id)} className={`w-8 h-4.5 rounded-full relative transition-colors ${form.addonGroupIds.includes(g.id) ? 'bg-green-500 shadow-sm shadow-green-100' : 'bg-gray-200'}`}><span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${form.addonGroupIds.includes(g.id) ? 'left-[16px]' : 'left-0.5'}`} /></button>
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="pt-2 flex justify-between items-center"><button className="text-blue-600 text-[0.7rem] font-black uppercase tracking-[0.2em] border-2 border-dashed border-blue-50 px-6 py-2.5 rounded-2xl hover:bg-blue-50">Create New Addon Group</button><span className="text-[0.6rem] text-gray-300 font-bold uppercase tracking-widest">{form.addonGroupIds.length} Linked</span></div>
                 </div>
              </AccordionItem>

           </div>

           {/* SECTION 5: FINAL ASSETS (DESCRIPTION & IMAGE) */}
           <div className="pt-6 border-t border-gray-100 grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-2">
                 <div className="flex justify-between items-center px-1"><label className={labelClass}>Detailed Description</label><span className="text-[10px] text-gray-300 font-bold">{form.description.length}/500</span></div>
                 <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="A brief about the taste profile, ingredients, and uniqueness..." className={`${inputClass} h-auto py-3 leading-relaxed resize-none shadow-inner`} style={{ borderRadius: '16px' }} />
              </div>
              <div className="col-span-4 space-y-2">
                 <label className={labelClass}>Dish Snapshot</label>
                 <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-gray-100 rounded-[1.5rem] h-[100px] flex items-center justify-center cursor-pointer bg-gray-50/10 hover:border-blue-500 hover:bg-blue-50/20 transition-all relative overflow-hidden">
                    {form.imageUrl ? <Image src={form.imageUrl} alt="dish" fill className="object-cover" /> : <div className="flex flex-col items-center gap-1 opacity-30"><ImageIcon size={22} /><span className="text-[0.55rem] font-black uppercase tracking-widest">Media</span></div>}
                 </div>
                 <input ref={fileInputRef} type="file" className="hidden" />
              </div>
           </div>

           <div className="h-40" />
        </div>
      </div>

    </div>
  )

  return createPortal(content, document.body)
}

function AccordionItem({ title, subtitle, isOpen, onToggle, children }: any) {
   return (
      <div className={`border rounded-[3rem] transition-all duration-500 overflow-hidden ${isOpen ? 'bg-white border-blue-50 shadow-2xl shadow-blue-500/[0.04]' : 'bg-gray-50/20 border-gray-50 opacity-80'}`}>
         <div onClick={onToggle} className="px-10 py-7 flex justify-between items-center cursor-pointer select-none">
            <div className="flex items-center gap-5">
               <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#1a6de0] text-white shadow-xl shadow-blue-500/30 rotate-12' : 'bg-white text-gray-200 border border-gray-50 shadow-sm'}`}>
                  {title.includes('Variant') ? <Smartphone size={22} /> : <Layers size={22} />}
               </div>
               <div>
                  <h3 className={`text-[0.95rem] font-black tracking-tight ${isOpen ? 'text-[#1a6de0]' : 'text-gray-900 opacity-80'}`}>{title}</h3>
                  <p className="text-[0.68rem] text-gray-400 font-bold mt-1 uppercase tracking-widest opacity-60 line-clamp-1">{subtitle}</p>
               </div>
            </div>
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-[#1a6de0] border-[#1a6de0] text-white rotate-45 shadow-lg shadow-blue-500/20' : 'border-gray-50 bg-white text-gray-200 shadow-sm'}`}>
               <Plus size={20} strokeWidth={3} />
            </div>
         </div>
         <AnimatePresence>
            {isOpen && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-10 pb-10">{children}</div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   )
}

function Toggle({ label, value, onChange }: any) {
   return (
      <div className="flex justify-between items-center py-2.5 border-b border-gray-50/50 last:border-none">
         <span className="text-[0.72rem] font-black text-gray-700 uppercase tracking-tighter opacity-80">{label}</span>
         <button onClick={() => onChange(!value)} className={`w-9 h-4.5 rounded-full relative transition-colors ${value ? 'bg-green-500 shadow-sm shadow-green-100' : 'bg-gray-200'}`}><span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${value ? 'left-[18px]' : 'left-0.5'}`} /></button>
      </div>
   )
}

const labelClass = "text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1"
const inputClass = "w-full h-11 border-2 border-gray-50 rounded-2xl px-4 text-[0.82rem] font-black text-gray-900 bg-white outline-none focus:border-[#1a6de0] transition-all placeholder:text-gray-200 shadow-sm"
