import re

with open("src/components/Sidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Define hiddenNavGroups
hidden_nav_groups = """
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
      { icon: <Menu size={18} />, label: "Sidebar Navigation Customization", href: "/dashboard/settings/sidebar", roles: ["ADMIN", "SELLER", "STAFF"] }
    ]
  }
];
"""

# Insert hiddenNavGroups right after navGroups definition
content = content.replace("];\nimport { Loader2", "];\n" + hidden_nav_groups + "\nimport { Loader2")

# Replace the map iteration
# Original: {navGroups.map((group, groupIndex) => {
new_map = """        {(() => {
          const allGroups = searchQuery ? [...navGroups, ...hiddenNavGroups] : navGroups;
          return allGroups.map((group, groupIndex) => {"""

content = content.replace("{navGroups.map((group, groupIndex) => {", new_map)

# We need to close the IIFE where navGroups.map ended.
# Original end of mapping:
#           return (
#             <div key={groupIndex} style={{ marginBottom: "24px" }}>
# ...
#             </div>
#           );
#         })}

content = content.replace("          );\n        })}", "          );\n        });\n        })()}")

with open("src/components/Sidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Sidebar updated!")
