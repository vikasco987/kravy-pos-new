import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function generateManualInvoicePDF(data: any) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
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
  const companyInfo = data.companyInfo || {};
  const companyName = companyInfo.name || "Kravy Software";
  const address1 = companyInfo.address1 || "House No. 599, 3rd Floor";
  const address2 = companyInfo.address2 || "Rajokri, New Delhi, India, 110038";
  const companyGst = companyInfo.gst || "GSTIN: 07CFNPV4928Q1Z9";

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
  const documentTitle = data.documentType === "proforma" ? "PROFORMA INVOICE" : "TAX INVOICE";
  const titleWidth = bold.widthOfTextAtSize(documentTitle, 20);
  page.drawText(documentTitle, {
    x: (595 - titleWidth) / 2,
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
  let rawAddr = `${data.customerAddress || ""}, ${data.customerDistrict || ""}, ${data.customerState || ""} - ${data.customerPincode || ""}`;
  rawAddr = rawAddr.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*-/, ' -').trim();
  
  const addrWords = rawAddr.split(' ');
  let addrLines = [];
  let currLine = "";
  for (const w of addrWords) {
    if (!w) continue;
    const testLine = currLine ? currLine + " " + w : w;
    if (font.widthOfTextAtSize(testLine, 9) > 300) {
      if (currLine) addrLines.push(currLine);
      currLine = w;
    } else {
      currLine = testLine;
    }
  }
  if (currLine) addrLines.push(currLine);

  for (let i = 0; i < addrLines.length; i++) {
    page.drawText(addrLines[i], { x: leftX, y: billY, size: 9, font, color: greyTextColor });
    if (i < addrLines.length - 1) {
      billY -= 12;
    }
  }
  
  billY -= 14;
  page.drawText(`Phone: ${String(data.customerPhone || "N/A")}`, { x: leftX, y: billY, size: 10, font });
  
  if (data.customerEmail) {
    billY -= 14;
    page.drawText(`Email: ${String(data.customerEmail)}`, { x: leftX, y: billY, size: 10, font });
  }

  if (data.customerGst) {
    billY -= 14;
    page.drawText(`GSTIN: ${String(data.customerGst).toUpperCase()}`, { x: leftX, y: billY, size: 10, font: bold });
  }

  // Invoice Meta
  let metaY = topY;
  page.drawText("Invoice #", { x: rightX, y: metaY, size: 10, font });
  page.drawText(String(data.invoiceNumber || "MANUAL-" + Date.now().toString().slice(-6)), { x: 480, y: metaY, size: 10, font: bold });
  metaY -= 16;
  page.drawText("Date", { x: rightX, y: metaY, size: 10, font });
  page.drawText(new Date(data.date || Date.now()).toLocaleDateString(), { x: 480, y: metaY, size: 10, font });

  if (data.dueDate) {
    metaY -= 16;
    page.drawText(data.documentType === 'proforma' ? "Valid Until" : "Due Date", { x: rightX, y: metaY, size: 10, font });
    page.drawText(new Date(data.dueDate).toLocaleDateString(), { x: 480, y: metaY, size: 10, font });
  }

  if (data.paymentMode) {
    metaY -= 16;
    page.drawText("Payment", { x: rightX, y: metaY, size: 10, font });
    page.drawText(String(data.paymentMode), { x: 480, y: metaY, size: 10, font });
  }

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
    if (itemY < 80) {
        page = pdfDoc.addPage([595, 842]);
        let newTableY = height - 50;
        page.drawRectangle({
          x: 45, y: newTableY, width: 505, height: 25, color: brandColor,
        });
        const rowY = newTableY + 8;
        page.drawText("#", { x: 55, y: rowY, size: 10, font: bold, color: textColor });
        page.drawText("Item & Description", { x: 90, y: rowY, size: 10, font: bold, color: textColor });
        page.drawText("Qty", { x: 340, y: rowY, size: 10, font: bold, color: textColor });
        page.drawText("Rate", { x: 400, y: rowY, size: 10, font: bold, color: textColor });
        page.drawText("Amount", { x: 490, y: rowY, size: 10, font: bold, color: textColor });
        itemY = newTableY - 30;
    }

    const rate = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const itemTotal = rate * qty;
    
    // Add discount text to item name if there's a discount
    let itemName = String(item.name || "N/A");
    if (item.discountValue && item.discountValue > 0) {
        if (item.discountType === "PERCENTAGE") itemName += ` (-${item.discountValue}%)`;
        else itemName += ` (-₹${item.discountValue})`;
    }

    page.drawText(String(index + 1), { x: 55, y: itemY, size: 10, font });
    page.drawText(itemName.slice(0, 45), { x: 90, y: itemY, size: 10, font: bold });
    page.drawText(String(qty), { x: 345, y: itemY, size: 10, font });
    page.drawText(formatRS(rate), { x: 400, y: itemY, size: 10, font });
    page.drawText(formatRS(itemTotal), { x: 490, y: itemY, size: 10, font: bold });
    itemY -= 30;
  });

  /* ---------- PAGE BREAK FOR SUMMARY ---------- */
  if (itemY < 250) {
      page = pdfDoc.addPage([595, 842]);
      itemY = height - 50;
  }

  /* ---------- TAX SUMMARY ---------- */
  itemY -= 20;
  const summaryX = 350;
  const valX = 490;

  if (data.discount && Number(data.discount) > 0) {
      page.drawText("Subtotal", { x: summaryX, y: itemY, size: 10, font, color: greyTextColor });
      page.drawText(formatRS(Number(data.subtotal) || 0), { x: valX, y: itemY, size: 10, font });
      itemY -= 15;
      page.drawText("Discount", { x: summaryX, y: itemY, size: 10, font, color: rgb(0.8, 0.2, 0.2) });
      page.drawText("-" + formatRS(Number(data.discount) || 0), { x: valX, y: itemY, size: 10, font, color: rgb(0.8, 0.2, 0.2) });
      itemY -= 15;
  }

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

  /* ---------- QR CODE (CENTERED) ---------- */
  try {
    const qrText = `INV:${data.invoiceNumber || "N/A"}\nAMT:${finalTotal}\nDATE:${new Date().toLocaleDateString()}`;
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

  /* ---------- BANK DETAILS & TERMS ---------- */
  let extraY = 190;
  
  if (data.bankDetails) {
      page.drawText("Bank Details", { x: 45, y: extraY, size: 9, font: bold, color: brandColor });
      const lines = String(data.bankDetails).split('\n');
      let by = extraY - 12;
      for (const line of lines) {
          page.drawText(line, { x: 45, y: by, size: 8, font, color: greyTextColor });
          by -= 10;
      }
      
      if (data.bankImage) {
          try {
              // Attempt to fetch and embed bank image
              const imgRes = await fetch(data.bankImage);
              const imgBytes = await imgRes.arrayBuffer();
              // Check if png or jpeg
              let embedImg;
              if (data.bankImage.toLowerCase().endsWith('.png')) {
                  embedImg = await pdfDoc.embedPng(imgBytes);
              } else {
                  embedImg = await pdfDoc.embedJpg(imgBytes);
              }
              page.drawImage(embedImg, {
                  x: 45,
                  y: by - 50,
                  width: 100,
                  height: 40,
              });
          } catch (e) {
              console.log("Bank Image Error:", e);
          }
      }
  }

  if (data.termsConditions) {
      page.drawText("Terms & Conditions", { x: 350, y: extraY, size: 9, font: bold, color: brandColor });
      const tLines = String(data.termsConditions).split('\n');
      let ty = extraY - 12;
      for (const line of tLines) {
          // crude word wrap or just substring for safety
          page.drawText(line.slice(0, 50), { x: 350, y: ty, size: 8, font, color: greyTextColor });
          ty -= 10;
      }
  }

  /* ---------- FOOTER TEXT ---------- */
  const disclaimer = `This is a computer generated ${data.documentType === 'proforma' ? 'proforma' : 'tax'} invoice and does not require signature.`;
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
  return pdfBytes;
}
