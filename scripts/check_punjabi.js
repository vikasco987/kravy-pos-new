import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '/Users/vikas/.gemini/antigravity-ide/scratch/kravy-pos-website/.env' });

async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    const db = client.db();

    const user = await db.collection('User').findOne({ email: 'punjabichicken@gmail.com' });
    if (!user) {
        console.log("User not found!");
        process.exit(1);
    }

    console.log(`User found: ${user.name}, ClerkID: ${user.clerkId}`);

    const items = await db.collection('Item').find({ clerkId: user.clerkId }).toArray();
    console.log(`Total existing items: ${items.length}`);
    
    // Print a few items to see the current state
    for (let i = 0; i < Math.min(10, items.length); i++) {
        console.log(`- ${items[i].name} | Price: ${items[i].price} | Cat: ${items[i].categoryId}`);
    }

    await client.close();
}

run().catch(console.error);
