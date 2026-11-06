import { z } from 'zod';
import { roles, type Product, type ProductFilters, type SortKey } from '../data/products';
import { supabase } from '../lib/supabase';

const COLUMNS = 'id, name, agent, role, price_cents, description, color, image_key, stock';

// The contract with the database: a renamed column fails here, not as undefined deep in the UI.
const productRow = z
  .object({
    id: z.string(),
    name: z.string(),
    agent: z.string(),
    role: z.enum(roles),
    price_cents: z.number().int().positive(),
    description: z.string(),
    color: z.string(),
    image_key: z.string(),
    stock: z.number().int().nonnegative(),
  })
  .transform(
    (row): Product => ({
      id: row.id,
      name: row.name,
      agent: row.agent,
      role: row.role,
      priceCents: row.price_cents,
      description: row.description,
      color: row.color,
      imageKey: row.image_key,
      stock: row.stock,
    }),
  );

const ordering: Record<SortKey, { column: string; ascending: boolean }> = {
  featured: { column: 'sort_order', ascending: true },
  name: { column: 'name', ascending: true },
  'price-asc': { column: 'price_cents', ascending: true },
  'price-desc': { column: 'price_cents', ascending: false },
};

/**
 * Builds the ilike pattern, or null if there's nothing to search for. Wildcards are removed, not
 * escaped: a backslash escape didn't survive the API, so a search for "%" matched every drink.
 */
export function toSearchPattern(text: string): string | null {
  const search = text
    .replace(/[%_*\\]/g, ' ')
    .trim()
    .toLowerCase();
  return search ? `%${search}%` : null;
}

export async function fetchProducts(
  filters: ProductFilters,
  signal?: AbortSignal,
): Promise<Product[]> {
  const { column, ascending } = ordering[filters.sort];
  let query = supabase.from('products').select(COLUMNS);

  if (filters.role) query = query.eq('role', filters.role);
  const pattern = toSearchPattern(filters.q);
  if (pattern) query = query.ilike('search_text', pattern);

  query = query.order(column, { ascending }).order('id');
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return z.array(productRow).parse(data);
}

export async function fetchProduct(id: string, signal?: AbortSignal): Promise<Product | null> {
  let query = supabase.from('products').select(COLUMNS).eq('id', id);
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? productRow.parse(data) : null;
}
