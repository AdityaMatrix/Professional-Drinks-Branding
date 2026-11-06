import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { CartContext } from './CartContext';
import { cartReducer, parseStoredCart, STORAGE_KEY } from './cartState';

function loadCart() {
  try {
    return parseStoredCart(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage is blocked or full. The cart still works until the tab closes.
    }
  }, [items]);

  // The storage event only fires in other tabs, so this can't loop with the save above.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        dispatch({ type: 'replace', items: parseStoredCart(event.newValue) });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: Object.values(items).reduce((total, quantity) => total + quantity, 0),
      add: (id: string, max: number) => dispatch({ type: 'add', id, max }),
      setQuantity: (id: string, quantity: number, max: number) =>
        dispatch({ type: 'setQuantity', id, quantity, max }),
      remove: (id: string) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'replace', items: {} }),
    }),
    [items],
  );

  return <CartContext value={value}>{children}</CartContext>;
}
