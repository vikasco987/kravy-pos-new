"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Bill = {
  id: string;
  createdAt: string;
  grandTotal: number;
  paymentMode?: string;
};

export default function BillHistoryPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then(setBills);
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Bill History</h1>

      {bills.length === 0 && <p>No bills found</p>}

      {bills.map((b) => (
        <div
          key={b.id}
          className="border rounded p-3 mb-2 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">
              Bill #{b.id.slice(-6)}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(b.createdAt).toLocaleString()}
            </div>
            <div className="text-sm">
              Mode: {b.paymentMode || "-"}
            </div>
          </div>

          <div>
            <div className="font-bold">
              ₹{b.grandTotal?.toFixed(2)}
            </div>
            <button
              onClick={() => router.push(`/billing?billId=${b.id}`)}
              className="mt-1 px-3 py-1 bg-black text-white rounded"
            >
              Re-Print
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
