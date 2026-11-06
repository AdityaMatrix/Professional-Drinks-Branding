import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchProducts } from '../api/products';
import { STORAGE_KEY } from '../cart/cartState';
import { fallbackProducts, type Product } from '../data/products';
import { renderApp } from '../test/render';
import { CartPage } from './CartPage';

vi.mock('../api/products', () => ({ fetchProducts: vi.fn(), fetchProduct: vi.fn() }));
const fetchMock = vi.mocked(fetchProducts);

const [drink] = fallbackProducts as [Product];
const seedCart = (items: Record<string, number>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

describe('CartPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  it('shows an empty state', () => {
    fetchMock.mockResolvedValue([]);
    renderApp(<CartPage />);
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('prices lines from the API, and updates with quantity', async () => {
    const user = userEvent.setup();
    seedCart({ [drink.id]: 2 });
    fetchMock.mockResolvedValue([{ ...drink, stock: 10, priceCents: 2550 }]);
    renderApp(<CartPage />);

    expect(await screen.findByText('Subtotal: $51')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Add one ${drink.name}` }));
    expect(screen.getByText('Subtotal: $76.50')).toBeInTheDocument();
  });

  it('warns when stock has dropped below the quantity, and fixes it on request', async () => {
    const user = userEvent.setup();
    seedCart({ [drink.id]: 5 });
    fetchMock.mockResolvedValue([{ ...drink, stock: 2 }]);
    renderApp(<CartPage />);

    await user.click(await screen.findByRole('button', { name: 'Change to 2' }));

    expect(screen.queryByText(/Only 2 left/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(`Quantity of ${drink.name}`)).toHaveTextContent('2');
  });

  it('offers checkout when the cart is ready', async () => {
    seedCart({ [drink.id]: 2 });
    fetchMock.mockResolvedValue([{ ...drink, stock: 10 }]);
    renderApp(<CartPage />);

    expect(await screen.findByRole('link', { name: 'Go to checkout' })).toBeInTheDocument();
  });

  it('holds back checkout until a stock problem is fixed', async () => {
    seedCart({ [drink.id]: 5 });
    fetchMock.mockResolvedValue([{ ...drink, stock: 2 }]);
    renderApp(<CartPage />);

    await screen.findByText(/Fix the items above/);
    expect(screen.queryByRole('link', { name: 'Go to checkout' })).not.toBeInTheDocument();
  });

  it('leaves a sold-out line out of the subtotal', async () => {
    seedCart({ [drink.id]: 1 });
    fetchMock.mockResolvedValue([{ ...drink, stock: 0 }]);
    renderApp(<CartPage />);

    expect(await screen.findByText(/Now sold out/)).toBeInTheDocument();
    expect(screen.getByText('Subtotal: $0')).toBeInTheDocument();
  });

  it('flags items that no longer exist and removes them', async () => {
    const user = userEvent.setup();
    seedCart({ retired: 1 });
    fetchMock.mockResolvedValue([drink]);
    renderApp(<CartPage />);

    await user.click(await screen.findByRole('button', { name: 'Remove it' }));

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('keeps the cart when loading fails', async () => {
    seedCart({ [drink.id]: 1 });
    fetchMock.mockRejectedValue(new Error('Network down'));
    renderApp(<CartPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent("They're still saved");
    expect(localStorage.getItem(STORAGE_KEY)).toContain(drink.id);
  });
});
