import type {
  Category,
  Perfume,
  PerfumeVariant,
  Sale,
  Purchase,
  CreateSale,
  CreatePurchase,
  SaleItem,
  PurchaseItem,
  Return,
  CreateReturn,
  ReturnItem,
  ExchangeItem,
} from '@/types';
import {
  mockCategories,
  mockPerfumes,
  mockVariants,
  mockSales,
  mockPurchases,
  mockReturns,
  getNextId,
} from './mockData';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API implementation
export const mockGetCategories = async (): Promise<{ data: Category[] }> => {
  await delay(300);
  return { data: mockCategories };
};

export const mockGetCategory = async (id: number): Promise<{ data: Category }> => {
  await delay(300);
  const category = mockCategories.find(c => c.id === id);
  if (!category) throw new Error('Category not found');
  return { data: category };
};

export const mockGetPerfumes = async (params?: {
  category?: number;
  search?: string;
}): Promise<{ data: Perfume[] }> => {
  await delay(300);
  let filtered = [...mockPerfumes];

  if (params?.category) {
    filtered = filtered.filter(p => p.category === params.category);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
  }

  return { data: filtered };
};

export const mockGetPerfume = async (id: number): Promise<{ data: Perfume }> => {
  await delay(300);
  const perfume = mockPerfumes.find(p => p.id === id);
  if (!perfume) throw new Error('Perfume not found');
  return { data: perfume };
};

export const mockGetVariants = async (params?: {
  perfume?: number;
  search?: string;
  barcode?: string;
}): Promise<{ data: PerfumeVariant[] }> => {
  await delay(300);
  let filtered = [...mockVariants];

  if (params?.perfume) {
    filtered = filtered.filter(v => v.perfume === params.perfume);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      v =>
        v.perfume_detail?.name.toLowerCase().includes(search) ||
        v.sku.toLowerCase().includes(search) ||
        v.barcode.toLowerCase().includes(search)
    );
  }

  if (params?.barcode) {
    filtered = filtered.filter(v => v.barcode === params.barcode);
  }

  return { data: filtered };
};

export const mockGetVariant = async (id: number): Promise<{ data: PerfumeVariant }> => {
  await delay(300);
  const variant = mockVariants.find(v => v.id === id);
  if (!variant) throw new Error('Variant not found');
  return { data: variant };
};

export const mockUpdateVariantStock = async (
  id: number,
  stock_qty: number
): Promise<{ data: PerfumeVariant }> => {
  await delay(300);
  const variant = mockVariants.find(v => v.id === id);
  if (!variant) throw new Error('Variant not found');

  variant.stock_qty = stock_qty;
  variant.is_in_stock = stock_qty > 0;
  variant.is_low_stock = stock_qty <= variant.low_stock_threshold && stock_qty > 0;
  variant.updated_at = new Date().toISOString();

  return { data: variant };
};

export const mockGetSales = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ data: Sale[] }> => {
  await delay(300);
  let filtered = [...mockSales];

  if (params?.start_date) {
    filtered = filtered.filter(s => new Date(s.created_at) >= new Date(params.start_date!));
  }

  if (params?.end_date) {
    filtered = filtered.filter(s => new Date(s.created_at) <= new Date(params.end_date!));
  }

  return { data: filtered };
};

export const mockGetSale = async (id: number): Promise<{ data: Sale }> => {
  await delay(300);
  const sale = mockSales.find(s => s.id === id);
  if (!sale) throw new Error('Sale not found');
  return { data: sale };
};

export const mockCreateSale = async (data: CreateSale): Promise<{ data: Sale }> => {
  await delay(500);

  // Validate and update stock
  for (const item of data.items) {
    const variant = mockVariants.find(v => v.id === item.variant);
    if (!variant) throw new Error(`Variant ${item.variant} not found`);
    if (variant.stock_qty < item.quantity) {
      throw new Error(`Insufficient stock for ${variant.perfume_detail?.name}`);
    }
  }

  // Create sale items
  const saleItems: SaleItem[] = data.items.map((item, index) => {
    const variant = mockVariants.find(v => v.id === item.variant)!;
    const unit_price = parseFloat(variant.price_mad);
    const subtotal = unit_price * item.quantity;

    return {
      id: index + 1,
      sale: getNextId(mockSales),
      variant: item.variant,
      variant_detail: variant,
      quantity: item.quantity,
      unit_price: unit_price.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };
  });

  // Calculate total
  const total_amount = saleItems
    .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
    .toFixed(2);

  // Create sale
  const newSale: Sale = {
    id: getNextId(mockSales),
    items: saleItems,
    total_amount,
    payment_method: data.payment_method,
    cashier_name: data.cashier_name || 'Caissier Principal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Update stock
  data.items.forEach(item => {
    const variant = mockVariants.find(v => v.id === item.variant)!;
    variant.stock_qty -= item.quantity;
    variant.is_in_stock = variant.stock_qty > 0;
    variant.is_low_stock = variant.stock_qty <= variant.low_stock_threshold && variant.stock_qty > 0;
    variant.updated_at = new Date().toISOString();
  });

  mockSales.push(newSale);
  return { data: newSale };
};

export const mockGetPurchases = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ data: Purchase[] }> => {
  await delay(300);
  let filtered = [...mockPurchases];

  if (params?.start_date) {
    filtered = filtered.filter(p => new Date(p.created_at) >= new Date(params.start_date!));
  }

  if (params?.end_date) {
    filtered = filtered.filter(p => new Date(p.created_at) <= new Date(params.end_date!));
  }

  return { data: filtered };
};

export const mockGetPurchase = async (id: number): Promise<{ data: Purchase }> => {
  await delay(300);
  const purchase = mockPurchases.find(p => p.id === id);
  if (!purchase) throw new Error('Purchase not found');
  return { data: purchase };
};

export const mockCreatePurchase = async (data: CreatePurchase): Promise<{ data: Purchase }> => {
  await delay(500);

  // Create purchase items
  const purchaseItems: PurchaseItem[] = data.items.map(item => {
    const variant = mockVariants.find(v => v.id === item.variant);
    if (!variant) throw new Error(`Variant ${item.variant} not found`);

    const subtotal = item.unit_price * item.quantity;

    return {
      variant: item.variant,
      variant_detail: variant,
      quantity: item.quantity,
      unit_price: item.unit_price.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };
  });

  // Calculate total
  const total_amount = purchaseItems
    .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
    .toFixed(2);

  // Create purchase
  const newPurchase: Purchase = {
    id: getNextId(mockPurchases),
    supplier_name: data.supplier_name,
    items: purchaseItems,
    total_amount,
    notes: data.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Update stock
  data.items.forEach(item => {
    const variant = mockVariants.find(v => v.id === item.variant)!;
    variant.stock_qty += item.quantity;
    variant.is_in_stock = variant.stock_qty > 0;
    variant.is_low_stock = variant.stock_qty <= variant.low_stock_threshold && variant.stock_qty > 0;
    variant.updated_at = new Date().toISOString();
  });

  mockPurchases.push(newPurchase);
  return { data: newPurchase };
};

// Returns
export const mockGetReturns = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ data: Return[] }> => {
  await delay(300);
  let filtered = [...mockReturns];

  if (params?.start_date) {
    filtered = filtered.filter(r => new Date(r.created_at) >= new Date(params.start_date!));
  }

  if (params?.end_date) {
    filtered = filtered.filter(r => new Date(r.created_at) <= new Date(params.end_date!));
  }

  return { data: filtered };
};

export const mockGetReturn = async (id: number): Promise<{ data: Return }> => {
  await delay(300);
  const returnItem = mockReturns.find(r => r.id === id);
  if (!returnItem) throw new Error('Return not found');
  return { data: returnItem };
};

export const mockCreateReturn = async (data: CreateReturn): Promise<{ data: Return }> => {
  await delay(500);

  // Find the original sale
  const sale = mockSales.find(s => s.id === data.sale);
  if (!sale) throw new Error('Sale not found');

  // Create return items
  const returnItems: ReturnItem[] = data.return_items.map((item, index) => {
    const saleItem = sale.items.find(si => si.id === item.sale_item);
    if (!saleItem) throw new Error(`Sale item ${item.sale_item} not found`);

    // Validate quantity
    if (item.quantity > saleItem.quantity) {
      throw new Error(`Cannot return more than sold quantity for item ${item.sale_item}`);
    }

    const unit_price = parseFloat(saleItem.unit_price);
    const subtotal = unit_price * item.quantity;

    return {
      id: index + 1,
      sale_item: item.sale_item,
      sale_item_detail: saleItem,
      quantity: item.quantity,
      unit_price: unit_price.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };
  });

  // Calculate return total
  const return_total = returnItems
    .reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  // Create exchange items if present
  let exchangeItems: ExchangeItem[] = [];
  let exchange_total = 0;

  if (data.operation_type === 'exchange' && data.exchange_items && data.exchange_items.length > 0) {
    exchangeItems = data.exchange_items.map(item => {
      const variant = mockVariants.find(v => v.id === item.variant);
      if (!variant) throw new Error(`Variant ${item.variant} not found`);
      if (variant.stock_qty < item.quantity) {
        throw new Error(`Insufficient stock for ${variant.perfume_detail?.name}`);
      }

      const unit_price = parseFloat(variant.price_mad);
      const subtotal = unit_price * item.quantity;

      return {
        variant: item.variant,
        variant_detail: variant,
        quantity: item.quantity,
        unit_price: unit_price.toFixed(2),
        subtotal: subtotal.toFixed(2),
      };
    });

    exchange_total = exchangeItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  }

  // Calculate difference (positive = refund to customer, negative = customer pays)
  const difference = return_total - exchange_total;

  // Create the return
  const newReturn: Return = {
    id: getNextId(mockReturns),
    sale: data.sale,
    sale_detail: sale,
    return_items: returnItems,
    exchange_items: exchangeItems,
    return_total: return_total.toFixed(2),
    exchange_total: exchange_total.toFixed(2),
    difference: difference.toFixed(2),
    operation_type: data.operation_type,
    reason: data.reason,
    payment_method: data.payment_method,
    cashier_name: 'Caissier Principal',
    notes: data.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Update stock for returned items (add back to stock)
  returnItems.forEach(item => {
    const saleItem = item.sale_item_detail;
    if (saleItem && saleItem.variant_detail) {
      const variant = mockVariants.find(v => v.id === saleItem.variant);
      if (variant) {
        variant.stock_qty += item.quantity;
        variant.is_in_stock = variant.stock_qty > 0;
        variant.is_low_stock = variant.stock_qty <= variant.low_stock_threshold && variant.stock_qty > 0;
        variant.updated_at = new Date().toISOString();
      }
    }
  });

  // Update stock for exchange items (subtract from stock)
  if (data.operation_type === 'exchange' && data.exchange_items) {
    data.exchange_items.forEach(item => {
      const variant = mockVariants.find(v => v.id === item.variant);
      if (variant) {
        variant.stock_qty -= item.quantity;
        variant.is_in_stock = variant.stock_qty > 0;
        variant.is_low_stock = variant.stock_qty <= variant.low_stock_threshold && variant.stock_qty > 0;
        variant.updated_at = new Date().toISOString();
      }
    });
  }

  mockReturns.push(newReturn);
  return { data: newReturn };
};
