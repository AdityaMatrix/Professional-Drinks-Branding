import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchProducts } from '../api/products';
import { defaultFilters, fallbackProducts, type Product } from '../data/products';
import { renderApp } from '../test/render';
import { ProductsPage } from './ProductsPage';

vi.mock('../api/products', () => ({ fetchProducts: vi.fn(), fetchProduct: vi.fn() }));
const fetchMock = vi.mocked(fetchProducts);

const stocked: Product[] = fallbackProducts.map((product) => ({ ...product, stock: 10 }));
const location = () => screen.getByTestId('location').textContent;

describe('ProductsPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  it('shows a loading state, then the drinks', async () => {
    fetchMock.mockResolvedValue(stocked);
    renderApp(<ProductsPage />, { route: '/products' });

    expect(screen.getByRole('status', { name: 'Loading products' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Pink Blaze' })).toBeInTheDocument();
    expect(screen.getByText('4 drinks found')).toBeInTheDocument();
  });

  it('shows an error and recovers on retry', async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error('Network down'));
    fetchMock.mockResolvedValue(stocked);
    renderApp(<ProductsPage />, { route: '/products' });

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Pink Blaze' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers to clear filters when nothing matches', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (filters) => (filters.q ? [] : stocked));
    renderApp(<ProductsPage />, { route: '/products?q=nothing&role=duelist' });

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(location()).toBe('/products');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(await screen.findByRole('link', { name: 'Pink Blaze' })).toBeInTheDocument();
  });

  it('reads filters from the URL', async () => {
    fetchMock.mockResolvedValue(stocked);
    renderApp(<ProductsPage />, { route: '/products?role=sentinel&sort=name&q=sage' });

    await screen.findByRole('link', { name: 'Pink Blaze' });

    expect(fetchMock.mock.calls[0]?.[0]).toEqual({ role: 'sentinel', sort: 'name', q: 'sage' });
    expect(screen.getByLabelText('Agent role')).toHaveValue('sentinel');
    expect(screen.getByRole('searchbox')).toHaveValue('sage');
  });

  it('falls back to defaults for unknown URL values', async () => {
    fetchMock.mockResolvedValue(stocked);
    renderApp(<ProductsPage />, { route: '/products?role=hacker&sort=drop-table' });

    await screen.findByRole('link', { name: 'Pink Blaze' });

    expect(fetchMock.mock.calls[0]?.[0]).toEqual(defaultFilters);
  });

  it('writes a changed filter to the URL and keeps the others', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(stocked);
    renderApp(<ProductsPage />, { route: '/products?sort=name' });

    await user.selectOptions(screen.getByLabelText('Agent role'), 'duelist');

    expect(location()).toBe('/products?sort=name&role=duelist');
  });

  it('sends one request after typing stops, not one per key', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(stocked);
    renderApp(<ProductsPage />, { route: '/products' });
    await screen.findByRole('link', { name: 'Pink Blaze' });
    fetchMock.mockClear();

    await user.type(screen.getByRole('searchbox'), 'jett');

    await vi.waitFor(() => expect(location()).toBe('/products?q=jett'));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('stops adding a low-stock drink at the stock limit', async () => {
    const user = userEvent.setup();
    const [first] = stocked as [Product];
    fetchMock.mockResolvedValue([{ ...first, stock: 2 }]);
    renderApp(<ProductsPage />, { route: '/products' });

    const card = (await screen.findByRole('link', { name: first.name })).closest('article');
    const add = within(card as HTMLElement).getByRole('button');
    await user.click(add);
    await user.click(add);

    expect(add).toBeDisabled();
    expect(add).toHaveTextContent('All in cart');
  });

  it('disables a sold-out drink', async () => {
    const [first] = stocked as [Product];
    fetchMock.mockResolvedValue([{ ...first, stock: 0 }]);
    renderApp(<ProductsPage />, { route: '/products' });

    const button = await screen.findByRole('button', { name: `Add ${first.name} to cart` });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sold out');
  });
});
