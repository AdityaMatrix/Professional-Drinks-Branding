import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createSupplier,
  fetchSupplier,
  SupplierRejectedError,
  transitionSupplier,
  updateSupplier,
} from '../../api/suppliers';
import type { Supplier } from '../../data/suppliers';
import { renderApp, signedInStaff } from '../../test/render';
import { SupplierOnboardingPage } from './SupplierOnboardingPage';

vi.mock('../../lib/supabase', () => ({ supabase: {} }));
vi.mock('../../api/suppliers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/suppliers')>()),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  fetchSupplier: vi.fn(),
  transitionSupplier: vi.fn(),
}));

const createMock = vi.mocked(createSupplier);
const updateMock = vi.mocked(updateSupplier);
const fetchMock = vi.mocked(fetchSupplier);
const transitionMock = vi.mocked(transitionSupplier);

const draft: Supplier = {
  id: 'abc',
  name: 'Atlas Freight',
  category: 'logistics',
  country: 'India',
  contactName: null,
  contactEmail: null,
  certifications: [],
  hasInsurance: null,
  auditedLastYear: null,
  handlesAllergens: null,
  status: 'draft',
  riskScore: null,
  riskLevel: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const complete: Supplier = {
  ...draft,
  contactName: 'A',
  contactEmail: 'a@example.com',
  hasInsurance: true,
  auditedLastYear: true,
  handlesAllergens: false,
};

const location = () => screen.getByTestId('location').textContent;
const renderNew = () =>
  renderApp(<SupplierOnboardingPage />, { route: '/admin/suppliers/new', auth: signedInStaff });
const renderDraft = (route: string) =>
  renderApp(<SupplierOnboardingPage />, {
    route,
    path: '/admin/suppliers/:id/onboarding',
    auth: signedInStaff,
    extraRoutes: undefined,
  });

async function fillCompany(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Company name'), 'Atlas Freight');
  await user.selectOptions(screen.getByLabelText('Category'), 'logistics');
  await user.type(screen.getByLabelText('Country'), 'India');
}

describe('SupplierOnboardingPage', () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    fetchMock.mockReset();
    transitionMock.mockReset();
  });

  it('validates a step before saving it', async () => {
    const user = userEvent.setup();
    renderNew();

    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(await screen.findByText('Enter the company name')).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates the draft after step 1 and moves to step 2', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValue('abc');
    renderNew();
    await fillCompany(user);

    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    await vi.waitFor(() =>
      expect(location()).toBe('/admin/suppliers/abc/onboarding?step=2'),
    );
    expect(createMock.mock.calls[0]?.[0]).toEqual({
      name: 'Atlas Freight',
      category: 'logistics',
      country: 'India',
    });
  });

  it('shows a duplicate name from the server on the name field', async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValue(
      new SupplierRejectedError('A supplier with this name already exists', { field: 'name' }),
    );
    renderNew();
    await fillCompany(user);

    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    await screen.findByText('A supplier with this name already exists');
    expect(screen.getByLabelText('Company name')).toHaveFocus();
    expect(screen.getByLabelText('Company name')).toHaveValue('Atlas Freight');
  });

  it('keeps the answers when saving fails', async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValue(new Error('Network down'));
    renderNew();
    await fillCompany(user);

    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(await screen.findByText(/couldn't save this step/)).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toHaveValue('India');
  });

  it('can save and leave part way through', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValue('abc');
    renderNew();
    await fillCompany(user);

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await vi.waitFor(() => expect(location()).toBe('/admin/suppliers'));
  });

  it('resumes a draft at its first unanswered step', async () => {
    fetchMock.mockResolvedValue(draft);
    renderDraft('/admin/suppliers/abc/onboarding');

    expect(await screen.findByLabelText('Contact name')).toBeInTheDocument();
  });

  it('will not skip ahead past an unanswered step through the URL', async () => {
    fetchMock.mockResolvedValue(draft);
    renderDraft('/admin/suppliers/abc/onboarding?step=4');

    expect(await screen.findByLabelText('Contact name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit for review' })).not.toBeInTheDocument();
  });

  it('can go back to an earlier step with the saved values', async () => {
    fetchMock.mockResolvedValue(draft);
    renderDraft('/admin/suppliers/abc/onboarding?step=1');

    expect(await screen.findByLabelText('Company name')).toHaveValue('Atlas Freight');
  });

  it('requires every compliance question', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ...draft, contactName: 'A', contactEmail: 'a@example.com' });
    renderDraft('/admin/suppliers/abc/onboarding?step=3');

    await user.click(await screen.findByRole('button', { name: 'Save and continue' }));

    expect(await screen.findAllByText('Choose yes or no')).toHaveLength(3);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('saves compliance answers as booleans', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ...draft, contactName: 'A', contactEmail: 'a@example.com' });
    updateMock.mockResolvedValue();
    renderDraft('/admin/suppliers/abc/onboarding?step=3');

    await user.click(await screen.findByLabelText('HACCP'));
    const yes = screen.getAllByLabelText('Yes');
    const no = screen.getAllByLabelText('No');
    await user.click(yes[0] as HTMLElement);
    await user.click(no[1] as HTMLElement);
    await user.click(no[2] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    await vi.waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith('abc', {
        certifications: ['HACCP'],
        hasInsurance: true,
        auditedLastYear: false,
        handlesAllergens: false,
      }),
    );
  });

  it('submits from the review step', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(complete);
    transitionMock.mockResolvedValue();
    renderDraft('/admin/suppliers/abc/onboarding?step=4');

    await user.click(await screen.findByRole('button', { name: 'Submit for review' }));

    await vi.waitFor(() => expect(location()).toBe('/admin/suppliers/abc'));
    expect(transitionMock.mock.calls[0]?.[0]).toEqual({
      id: 'abc',
      expectedStatus: 'draft',
      toStatus: 'submitted',
    });
  });

  it('sends a supplier that is no longer a draft to its detail page', async () => {
    fetchMock.mockResolvedValue({ ...complete, status: 'submitted' });
    renderDraft('/admin/suppliers/abc/onboarding');

    await vi.waitFor(() => expect(location()).toBe('/admin/suppliers/abc'));
  });
});
