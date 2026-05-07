
import React from 'react';

interface PrintTemplatesProps {
  receiptRef: React.RefObject<HTMLDivElement | null>;
  kotRef: React.RefObject<HTMLDivElement | null>;
  business: any;
  billNumber: string;
  billDate: string;
  tokenNumber: string;
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

  return (
    <div className="hidden-print">
      {/* Universal Print Style Reset */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0 !important; }
          body { margin: 0 !important; padding: 0 !important; }
          .receipt-container { width: 58mm !important; margin: 0 auto !important; }
          .kot-container { width: 58mm !important; margin: 0 auto !important; }
        }
      `}} />

      {/* ================= PRINT RECEIPT (58mm Content) ================= */}
      <div
        ref={receiptRef}
        data-paper="58"
        className="hidden print:block receipt receipt-container font-sans text-[11px] leading-tight text-black bg-white"
        style={{ 
          width: '48mm', 
          margin: '0 auto',
          padding: '4mm 2mm 8mm 2mm', 
          boxSizing: 'border-box',
          WebkitFontSmoothing: 'none',
          fontSmooth: 'never',
          overflow: 'hidden'
        }}
      >
        {business?.logoUrl && (
          <div className="flex justify-center mb-2">
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
          className="text-center font-bold leading-none mb-1"
          style={{ 
            fontSize: business?.businessNameSize === 'medium' ? '12px' : 
                      business?.businessNameSize === 'xlarge' ? '22px' : '18px' 
          }}
        >
          {business?.businessName}
        </div>
        {business?.businessTagLine && (
          <div className="text-center text-[11px] font-bold italic opacity-90 mb-1 leading-none uppercase tracking-tight">
            {business.businessTagLine}
          </div>
        )}
        {(business?.businessAddress || business?.district || business?.state || business?.pinCode) && (
          <div className="text-center text-[12px] font-bold leading-tight mt-1">
            {business?.businessAddress}
            {business?.district && `, ${business.district}`}
            {business?.state && `, ${business.state}`}
            {business?.pinCode && ` - ${business.pinCode}`}
          </div>
        )}
        {business?.gstNumber && <div className="text-center text-[10px] font-bold border-y border-black py-1 mt-2 mb-1">GSTIN: {business.gstNumber}</div>}
        {(business?.fssaiNumber && business?.fssaiEnabled) && <div className="text-center text-[10px] font-bold mt-0.5">FSSAI: {business.fssaiNumber}</div>}
        
        <div className="text-center text-[11px] mt-2 space-y-0.5">
          <div className="font-bold">Bill No: {billNumber}</div>
          <div className="font-bold">Date: {billDate}</div>
          
          {(kotNumbers && kotNumbers.length > 0) ? (
            <div className="mt-3 flex flex-col items-center border-2 border-black py-1.5 px-6 mx-auto w-fit bg-white">
              <div className="text-[10px] font-bold uppercase tracking-widest border-b border-black mb-1">Token Numbers</div>
              <div 
                className="font-bold leading-none tracking-tighter"
                style={{ fontSize: `${(business?.tokenNumberSize || 22) * 0.9}px` }}
              >
                {kotNumbers.join(', ')}
              </div>
            </div>
          ) : tokenNumber && (
            <div className="mt-3 flex flex-col items-center border-2 border-black py-2 px-8 mx-auto w-fit bg-white">
              <div className="text-[11px] font-bold uppercase tracking-widest border-b border-black mb-1">Token Number</div>
              <div 
                className="font-bold leading-none pt-1"
                style={{ fontSize: `${business?.tokenNumberSize || 28}px` }}
              >
                #{tokenNumber}
              </div>
            </div>
          )}
          
          {selectedTable && (
            <div className="font-bold text-[11px] mt-2 border border-black px-3 py-1 inline-block uppercase tracking-tight bg-white">
              {selectedTable === "POS" ? "TYPE: DINING / COUNTER" : 
               selectedTable === "TAKEAWAY" ? "TYPE: 🛍️ TAKEAWAY" : 
               selectedTable === "DELIVERY" ? "TYPE: 🚚 DELIVERY" : 
               `TYPE: DINING (TABLE: ${selectedTable})`}
            </div>
          )}
        </div>

        {(customerName || customerPhone || customerAddress || orderNotes || buyerGSTIN) && (
          <div className="mt-2 text-[10px] font-bold border-t-2 border-dashed border-black pt-1">
            {customerName && <div>Customer: {customerName}</div>}
            {customerPhone && <div>Phone: {customerPhone}</div>}
            {buyerGSTIN && <div className="uppercase">Buyer GST: {buyerGSTIN}</div>}
            {customerAddress && <div className="mt-0.5" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>Addr: {customerAddress}</div>}
            {orderNotes && <div className="mt-0.5 italic text-[10px]">Note: {orderNotes}</div>}
          </div>
        )}

        <div className="mt-1 text-center text-[10px] font-bold">
          {placeOfSupply && <div>Place of Supply: {placeOfSupply}</div>}
        </div>
        <div className="flex justify-between font-bold text-[10px] uppercase border-b border-dashed border-black py-1 my-1">
          <span className="flex-1 min-w-0 pr-1">Item Description</span>
          <span className="w-[10mm] text-right shrink-0">Total</span>
        </div>
        {items.map((i, idx) => {
          const itemRate = (perProductEnabled && i.gst !== undefined && i.gst !== null) ? i.gst : (taxActive ? globalRate : 0);
          return (
            <div key={idx} className="mb-2 border-b border-dotted border-black/20 pb-1">
              <div className="flex justify-between items-start text-[11px] font-bold">
                <span className="flex-1 min-w-0 pr-1 break-words leading-[1.2]">{i.name}</span>
                <span className="w-[12mm] text-right shrink-0">₹{(Number(i.qty ?? 0) * Number(i.rate ?? 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold mt-0.5">
                <span>{i.qty} x ₹{Number(i.rate ?? 0).toFixed(2)}</span>
                <span className="text-[10px] font-bold">
                  {((business?.hsnEnabled && i.hsnCode) ? `HSN: ${i.hsnCode}` : "")} 
                  {(taxActive || perProductEnabled) ? ` | GST: ${itemRate}%` : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div className="my-1 border-t-2 border-black" />
        
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-[11px] font-bold italic">
              <span>Discount ({appliedOffer?.code})</span>
              <span>- ₹{discountAmt.toFixed(2)}</span>
            </div>
          )}
          {(taxActive || perProductEnabled) && (
            <>
              <div className="flex justify-between text-[10px] font-bold"><span>Taxable Amt</span><span>₹{totalTaxable.toFixed(2)}</span></div>
              <div className="flex justify-between text-[10px] font-bold"><span>Total Tax</span><span>₹{totalGst.toFixed(2)}</span></div>
            </>
          )}
          {deliveryCharge > 0 && (
            <>
              <div className="flex justify-between items-center text-[10px] font-bold mt-0.5">
                <span>DELIVERY CHARGES</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              {deliveryGst > 0 && (
                <div className="flex justify-between items-center text-[8px] font-bold italic">
                  <span className="pl-2">└ Tax on Delivery ({business?.deliveryGstRate}%)</span>
                  <span>₹{deliveryGst.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {packagingCharge > 0 && (
            <>
              <div className="flex justify-between items-center text-[10px] font-bold mt-0.5">
                <span>PACKAGING CHARGES</span>
                <span>₹{packagingCharge.toFixed(2)}</span>
              </div>
              {packagingGst > 0 && (
                <div className="flex justify-between items-center text-[8px] font-bold italic">
                  <span className="pl-2">└ Tax on Packaging ({business?.packagingGstRate}%)</span>
                  <span>₹{packagingGst.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {serviceCharge > 0 && (
            <div className="flex justify-between items-center text-[10px] font-bold mt-0.5">
              <span>SERVICE CHARGE</span>
              <span>₹{serviceCharge.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t-2 border-dashed border-black my-1" />
          <div className="flex justify-between font-black text-[13px] border-y-2 border-black py-2 my-1.5 uppercase bg-white px-1">
            <span>GRAND TOTAL</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {(taxActive || perProductEnabled) && taxBreakup.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-black border-b border-dashed border-black mb-1 pb-0.5">GST TAX BREAKUP</div>
            <table className="w-full text-[10px] border-collapse font-bold">
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

        <div className="mt-2 text-[10px] italic font-bold">
          Amount in Words: {numberToWords(finalTotal)}
        </div>

        <div className="mt-3 border-t-2 border-dashed border-black pt-1 flex justify-between text-[11px] font-bold">
          <span>Payment: {paymentMode}</span>
          <span>Status: {paymentStatus}</span>
        </div>
        
        {((business?.upi && business?.upiQrEnabled !== false) || paymentMode === "UPI") && (
          <div className="mt-2 text-center text-[10px] font-bold border-t border-dashed border-black pt-2">
            {(business?.upi && business?.upiQrEnabled !== false) && (
              <>
                <div className="font-bold text-[11px] mb-1">SCAN & PAY</div>
                <div className="my-2 text-center">
                  <div className="inline-block border-2 border-black p-1 bg-white">
                    <img src={qrUrl} alt="UPI QR" className="w-[30mm] h-[30mm] object-contain block" style={{ imageRendering: 'pixelated', filter: 'contrast(1000%) grayscale(100%)' }} />
                  </div>
                </div>
                <div className="mb-2 text-[11px] font-bold">UPI: {business.upi}</div>
              </>
            )}
            {paymentMode === "UPI" && (
              <div className="text-center text-[10px]">Txn Ref: {upiTxnRef || "Pending"}</div>
            )}
          </div>
        )}
        {business?.enableMenuQRInBill && (
          <div className="mt-2 text-center border-t-2 border-black pt-2">
            <div className="text-[11px] font-black mb-1 uppercase tracking-tighter">Scan to View Digital Menu</div>
            <div className="my-2 text-center">
              <div className="inline-block border-2 border-black p-1 bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/menu/${business?.userId}`)}`} 
                  alt="Menu QR" 
                  className="w-[30mm] h-[30mm] object-contain block mx-auto" 
                  style={{ imageRendering: 'pixelated', filter: 'contrast(300%) grayscale(100%)' }}
                />
              </div>
            </div>
          </div>
        )}
        {selectedParty && (
          <div className="mt-2 border-t border-dashed border-black pt-2 text-[10px] font-bold space-y-0.5">
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

        <div className="mt-4 border-t-2 border-black pt-2 text-center">
          <div className="text-[12px] font-black italic tracking-widest uppercase mb-1">
            {business?.greetingMessage || "Thank You!"}
          </div>
          <div className="text-[9px] font-bold">Visit Again for Fresh Food</div>
          <div className="text-[8px] mt-3 font-bold">Powered by Kravy</div>
        </div>
      </div>

      {/* ================= KOT TEMPLATE (58mm Content) ================= */}
      <div
        ref={kotRef}
        data-paper="58"
        className="hidden print:block kot kot-container font-mono text-[10px] leading-tight text-black bg-white"
        style={{ width: '48mm', margin: '0 auto', padding: '4mm 2mm 8mm 2mm', boxSizing: 'border-box', overflow: 'hidden' }}
      >
        <div className="text-center font-black text-[22px] border-b-2 border-black pb-1 mb-2">K.O.T</div>
        
        <div className="flex flex-wrap justify-between items-center font-black text-[11px] mb-2 px-0.5 gap-y-1">
          <div className="border-2 border-black text-black px-1.5 py-1 rounded-sm font-black whitespace-nowrap text-[10px]">
            {selectedTable === "POS" ? "COUNTER" : 
             selectedTable === "TAKEAWAY" ? "TAKEAWAY" : 
             selectedTable === "DELIVERY" ? "DELIVERY" : 
             `TABLE: ${selectedTable}`}
          </div>
          <div className="text-right leading-none">
            <div className="text-[8px] font-black uppercase tracking-tighter">Token No.</div>
            <div 
              className="font-black"
              style={{ fontSize: `${business?.tokenNumberSize || 16}px` }}
            >
              #{kotNumbers && kotNumbers.length > 0 ? kotNumbers[kotNumbers.length - 1] : (tokenNumber || business?.lastTokenNumber || "NEW")}
            </div>
          </div>
        </div>

        <div className="border-y border-dashed border-black py-1 mb-2 text-[10px] font-bold">
          <div className="flex justify-between">
            <span>Bill: {billNumber}</span>
            <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {customerName && <div className="mt-0.5 truncate">Cust: {customerName}</div>}
        </div>

        <table className="w-full border-collapse font-black text-[11px]">
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
                <tr key={idx} className="border-b border-dotted border-black/30">
                  <td className="py-2 pr-2 leading-[1.1] uppercase">
                     {i.name}
                     {i.variants && i.variants.length > 0 && (
                       <div className="text-[9px] font-bold lowercase">
                          ({i.variants.map((v:any) => v.name).join(', ')})
                       </div>
                     )}
                  </td>
                  <td className="text-right py-2 align-top text-[14px]">x{i.qty}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>

        {orderNotes && (
          <div className="mt-3 p-2 border-2 border-black bg-black/5 rounded-sm">
            <div className="text-[9px] font-black uppercase mb-1 border-b border-black">Chef Instructions:</div>
            <div className="text-[11px] font-bold italic leading-tight">{orderNotes}</div>
          </div>
        )}

        <div className="mt-4 border-t-2 border-black pt-2 text-center">
          <div className="text-[9px] font-black uppercase">End of KOT</div>
          <div className="text-[10px] font-bold mt-1">{billDate}</div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplates;
