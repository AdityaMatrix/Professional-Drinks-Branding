import { z } from 'zod';
import { getSupabase } from '../lib/supabase';

const quoteRow = z
  .object({
    lines: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        unit_cents: z.number().int().positive(),
        line_cents: z.number().int().positive(),
      }),
    ),
    subtotal_cents: z.number().int(),
    shipping_cents: z.number().int(),
    total_cents: z.number().int(),
  })
  .transform((row) => ({
    lines: row.lines.map((line) => ({
      id: line.id,
      name: line.name,
      quantity: line.quantity,
      unitCents: line.unit_cents,
      lineCents: line.line_cents,
    })),
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
  }));

export type Quote = z.infer<typeof quoteRow>;

/** The cart no longer matches what's available, so the customer needs to go back and change it. */
export class QuoteRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuoteRejectedError';
  }
}

export async function quoteOrder(items: { id: string; quantity: number }[]) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('quote_order', { p_items: items });
  if (!error) return quoteRow.parse(data);

  if (error.hint === 'out_of_stock') {
    throw new QuoteRejectedError(`There isn't enough ${error.details ?? 'stock'} left for your order.`);
  }
  if (error.hint === 'item_unavailable') {
    throw new QuoteRejectedError('An item in your cart is no longer available.');
  }
  if (error.hint === 'invalid_order') {
    throw new QuoteRejectedError('Your cart has a problem. Please check it and try again.');
  }
  throw new Error(error.message);
}
