"use client";

interface Props {
  data: {
    monthlyRevenue?: {
      revenue: number;
    }[];
    totalBills?: number;
    growth?: number;
    paymentSplit?: {
      Cash?: number;
      UPI?: number;
    };
  };
}

export default function StatsGrid({ data }: Props) {
  const totalRevenue =
    data.monthlyRevenue?.reduce(
      (sum, m) => sum + (m.revenue || 0),
      0
    ) || 0;

  const totalBills = data.totalBills || 0;

  const cash = data.paymentSplit?.Cash || 0;
  const upi = data.paymentSplit?.UPI || 0;

  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(num);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm text-muted-foreground">
          Total Revenue
        </h3>
        <p className="text-xl font-bold mt-2 break-words">
          ₹ {format(totalRevenue)}
        </p>
      </div>

      {/* Total Bills */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm text-muted-foreground">
          Total Bills
        </h3>
        <p className="text-xl font-bold mt-2">
          {format(totalBills)}
        </p>
      </div>

      {/* Growth */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm text-muted-foreground">
          Growth
        </h3>
        <p
          className={`text-xl font-bold mt-2 ${
            (data.growth || 0) >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {(data.growth || 0).toFixed(2)}%
        </p>
      </div>

      {/* Cash / UPI */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm text-muted-foreground">
          Cash / UPI
        </h3>
        <p className="text-lg font-semibold mt-2 break-words">
          ₹ {format(cash)} / ₹ {format(upi)}
        </p>
      </div>
    </div>
  );
}