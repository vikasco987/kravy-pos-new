export function printBarcodeLabel(item: any, business: any) {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.top = "-9999px";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const barcodeValue = item.inventoryCode || item.barcode || item.id.substring(item.id.length - 6).toUpperCase();
    const itemName = item.name;
    const price = item.sellingPrice || item.price || 0;
    const businessName = business?.businessName || "Kravy POS";

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Label</title>
            <style>
                @page { margin: 0; size: 50mm 25mm; }
                body {
                    margin: 0;
                    padding: 0;
                    width: 50mm;
                    height: 25mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    box-sizing: border-box;
                    background: #fff;
                    color: #000;
                }
                .business { font-size: 8px; font-weight: bold; text-align: center; line-height: 1; margin-bottom: 2px;}
                .name { font-size: 9px; font-weight: bold; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 48mm; line-height: 1; margin-bottom: 2px;}
                .price { font-size: 10px; font-weight: bold; line-height: 1; margin-top: 1px;}
                svg { max-height: 10mm; max-width: 45mm; }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
            <div class="business">${businessName}</div>
            <div class="name">${itemName}</div>
            <svg id="barcode"></svg>
            <div class="price">MRP: ₹${price}</div>
            
            <script>
                JsBarcode("#barcode", "${barcodeValue}", {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 10,
                    margin: 0,
                    height: 35
                });
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 300);
                };
            </script>
        </body>
        </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    // Clean up
    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 10000); // give enough time for print dialog to show up
}
