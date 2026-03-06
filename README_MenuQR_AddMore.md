# MenuQR Add More Items Flow - Complete Implementation Guide

## 🎯 Overview

The **MenuQR AddMore Flow** is a complete three-case system that handles different scenarios when customers want to add more items to their order at a restaurant. It's designed for QR code-based ordering systems and provides seamless workflows for:

- **Case 1 (Merge)** - Order in "Confirming" state
- **Case 2 (Separate)** - Order in "Preparing" state  
- **Case 3 (Round 2)** - Order already "Served"

---

## 📁 File Structure

```
src/
├── components/
│   ├── MenuQRAddMoreFlow.tsx              # Main component (all 3 cases + kitchen + bill)
│   ├── MenuQRAddMoreFlow.css              # Complete styling
│   └── MenuQRAddMoreFlow.example.tsx      # Implementation examples & guide
├── types/
│   └── menuQRAddMore.ts                   # TypeScript type definitions
```

---

## 🎨 Three Cases Explained

### ✅ **CASE 1: MERGE** (Green Button)
**When:** Order status is "Received" / "Confirming"  
**What happens:**
- Kitchen hasn't accepted the order yet
- New items are added directly to the same order
- Combined order sent to kitchen
- Kitchen sees new items highlighted in green
- **One combined order**, delivered together

```
Order #1 (Confirming)
├── Butter Chicken ×1 ₹380
├── Garlic Naan ×2 ₹160
└── + NEW ITEMS (Green highlight)
    ├── Dal Makhani ×1 ₹260
    └── Mango Lassi ×1 ₹120
```

**API:** `PUT /api/orders/{orderId}/items` with `caseType: "merge"`

---

### ⚠️ **CASE 2: SEPARATE** (Orange Button)
**When:** Order status is "Preparing"  
**What happens:**
- Kitchen is already preparing the first order
- New items create a separate Order #2
- Warning shown to customer about separate timing
- Two orders delivered at different times
- **One combined bill** at the end

```
Order #1 (Preparing)          Order #2 (New)
├── Butter Chicken ×1 ₹380   ├── Dal Makhani ×1 ₹260
└── Garlic Naan ×2 ₹160      └── Mango Lassi ×1 ₹120

Kitchen has TWO separate order cards
Customer pays ONE combined bill
```

**API:** `POST /api/orders` with `caseType: "separate"` + parent order link

---

### 🔄 **CASE 3: ROUND 2** (Blue Button)
**When:** Order status is "Served"  
**What happens:**
- First order completely delivered
- Customer can order fresh items (desserts, drinks, etc.)
- Creates Round 2 order
- Soft suggestions for desserts/drinks
- **Final bill** combines all orders

```
Order #1 (Served) ✓
├── Butter Chicken ×1 ₹380
└── Garlic Naan ×2 ₹160

Round 2 (New) 🔄
├── Gulab Jamun ×1 ₹120
├── Kulfi Falooda ×1 ₹160
└── Masala Chai ×2 ₹120
```

**API:** `POST /api/orders/{orderId}/round2` with `caseType: "round2"`

---

## 🚀 Usage

### Basic Import

```tsx
import MenuQRAddMoreFlow from "@/components/MenuQRAddMoreFlow";

export function MyMenuPage() {
  const [showAddMore, setShowAddMore] = useState(false);
  const [orderStatus, setOrderStatus] = useState("received");

  return (
    <div>
      <button onClick={() => setShowAddMore(true)}>
        ➕ Add More Items
      </button>

      {showAddMore && (
        <MenuQRAddMoreFlow
          onClose={() => setShowAddMore(false)}
          caseType={getCaseType(orderStatus)}
          orderData={{
            orderId: "#MH2X9K",
            tableId: "T-04",
            status: orderStatus,
            items: currentOrderItems,
            createdAt: "2 min ago",
            currentTotal: 540,
          }}
        />
      )}
    </div>
  );
}
```

### Props

```typescript
interface MenuQRAddMoreFlowProps {
  onClose?: () => void;                    // Callback when user closes flow
  caseType?: "merge" | "separate" | "round2";  // Auto-determines case
  orderData?: {
    orderId: string;
    tableId: string;
    status: "received" | "preparing" | "served";
    items: Array<{ name: string; qty: number; price: number }>;
    createdAt: string;
    currentTotal: number;
  };
}
```

---

## 🔧 Integration Steps

### 1. Install Component
```bash
cp src/components/MenuQRAddMoreFlow.* src/components/
cp src/types/menuQRAddMore.ts src/types/
```

### 2. Import in Your Menu Page
```tsx
import MenuQRAddMoreFlow from "@/components/MenuQRAddMoreFlow";
import { useState } from "react";

export default function MenuPage() {
  const [showAddMore, setShowAddMore] = useState(false);
  // ... rest of code
}
```

### 3. Determine Order Status
```tsx
const getButtonColor = (status: string) => {
  switch(status) {
    case "received": return "green";      // Case 1 - Merge
    case "preparing": return "orange";    // Case 2 - Separate
    case "served": return "blue";         // Case 3 - Round 2
  }
};

const getCaseType = (status: string) => {
  switch(status) {
    case "received": return "merge";
    case "preparing": return "separate";
    case "served": return "round2";
  }
};
```

### 4. Add Event Handler
```tsx
const handleAddMore = () => {
  setShowAddMore(true);
};

const handleItemsAdded = async (items: CartItem[], caseType: string) => {
  // Call your API to handle the case
  await addItemsToOrder(orderId, items, caseType);
  setShowAddMore(false);
};
```

---

## 📡 API Endpoints Required

### Case 1: Merge Items
```typescript
PUT /api/orders/{orderId}/items

Request:
{
  "items": [
    { "name": "Dal Makhani", "price": 260, "quantity": 1 },
    { "name": "Mango Lassi", "price": 120, "quantity": 1 }
  ],
  "caseType": "merge"
}

Response:
{
  "success": true,
  "orderId": "order-123",
  "mergedItems": 2,
  "newTotal": 920,
  "kitchen_notified": true
}
```

### Case 2: Create Separate Order
```typescript
POST /api/orders

Request:
{
  "tableId": "T-04",
  "items": [
    { "name": "Dal Makhani", "price": 260, "quantity": 1 }
  ],
  "parentOrderId": "order-123",
  "caseType": "separate"
}

Response:
{
  "success": true,
  "newOrderId": "order-456",
  "parentOrderId": "order-123",
  "sessionTotal": 960
}
```

### Case 3: Round 2 Order
```typescript
POST /api/orders/{orderId}/round2

Request:
{
  "items": [
    { "name": "Gulab Jamun", "price": 120, "quantity": 1 },
    { "name": "Kulfi Falooda", "price": 160, "quantity": 1 }
  ],
  "caseType": "round2"
}

Response:
{
  "success": true,
  "round2OrderId": "order-789",
  "previousOrderId": "order-123",
  "sessionTotal": 1080
}
```

### Get Combined Bill
```typescript
GET /api/orders/{sessionId}/combined-bill

Response:
{
  "success": true,
  "orders": [
    { "orderId": "order-123", "items": [...], "total": 540 },
    { "orderId": "order-456", "items": [...], "total": 380 }
  ],
  "subtotal": 920,
  "cgst": 23,
  "sgst": 23,
  "loyaltyDiscount": 20,
  "grandTotal": 946
}
```

---

## 🍳 Kitchen Display Integration

### Case 1: Merged Order Display
```tsx
<KitchenOrderCard>
  <OrderNumber>Order #MH2X9K (Merged)</OrderNumber>
  <StatusChip>🔀 Merged</StatusChip>
  
  <OrderItems>
    <Item veg={false}>Butter Chicken ×1</Item>
    <Item veg={true}>Garlic Naan ×2</Item>
    <Item highlighted>+ Dal Makhani ×1 (ADDED)</Item>  {/* Green highlight */}
    <Item highlighted>+ Mango Lassi ×1 (ADDED)</Item>  {/* Green highlight */}
  </OrderItems>
  
  <Actions>
    <Button>🔥 Start Cooking</Button>
    <Button>✅ Mark Ready</Button>
  </Actions>
</KitchenOrderCard>
```

### Case 2: Separate Orders Display
```tsx
{/* Order #1 - Preparing */}
<KitchenOrderCard status="preparing">
  <OrderNumber>Order #KX7P2M — #1</OrderNumber>
  <Items>
    <Item>Butter Chicken ×1</Item>
    <Item>Garlic Naan ×2</Item>
  </Items>
</KitchenOrderCard>

{/* Order #2 - New */}
<KitchenOrderCard status="new">
  <OrderNumber>Order #KX7P2M — #2</OrderNumber>
  <Tag>⚡ Alag order — #1 ke baad banao</Tag>
  <Items>
    <Item>Dal Makhani ×1</Item>
    <Item>Mango Lassi ×1</Item>
  </Items>
</KitchenOrderCard>
```

### Case 3: Round 2 Display
```tsx
{/* Order #1 - Served (Faded) */}
<KitchenOrderCard opacity={0.5}>
  <OrderNumber>Order #QR9821 — #1</OrderNumber>
  <Badge>✅ Served</Badge>
  <Items>
    <Item>Butter Chicken ×1</Item>
    <Item>Garlic Naan ×2</Item>
  </Items>
</KitchenOrderCard>

{/* Round 2 - New */}
<KitchenOrderCard status="new">
  <OrderNumber>Order #QR9821 — Round 2 🔄</OrderNumber>
  <Tag>🔄 Customer wants more!</Tag>
  <Items>
    <Item>Gulab Jamun ×1</Item>
    <Item>Kulfi Falooda ×1</Item>
    <Item>Masala Chai ×2</Item>
  </Items>
</KitchenOrderCard>
```

---

## 💳 Final Bill Display

All three cases result in **ONE COMBINED BILL**:

```
╔════════════════════════════════╗
║   Final Bill — Table T-04      ║
╠════════════════════════════════╣
║ Order #1 (Served ✓) ₹540       ║
║  • Butter Chicken ×1 ₹380      ║
║  • Garlic Naan ×2 ₹160         ║
├────────────────────────────────┤
║ Order #2 (Preparing 🔥) ₹380   ║
║  • Dal Makhani ×1 ₹260         ║
║  • Mango Lassi ×1 ₹120         ║
├────────────────────────────────┤
║ Round 2 (New) ₹500             ║
║  • Gulab Jamun ×1 ₹120         ║
║  • Kulfi Falooda ×1 ₹160       ║
║  • Masala Chai ×2 ₹120         ║
║  • Chicken Biryani ×1 ₹360     ║
╠════════════════════════════════╣
║ Subtotal (3 orders)   ₹1,420   ║
║ CGST (2.5%)           ₹35.50   ║
║ SGST (2.5%)           ₹35.50   ║
║ 👑 Loyalty Discount   −₹32     ║
╠════════════════════════════════╣
║ Grand Total           ₹1,459   ║
╚════════════════════════════════╝

Payment: UPI/QR | masalahouse@upi
```

---

## 🎯 User Flows

### Flow 1: Customer Journey
```
Customer browsing menu
       ↓
Add items → Order placed (Case 1, 2, or 3)
       ↓
Order Status
├─ Received/Confirming → Green "Edit Order" (MERGE)
├─ Preparing → Orange "Kuch Aur Order" (SEPARATE)  
└─ Served → Blue "Round 2" (ROUND 2)
       ↓
Uses QR Code → Taps "Add More"
       ↓
Selects items based on case
       ↓
Items sent to kitchen appropriately
       ↓
New items appear in kitchen display
       ↓
Orders ready at different times
       ↓
One combined bill on checkout
```

### Flow 2: Kitchen Journey
```
Kitchen sees Order #MH2X9K (Merged)
├─ Original items: Butter Chicken, Naan
└─ New items (green): Dal Makhani, Lassi
     ↓
Kitchen prepares all TOGETHER
     ↓
All items delivered at same time
```

### Flow 3: Billing Journey
```
Order #1, #2, Round 2 in same session
     ↓
Each order tracked separately
     ↓
Checkout combines all orders
     ↓
Single GST calculation on total
     ↓
One final bill
     ↓
One payment (UPI/Cash/Card)
```

---

## 📱 UI Components Reference

### Master Navigation (Top)
- 5 tabs: Case 1, Case 2, Case 3, Kitchen View, Combined Bill
- Color-coded: Green, Orange, Blue, Dark, Blue

### Key Buttons
```css
.add-more-btn.green    /* Case 1 - Merge */
.add-more-btn.orange   /* Case 2 - Separate */
.add-more-btn.blue     /* Case 3 - Round 2 */
```

### Status Badges
```css
.badge-received   /* Case 1 */
.badge-preparing  /* Case 2 */
.badge-served     /* Case 3 */
```

---

## 🔐 Database Schema

```sql
-- New columns for orders table
ALTER TABLE orders ADD COLUMN (
  parent_order_id UUID,
  case_type VARCHAR(20),        -- 'merge', 'separate', 'round2'
  is_merged BOOLEAN DEFAULT false,
  merged_at TIMESTAMP,
  related_orders JSONB           -- Array of related order IDs
);

-- Track order relationships
CREATE TABLE order_relations (
  id UUID PRIMARY KEY,
  parent_order_id UUID NOT NULL,
  child_order_id UUID NOT NULL,
  relation_type VARCHAR(20),    -- 'merge', 'separate', 'round2'
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (parent_order_id) REFERENCES orders(id),
  FOREIGN KEY (child_order_id) REFERENCES orders(id)
);

-- Session-level tracking
CREATE TABLE session_orders (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  table_id UUID NOT NULL,
  order_ids JSONB,              -- Array of order IDs in session
  total_amount DECIMAL(10,2),
  order_count INT,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);
```

---

## 🎨 Customization

### Colors
Edit in `MenuQRAddMoreFlow.css`:
```css
:root {
  --red: #E23744;        /* Case 1 merge, buttons */
  --green: #22C55E;      /* Case 1 status */
  --orange: #F97316;     /* Case 2 separate */
  --blue: #3B82F6;       /* Case 3 round 2 */
}
```

### Text (Hindi Currently)
Replace text in component or create i18n:
```tsx
const labels = {
  case1Title: "Order Edit Karo — Merge Ho Jaayega",
  case2Title: "Naya Alag Order Banega",
  case3Title: "Round 2 — Kuch Aur Mangwao!"
};
```

### Menu Items
Replace `MENU_ITEMS` array in component with your actual menu from database.

---

## ✅ Testing Checklist

- [ ] Case 1: Add items to "Received" order → Merge successful
- [ ] Case 2: Add items to "Preparing" order → Warning shown → New order created
- [ ] Case 3: Add items to "Served" order → Round 2 items added  
- [ ] Kitchen view shows merged items with green highlight (Case 1)
- [ ] Kitchen view shows separate order cards (Case 2)
- [ ] Kitchen view shows Round 2 with "customer wants more" tag (Case 3)
- [ ] Combined bill shows all three orders together
- [ ] Single GST calculation on combined total
- [ ] Payment options work (UPI, Cash, Card)
- [ ] Receipt sent via WhatsApp after payment

---

## 🚀 Deployment

1. **Copy files** to your project
2. **Update API endpoints** to match your backend
3. **Integrate kitchen display system**
4. **Update billing system**
5. **Test all three cases thoroughly**
6. **Deploy to production**

---

## 📞 Support & Extensions

### Future Enhancements
- [ ] Quantity modifications in cart
- [ ] Special instructions per item
- [ ] Combo deals in Round 2
- [ ] Real-time kitchen notifications
- [ ] Estimated delivery times
- [ ] Loyalty points tracking
- [ ] Multiple language support

---

**Created:** March 6, 2026  
**Component Version:** 1.0.0  
**Status:** Production Ready ✅
