import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchSupplier,
  fetchSupplierEvents,
  fetchSuppliers,
  fetchSupplierSummary,
} from '../api/suppliers';
import type { SupplierFilters } from '../data/suppliers';

// Everything staff-only sits under 'admin', so one call clears it on sign out.
export const adminKey = ['admin'] as const;

export function useSuppliers(filters: SupplierFilters) {
  return useQuery({
    queryKey: [...adminKey, 'suppliers', filters],
    queryFn: ({ signal }) => fetchSuppliers(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: [...adminKey, 'supplier', id],
    queryFn: ({ signal }) => fetchSupplier(id ?? '', signal),
    enabled: Boolean(id),
  });
}

export function useSupplierEvents(id: string) {
  return useQuery({
    queryKey: [...adminKey, 'supplier', id, 'events'],
    queryFn: ({ signal }) => fetchSupplierEvents(id, signal),
  });
}

export function useSupplierSummary() {
  return useQuery({
    queryKey: [...adminKey, 'summary'],
    queryFn: ({ signal }) => fetchSupplierSummary(signal),
  });
}
