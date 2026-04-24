import sys

file_path = '/Users/vikas/Desktop/kravy-pos-website/src/app/dashboard/billing/checkout/CheckoutClient.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Let's fix the corruption around line 2970 (0-indexed)
# We need to restore the GST map and insert the addon modal correctly.

# 1. Restore the GST map if it was broken
broken_pattern = 'key={val}'
restored = False
for i in range(len(lines)):
    if broken_pattern in lines[i] and 'map' not in lines[i-1] and '2960' < str(i) < '3000':
        lines.insert(i, '                      {[0, 5, 12, 18, 28].map((val) => (\n')
        lines.insert(i+1, '                        <button\n')
        restored = True
        break

# 2. Insert the Addon Modal properly
# Look for the end of quickAddCat modal
end_pattern = 'Cancel'
insert_idx = -1
for i in range(len(lines)):
    if end_pattern in lines[i] and 'setQuickAddCat(null)' in lines[i+1] and i > 2900:
        # We are near the end of the form
        # Find the closing form/div/div/if
        for j in range(i, len(lines)):
            if ')}' in lines[j] and 'QUICK ADD CATEGORY' in lines[j+1]:
                insert_idx = j + 1
                break
        if insert_idx != -1: break

if insert_idx != -1:
    addon_modal = [
        '\n',
        '      {/* ════════════════════════════════════════════\n',
        '          QUICK ADD ADDON MODAL\n',
        '      ════════════════════════════════════════════ */}\n',
        '      {quickAddAddonGroup && (\n',
        '        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">\n',
        '          <motion.div \n',
        '            initial={{ opacity: 0 }}\n',
        '            animate={{ opacity: 1 }}\n',
        '            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"\n',
        '            onClick={() => setQuickAddAddonGroup(null)}\n',
        '          />\n',
        '          <motion.div\n',
        '            initial={{ opacity: 0, scale: 0.95, y: 20 }}\n',
        '            animate={{ opacity: 1, scale: 1, y: 0 }}\n',
        '            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"\n',
        '          >\n',
        '            <div className="p-8">\n',
        '               <div className="flex items-center gap-3 mb-6">\n',
        '                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">\n',
        '                     <Plus size={20} strokeWidth={3} />\n',
        '                  </div>\n',
        '                  <div>\n',
        '                     <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Quick Add Addon</h3>\n',
        '                     <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Adding to {quickAddAddonGroup.name}</p>\n',
        '                  </div>\n',
        '               </div>\n',
        '\n',
        '               <form onSubmit={handleQuickAddAddon} className="space-y-4">\n',
        '                  <div className="space-y-1.5">\n',
        '                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Addon Name</label>\n',
        '                     <input \n',
        '                        autoFocus\n',
        '                        name="name"\n',
        '                        placeholder="e.g. Extra Cheese"\n',
        '                        className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"\n',
        '                     />\n',
        '                  </div>\n',
        '\n',
        '                  <div className="space-y-1.5">\n',
        '                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Price (₹)</label>\n',
        '                     <input \n',
        '                        name="price"\n',
        '                        type="number"\n',
        '                        placeholder="0.00"\n',
        '                        className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-mono"\n',
        '                     />\n',
        '                  </div>\n',
        '\n',
        '                  <div className="grid grid-cols-2 gap-3 pt-4">\n',
        '                     <button \n',
        '                        type="button"\n',
        '                        onClick={() => setQuickAddAddonGroup(null)}\n',
        '                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[0.7rem] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"\n',
        '                     >\n',
        '                        Abort\n',
        '                     </button>\n',
        '                     <button \n',
        '                        type="submit"\n',
        '                        className="h-12 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.15em] text-[0.75rem] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"\n',
        '                     >\n',
        '                        Register Node\n',
        '                     </button>\n',
        '                  </div>\n',
        '               </form>\n',
        '            </div>\n',
        '          </motion.div>\n',
        '        </div>\n',
        '      )}\n'
    ]
    lines[insert_idx:insert_idx] = addon_modal

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Successfully restored GST map and inserted Addon Modal.")
