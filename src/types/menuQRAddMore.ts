// Type definitions for MenuQR Add More Flow system

export type OrderStatus = "received" | "preparing" | "served";
export type CaseType = "case1" | "case2" | "case3" | "kitchen" | "bill";
export type PaymentMethod = "upi" | "cash" | "card";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  categoryId?: string;
  category?: {
    name: string;
  };
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  addedAt?: Date;
  status?: "pending" | "confirmed" | "preparing" | "ready" | "served";
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  updatedAt?: Date;
  servedAt?: Date;
  totalAmount: number;
  notes?: string;
  caseType: CaseType;
}

export interface SessionOrder {
  orderId: string;
  parentOrderId?: string; // For merged or related orders
  caseType: "merge" | "separate" | "round2";
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  createdAt: Date;
  priority: "normal" | "urgent";
}

export interface BillSummary {
  sessionId: string;
  tableId: string;
  orders: Order[];
  subtotal: number;
  cgst: number;
  sgst: number;
  loyaltyDiscount?: number;
  grandTotal: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: "pending" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

export interface MenuQRAddMoreFlowProps {
  orderId: string;
  tableId: string;
  currentStatus: OrderStatus;
  currentItems: OrderItem[];
  onAddItems: (items: CartItem[], caseType: CaseType) => Promise<void>;
  onClose?: () => void;
  businessId?: string;
  sessionId?: string;
}

export interface FlowState {
  currentFlow: CaseType;
  cartItems: CartItem[];
  cartTotal: number;
  showCart: boolean;
  showWarning: boolean;
  confirmScreen: boolean;
  mergedItems: string[];
  newOrderItems: string[];
  round2Items: string[];
}

export interface KitchenOrderDisplay {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  priority: "normal" | "urgent";
  caseType: "merge" | "separate" | "round2";
  mergedItemsHighlight?: string[];
  createdAt: Date;
  estimatedTime?: number;
}

// Action types for state management
export type FlowAction =
  | { type: "SET_FLOW"; payload: CaseType }
  | { type: "ADD_TO_CART"; payload: CartItem }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "CLEAR_CART" }
  | { type: "UPDATE_CART_TOTAL"; payload: number }
  | { type: "SHOW_CART"; payload: boolean }
  | { type: "SHOW_WARNING"; payload: boolean }
  | { type: "SHOW_CONFIRM"; payload: boolean }
  | { type: "SET_MERGED_ITEMS"; payload: string[] }
  | { type: "SET_NEW_ORDER_ITEMS"; payload: string[] }
  | { type: "SET_ROUND2_ITEMS"; payload: string[] };

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MergeOrderResponse extends ApiResponse<Order> {
  mergedOrderId: string;
  previousOrderId: string;
  newItemsCount: number;
}

export interface CreateNewOrderResponse extends ApiResponse<Order> {
  newOrderId: string;
  parentOrderId: string;
  sessionTotal: number;
}

export interface Round2OrderResponse extends ApiResponse<Order> {
  round2OrderId: string;
  previousOrderId: string;
  sessionTotal: number;
}
