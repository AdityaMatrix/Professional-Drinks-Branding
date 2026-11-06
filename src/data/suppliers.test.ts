import { furthestStep, parseSupplierFilters, type Supplier } from './suppliers';

const draft: Supplier = {
  id: '1',
  name: 'Acme',
  category: 'packaging',
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

describe('parseSupplierFilters', () => {
  it('reads valid filters', () => {
    const params = new URLSearchParams(
      'status=approved&risk=high&category=logistics&q=atlas&sort=name&direction=asc&page=3',
    );
    expect(parseSupplierFilters(params)).toEqual({
      status: 'approved',
      risk: 'high',
      category: 'logistics',
      q: 'atlas',
      sort: 'name',
      direction: 'asc',
      page: 3,
    });
  });

  it.each(['0', '-1', '1.5', 'abc'])('falls back to page 1 for page=%s', (page) => {
    expect(parseSupplierFilters(new URLSearchParams({ page })).page).toBe(1);
  });

  it('ignores unknown values', () => {
    const filters = parseSupplierFilters(
      new URLSearchParams('status=hacked&risk=extreme&sort=password&direction=sideways'),
    );
    expect(filters).toMatchObject({
      status: null,
      risk: null,
      sort: 'created_at',
      direction: 'desc',
    });
  });

  it('does not treat inherited object keys as valid values', () => {
    expect(parseSupplierFilters(new URLSearchParams('status=toString')).status).toBeNull();
  });
});

describe('furthestStep', () => {
  it('starts a new supplier on step 1', () => {
    expect(furthestStep(null)).toBe(1);
  });

  it('stops at the first unanswered step', () => {
    expect(furthestStep(draft)).toBe(2);
    expect(furthestStep({ ...draft, contactName: 'A', contactEmail: 'a@b.co' })).toBe(3);
  });

  it('counts a false answer as answered', () => {
    expect(
      furthestStep({
        ...draft,
        contactName: 'A',
        contactEmail: 'a@b.co',
        hasInsurance: false,
        auditedLastYear: false,
        handlesAllergens: false,
      }),
    ).toBe(4);
  });
});
