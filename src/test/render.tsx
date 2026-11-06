import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { AuthContext, type AuthValue } from '../auth/AuthContext';
import { CartProvider } from '../cart/CartProvider';
import { ToastProvider } from '../components/Toast';

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

export const signedOut: AuthValue = {
  status: 'signedOut',
  email: null,
  isStaff: null,
  staffCheckFailed: false,
  retryStaffCheck: () => {},
  signIn: async () => {},
  signOut: async () => {},
};

export const signedInStaff: AuthValue = {
  ...signedOut,
  status: 'signedIn',
  email: 'demo@example.com',
  isStaff: true,
};

type Options = { route?: string; path?: string; auth?: AuthValue; extraRoutes?: ReactElement };

export function renderApp(
  ui: ReactElement,
  { route = '/', path = '*', auth = signedOut, extraRoutes }: Options = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext value={auth}>
        <CartProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path={path} element={ui} />
                {extraRoutes}
              </Routes>
              <LocationProbe />
            </MemoryRouter>
          </ToastProvider>
        </CartProvider>
      </AuthContext>
    </QueryClientProvider>,
  );
}
