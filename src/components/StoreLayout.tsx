import { Suspense } from 'react';
import { Outlet } from 'react-router';
import styles from './StoreLayout.module.css';

/** Gives the shop, product, cart and checkout pages the dark theme. */
export function StoreLayout() {
  return (
    <div className={styles.store}>
      {/* Here as well as in Layout, so a lazy page loads on the dark background, not a white one. */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  );
}
