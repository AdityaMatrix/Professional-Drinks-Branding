import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, signedInStaff, signedOut } from '../test/render';
import { LoginPage, safeNextPath } from './LoginPage';

describe('safeNextPath', () => {
  it('keeps a path on this site', () => {
    expect(safeNextPath('/admin/suppliers?status=draft')).toBe('/admin/suppliers?status=draft');
  });

  it.each([null, 'https://evil.example', '//evil.example', '/\\evil.example', 'admin'])(
    'falls back to the portal for %s',
    (next) => {
      expect(safeNextPath(next)).toBe('/admin');
    },
  );
});

describe('LoginPage', () => {
  it('validates before calling the server', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn();
    renderApp(<LoginPage />, { auth: { ...signedOut, signIn } });

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('explains wrong credentials and keeps the email', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockRejectedValue({ code: 'invalid_credentials' });
    renderApp(<LoginPage />, { auth: { ...signedOut, signIn } });

    await user.type(screen.getByLabelText('Email'), 'a@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('That email or password is wrong.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('a@example.com');
  });

  it('gives a general message for other failures', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockRejectedValue(new Error('Network down'));
    renderApp(<LoginPage />, { auth: { ...signedOut, signIn } });

    await user.type(screen.getByLabelText('Email'), 'a@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText(/couldn't sign you in/)).toBeInTheDocument();
  });

  it('sends a signed-in user to where they were going', () => {
    renderApp(<LoginPage />, {
      route: '/login?next=%2Fadmin%2Fsuppliers',
      path: '/login',
      auth: signedInStaff,
      extraRoutes: <></>,
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/suppliers');
  });
});
