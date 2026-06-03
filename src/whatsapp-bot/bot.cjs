const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
// Aapki daali hui Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_KEY_HERE";
const WEBSITE_URL = "https://billing.kravy.in"; // Aapki Live API ka URL
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true } 
});
const activeSessions = {};
client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE NOW:');
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('✅✅ KRAVV BOT BILKUL READY HAI! ✅✅');
});
// Naya message aane par tracker
client.on('message', async (msg) => {
    const customerPhone = msg.from;
    const text = msg.body;
    
    console.log("👉 EK NAYA MESSAGE AAYA!");
    console.log("👉 Bhejne wala: ", customerPhone);
    console.log("👉 Message Text: ", text);
    if (text.includes("KravvOrder_ID_")) {
        console.log("✅ Order Link detect ho gaya, reply bhej rahe hain...");
        const companyId = text.split("KravvOrder_ID_")[1].trim();
        activeSessions[customerPhone] = { companyId: companyId, chatHistory: [] };
        
        try {
             await msg.reply(`*Kravv AI Assistant* 🤖\nAapka swagat hai! Main is restaurant ka AI assistant hoon. Aapko menu se kya order karna hai? (Jaise: 2 Burger)`);
             console.log("✅ Reply chala gaya!");
        } catch(err) {
             console.log("❌ Reply bhejne mein ERROR:", err.message);
        }
        return;
    }
    if (!activeSessions[customerPhone]) {
        console.log("⚠️ Normal message aaya (bina link ke), reply bheja.");
        await msg.reply("Order shuru karne ke liye kripya Restaurant ke QR Code ko scan karein ya unka link dabayein.");
        return;
    }
    console.log("🧠 AI se answer maang rahe hain...");
    const session = activeSessions[customerPhone];
    
    try {
        const systemPrompt = `You are a friendly AI waiter for a restaurant. 
        If they confirm the final order, reply EXACTLY with this JSON format only: 
        {"status": "ORDER_CONFIRMED", "items": [{"name": "Burger", "qty": 2}], "customerName": "Customer"}
        If not final, just talk naturally in Hindi-English mixed.`;
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: `${systemPrompt}\n\nCustomer says: ${text}`,
        });
        const reply = response.text();
        console.log("✅ AI ne jawab diya: ", reply);
        if (reply.includes("ORDER_CONFIRMED")) {
            const jsonStr = reply.substring(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
            const orderData = JSON.parse(jsonStr);
            console.log("🌐 Website API ko Order bhej rahe hain...");
            await axios.post(`${WEBSITE_URL}/api/whatsapp-webhook`, {
                companyId: session.companyId,
                customerPhone: customerPhone.split('@')[0],
                items: orderData.items,
                customerName: orderData.customerName || "WA Customer"
            });
            console.log("✅ Website par Order pahunch gaya!");
            await msg.reply("✅ Aapka order confirm ho gaya hai aur restaurant ki screen par bhej diya gaya hai! Shukriya.");
            delete activeSessions[customerPhone];
        } else {
            await msg.reply(reply);
        }
    } catch (error) {
        console.error("❌ AI Error:", error.message);
    }
});
client.initialize();
