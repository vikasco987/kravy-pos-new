import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import UnpaidDuesClient from "./UnpaidDuesClient";

export const revalidate = 0;

export default async function UnpaidDuesReportPage() {
  const effectiveId = await getEffectiveClerkId();
  if (!effectiveId) redirect("/sign-in");

  // Fetch all active unpaid/pending bills
  const unpaidBills = await prisma.billManager.findMany({
    where: {
      clerkUserId: effectiveId,
      isDeleted: false,
      paymentStatus: { notIn: ["PAID", "Paid", "CANCELLED", "Cancelled"] },
    },
    select: {
      id: true,
      billNumber: true,
      customerName: true,
      customerPhone: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
      paymentStatus: true,
      paymentMode: true,
      createdAt: true,
      tableName: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch profile for business name
  const profile = await prisma.businessProfile.findFirst({
    where: { userId: effectiveId },
    orderBy: { createdAt: 'asc' }
  });
  const businessName = profile?.businessName || "Your Restaurant";

  // Group by customer
  const customerUnpaidMap = new Map<string, {
    customerName: string;
    customerPhone: string;
    totalUnpaid: number;
    billsCount: number;
    lastBillDate: Date;
    bills: Array<{
      id: string;
      billNumber: string;
      total: number;
      amountPaid: number;
      balanceDue: number;
      paymentStatus: string;
      createdAt: string;
      tableName: string;
    }>;
  }>();

  unpaidBills.forEach((b) => {
    const phone = b.customerPhone?.trim() || "";
    const name = b.customerName?.trim() || "Walk-in Guest";
    const key = phone || `name:${name}`;

    const due = (b.balanceDue && b.balanceDue > 0) ? b.balanceDue : (b.total - (b.amountPaid || 0));
    const pendingAmt = Math.max(0, due);

    const existing = customerUnpaidMap.get(key);
    const billObj = {
      id: b.id,
      billNumber: b.billNumber,
      total: b.total,
      amountPaid: b.amountPaid || 0,
      balanceDue: pendingAmt,
      paymentStatus: b.paymentStatus,
      createdAt: b.createdAt.toISOString(),
      tableName: b.tableName || "POS",
    };

    if (existing) {
      existing.totalUnpaid += pendingAmt;
      existing.billsCount += 1;
      existing.bills.push(billObj);
      if (b.createdAt > existing.lastBillDate) {
        existing.lastBillDate = b.createdAt;
      }
    } else {
      customerUnpaidMap.set(key, {
        customerName: name,
        customerPhone: phone,
        totalUnpaid: pendingAmt,
        billsCount: 1,
        lastBillDate: b.createdAt,
        bills: [billObj],
      });
    }
  });

  const customerUnpaidList = Array.from(customerUnpaidMap.values())
    .sort((a, b) => b.totalUnpaid - a.totalUnpaid);

  return (
    <UnpaidDuesClient 
      initialDuesList={customerUnpaidList} 
      businessName={businessName} 
    />
  );
}
