import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import DateFilter from "../../components/date-filter";
import { ChevronLeft, Package, TrendingUp, IndianRupee, PieChart } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function ItemWiseSalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; category?: string }>;
}) {
  const effectiveId = await getEffectiveClerkId();

  if (!effectiveId) redirect("/sign-in");

  const { range: rangeParam, category: selectedCategory = "All" } = await searchParams;
  const range = Number(rangeParam || 30);

  const endDate = new Date();
  const startDate = new Date();
  
  if (range === 1) {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === 2) {
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate.setDate(endDate.getDate() - range);
  }

  const [bills, menuItems] = await Promise.all([
    prisma.billManager.findMany({
      where: {
        clerkUserId: effectiveId,
        isDeleted: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.item.findMany({
      where: { clerkId: effectiveId },
      include: { category: true }
    })
  ]);

  // Create a map of live menu item categories
  const categoryMap: Record<string, string> = {};
  const allMenuCategories = new Set<string>();
  
  menuItems.forEach(item => {
    if (item.category?.name) {
      categoryMap[item.name] = item.category.name;
      allMenuCategories.add(item.category.name);
    }
  });

  const itemMap: Record<string, { totalSold: number; totalRevenue: number; categories: Set<string> }> = {};
  
  bills.forEach((bill) => {
    let items: any = bill.items;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (items && !Array.isArray(items) && items.items) items = items.items;

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const name = item?.name || "Unknown";
        const quantity = Number(item?.quantity ?? item?.qty ?? 0);
        
        // Robust price detection to match Quick POS logic
        const sPrice = Number(item?.sellingPrice);
        const bPrice = Number(item?.price);
        const rPrice = Number(item?.rate);
        
        const price = !isNaN(sPrice) && item.sellingPrice !== null ? sPrice 
                   : !isNaN(rPrice) && item.rate !== null ? rPrice
                   : !isNaN(bPrice) ? bPrice : 0;
                   
        const revenue = quantity * price;

        if (!itemMap[name]) {
          itemMap[name] = { totalSold: 0, totalRevenue: 0, categories: new Set() };
        }
        
        itemMap[name].totalSold += quantity;
        itemMap[name].totalRevenue += revenue;
        
        // Try to get category from live menu first, then from item JSON
        const liveCategory = categoryMap[name];
        if (liveCategory) {
          itemMap[name].categories.add(liveCategory);
        } else if (item.category?.name) {
          itemMap[name].categories.add(item.category.name);
        }
      });
    }
  });

  const allItems = Object.keys(itemMap)
    .map((name) => ({
      name,
      totalSold: itemMap[name].totalSold,
      totalRevenue: itemMap[name].totalRevenue,
      category: Array.from(itemMap[name].categories).join(", ") || "General",
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Use categories from both live menu and items found in sales
  const categoriesList = ["All", ...Array.from(allMenuCategories).sort(), "General"];
  const uniqueCategories = Array.from(new Set(categoriesList));

  const filteredItems = selectedCategory === "All" 
    ? allItems 
    : allItems.filter(item => item.category.includes(selectedCategory));

  const grandTotalRevenue = filteredItems.reduce((sum, i) => sum + i.totalRevenue, 0);
  const grandTotalSold = filteredItems.reduce((sum, i) => sum + i.totalSold, 0);

  const format = (num: number) => new Intl.NumberFormat("en-IN").format(Math.round(num));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard" style={{
            width: "40px", height: "40px", borderRadius: "12px", background: "var(--kravy-surface)",
            border: "1px solid var(--kravy-border)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--kravy-text-primary)", textDecoration: "none"
          }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>
              Item-wise Sales Report
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontFamily: "monospace" }}>
              Detailed analysis of product performance
            </p>
          </div>
        </div>
        <DateFilter />
      </div>

      {/* ── Category Filter ── */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        overflowX: "auto", 
        paddingBottom: "10px"
      }} className="no-scrollbar">
        {uniqueCategories.map((cat) => (
          <Link
            key={cat}
            href={`/dashboard/reports/items?range=${range}&category=${cat}`}
            style={{
              padding: "10px 20px",
              borderRadius: "14px",
              background: selectedCategory === cat ? "var(--kravy-brand)" : "var(--kravy-surface)",
              color: selectedCategory === cat ? "white" : "var(--kravy-text-secondary)",
              border: `1px solid ${selectedCategory === cat ? "var(--kravy-brand)" : "var(--kravy-border)"}`,
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Items Sold", value: format(grandTotalSold), icon: <Package size={20} />, color: "#8B5CF6" },
          { label: "Total Revenue", value: `₹${format(grandTotalRevenue)}`, icon: <IndianRupee size={20} />, color: "#10B981" },
          { label: "Category Items", value: filteredItems.length, icon: <PieChart size={20} />, color: "#F59E0B" },
          { label: "Top Product", value: filteredItems[0]?.name || "N/A", icon: <TrendingUp size={20} />, color: "#FF6B35" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)",
            borderRadius: "20px", padding: "20px", display: "flex", alignItems: "center", gap: "16px",
            boxShadow: "var(--kravy-card-shadow)"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: `${s.color}15`, border: `1px solid ${s.color}25`,
              display: "flex", alignItems: "center", justifyContent: "center", color: s.color
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--kravy-text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--kravy-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Report Table ── */}
      <div style={{
        background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)",
        borderRadius: "24px", overflow: "hidden", boxShadow: "var(--kravy-card-shadow)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", width: "60px" }}>Sr.</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Rank & Product</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Category</th>
                <th style={{ padding: "18px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Qty Sold</th>
                <th style={{ padding: "18px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Revenue</th>
                <th style={{ padding: "18px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--kravy-text-muted)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📊</div>
                    <p>No sales data found for this period.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const revenueShare = grandTotalRevenue > 0 ? (item.totalRevenue / grandTotalRevenue) * 100 : 0;
                  return (
                    <tr key={item.name} style={{ borderTop: "1px solid var(--kravy-border)", transition: "background 0.2s" }}>
                      <td style={{ padding: "18px 24px", fontSize: "0.85rem", fontWeight: 900, color: "var(--kravy-text-faint)" }}>{String(idx + 1).padStart(2, '0')}</td>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "8px", background: "var(--kravy-bg-2)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem",
                            fontWeight: 900, color: idx < 3 ? "var(--kravy-brand)" : "var(--kravy-text-muted)",
                            border: `1px solid ${idx < 3 ? "var(--kravy-brand)30" : "var(--kravy-border)"}`
                          }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontWeight: 700, color: "var(--kravy-text-primary)" }}>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "8px", background: "var(--kravy-bg-2)",
                          fontSize: "0.7rem", fontWeight: 600, color: "var(--kravy-text-secondary)"
                        }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: "18px 24px", textAlign: "right", fontWeight: 800, color: "var(--kravy-brand)" }}>
                        {format(item.totalSold)}
                      </td>
                      <td style={{ padding: "18px 24px", textAlign: "right", fontWeight: 800, color: "var(--kravy-text-primary)" }}>
                        ₹{format(item.totalRevenue)}
                      </td>
                      <td style={{ padding: "18px 24px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                          <div style={{ width: "60px", height: "6px", background: "var(--kravy-bg-2)", borderRadius: "10px", overflow: "hidden" }}>
                            <div style={{ width: `${revenueShare}%`, height: "100%", background: "var(--kravy-brand)", borderRadius: "10px" }} />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--kravy-text-muted)", width: "40px" }}>
                            {revenueShare.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ── Help Tip ── */}
      <div style={{
        padding: "16px 24px", background: "rgba(79, 70, 229, 0.05)", border: "1px dashed rgba(79, 70, 229, 0.2)",
        borderRadius: "16px", display: "flex", alignItems: "center", gap: "12px", color: "var(--kravy-brand)"
      }}>
        <TrendingUp size={18} />
        <p style={{ fontSize: "0.82rem", fontWeight: 600 }}>
          Tip: Your top 3 products contribute to {filteredItems.slice(0, 3).reduce((s, i) => s + (grandTotalRevenue > 0 ? (i.totalRevenue / grandTotalRevenue) * 100 : 0), 0).toFixed(1)}% of your total revenue.
        </p>
      </div>
    </div>
  );
}
