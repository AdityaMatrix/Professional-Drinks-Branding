import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useCart } from '../../cart/CartContext';
import { loadOrder, takeCartClearance } from '../../checkout/checkoutState';
import { buttonClass } from '../../components/Button';
import { OrderTotals } from './OrderSummary';
import styles from './checkout.module.css';

export function ConfirmationPage() {
  const { clear } = useCart();
  const [order] = useState(loadOrder);

  // Done here, not on the payment page: an empty cart there would redirect away from this page.
  useEffect(() => {
    if (takeCartClearance()) clear();
  }, [clear]);

  if (!order) return <Navigate to="/products" replace />;

  return (
    <div className={styles.confirmation}>
      <title>Order confirmed | Valo Drinks</title>
      <h2 className={styles.confirmationHeading}>Thanks, {order.shipping.fullName}!</h2>
      <p>
        Your demo order reference is <strong>{order.reference}</strong>.
      </p>
      <p>
        If this were a real shop, it would be delivered to {order.shipping.address},{' '}
        {order.shipping.city}. No payment was taken, and your details weren&apos;t saved anywhere
        except this browser tab.
      </p>
      <section className={styles.summary} aria-label="Your order">
        <OrderTotals quote={order.quote} />
      </section>
      <Link className={buttonClass} to="/products">
        Back to the shop
      </Link>
    </div>
  );
}
