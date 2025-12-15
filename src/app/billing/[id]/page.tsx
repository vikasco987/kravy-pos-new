"use client";

import { useEffect, useRef, useState } from "react";

export default function ViewBillPage({ params }: any) {
  const { id } = params;
  const [bill, setBill] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/billing/${id}`)
      .then((r) => r.json())
      .then(setBill);
  }, [id]);

  function print() {
    if (!receiptRef.current) return;
    const html = document.body.innerHTML;
    document.body.innerHTML = receiptRef.current.outerHTML;
    window.print();
    document.body.innerHTML = html;
  }

  if (!bill) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4">
      <button onClick={print} className="mb-3 border px-3 py-1">
        Re-Print
      </button>

      <div ref={receiptRef} className="w-[80mm] text-[12px] mx-auto">
        <div className="text-center font-bold">KRAVY SPICE VILLA</div>
        <hr />

        {bill.items.map((i: any, idx: number) => (
          <div key={idx} className="flex justify-between">
            <span>{i.name} × {i.qty}</span>
            <span>₹{(i.qty * i.rate).toFixed(2)}</span>
          </div>
        ))}

        <hr />
        <div className="flex justify-between">Subtotal <span>₹{bill.subtotal}</span></div>
        <div className="flex justify-between">CGST <span>₹{bill.cgst}</span></div>
        <div className="flex justify-between">SGST <span>₹{bill.sgst}</span></div>
        <div className="flex justify-between font-bold">
          Total <span>₹{bill.total}</span>
        </div>

        <div className="text-center mt-2">Thank you 🙏</div>
      </div>
    </div>
  );
}
