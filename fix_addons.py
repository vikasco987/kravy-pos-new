import re

with open("src/app/dashboard/billing/checkout/CheckoutClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. addToCart: Detect addons and open modal
content = content.replace('''    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      // Normalize variants if they are in the old/app format
      const isAppFormat = item.variants.some((v: any) => !v.options);
      
      let normalizedVariants = item.variants;
      
      if (isAppFormat) {
        normalizedVariants = [
          {
            id: 'legacy_app_group',
            groupName: 'Options',
            type: 'radio',
            required: false,
            options: item.variants.map((v: any, i: number) => ({
              id: v.id || `opt_${i}`,
              name: v.name || v.groupName || `Option ${i+1}`,
              price: v.price || 0
            }))
          }
        ];
      }

      setVariantModalItem({ ...item, variants: normalizedVariants });
      setSelectedVariants({});
      return;
    }''', '''    const itemAddons = addonGroups.filter(ag => (ag.itemIds || []).includes(item.id));
    const hasVariants = item.variants && Array.isArray(item.variants) && item.variants.length > 0;
    const hasAddons = itemAddons.length > 0;

    if (hasVariants || hasAddons) {
      // Normalize variants if they are in the old/app format
      let normalizedVariants = item.variants || [];
      if (hasVariants) {
        const isAppFormat = normalizedVariants.some((v: any) => !v.options);
        if (isAppFormat) {
          normalizedVariants = [
            {
              id: 'legacy_app_group',
              groupName: 'Options',
              type: 'radio',
              required: false,
              options: normalizedVariants.map((v: any, i: number) => ({
                id: v.id || `opt_${i}`,
                name: v.name || v.groupName || `Option ${i+1}`,
                price: v.price || 0
              }))
            }
          ];
        }
      }

      setVariantModalItem({ ...item, variants: normalizedVariants, addons: itemAddons } as any);
      setSelectedVariants({});
      return;
    }''')


# 2. confirmVariantAddToCart: Validation and calculation
content = content.replace('''    // calculate additional price and form the variant string
    let additionalPrice = 0;
    let variantDescParts: string[] = [];
    let selectedOptObj: any = null;

    Object.values(selectedVariants).forEach(opts => {
        opts.forEach(opt => {
            additionalPrice += Number(opt.price || 0);
            variantDescParts.push(opt.name);
            selectedOptObj = opt;
        });
    });

    const isVirtual = (variantModalItem as any).isVirtualGroup;
    let itemToAddId = `${variantModalItem.id}-${variantDescParts.sort().join("-")}`;
    let itemToAddName = variantModalItem.name + (variantDescParts.length > 0 ? ` (${variantDescParts.join(", ")})` : "");
    let itemRate = additionalPrice > 0 ? additionalPrice : (variantModalItem.price || 0);''', '''    // validate addons
    const addonsList = (variantModalItem as any).addons || [];
    for (const ag of addonsList) {
        const minSel = ag.minSelections || (ag.isCompulsory ? 1 : 0);
        if (minSel > 0) {
            const sel = selectedVariants[`ag_${ag.id}`] || [];
            if (sel.length < minSel) {
                toast.error(`Please select at least ${minSel} option(s) for ${ag.name}`);
                return;
            }
        }
    }

    // calculate additional price and form the variant string
    let additionalPrice = 0;
    let addonsPrice = 0;
    let variantDescParts: string[] = [];
    let selectedOptObj: any = null;

    Object.entries(selectedVariants).forEach(([key, opts]) => {
        opts.forEach(opt => {
            if (key.startsWith('ag_')) {
                addonsPrice += Number(opt.price || 0);
            } else {
                additionalPrice += Number(opt.price || 0);
                selectedOptObj = opt;
            }
            variantDescParts.push(opt.name);
        });
    });

    const isVirtual = (variantModalItem as any).isVirtualGroup;
    let itemToAddId = `${variantModalItem.id}-${variantDescParts.sort().join("-")}`;
    let itemToAddName = variantModalItem.name + (variantDescParts.length > 0 ? ` (${variantDescParts.join(", ")})` : "");
    let itemRate = (additionalPrice > 0 ? additionalPrice : (variantModalItem.price || 0)) + addonsPrice;''')


# 3. Modal Addons
modal_addon_code = '''                  </div>
                )})}

                {/* Addons List */}
                {((variantModalItem as any).addons || []).map((ag: any, agIndex: number) => {
                  const vgId = `ag_${ag.id}`;
                  const isCompulsory = ag.minSelections > 0 || ag.isCompulsory;
                  return (
                  <div key={vgId} className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em]">{ag.name || "Addons"}</h4>
                      {isCompulsory && <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-100 dark:bg-rose-500/20 px-2.5 py-1 rounded-full">Required (Min {ag.minSelections || 1})</span>}
                    </div>
                    
                    <div className="space-y-4">
                      {ag.items?.map((opt: any, optIndex: number) => {
                        const optId = opt.id || opt.name || `opt_${optIndex}`;
                        const isSelected = selectedVariants[vgId]?.some(s => (s.id || s.name) === optId);
                        const optPrice = Number(opt.price || 0);
                        
                        return (
                          <label key={optId} className="flex items-center gap-4 cursor-pointer group select-none">
                            <div className={`flex items-center justify-center transition-all w-[22px] h-[22px] rounded-lg border-[2.5px] ${
                              isSelected 
                                ? 'bg-white dark:bg-indigo-600 border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.15)]' 
                                : 'bg-transparent border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                            }`}>
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              )}
                            </div>
                            
                            <input 
                              type="checkbox"
                              name={`addon_${vgId}`}
                              className="hidden"
                              checked={isSelected || false}
                              onChange={() => {
                                kravy.toggle();
                                setSelectedVariants(prev => {
                                  const currentSel = prev[vgId] || [];
                                  if (isSelected) {
                                    return { ...prev, [vgId]: currentSel.filter(s => (s.id || s.name) !== optId) };
                                  } else {
                                    if (ag.maxSelections && currentSel.length >= ag.maxSelections) {
                                      toast.error(`Max ${ag.maxSelections} selections allowed`);
                                      return prev;
                                    }
                                    return { ...prev, [vgId]: [...currentSel, { ...opt, id: optId }] };
                                  }
                                });
                              }}
                            />
                            
                            <div className="flex-1 flex justify-between items-center pt-0.5">
                              <span className={`text-[15px] font-[700] transition-all capitalize tracking-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {opt.name}
                              </span>
                              {optPrice > 0 && (
                                <span className={`text-[13px] font-black tracking-wide ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}>
                                  +₹{optPrice}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )})}
              </div>'''

content = content.replace('''                  </div>
                )})}
              </div>''', modal_addon_code)

# 4. Modal Total Price
content = content.replace('''                  <span className="text-lg">₹{
                    Object.values(selectedVariants).reduce((acc: number, opts: any[]) => acc + opts.reduce((a, b) => a + Number(b.price || 0), 0), 0) > 0 ? Object.values(selectedVariants).reduce((acc: number, opts: any[]) => acc + opts.reduce((a, b) => a + Number(b.price || 0), 0), 0) : (variantModalItem.price || 0)
                  }</span>''', '''                  <span className="text-lg">₹{
                    (() => {
                      let basePrice = variantModalItem.price || 0;
                      let varPrice = 0;
                      let addPrice = 0;
                      Object.entries(selectedVariants).forEach(([k, opts]) => {
                        opts.forEach((o: any) => {
                          if (k.startsWith('ag_')) addPrice += Number(o.price || 0);
                          else varPrice += Number(o.price || 0);
                        });
                      });
                      let finalBase = varPrice > 0 ? varPrice : basePrice;
                      if ((variantModalItem as any).isVirtualGroup && varPrice > 0) finalBase = varPrice;
                      return finalBase + addPrice;
                    })()
                  }</span>''')

with open("src/app/dashboard/billing/checkout/CheckoutClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
