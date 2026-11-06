import { useQuery } from '@tanstack/react-query';
import { QuoteRejectedError, quoteOrder } from '../api/orders';
import { useCart } from '../cart/CartContext';
import { toOrderItems } from '../cart/cartState';

/** Always asks the server, because prices and stock may have changed since the cart was filled. */
export function useQuote() {
  const { items } = useCart();
  const orderItems = toOrderItems(items);

  return useQuery({
    queryKey: ['quote', orderItems],
    queryFn: () => quoteOrder(orderItems),
    enabled: orderItems.length > 0,
    staleTime: 0,
    retry: (failures, error) => !(error instanceof QuoteRejectedError) && failures < 1,
  });
}
