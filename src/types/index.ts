export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Perfume {
  id: number;
  name: string;
  slug: string;
  description: string;
  gender: 'unisex' | 'women' | 'men';
  image: string | null;
  is_active: boolean;
  category: number;
  category_detail?: Category;
  created_at: string;
  updated_at: string;
  variants?: PerfumeVariant[];
}

export interface RackingLocation {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface PerfumeVariant {
  id: number;
  perfume: number;
  perfume_detail?: Perfume;
  size_ml: 30 | 50 | 100;
  sku: string;
  barcode: string;
  price_mad: string;
  compare_at_price: string | null;
  stock_qty: number;
  low_stock_threshold: number;
  location: number | null;
  location_detail?: RackingLocation;
  is_active: boolean;
  weight_grams: number;
  created_at: string;
  updated_at: string;
  is_low_stock: boolean;
  is_in_stock: boolean;
}

export interface CartItem {
  variant: PerfumeVariant;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  total_amount: string;
  payment_method: 'cash' | 'card' | 'transfer';
  cashier_name: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale: number;
  variant: number;
  variant_detail?: PerfumeVariant;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Purchase {
  id: number;
  supplier_name: string;
  items: PurchaseItem[];
  total_amount: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  variant: number;
  variant_detail?: PerfumeVariant;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface CreatePurchase {
  supplier_name: string;
  items: {
    variant: number;
    quantity: number;
    unit_price: number;
  }[];
  notes?: string;
}

export interface CreateSale {
  items: {
    variant: number;
    quantity: number;
  }[];
  payment_method: 'cash' | 'card' | 'transfer';
  cashier_name?: string;
}

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'customer_request'
  | 'other';

export interface ReturnItem {
  id?: number;
  sale_item: number;
  sale_item_detail?: SaleItem;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface ExchangeItem {
  variant: number;
  variant_detail?: PerfumeVariant;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Return {
  id: number;
  sale: number;
  sale_detail?: Sale;
  return_items: ReturnItem[];
  exchange_items?: ExchangeItem[];
  return_total: string;
  exchange_total: string;
  difference: string; // positive = remboursement client, negative = client paie
  operation_type: 'refund' | 'exchange';
  reason: ReturnReason;
  payment_method: 'cash' | 'card' | 'transfer';
  cashier_name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReturn {
  sale: number;
  return_items: {
    sale_item: number;
    quantity: number;
  }[];
  exchange_items?: {
    variant: number;
    quantity: number;
  }[];
  operation_type: 'refund' | 'exchange';
  reason: ReturnReason;
  payment_method: 'cash' | 'card' | 'transfer';
  notes?: string;
}
