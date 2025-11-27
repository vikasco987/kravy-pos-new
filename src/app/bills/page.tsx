// "use client";

// import { useEffect, useState } from "react";

// export default function BillsPage() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchBills = async () => {
//     setLoading(true);

//     const res = await fetch("/api/billing/list");
//     const data = await res.json();

//     setBills(data.bills || []);
//     setLoading(false);
//   };

//   const deleteBill = async (id: string) => {
//     const ok = confirm("Delete this bill?");
//     if (!ok) return;

//     const res = await fetch(`/api/billing/delete/${id}`, {
//       method: "DELETE",
//     });

//     const data = await res.json();

//     if (data.success) {
//       setBills((prev) => prev.filter((b: any) => b.id !== id));
//     } else {
//       alert("Delete failed!");
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, []);

//   if (loading) return <p>Loading bills...</p>;

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">Bills</h1>

//       {bills.length === 0 ? (
//         <p>No bills found.</p>
//       ) : (
//         bills.map((bill: any) => (
//           <div key={bill.id} className="p-4 border rounded mb-4">
//             <h2 className="font-semibold">Bill ID: {bill.id}</h2>
//             <p>Customer: {bill.customer?.name || "N/A"}</p>
//             <p>Total: ₹{bill.total}</p>
//             <p>{new Date(bill.createdAt).toLocaleString("en-IN")}</p>

//             <button
//               className="mt-3 bg-red-500 text-white px-3 py-1 rounded"
//               onClick={() => deleteBill(bill.id)}
//             >
//               Delete
//             </button>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }














// // "use client";

// // import { useEffect, useState } from "react";
// // import { useRouter } from "next/navigation";

// // export default function BillsPage() {
// //   const [bills, setBills] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const router = useRouter();

// //   const fetchBills = async () => {
// //     setLoading(true);
// //     const res = await fetch("/api/billing/list");
// //     const data = await res.json();
// //     setBills(data.bills || []);
// //     setLoading(false);
// //   };

// //   useEffect(() => {
// //     fetchBills();
// //   }, []);

// //   if (loading) return <p>Loading bills...</p>;

// //   return (
// //     <div className="max-w-4xl mx-auto p-6">

// //       {/* ⭐ BUTTON SHOWS AT TOP ⭐ */}
// //       <button
// //         onClick={() => router.push("/bills")}
// //         className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
// //       >
// //         Go to Bills Page
// //       </button>

// //       <h1 className="text-2xl font-bold mb-4">Bills</h1>

// //       {bills.length === 0 ? (
// //         <p>No bills found.</p>
// //       ) : (
// //         bills.map((bill: any) => (
// //           <div key={bill.id} className="p-4 border rounded mb-4">
// //             <h2 className="font-semibold">Bill ID: {bill.id}</h2>
// //             <p>Customer: {bill.customer?.name || "N/A"}</p>
// //             <p>Total: ₹{bill.total}</p>
// //             <p>{new Date(bill.createdAt).toLocaleString("en-IN")}</p>
// //           </div>
// //         ))
// //       )}
// //     </div>
// //   );
// // }




























// "use client";

// import { useEffect, useState } from "react";

// export default function BillsPage() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchBills = async () => {
//     setLoading(true);

//     const res = await fetch("/api/billing/list");
//     const data = await res.json();

//     setBills(data.bills || []);
//     setLoading(false);
//   };

//   const deleteBill = async (id: string) => {
//     const ok = confirm("Delete this bill?");
//     if (!ok) return;

//     const res = await fetch(`/api/billing/delete/${id}`, {
//       method: "DELETE",
//     });

//     const data = await res.json();

//     if (data.success) {
//       setBills((prev) => prev.filter((b: any) => b.id !== id));
//     } else {
//       alert("Delete failed!");
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, []);

//   if (loading) return <p className="p-6">Loading bills...</p>;

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6">Bills</h1>

//       {bills.length === 0 ? (
//         <p>No bills found.</p>
//       ) : (
//         bills.map((bill: any) => (
//           <div key={bill.id} className="p-4 border rounded mb-6 bg-white shadow">
            
//             {/* BILL BASE INFO */}
//             <h2 className="text-lg font-semibold">🧾 Bill ID: {bill.id}</h2>
//             <p className="mt-1">👤 Customer: {bill.customer?.name || "N/A"}</p>
//             <p className="mt-1">💰 Total: ₹{bill.total}</p>
//             <p className="mt-1 text-gray-600">
//               {new Date(bill.createdAt).toLocaleString("en-IN")}
//             </p>

//             {/* ⭐ PRODUCTS SECTION ⭐ */}
//             <div className="mt-4 bg-gray-100 p-3 rounded">
//               <h3 className="font-semibold mb-2">Items</h3>

//               {bill.products?.length > 0 ? (
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="bg-gray-200">
//                       <th className="p-2 border">Item</th>
//                       <th className="p-2 border">Qty</th>
//                       <th className="p-2 border">Rate</th>
//                       <th className="p-2 border">Total</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {bill.products.map((p: any, i: number) => (
//                       <tr key={i}>
//                         <td className="border p-2">
//                           {p.product?.name || p.productName || "Unnamed"}
//                         </td>
//                         <td className="border p-2 text-center">{p.quantity}</td>
//                         <td className="border p-2 text-right">₹{p.rate}</td>
//                         <td className="border p-2 text-right font-semibold">
//                           ₹{p.total}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p>No items found.</p>
//               )}
//             </div>

//             {/* DELETE BUTTON */}
//             <button
//               className="mt-4 bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
//               onClick={() => deleteBill(bill.id)}
//             >
//               Delete
//             </button>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }







"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Clerk Auth
  const { getToken } = useAuth();

  const fetchBills = async () => {
    setLoading(true);

    const res = await fetch("/api/billing/list");
    const data = await res.json();

    setBills(data.bills || []);
    setLoading(false);
  };

  // ⭐ UPDATED DELETE FUNCTION - Now sends Clerk Token
  const deleteBill = async (id: string) => {
    const ok = confirm("Delete this bill?");
    if (!ok) return;

    // Get Clerk token
    const token = await getToken();

    const res = await fetch(`/api/billing/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`, // ⭐ FIXED
      },
    });

    const data = await res.json();

    if (data.success) {
      setBills((prev) => prev.filter((b: any) => b.id !== id));
    } else {
      alert("Delete failed: " + data.error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  if (loading) return <p className="p-6">Loading bills...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bills</h1>

      {bills.length === 0 ? (
        <p>No bills found.</p>
      ) : (
        bills.map((bill: any) => (
          <div key={bill.id} className="p-4 border rounded mb-6 bg-white shadow">

            {/* BILL BASE INFO */}
            <h2 className="text-lg font-semibold">🧾 Bill ID: {bill.id}</h2>
            <p className="mt-1">👤 Customer: {bill.customer?.name || "N/A"}</p>
            <p className="mt-1">💰 Total: ₹{bill.total}</p>
            <p className="mt-1 text-gray-600">
              {new Date(bill.createdAt).toLocaleString("en-IN")}
            </p>

            {/* ⭐ PRODUCTS SECTION */}
            <div className="mt-4 bg-gray-100 p-3 rounded">
              <h3 className="font-semibold mb-2">Items</h3>

              {bill.products?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 border">Item</th>
                      <th className="p-2 border">Qty</th>
                      <th className="p-2 border">Rate</th>
                      <th className="p-2 border">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bill.products.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="border p-2">
                          {p.product?.name || p.productName || "Unnamed"}
                        </td>
                        <td className="border p-2 text-center">{p.quantity}</td>
                        <td className="border p-2 text-right">₹{p.rate}</td>
                        <td className="border p-2 text-right font-semibold">
                          ₹{p.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No items found.</p>
              )}
            </div>

            {/* DELETE BUTTON */}
            <button
              className="mt-4 bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
              onClick={() => deleteBill(bill.id)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}
