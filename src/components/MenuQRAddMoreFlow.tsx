"use client";

import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import "./MenuQRAddMoreFlow.css";

type OrderCase = "case1" | "case2" | "case3" | "kitchen" | "bill";

type OrderStatus = "received" | "preparing" | "served";

type CartItem = {
  name: string;
  price: number;
  quantity: number;
};

type CaseData = {
  orderId: string;
  tableId: string;
  status: OrderStatus;
  items: Array<{ name: string; qty: number; price: number }>;
  createdAt: string;
  currentTotal: number;
};

interface MenuQRAddMoreFlowProps {
  onClose?: () => void;
  caseType?: "merge" | "separate" | "round2";
  orderData?: CaseData;
}

const MENU_ITEMS = [
  { id: "dal-makhani", name: "Dal Makhani", desc: "Black lentils, butter & cream", price: 260, veg: true },
  { id: "mango-lassi", name: "Mango Lassi", desc: "Fresh mango yogurt drink", price: 120, veg: true },
  { id: "paneer-tikka", name: "Paneer Tikka", desc: "Grilled cottage cheese", price: 280, veg: true },
  { id: "chicken-65", name: "Chicken 65", desc: "Spicy fried chicken", price: 320, veg: false },
  { id: "chicken-biryani", name: "Chicken Biryani", desc: "Hyderabadi dum biryani", price: 360, veg: false },
  { id: "gulab-jamun", name: "Gulab Jamun", desc: "2 pcs in sugar syrup", price: 120, veg: true },
  { id: "kulfi-falooda", name: "Kulfi Falooda", desc: "Indian ice cream with falooda", price: 160, veg: true },
  { id: "masala-chai", name: "Masala Chai", desc: "Spiced tea with ginger", price: 60, veg: true },
];

export default function MenuQRAddMoreFlow({ onClose, caseType = "merge", orderData }: MenuQRAddMoreFlowProps) {
  const [currentFlow, setCurrentFlow] = useState<OrderCase>("case1");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmScreen, setConfirmScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Case-specific data
  const [mergedItems, setMergedItems] = useState<string[]>([]);
  const [newOrderItems, setNewOrderItems] = useState<string[]>([]);
  const [round2Items, setRound2Items] = useState<string[]>([]);

  // Default mock data (replace with props data in production)
  const mockOrderData: CaseData = orderData || {
    orderId: "#MH2X9K",
    tableId: "T-04",
    status: "received",
    items: [
      { name: "Butter Chicken", qty: 1, price: 380 },
      { name: "Garlic Naan", qty: 2, price: 160 },
    ],
    createdAt: "2 min ago",
    currentTotal: 540,
  };

  const handleAddItem = useCallback((item: (typeof MENU_ITEMS)[0]) => {
    const existingItem = cartItems.find((ci) => ci.name === item.name);

    if (existingItem) {
      setCartItems(cartItems.map((ci) => (ci.name === item.name ? { ...ci, quantity: ci.quantity + 1 } : ci)));
    } else {
      setCartItems([...cartItems, { name: item.name, price: item.price, quantity: 1 }]);
    }

    const newTotal = cartItems.reduce((sum, ci) => sum + ci.price * ci.quantity, 0) + item.price;
    setCartTotal(newTotal);
    setShowCart(true);
    toast.success(`${item.name} added!`);
  }, [cartItems]);

  const handleRemoveItem = useCallback((itemName: string) => {
    const updated = cartItems.filter((ci) => ci.name !== itemName);
    setCartItems(updated);
    const newTotal = updated.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
    setCartTotal(newTotal);
  }, [cartItems]);

  const handleSubmitOrder = useCallback(async () => {
    if (cartItems.length === 0) {
      toast.error("Please add items first!");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (currentFlow === "case1") {
        // Case 1: Merge items to existing order
        const orderId = mockOrderData.orderId.replace("#", "");
        
        const response = await fetch(`/api/orders/${orderId}/merge-items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            caseType: "merge",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to merge items");
        }

        const result = await response.json();
        setMergedItems(cartItems.map((ci) => ci.name));
        setConfirmScreen(true);
        setShowCart(false);
        toast.success(`✅ ${cartItems.length} item(s) merged to order!`);
        
        console.log("Merge result:", result);
      } else if (currentFlow === "case2") {
        // Case 2: Create separate order (will implement next)
        setNewOrderItems(cartItems.map((ci) => ci.name));
        setConfirmScreen(true);
        setShowCart(false);
        toast.success("📋 New order placed!");
      } else if (currentFlow === "case3") {
        // Case 3: Round 2 (will implement next)
        setRound2Items(cartItems.map((ci) => ci.name));
        setConfirmScreen(true);
        setShowCart(false);
        toast.success("🎉 Round 2 order placed!");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to submit order";
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      console.error("Submit order error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [cartItems, currentFlow, mockOrderData]);

  const handleFlowChange = (flow: OrderCase) => {
    setCurrentFlow(flow);
    setShowCart(false);
    setConfirmScreen(false);
    setCartItems([]);
    setCartTotal(0);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "received":
        return "⏳";
      case "preparing":
        return "🔥";
      case "served":
        return "✅";
      default:
        return "📋";
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "received":
        return "badge-received";
      case "preparing":
        return "badge-preparing";
      case "served":
        return "badge-served";
      default:
        return "";
    }
  };

  return (
    <div className="qr-addmore-flow">
      {/* MASTER NAV */}
      <div className="master-nav">
        <div className="mn-title">MenuQR — Add More Items Flow</div>
        <div className="mn-tabs">
          <button
            className={`mn-tab ${currentFlow === "case1" ? "active" : ""}`}
            onClick={() => handleFlowChange("case1")}
          >
            Case 1 — Edit Order
            <span className="case-badge green">Merge</span>
          </button>
          <button
            className={`mn-tab ${currentFlow === "case2" ? "active" : ""}`}
            onClick={() => handleFlowChange("case2")}
          >
            Case 2 — New Order
            <span className="case-badge orange">Separate</span>
          </button>
          <button
            className={`mn-tab ${currentFlow === "case3" ? "active" : ""}`}
            onClick={() => handleFlowChange("case3")}
          >
            Case 3 — Round 2
            <span className="case-badge blue">Served</span>
          </button>
          <button
            className={`mn-tab ${currentFlow === "kitchen" ? "active" : ""}`}
            onClick={() => handleFlowChange("kitchen")}
          >
            🍳 Kitchen View
          </button>
          <button
            className={`mn-tab ${currentFlow === "bill" ? "active" : ""}`}
            onClick={() => handleFlowChange("bill")}
          >
            🧾 Combined Bill
          </button>
        </div>
      </div>

      {/* CASE 1: MERGE */}
      {currentFlow === "case1" && (
        <div className="flow-screen case-1">
          <div className="case-header">
            <div className="ch-tag green">✅ Case 1 — Kitchen ne abhi tak accept nahi kiya</div>
            <div className="ch-title">Order Edit Karo — Merge Ho Jaayega</div>
            <div className="ch-desc">
              Customer ne order diya lekin kitchen ne accept nahi kiya abhi. Is case mein naye items seedha pehle order mein add ho jaate hain.
            </div>
          </div>

          <div className="flow-steps">
            <div className="fs-step done">
              <div className="fs-dot done">✓</div>
              <div className="fs-lbl">Order Placed</div>
            </div>
            <div className="fs-line done"></div>
            <div className="fs-step active">
              <div className="fs-dot active">➕</div>
              <div className="fs-lbl">Add Items</div>
            </div>
            <div className="fs-line"></div>
            <div className="fs-step">
              <div className="fs-dot pending">🔀</div>
              <div className="fs-lbl">Merged</div>
            </div>
          </div>

          <div className="order-status-card">
            <div className="osc-top">
              <div className="osc-icon received">⏳</div>
              <div className="osc-info">
                <div className="osc-order-id">{mockOrderData.orderId} · Table {mockOrderData.tableId}</div>
                <div className="osc-status">Order Received</div>
                <div className="osc-time">Placed {mockOrderData.createdAt} · Kitchen confirming...</div>
              </div>
              <span className={`osc-badge ${getStatusBadgeClass("received")}`}>Confirming</span>
            </div>

            <div className="order-items-mini">
              <div className="oim-title">Current Order Items</div>
              {mockOrderData.items.map((item, idx) => (
                <div key={idx} className="oim-item">
                  <div className="oim-dot nv"></div>
                  <span className="oim-name">{item.name}</span>
                  <span className="oim-qty">×{item.qty}</span>
                  <span className="oim-price">₹{item.price}</span>
                </div>
              ))}
            </div>

            <button className="add-more-btn green" onClick={() => setShowCart(true)}>
              ✏️ Edit Order — Add More Items
            </button>
            <div className="status-hint green">✓ Kitchen ne abhi accept nahi kiya — merge ho jaayega!</div>
          </div>

          {/* MENU ITEMS */}
          {showCart && !confirmScreen && (
            <div className="menu-section">
              <div className="menu-mini-header">
                <div className="mmh-badge merge">🔀 Merge Mode — Same Order</div>
                <div className="mmh-title">Aur Items Add Karo</div>
                <div className="mmh-sub">Yeh items pehle order {mockOrderData.orderId} mein add honge</div>
              </div>

              {MENU_ITEMS.map((item) => (
                <div key={item.id} className="mitem-compact">
                  <div className={`mic-dot ${item.veg ? "v" : "nv"}`}></div>
                  <div className="mic-info">
                    <div className="mic-name">{item.name}</div>
                    <div className="mic-desc">{item.desc}</div>
                  </div>
                  <span className="mic-price">₹{item.price}</span>
                  <button className="add-btn-sm" onClick={() => handleAddItem(item)}>
                    ADD
                  </button>
                </div>
              ))}
              <div style={{ height: "100px" }} />
            </div>
          )}

          {confirmScreen && (
            <div className="confirm-screen">
              {submitError ? (
                <>
                  <span className="cs-icon">❌</span>
                  <div className="cs-title">Error!</div>
                  <div className="cs-sub">{submitError}</div>
                  <button className="cs-btn primary" onClick={() => {
                    setConfirmScreen(false);
                    setSubmitError(null);
                    setShowCart(true);
                  }}>
                    ← Try Again
                  </button>
                </>
              ) : (
                <>
                  <span className="cs-icon">🔀</span>
                  <div className="cs-title">Order Updated!</div>
                  <div className="cs-sub">Naye items pehle order mein merge ho gaye. Kitchen ko updated order mil gaya!</div>
                  <div className="cs-detail-box">
                    <div className="cdb-row">
                      <span>Added Items</span>
                      <span style={{ color: "var(--green)" }}>{mergedItems.join(", ")}</span>
                    </div>
                    <div className="cdb-row">
                      <span>Total</span>
                      <span>₹{mockOrderData.currentTotal + cartTotal}</span>
                    </div>
                  </div>
                  <button className="cs-btn primary" onClick={() => handleFlowChange("case1")}>
                    ← Back to Tracking
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* CASE 2: SEPARATE ORDER */}
      {currentFlow === "case2" && (
        <div className="flow-screen case-2">
          <div className="case-header">
            <div className="ch-tag orange">⚠️ Case 2 — Kitchen mein ban raha hai</div>
            <div className="ch-title">Naya Alag Order Banega</div>
            <div className="ch-desc">
              Pehla order already kitchen mein ban raha hai. Naye items ek naaye order mein jaayenge — alag se aayenge.
            </div>
          </div>

          <div className="order-status-card">
            <div className="osc-top">
              <div className="osc-icon preparing">🔥</div>
              <div className="osc-info">
                <div className="osc-order-id">#MH2X9K · Table T-04</div>
                <div className="osc-status">Preparing...</div>
                <div className="osc-time">Chef is cooking · ~15 min</div>
              </div>
              <span className={`osc-badge ${getStatusBadgeClass("preparing")}`}>Preparing</span>
            </div>

            <div className="order-items-mini">
              <div className="oim-title">Order #1 — Ban Raha Hai</div>
              {mockOrderData.items.map((item, idx) => (
                <div key={idx} className="oim-item">
                  <div className="oim-dot nv"></div>
                  <span className="oim-name">{item.name}</span>
                  <span className="oim-qty">×{item.qty}</span>
                  <span className="oim-price">₹{item.price}</span>
                </div>
              ))}
            </div>

            <button className="add-more-btn orange" onClick={() => setShowWarning(true)}>
              ➕ Kuch Aur Order Karo
            </button>
            <div className="status-hint orange">⚠️ Naya alag order banega — separately aayega</div>
          </div>

          {showWarning && (
            <div className="warning-overlay">
              <div className="warning-sheet">
                <div className="ws-title">⚠️ Order Pehle Se Ban Raha Hai</div>
                <div className="ws-desc">Naye items alag order mein jaayenge</div>
                <div className="warn-box">
                  <div className="wb-icon">🔥</div>
                  <div>
                    <div className="wb-title">Kitchen mein Order #1 ban raha hai!</div>
                    <div className="wb-desc">
                      Naye items ek alag Order #2 mein jaayenge aur separately aayenge. Bill mein dono merge ho jaayenge.
                    </div>
                  </div>
                </div>
                <button className="ws-btn primary" onClick={() => { setShowWarning(false); setShowCart(true); }}>
                  ➕ Haan, Naya Order Banao
                </button>
                <button className="ws-btn ghost" onClick={() => setShowWarning(false)}>
                  Nahi, Cancel
                </button>
              </div>
            </div>
          )}

          {showCart && !confirmScreen && (
            <div className="menu-section">
              <div className="menu-mini-header">
                <div className="mmh-badge new">📋 New Order #2</div>
                <div className="mmh-title">Order #2 Banao</div>
                <div className="mmh-sub">Yeh items alag se aayenge · Bill mein merge hoga</div>
              </div>

              {MENU_ITEMS.map((item) => (
                <div key={item.id} className="mitem-compact">
                  <div className={`mic-dot ${item.veg ? "v" : "nv"}`}></div>
                  <div className="mic-info">
                    <div className="mic-name">{item.name}</div>
                    <div className="mic-desc">{item.desc}</div>
                  </div>
                  <span className="mic-price">₹{item.price}</span>
                  <button className="add-btn-sm" onClick={() => handleAddItem(item)}>
                    ADD
                  </button>
                </div>
              ))}
              <div style={{ height: "100px" }} />
            </div>
          )}

          {confirmScreen && (
            <div className="confirm-screen">
              <span className="cs-icon">📋</span>
              <div className="cs-title">Order #2 Placed!</div>
              <div className="cs-sub">Dono orders alag se aayenge — bill mein sab ek saath hoga.</div>
              <div className="cs-detail-box">
                <div className="cdb-row">
                  <span>Order #1</span>
                  <span style={{ color: "var(--orange)" }}>🔥 Preparing</span>
                </div>
                <div className="cdb-row">
                  <span>Order #2 Items</span>
                  <span>{newOrderItems.join(", ")}</span>
                </div>
                <div className="cdb-row">
                  <span>Session Total</span>
                  <span style={{ color: "var(--red)" }}>₹{mockOrderData.currentTotal + cartTotal}</span>
                </div>
              </div>
              <button className="cs-btn primary" onClick={() => handleFlowChange("case2")}>
                ← Back to Tracking
              </button>
            </div>
          )}
        </div>
      )}

      {/* CASE 3: ROUND 2 */}
      {currentFlow === "case3" && (
        <div className="flow-screen case-3">
          <div className="case-header">
            <div className="ch-tag blue">🍽️ Case 3 — Pehla order serve ho gaya</div>
            <div className="ch-title">Round 2 — Kuch Aur Mangwao!</div>
            <div className="ch-desc">Pehla order serve ho chuka hai. Customer ab bilkul fresh se order de sakta hai.</div>
          </div>

          <div className="order-status-card">
            <div className="osc-top">
              <div className="osc-icon served">✅</div>
              <div className="osc-info">
                <div className="osc-order-id">#MH2X9K · Table T-04</div>
                <div className="osc-status">Served! Enjoy your meal 😊</div>
                <div className="osc-time">Served at 3:44 PM · 24 min ago</div>
              </div>
              <span className={`osc-badge ${getStatusBadgeClass("served")}`}>Served ✓</span>
            </div>

            <div className="order-items-mini">
              <div className="oim-title">Order #1 — Served ✓</div>
              {mockOrderData.items.map((item, idx) => (
                <div key={idx} className="oim-item">
                  <div className="oim-dot nv"></div>
                  <span className="oim-name">{item.name}</span>
                  <span className="oim-qty">×{item.qty}</span>
                  <span className="oim-price">₹{item.price}</span>
                </div>
              ))}
            </div>

            <button className="add-more-btn blue" onClick={() => setShowCart(true)}>
              🔄 Round 2 — Kuch Aur Order Karo!
            </button>
            <div className="status-hint blue">✓ Fresh order · Bill mein add hoga</div>
          </div>

          {showCart && !confirmScreen && (
            <div className="menu-section">
              <div className="menu-mini-header">
                <div className="mmh-badge round2">🔄 Round 2</div>
                <div className="mmh-title">Kya Mangwaoge? 😊</div>
                <div className="mmh-sub">Desserts, drinks ya kuch aur — sab welcome hai!</div>
              </div>

              {MENU_ITEMS.map((item) => (
                <div key={item.id} className="mitem-compact">
                  <div className={`mic-dot ${item.veg ? "v" : "nv"}`}></div>
                  <div className="mic-info">
                    <div className="mic-name">{item.name}</div>
                    <div className="mic-desc">{item.desc}</div>
                  </div>
                  <span className="mic-price">₹{item.price}</span>
                  <button className="add-btn-sm" onClick={() => handleAddItem(item)}>
                    ADD
                  </button>
                </div>
              ))}
              <div style={{ height: "100px" }} />
            </div>
          )}

          {confirmScreen && (
            <div className="confirm-screen">
              <span className="cs-icon">🎉</span>
              <div className="cs-title">Round 2 Order Placed!</div>
              <div className="cs-sub">Kitchen mein gaya! Final bill mein dono orders ek saath dikhengi.</div>
              <div className="cs-detail-box">
                <div className="cdb-row">
                  <span>Order #1 (Served)</span>
                  <span style={{ color: "var(--green)" }}>₹540 ✓</span>
                </div>
                <div className="cdb-row">
                  <span>Round 2 Items</span>
                  <span style={{ color: "var(--blue)" }}>{round2Items.join(", ")}</span>
                </div>
                <div className="cdb-row">
                  <span>Session Total</span>
                  <span style={{ color: "var(--red)" }}>₹{mockOrderData.currentTotal + cartTotal}</span>
                </div>
              </div>
              <button className="cs-btn primary" onClick={() => handleFlowChange("case3")}>
                ← Back to Tracking
              </button>
            </div>
          )}
        </div>
      )}

      {/* KITCHEN VIEW */}
      {currentFlow === "kitchen" && (
        <div className="flow-screen kitchen-view">
          <div className="kitchen-wrap">
            <div className="kw-header">
              <div>
                <div className="kw-title">🍳 Kitchen Display</div>
                <div className="kw-subtitle">Multiple orders — ek table</div>
              </div>
              <div className="kw-live">
                <div className="kw-dot"></div>LIVE
              </div>
            </div>

            <div className="kw-table-header">
              <div>
                <div className="kwth-table">Table T-04</div>
                <div className="kwth-session">Session started 3:20 PM · Waiter: Ravi</div>
              </div>
              <div className="kwth-total">
                <div className="kwth-amount">₹1,420</div>
                <div className="kwth-orders">3 orders · Session total</div>
              </div>
            </div>

            <div className="k-order-section merged">
              <div className="ko-label">Case 1 — Merged Order</div>
              <div className="k-order">
                <div className="ko-head">
                  <div className="ko-id">
                    <span className="ko-num">Order #MH2X9K (Merged)</span>
                    <span className="ko-status-chip merged">🔀 Merged</span>
                  </div>
                  <span className="ko-timer">⏱ 8 min ago</span>
                </div>
                <div className="ko-items">
                  <div className="ko-item">
                    <div className="ko-vdot nv"></div>
                    <span className="ko-item-name">Butter Chicken</span>
                    <span className="ko-item-qty">×1</span>
                  </div>
                  <div className="ko-item highlighted">
                    <div className="ko-vdot v"></div>
                    <span className="ko-item-name">+ Dal Makhani (ADDED)</span>
                    <span className="ko-item-qty">×1</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="k-order-section">
              <div className="ko-label">Case 2 — Two Separate Orders</div>
              <div className="k-order">
                <div className="ko-head">
                  <div className="ko-id">
                    <span className="ko-num">Order #KX7P2M — #1</span>
                    <span className="ko-status-chip preparing">🔥 Preparing</span>
                  </div>
                </div>
                <div className="ko-items">
                  <div className="ko-item">
                    <div className="ko-vdot v"></div>
                    <span className="ko-item-name">Paneer Tikka</span>
                    <span className="ko-item-qty">×1</span>
                  </div>
                </div>
              </div>
              <div className="k-order new-order">
                <div className="ko-head">
                  <div className="ko-id">
                    <span className="ko-num">Order #KX7P2M — #2</span>
                    <span className="ko-status-chip new">🆕 New</span>
                  </div>
                </div>
                <div className="ko-items">
                  <div className="ko-item">
                    <div className="ko-vdot v"></div>
                    <span className="ko-item-name">Mango Lassi</span>
                    <span className="ko-item-qty">×1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMBINED BILL */}
      {currentFlow === "bill" && (
        <div className="flow-screen bill-view">
          <div className="case-header">
            <div className="ch-tag blue">🧾 Final Bill — Table T-04</div>
            <div className="ch-title">Saare Orders Ka Combined Bill</div>
          </div>

          <div className="bill-wrap">
            <div className="bill-order-block">
              <div className="bob-header">
                <span className="bob-num ord1">Order #1</span>
                <span style={{ fontSize: "0.62rem", color: "var(--green)", fontWeight: "700" }}>✓ Served</span>
                <span className="bob-total">₹540</span>
              </div>
              <div className="bob-item">
                <div className="bob-dot nv"></div>
                <span className="bob-name">Butter Chicken</span>
                <span className="bob-qty">×1</span>
                <span className="bob-price">₹380</span>
              </div>
              <div className="bob-item">
                <div className="bob-dot v"></div>
                <span className="bob-name">Garlic Naan</span>
                <span className="bob-qty">×2</span>
                <span className="bob-price">₹160</span>
              </div>
            </div>

            <div className="bill-order-block">
              <div className="bob-header">
                <span className="bob-num ord2">Order #2</span>
                <span style={{ fontSize: "0.62rem", color: "var(--orange)", fontWeight: "700" }}>🔥 Preparing</span>
                <span className="bob-total">₹380</span>
              </div>
              <div className="bob-item">
                <div className="bob-dot v"></div>
                <span className="bob-name">Dal Makhani</span>
                <span className="bob-qty">×1</span>
                <span className="bob-price">₹260</span>
              </div>
              <div className="bob-item">
                <div className="bob-dot v"></div>
                <span className="bob-name">Mango Lassi</span>
                <span className="bob-qty">×1</span>
                <span className="bob-price">₹120</span>
              </div>
            </div>

            <div className="bill-totals">
              <div className="bt-row">
                <span>Subtotal (2 orders)</span>
                <span>₹920</span>
              </div>
              <div className="bt-row">
                <span>CGST (2.5%)</span>
                <span>₹23</span>
              </div>
              <div className="bt-row">
                <span>SGST (2.5%)</span>
                <span>₹23</span>
              </div>
              <div className="bt-row savings">
                <span>👑 Loyalty Discount</span>
                <span>−₹20</span>
              </div>
              <div className="bt-row total">
                <span>Grand Total</span>
                <span>₹946</span>
              </div>
            </div>
          </div>

          <div className="pay-section">
            <div className="ps-title">💳 Payment Method</div>
            <div className="pay-opts">
              <div className="pay-opt sel">
                <span className="pay-opt-ico">📱</span>
                <span className="pay-opt-lbl">UPI / QR</span>
              </div>
              <div className="pay-opt">
                <span className="pay-opt-ico">💵</span>
                <span className="pay-opt-lbl">Cash</span>
              </div>
              <div className="pay-opt">
                <span className="pay-opt-ico">💳</span>
                <span className="pay-opt-lbl">Card</span>
              </div>
            </div>
            <button className="place-btn" onClick={() => toast.success("Payment confirmed! ✓")}>
              ✅ Confirm Payment — ₹946
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CART */}
      {showCart && cartItems.length > 0 && !confirmScreen && (
        <div className="cart-bar show">
          <div 
            className={`cart-inner ${currentFlow === "case1" ? "green" : currentFlow === "case2" ? "orange" : "blue"}`}
            onClick={handleSubmitOrder}
            style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="cart-cnt">{isSubmitting ? "..." : cartItems.length}</span>
              <span className="cart-lbl">{isSubmitting ? "Submitting..." : "Place Order"}</span>
            </div>
            <span className="cart-tot">₹{cartTotal}</span>
          </div>
        </div>
      )}
    </div>
  );
}
