import MenuEditor from '@/components/MenuEditor'
import { getEffectiveClerkId } from '@/lib/auth-utils' // Need to check if this exists or use a similar helper
import { auth } from '@clerk/nextjs/server'
import { Toaster } from 'react-hot-toast'

export default async function MenuEditorPage() {
  const clerkId = await getEffectiveClerkId();
  
  if (!clerkId) {
    return <div>Unauthorized</div>
  }

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen">
      <Toaster position="top-right" />
      
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                 Menu <span className="text-red-600">Architect</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[0.7rem]">
                 Build world-class dining experiences with Zomato-inspired controls
              </p>
           </div>
           
           <div className="flex items-center gap-3 bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[0.75rem] font-black uppercase tracking-widest border border-emerald-100">
                 System Live
              </div>
              <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[0.75rem] font-black uppercase tracking-widest border border-indigo-100">
                 Cloud Sync
              </div>
           </div>
        </div>

        <MenuEditor clerkId={clerkId} />
      </div>
    </div>
  )
}
