"use client";

export function SectionCards({ data }: any) {
  const totalRevenue =
    data.monthlyRevenue?.reduce(
      (sum: number, m: any) => sum + m.revenue,
      0
    ) || 0;

  const totalBills =
    data.monthlyRevenue?.reduce(
      (sum: number, m: any) => sum + (m.billCount || 0),
      0
    ) || 0;

  return (
    <div className="cards-grid">
      <div className="card">
        <h3>Total Revenue</h3>
        <p>₹ {totalRevenue.toLocaleString()}</p>
      </div>

      <div className="card">
        <h3>Total Bills</h3>
        <p>{totalBills}</p>
      </div>

      <div className="card">
        <h3>Growth</h3>
        <p>{data.growth?.toFixed(2)}%</p>
      </div>

      <div className="card">
        <h3>Cash vs UPI</h3>
        <p>
          ₹ {data.paymentSplit.Cash} / ₹ {data.paymentSplit.UPI}
        </p>
      </div>
    </div>
  );
}