import { Navigate, Outlet, useLocation } from 'react-router';
import { QueryError } from '../components/QueryError';
import stateStyles from '../components/StoreStates.module.css';
import { useAuth } from './AuthContext';

/**
 * This only decides what to show. The real protection is on the server: without staff access,
 * row level security returns no suppliers even if someone edits this check out of the browser.
 */
export function RequireStaff() {
  const auth = useAuth();
  const { pathname, search } = useLocation();

  if (auth.status === 'signedOut') {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
  }

  if (auth.staffCheckFailed) {
    return (
      <QueryError
        message="We couldn't check your access."
        onRetry={auth.retryStaffCheck}
        retrying={false}
      />
    );
  }

  if (auth.status === 'loading' || auth.isStaff === null) {
    return (
      <div className={stateStyles.state} role="status">
        Checking your access…
      </div>
    );
  }

  if (!auth.isStaff) {
    return (
      <div className={stateStyles.state}>
        <h1>No access</h1>
        <p>This account isn&apos;t set up for the supplier portal.</p>
      </div>
    );
  }

  return <Outlet />;
}
