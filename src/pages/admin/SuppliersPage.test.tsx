import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchSuppliers } from '../../api/suppliers';
import type { Supplier } from '../../data/suppliers';
import { renderApp, signedInStaff } from '../../test/render';
import { SuppliersPage } from './SuppliersPage';

vi.mock('../../api/suppliers', () => ({ fetchSuppliers: vi.fn() }));
const fetchMock = vi.mocked(fetchSuppliers);

const supplier = (index: number): Supplier => ({
  id: String(index),
  name: `Supplier ${index}`,
  category: 'packaging',
  country: 'India',
  contactName: 'A',
  contactEmail: 'a@example.com',
  certifications: [],
  hasInsurance: true,
  auditedLastYear: true,
  handlesAllergens: false,
  status: 'approved',
  riskScore: 10,
  riskLevel: 'low',
  createdAt: '2026-01-01T00:00:00Z',
});

const page = { rows: Array.from({ length: 10 }, (_, index) => supplier(index)), total: 25 };
const location = () => screen.getByTestId('location').textContent;
const render = (route: string) => renderApp(<SuppliersPage />, { route, auth: signedInStaff });

describe('SuppliersPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(page);
  });

  it('shows the rows and where they sit in the total', async () => {
    render('/admin/suppliers?page=2');

    expect(await screen.findByRole('link', { name: 'Supplier 0' })).toBeInTheDocument();
    expect(screen.getByText('Showing 11–20 of 25')).toBeInTheDocument();
  });

  it('moves between pages through the URL', async () => {
    const user = userEvent.setup();
    render('/admin/suppliers?status=approved');
    await screen.findByRole('link', { name: 'Supplier 0' });

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(location()).toBe('/admin/suppliers?status=approved&page=2');

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(location()).toBe('/admin/suppliers?status=approved');
  });

  it('disables the buttons at each end', async () => {
    render('/admin/suppliers?page=3');
    await screen.findByRole('link', { name: 'Supplier 0' });

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('returns to page 1 when a filter changes', async () => {
    const user = userEvent.setup();
    render('/admin/suppliers?page=3');
    await screen.findByRole('link', { name: 'Supplier 0' });

    await user.selectOptions(screen.getByLabelText('Status'), 'draft');

    expect(location()).toBe('/admin/suppliers?status=draft');
  });

  it('sorts by a column, then flips the direction', async () => {
    const user = userEvent.setup();
    render('/admin/suppliers');
    await screen.findByRole('link', { name: 'Supplier 0' });
    const sortButton = () => screen.getByRole('button', { name: /^Supplier/ });

    await user.click(sortButton());
    expect(location()).toBe('/admin/suppliers?sort=name&direction=desc');
    expect(screen.getByRole('columnheader', { name: /^Supplier/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    await user.click(sortButton());
    expect(location()).toBe('/admin/suppliers?sort=name&direction=asc');
  });

  it('offers to clear filters on an empty result, including a stale page link', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ rows: [], total: 0 });
    render('/admin/suppliers?page=99&status=draft');

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(location()).toBe('/admin/suppliers');
  });

  it('shows an error with a retry', async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error('Network down'));
    render('/admin/suppliers');

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Supplier 0' })).toBeInTheDocument();
  });
});
