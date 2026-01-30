"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type DeletedBill = {
  id: string;
  billId: string;
  createdAt: string;
  snapshot: {
    billNumber: string;
    total: number;
    paymentMode: string;
    paymentStatus: string;
    isHeld?: boolean;
    customer?: {
      name?: string;
    };
  };
};

export default function DeletedBillsPage() {
  const [bills, setBills] = useState<DeletedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/bill-manager/deleted/list") // ✅ FIXED URL
      .then((r) => r.json())
      .then((d) => setBills(d.deleted ?? []))
      .finally(() => setLoading(false));
  }, []);

 async function restore(billId: string) {
  if (!confirm("Restore this bill?")) return;

  const res = await fetch(
    `/api/bill-manager/deleted/restore/${billId}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    alert("Failed to restore bill");
    return;
  }

  // optional: update UI instantly
  setBills((prev) => prev.filter((b) => b.id !== billId));

  // ✅ AUTO REDIRECT TO BILL MANAGER
  router.push("/billing");
}

  return (
    <div className="p-6 space-y-6 pt-20">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Deleted Bills</h1>
        <Link href="/billing" className="text-sm text-blue-600">
          ← Back to Bills
        </Link>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Bill No</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Deleted At</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bills.map((b) => {
              const snap = b.snapshot;
              return (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {snap.billNumber}
                  </td>

                  <td className="p-3">
                    {snap.customer?.name ?? "Walk-in Customer"}
                  </td>

                  <td className="p-3">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>

                  <td className="p-3">
                    ₹{Number(snap.total).toFixed(2)}
                  </td>

                  <td className="p-3">
                    {snap.paymentMode}
                  </td>

                  <td className="p-3">
                    <DeletedStatusBadge snap={snap} />
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => restore(b.id)}
                      className="text-green-600 text-sm"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              );
            })}

            {bills.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No deleted bills
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */

function DeletedStatusBadge({
  snap,
}: {
  snap: DeletedBill["snapshot"];
}) {
  if (snap.isHeld) {
    return (
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
        HELD
      </span>
    );
  }

  if (snap.paymentStatus?.toLowerCase() === "paid") {
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
        PAID
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
      PENDING
    </span>
  );
}
