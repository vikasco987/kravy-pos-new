import re

with open("src/components/Sidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Current hiddenNavGroups starts at: const hiddenNavGroups = [
# and ends right before: import { Loader2 } from "lucide-react";

new_hidden_nav_groups = """
const hiddenNavGroups = [
  {
    group: "SEARCH RESULTS (HIDDEN PAGES)",
    items: [
      { icon: <Settings size={18} />, label: "Account Setup", href: "/dashboard/settings/account", roles: ["ADMIN"] },
      { icon: <Activity size={18} />, label: "Activity Logs", href: "/dashboard/settings/activity", roles: ["ADMIN"] },
      { icon: <Users size={18} />, label: "Customer Preferences", href: "/dashboard/settings/customer", roles: ["ADMIN", "SELLER"] },
      { icon: <Package size={18} />, label: "Inventory Configuration", href: "/dashboard/settings/inventory", roles: ["ADMIN", "SELLER"] },
      { icon: <Award size={18} />, label: "Loyalty Program Settings", href: "/dashboard/settings/loyalty", roles: ["ADMIN", "SELLER"] },
      { icon: <Flame size={18} />, label: "Notification Preferences", href: "/dashboard/settings/notifications", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <LayoutDashboard size={18} />, label: "POS Terminal Layout", href: "/dashboard/settings/pos", roles: ["ADMIN", "SELLER"] },
      { icon: <Shield size={18} />, label: "Active Login Sessions", href: "/dashboard/settings/sessions", roles: ["ADMIN"] },
      { icon: <Menu size={18} />, label: "Sidebar Navigation Customization", href: "/dashboard/settings/sidebar", roles: ["ADMIN", "SELLER", "STAFF"] },
      
      { icon: <Percent size={18} />, label: "Discount Setup", href: "/dashboard/discounts", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <Gift size={18} />, label: "Offers Management", href: "/dashboard/offers", roles: ["ADMIN", "SELLER"] },
      { icon: <Sparkles size={18} />, label: "AI Offers Generator", href: "/dashboard/offers/generator", roles: ["ADMIN", "SELLER"] },
      
      { icon: <PieChart size={18} />, label: "Inventory Reports", href: "/dashboard/inventory/reports", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <PieChart size={18} />, label: "Hotel Room Analytics", href: "/dashboard/rooms/reports", roles: ["ADMIN", "SELLER"] },
      
      { icon: <BarChart3 size={18} />, label: "Advanced Analytics", href: "/dashboard/reports/analytics", roles: ["ADMIN", "SELLER"] },
      { icon: <Receipt size={18} />, label: "Bill Reports", href: "/dashboard/reports/bills", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <ShoppingCart size={18} />, label: "Item-wise Sales", href: "/dashboard/reports/items", roles: ["ADMIN", "SELLER"] },
      { icon: <Banknote size={18} />, label: "Cash Reports", href: "/dashboard/reports/payments/cash", roles: ["ADMIN", "SELLER"] },
      { icon: <Smartphone size={18} />, label: "UPI Reports", href: "/dashboard/reports/payments/upi", roles: ["ADMIN", "SELLER"] },
      
      { icon: <HelpCircle size={18} />, label: "Documentation - GST Billing", href: "/dashboard/docs/gst-billing", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <HelpCircle size={18} />, label: "Documentation - Menu Management", href: "/dashboard/docs/menu-management", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <HelpCircle size={18} />, label: "Documentation - Staff Access", href: "/dashboard/docs/staff-access", roles: ["ADMIN"] },
      { icon: <HelpCircle size={18} />, label: "Documentation - Workflow", href: "/dashboard/docs/workflow", roles: ["ADMIN", "SELLER", "STAFF"] },
      { icon: <HelpCircle size={18} />, label: "Documentation - Auto Backup", href: "/dashboard/docs/auto-backup", roles: ["ADMIN"] }
    ]
  }
];
"""

# We need to make sure we import Gift, Banknote if they are not already imported.
if "Gift," not in content:
    content = content.replace("import { Loader2", "import { Gift, Banknote } from \"lucide-react\";\nimport { Loader2")

start_idx = content.find("const hiddenNavGroups = [")
end_idx = content.find("import { Loader2", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_hidden_nav_groups + "\n" + content[end_idx:]
    with open("src/components/Sidebar.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Sidebar updated with more pages!")
else:
    print("Could not find hiddenNavGroups block.")
