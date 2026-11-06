import { z } from 'zod';
import {
  categoryLabels,
  PAGE_SIZE,
  riskLabels,
  statusLabels,
  type RiskLevel,
  type Supplier,
  type SupplierCategory,
  type SupplierEvent,
  type SupplierFilters,
  type SupplierStatus,
} from '../data/suppliers';
import { getSupabase } from '../lib/supabase';
import { toSearchPattern } from './products';

const COLUMNS =
  'id, name, category, country, contact_name, contact_email, certifications, has_insurance, audited_last_year, handles_allergens, status, risk_score, risk_level, created_at';

const statusEnum = z.enum(Object.keys(statusLabels) as [SupplierStatus]);

const supplierRow = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.enum(Object.keys(categoryLabels) as [SupplierCategory]),
    country: z.string(),
    contact_name: z.string().nullable(),
    contact_email: z.string().nullable(),
    certifications: z.array(z.string()),
    has_insurance: z.boolean().nullable(),
    audited_last_year: z.boolean().nullable(),
    handles_allergens: z.boolean().nullable(),
    status: statusEnum,
    risk_score: z.number().int().nullable(),
    risk_level: z.enum(Object.keys(riskLabels) as [RiskLevel]).nullable(),
    created_at: z.string(),
  })
  .transform(
    (row): Supplier => ({
      id: row.id,
      name: row.name,
      category: row.category,
      country: row.country,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      certifications: row.certifications,
      hasInsurance: row.has_insurance,
      auditedLastYear: row.audited_last_year,
      handlesAllergens: row.handles_allergens,
      status: row.status,
      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      createdAt: row.created_at,
    }),
  );

const eventRow = z
  .object({
    id: z.number(),
    from_status: statusEnum.nullable(),
    to_status: statusEnum,
    note: z.string().nullable(),
    actor: z.string(),
    created_at: z.string(),
  })
  .transform(
    (row): SupplierEvent => ({
      id: row.id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      note: row.note,
      actor: row.actor,
      createdAt: row.created_at,
    }),
  );

const PAGE_OUT_OF_RANGE = 'PGRST103';

export async function fetchSuppliers(filters: SupplierFilters, signal?: AbortSignal) {
  const supabase = await getSupabase();
  const from = (filters.page - 1) * PAGE_SIZE;
  let query = supabase.from('suppliers').select(COLUMNS, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.risk) query = query.eq('risk_level', filters.risk);
  if (filters.category) query = query.eq('category', filters.category);
  const pattern = toSearchPattern(filters.q);
  if (pattern) query = query.ilike('search_text', pattern);

  query = query
    .order(filters.sort, { ascending: filters.direction === 'asc', nullsFirst: false })
    .order('id')
    .range(from, from + PAGE_SIZE - 1);
  if (signal) query = query.abortSignal(signal);

  const { data, error, count } = await query;
  // A stale link can point past the last page. That's an empty page, not a failure.
  if (error?.code === PAGE_OUT_OF_RANGE) return { rows: [] as Supplier[], total: 0 };
  if (error) throw new Error(error.message);
  return { rows: z.array(supplierRow).parse(data), total: count ?? 0 };
}

export async function fetchSupplier(id: string, signal?: AbortSignal) {
  const supabase = await getSupabase();
  let query = supabase.from('suppliers').select(COLUMNS).eq('id', id);
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? supplierRow.parse(data) : null;
}

export async function fetchSupplierEvents(id: string, signal?: AbortSignal) {
  const supabase = await getSupabase();
  let query = supabase
    .from('supplier_events')
    .select('id, from_status, to_status, note, actor, created_at')
    .eq('supplier_id', id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return z.array(eventRow).parse(data);
}

const summaryRow = z.object({
  status: statusEnum,
  risk_level: z.enum(Object.keys(riskLabels) as [RiskLevel]).nullable(),
});

export async function fetchSupplierSummary(signal?: AbortSignal) {
  const supabase = await getSupabase();
  let query = supabase.from('suppliers').select('status, risk_level');
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = z.array(summaryRow).parse(data);
  const byStatus = Object.fromEntries(
    (Object.keys(statusLabels) as SupplierStatus[]).map((status) => [
      status,
      rows.filter((row) => row.status === status).length,
    ]),
  ) as Record<SupplierStatus, number>;
  const highRiskSubmitted = rows.filter(
    (row) => row.risk_level === 'high' && row.status === 'submitted',
  ).length;
  return { byStatus, highRiskSubmitted, total: rows.length };
}

export type SupplierPatch = Partial<
  Pick<
    Supplier,
    | 'name'
    | 'category'
    | 'country'
    | 'contactName'
    | 'contactEmail'
    | 'certifications'
    | 'hasInsurance'
    | 'auditedLastYear'
    | 'handlesAllergens'
  >
>;

const columnNames: Record<keyof SupplierPatch, string> = {
  name: 'name',
  category: 'category',
  country: 'country',
  contactName: 'contact_name',
  contactEmail: 'contact_email',
  certifications: 'certifications',
  hasInsurance: 'has_insurance',
  auditedLastYear: 'audited_last_year',
  handlesAllergens: 'handles_allergens',
};

const toRow = (patch: SupplierPatch) =>
  Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [columnNames[key as keyof SupplierPatch], value]),
  );

/** The server refused the change for a reason the user can act on. */
export class SupplierRejectedError extends Error {
  readonly field?: string;
  readonly stale: boolean;

  constructor(message: string, options: { field?: string; stale?: boolean } = {}) {
    super(message);
    this.name = 'SupplierRejectedError';
    this.field = options.field;
    this.stale = options.stale ?? false;
  }
}

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

const constraintFields: Record<string, { field: string; message: string }> = {
  supplier_name_length: { field: 'name', message: 'Enter the company name' },
  supplier_country_length: { field: 'country', message: 'Enter the country' },
  supplier_contact_name_length: { field: 'contactName', message: 'Enter a contact name' },
  supplier_contact_email_format: { field: 'contactEmail', message: 'Enter a valid email address' },
};

type PostgrestError = { code?: string; hint?: string | null; message: string };

function toSaveError(error: PostgrestError) {
  if (error.hint === 'limit_reached') {
    return new SupplierRejectedError(
      'The demo has reached its supplier limit. Reset the demo data from the dashboard.',
    );
  }
  if (error.code === UNIQUE_VIOLATION) {
    return new SupplierRejectedError('A supplier with this name already exists', { field: 'name' });
  }
  if (error.code === CHECK_VIOLATION) {
    const match = Object.entries(constraintFields).find(([name]) => error.message.includes(name));
    if (match) return new SupplierRejectedError(match[1].message, { field: match[1].field });
  }
  return new Error(error.message);
}

export async function createSupplier(values: SupplierPatch) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('suppliers')
    .insert(toRow(values))
    .select('id')
    .single();
  if (error) throw toSaveError(error);
  return z.object({ id: z.string() }).parse(data).id;
}

export async function updateSupplier(id: string, patch: SupplierPatch) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('suppliers')
    .update(toRow(patch))
    .eq('id', id)
    .select('id');
  if (error) throw toSaveError(error);
  // The policy only matches drafts, so no rows means someone submitted it in the meantime.
  if (data.length === 0) {
    throw new SupplierRejectedError('This supplier is no longer a draft.', { stale: true });
  }
}

export async function deleteSupplierDraft(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('suppliers').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (data.length === 0) {
    throw new SupplierRejectedError('This supplier is no longer a draft.', { stale: true });
  }
}

const transitionMessages: Record<string, string> = {
  stale_status: 'Someone else updated this supplier. Check the latest status and try again.',
  invalid_transition: 'That status change is not allowed.',
  note_required: 'Enter a reason.',
  incomplete: 'Complete every onboarding step first.',
  forbidden: "You don't have permission to do that.",
  not_found: 'This supplier no longer exists.',
};

export async function transitionSupplier(input: {
  id: string;
  expectedStatus: SupplierStatus;
  toStatus: SupplierStatus;
  note?: string;
}) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('transition_supplier', {
    p_id: input.id,
    p_expected_status: input.expectedStatus,
    p_to_status: input.toStatus,
    p_note: input.note ?? null,
  });
  if (!error) return;

  const message = error.hint ? transitionMessages[error.hint] : undefined;
  if (message) {
    throw new SupplierRejectedError(message, { stale: error.hint === 'stale_status' });
  }
  throw new Error(error.message);
}

export async function resetDemoData() {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('reset_demo_data');
  if (error) throw new Error(error.message);
}

export async function fetchIsStaff() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('is_staff');
  if (error) throw new Error(error.message);
  return z.boolean().parse(data);
}
