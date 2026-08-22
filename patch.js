const fs = require('fs');
const file = '/Users/vikas/.gemini/antigravity-ide/scratch/kravy-pos-new/src/app/dashboard/menu/view/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the Zone Selector block
const zoneSelectorStart = content.indexOf('{/* Zone Selector */}');
const zoneSelectorEnd = content.indexOf('              {/* Extracted Items List */}');

if (zoneSelectorStart === -1 || zoneSelectorEnd === -1) {
  console.log("Could not find Zone Selector block");
  process.exit(1);
}

const zoneSelectorBlock = content.substring(zoneSelectorStart, zoneSelectorEnd);

// Remove the `extractedMenuItems.length > 0 && (` wrapper from the block
let cleanedZoneBlock = zoneSelectorBlock
  .replace('{extractedMenuItems.length > 0 && (\\n', '')
  .replace('{extractedMenuItems.length > 0 && (\\r\\n', '')
  .replace('{extractedMenuItems.length > 0 && (', '')
  .replace(/\\n\\s*\\)\\}\\s*$/, '\\n')
  .replace(/\\r\\n\\s*\\)\\}\\s*$/, '\\r\\n');

// We also need to strip the last `)}` manually to be safe
cleanedZoneBlock = cleanedZoneBlock.replace(/\\s*\\)\\}\\s*$/, '\\n\\n');

// Remove original block
content = content.slice(0, zoneSelectorStart) + '              ' + content.slice(zoneSelectorEnd);

// Insert at the top of the modal body
const modalBodyStart = content.indexOf('{/* Modal Body */}');
const insertPos = content.indexOf('<div className="flex-1', modalBodyStart);
const insertPosAfter = content.indexOf('>', insertPos) + 1;

content = content.slice(0, insertPosAfter) + '\n\n              {/* Zone Selector */}\n              <div className="space-y-4 bg-[var(--kravy-surface-hover)] p-6 rounded-[1.5rem] border border-[var(--kravy-border)] shadow-inner">\n                <div className="flex items-center justify-between">\n                  <div>\n                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--kravy-text-primary)]">Assign to Zone</h4>\n                    <p className="text-[10px] text-[var(--kravy-text-muted)] font-bold mt-1">Select a zone where these items will be automatically added.</p>\n                  </div>\n                </div>\n                \n                {isCreatingAiZone ? (\n                  <div className="flex items-center gap-3">\n                    <input \n                      type="text"\n                      autoFocus\n                      placeholder="Enter New Zone Name (e.g. Ground Floor)"\n                      className="flex-1 px-4 py-3 bg-[var(--kravy-surface)] border border-indigo-500 rounded-xl text-sm font-bold text-[var(--kravy-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm"\n                      value={newAiZone}\n                      onChange={(e) => setNewAiZone(e.target.value)}\n                      onKeyDown={async (e) => {\n                        if (e.key === "Enter" && newAiZone.trim()) {\n                          const res = await fetch("/api/profile/zones", { method: "POST", body: JSON.stringify({ action: "add", zoneName: newAiZone }) });\n                          if (res.ok) {\n                              fetch("/api/profile").then(r => r.json()).then(d => setBusiness(d.profile));\n                              setSelectedAiZone(newAiZone.trim().toUpperCase());\n                              setIsCreatingAiZone(false);\n                              setNewAiZone("");\n                              setToast("Zone created and selected!");\n                          }\n                        }\n                      }}\n                    />\n                    <button \n                      onClick={async () => {\n                          if(!newAiZone.trim()) return;\n                          const res = await fetch("/api/profile/zones", { method: "POST", body: JSON.stringify({ action: "add", zoneName: newAiZone }) });\n                          if (res.ok) {\n                              fetch("/api/profile").then(r => r.json()).then(d => setBusiness(d.profile));\n                              setSelectedAiZone(newAiZone.trim().toUpperCase());\n                              setIsCreatingAiZone(false);\n                              setNewAiZone("");\n                              setToast("Zone created and selected!");\n                          }\n                      }}\n                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"\n                    >\n                      Save\n                    </button>\n                    <button \n                      onClick={() => setIsCreatingAiZone(false)}\n                      className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"\n                    >\n                      Cancel\n                    </button>\n                  </div>\n                ) : (\n                  <select\n                    className="w-full px-5 py-3.5 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl text-sm font-bold text-[var(--kravy-text-primary)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer shadow-sm transition-all hover:border-[var(--kravy-text-muted)]"\n                    value={selectedAiZone}\n                    onChange={(e) => {\n                        if (e.target.value === "CREATE_NEW_ZONE") {\n                            setIsCreatingAiZone(true);\n                        } else {\n                            setSelectedAiZone(e.target.value);\n                        }\n                    }}\n                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: \'no-repeat\', backgroundPosition: \'right 1rem center\', backgroundSize: \'1.2em 1.2em\', paddingRight: \'3rem\' }}\n                  >\n                    <option value="">-- Global (Available in all zones) --</option>\n                    {business?.zones?.map((z) => (\n                      <option key={z} value={z}>{z}</option>\n                    ))}\n                    <option value="CREATE_NEW_ZONE" className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">+ Create New Zone</option>\n                  </select>\n                )}\n              </div>\n' + content.slice(insertPosAfter);

fs.writeFileSync(file, content);
console.log("Successfully patched page.tsx");
