const items = [
  { id: "1", name: "Masala Chaap Tikka (Half)", category: { name: "Veg Starters" }, price: 109 },
  { id: "2", name: "Masala Chaap Tikka (Full)", category: { name: "Veg Starters" }, price: 209 },
  { id: "3", name: "Reshmi Chaap Tikka (Full)", category: { name: "Veg Starters" }, price: 229 },
  { id: "4", name: "Malai Chaap Tikka (Half)", category: { name: "Veg Starters" }, price: 119 }
];

const grouped = {};
items.forEach(it => {
    let baseName = it.name;
    const suffixMatch = it.name.match(/\s*\(((?!V\b|NV\b|Egg\b)[^)]+)\)\s*$/i);
    if (suffixMatch) {
        baseName = it.name.substring(0, suffixMatch.index).trim();
    }
    if (!grouped[baseName]) grouped[baseName] = [];
    grouped[baseName].push(it);
});

const finalItems = [];
Object.entries(grouped).forEach(([baseName, group]) => {
    const hasVariant = group.some(i => i.name.trim() !== baseName.trim());
    
    if (group.length === 1 && !hasVariant) {
        finalItems.push(group[0]);
    } else {
        const minPrice = Math.min(...group.map(i => i.price));
        const virtualVariants = [{
            id: 'virtual_group',
            name: 'Size / Portion',
            type: 'radio',
            required: true,
            options: group.map(i => {
                const match = i.name.match(/\(([^)]+)\)\s*$/)?.[1] || i.name;
                let niceName = match.trim();
                return { id: i.id, name: niceName, price: i.price };
            })
        }];
        finalItems.push({
            ...group[0],
            id: "virtual_" + baseName,
            name: baseName,
            price: minPrice,
            isVirtualGroup: true,
            variants: virtualVariants
        });
    }
});
console.log(JSON.stringify(finalItems, null, 2));
