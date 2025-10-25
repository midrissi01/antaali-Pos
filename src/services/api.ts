import axios from 'axios';
import type {
  Category, PerfumeVariant, Sale, Purchase, Return,
  CreateSale, CreatePurchase, CreateReturn
} from '@/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token (if needed)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
}

// ============================================================================
// CATALOG APIs
// ============================================================================

export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response = await apiClient.get('/categories/');
  return { data: response.data, status: response.status };
};

export const getCategory = async (id: number): Promise<ApiResponse<Category>> => {
  const response = await apiClient.get(`/categories/${id}/`);
  return { data: response.data, status: response.status };
};

export const getPerfumes = async (params?: {
  search?: string;
  category?: number;
}): Promise<ApiResponse<any[]>> => {
  const response = await apiClient.get('/perfumes/', { params });
  return { data: response.data, status: response.status };
};

export const getPerfume = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.get(`/perfumes/${id}/`);
  return { data: response.data, status: response.status };
};

export const getVariants = async (params?: {
  search?: string;
  perfume?: number;
  category?: number;
  barcode?: string;
}): Promise<ApiResponse<PerfumeVariant[]>> => {
  // Map 'perfume' param to 'perfume__category' if it looks like a category
  // This handles the frontend bug where category ID is sent as 'perfume' param
  const apiParams: any = { ...params };

  if (params?.category) {
    apiParams['perfume__category'] = params.category;
    delete apiParams.category;
  }

  const response = await apiClient.get('/variants/', { params: apiParams });
  return { data: response.data, status: response.status };
};

export const getVariant = async (id: number): Promise<ApiResponse<PerfumeVariant>> => {
  const response = await apiClient.get(`/variants/${id}/`);
  return { data: response.data, status: response.status };
};

export const updateVariantStock = async (id: number, stockQty: number): Promise<ApiResponse<PerfumeVariant>> => {
  const response = await apiClient.patch(`/variants/${id}/`, { stock_qty: stockQty });
  return { data: response.data, status: response.status };
};

// ============================================================================
// SALES APIs
// ============================================================================

export const getSales = async (params?: {
  start_date?: string;
  end_date?: string;
  payment_method?: string;
}): Promise<ApiResponse<Sale[]>> => {
  const response = await apiClient.get('/stores/sales/', { params });
  // Handle paginated response from Django REST framework
  const data = response.data.results || response.data;
  return { data, status: response.status };
};

export const getSale = async (id: number): Promise<ApiResponse<Sale>> => {
  const response = await apiClient.get(`/stores/sales/${id}/`);
  return { data: response.data, status: response.status };
};

export const createSale = async (data: CreateSale): Promise<ApiResponse<Sale>> => {
  const response = await apiClient.post('/stores/sales/create/', data);
  return { data: response.data, status: response.status };
};

export const getRecentSales = async (limit = 10): Promise<ApiResponse<{ count: number; sales: Sale[] }>> => {
  const response = await apiClient.get('/stores/sales/recent/', { params: { limit } });
  return { data: response.data, status: response.status };
};

export const getDailySalesSummary = async (): Promise<ApiResponse<{
  date: string;
  total_sales: number;
  total_revenue: number;
  total_items_sold: number;
  average_sale: number;
  sales_by_payment: Record<string, { count: number; revenue: number }>;
}>> => {
  const response = await apiClient.get('/stores/sales/daily-summary/');
  return { data: response.data, status: response.status };
};

// ============================================================================
// PURCHASES APIs
// ============================================================================

export const getPurchases = async (params?: {
  start_date?: string;
  end_date?: string;
  supplier_name?: string;
}): Promise<ApiResponse<Purchase[]>> => {
  const response = await apiClient.get('/stores/purchases/', { params });
  // Handle paginated response from Django REST framework
  const data = response.data.results || response.data;
  return { data, status: response.status };
};

export const getPurchase = async (id: number): Promise<ApiResponse<Purchase>> => {
  const response = await apiClient.get(`/stores/purchases/${id}/`);
  return { data: response.data, status: response.status };
};

export const createPurchase = async (data: CreatePurchase): Promise<ApiResponse<Purchase>> => {
  const response = await apiClient.post('/stores/purchases/create/', data);
  return { data: response.data, status: response.status };
};

// ============================================================================
// RETURNS APIs
// ============================================================================

export const getReturns = async (params?: {
  start_date?: string;
  end_date?: string;
  operation_type?: 'refund' | 'exchange';
}): Promise<ApiResponse<Return[]>> => {
  const response = await apiClient.get('/stores/returns/', { params });
  // Handle paginated response from Django REST framework
  const data = response.data.results || response.data;
  return { data, status: response.status };
};

export const getReturn = async (id: number): Promise<ApiResponse<Return>> => {
  const response = await apiClient.get(`/stores/returns/${id}/`);
  return { data: response.data, status: response.status };
};

export const createReturn = async (data: CreateReturn): Promise<ApiResponse<Return>> => {
  const response = await apiClient.post('/stores/returns/create/', data);
  return { data: response.data, status: response.status };
};

// ============================================================================
// UTILITY APIs
// ============================================================================

export const quickBarcodeLookup = async (barcode: string): Promise<ApiResponse<{
  found: boolean;
  variant?: PerfumeVariant;
  message?: string;
}>> => {
  const response = await apiClient.get('/stores/barcode-lookup/', { params: { barcode } });
  return { data: response.data, status: response.status };
};

export const getLowStockAlerts = async (): Promise<ApiResponse<{
  low_stock_count: number;
  out_of_stock_count: number;
  low_stock_items: PerfumeVariant[];
}>> => {
  const response = await apiClient.get('/stores/low-stock/');
  return { data: response.data, status: response.status };
};

// ============================================================================
// AUTH APIs (if needed)
// ============================================================================

export const login = async (username: string, password: string): Promise<ApiResponse<{
  token: string;
  user: any;
}>> => {
  const response = await apiClient.post('/auth/login/', { username, password });
  // Store token
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return { data: response.data, status: response.status };
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('authToken');
  // Optionally call backend logout endpoint
  try {
    await apiClient.post('/auth/logout/');
  } catch (error) {
    // Ignore errors on logout
  }
};

// Export axios instance for custom requests
export { apiClient };
