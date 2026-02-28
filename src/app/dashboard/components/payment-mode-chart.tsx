"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  paymentSplit?: {
    Cash?: number;
    UPI?: number;
  };
}

export default function PaymentModeChart({
  paymentSplit,
}: Props) {
  const cash = paymentSplit?.Cash || 0;
  const upi = paymentSplit?.UPI || 0;

  const total = cash + upi;

  const data = [
    { name: "Cash", value: cash },
    { name: "UPI", value: upi },
  ];

  const COLORS = ["#22c55e", "#3b82f6"];

  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(num);

  const renderLabel = ({
    percent,
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
  }: any) => {
    if (percent === 0) return null;

    const RADIAN = Math.PI / 180;
    const radius =
      innerRadius + (outerRadius - innerRadius) / 2;

    const x =
      cx + radius * Math.cos(-midAngle * RADIAN);
    const y =
      cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 space-y-4">
      <h3 className="text-base font-semibold">
        Payment Mode
      </h3>

      {total === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
          No payment data available
        </div>
      ) : (
        <div className="relative h-[260px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={4}
                labelLine={false}
                label={renderLabel}
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: number) =>
                  `₹ ${format(value)}`
                }
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground">
              Total
            </p>
            <p className="text-lg sm:text-xl font-bold">
              ₹ {format(total)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}