import { MongoClient } from "mongodb";

const uri = "mongodb+srv://ajitkushwahacse:ajit12345@kravy.uqv3j.mongodb.net/";
let client = null;

async function runTest(productName) {
  try {
    console.log(`\n=============================\nTesting: ${productName}`);
    
    // 1. Search in DB
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db("foodsnap");
    const imagesCollection = db.collection("images");

    const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dbMatch = await imagesCollection.findOne({
      title: { $regex: new RegExp(`^${escapedName}$`, "i") }
    });

    if (dbMatch && dbMatch.image_url) {
      console.log(`✅ Found in DB: ${dbMatch.image_url}`);
      return;
    }

    const looseMatch = await imagesCollection.findOne({
      title: { $regex: new RegExp(escapedName, "i") }
    });

    if (looseMatch && looseMatch.image_url) {
      console.log(`✅ Found in DB (loose match): ${looseMatch.image_url}`);
      return;
    }

    console.log(`❌ Not found in DB. Falling back to DuckDuckGo Scraper...`);

    // 2. Fallback
    const cleanName = productName.replace(/\(.*\)|\{.*\}|\[.*\]|\d+\s*ml|\d+\s*lit/gi, "").trim();
    const query = `${cleanName} dish food`;
    
    const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res1.text();
    const vqdMatch = html.match(/vqd=([\d-]+)/);
    
    if (!vqdMatch) throw new Error("No VQD token");
    
    const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqdMatch[1]}`;
    const res2 = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const json = await res2.json();
    
    if (json.results && json.results.length > 0) {
      for (const item of json.results) {
        if (item.image && item.image.startsWith("http") && !item.image.includes("data:image")) {
           console.log(`✅ Found via DuckDuckGo: ${item.image}`);
           return;
        }
      }
    }
    console.log(`❌ No image found on DuckDuckGo either.`);
  } catch(e) {
    console.error(e);
  } finally {
    if(client) await client.close();
  }
}

async function main() {
  await runTest("Corn Tikki"); // In DB
  await runTest("Aloo Gobi Special"); // Might be in DB, otherwise DuckDuckGo
  await runTest("Random Futuristic Galaxy Burger 999"); // Definitely DuckDuckGo
}

main();
