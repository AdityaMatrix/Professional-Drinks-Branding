import { createContext, useContext } from 'react';
import type { CartItems } from './cartState';

type CartContextValue = {
  items: CartItems;
  count: number;
  add: (id: string, max: number) => void;
  setQuantity: (id: string, quantity: number, max: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('useCart must be used inside CartProvider');
  return cart;
}
