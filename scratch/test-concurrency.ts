import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function simulateOrderCompletion(orderId: string, items: any[]) {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            console.log(`[Order ${orderId}] Attempt ${attempts + 1}: Starting transaction...`);
            await prisma.$transaction(async (tx) => {
                const claim = await tx.order.updateMany({
                    where: { id: orderId, inventoryDeducted: false },
                    data: { inventoryDeducted: true }
                });
                
                if (claim.count > 0) {
                    console.log(`[Order ${orderId}] Won claim. Deducting inventory...`);
                    // Simulate fast deduction
                    await new Promise(r => setTimeout(r, 100));
                    console.log(`[Order ${orderId}] Deduction complete.`);
                } else {
                    console.log(`[Order ${orderId}] Lost claim or already deducted. Skipping.`);
                }
            }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 15000 });
            return true;
        } catch (e: any) {
            console.error(`[Order ${orderId}] Transaction failed with code: ${e.code}`);
            if (e.code === 'P2034') { // WriteConflict
                attempts++;
                if (attempts >= maxAttempts) throw e;
                console.log(`[Order ${orderId}] Retrying due to P2034...`);
                await new Promise(r => setTimeout(r, 100 * attempts)); // Exponential backoff
            } else {
                throw e;
            }
        }
    }
}

// In actual tests we would seed DB and run concurrent simulated orders
console.log("Test script compiled successfully. Run this with ts-node when DB is ready.");
