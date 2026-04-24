import sys

file_path = '/Users/vikas/Desktop/kravy-pos-website/src/app/dashboard/billing/checkout/CheckoutClient.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Updated pattern to ignore trailing whitespace
target_pattern = 'className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800'

new_button = [
    '                                    <button\n',
    '                                      key={idx}\n',
    '                                      onClick={() => addAddonToCart(addon, ag.name)}\n',
    '                                      className="flex items-center bg-[#EEEDFE] dark:bg-indigo-950/40 border-[0.5px] border-[#AFA9EC] dark:border-indigo-800 hover:border-indigo-500 hover:shadow-md hover:scale-[1.02] active:scale-95 rounded-full overflow-hidden shadow-sm transition-all group"\n',
    '                                    >\n',
    '                                       <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-[#AFA9EC]/50 dark:border-indigo-800">\n',
    '                                          <Plus size={10} className="text-indigo-500 group-hover:text-indigo-700" />\n',
    '                                          <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">{addon.name}</span>\n',
    '                                       </div>\n',
    '                                       <div className="bg-[#E5E3FC] dark:bg-indigo-900/60 px-2.5 py-1.5">\n',
    '                                          <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 tracking-tighter">₹{addon.price}</span>\n',
    '                                       </div>\n',
    '                                    </button>\n'
]

modified = False
for i in range(len(lines)):
    if target_pattern in lines[i]:
        # If it's the old style (has rounded-xl in next lines)
        if i + 2 < len(lines) and 'rounded-xl' in lines[i+2]:
            start_idx = i - 3
            end_idx = i + 5
            lines[start_idx:end_idx+1] = new_button
            modified = True
            break # Only one section left to update

if modified:
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully updated the addon section.")
else:
    print("Pattern not found or already updated.")
