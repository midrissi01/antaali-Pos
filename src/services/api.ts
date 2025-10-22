// Mock API (using local data instead of backend)
import {
  mockGetCategories,
  mockGetCategory,
  mockGetPerfumes,
  mockGetPerfume,
  mockGetVariants,
  mockGetVariant,
  mockUpdateVariantStock,
  mockGetSales,
  mockGetSale,
  mockCreateSale,
  mockGetPurchases,
  mockGetPurchase,
  mockCreatePurchase,
  mockGetReturns,
  mockGetReturn,
  mockCreateReturn,
} from './mockApi';

// Categories
export const getCategories = mockGetCategories;
export const getCategory = mockGetCategory;

// Perfumes
export const getPerfumes = mockGetPerfumes;
export const getPerfume = mockGetPerfume;

// Variants
export const getVariants = mockGetVariants;
export const getVariant = mockGetVariant;
export const updateVariantStock = mockUpdateVariantStock;

// Sales
export const getSales = mockGetSales;
export const getSale = mockGetSale;
export const createSale = mockCreateSale;

// Purchases
export const getPurchases = mockGetPurchases;
export const getPurchase = mockGetPurchase;
export const createPurchase = mockCreatePurchase;

// Returns
export const getReturns = mockGetReturns;
export const getReturn = mockGetReturn;
export const createReturn = mockCreateReturn;
