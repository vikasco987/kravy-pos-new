
import React from 'react';
import { X, ZoomIn, ZoomOut, Printer, RefreshCw } from 'lucide-react';
import { WhatsAppBillButton } from "@/components/WhatsAppBillButton";

interface BillPreviewProps {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  previewZoom: number;
  setPreviewZoom: React.Dispatch<React.SetStateAction<number>>;
  business: any;
  billNumber: string;
  billDate: string;
  tokenNumber: string;
  selectedTable: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderNotes: string;
  placeOfSupply: string;
  items: any[];
  subtotal: number;
  discountAmt: number;
  appliedOffer: any;
  taxActive: boolean;
  perProductEnabled: boolean;
  totalTaxable: number;
  totalGst: number;
  taxBreakup: any[];
  deliveryCharge: number;
  deliveryGst: number;
  packagingCharge: number;
  packagingGst: number;
  finalTotal: number;
  paymentMode: string;
  paymentStatus: string;
  qrUrl: string;
  numberToWords: (num: number) => string;
  kravy: any;
  // Actions
  printKOT: () => void;
  printReceipt: (enableKOT: boolean, customBill?: any) => void;
  saveBill: () => Promise<any>;
  resetForm: () => void;
  isSaving: boolean;
  lastSavedBillId: string | null;
  userRole: string;
  userPermissions: string[];
  resumeBillId: string | null;
  router: any;
  kotNumbers?: number[];
}

const BillPreview: React.FC<BillPreviewProps> = (props) => {
  const {
    showPreview, setShowPreview, previewZoom, setPreviewZoom, business, billNumber,
    billDate, tokenNumber, selectedTable, customerName, customerPhone, customerAddress,
    orderNotes, placeOfSupply, items, subtotal, discountAmt, appliedOffer,
    taxActive, perProductEnabled, totalTaxable, totalGst, taxBreakup,
    deliveryCharge, deliveryGst, packagingCharge, packagingGst, finalTotal,
    paymentMode, paymentStatus, qrUrl, numberToWords, kravy,
    printKOT, printReceipt, saveBill, resetForm, isSaving, lastSavedBillId,
    userRole, userPermissions, resumeBillId, router, kotNumbers
  } = props;

  const ps = business?.printSettings || {};
  const s = (key: string) => ps[key] !== false; // Default to true if not set

  if (!showPreview) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={() => setShowPreview(false)} />
      
      <div className="relative bg-[var(--kravy-bg)] w-full max-w-[500px] h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-[var(--kravy-border)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--kravy-border)] bg-[var(--kravy-surface)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-black text-[var(--kravy-text-primary)]">Bill Preview</h3>
            <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider mt-0.5">Check before printing</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.1))} className="w-8 h-8 rounded-lg bg-[var(--kravy-bg)] border border-[var(--kravy-border)] flex items-center justify-center text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)] transition-colors"><ZoomOut size={14} /></button>
            <span className="text-xs font-bold text-[var(--kravy-text-secondary)] w-9 text-center">{(previewZoom * 100).toFixed(0)}%</span>
            <button onClick={() => setPreviewZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 rounded-lg bg-[var(--kravy-bg)] border border-[var(--kravy-border)] flex items-center justify-center text-[var(--kravy-text-muted)] hover:text-[var(--kravy-text-primary)] transition-colors"><ZoomIn size={14} /></button>
            <div className="w-px h-5 bg-[var(--kravy-border)] mx-1" />
            <button onClick={() => { kravy.close(); setShowPreview(false); }} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview Area (Rendered like paper) */}
        <div className="flex-1 overflow-auto bg-[#E5E5E5] dark:bg-[#1A1A1A] p-6 flex flex-col items-center justify-start">
          <div 
            className="bg-white text-black p-4 shadow-xl transition-transform origin-top mx-auto"
            style={{ 
              width: '58mm', 
              minHeight: '100px',
              transform: `scale(${previewZoom * 1.5})`, // 1.5x base scale so it's readable on screen
              marginBottom: `${previewZoom * 100}px` // extra space for transform
            }}
          >
            {/* Clone of receiptRef content but visible */}
            <div className="font-mono text-[10px] leading-tight">
              {s('showLogo') && business?.logoUrl && (
                <div className="flex justify-center mb-1">
                  <img src={business?.logoUrl} alt="Logo" className="max-h-[28mm] object-contain" />
                </div>
              )}
              <div className="text-center font-bold text-[12px]">{business?.businessName}</div>
              {s('showTagline') && business?.businessTagLine && <div className="text-center text-[9px] italic opacity-80 mb-0.5">{business.businessTagLine}</div>}
              {s('showAddress') && (business?.businessAddress || business?.district || business?.state || business?.pinCode) && (
                <div className="text-center text-[9px]">
                  {business?.businessAddress}
                  {business?.district && `, ${business.district}`}
                  {business?.state && `, ${business.state}`}
                  {business?.pinCode && ` - ${business.pinCode}`}
                </div>
              )}
              {s('showContact') && (business?.contactPersonPhone || business?.contactPhone) && (
                <div className="text-center text-[9px] font-bold">Mob: {business.contactPersonPhone || business.contactPhone}</div>
              )}
              {s('showGST') && business?.gstNumber && <div className="text-center text-[9px]">GSTIN: {business.gstNumber}</div>}
              {s('showFSSAI') && (business?.fssaiNumber && business?.fssaiEnabled) && <div className="text-center text-[9px]">FSSAI: {business.fssaiNumber}</div>}
              {s('sepTop') && <div className="my-1 border-t border-dashed border-gray-400" />}
              
              <div className="flex justify-between items-start mt-2 px-1">
                <div className="text-[9px] space-y-0.5">
                  <div className="font-bold uppercase tracking-tighter">Bill Info</div>
                  <div className="font-medium opacity-80">No: {billNumber}</div>
                  <div className="font-medium opacity-80">Date: {billDate}</div>
                  {selectedTable && (
                    <div className="font-black uppercase text-[7px] bg-black text-white px-1 py-0.5 inline-block mt-1">
                      {selectedTable === "POS" ? "DINING / COUNTER" : 
                       selectedTable === "TAKEAWAY" ? "🛍️ TAKEAWAY" : 
                       selectedTable === "DELIVERY" ? "🚚 DELIVERY" : 
                       `DINING (TABLE: ${selectedTable})`}
                    </div>
                  )}
                </div>

                {s('showToken') && ((kotNumbers && kotNumbers.length > 0) || (tokenNumber || business?.lastTokenNumber !== undefined)) && (
                  <div className="flex flex-col items-end py-0.5">
                    <div className="text-[7px] font-black uppercase tracking-tighter opacity-60">Token No.</div>
                    <div className="text-[12px] font-black leading-none py-0.5">
                      {kotNumbers && kotNumbers.length > 0 ? kotNumbers.join(',') : `#${tokenNumber || "---"}`}
                    </div>
                  </div>
                )}
              </div>

              {s('sepCustomer') && <div className="my-1 border-t border-dashed border-gray-400" />}
              {s('showCustomerDetails') && (customerName || customerPhone || customerAddress) && (
                <div className="text-[9px]">
                  <div>Customer: {customerName || "Walk-in Customer"}</div>
                  {customerPhone && <div>Phone: {customerPhone}</div>}
                  {customerAddress && <div>Addr: {customerAddress}</div>}
                  {placeOfSupply && <div>POS: {placeOfSupply}</div>}
                  {(orderNotes) && (
                    <div className="mt-1 pt-1 border-t border-dotted border-gray-300 italic text-gray-700">
                      Note: {orderNotes}
                    </div>
                  )}
                </div>
              )}
              {s('sepItemsHeader') && <div className="my-1 border-t border-dashed border-gray-400" />}
              {items.map((i, idx) => (
                <div key={idx} className="mb-1.5 border-b border-dotted border-gray-100 pb-1">
                  <div className="flex justify-between items-start text-[9px] font-bold">
                    <span className="flex-1 min-w-0 pr-1 break-words">
                      {s('showFoodTypeSuffix') ? i.name : i.name.replace(/\s?\((V|NV|R)\)/gi, "").trim()}
                    </span>
                    <span className="w-[11mm] text-right shrink-0">{(Number(i.qty ?? 0) * Number(i.rate ?? 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-600">
                    <span>{i.qty} x {Number(i.rate ?? 0).toFixed(2)}</span>
                    <span>{((business?.hsnEnabled && i.hsnCode) ? `HSN: ${i.hsnCode}` : "")} {(taxActive || perProductEnabled) ? `| GST: ${i.gst || 0}%` : ""}</span>
                  </div>
                </div>
              ))}
              {s('sepTotalTop') && <div className="my-1 border-t border-dashed border-gray-400" />}
              
              <div className="space-y-0.5">
                  {s('showSubtotal') && <div className="flex justify-between text-[9px]"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>}
                  {s('showDiscount') && discountAmt > 0 && (
                    <div className="flex justify-between text-[9px] text-rose-600 font-bold italic">
                      <span>Discount ({appliedOffer?.code})</span>
                      <span>- ₹{discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                {s('showTaxBreakup') && (taxActive || perProductEnabled) && (
                  <>
                    <div className="flex justify-between text-[9px]"><span>Taxable Amt</span><span>₹{totalTaxable.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[9px]"><span>Total Tax</span><span>₹{totalGst.toFixed(2)}</span></div>
                  </>
                )}
                {s('showDeliveryCharges') && deliveryCharge > 0 && (
                  <>
                    <div className="flex justify-between text-[9px] font-bold"><span>Delivery</span><span>₹{deliveryCharge.toFixed(2)}</span></div>
                    {deliveryGst > 0 && (
                      <div className="flex justify-between text-[8px] italic opacity-60 font-bold">
                        <span className="pl-2">└ Tax ({business?.deliveryGstRate}%)</span>
                        <span>₹{deliveryGst.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                {s('showPackagingCharges') && packagingCharge > 0 && (
                  <>
                    <div className="flex justify-between text-[9px] font-bold"><span>Packaging</span><span>₹{packagingCharge.toFixed(2)}</span></div>
                    {packagingGst > 0 && (
                      <div className="flex justify-between text-[8px] italic opacity-60 font-bold">
                        <span className="pl-2">└ Tax ({business?.packagingGstRate}%)</span>
                        <span>₹{packagingGst.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                {s('sepTotalBottom') && <div className="border-t border-dashed border-gray-400 my-1" />}
                <div className="flex justify-between font-bold text-[11px] bg-black text-white px-1 py-0.5">
                  <span>GRAND TOTAL</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {s('showTaxBreakup') && (taxActive || perProductEnabled) && taxBreakup.length > 0 && (
                <div className="mt-3">
                  <div className="text-[8px] font-bold border-b border-dashed border-gray-400 mb-1 pb-0.5">GST TAX BREAKUP</div>
                  <table className="w-full text-[8px] border-collapse">
                    <thead>
                      <tr className="border-b border-dashed border-gray-400">
                        <th className="text-left font-bold">Rate</th>
                        <th className="text-right font-bold">Taxable</th>
                        <th className="text-right font-bold">CGST</th>
                        <th className="text-right font-bold">SGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxBreakup.map((g, idx) => (
                        <tr key={idx}>
                          <td className="text-left">{g.rate}%</td>
                          <td className="text-right">{g.taxable.toFixed(2)}</td>
                          <td className="text-right">{g.cgst.toFixed(2)}</td>
                          <td className="text-right">{g.sgst.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-dashed border-gray-400 mt-1" />
                </div>
              )}

              {s('showAmountInWords') && (
                <div className="mt-2 text-[8px] italic font-medium">
                  Amount in Words: {numberToWords(finalTotal)}
                </div>
              )}

              {s('sepPayment') && <div className="border-t border-dashed border-gray-400 my-1" />}

              {s('showPaymentStatus') && (
                <div className="mt-1 flex justify-between text-[8px]">
                  <span>Payment: {paymentMode}</span>
                  <span>Status: {paymentStatus}</span>
                </div>
              )}

              {((business?.upi && business?.upiQrEnabled !== false) || paymentMode === "UPI") && (
                <div className="mt-2 text-center text-[9px] font-bold border-t border-dashed border-gray-400 pt-2">
                  {(business?.upi && business?.upiQrEnabled !== false) && (
                    <>
                      <div>Scan & Pay</div>
                      <div className="my-1.5 text-center">
                        <div className="inline-block border border-gray-300 p-1 rounded-md bg-white">
                          <img src={qrUrl} alt="UPI QR" className="w-[30mm] h-[30mm] object-contain block mix-blend-multiply" />
                        </div>
                      </div>
                      <div className="mb-2">UPI: {business.upi}</div>
                    </>
                  )}
                  {paymentMode === "UPI" && (
                    <div className="text-center text-[9px]">Txn Ref: {upiTxnRef || "Pending"}</div>
                  )}
                </div>
              )}

              {s('showReviewQR') && business?.reviewUrl && (
                <div className="mt-2 text-center text-[9px] font-bold border-t border-dashed border-gray-400 pt-2">
                  <div>Rate Your Experience</div>
                  <div className="my-1.5 text-center">
                    <div className="inline-block border border-gray-300 p-1 rounded-md bg-white">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(business.reviewUrl)}`} 
                        alt="Review QR" 
                        className="w-[30mm] h-[30mm] object-contain block mix-blend-multiply" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {business?.businessTagLine && <div className="text-center text-[9px] mt-1 italic opacity-80">{business.businessTagLine}</div>}
              {s('showGreetings') && (
                <div className="text-center font-bold text-[11px] mt-2">
                  {business?.greetingMessage || "THANK YOU 🙏 VISIT AGAIN"}
                </div>
              )}

              {s('showPoweredBy') && (
                <div className="text-center text-[7px] mt-3 opacity-40 uppercase tracking-widest">
                  Powered by Kravy
                </div>
              )}

              {s('sepFooter') && <div className="border-t border-dashed border-gray-400 my-1 mt-3" />}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-4 border-t border-[var(--kravy-border)] bg-[var(--kravy-surface)] shrink-0 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => { kravy.close(); setShowPreview(false); }}
              className="flex-1 py-3.5 rounded-xl border border-[var(--kravy-border)] font-bold text-sm text-[var(--kravy-text-secondary)] hover:bg-[var(--kravy-bg)] transition-all"
            >
              Close
            </button>
            {lastSavedBillId && (userRole === "ADMIN" || userRole === "MASTER" || (userRole !== "SELLER" && userPermissions.includes("whatsapp-bill"))) && (
              <div className="flex-[2]">
                <WhatsAppBillButton 
                  billId={lastSavedBillId} 
                  defaultPhone={customerPhone} 
                />
              </div>
            )}
          </div>
          <button
            onClick={() => {
              kravy.ping();
              printKOT();
            }}
            disabled={items.length === 0 || isSaving}
            className="flex-1 py-3.5 rounded-xl border-2 border-orange-500/40 text-orange-500 font-extrabold text-sm hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2"
          >
            <Printer size={16} /> KOT
          </button>
          <button
            onClick={async () => {
              if (!business) { alert("Business profile not loaded yet"); return; }
              
              const bill = await saveBill();
              if (!bill) return;

              kravy.payment(); 
              printReceipt(business?.enableKOTWithBill, bill);
              setShowPreview(false);
              
              resetForm();
              if (resumeBillId) router.replace("/dashboard/billing/checkout");
            }}
            disabled={items.length === 0 || !business || (paymentMode === "UPI" && paymentStatus !== "Paid") || isSaving}
            className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Printer size={16} />} 
            {business?.enableKOTWithBill ? "KOT & Bill" : "Print Direct"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillPreview;
