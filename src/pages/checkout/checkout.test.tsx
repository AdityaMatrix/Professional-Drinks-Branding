import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router';
import { quoteOrder, QuoteRejectedError, type Quote } from '../../api/orders';
import { STORAGE_KEY } from '../../cart/cartState';
import { saveShipping, type ShippingValues } from '../../checkout/checkoutState';
import { renderApp } from '../../test/render';
import { CheckoutDetailsPage } from './CheckoutDetailsPage';
import { CheckoutLayout } from './CheckoutLayout';
import { ConfirmationPage } from './ConfirmationPage';
import { PaymentPage } from './PaymentPage';

vi.mock('../../lib/supabase', () => ({ getSupabase: vi.fn() }));
vi.mock('../../api/orders', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/orders')>()),
  quoteOrder: vi.fn(),
}));
const quoteMock = vi.mocked(quoteOrder);

const quote: Quote = {
  lines: [{ id: 'pink-blaze', name: 'Pink Blaze', quantity: 2, unitCents: 2000, lineCents: 4000 }],
  subtotalCents: 4000,
  shippingCents: 500,
  totalCents: 4500,
};

const shipping: ShippingValues = {
  fullName: 'Sova',
  email: 'sova@example.com',
  address: '1 Frost Lane',
  city: 'Moscow',
  postcode: '101000',
  country: 'Russia',
};

const location = () => screen.getByTestId('location').textContent;

const renderCheckout = (route: string) =>
  renderApp(<div>Cart page</div>, {
    route,
    path: '/cart',
    extraRoutes: (
      <>
        <Route path="/products" element={<div>Shop page</div>} />
        <Route path="/checkout" element={<CheckoutLayout />}>
          <Route index element={<CheckoutDetailsPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
        </Route>
      </>
    ),
  });

const fillCard = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(await screen.findByRole('button', { name: label }));
};

describe('checkout', () => {
  beforeEach(() => {
    quoteMock.mockReset();
    quoteMock.mockResolvedValue(quote);
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'pink-blaze': 2 }));
  });

  it('sends an empty cart back to the cart page', () => {
    localStorage.clear();
    renderCheckout('/checkout');
    expect(screen.getByText('Cart page')).toBeInTheDocument();
  });

  it('shows the total from the server', async () => {
    renderCheckout('/checkout');
    expect(await screen.findByText('$45')).toBeInTheDocument();
    expect(quoteMock).toHaveBeenCalledWith([{ id: 'pink-blaze', quantity: 2 }]);
  });

  it('explains when stock has run out, with a way back', async () => {
    quoteMock.mockRejectedValue(new QuoteRejectedError("There isn't enough Pink Blaze left."));
    renderCheckout('/checkout');

    expect(await screen.findByRole('alert')).toHaveTextContent('enough Pink Blaze');
    expect(screen.getByRole('link', { name: 'Back to your cart' })).toBeInTheDocument();
  });

  it('validates delivery details before moving on', async () => {
    const user = userEvent.setup();
    renderCheckout('/checkout');

    await user.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(location()).toBe('/checkout');
  });

  it('will not open payment without delivery details', () => {
    renderCheckout('/checkout/payment');
    expect(location()).toBe('/checkout');
  });

  it('keeps delivery details when going back', async () => {
    saveShipping(shipping);
    renderCheckout('/checkout');
    expect(await screen.findByLabelText('Full name')).toHaveValue('Sova');
  });

  it('rejects a card that is not a test card', async () => {
    const user = userEvent.setup();
    saveShipping(shipping);
    renderCheckout('/checkout/payment');
    await screen.findByRole('button', { name: 'Pay $45' });

    await user.type(screen.getByLabelText('Name on card'), 'Sova');
    await user.type(screen.getByLabelText('Card number'), '4111111111111111');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1234');
    await user.type(screen.getByLabelText('CVC'), '123');
    await user.click(screen.getByRole('button', { name: 'Pay $45' }));

    expect(await screen.findByText(/test cards listed above/)).toBeInTheDocument();
    expect(location()).toBe('/checkout/payment');
  });

  it('formats the card number as it is typed', async () => {
    const user = userEvent.setup();
    saveShipping(shipping);
    renderCheckout('/checkout/payment');

    await user.type(await screen.findByLabelText('Card number'), '42424242');

    expect(screen.getByLabelText('Card number')).toHaveValue('4242 4242');
  });

  it('completes the order, empties the cart and shows a confirmation', async () => {
    const user = userEvent.setup();
    saveShipping(shipping);
    renderCheckout('/checkout/payment');
    await screen.findByRole('button', { name: 'Pay $45' });

    await fillCard(user, 'Use approved card');
    await user.click(screen.getByRole('button', { name: 'Pay $45' }));

    expect(await screen.findByText('Thanks, Sova!', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(location()).toBe('/checkout/confirmation');
    await vi.waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBe('{}'));
  });

  it('keeps the cart and explains a declined card', async () => {
    const user = userEvent.setup();
    saveShipping(shipping);
    renderCheckout('/checkout/payment');
    await screen.findByRole('button', { name: 'Pay $45' });

    await fillCard(user, 'Use declined card');
    await user.click(screen.getByRole('button', { name: 'Pay $45' }));

    expect(await screen.findByText(/card was declined/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(location()).toBe('/checkout/payment');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('pink-blaze');
  });

  it('stops if the total changed since the page loaded', async () => {
    const user = userEvent.setup();
    saveShipping(shipping);
    renderCheckout('/checkout/payment');
    await screen.findByRole('button', { name: 'Pay $45' });
    quoteMock.mockResolvedValue({ ...quote, totalCents: 5000 });

    await fillCard(user, 'Use approved card');
    await user.click(screen.getByRole('button', { name: 'Pay $45' }));

    expect(await screen.findByText(/total has changed to \$50/)).toBeInTheDocument();
    expect(location()).toBe('/checkout/payment');
  });

  it('does not empty a newer cart when the confirmation is revisited', async () => {
    const user = userEvent.setup();
    saveShipping(shipping);
    const first = renderCheckout('/checkout/payment');
    await screen.findByRole('button', { name: 'Pay $45' });
    await fillCard(user, 'Use approved card');
    await user.click(screen.getByRole('button', { name: 'Pay $45' }));
    await screen.findByText('Thanks, Sova!', {}, { timeout: 5000 });
    await vi.waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBe('{}'));
    first.unmount();

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'frost-rush': 1 }));
    renderCheckout('/checkout/confirmation');
    await screen.findByText('Thanks, Sova!');

    expect(localStorage.getItem(STORAGE_KEY)).toContain('frost-rush');
  });

  it('sends a direct visit to the confirmation page to the shop', () => {
    localStorage.clear();
    renderCheckout('/checkout/confirmation');
    expect(screen.getByText('Shop page')).toBeInTheDocument();
  });
});
