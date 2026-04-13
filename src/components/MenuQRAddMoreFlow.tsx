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
  customerName?: string;
  customerPhone?: string;
};

interface MenuQRAddMoreFlowProps {
  onClose?: () => void;
  caseType?: "merge" | "separate" | "round2";
  orderData?: CaseData;
  clerkUserId?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  sellingPrice?: number;
  isVeg?: boolean;
}

// removed hardcoded MENU_ITEMS

export default function MenuQRAddMoreFlow({ onClose, caseType = "merge", orderData, clerkUserId }: MenuQRAddMoreFlowProps) {
  const [currentFlow, setCurrentFlow] = useState<OrderCase>("case1");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmScreen, setConfirmScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Case-specific data
  const [mergedItems, setMergedItems] = useState<string[]>([]);
  const [newOrderItems, setNewOrderItems] = useState<string[]>([]);
  const [round2Items, setRound2Items] = useState<string[]>([]);

  // Combined session data
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Memoize order data to stabilize dependencies
  const activeOrderData = React.useMemo(() => orderData || {
    orderId: "#MH2X9K",
    tableId: "T-04",
    status: "received" as OrderStatus,
    items: [
      { name: "Butter Chicken", qty: 1, price: 380 },
      { name: "Garlic Naan", qty: 2, price: 160 },
    ],
    createdAt: "2 min ago",
    currentTotal: 540,
  }, [orderData]);

  const fetchSessionData = useCallback(async () => {
    const id = activeOrderData.orderId.replace("#", "");
    setIsLoadingSession(true);
    try {
      const res = await fetch(`/api/public/orders/${id}/combined-bill`);
      if (res.ok) {
        const data = await res.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error("Failed to fetch session data:", err);
    } finally {
      setIsLoadingSession(false);
    }
  }, [activeOrderData.orderId]);

  // Fetch full menu on mount if clerkUserId is available
  React.useEffect(() => {
    if (clerkUserId) {
      setIsLoadingMenu(true);
      fetch(`/api/public/menu?clerkId=${clerkUserId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMenuItems(data);
        })
        .catch(err => {
          console.error("Failed to fetch menu:", err);
          toast.error("Failed to load menu");
        })
        .finally(() => setIsLoadingMenu(false));
    }
  }, [clerkUserId]);

  // Fetch session data when switching to kitchen or bill
  React.useEffect(() => {
    if (currentFlow === "kitchen" || currentFlow === "bill") {
      fetchSessionData();
    }
  }, [currentFlow, fetchSessionData]);

  // Set flow based on caseType prop or orderData status
  React.useEffect(() => {
    if (caseType === "separate") setCurrentFlow("case2");
    else if (caseType === "round2") setCurrentFlow("case3");
    else if (activeOrderData?.status) {
      const s = activeOrderData.status.toUpperCase();
      if (["PENDING", "ACCEPTING", "RECEIVED"].includes(s)) setCurrentFlow("case1");
      else if (["ACCEPTED", "PREPARING", "READY"].includes(s)) setCurrentFlow("case2");
      else if (["SERVED", "COMPLETED"].includes(s)) setCurrentFlow("case3");
    }
  }, [caseType, activeOrderData]);

  const [showCartItems, setShowCartItems] = useState(false);

  // Helper to update total whenever cartItems changes
  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
  };

  const handleAddItem = useCallback((item: { id: string; name: string; price: number; veg: boolean; desc: string }) => {
    setCartItems(prev => {
      const existing = prev.find((ci) => ci.name === item.name);
      let newItems;
      if (existing) {
        newItems = prev.map((ci) => (ci.name === item.name ? { ...ci, quantity: ci.quantity + 1 } : ci));
      } else {
        newItems = [...prev, { name: item.name, price: item.price, quantity: 1 }];
      }
      setCartTotal(calculateTotal(newItems));
      return newItems;
    });

    setShowCart(true);
    toast.success(`${item.name} added!`);
  }, []);

  const handleRemoveItem = useCallback((itemName: string) => {
    setCartItems(prev => {
      let newItems = [...prev];
      const idx = newItems.findIndex(i => i.name === itemName);
      if (idx > -1) {
        if (newItems[idx].quantity > 1) {
          newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity - 1 };
        } else {
          newItems.splice(idx, 1);
        }
      }
      setCartTotal(calculateTotal(newItems));
      return newItems;
    });
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (cartItems.length === 0) {
      toast.error("Please add items first!");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const orderId = activeOrderData.orderId.replace("#", "");
      
      if (currentFlow === "case1") {
        // Case 1: Merge items to existing order
        const response = await fetch(`/api/public/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: clerkUserId,
            items: cartItems.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity, // Added explicit line total
              addedAt: new Date().toISOString(),
              addedInCase: "merge"
            })),
            total: cartTotal,
            caseType: "merge",
            parentOrderId: orderId,
            tableId: activeOrderData.tableId // Ensure table info is passed
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to merge items");
        }

        setMergedItems(cartItems.map((ci) => ci.name));
        setConfirmScreen(true);
        setShowCart(false);
        toast.success(`✅ Items merged to order!`);
      } else {
        // Case 2 & 3: Create separate / round 2 order
        const response = await fetch(`/api/public/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: clerkUserId,
            tableId: activeOrderData.tableId,
            items: cartItems.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity, // Added explicit line total
              addedAt: new Date().toISOString(),
              addedInCase: currentFlow === "case2" ? "separate" : "round2",
            })),
            total: cartTotal,
            customerName: activeOrderData.customerName || "Customer",
            customerPhone: activeOrderData.customerPhone,
            caseType: currentFlow === "case2" ? "separate" : "round2",
            parentOrderId: orderId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to place order");
        }

        if (currentFlow === "case2") {
          setNewOrderItems(cartItems.map((ci) => ci.name));
        } else {
          setRound2Items(cartItems.map((ci) => ci.name));
        }

        setConfirmScreen(true);
        setShowCart(false);
        toast.success(currentFlow === "case2" ? "📋 New separate order placed!" : "🎉 Round 2 order placed!");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to submit order";
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [cartItems, cartTotal, currentFlow, activeOrderData, clerkUserId]);


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


      {/* CASE 1: MERGE */}
      {currentFlow === "case1" && (
        <div className="flow-screen case-1">


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

          </div>

          {/* MENU ITEMS */}
          {showCart && !confirmScreen && (
            <div className="menu-section">
              <div className="menu-mini-header">
                <div className="mmh-title">Aur Items Add Karo</div>
                <div className="mmh-sub">Search for more delicious food</div>
              </div>

              {isLoadingMenu ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading menu...</div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="mitem-compact">
                    <div className={`mic-dot ${item.isVeg ? "v" : "nv"}`}></div>
                    <div className="mic-info">
                      <div className="mic-name">{item.name}</div>
                      <div className="mic-desc">{item.description}</div>
                    </div>
                    <span className="mic-price">₹{item.sellingPrice || item.price}</span>
                    <button className="add-btn-sm" onClick={() => handleAddItem({
                      id: item.id,
                      name: item.name,
                      price: item.sellingPrice || item.price || 0,
                      veg: item.isVeg || false,
                      desc: item.description || ""
                    })}>
                      ADD
                    </button>
                  </div>
                ))
              )}
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
                  <div className="cs-sub">Your items have been added. Kitchen has received the updated order.</div>
                  <button className="cs-btn primary" onClick={() => (onClose ? onClose() : handleFlowChange("case1"))}>
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

              {isLoadingMenu ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading menu...</div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="mitem-compact">
                    <div className={`mic-dot ${item.isVeg ? "v" : "nv"}`}></div>
                    <div className="mic-info">
                      <div className="mic-name">{item.name}</div>
                      <div className="mic-desc">{item.description}</div>
                    </div>
                    <span className="mic-price">₹{item.sellingPrice || item.price}</span>
                    <button className="add-btn-sm" onClick={() => handleAddItem({
                      id: item.id,
                      name: item.name,
                      price: item.sellingPrice || item.price || 0,
                      veg: item.isVeg || false,
                      desc: item.description || ""
                    })}>
                      ADD
                    </button>
                  </div>
                ))
              )}
              <div style={{ height: "100px" }} />
            </div>
          )}

          {confirmScreen && (
            <div className="confirm-screen">
              <span className="cs-icon">📋</span>
              <div className="cs-title">Order Placed!</div>
              <div className="cs-sub">Your new items are being prepared by the kitchen.</div>
              <button className="cs-btn primary" onClick={() => (onClose ? onClose() : handleFlowChange("case2"))}>
                ← Back to Tracking
              </button>
            </div>
          )}
        </div>
      )}

      {/* CASE 3: ROUND 2 */}
      {currentFlow === "case3" && (
        <div className="flow-screen case-3">


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

          </div>

          {showCart && !confirmScreen && (
            <div className="menu-section">
              <div className="menu-mini-header">
                <div className="mmh-badge round2">🔄 Round 2</div>
                <div className="mmh-title">Kya Mangwaoge? 😊</div>
                <div className="mmh-sub">Desserts, drinks ya kuch aur — sab welcome hai!</div>
              </div>

              {isLoadingMenu ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading menu...</div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="mitem-compact">
                    <div className={`mic-dot ${item.isVeg ? "v" : "nv"}`}></div>
                    <div className="mic-info">
                      <div className="mic-name">{item.name}</div>
                      <div className="mic-desc">{item.description}</div>
                    </div>
                    <span className="mic-price">₹{item.sellingPrice || item.price}</span>
                    <button className="add-btn-sm" onClick={() => handleAddItem({
                      id: item.id,
                      name: item.name,
                      price: item.sellingPrice || item.price || 0,
                      veg: item.isVeg || false,
                      desc: item.description || ""
                    })}>
                      ADD
                    </button>
                  </div>
                ))
              )}
              <div style={{ height: "100px" }} />
            </div>
          )}

          {confirmScreen && (
            <div className="confirm-screen">
              <span className="cs-icon">🎉</span>
              <div className="cs-title">Order Received!</div>
              <div className="cs-sub">The kitchen is working on your new items. Enjoy your meal!</div>
              <button className="cs-btn primary" onClick={() => (onClose ? onClose() : handleFlowChange("case3"))}>
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
                <div className="kw-subtitle">Orders Summary — Table {sessionData?.table?.name}</div>
              </div>
              <div className="kw-live">
                <div className="kw-dot"></div>LIVE
              </div>
            </div>

            {isLoadingSession ? (
              <div style={{ padding: "40px", textAlign: "center" }}>Loading orders...</div>
            ) : !sessionData ? (
              <div style={{ padding: "40px", textAlign: "center" }}>No orders found for this session</div>
            ) : (
              <>
                <div className="kw-table-header">
                  <div>
                    <div className="kwth-table">Table {sessionData.table?.name || mockOrderData.tableId}</div>
                    <div className="kwth-session">Session Order Tracking</div>
                  </div>
                  <div className="kwth-total">
                    <div className="kwth-amount">₹{sessionData.grandTotal}</div>
                    <div className="kwth-orders">{sessionData.orders.length} orders · Session total</div>
                  </div>
                </div>

                <div className="kw-orders-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {sessionData.orders.map((order: any, idx: number) => (
                    <div key={order.id} className={`k-order-section ${order.caseType === "merge" ? "merged" : ""}`}>
                      <div className="ko-label">
                        {order.caseType === "merge" ? "Merged Changes" :
                          order.caseType === "separate" ? "Separate Order" :
                            order.caseType === "round2" ? "Round 2" : "Initial Order"}
                      </div>
                      <div className={`k-order ${order.caseType === "separate" || order.caseType === "round2" ? "new-order" : ""}`}>
                        <div className="ko-head">
                          <div className="ko-id">
                            <span className="ko-num">Order #{order.id.slice(-6)}</span>
                            <span className={`ko-status-chip ${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </div>
                          <span className="ko-timer">⏱ {new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="ko-items">
                          {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                            <div key={i} className={`ko-item ${item.isNew ? "highlighted" : ""}`}>
                              <div className={`ko-vdot ${item.isVeg ? "v" : "nv"}`}></div>
                              <span className="ko-item-name">{item.isNew ? "+ " : ""}{item.name}</span>
                              <span className="ko-item-qty">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* COMBINED BILL */}
      {currentFlow === "bill" && (
        <div className="flow-screen bill-view">
          <div className="bill-wrap">
            {isLoadingSession ? (
              <div style={{ padding: "40px", textAlign: "center" }}>Calculating bill...</div>
            ) : !sessionData ? (
              <div style={{ padding: "40px", textAlign: "center" }}>No bill data available</div>
            ) : (
              <>
                {sessionData.orders.map((order: any, index: number) => (
                  <div key={order.id} className="bill-order-block">
                    <div className="bob-header">
                      <span className={`bob-num ord${(index % 2) + 1}`}>Order #{index + 1}</span>
                      <span style={{ fontSize: "0.62rem", color: "var(--green)", fontWeight: "700" }}>{order.status}</span>
                      <span className="bob-total">₹{order.total}</span>
                    </div>
                    {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                      <div key={i} className="bob-item">
                        <div className={`bob-dot ${item.isVeg ? "v" : "nv"}`}></div>
                        <span className="bob-name">{item.name}</span>
                        <span className="bob-qty">×{item.quantity}</span>
                        <span className="bob-price">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="bill-totals">
                  <div className="bt-row">
                    <span>Subtotal ({sessionData.orders.length} orders)</span>
                    <span>₹{sessionData.subtotal}</span>
                  </div>
                  <div className="bt-row">
                    <span>CGST (2.5%)</span>
                    <span>₹{sessionData.cgst}</span>
                  </div>
                  <div className="bt-row">
                    <span>SGST (2.5%)</span>
                    <span>₹{sessionData.sgst}</span>
                  </div>
                  <div className="bt-row total">
                    <span>Grand Total</span>
                    <span>₹{sessionData.grandTotal}</span>
                  </div>
                </div>
              </>
            )}
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
              ✅ Confirm Payment — ₹{sessionData?.grandTotal || 0}
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CART Overlay */}
      {showCart && cartItems.length > 0 && showCartItems && !confirmScreen && (
        <div className="cart-items-overlay" onClick={() => setShowCartItems(false)}>
          <div className="cart-items-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="cis-header">
              <span className="cis-title">Selected Items</span>
              <button className="cis-close" onClick={() => setShowCartItems(false)}>✕</button>
            </div>
            <div className="cis-list">
              {cartItems.map((ci, idx) => (
                <div key={idx} className="cis-item">
                  <div className="cis-item-info">
                    <div className="cis-item-name">{ci.name}</div>
                    <div className="cis-item-price">₹{ci.price}</div>
                  </div>
                  <div className="cis-qty-wrap">
                    <button className="qty-btn" onClick={() => handleRemoveItem(ci.name)}>−</button>
                    <span className="qty-num">{ci.quantity}</span>
                    <button className="qty-btn" onClick={() => handleAddItem({ id: "", name: ci.name, price: ci.price, veg: true, desc: "" })}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cis-footer">
              <div className="cis-total">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>
              <button className="place-btn-final" onClick={handleSubmitOrder} disabled={isSubmitting}>
                {isSubmitting ? "Placing Order..." : "Confirm & Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART BAR */}
      {showCart && cartItems.length > 0 && !confirmScreen && !showCartItems && (
        <div className="cart-bar show">
          <div
            className={`cart-inner ${currentFlow === "case1" ? "green" : currentFlow === "case2" ? "orange" : "blue"}`}
            onClick={() => setShowCartItems(true)}
            style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="cart-cnt">{isSubmitting ? "..." : cartItems.length}</span>
              <span className="cart-lbl">View Selected Items</span>
            </div>
            <span className="cart-tot">₹{cartTotal} ›</span>
          </div>
        </div>
      )}
    </div>
  );
}
