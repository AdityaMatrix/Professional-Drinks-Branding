import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { useToast } from '../../components/ToastContext';
import styles from './admin.module.css';

export function AdminLayout() {
  const { email, signOut } = useAuth();
  const { showToast } = useToast();

  const handleSignOut = () => {
    signOut().catch(() => showToast("We couldn't sign you out. Please try again.", 'error'));
  };

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar} aria-label="Supplier portal">
        <NavLink end to="/admin">
          Dashboard
        </NavLink>
        <NavLink to="/admin/suppliers">Suppliers</NavLink>
        <div className={styles.account}>
          <p>{email}</p>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
