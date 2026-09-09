import re

with open("src/components/Sidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# We'll just add to the hiddenNavGroups items list
new_items = """      { icon: <HelpCircle size={18} />, label: "Documentation - Auto Backup", href: "/dashboard/docs/auto-backup", roles: ["ADMIN"] },
      
      { icon: <TrendingUp size={18} />, label: "Profit & Loss (P&L)", href: "/dashboard/expenses/pnl", roles: ["ADMIN", "SELLER"] },
      { icon: <FileText size={18} />, label: "Expense Reports", href: "/dashboard/expenses/reports", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <Users size={18} />, label: "Customer Analytics", href: "/dashboard/reports/customers", roles: ["ADMIN", "SELLER"] },
      { icon: <Activity size={18} />, label: "Performance Analytics", href: "/dashboard/reports/performance", roles: ["ADMIN", "SELLER"] },
      { icon: <CalendarDays size={18} />, label: "Monthly Sales Report", href: "/dashboard/reports/sales/monthly", roles: ["ADMIN", "SELLER"] },
      { icon: <CalendarDays size={18} />, label: "Weekly Sales Report", href: "/dashboard/reports/sales/weekly", roles: ["ADMIN", "SELLER"] },
      { icon: <Hash size={18} />, label: "Token Reports", href: "/dashboard/reports/tokens", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <HelpCircle size={18} />, label: "Documentation - GST Pro", href: "/dashboard/docs/gst-category-pro", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <QrCode size={18} />, label: "Website QR Generator", href: "/dashboard/admin/website-qr", roles: ["ADMIN"] },
      { icon: <CreditCard size={18} />, label: "Payment Wallet Deposits", href: "/dashboard/reports/wallet-deposits", roles: ["ADMIN", "SELLER"] },
      { icon: <Gift size={18} />, label: "Rewards Program", href: "/dashboard/rewards", roles: ["ADMIN", "SELLER"] },
"""

content = content.replace(
    '{ icon: <HelpCircle size={18} />, label: "Documentation - Auto Backup", href: "/dashboard/docs/auto-backup", roles: ["ADMIN"] }',
    new_items
)

if "Hash," not in content:
    content = content.replace("import { Loader2", "import { Hash } from \"lucide-react\";\nimport { Loader2")

with open("src/components/Sidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added more links!")
