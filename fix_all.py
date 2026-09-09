import re

# 1. Update token expiries to 90d
files = [
    "src/app/api/auth/login/route.ts",
    "src/app/api/auth/refresh-token/route.ts",
    "src/app/api/staff/login/route.ts",
    "src/app/api/staff/refresh-token/route.ts"
]

for file in files:
    try:
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()

        # Update sign( expiresIn: "15m" ) -> "90d"
        content = content.replace('expiresIn: "15m"', 'expiresIn: "90d"')
        content = content.replace("expiresIn: '15m'", 'expiresIn: "90d"')
        
        # Update cookie maxAge: 15 * 60 -> 90 * 24 * 60 * 60
        content = content.replace("maxAge: 15 * 60", "maxAge: 90 * 24 * 60 * 60")
        
        with open(file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated expiry in {file}")
    except Exception as e:
        print(f"Failed to update {file}: {e}")

# 2. Update workflow page
workflow_path = "src/app/dashboard/workflow/page.tsx"
with open(workflow_path, "r", encoding="utf-8") as f:
    wf = f.read()

# Fix setTimeout 400 -> 50
wf = wf.replace("}, 400);", "}, 50);")
# Fix setTimeout 100 -> 10
wf = wf.replace("setTimeout(() => handlePrint(\"BILL\", o, tbl || undefined), 100);", "setTimeout(() => handlePrint(\"BILL\", o, tbl || undefined), 10);")

# Fix API concurrency in handleCheckout
original_checkout = '''            const res = await fetch("/api/bill-manager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(billData) });
            if (!res.ok) throw new Error("fail");

            // Only update status if not already COMPLETED (to avoid loop)
            if (order.status !== "COMPLETED") {
                await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: targetOrderId, status: "COMPLETED" }) });
            }'''

new_checkout = '''            const p1 = fetch("/api/bill-manager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(billData) });
            const p2 = order.status !== "COMPLETED" 
                ? fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: targetOrderId, status: "COMPLETED" }) })
                : Promise.resolve({ ok: true });

            const [res1, res2] = await Promise.all([p1, p2]);
            if (!res1.ok) throw new Error("fail");'''

wf = wf.replace(original_checkout, new_checkout)

with open(workflow_path, "w", encoding="utf-8") as f:
    f.write(wf)
print("Updated workflow page")

