import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
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

/**
 * Shows what the shop already fetched while the fresh copy loads. The can transition depends on
 * this: the browser can only morph into a can that's on screen as soon as the page changes.
 */
export function useProduct(id: string) {
  const queryClient = useQueryClient();

  return useQuery<Product | null>({
    queryKey: ['product', id],
    queryFn: ({ signal }) => fetchProduct(id, signal),
    placeholderData: () =>
      queryClient
        .getQueriesData<Product[]>({ queryKey: ['products'] })
        .flatMap(([, products]) => products ?? [])
        .find((product) => product.id === id),
  });
}
