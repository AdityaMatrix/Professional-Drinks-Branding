import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import logo from '../assets/images/logo.webp';
import styles from './Layout.module.css';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/#about', label: 'About' },
  { to: '/#inspirations', label: 'Inspirations' },
  { to: '/#contact', label: 'Contact' },
];

/** The router doesn't scroll to hash targets itself. Keyed on location.key so repeat clicks work. */
function useScrollToHash() {
  const { hash, key } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash, key]);
}

export function Layout() {
  useScrollToHash();

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
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
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
