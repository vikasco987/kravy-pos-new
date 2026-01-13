"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BillManager = {
  id: string;
  billNumber: string;
  createdAt: string;
  total: number;
  paymentMode: string;
  paymentStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;  
  isHeld?: boolean;
};

export default function BillingPage() {
  const [bills, setBills] = useState<BillManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchBills() {
    try {
      setLoading(true);
      const res = await fetch("/api/bill-manager", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch bills");

      const data = await res.json();
      setBills(data.bills ?? []);
    } catch (err) {
      console.error("FETCH BILLS ERROR:", err);
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBills();
  }, []);

  if (loading) return <p className="p-6">Loading bills...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6 space-y-6 pt-20">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Bills</h1>

        <Link
          href="/billing/new"
          className="bg-black text-white px-4 py-2 rounded"
        >
          + New Bill
        </Link>
      </div>

      {/* EMPTY STATE */}
      {bills.length === 0 && (
        <p className="text-gray-500">No bills created yet</p>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Bill No</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">
                  {bill.billNumber}
                </td>

                <td className="p-3">
                  {bill.customerName || "Walk-in Customer"}
                </td>

                <td className="p-3 text-gray-600">
                  {bill.customerPhone || "—"}
                </td>
                <td className="p-3">
                  {new Date(bill.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  ₹{bill.total.toFixed(2)}
                </td>

                <td className="p-3">
                  {bill.paymentMode}
                </td>

                <td className="p-3">
                  <StatusBadge status={bill.paymentStatus} />
                </td>

                <td className="p-3 text-right">
                  <BillActions bill={bill} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- ACTION MENU ---------- */

function BillActions({ bill }: { bill: BillManager }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-right">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-1 rounded hover:bg-gray-100"
      >
        ⋮
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-44 bg-white border rounded shadow z-20"
          onMouseLeave={() => setOpen(false)}
        >
          <ActionItem
            label="View"
            onClick={() => (window.location.href = `/billing/${bill.id}`)}
          />
          <ActionItem
            label="Print"
            onClick={() => window.open(`/billing/${bill.id}`, "_blank")}
          />
          <ActionItem
            label="Share"
            onClick={() => alert("Share PDF coming next")}
          />
          <ActionItem
            label="Download PDF"
            onClick={() => alert("Download PDF coming next")}
          />
         <ActionItem
  label={bill.isHeld ? "Resume Bill" : "Hold Bill"}
  onClick={async () => {
    if (bill.isHeld) {
      // 👉 RESUME
      window.location.href = `/billing/new?resume=${bill.id}`;
    } else {
      // 👉 HOLD
      await fetch(`/api/bill-manager/${bill.id}/hold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHeld: true }),
      });
      fetchBills();
    }
  }}
/>


        </div>
      )}
    </div>
  );
}

function ActionItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

/* ---------- STATUS BADGE ---------- */

function StatusBadge({
  status,
  isHeld,
}: {
  status: string;
  isHeld?: boolean;
}) {
  if (isHeld) {
    return (
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
        HELD
      </span>
    );
  }

  if (status?.toLowerCase() === "paid") {
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
