import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  fetchSupplier,
  fetchSupplierEvents,
  SupplierRejectedError,
  transitionSupplier,
} from '../../api/suppliers';
import type { Supplier } from '../../data/suppliers';
import { renderApp, signedInStaff } from '../../test/render';
import { SupplierDetailPage } from './SupplierDetailPage';

vi.mock('../../lib/supabase', () => ({ supabase: {} }));
vi.mock('../../api/suppliers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/suppliers')>()),
  fetchSupplier: vi.fn(),
  fetchSupplierEvents: vi.fn(),
  transitionSupplier: vi.fn(),
  deleteSupplierDraft: vi.fn(),
}));

const fetchMock = vi.mocked(fetchSupplier);
const transitionMock = vi.mocked(transitionSupplier);

const base: Supplier = {
  id: 'abc',
  name: 'Atlas Freight',
  category: 'logistics',
  country: 'India',
  contactName: 'A',
  contactEmail: 'a@example.com',
  certifications: ['HACCP'],
  hasInsurance: true,
  auditedLastYear: false,
  handlesAllergens: false,
  status: 'in_review',
  riskScore: 20,
  riskLevel: 'low',
  createdAt: '2026-01-01T00:00:00Z',
};

const render = () =>
  renderApp(<SupplierDetailPage />, {
    route: '/admin/suppliers/abc',
    path: '/admin/suppliers/:id',
    auth: signedInStaff,
  });

describe('SupplierDetailPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    transitionMock.mockReset();
    vi.mocked(fetchSupplierEvents).mockResolvedValue([]);
    // jsdom doesn't implement dialog.
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
  });

  it.each([
    ['submitted', ['Start review']],
    ['in_review', ['Approve', 'Reject']],
    ['rejected', ['Reopen as draft']],
  ] as const)('offers the right actions for %s', async (status, labels) => {
    fetchMock.mockResolvedValue({ ...base, status });
    render();

    for (const label of labels) {
      expect(await screen.findByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('offers no actions once approved', async () => {
    fetchMock.mockResolvedValue({ ...base, status: 'approved' });
    render();

    await screen.findByRole('heading', { name: 'Atlas Freight' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sends the status it was showing, so the server can detect a conflict', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(base);
    transitionMock.mockResolvedValue();
    render();

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(transitionMock.mock.calls[0]?.[0]).toEqual({
      id: 'abc',
      expectedStatus: 'in_review',
      toStatus: 'approved',
      note: undefined,
    });
  });

  it('requires a reason to reject', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(base);
    render();

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog', { name: 'Reject supplier' });
    await user.click(within(dialog).getByRole('button', { name: 'Reject supplier' }));

    expect(within(dialog).getByText('Enter a reason')).toBeInTheDocument();
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it('sends the rejection reason', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(base);
    transitionMock.mockResolvedValue();
    render();

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog', { name: 'Reject supplier' });
    await user.type(within(dialog).getByLabelText('Reason'), 'No insurance');
    await user.click(within(dialog).getByRole('button', { name: 'Reject supplier' }));

    expect(transitionMock.mock.calls[0]?.[0]).toMatchObject({
      toStatus: 'rejected',
      note: 'No insurance',
    });
  });

  it('shows the latest status after a conflict with another reviewer', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(base);
    fetchMock.mockResolvedValue({ ...base, status: 'approved' });
    transitionMock.mockRejectedValue(
      new SupplierRejectedError('Someone else updated this supplier.', { stale: true }),
    );
    render();

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(await screen.findByText('Someone else updated this supplier.')).toBeInTheDocument();
    expect(await screen.findByText('Approved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('handles a supplier that does not exist', async () => {
    fetchMock.mockResolvedValue(null);
    render();

    expect(await screen.findByRole('heading', { name: 'Supplier not found' })).toBeInTheDocument();
  });
});
