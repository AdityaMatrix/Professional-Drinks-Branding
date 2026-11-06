import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { CartProvider } from '../cart/CartProvider';

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

type Options = { route?: string; path?: string };

export function renderApp(ui: ReactElement, { route = '/', path = '*' }: Options = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CartProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </CartProvider>
    </QueryClientProvider>,
  );
}
