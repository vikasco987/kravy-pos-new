import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    const db = client.db();

    const user = await db.collection('User').findOne({ email: 'tanddoridelights@gmail.com' });
    if (!user) {
        console.log("User not found!");
        process.exit(1);
    }

    const items = await db.collection('Item').find({ clerkId: user.clerkId }).toArray();
    
    // Group by base name
    const groups = {};
    for (let item of items) {
        // Strip out (Regular) to find the true base name
        let baseName = item.name.replace(/\s*\(Regular\)$/, '');
        if (!groups[baseName]) groups[baseName] = [];
        groups[baseName].push(item);
    }

    let fixCount = 0;

    for (let baseName in groups) {
        let groupItems = groups[baseName];
        
        let regularItems = groupItems.filter(i => i.name.endsWith('(Regular)'));
        
        if (regularItems.length === 2) {
            // Sort by price (cheaper = Half, expensive = Full)
            regularItems.sort((a, b) => a.price - b.price);
            
            console.log(`Fixing [${baseName}] -> ${regularItems[0].price} (Half) | ${regularItems[1].price} (Full)`);
            
            await db.collection('Item').updateOne({ _id: regularItems[0]._id }, { $set: { name: `${baseName} (Half)` } });
            await db.collection('Item').updateOne({ _id: regularItems[1]._id }, { $set: { name: `${baseName} (Full)` } });
            fixCount += 2;
        } else if (regularItems.length === 3) {
            regularItems.sort((a, b) => a.price - b.price);
            console.log(`Fixing [${baseName}] -> ${regularItems[0].price} (Small) | ${regularItems[1].price} (Medium) | ${regularItems[2].price} (Large)`);
            
            await db.collection('Item').updateOne({ _id: regularItems[0]._id }, { $set: { name: `${baseName} (Small)` } });
            await db.collection('Item').updateOne({ _id: regularItems[1]._id }, { $set: { name: `${baseName} (Medium)` } });
            await db.collection('Item').updateOne({ _id: regularItems[2]._id }, { $set: { name: `${baseName} (Large)` } });
            fixCount += 3;
        }
    }

    console.log(`\n✅ Successfully fixed ${fixCount} duplicate 'Regular' items! No data was deleted.`);
    await client.close();
}

run().catch(console.error);
