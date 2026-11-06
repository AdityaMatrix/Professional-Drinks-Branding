import { Outlet } from 'react-router';
import styles from './StoreLayout.module.css';

/** Gives the shop, product and cart pages the dark theme. */
export function StoreLayout() {
  return (
    <div className={styles.store}>
      <Outlet />
    </div>
  );
}
