import { Suspense, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import logo from '../assets/images/logo.webp';
import { useCart } from '../cart/CartContext';
import styles from './Layout.module.css';

const navLinks = [
  { to: '/products', label: 'Shop' },
  { to: '/#about', label: 'About' },
  { to: '/#inspirations', label: 'Inspirations' },
  { to: '/#contact', label: 'Contact' },
];

/** The router doesn't scroll to hash targets itself. Keyed on location.key so repeat clicks work. */
function useScrollOnNavigate() {
  const { pathname, search, hash, key } = useLocation();
  const previous = useRef({ pathname, search });

  useEffect(() => {
    // Changing a filter only edits the query string, and must not jump the page to the top.
    const onlyFiltersChanged =
      previous.current.pathname === pathname && previous.current.search !== search;
    previous.current = { pathname, search };

    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else if (!onlyFiltersChanged) window.scrollTo(0, 0);
  }, [pathname, search, hash, key]);
}

export function Layout() {
  useScrollOnNavigate();
  const { count } = useCart();

  return (
    <>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" aria-label="Valo Drinks home">
          <img className={styles.logo} src={logo} alt="" width={72} height={40} />
        </Link>
        <nav aria-label="Main">
          <ul className={styles.nav}>
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
                Cart{count > 0 && <span className={styles.badge}>{count}</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className={styles.main}>
        <Suspense fallback={<div className={styles.routeFallback} />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className={styles.footer}>
        <p>
          Valo Drinks is an unofficial fan concept built as a portfolio project. It is not
          affiliated with or endorsed by Riot Games, and nothing here is for sale. VALORANT and its
          characters are trademarks of Riot Games, Inc.
        </p>
      </footer>
    </>
  );
}
