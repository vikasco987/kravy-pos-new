"use client";

import { useEffect, useState } from "react";
import { SectionCards } from "./section-cards";
import { AnalyticsDashboard } from "./analytics-dashboard";

export function DashboardAnalytics() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData(); // auto refresh every 30 sec
    }, 30000);

    return () => clearInterval(interval);
  }, [range]);

  async function fetchData() {
    const res = await fetch(`/api/dashboard?range=${range}`);
    const json = await res.json();
    setData(json);
  }

  if (!data) return <p>Loading analytics...</p>;

  return (
    <>
      {/* FILTER */}
      <div className="analytics-header">
        <h2>Business Analytics</h2>

        <div className="filter-buttons">
          <button
            className={range === "7" ? "active" : ""}
            onClick={() => setRange("7")}
          >
            Last 7 Days
          </button>

          <button
            className={range === "30" ? "active" : ""}
            onClick={() => setRange("30")}
          >
            Last 30 Days
          </button>

          <button
            className={range === "90" ? "active" : ""}
            onClick={() => setRange("90")}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* CARDS */}
      <SectionCards data={data} />

      {/* CHARTS */}
      <AnalyticsDashboard data={data} />
    </>
  );
}