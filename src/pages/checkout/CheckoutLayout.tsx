import { Navigate, Outlet, useLocation } from 'react-router';
import { useCart } from '../../cart/CartContext';
import styles from './checkout.module.css';

const steps = [
  { path: '/checkout', label: 'Details' },
  { path: '/checkout/payment', label: 'Payment' },
  { path: '/checkout/confirmation', label: 'Done' },
];

export function CheckoutLayout() {
  const { count } = useCart();
  const { pathname } = useLocation();
  const current = steps.findIndex((step) => step.path === pathname);

  // The confirmation page outlives the cart, which is emptied once the order is placed.
  if (count === 0 && pathname !== '/checkout/confirmation') return <Navigate to="/cart" replace />;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Checkout</h1>
      <p className={styles.demoNotice}>
        This is a demo. No payment is taken and nothing will be shipped.
      </p>
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const state = index === current ? 'current' : index < current ? 'done' : 'todo';
          return (
            <li
              key={step.path}
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {index + 1}. {step.label}
            </li>
          );
        })}
      </ol>
      <Outlet />
    </div>
  );
}
