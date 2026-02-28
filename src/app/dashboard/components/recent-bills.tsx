// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// interface Bill {
//   id: string;
//   customer: string;
//   amount: number;
//   date: string;
// }

// interface RecentBillsProps {
//   bills: Bill[];
// }

// export default function RecentBills({ bills }: RecentBillsProps) {
//   return (
//     <Card className="rounded-2xl shadow-sm">
//       <CardHeader>
//         <CardTitle>Recent Bills</CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {bills.map((bill) => (
//           <div
//             key={bill.id}
//             className="flex justify-between items-center border-b pb-2"
//           >
//             <div>
//               <p className="text-sm font-medium">{bill.customer}</p>
//               <p className="text-xs text-muted-foreground">{bill.date}</p>
//             </div>
//             <p className="font-semibold">₹{bill.amount}</p>
//           </div>
//         ))}
//       </CardContent>
//     </Card>
//   );
// }

"use client";

interface Bill {
  billNumber: string;
  customerName?: string;
  paymentMode: string;
  total: number;
  createdAt: string;
}

interface Props {
  recentBills?: Bill[];
  deletedBills?: Bill[];
}

export default function RecentBills({
  recentBills = [],
  deletedBills = [],
}: Props) {
  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(num);

  const PaymentBadge = ({ mode }: { mode: string }) => {
    const lower = mode?.toLowerCase() || "";

    const color =
      lower.includes("cash")
        ? "bg-green-100 text-green-700"
        : lower.includes("upi")
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-600";

    return (
      <span
        className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}
      >
        {mode}
      </span>
    );
  };

  const Card = ({
    title,
    bills,
    deleted = false,
  }: {
    title: string;
    bills: Bill[];
    deleted?: boolean;
  }) => (
    <div className="rounded-2xl bg-white shadow-sm p-4 space-y-4 h-full">
      <h3 className="text-base font-semibold">{title}</h3>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {bills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No bills found
          </p>
        )}

        {bills.map((bill) => (
          <div
            key={bill.billNumber}
            className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-xl border ${
              deleted
                ? "bg-red-50 border-red-200"
                : "bg-gray-50"
            }`}
          >
            {/* Left */}
            <div>
              <strong className="text-sm">
                #{bill.billNumber}
              </strong>
              <p className="text-xs text-muted-foreground">
                {bill.customerName || "Walk-in"}
              </p>
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <PaymentBadge mode={bill.paymentMode} />

              <span className="font-semibold">
                ₹ {format(bill.total)}
              </span>

              <span className="text-xs text-muted-foreground">
                {bill.createdAt}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="
        grid gap-6
        grid-cols-1
        lg:grid-cols-2
      "
    >
      <Card title="Recent Bills" bills={recentBills} />
      <Card
        title="Recently Deleted Bills"
        bills={deletedBills}
        deleted
      />
    </div>
  );
}