import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as xlsx from "xlsx";

export const maxDuration = 60; // Set Vercel function timeout to 60 seconds for AI processing


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("menuFile") as File;

        if (!file) {
            return NextResponse.json({ error: "No menu file uploaded." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY / GOOGLE_API_KEY is not configured in the server's .env file." }, { status: 500 });
        }

        const fileBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        const mimeType = file.type;
        const fileName = file.name.toLowerCase();
        const base64Data = buffer.toString("base64");

        console.log(`📡 [Menu AI OCR Engine] Processing uploaded file: Name = ${file.name}, Mime = ${mimeType}, Size = ${fileBuffer.byteLength} bytes`);
        let inlineDataPart = null;
        let excelTextPart = null;

        if (mimeType.includes("spreadsheetml") || mimeType.includes("excel") || mimeType.includes("csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
            console.log("📊 Detected Excel/CSV file! Parsing with xlsx package before sending to Gemini...");
            const workbook = xlsx.read(buffer, { type: "buffer" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvData = xlsx.utils.sheet_to_csv(worksheet);
            excelTextPart = { text: "Here is the parsed spreadsheet content in CSV format:\n" + csvData };
        } else if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
            console.log("📝 Detected Word document! Parsing with mammoth before sending to Gemini...");
            try {
                const mammoth = await import("mammoth");
                const docxResult = await mammoth.default.extractRawText({ buffer });
                excelTextPart = { text: "Here is the parsed Word document content:\n" + docxResult.value };
            } catch (e) {
                console.error("Mammoth failed to load or parse:", e);
                excelTextPart = { text: "Failed to parse word document." };
            }
        } else {
            let actualMime = mimeType;
            if (!actualMime || actualMime === "application/octet-stream") {
                if (fileName.endsWith(".pdf")) actualMime = "application/pdf";
                else if (fileName.endsWith(".png")) actualMime = "image/png";
                else if (fileName.endsWith(".webp")) actualMime = "image/webp";
                else actualMime = "image/jpeg";
            }
            inlineDataPart = {
                inlineData: {
                    mimeType: actualMime,
                    data: base64Data
                }
            };
        }

        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest"
        ];

        const languagePref = formData.get("languagePref") as string || "english";
        let languageRule = `5. TRANSLATE & TRANSLITERATE TO ENGLISH: If the menu contains regional script (Devanagari/Hindi/Marathi, etc.), you MUST translate or transliterate it strictly to standard English alphabet characters (e.g. 'Roti', 'Misal Pav', 'Chai'). Do NOT output non-English regional scripts. Every single word in 'restaurantName', 'category', 'name', and 'description' MUST consist strictly of plain English text, numbers, standard spaces, brackets, and punctuation. Do not use special characters or non-English scripts, as thermal printers fail to print them.`;
        if (languagePref === "dual") {
            languageRule = `5. ENGLISH & NATIVE BILINGUAL NAMES: The menu items must be outputted with their English name followed immediately by the native/regional script name (e.g. Hindi, Marathi, Gujarati, Tamil, etc., whichever is present in the document), separated by a single space. DO NOT USE BRACKETS for the native name! Brackets break the thermal printer. Example: 'Masala Sandwich मसाला सैंडविच' or 'Misal Pav मिसळ पाव'. DO NOT output 'Misal Pav (मिसळ पाव)'. Ensure the spelling is accurate in both languages.`;
        } else if (languagePref === "arabic") {
            languageRule = `5. ENGLISH & ARABIAN BILINGUAL NAMES: The menu items must be outputted with their English name followed immediately by the Arabic script name, separated by a single space. DO NOT USE BRACKETS for the Arabic name! Brackets break the thermal printer. Example: 'Chicken Mandi مندي دجاج' or 'Hummus حمص'. DO NOT output 'Hummus (حمص)'. Ensure the spelling is accurate in both languages.`;
        }

        const prompt = `
You are a highly advanced AI system designed to digitize menus and product catalogs from images, PDFs, and parsed spreadsheet data with elite precision.
Your job is to read this document and extract EVERY single item with 100% precision.

CRITICAL INSTRUCTION: First, determine if this document is a FOOD menu (Restaurant/Cafe) OR a RETAIL/GENERAL product catalog (e.g. Hardware, Grocery, Electronics, Clothing).

Also, please search the top/header/footer of the document to extract the business contact details if present:
- Business/Restaurant Name
- Address
- Timings
- Phone number

Please return a structured JSON response matching the following structure:
{
  "restaurantName": "Name of the business (or 'AI Scraped Business' if not found)",
  "address": "Address if found (or 'Delhi NCR' if not found)",
  "timings": "Timings if found (or '11:00 AM - 11:00 PM' if not found)",
  "phone": "Phone number if found (or '9999999999' if not found)",
  "menu": [
    {
      "category": "Logical Category Name (For Food: Dal, Breads, etc. For Retail: Hardware, Construction, Electronics, etc.)",
      "name": "Formatted Item Name. FOR FOOD ONLY: ALWAYS add the (V) or (NV) badge. DO NOT add (V) or (NV) badges for Retail/Hardware/Non-Food items! CRUCIAL RULE: If the item has different sizes (like Regular, Medium, Large, Half, Full), you MUST append the size suffix inside brackets AT THE END OF THE NAME for EVERY size variant! Each size MUST have its own row with its specific price.",
      "price": 250, // Extract the price as a number. Crucial: If one item has multiple sizes/prices, create a SEPARATE row for each size in this list.
      "type": "Pure Veg", // FOR FOOD ONLY: Veg items MUST be 'Pure Veg'. Meat MUST be 'Non-Veg'. Egg items MUST be 'Non-Veg (Egg)'. FOR RETAIL/HARDWARE/NON-FOOD: ALWAYS use 'General'.
      "description": "A unique, 1-line description for this individual row. FOR FOOD: A gourmet description. FOR RETAIL/HARDWARE: A professional product description. Crucial: Every single row must have a completely unique description. No two descriptions must be identical!"
    }
  ]
}

Strictly follow these rules:
1. Return ONLY the raw JSON object inside the JSON block. Do not add any conversational text or explanation.
2. Group items under correct logical categories.
3. Normalize all spelling and format.
4. Ensure the output is valid JSON. VERY IMPORTANT: You MUST properly escape any double quotes inside string values using a backslash (e.g., "description": "A \\"delicious\\" meal") to prevent JSON parsing errors.
${languageRule}
`;

        const searchParams = req.nextUrl.searchParams;
        const parseOnly = searchParams.get("parseOnly") === "true";

        if (parseOnly) {
            const partsArray: any[] = [{ text: prompt }];
            if (excelTextPart) partsArray.push(excelTextPart);
            if (inlineDataPart) partsArray.push(inlineDataPart);
            
            console.log(`⚡ [Menu AI OCR Engine] Fast parsing complete. Returning payload to frontend for client-side processing.`);
            return NextResponse.json({
                success: true,
                partsArray: partsArray
            });
        }

        let textResponse = "";
        let selectedModel = "";
        let lastError: any = null;

        for (const model of modelsToTry) {
            try {
                console.log(`🤖 [Menu AI OCR Engine] Trying model: ${model}...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                const partsArray: any[] = [{ text: prompt }];
                if (excelTextPart) partsArray.push(excelTextPart);
                if (inlineDataPart) partsArray.push(inlineDataPart);

                const response = await axios.post(geminiUrl, {
                    contents: [
                        {
                            parts: partsArray
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textResponse) {
                    selectedModel = model;
                    console.log(`✅ [Menu AI OCR Engine] Successfully retrieved response using model: ${selectedModel}`);
                    break;
                }
            } catch (err: any) {
                const errMsg = err.response?.data?.error?.message || err.message;
                console.warn(`⚠️ [Menu OCR AI Engine] Model ${model} failed: ${errMsg}`);
                lastError = err;
            }
        }

        if (!textResponse) {
            const finalErrorMsg = lastError?.response?.data || lastError?.message || "No response content from any Gemini OCR model.";
            console.error("🚨 [Menu OCR AI Engine] All models failed in fallback chain.");
            throw new Error(`All Gemini OCR models failed or exceeded quota. Last error: ${JSON.stringify(finalErrorMsg)}`);
        }

        // Parse returned JSON from Gemini
        const parsedMenu = JSON.parse(textResponse);
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

        console.log(`✅ [Menu AI OCR Engine] Extracted ${finalMenu.length} items successfully for ${parsedMenu.restaurantName} using model ${selectedModel}!`);
        return NextResponse.json({
            success: true,
            restaurantName: parsedMenu.restaurantName || "AI Scraped Restaurant",
            address: parsedMenu.address || "Delhi NCR",
            timings: parsedMenu.timings || "11:00 AM - 11:00 PM",
            phone: parsedMenu.phone || "9999999999",
            menu: finalMenu
        });

    } catch (e: any) {
        console.error("🚨 [Menu OCR AI Engine] Failed:", e.response?.data || e.message);
        return NextResponse.json({ error: e.message, details: e.response?.data || null }, { status: 500 });
    }
}
