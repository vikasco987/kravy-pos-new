import re

with open("src/app/dashboard/fuel/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("<table>")
end_idx = content.find("</table>") + len("</table>")

new_layout = """<div class="center" style="margin-top: 15px; margin-bottom: 5px;">
            COPY / ORIGINAL
          </div>
          <div class="center" style="letter-spacing: 2px;">******************</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>${format(new Date(bill.createdAt), "dd-MMM-yyyy").toUpperCase()}</span>
            <span>${format(new Date(bill.createdAt), "HH:mm:ss")}</span>
          </div>
          <div style="margin-bottom: 2px;">TXN NO: ${bill.billNumber.replace('FB-', '0001604')}</div>
          <div style="margin-bottom: 2px;">INVOICE NO: ${bill.billNumber.replace('FB-', '152')}</div>
          <div style="margin-bottom: 2px;">VEHICLE NO: ${bill.vehicleNo || "NOT ENTERED"}</div>
          <div style="margin-bottom: 2px;">PRESET: ${parseFloat(bill.saleAmount).toFixed(2)} INR</div>
          <div class="center" style="letter-spacing: 2px; margin-top: 5px; margin-bottom: 5px;">******************</div>
          
          <div style="margin-bottom: 2px;">NOZZLE NO : ${nozzleNo}</div>
          <div style="margin-bottom: 2px;">PRODUCT: ${bill.fuelType.toUpperCase()}</div>
          <div style="margin-bottom: 2px;">DENSITY: ${bill.fuelType.toLowerCase().includes('petrol') ? '745.0' : '829.5'} kg/m3</div>
          <div style="margin-bottom: 2px;">RATE&nbsp;&nbsp;&nbsp;&nbsp;: ${parseFloat(bill.rate).toFixed(2)} INR/L</div>
          <div style="margin-bottom: 2px;">VOLUME: ${parseFloat(bill.volume).toFixed(2)} L</div>
          <div style="margin-bottom: 2px;">AMOUNT: ${parseFloat(bill.saleAmount).toFixed(2)} INR</div>
          <div class="center" style="letter-spacing: 2px; margin-top: 5px; margin-bottom: 5px;">******************</div>
          <div class="center" style="margin-top: 10px; font-size: 22px;">Thank You! Visit Again</div>"""

if start_idx != -1:
    content = content[:start_idx] + new_layout + content[end_idx:]
    with open("src/app/dashboard/fuel/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated fuel bill template.")
else:
    print("Table not found.")
