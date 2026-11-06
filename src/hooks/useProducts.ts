import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchProducts } from '../api/products';
import type { Product, ProductFilters } from '../data/products';

/** Keeps the previous results on screen while a new filter loads, so the grid doesn't flash. */
export function useProducts(filters: ProductFilters, placeholder?: Product[]) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: ({ signal }) => fetchProducts(filters, signal),
    placeholderData: placeholder ?? keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => fetchProduct(id, signal),
  });
}
