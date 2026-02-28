"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Item {
  name: string;
  totalSold: number;
  totalRevenue: number;
}

interface Props {
  items?: Item[];
  allBills?: any[];
}

export default function TopItems({
  items = [],
  allBills = [],
}: Props) {
  const [selectedItem, setSelectedItem] =
    useState<Item | null>(null);

  const [range, setRange] = useState<number>(7);

  const [viewMode, setViewMode] = useState<
    "revenue" | "units" | "both"
  >("revenue");

  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(num);

  const maxRevenue =
    items.length > 0
      ? Math.max(...items.map((i) => i.totalRevenue))
      : 1;

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  // 🔥 Proper Trend Builder (Revenue + Units)
  const getItemTrend = (
    itemName: string,
    range: number
  ) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - range + 1);

    const map: Record<
      string,
      { revenue: number; units: number }
    > = {};

    allBills.forEach((bill) => {
      const billDate = new Date(bill.createdAt);
      if (isNaN(billDate.getTime())) return;

      if (billDate >= startDate && billDate <= endDate) {
        let items = bill.items;

        if (typeof items === "string") {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }

        if (!Array.isArray(items)) return;

        items.forEach((item: any) => {
          if (
            !item?.name ||
            !item.name
              .toLowerCase()
              .includes(itemName.toLowerCase())
          )
            return;

          const quantity = Number(
          item?.quantity ??
          item?.qty ??
          item?.count ??
          item?.units ??
          item?.unit ??
          0
        );

        const price = Number(
          item?.sellingPrice ??
          item?.price ??
          item?.rate ??
          item?.amount ??
          item?.total ??
          0
        );

          const dateKey =
            billDate.toISOString().split("T")[0];

          if (!map[dateKey]) {
            map[dateKey] = {
              revenue: 0,
              units: 0,
            };
          }

          map[dateKey].units += quantity;
          map[dateKey].revenue += quantity * price;
        });
      }
    });

    // Fill missing dates
    const result = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const key =
        current.toISOString().split("T")[0];

      result.push({
        date: key,
        revenue: map[key]?.revenue || 0,
        units: map[key]?.units || 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  };

  return (
    <>
      {/* MAIN CARD */}
    {/* TOP SELLING ITEMS CARD */}
<div className="rounded-xl bg-white shadow-sm p-4 space-y-3 max-w-md">

  <div className="flex justify-between items-center">
    <h3 className="text-sm font-semibold">
      Top Selling Items
    </h3>
    <span className="text-xs text-muted-foreground">
      Top 5
    </span>
  </div>

  <div className="space-y-3">
    {items.map((item, index) => {
      const progress =
        (item.totalRevenue / maxRevenue) * 100;

      return (
        <div
          key={item.name}
          onClick={() => setSelectedItem(item)}
          className="cursor-pointer group transition"
        >
          <div className="flex items-center justify-between text-xs">

            {/* Left Section */}
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-sm">
                {getMedal(index)}
              </span>

              <p className="truncate font-medium group-hover:text-blue-600 transition">
                {item.name}
              </p>
            </div>

            {/* Revenue */}
            <p className="font-semibold text-gray-700">
              ₹ {format(item.totalRevenue)}
            </p>
          </div>

          {/* Units Sold */}
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>
              {format(item.totalSold)} units
            </span>
            <span>
              {progress.toFixed(0)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
</div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-[92%] max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                <h2 className="text-base font-semibold">
                  {selectedItem.name}
                </h2>
              </div>

              <div className="p-4 space-y-4">

                {/* Date Filter */}
                <div className="flex justify-center gap-2">
                  {[7, 30, 90].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        range === r
                          ? "bg-black text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {r}D
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div className="flex justify-center gap-2">
                  {["revenue", "units", "both"].map(
                    (mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setViewMode(
                            mode as any
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs border ${
                          viewMode === mode
                            ? "bg-black text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {mode.toUpperCase()}
                      </button>
                    )
                  )}
                </div>

                {/* BAR CHART */}
                <div className="h-[240px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={getItemTrend(
                        selectedItem.name,
                        range
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          new Date(v).getDate()
                        }
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(
                          value: number,
                          name: string
                        ) =>
                          name === "revenue"
                            ? `₹ ${format(value)}`
                            : `${format(
                                value
                              )} units`
                        }
                      />
                      <Legend />

                      {(viewMode ===
                        "revenue" ||
                        viewMode ===
                          "both") && (
                        <Bar
                          dataKey="revenue"
                          fill="#2563eb"
                          animationDuration={
                            800
                          }
                        />
                      )}

                      {(viewMode ===
                        "units" ||
                        viewMode ===
                          "both") && (
                        <Bar
                          dataKey="units"
                          fill="#22c55e"
                          animationDuration={
                            800
                          }
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <button
                  onClick={() =>
                    setSelectedItem(null)
                  }
                  className="w-full bg-black text-white py-2 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}