import React from 'react';

interface PrintTemplatesProps {
  receiptRef: React.RefObject<HTMLDivElement | null>;
  kotRef: React.RefObject<HTMLDivElement | null>;
  business: any;
  billNumber: string;
  billDate: string;
  tokenNumber: any;
  selectedTable: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderNotes: string;
  buyerGSTIN: string;
  placeOfSupply: string;
  items: any[];
  subtotal: number;
  discountAmt: number;
  appliedOffer: any;
  taxActive: boolean;
  perProductEnabled: boolean;
  globalRate: number;
  totalTaxable: number;
  totalGst: number;
  taxBreakup: any[];
  deliveryCharge: number;
  deliveryGst: number;
  packagingCharge: number;
  packagingGst: number;
  serviceCharge: number;
  finalTotal: number;
  paymentMode: string;
  paymentStatus: string;
  upiTxnRef: string;
  qrUrl: string;
  prevWalletBalance: number | null;
  selectedParty: any;
  kotNumbers: number[];
  numberToWords: (num: number) => string;
}

const PrintTemplates: React.FC<PrintTemplatesProps> = (props) => {
  const {
    receiptRef, kotRef, business, billNumber, billDate, tokenNumber, selectedTable,
    customerName, customerPhone, customerAddress, orderNotes, buyerGSTIN, placeOfSupply,
    items, subtotal, discountAmt, appliedOffer, taxActive, perProductEnabled,
    globalRate, totalTaxable, totalGst, taxBreakup, deliveryCharge, deliveryGst,
    packagingCharge, packagingGst, serviceCharge, finalTotal, paymentMode,
    paymentStatus, upiTxnRef, qrUrl, prevWalletBalance, selectedParty, numberToWords, kotNumbers
  } = props;

  const ps = business?.printSettings || {};
  const s = (key: string) => ps[key] !== false; // Default to true if not set

  // --- Dynamic Typography Configurations with Thermal Safety Limits ---
  const is80 = ps.paperWidth === '80mm';
  const paperWidthStr = is80 ? '80mm' : '58mm';
  const printableWidthStr = is80 ? '70mm' : '48mm';

  // Thermal safety feed spacing
  const paperBottomPaddingVal = ps.paperBottomPadding !== undefined && ps.paperBottomPadding !== null ? `${ps.paperBottomPadding}px` : '80px';

  const fontFamilyVal = ps.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const kotFontFamilyVal = ps.kotFontFamily || '"Courier New", Courier, monospace';
  const fontWeightVal = ps.fontWeight || '';
  const kotFontWeightVal = ps.kotFontWeight || '';
  
  // Custom font size resolver with min/max safety constraints
  const getClamped = (val: any, def: number, min: number, max: number) => {
    if (val === undefined || val === null || val === "") return def;
    return Math.max(min, Math.min(max, Number(val)));
  };

  const rawBusinessNameSize = getClamped(ps.businessNameSize, 18, 14, 32);
  const businessAddressSize = getClamped(ps.businessAddressSize, 11, 8, 16);
  const taglineSize = getClamped(ps.taglineSize, 11, 8, 14);
  const receiptTokenSize = getClamped(ps.receiptTokenSize, 28, 18, 40);
  const detailsFontSize = getClamped(ps.detailsFontSize, 10, 8, 14);
  const itemsFontSize = getClamped(ps.itemsFontSize, 11, 9, 18);
  const totalFontSize = getClamped(ps.totalFontSize, 13, 11, 24);
  const greetingFontSize = getClamped(ps.greetingFontSize, 12, 9, 18);
  
  const kotTokenSize = getClamped(ps.kotTokenSize, 16, 12, 28);
  const kotItemsFontSize = getClamped(ps.kotItemsFontSize, 11, 9, 18);
  const kotQtyFontSize = getClamped(ps.kotQtyFontSize, 14, 10, 22);

  // --- Auto-Shrink Logic for Long Texts ---
  const getAutoShrunkNameSize = () => {
    let size = rawBusinessNameSize;
    const nameLen = (business?.businessName || "").length;
    if (nameLen > 25) size -= 2;
    if (nameLen > 35) size -= 2;
    return Math.max(14, size);
  };
  const finalBusinessNameSize = getAutoShrunkNameSize();

  const getAutoShrunkAddressSize = () => {
    let size = businessAddressSize;
    const addrLen = (business?.businessAddress || "").length;
    if (addrLen > 60) size -= 1;
    if (addrLen > 100) size -= 1;
    return Math.max(8, size);
  };
  const finalAddressSize = getAutoShrunkAddressSize();

  const dynamicCss = `
    .receipt-container-dynamic {
      --r-font-family: ${fontFamilyVal};
      --r-business-size: ${finalBusinessNameSize}px;
      --r-address-size: ${finalAddressSize}px;
      --r-tagline-size: ${taglineSize}px;
      --r-items-size: ${itemsFontSize}px;
      --r-total-size: ${totalFontSize}px;
      --r-token-size: ${receiptTokenSize}px;
      --r-details-size: ${detailsFontSize}px;
      --r-greeting-size: ${greetingFontSize}px;
      font-family: var(--r-font-family) !important;
      font-size: var(--r-details-size);
    }
    .receipt-container-dynamic, .receipt-container-dynamic * {
      font-family: var(--r-font-family) !important;
    }
    .kot-container-dynamic {
      --k-font-family: ${kotFontFamilyVal};
      --k-items-size: ${kotItemsFontSize}px;
      --k-qty-size: ${kotQtyFontSize}px;
      --k-token-size: ${kotTokenSize}px;
      font-family: var(--k-font-family) !important;
      font-size: var(--k-items-size);
    }
    .kot-container-dynamic, .kot-container-dynamic * {
      font-family: var(--k-font-family) !important;
    }
    
    @media print {
      @page { margin: 0 !important; }
      body { margin: 0 !important; padding: 0 !important; }
      .receipt-container { 
        width: ${paperWidthStr} !important; 
        margin: 0 auto !important; 
        page-break-after: always !important;
        break-after: page !important;
      }
      .kot-container { 
        width: ${paperWidthStr} !important; 
        margin: 0 auto !important; 
        page-break-after: always !important;
        break-after: page !important;
      }
    }
    ${fontWeightVal ? `
    .receipt-container-dynamic, .receipt-container-dynamic * {
      font-weight: ${fontWeightVal} !important;
    }
    ` : ''}
    ${kotFontWeightVal ? `
    .kot-container-dynamic, .kot-container-dynamic * {
      font-weight: ${kotFontWeightVal} !important;
    }
    ` : ''}
  `;

  return (
    <div className="hidden-print">
      {/* Dynamic Styling and Print Scale Adjustments */}
      <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />

      {/* ================= PRINT RECEIPT ================= */}
      <div
        ref={receiptRef}
        data-paper={is80 ? "80" : "58"}
        className="hidden print:block receipt receipt-container receipt-container-dynamic text-black bg-white"
        style={{ 
          width: printableWidthStr, 
          margin: '0 auto',
          padding: is80 ? `0mm 4mm ${paperBottomPaddingVal} 4mm` : `0mm 2mm ${paperBottomPaddingVal} 2mm`, 
          boxSizing: 'border-box',
          WebkitFontSmoothing: 'antialiased',
          overflow: 'hidden',
          marginTop: '-10px',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          // Thermal safety variables
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        {(business?.logoUrl && s('showLogo')) && (
          <div className="flex justify-center mb-0 mt-0 pt-0" style={{ marginTop: '-4mm' }}>
            <img 
              src={business.logoUrl} 
              alt="Logo" 
              className="max-h-[35mm] object-contain" 
              style={{ 
                imageRendering: 'pixelated', 
                filter: 'contrast(1000%) grayscale(100%) brightness(1.1)' 
              }} 
            />
          </div>
        )}
        <div 
          className="text-center font-bold leading-tight mb-1"
          style={{ 
            fontSize: 'var(--r-business-size)',
            fontWeight: ps.businessNameWeight || undefined
          }}
        >
          {business?.businessName}
        </div>
        {(business?.businessTagLine && s('showTagline')) && (
          <div 
            className="text-center font-bold italic opacity-90 mb-1 leading-none uppercase tracking-tight"
            style={{ 
              fontSize: 'var(--r-tagline-size)',
              fontWeight: ps.taglineWeight || undefined
            }}
          >
            {business.businessTagLine}
          </div>
        )}
        {((business?.businessAddress || business?.district || business?.state || business?.pinCode) && s('showAddress')) && (
          <div 
            className="text-center font-bold leading-tight mt-1"
            style={{ 
              fontSize: 'var(--r-address-size)',
              fontWeight: ps.businessAddressWeight || undefined
            }}
          >
            {business?.businessAddress}
            {business?.district && `, ${business.district}`}
            {business?.state && `, ${business.state}`}
            {business?.pinCode && ` - ${business.pinCode}`}
          </div>
        )}
        {((business?.contactPersonPhone || business?.contactPhone || business?.businessPhone) && s('showContact')) && (
          <div className="text-center font-bold mt-0.5" style={{ fontSize: 'var(--r-details-size)', fontWeight: ps.detailsWeight || undefined }}>
            {business?.phonePrefixType?.toString().toUpperCase() === 'SYMBOL' ? '📞 ' : 'Mob: '} {business.contactPersonPhone || business.contactPhone || business.businessPhone}
          </div>
        )}
        {(business?.gstNumber && s('showGST')) && (
          <div className="text-center font-bold border-y border-black py-1 mt-2 mb-1" style={{ fontSize: 'var(--r-details-size)', fontWeight: ps.detailsWeight || undefined }}>
            GSTIN: {business.gstNumber}
          </div>
        )}
        {(business?.fssaiNumber && business?.fssaiEnabled && s('showFSSAI')) && (
          <div className="text-center font-bold mt-0.5" style={{ fontSize: 'var(--r-details-size)', fontWeight: ps.detailsWeight || undefined }}>
            FSSAI: {business.fssaiNumber}
          </div>
        )}
        
        <div className="mt-3 border-t border-dashed border-gray-400 pt-2 px-1" style={{ fontSize: 'var(--r-details-size)' }}>
          <div className="flex justify-between items-center mb-1">
            <div className="font-black uppercase tracking-tight">Bill Summary</div>
            {selectedTable && (
              <div className="font-black uppercase border-2 border-black text-black px-1.5 py-0.5 rounded-sm" style={{ fontSize: 'calc(var(--r-details-size) - 2px)' }}>
                {selectedTable === "POS" ? "COUNTER" : selectedTable.replace("TYPE: ", "")}
              </div>
            )}
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5" style={{ fontSize: 'var(--r-details-size)' }}>
              <div className="font-black">No: {billNumber}</div>
              <div className="font-black">{billDate}</div>
            </div>
          </div>
        </div>

        {/* 🔥 SIMPLE CLEAN TOKEN DISPLAY 🔥 */}
        {(() => {
          const tn = tokenNumber;
          const displayToken = (() => {
            if (tn == null || tn === "" || tn === "---" || tn === 0) return null;
            if (typeof tn === 'object' && tn.$numberLong) return tn.$numberLong.toString().padStart(3, '0');
            return tn.toString().padStart(3, '0');
          })();

          if (displayToken && s('showToken')) {
            return (
              <div style={{ textAlign: 'center', margin: '10px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0' }}>
                <div style={{ fontSize: 'calc(var(--r-details-size) - 1px)', fontWeight: ps.receiptTokenWeight || '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Token No.</div>
                <div style={{ fontSize: 'var(--r-token-size)', fontWeight: ps.receiptTokenWeight || '900', lineHeight: '1', marginTop: '4px' }}>#{displayToken}</div>
              </div>
            );
          }
          return null;
        })()}

        {((customerName || customerPhone || customerAddress || orderNotes || buyerGSTIN) && s('showCustomerDetails')) && (
          <div className={`mt-2 font-black ${s('sepCustomer') ? 'border-t-2 border-dashed border-black' : ''} pt-1`} style={{ fontSize: 'var(--r-details-size)', fontWeight: ps.detailsWeight || undefined }}>
            {customerName && <div>Customer: {customerName}</div>}
            {customerPhone && <div>Phone: {customerPhone}</div>}
            {buyerGSTIN && <div className="uppercase">Buyer GST: {buyerGSTIN}</div>}
            {customerAddress && <div className="mt-0.5" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>Addr: {customerAddress}</div>}
            {orderNotes && <div className="mt-0.5 italic">Note: {orderNotes}</div>}
          </div>
        )}

        <div className="mt-1 text-center font-bold" style={{ fontSize: 'var(--r-details-size)', fontWeight: ps.detailsWeight || undefined }}>
          {placeOfSupply && <div>Place of Supply: {placeOfSupply}</div>}
        </div>
        
        <div className={`flex justify-between font-bold uppercase ${s('sepItemsHeader') ? 'border-b border-dashed border-black py-1 my-1' : 'my-1'}`} style={{ fontSize: 'var(--r-details-size)', fontWeight: ps.itemsWeight || undefined }}>
          <span className="flex-1 min-w-0 pr-1">Item Description</span>
          {is80 && <span className="w-[22mm] text-center shrink-0 pr-2">Qty x Rate</span>}
          <span className="w-[12mm] text-right shrink-0">Total</span>
        </div>
        
        {items.map((i, idx) => {
          const itemRate = (perProductEnabled && i.gst !== undefined && i.gst !== null) ? i.gst : (taxActive ? globalRate : 0);
          return (
            <div key={idx} className="mb-2 border-b border-dotted border-black/20 pb-1" style={{ fontSize: 'var(--r-items-size)' }}>
              {is80 ? (
                /* Spacious 80mm/3-inch Row Design: Proper columns */
                <div className="flex justify-between items-start font-bold" style={{ fontWeight: ps.itemsWeight || undefined }}>
                  <span className="flex-1 min-w-0 pr-1 break-words leading-[1.2]">
                    {s('showFoodTypeSuffix') ? i.name : i.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                    {((business?.hsnEnabled && i.hsnCode) ? ` (HSN: ${i.hsnCode})` : "")}
                  </span>
                  <span className="w-[22mm] text-center shrink-0 pr-2">{i.qty} x ₹{Number(i.rate ?? 0).toFixed(2)}</span>
                  <span className="w-[12mm] text-right shrink-0">₹{(Number(i.qty ?? 0) * Number(i.rate ?? 0)).toFixed(2)}</span>
                </div>
              ) : (
                /* Compact 58mm/2-inch Row Design */
                <>
                  <div className="flex justify-between items-start font-bold" style={{ fontWeight: ps.itemsWeight || undefined }}>
                    <span className="flex-1 min-w-0 pr-1 break-words leading-[1.2]">
                      {s('showFoodTypeSuffix') ? i.name : i.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                    </span>
                    <span className="w-[12mm] text-right shrink-0">₹{(Number(i.qty ?? 0) * Number(i.rate ?? 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold mt-0.5" style={{ fontSize: 'calc(var(--r-items-size) - 1px)', fontWeight: ps.itemsWeight || undefined }}>
                    <span>{i.qty} x ₹{Number(i.rate ?? 0).toFixed(2)}</span>
                    <span className="font-bold">
                      {((business?.hsnEnabled && i.hsnCode) ? `HSN: ${i.hsnCode}` : "")} 
                      {(taxActive || perProductEnabled) ? ` | GST: ${itemRate}%` : ""}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {s('sepTotalTop') && <div className="my-1 border-t-2 border-black" />}
        
        <div className="space-y-1" style={{ fontSize: 'var(--r-items-size)' }}>
          {s('showSubtotal') && <div className="flex justify-between font-bold"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>}
          {(discountAmt > 0 && s('showDiscount')) && (
            <div className="flex justify-between font-bold italic">
              <span>Discount ({appliedOffer?.code})</span>
              <span>- ₹{discountAmt.toFixed(2)}</span>
            </div>
          )}
          {(taxActive || perProductEnabled) && (
            <>
              {s('showTaxableAmt') && <div className="flex justify-between font-bold" style={{ fontSize: 'var(--r-details-size)' }}><span>Taxable Amt</span><span>₹{totalTaxable.toFixed(2)}</span></div>}
              {s('showTotalTax') && <div className="flex justify-between font-bold" style={{ fontSize: 'var(--r-details-size)' }}><span>Total Tax</span><span>₹{totalGst.toFixed(2)}</span></div>}
            </>
          )}
          {(deliveryCharge > 0 && s('showDeliveryCharges')) && (
            <>
              <div className="flex justify-between items-center font-bold mt-0.5" style={{ fontSize: 'var(--r-details-size)' }}>
                <span>DELIVERY CHARGES</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              {deliveryGst > 0 && (
                <div className="flex justify-between items-center font-bold italic" style={{ fontSize: 'calc(var(--r-details-size) - 2px)' }}>
                  <span className="pl-2">└ Tax on Delivery ({business?.deliveryGstRate}%)</span>
                  <span>₹{deliveryGst.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {(packagingCharge > 0 && s('showPackagingCharges')) && (
            <>
              <div className="flex justify-between items-center font-bold mt-0.5" style={{ fontSize: 'var(--r-details-size)' }}>
                <span>PACKAGING CHARGES</span>
                <span>₹{packagingCharge.toFixed(2)}</span>
              </div>
              {packagingGst > 0 && (
                <div className="flex justify-between items-center font-bold italic" style={{ fontSize: 'calc(var(--r-details-size) - 2px)' }}>
                  <span className="pl-2">└ Tax on Packaging ({business?.packagingGstRate}%)</span>
                  <span>₹{packagingGst.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {(serviceCharge > 0 && s('showServiceCharge')) && (
            <div className="flex justify-between items-center font-bold mt-0.5" style={{ fontSize: 'var(--r-details-size)' }}>
              <span>SERVICE CHARGE</span>
              <span>₹{serviceCharge.toFixed(2)}</span>
            </div>
          )}
          {s('sepTotalTop') && <div className="border-t-2 border-dashed border-black my-1" />}
          <div 
            className={`flex justify-between font-black ${s('sepTotalBottom') ? 'border-y-2 border-black py-2 my-1.5' : 'my-1.5'} uppercase bg-white px-1`} 
            style={{ fontSize: 'var(--r-total-size)', fontWeight: ps.totalWeight || undefined }}
          >
            <span>GRAND TOTAL</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {(taxActive || perProductEnabled) && taxBreakup.length > 0 && s('showTaxBreakup') && (
          <div className="mt-3" style={{ fontSize: 'var(--r-details-size)' }}>
            <div className="font-black border-b border-dashed border-black mb-1 pb-0.5">GST TAX BREAKUP</div>
            <table className="w-full border-collapse font-bold" style={{ fontSize: 'calc(var(--r-details-size) - 1px)' }}>
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left font-bold">Rate</th>
                  <th className="text-right font-bold">Taxable</th>
                  {taxBreakup.some(g => g.igst > 0) ? (
                    <th className="text-right font-bold">IGST</th>
                  ) : (
                    <>
                      <th className="text-right font-bold">CGST</th>
                      <th className="text-right font-bold">SGST</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {taxBreakup.map((g, idx) => (
                  <tr key={idx}>
                    <td className="text-left">{g.rate}%</td>
                    <td className="text-right">{g.taxable.toFixed(2)}</td>
                    {g.igst > 0 ? (
                      <td className="text-right">{g.igst.toFixed(2)}</td>
                    ) : (
                      <>
                        <td className="text-right">{g.cgst.toFixed(2)}</td>
                        <td className="text-right">{g.sgst.toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t-2 border-black mt-1" />
          </div>
        )}

        {s('showAmountInWords') && (
          <div className="mt-2 italic font-bold" style={{ fontSize: 'var(--r-details-size)' }}>
            Amount in Words: {numberToWords(finalTotal)}
          </div>
        )}

        {s('showPaymentStatus') && (
          <div 
            className={`mt-3 ${s('sepPayment') ? 'border-t-2 border-dashed border-black' : ''} pt-1 flex justify-between font-bold`}
            style={{ fontSize: 'var(--r-items-size)' }}
          >
            <span>Payment: {paymentMode}</span>
            <span>Status: {paymentStatus}</span>
          </div>
        )}
        
        {((business?.upi && business?.upiQrEnabled !== false) || paymentMode === "UPI") && (
          <div className="mt-2 text-center font-bold border-t border-dashed border-black pt-2" style={{ fontSize: 'var(--r-details-size)' }}>
            {(business?.upi && business?.upiQrEnabled !== false) && (
              <>
                <div className="font-bold mb-1" style={{ fontSize: 'var(--r-items-size)' }}>SCAN & PAY</div>
                <div className="my-2 text-center">
                  <div className="inline-block border-2 border-black p-1 bg-white">
                    <img src={qrUrl} alt="UPI QR" className="w-[30mm] h-[30mm] object-contain block" style={{ imageRendering: 'pixelated', filter: 'contrast(1000%) grayscale(100%)' }} />
                  </div>
                </div>
                <div className="mb-2 font-bold" style={{ fontSize: 'var(--r-items-size)' }}>UPI: {business.upi}</div>
              </>
            )}
            {paymentMode === "UPI" && (
              <div className="text-center" style={{ fontSize: 'var(--r-details-size)' }}>Txn Ref: {upiTxnRef || "Pending"}</div>
            )}
          </div>
        )}
        {business?.enableMenuQRInBill && (
          <div className="mt-2 text-center border-t-2 border-black pt-2">
            <div className="font-black mb-1 uppercase tracking-tighter" style={{ fontSize: 'var(--r-items-size)' }}>Scan to View Digital Menu</div>
            <div className="my-2 text-center">
              <div className="inline-block border-2 border-black p-1 bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${business?.userId}`)}`} 
                  alt="Menu QR" 
                  className="w-[30mm] h-[30mm] object-contain block mx-auto" 
                  style={{ imageRendering: 'pixelated', filter: 'contrast(300%) grayscale(100%)' }}
                />
              </div>
            </div>
          </div>
        )}
        {s('showReviewQR') && business?.reviewUrl && (
          <div className="mt-2 text-center border-t-2 border-black pt-2">
            <div className="font-black mb-1 uppercase tracking-tighter" style={{ fontSize: 'var(--r-items-size)' }}>Rate Your Experience</div>
            <div className="my-2 text-center">
              <div className="inline-block border-2 border-black p-1 bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(business.reviewUrl)}`} 
                  alt="Review QR" 
                  className="w-[30mm] h-[30mm] object-contain block mx-auto" 
                  style={{ imageRendering: 'pixelated', filter: 'contrast(300%) grayscale(100%)' }}
                />
              </div>
            </div>
          </div>
        )}
        {selectedParty && (
          <div className="mt-2 border-t border-dashed border-black pt-2 font-bold space-y-0.5" style={{ fontSize: 'var(--r-details-size)' }}>
            <div className="flex justify-between uppercase">
              <span>Wallet (Opening)</span>
              <span>₹{(prevWalletBalance ?? selectedParty.walletBalance + (paymentMode === 'Wallet' ? finalTotal : 0)).toFixed(2)}</span>
            </div>
            {paymentMode === "Wallet" ? (
               <div className="flex justify-between uppercase text-rose-600 font-black">
                 <span>Wallet (Deducted)</span>
                 <span>- ₹{finalTotal.toFixed(2)}</span>
               </div>
            ) : null}
            <div className="flex justify-between uppercase text-indigo-600 font-black border-t border-dotted border-black/30 mt-0.5 pt-0.5">
              <span>Wallet (Closing)</span>
              <span>₹{selectedParty.walletBalance?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        )}

        <div className={`mt-4 ${s('sepFooter') ? 'border-t-2 border-black' : ''} pt-2 text-center`}>
          {s('showGreetings') && (
            <div 
              className="font-black italic tracking-widest uppercase mb-1" 
              style={{ fontSize: 'var(--r-greeting-size)', fontWeight: ps.greetingWeight || undefined }}
            >
              {business?.greetingMessage || "Thank You!"}
            </div>
          )}
          {s('showVisitAgain') && <div className="font-bold" style={{ fontSize: 'calc(var(--r-details-size) - 1px)' }}>Visit Again for Fresh Food</div>}
          {s('showPoweredBy') && <div className="mt-3 font-bold" style={{ fontSize: 'calc(var(--r-details-size) - 2px)' }}>Powered by Kravy</div>}
        </div>
      </div>

      {/* ================= KOT TEMPLATE ================= */}
      <div
        ref={kotRef}
        data-paper={is80 ? "80" : "58"}
        className="hidden print:block kot kot-container kot-container-dynamic text-black bg-white"
        style={{ 
          width: printableWidthStr, 
          margin: '0 auto', 
          padding: is80 ? `0mm 4mm ${paperBottomPaddingVal} 4mm` : `0mm 2mm ${paperBottomPaddingVal} 2mm`, 
          boxSizing: 'border-box', 
          overflow: 'hidden',
          // KOT safety features
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        <div className="text-center font-black border-b-2 border-black pb-1 mb-2" style={{ fontSize: 'calc(var(--k-items-size) * 1.8)' }}>K.O.T</div>
        
        <div className="flex flex-wrap justify-between items-center font-black mb-2 px-0.5 gap-y-1" style={{ fontSize: 'var(--k-items-size)' }}>
          <div className="border-2 border-black text-black px-1.5 py-1 rounded-sm font-black whitespace-nowrap" style={{ fontSize: 'calc(var(--k-items-size) - 1px)' }}>
            {selectedTable === "POS" ? "COUNTER" : 
             selectedTable === "TAKEAWAY" ? "TAKEAWAY" : 
             selectedTable === "DELIVERY" ? "DELIVERY" : 
             `TABLE: ${selectedTable}`}
          </div>
          {s('showKOTToken') && (
            <div className="text-right leading-none">
              <div style={{ fontSize: 'calc(var(--k-items-size) - 3px)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Token No.</div>
              <div 
                className="font-black"
                style={{ fontSize: 'var(--k-token-size)', fontWeight: ps.kotTokenWeight || undefined }}
              >
                #{(() => {
                  if (tokenNumber != null && tokenNumber !== "" && tokenNumber !== "---") {
                    return tokenNumber;
                  }
                  return "---";
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="border-y border-dashed border-black py-1 mb-2 font-bold" style={{ fontSize: 'calc(var(--k-items-size) - 1px)' }}>
          {s('showKOTBillNo') && (
            <div className="flex justify-between">
              <span>Bill: {billNumber}</span>
              {s('showKOTTime') && <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          )}
          {(customerName && s('showKOTCustomer')) && <div className="mt-0.5 truncate">Cust: {customerName}</div>}
        </div>

        <table className="w-full border-collapse font-black" style={{ fontSize: 'var(--k-items-size)' }}>
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-1 uppercase">Item Description</th>
              <th className="text-right py-1 w-[5mm] shrink-0">QTY</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const newItems = items.filter(i => i.isNew);
              const itemsToPrint = newItems.length > 0 ? newItems : items;
              return itemsToPrint.map((i, idx) => (
                <tr key={idx} className="border-b border-dotted border-black/30" style={{ fontWeight: ps.kotItemsWeight || undefined }}>
                  <td className="py-2 pr-2 leading-[1.1] uppercase">
                  {s('showFoodTypeSuffix') ? i.name : i.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                     {i.variants && i.variants.length > 0 && (
                       <div className="font-bold lowercase" style={{ fontSize: 'calc(var(--k-items-size) - 2px)' }}>
                          ({i.variants.map((v:any) => v.name).join(', ')})
                       </div>
                     )}
                  </td>
                  <td className="text-right py-2 align-top font-black" style={{ fontSize: 'var(--k-qty-size)', fontWeight: ps.kotQtyWeight || undefined }}>x{i.qty}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>

        {(orderNotes && s('showKOTInstructions')) && (
          <div className={`mt-3 p-2 ${s('sepKOTInstructions') ? 'border-2 border-black bg-black/5' : ''} rounded-sm`}>
            <div className="font-black uppercase mb-1 border-b border-black" style={{ fontSize: 'calc(var(--k-items-size) - 2px)' }}>Chef Instructions:</div>
            <div className="font-bold italic leading-tight" style={{ fontSize: 'var(--k-items-size)' }}>{orderNotes}</div>
          </div>
        )}

        <div className="mt-4 border-t-2 border-black pt-2 text-center" style={{ fontSize: 'calc(var(--k-items-size) - 2px)' }}>
          <div className="font-black uppercase">End of KOT</div>
          <div className="font-bold mt-1">{billDate}</div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplates;
