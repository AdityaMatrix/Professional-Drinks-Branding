import { z } from 'zod';

export const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
} as const;
export type SupplierStatus = keyof typeof statusLabels;

export const riskLabels = { low: 'Low', medium: 'Medium', high: 'High' } as const;
export type RiskLevel = keyof typeof riskLabels;

export const categoryLabels = {
  ingredients: 'Ingredients',
  packaging: 'Packaging',
  logistics: 'Logistics',
  co_packing: 'Co-packing',
} as const;
export type SupplierCategory = keyof typeof categoryLabels;

export const certificationOptions = ['ISO 22000', 'HACCP', 'BRCGS', 'ISO 9001'] as const;

export type Supplier = {
  id: string;
  name: string;
  category: SupplierCategory;
  country: string;
  contactName: string | null;
  contactEmail: string | null;
  certifications: string[];
  hasInsurance: boolean | null;
  auditedLastYear: boolean | null;
  handlesAllergens: boolean | null;
  status: SupplierStatus;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  createdAt: string;
};

export type SupplierEvent = {
  id: number;
  fromStatus: SupplierStatus | null;
  toStatus: SupplierStatus;
  note: string | null;
  actor: string;
  createdAt: string;
};

export const sortColumns = ['name', 'created_at', 'risk_score'] as const;
export type SortColumn = (typeof sortColumns)[number];

export type SupplierFilters = {
  status: SupplierStatus | null;
  risk: RiskLevel | null;
  category: SupplierCategory | null;
  q: string;
  sort: SortColumn;
  direction: 'asc' | 'desc';
  page: number;
};

export const PAGE_SIZE = 10;

const pick = <Key extends string>(labels: Record<Key, string>, value: string | null) =>
  value !== null && Object.hasOwn(labels, value) ? (value as Key) : null;

/** The URL is user input, so anything unrecognised falls back to the default. */
export function parseSupplierFilters(params: URLSearchParams): SupplierFilters {
  const sort = sortColumns.find((column) => column === params.get('sort'));
  const page = Number(params.get('page'));
  return {
    status: pick(statusLabels, params.get('status')),
    risk: pick(riskLabels, params.get('risk')),
    category: pick(categoryLabels, params.get('category')),
    q: (params.get('q') ?? '').slice(0, 50),
    sort: sort ?? 'created_at',
    direction: params.get('direction') === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

type Transition = { to: SupplierStatus; label: string; needsNote?: boolean };

/** Which buttons to show. The server enforces the same rules in transition_supplier. */
export const transitions: Partial<Record<SupplierStatus, Transition[]>> = {
  submitted: [{ to: 'in_review', label: 'Start review' }],
  in_review: [
    { to: 'approved', label: 'Approve' },
    { to: 'rejected', label: 'Reject', needsNote: true },
  ],
  rejected: [{ to: 'draft', label: 'Reopen as draft' }],
};

export const ONBOARDING_STEPS = ['Company', 'Contact', 'Compliance', 'Review'] as const;

/** The furthest step a draft can open at, so a hand-edited URL can't skip required answers. */
export function furthestStep(supplier: Supplier | null | undefined): number {
  if (!supplier) return 1;
  if (!supplier.contactName || !supplier.contactEmail) return 2;
  const answered =
    supplier.hasInsurance !== null &&
    supplier.auditedLastYear !== null &&
    supplier.handlesAllergens !== null;
  return answered ? 4 : 3;
}

const yesNo = z.enum(['yes', 'no'], { error: 'Choose yes or no' });

// These limits mirror the check constraints in supabase/migrations. The database has the final say.
export const companySchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name').max(120, 'Keep this under 120 characters'),
  category: z.enum(Object.keys(categoryLabels) as [SupplierCategory], {
    error: 'Choose a category',
  }),
  country: z.string().trim().min(2, 'Enter the country').max(80, 'Keep this under 80 characters'),
});
export type CompanyValues = z.infer<typeof companySchema>;

export const contactStepSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(2, 'Enter a contact name')
    .max(100, 'Keep this under 100 characters'),
  contactEmail: z.string().trim().pipe(z.email('Enter a valid email address')),
});
export type ContactStepValues = z.infer<typeof contactStepSchema>;

export const complianceSchema = z.object({
  certifications: z.array(z.string()),
  hasInsurance: yesNo,
  auditedLastYear: yesNo,
  handlesAllergens: yesNo,
});
export type ComplianceValues = z.infer<typeof complianceSchema>;

export const toYesNo = (value: boolean | null) =>
  value === null ? undefined : value ? ('yes' as const) : ('no' as const);

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
