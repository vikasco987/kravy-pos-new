import re

with open("src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('''            paymentStatus: "Pending", 
            customerName: o.customerName || "Walk-in",''', '''            paymentStatus: o.status === "DELETED" ? "DELETED" : o.status === "CANCELLED" ? "CANCELLED" : "Pending", 
            customerName: o.customerName || "Walk-in",''')

content = content.replace('''            orderStatus: o.status, 
            items: o.items, ''', '''            orderStatus: o.status,
            auditNote: o.notes,
            items: o.items, ''')

with open("src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
