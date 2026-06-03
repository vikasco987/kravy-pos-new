const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
// Yahan apni Gemini API Key daalein (Google AI Studio se free mil jayegi)
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
// Jab website live ho (Vercel par), tab localhost hata kar live URL dalna
const WEBSITE_URL = "http://localhost:3000"; 
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true } 
});
const activeSessions = {};
client.on('qr', (qr) => {
    console.log('Kripya apne naye "Kravv Central WhatsApp Number" wale phone se QR Code scan karein:');
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Kravv WhatsApp AI Bot is READY! 🚀');
});
client.on('message', async (msg) => {
    const customerPhone = msg.from;
    const text = msg.body;
    // Koi customer pehli baar link se aayega
    if (text.includes("KravvOrder_ID_")) {
        const companyId = text.split("KravvOrder_ID_")[1].trim();
        activeSessions[customerPhone] = { companyId: companyId, chatHistory: [] };
        
        await msg.reply(`*Kravv AI Assistant* 🤖\nAapka swagat hai! Main is restaurant ka AI assistant hoon. Aapko menu se kya order karna hai?`);
        return;
    }
    if (!activeSessions[customerPhone]) {
        await msg.reply("Order shuru karne ke liye kripya Restaurant ke QR Code ko scan karein ya unka link dabayein.");
        return;
    }
    const session = activeSessions[customerPhone];
    
    try {
        const systemPrompt = `You are a friendly AI waiter for a restaurant. Understand the order.
        If they confirm the final order, reply EXACTLY with this JSON format only: 
        {"status": "ORDER_CONFIRMED", "items": [{"name": "Burger", "qty": 2}], "customerName": "Customer"}
        If not final, just talk naturally in Hindi-English mixed.`;
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: `${systemPrompt}\n\nCustomer says: ${text}`,
        });
        const reply = response.text();
        // Agar order final ho gaya (JSON aaya)
        if (reply.includes("ORDER_CONFIRMED")) {
            const jsonStr = reply.substring(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
            const orderData = JSON.parse(jsonStr);
            // Website backend ko order bhejna
            await axios.post(`${WEBSITE_URL}/api/whatsapp-webhook`, {
                companyId: session.companyId,
                customerPhone: customerPhone.split('@')[0],
                items: orderData.items,
                customerName: orderData.customerName || "WA Customer"
            });
            await msg.reply("✅ Aapka order confirm ho gaya hai aur restaurant ki screen par bhej diya gaya hai! Shukriya.");
            delete activeSessions[customerPhone];
        } else {
            await msg.reply(reply);
        }
    } catch (error) {
        console.error("AI Error:", error);
    }
});
client.initialize();
