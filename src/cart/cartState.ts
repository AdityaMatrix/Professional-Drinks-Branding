import { z } from 'zod';

/** Only ids and quantities. Prices and stock always come fresh from the API, so they can't go stale. */
export type CartItems = Record<string, number>;

export type CartAction =
  | { type: 'add'; id: string; max: number }
  | { type: 'setQuantity'; id: string; quantity: number; max: number }
  | { type: 'remove'; id: string }
  | { type: 'replace'; items: CartItems };

export const toOrderItems = (items: CartItems) =>
  Object.entries(items).map(([id, quantity]) => ({ id, quantity }));

const without = (items: CartItems, id: string) =>
  Object.fromEntries(Object.entries(items).filter(([key]) => key !== id));

export function cartReducer(items: CartItems, action: CartAction): CartItems {
  switch (action.type) {
    case 'add': {
      const quantity = Math.min((items[action.id] ?? 0) + 1, action.max);
      return quantity > 0 ? { ...items, [action.id]: quantity } : items;
    }
    case 'setQuantity': {
      const quantity = Math.min(action.quantity, action.max);
      return quantity > 0 ? { ...items, [action.id]: quantity } : without(items, action.id);
    }
    case 'remove':
      return without(items, action.id);
    case 'replace':
      return action.items;
  }
}

export const STORAGE_KEY = 'valo-drinks-cart';

const storedCart = z.record(z.string(), z.number().int().positive());

/** localStorage can be edited, stale or blocked, so a bad value means an empty cart, not a crash. */
export function parseStoredCart(raw: string | null): CartItems {
  if (!raw) return {};
  try {
    return storedCart.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}
