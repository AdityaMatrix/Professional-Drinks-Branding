import { screen } from '@testing-library/react';
import { Route } from 'react-router';
import { renderApp, signedInStaff, signedOut } from '../test/render';
import { RequireStaff } from './RequireStaff';

const renderProtected = (auth: typeof signedOut, route = '/admin/suppliers?status=approved') =>
  renderApp(<div>Login page</div>, {
    route,
    path: '/login',
    auth,
    extraRoutes: (
      <Route path="/admin" element={<RequireStaff />}>
        <Route path="*" element={<div>Secret page</div>} />
      </Route>
    ),
  });

describe('RequireStaff', () => {
  it('sends signed-out visitors to login and remembers where they were going', () => {
    renderProtected(signedOut);

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/login?next=%2Fadmin%2Fsuppliers%3Fstatus%3Dapproved',
    );
  });

  it('waits instead of redirecting while the session is being restored', () => {
    renderProtected({ ...signedOut, status: 'loading' });

    expect(screen.getByText('Checking your access…')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('does not show the page until the staff check finishes', () => {
    renderProtected({ ...signedInStaff, isStaff: null });
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('blocks signed-in users who are not staff', () => {
    renderProtected({ ...signedInStaff, isStaff: false });

    expect(screen.getByRole('heading', { name: 'No access' })).toBeInTheDocument();
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('offers a retry when the staff check fails', () => {
    renderProtected({ ...signedInStaff, isStaff: null, staffCheckFailed: true });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows the page to staff', () => {
    renderProtected(signedInStaff);
    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });
});
