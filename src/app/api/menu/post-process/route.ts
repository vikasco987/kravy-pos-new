import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const parsedMenu = await req.json();
        
        let menuItems: any[] = parsedMenu.menu || [];

        // --- Post-Processing: Smart Merge Sizes & Portions ---
        let lastNormalItem: any = null;
        let cleanedMenu: any[] = [];
        const modifierRegex = /^(\d+\/-\s*[a-zA-Z]*|\d+\s*(Pc|pcs|gm|kg).*)$/i;

        for (let i = 0; i < menuItems.length; i++) {
            let item = menuItems[i];
            let name = (item.name || "").trim();

            if (modifierRegex.test(name) && lastNormalItem) {
                let baseName = lastNormalItem.name.replace(/\s*\(Half\)$/, '');

                if (name.toLowerCase().includes('f') || name.includes('/-')) {
                    item.name = `${baseName} (Full)`;
                    if (!lastNormalItem.name.includes('(Half)')) {
                        lastNormalItem.name = `${baseName} (Half)`;
                    }
                } else {
                    item.name = `${baseName} (${name})`;
                }

                if (item.price === lastNormalItem.price && (name.toLowerCase().includes('1 pc') || name.toLowerCase().includes('1pc'))) {
                    continue;
                }
            } else {
                lastNormalItem = item;
            }
            cleanedMenu.push(item);
        }

        // --- Post-Processing: Group & Enforce Portions ---
        const groups: { [key: string]: any[] } = {};
        for (let item of cleanedMenu) {
            let baseName = item.name.split('(')[0].trim();
            if (!groups[baseName]) groups[baseName] = [];
            groups[baseName].push(item);
        }

        let finalMenu: any[] = [];
        for (let baseName in groups) {
            let groupItems = groups[baseName];

            let toRemove = new Set();
            for (let i = 0; i < groupItems.length; i++) {
                for (let j = i + 1; j < groupItems.length; j++) {
                    let item1 = groupItems[i];
                    let item2 = groupItems[j];
                    if (item1.price === item2.price) {
                        if (item1.name.includes('(') && !item2.name.includes('(')) toRemove.add(item2);
                        else if (!item1.name.includes('(') && item2.name.includes('(')) toRemove.add(item1);
                    }
                }
            }

            let activeItems = groupItems.filter((i: any) => !toRemove.has(i));

            if (activeItems.length > 1) {
                let itemsWithoutBrackets = activeItems.filter((i: any) => !i.name.includes('('));

                if (itemsWithoutBrackets.length === 2) {
                    itemsWithoutBrackets.sort((a: any, b: any) => a.price - b.price);
                    itemsWithoutBrackets[0].name = `${itemsWithoutBrackets[0].name} (Half)`;
                    itemsWithoutBrackets[1].name = `${itemsWithoutBrackets[1].name} (Full)`;
                } else if (itemsWithoutBrackets.length === 3) {
                    itemsWithoutBrackets.sort((a: any, b: any) => a.price - b.price);
                    itemsWithoutBrackets[0].name = `${itemsWithoutBrackets[0].name} (Small)`;
                    itemsWithoutBrackets[1].name = `${itemsWithoutBrackets[1].name} (Medium)`;
                    itemsWithoutBrackets[2].name = `${itemsWithoutBrackets[2].name} (Large)`;
                } else {
                    for (let item of itemsWithoutBrackets) {
                        item.name = `${item.name} (Regular)`;
                    }
                }
            }
            finalMenu.push(...activeItems);
        }

        return NextResponse.json({
            success: true,
            restaurantName: parsedMenu.restaurantName || "AI Scraped Restaurant",
            address: parsedMenu.address || "Delhi NCR",
            timings: parsedMenu.timings || "11:00 AM - 11:00 PM",
            phone: parsedMenu.phone || "9999999999",
            menu: finalMenu
        });

    } catch (e: any) {
        console.error("🚨 [Menu Post Process] Failed:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
