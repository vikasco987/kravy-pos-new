// "use client";

// import Link from "next/link";
// import "./home.css";
// import { SectionCards } from "@/components/section-cards";
// import { ChartAreaInteractive } from "@/components/chart-area-interactive";
// import { auth } from "@clerk/nextjs/server";


// export default function HomePage() {
//   return (
//     <main className="dashboard-home">
//       {/* TOP HEADER */}
//       <section className="dashboard-header">
//         <div>
//           <h1 className="dashboard-title">
//             <span className="brand-name">KRAVY</span> Dashboard
//           </h1>
//           <p className="dashboard-subtitle">
//             Overview of your billing, sales, and activity
//           </p>
//         </div>

//         <div className="dashboard-actions">
//           <Link href="/billing/checkout" className="btn primary">
//             Start Billing
//           </Link>
//           <Link href="/menu/view" className="btn outline">
//             View Menu
//           </Link>
//         </div>
//       </section>

//       {/* SECTION CARDS (PARALLEL, TOP PRIORITY) */}
//       <section className="dashboard-cards">
//         <SectionCards />
//       </section>

//       {/* CHARTS */}
//       <section className="dashboard-charts">
//         <div className="chart-card">
//           <h2 className="section-title">Sales Overview</h2>
//           <ChartAreaInteractive />
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section className="dashboard-features">
//         <h2 className="section-title">Why Kravy Billing?</h2>

//         <div className="feature-grid">
//           <div className="feature">⚡ Fast Billing</div>
//           <div className="feature">📋 Easy Menu Management</div>
//           <div className="feature">👥 Party & Customer Records</div>
//           <div className="feature">📊 Sales Tracking</div>
//           <div className="feature">📱 Mobile Friendly</div>
//           <div className="feature">🔒 Secure & Reliable</div>
//         </div>
//       </section>

//       {/* HOW IT WORKS */}
//       <section className="dashboard-steps">
//         <h2 className="section-title">How It Works</h2>

//         <div className="step-list">
//           <div className="step">
//             <span>1</span>
//             <p>Add Menu Items</p>
//           </div>
//           <div className="step">
//             <span>2</span>
//             <p>Create Bill</p>
//           </div>
//           <div className="step">
//             <span>3</span>
//             <p>Track Sales</p>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }


// //src/app/dashboard/page.tsx

// import Link from "next/link";
// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import { SectionCards } from "@/components/section-cards";
// import { AnalyticsDashboard } from "@/components/analytics-dashboard";
// import { DashboardAnalytics } from "@/components/dashboard-analytics";

// export default async function HomePage() {
//   const { userId } = await auth();

//   if (!userId) {
//     redirect("/sign-in");
//   }

//   return (
//     <main className="dashboard-container">

//       {/* HEADER */}
//       <section className="dashboard-header">
//         <div className="header-left">
//           <h1>
//             <span className="brand">KRAVY</span> Dashboard
//           </h1>
//           <p>Manage billing, track revenue, and monitor business growth.</p>
//         </div>

//         <div className="header-actions">
//           <Link href="/billing/checkout" className="btn-primary">
//             + New Bill
//           </Link>
//           <Link href="/menu/view" className="btn-secondary">
//             Manage Menu
//           </Link>
//         </div>
//       </section>

      
//       {/* ENTERPRISE ANALYTICS GRID */}
//       <section>
//         <DashboardAnalytics />
//       </section>

//       {/* INFO SECTION */}
//       <section className="info-section">
//         <div className="info-card">
//           <h3>Fast & Smart Billing</h3>
//           <p>Create bills quickly with optimized checkout flow.</p>
//         </div>

//         <div className="info-card">
//           <h3>Real-Time Analytics</h3>
//           <p>Monitor daily, weekly, and monthly revenue.</p>
//         </div>

//         <div className="info-card">
//           <h3>Secure & Reliable</h3>
//           <p>Protected with Clerk authentication and secure backend.</p>
//         </div>
//       </section>

//     </main>
//   );
// }


import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import StatsGrid from "./components/stats-grid";
import RevenueChart from "./components/revenue-chart";
import RecentBills from "./components/recent-bills";
import TopItems from "./components/top-items";
import DateFilter from "./components/date-filter";
import PaymentModeChart from "./components/payment-mode-chart";

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const range = Number(searchParams.range || 30);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - range);

  const bills = await prisma.billManager.findMany({
    where: {
      clerkUserId: user.id,
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
const totalBills = bills.length;

 let cash = 0;
let upi = 0;

bills.forEach((bill) => {
  const mode = (bill.paymentMode || "").toLowerCase();

  if (mode.includes("cash")) {
    cash += bill.total;
  }

  if (mode.includes("upi")) {
    upi += bill.total;
  }
});

  // Growth
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - range);

  const previousBills = await prisma.billManager.findMany({
    where: {
      clerkUserId: user.id,
      isDeleted: false,
      createdAt: {
        gte: previousStart,
        lt: startDate,
      },
    },
  });

  const previousRevenue = previousBills.reduce(
    (sum, b) => sum + b.total,
    0
  );

  const growth =
    previousRevenue === 0
      ? 100
      : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

  // Chart
  const chartMap: Record<string, { revenue: number; bills: number }> = {};

  bills.forEach((bill) => {
    const date = bill.createdAt.toISOString().split("T")[0];
    if (!chartMap[date]) {
      chartMap[date] = { revenue: 0, bills: 0 };
    }
    chartMap[date].revenue += bill.total;
    chartMap[date].bills += 1;
  });

  const chartData = Object.keys(chartMap).map((date) => ({
    date,
    revenue: chartMap[date].revenue,
    bills: chartMap[date].bills,
  }));

const recentBills = bills.slice(0, 5).map((bill) => ({
  billNumber: bill.billNumber,
  customerName: bill.customerName,
  paymentMode: bill.paymentMode,
  total: bill.total,
  createdAt: bill.createdAt.toLocaleDateString(),
}));

const deletedBillsData = await prisma.billManager.findMany({
  where: {
    clerkUserId: user.id,
    isDeleted: true,
  },
  orderBy: { deletedAt: "desc" },
  take: 5,
});

const deletedBills = deletedBillsData.map((bill) => ({
  billNumber: bill.billNumber,
  customerName: bill.customerName,
  paymentMode: bill.paymentMode,
  total: bill.total,
  createdAt: bill.createdAt.toLocaleDateString(),
}));

const itemMap: Record<
  string,
  { totalSold: number; totalRevenue: number }
> = {};

bills.forEach((bill) => {
  let items: any = bill.items;

  // If stored as string JSON
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  // If stored inside object like { items: [...] }
  if (items && !Array.isArray(items) && items.items) {
    items = items.items;
  }

  if (Array.isArray(items)) {
    items.forEach((item: any) => {
      const name = item?.name || "Unknown";
      const quantity = Number(
      item?.quantity ??
      item?.qty ??
      item?.count ??
      item?.units ??
      0
      );  
      const price = Number(
      item?.sellingPrice ??
      item?.price ??
      item?.rate ??
      item?.amount ??
      0
    );
      if (!itemMap[name]) {
        itemMap[name] = {
          totalSold: 0,
          totalRevenue: 0,
        };
      }

      itemMap[name].totalSold += quantity;
      itemMap[name].totalRevenue += quantity * price;
    });
  }
});

const topItems = Object.keys(itemMap)
  .map((name) => ({
    name,
    totalSold: itemMap[name].totalSold,
    totalRevenue: itemMap[name].totalRevenue,
  }))
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 5);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-semibold">
          Kravy Dashboard 
          <h2 className="text-sm font-normal mt-1"> Manage Billing, track revenue and monitor performance </h2>
        </h1>
        <DateFilter />
      </div>

      <StatsGrid
        data={{
          monthlyRevenue: chartData,
          totalBills: totalBills,
          growth: growth,
          paymentSplit: {
            Cash: cash,
            UPI: upi,
          },
        }}
      />

 <div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">
    <RevenueChart data={chartData} />
  </div>

  <PaymentModeChart
    paymentSplit={{
      Cash: cash,
      UPI: upi,
    }}
  />
</div>
        <RecentBills
          recentBills={recentBills}
          deletedBills={deletedBills}
        />

<TopItems items={topItems} allBills={bills} />

             {/* INFO SECTION */}      
              <section className="info-section">        
              <div className="info-card">           
                  <h3>Fast & Smart Billing</h3>           
                  <p>Create bills quickly with optimized checkout flow.</p>        
              </div>          
              <div className="info-card">           
                <h3>Real-Time Analytics</h3>           
                <p>Monitor daily, weekly, and monthly revenue.</p>        
              </div>          
              <div className="info-card">           
                  <h3>Secure & Reliable</h3>           
                  <p>Protected with Clerk authentication and secure backend.</p>        
                 </div>       
             </section>

    </div>
  );
}