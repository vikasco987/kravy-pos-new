'use client'
import { useState, useEffect } from 'react'
import CategorySidebar from './CategorySidebar'
import ItemsList from './ItemsList'
import ItemModal from './ItemModal'
import AddonGroupsModal from './AddonGroupsModal'
import { toast } from 'react-hot-toast'
import { Layers, Cloud, Zap, ShieldCheck, Globe, Star, Sparkles, LayoutDashboard } from 'lucide-react'

export default function MenuEditor({ clerkId }: { clerkId: string }) {
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [addonGroups, setAddonGroups] = useState<any[]>([])
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showAddonModal, setShowAddonModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (showItemModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showItemModal])

  useEffect(() => {
    fetchAll()
  }, [clerkId])

  async function fetchAll() {
    setLoading(true)
    try {
      const [catRes, itemRes, addonRes] = await Promise.all([
        fetch(`/api/categories`),
        fetch(`/api/items`),
        fetch(`/api/menu-editor/addon-groups`)
      ])
      const cats = await catRes.json()
      const itms = await itemRes.json()
      const adds = await addonRes.json()
      
      setCategories(cats)
      setItems(itms)
      setAddonGroups(adds)
      
      if (cats.length > 0 && !activeCatId) {
        setActiveCatId(cats[0].id)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load menu data")
    } finally {
      setLoading(false)
    }
  }

  function openAddItem() {
    setEditingItem(null)
    setShowItemModal(true)
  }

  function openEditItem(item: any) {
    setEditingItem(item)
    setShowItemModal(true)
  }

  async function handleSaveItem(data: any) {
    const payload = { 
      ...data, 
      categoryId: activeCatId,
      id: editingItem?.id 
    }
    
    const res = await fetch(`/api/items`, {
      method: editingItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      toast.success(editingItem ? "Item updated" : "Item added")
      setShowItemModal(false)
      fetchAll()
    } else {
      toast.error("Failed to save item")
    }
  }

  async function handleToggleItem(itemId: string, available: boolean) {
    const res = await fetch(`/api/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, isActive: available })
    })
    if (res.ok) {
       setItems(prev => prev.map(i => i.id === itemId ? { ...i, isActive: available } : i))
    }
  }

  async function handleSaveAddonGroup(data: any) {
    const method = data.id ? 'PUT' : 'POST'
    const res = await fetch(`/api/menu-editor/addon-groups`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) {
      toast.success("Add-on group saved")
      fetchAll()
    } else {
      toast.error("Failed to save add-on group")
    }
  }

  async function handleDeleteAddonGroup(id: string) {
    if (!confirm("Are you sure?")) return
    const res = await fetch(`/api/menu-editor/addon-groups?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success("Group deleted")
      fetchAll()
    }
  }

  const filteredItems = items.filter(i => (i.category?.id || i.categoryId) === activeCatId)

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-40 space-y-4">
      <div className="w-12 h-12 border-[6px] border-[#EB0029]/10 border-t-[#EB0029] rounded-full animate-spin"></div>
      <p className="text-[0.65rem] font-black text-gray-300 uppercase tracking-[0.3em]">Refreshing Architect...</p>
    </div>
  )

  return (
    <div className="w-full flex flex-col h-[calc(100vh-280px)] font-sans bg-transparent">
      
      {/* 🚀 REMOVED INTERNAL HEADER TO FIX DOUBLE HEADING ISSUE */}

      {/* 🛠️ INDEPENDENTLY SCROLLABLE WORKSPACE */}
      <div className="flex flex-1 border border-gray-100/50 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-[#FBFBFB] dark:bg-slate-900 shadow-2xl relative shadow-gray-200/50 dark:shadow-none transition-colors">
        
        {/* LEFT: FIXED SCROLLABLE SIDEBAR */}
        <div className="w-[300px] h-full bg-white dark:bg-slate-900 border-r border-gray-50 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden transition-colors">
            <CategorySidebar
              categories={categories}
              activeCatId={activeCatId}
              onSelect={setActiveCatId}
              onAddOns={() => setShowAddonModal(true)}
            />
        </div>
        
        {/* RIGHT: FIXED SCROLLABLE ITEMS LIST */}
        <div className="flex-1 h-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-colors">
            <ItemsList
              items={filteredItems}
              activeCatId={activeCatId}
              categories={categories}
              onAddItem={openAddItem}
              onEditItem={openEditItem}
              onToggleItem={handleToggleItem}
            />
        </div>
        
        {showItemModal && (
          <ItemModal
            item={editingItem}
            addonGroups={addonGroups}
            categories={categories}
            onSave={handleSaveItem}
            onClose={() => setShowItemModal(false)}
          />
        )}
        
        {showAddonModal && (
          <AddonGroupsModal
            groups={addonGroups}
            onSave={handleSaveAddonGroup}
            onDelete={handleDeleteAddonGroup}
            onClose={() => setShowAddonModal(false)}
          />
        )}
      </div>
    </div>
  )
}
