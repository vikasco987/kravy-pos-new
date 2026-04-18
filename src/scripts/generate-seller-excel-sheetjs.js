import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const prisma = new PrismaClient();

async function generateExcel() {
    console.log("📊 Fetching Data for Excel Report...");

    try {
        const sellers = await prisma.user.findMany({
            where: {
                OR: [{ role: "SELLER" }, { role: "USER" }],
            },
            include: {
                profiles: true,
                bills: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        const data = sellers.map((seller, i) => {
            const profile = seller.profiles[0];
            const businessName = profile?.businessName || seller.name || "Unknown Business";
            const totalBills = seller.bills.length;
            const totalRevenue = seller.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
            const lastBillDate = seller.bills.length > 0 ? seller.bills[0].createdAt : null;
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const isActive = lastBillDate && lastBillDate > sevenDaysAgo;

            const diffTime = lastBillDate ? Math.abs(new Date().getTime() - lastBillDate.getTime()) : null;
            const diffDays = diffTime ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : "N/A";

            return {
                "S.No": i + 1,
                "Business Name": businessName,
                "Owner Email": seller.email,
                "Total Bills": totalBills,
                "Revenue (INR)": totalRevenue,
                "Last Active": lastBillDate ? lastBillDate.toLocaleString() : "No bills yet",
                "Days Since Active": diffDays,
                "Status": isActive ? "✅ ACTIVE" : "😴 INACTIVE",
                "Clerk ID": seller.clerkId
            };
        });

        // Add Summary Stats
        const activeCount = data.filter(d => d.Status === "✅ ACTIVE").length;
        const inactiveCount = data.filter(d => d.Status === "😴 INACTIVE").length;

        const ws = XLSX.utils.json_to_sheet(data);
        
        // Define Column Widths
        const wscols = [
            { wch: 5 },  // S.No
            { wch: 35 }, // Business Name
            { wch: 35 }, // Email
            { wch: 15 }, // Bills
            { wch: 20 }, // Revenue
            { wch: 25 }, // Last Active
            { wch: 18 }, // Days Since Active
            { wch: 15 }, // Status
            { wch: 35 }, // Clerk ID
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Merchants");

        const fileName = `Kravy_Merchant_Report.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log(`\n✅ Excel Report Generated Successfully!`);
        console.log(`📍 File Name: ${fileName}`);
        console.log(`📊 Total Records: ${data.length} (${activeCount} Active, ${inactiveCount} Inactive)`);

    } catch (error) {
        console.error("❌ Export Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

generateExcel();
