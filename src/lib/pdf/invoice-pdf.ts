import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export async function generateManualInvoicePDF(data: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  // Branding Colors (Indigo / Blue)
  const brandColor = rgb(0.149, 0.278, 0.878);
  const textColor = rgb(1, 1, 1);
  const darkTextColor = rgb(0.1, 0.1, 0.1);
  const greyTextColor = rgb(0.4, 0.4, 0.4);

  /* ---------- TAX CALCULATIONS ---------- */
  const totalAmount = Number(data.total) || 0;
  const isTaxInclusive = data.taxType === "inclusive";
  
  let taxableAmount = 0;
  let totalTax = 0;
  
  if (isTaxInclusive) {
    taxableAmount = totalAmount / 1.18;
    totalTax = totalAmount - taxableAmount;
  } else {
    taxableAmount = totalAmount;
    totalTax = totalAmount * 0.18;
  }
  
  const finalTotal = taxableAmount + totalTax;

  const isDelhi = String(data.customerState || "").toLowerCase().includes("delhi");
  const cgst = isDelhi ? totalTax / 2 : 0;
  const sgst = isDelhi ? totalTax / 2 : 0;
  const igst = !isDelhi ? totalTax : 0;

  const formatRS = (val: number) => `Rs ${val.toFixed(2)}`;

  /* ---------- TOP BRANDING BAR (HEADER) ---------- */
  const headerHeight = 110;
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: 595,
    height: headerHeight,
    color: brandColor,
  });

  /* ---------- COMPANY INFO (TOP RIGHT) ---------- */
  const companyName = "Kravy Software";
  const address1 = "House No. 599, 3rd Floor";
  const address2 = "Rajokri, New Delhi, India, 110038";
  const companyGst = "GSTIN: 07CFNPV4928Q1Z9";

  const infoX = 400;
  let infoY = height - 30;

  page.drawText(companyName, { x: infoX, y: infoY, size: 18, font: bold, color: textColor });
  infoY -= 16;
  page.drawText(address1, { x: infoX, y: infoY, size: 9, font, color: textColor });
  infoY -= 13;
  page.drawText(address2, { x: infoX, y: infoY, size: 9, font, color: textColor });
  infoY -= 13;
  page.drawText(companyGst, { x: infoX, y: infoY, size: 9, font, color: textColor });

  /* ---------- INVOICE TITLE ---------- */
  page.drawText("TAX INVOICE", {
    x: 595 / 2 - 60,
    y: height - 160,
    size: 20,
    font: bold,
    color: darkTextColor,
  });

  /* ---------- BILL TO (LEFT) & INVOICE DETAILS (RIGHT) ---------- */
  let topY = height - 210;
  const leftX = 45;
  const rightX = 380;

  // Bill To
  page.drawText("Bill To", { x: leftX, y: topY, size: 11, font: bold });
  let billY = topY - 18;
  page.drawText(String(data.customerName || "Customer"), { x: leftX, y: billY, size: 10, font });
  
  billY -= 14;
  const customerAddr = `${data.customerAddress || ""}, ${data.customerDistrict || ""}, ${data.customerState || ""} - ${data.customerPincode || ""}`;
  page.drawText(customerAddr.slice(0, 60), { x: leftX, y: billY, size: 9, font, color: greyTextColor });
  
  billY -= 12;
  page.drawText(`Phone: ${String(data.customerPhone || "N/A")}`, { x: leftX, y: billY, size: 10, font });
  
  if (data.customerEmail) {
    billY -= 14;
    page.drawText(`Email: ${String(data.customerEmail)}`, { x: leftX, y: billY, size: 10, font });
  }

  // Invoice Meta
  let metaY = topY;
  page.drawText("Invoice #", { x: rightX, y: metaY, size: 10, font });
  page.drawText(String(data.invoiceNumber || "MANUAL-" + Date.now().toString().slice(-6)), { x: 480, y: metaY, size: 10, font: bold });
  metaY -= 16;
  page.drawText("Date", { x: rightX, y: metaY, size: 10, font });
  page.drawText(new Date().toLocaleDateString(), { x: 480, y: metaY, size: 10, font });

  /* ---------- TABLE HEADER ---------- */
  let tableY = height - 350;
  page.drawRectangle({
    x: 45,
    y: tableY,
    width: 505,
    height: 25,
    color: brandColor,
  });

  const rowY = tableY + 8;
  page.drawText("#", { x: 55, y: rowY, size: 10, font: bold, color: textColor });
  page.drawText("Item & Description", { x: 90, y: rowY, size: 10, font: bold, color: textColor });
  page.drawText("Qty", { x: 340, y: rowY, size: 10, font: bold, color: textColor });
  page.drawText("Rate", { x: 400, y: rowY, size: 10, font: bold, color: textColor });
  page.drawText("Amount", { x: 490, y: rowY, size: 10, font: bold, color: textColor });

  /* ---------- ITEMS ---------- */
  let itemY = tableY - 30;
  const items = data.items || [{ name: "SaaS Subscription / Service", quantity: 1, price: taxableAmount }];
  
  items.forEach((item: any, index: number) => {
    const rate = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const itemTotal = rate * qty;
    
    page.drawText(String(index + 1), { x: 55, y: itemY, size: 10, font });
    page.drawText(String(item.name || "N/A"), { x: 90, y: itemY, size: 10, font: bold });
    page.drawText(String(qty), { x: 345, y: itemY, size: 10, font });
    page.drawText(formatRS(rate), { x: 400, y: itemY, size: 10, font });
    page.drawText(formatRS(itemTotal), { x: 490, y: itemY, size: 10, font: bold });
    itemY -= 30;
  });

  /* ---------- TAX SUMMARY ---------- */
  itemY -= 20;
  const summaryX = 350;
  const valX = 490;

  page.drawText("Taxable Amount", { x: summaryX, y: itemY, size: 10, font, color: greyTextColor });
  page.drawText(formatRS(taxableAmount), { x: valX, y: itemY, size: 10, font });
  itemY -= 15;

  if (isDelhi) {
    page.drawText(`CGST (9%)`, { x: summaryX, y: itemY, size: 10, font, color: greyTextColor });
    page.drawText(formatRS(cgst), { x: valX, y: itemY, size: 10, font });
    itemY -= 15;
    page.drawText(`SGST (9%)`, { x: summaryX, y: itemY, size: 10, font, color: greyTextColor });
    page.drawText(formatRS(sgst), { x: valX, y: itemY, size: 10, font });
    itemY -= 15;
  } else {
    page.drawText(`IGST (18%)`, { x: summaryX, y: itemY, size: 10, font, color: greyTextColor });
    page.drawText(formatRS(igst), { x: valX, y: itemY, size: 10, font });
    itemY -= 15;
  }

  /* ---------- TOTAL ---------- */
  page.drawRectangle({ x: summaryX, y: itemY - 5, width: 200, height: 1, color: rgb(0.9, 0.9, 0.9) });
  itemY -= 20;
  page.drawText("Grand Total", { x: summaryX, y: itemY, size: 13, font: bold });
  page.drawText(formatRS(finalTotal), { x: valX, y: itemY, size: 13, font: bold, color: brandColor });

  /* ---------- FOOTER TEXT ---------- */
  const disclaimer = "This is a computer generated tax invoice and does not require signature.";
  const disclaimerWidth = font.widthOfTextAtSize(disclaimer, 8);
  page.drawText(disclaimer, {
    x: (595 - disclaimerWidth) / 2,
    y: 70,
    size: 8,
    font,
    color: greyTextColor,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
