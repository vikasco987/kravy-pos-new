import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function generateInvoice(order: any) {
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

  /* ---------- TAX CALCULATIONS (Inclusive 18%) ---------- */
  const totalAmount = order.amount || 0;
  const taxableAmount = totalAmount / 1.18;
  const totalTax = totalAmount - taxableAmount;
  
  // State-based split: Delhi = CGST/SGST, Other = IGST
  const isDelhi = String(order.customer?.state || "").toLowerCase().includes("delhi");
  const cgst = isDelhi ? totalTax / 2 : 0;
  const sgst = isDelhi ? totalTax / 2 : 0;
  const igst = !isDelhi ? totalTax : 0;

  const formatRS = (val: number) => `Rs ${Number(val).toFixed(2)}`;

  /* ---------- TOP BRANDING BAR (HEADER) ---------- */
  const headerHeight = 110;
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: 595,
    height: headerHeight,
    color: brandColor,
  });

  /* ---------- LOGO ---------- */
  const logoPath = path.join(process.cwd(), "public/logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdfDoc.embedPng(logoBytes);
      const logoSize = 75;
      page.drawImage(logo, {
        x: 45,
        y: height - headerHeight + 18,
        width: logoSize,
        height: logoSize,
      });
    } catch (e) {
      console.log("Logo error:", e);
    }
  }

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
  page.drawText(String(order.customer?.name || "Customer"), { x: leftX, y: billY, size: 10, font });
  
  // Full Address
  billY -= 14;
  const customerAddr = `${order.customer?.house}, ${order.customer?.addressLine}, ${order.customer?.district}, ${order.customer?.state} - ${order.customer?.pincode}`;
  const addrWords = customerAddr.split(' ');
  let addrLines: string[] = [];
  let currentLine = "";
  addrWords.forEach(word => {
     if ((currentLine + word).length < 45) {
         currentLine += " " + word;
     } else {
         addrLines.push(currentLine.trim());
         currentLine = word;
     }
  });
  addrLines.push(currentLine.trim());
  
  addrLines.forEach(line => {
    page.drawText(line, { x: leftX, y: billY, size: 9, font, color: greyTextColor });
    billY -= 12;
  });

  billY -= 4;
  page.drawText(`Phone: ${String(order.customer?.phone || "N/A")}`, { x: leftX, y: billY, size: 10, font });
  
  if (order.customer?.email) {
    billY -= 14;
    page.drawText(`Email: ${String(order.customer.email)}`, { x: leftX, y: billY, size: 10, font });
  }
  
  if (order.customer?.gst) {
    billY -= 14;
    page.drawText(`GSTIN: ${String(order.customer.gst)}`, { x: leftX, y: billY, size: 10, font: bold });
  }

  // Invoice Meta
  let metaY = topY;
  page.drawText("Invoice #", { x: rightX, y: metaY, size: 10, font });
  page.drawText(String(order.invoiceNumber || "N/A"), { x: 480, y: metaY, size: 10, font: bold });
  metaY -= 16;
  page.drawText("Date", { x: rightX, y: metaY, size: 10, font });
  page.drawText(new Date(order.createdAt).toLocaleDateString(), { x: 480, y: metaY, size: 10, font });
  metaY -= 16;
  page.drawText("Txn ID", { x: rightX, y: metaY, size: 10, font });
  page.drawText(String(order.phonepeOrderId || order.merchantOrderId || "N/A").slice(0, 18), { x: 480, y: metaY, size: 8, font });

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
  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((item: any, index: number) => {
    const itemTotal = item.price * item.quantity;
    page.drawText(String(index + 1), { x: 55, y: itemY, size: 10, font });
    page.drawText(String(item.name || "N/A"), { x: 90, y: itemY, size: 10, font: bold });
    page.drawText("Product Service", { x: 90, y: itemY - 12, size: 8, font, color: greyTextColor });
    page.drawText(String(item.quantity), { x: 345, y: itemY, size: 10, font });
    page.drawText(formatRS(item.price), { x: 400, y: itemY, size: 10, font });
    page.drawText(formatRS(itemTotal), { x: 490, y: itemY, size: 10, font: bold });
    itemY -= 45;
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
  page.drawText(formatRS(totalAmount), { x: valX, y: itemY, size: 13, font: bold, color: brandColor });

  /* ---------- PAYMENT DETAILS ---------- */
  itemY -= 60;
  page.drawText("Payment Details", { x: 45, y: itemY, size: 12, font: bold });
  itemY -= 18;
  page.drawText("Mode: Online via PhonePe", { x: 45, y: itemY, size: 10, font });
  itemY -= 14;
  page.drawText(`Reference ID: ${String(order.phonepeOrderId || order.merchantOrderId || "N/A")}`, { x: 45, y: itemY, size: 9, font });

  /* ---------- QR CODE (CENTERED) ---------- */
  try {
    const qrText = `INV:${order.invoiceNumber}\nAMT:${order.amount}\nTXN:${order.phonepeOrderId || order.merchantOrderId}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);
    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: 595 / 2 - 40,
      y: 110,
      width: 80,
      height: 80,
    });
  } catch (e) {
    console.log("QR Error:", e);
  }

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

  /* ---------- BOTTOM BAR ---------- */
  const footerHeight = 35;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595,
    height: footerHeight,
    color: brandColor,
  });

  const contactText = "Phone: 9289507882 | www.kravy.in | support@kravy.in";
  const contactWidth = font.widthOfTextAtSize(contactText, 9);
  page.drawText(contactText, {
    x: (595 - contactWidth) / 2,
    y: 13,
    size: 9,
    font,
    color: textColor,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
