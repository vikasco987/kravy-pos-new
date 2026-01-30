"use client";
import Link from "next/link"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { i } from "node_modules/framer-motion/dist/types.d-BJcRxCew";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { useSearch } from "@/components/SearchContext";


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
  const router = useRouter();
  const { query } = useSearch();

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
        <h1 className="text-xl font-semibold">Bill Manager</h1>

        <div className="flex justify-between items-center">
         <div className="flex gap-2">
        <Link
          href="/billing/deleted"
          className="border px-4 py-2 rounded text-sm"
        >
          🗑 Deleted Bills
        </Link>

        <Link
          href="/billing/checkout"
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          + New Bill
        </Link>
      </div>
    </div>


      </div>

      {/* EMPTY STATE */}
      {bills.length === 0 && (
        <p className="text-gray-500">No bills created yet</p>
      )}

      {/* ================= DESKTOP TABLE ================= */}

      <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Bill No</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
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
                <td className="p-3 font-medium">{bill.billNumber}</td>
                <td className="p-3">
                  {bill.customerName || "Walk-in Customer"}
                </td>
                <td className="p-3 text-gray-600">
                  {bill.customerPhone || "—"}
                </td>
                <td className="p-3">
                  {new Date(bill.createdAt).toLocaleString()}
                </td>
                <td className="p-3 font-medium">
                  ₹{bill.total.toFixed(2)}
                </td>
                <td className="p-3">{bill.paymentMode}</td>
                <td className="p-3">
                  <StatusBadge
                    status={bill.paymentStatus}
                    isHeld={bill.isHeld}
                  />
                </td>
                <td className="p-3 text-right">
                  <BillActions bill={bill} refresh={fetchBills} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* ================= MOBILE CARDS ================= */}

      <div className="md:hidden space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="bg-white border rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{bill.billNumber}</p>
                <p className="text-sm text-gray-500">
                  {bill.customerName || "Walk-in Customer"}
                </p>
              </div>

              <BillActions bill={bill} refresh={fetchBills} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <div>
                <p className="text-gray-500">Phone</p>
                <p>{bill.customerPhone || "—"}</p>
              </div>

              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-semibold">
                  ₹{bill.total.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Payment</p>
                <p>{bill.paymentMode}</p>
              </div>

              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge
                  status={bill.paymentStatus}
                  isHeld={bill.isHeld}
                />
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              {new Date(bill.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ---------- ACTION MENU ---------- */

function BillActions({
  bill,
  refresh,
}: {
  bill: BillManager;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded hover:bg-gray-100"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-[9999]">
          <ActionItem
            label="View"
            onClick={() => {
              setOpen(false);
              router.push(`/billing/${bill.id}`);
            }}
          />

          <ActionItem
            label="Print"
            onClick={() => {
              setOpen(false);
              window.open(`/billing/${bill.id}`, "_blank");
            }}
          />

          <ActionItem
              label="Send to WhatsApp"
              onClick={() => {
                setOpen(false);

                const phone = formatWhatsAppNumber(bill.customerPhone);

                const pdfUrl = `${window.location.origin}/api/bill-manager/${bill.id}/pdf`;

                const message = encodeURIComponent(
                `🙏 Thank you for shopping with us !\n\n` +
                `Hello ${bill.customerName || "Customer"},\n\n` +
                `Here is your invoice:\n` +
                `🧾 Bill No: ${bill.billNumber}\n` +
                `💰 Amount Paid: ₹${bill.total}\n\n` +
                `📄 Download Invoice:\n${pdfUrl}\n\n` +
                `We look forward to serving you again 😊`
              );


                // If customer phone exists → open direct chat
                if (phone) {
                  window.open(
                    `https://wa.me/${phone}?text=${message}`,
                    "_blank"
                  );
                } else {
                  // fallback → generic WhatsApp share
                  window.open(
                    `https://wa.me/?text=${message}`,
                    "_blank"
                  );
                }
              }}
            />



            {bill.isHeld && (
              <ActionItem
                label="Resume"
                onClick={() => {
                  setOpen(false);
                  router.push(`/billing/checkout?resumeBillId=${bill.id}`);
                }}
              />
            )}


            <ActionItem
            label="Delete"
            onClick={async () => {
              setOpen(false);

              if (!confirm("Delete this bill? You can view it later in Deleted Bills.")) {
                return;
              }

              try {
                const res = await fetch(`/api/bill-manager/${bill.id}`, {
                  method: "DELETE",
                });

                if (!res.ok) {
                  alert("Failed to delete bill");
                  return;
                }

                refresh(); // 🔄 reload bill list
              } catch (err) {
                console.error("DELETE BILL ERROR:", err);
                alert("Something went wrong");
              }
            }}
          />

        </div>
      )}
    </div>
  );
}

  /* ---------- ACTION ITEM ---------- */

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
      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
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
  // 🔥 HELD HAS TOP PRIORITY
  if (isHeld || status?.toLowerCase() === "held") {
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
