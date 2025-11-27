// "use client";

// import { useEffect, useState } from "react";

// export default function DeletedBillsPage() {
//   const [deletedBills, setDeletedBills] = useState([]);

//   const fetchDeleted = async () => {
//     const res = await fetch("/api/billing/deleted/list");
//     const data = await res.json();
//     setDeletedBills(data.deleted || []);
//   };

//   const restoreBill = async (id: string) => {
//     if (!confirm("Restore this bill?")) return;

//     const res = await fetch(`/api/billing/deleted/restore/${id}`, {
//       method: "POST",
//     });

//     const data = await res.json();
//     if (data.success) {
//       alert("Bill restored!");
//       fetchDeleted();
//     } else {
//       alert("Restore failed: " + data.error);
//     }
//   };

//   useEffect(() => {
//     fetchDeleted();
//   }, []);

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6">🗑️ Deleted Bills</h1>

//       {deletedBills.length === 0 ? (
//         <p>No deleted bills found.</p>
//       ) : (
//         deletedBills.map((entry: any) => (
//           <div key={entry.id} className="p-4 border rounded mb-6 bg-white shadow">
//             <h2 className="text-lg font-semibold">
//               Bill ID: {entry.billId}
//             </h2>

//             {/* FIXED FIELD NAME */}
//             <p className="text-gray-600">
//               Deleted At: {new Date(entry.deletedAt).toLocaleString("en-IN")}
//             </p>

//             <pre className="mt-3 bg-gray-100 p-3 rounded text-sm overflow-auto">
//               {JSON.stringify(entry.snapshot, null, 2)}
//             </pre>

//             <button
//               className="mt-4 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
//               onClick={() => restoreBill(entry.id)}
//             >
//               Restore
//             </button>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }






"use client";

import { useEffect, useState } from "react";

export default function DeletedBillsPage() {
  const [deletedBills, setDeletedBills] = useState([]);

  const fetchDeleted = async () => {
    try {
      const res = await fetch("/api/billing/deleted/list");
      const data = await res.json();
      setDeletedBills(data.deleted || []);
    } catch (error) {
      console.error("Failed to load deleted bills", error);
    }
  };

  const restoreBill = async (id: string) => {
    if (!confirm("Restore this bill?")) return;

    try {
      const res = await fetch(`/api/billing/deleted/restore/${id}`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        alert("Bill restored!");
        fetchDeleted();
      } else {
        alert("Restore failed: " + data.error);
      }
    } catch (error) {
      console.error("Restore failed", error);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🗑️ Deleted Bills</h1>

      {deletedBills.length === 0 ? (
        <p className="text-gray-600">No deleted bills found.</p>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Bill ID</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Payment Mode</th>
              <th className="border p-2">Deleted At</th>
              <th className="border p-2">User</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {deletedBills.map((entry: any) => (
              <tr key={entry.id} className="text-center bg-white">
                <td className="border p-2">{entry.billId}</td>

                <td className="border p-2">
                  ₹{entry.snapshot?.grandTotal ?? "—"}
                </td>

                <td className="border p-2">
                  {entry.snapshot?.paymentMode ?? "—"}
                </td>

                <td className="border p-2">
                  {new Date(entry.deletedAt).toLocaleString("en-IN")}
                </td>

                <td className="border p-2">
                  {entry.snapshot?.user?.name || "N/A"}
                </td>

                <td className="border p-2">
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    onClick={() => restoreBill(entry.id)}
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}











//';liuytrewq wertyukol'

//;lkjytgrerwrdgfhjkl;'
//lkjytrewdsfdgfhhkk;l