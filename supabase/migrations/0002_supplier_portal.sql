-- Staff access and the supplier portal. Create the demo user first, then run this once.

-- Supabase grants new tables broadly by default. Grant only what each role needs, so a blocked
-- action fails with a permission error instead of quietly matching no rows.
revoke all on public.products, public.contact_messages from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;

-- Being signed in isn't enough: the demo password is public, so access comes from this table.
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.staff enable row level security;
revoke all on public.staff from anon, authenticated;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_staff() from public, anon, authenticated;
grant execute on function public.is_staff() to authenticated;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint supplier_name_length check (char_length(name) between 2 and 120),
  category text not null check (category in ('ingredients', 'packaging', 'logistics', 'co_packing')),
  country text not null constraint supplier_country_length check (char_length(country) between 2 and 80),
  contact_name text constraint supplier_contact_name_length check (char_length(contact_name) between 2 and 100),
  contact_email text constraint supplier_contact_email_format check (
    char_length(contact_email) <= 254
    and contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  certifications text[] not null default '{}',
  has_insurance boolean,
  audited_last_year boolean,
  handles_allergens boolean,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  risk_score integer,
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  search_text text generated always as (lower(name || ' ' || country)) stored,
  created_at timestamptz not null default now()
);

create unique index suppliers_name_unique on public.suppliers (lower(name));
create index suppliers_status on public.suppliers (status);
create index suppliers_created_at on public.suppliers (created_at desc);

create table public.supplier_events (
  id bigint primary key generated always as identity,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  actor text not null default 'System',
  created_at timestamptz not null default now()
);

create index supplier_events_supplier on public.supplier_events (supplier_id, created_at desc);

-- Keeps the public demo from filling the table.
create function public.limit_supplier_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.suppliers) >= 100 then
    raise exception 'Supplier limit reached' using hint = 'limit_reached';
  end if;
  return new;
end;
$$;

create trigger suppliers_limit
before insert on public.suppliers
for each row execute function public.limit_supplier_count();

create function public.log_supplier_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.supplier_events (supplier_id, to_status, actor)
  values (new.id, new.status, coalesce((select auth.jwt() ->> 'email'), 'System'));
  return new;
end;
$$;

create trigger suppliers_log_created
after insert on public.suppliers
for each row execute function public.log_supplier_created();

revoke execute on function public.limit_supplier_count() from public, anon, authenticated;
revoke execute on function public.log_supplier_created() from public, anon, authenticated;

alter table public.suppliers enable row level security;
alter table public.supplier_events enable row level security;

revoke all on public.suppliers, public.supplier_events from anon, authenticated;
grant select, delete on public.suppliers to authenticated;
grant select on public.supplier_events to authenticated;

-- status and the risk columns are left out, so only transition_supplier can change them.
grant insert (
  name, category, country, contact_name, contact_email,
  certifications, has_insurance, audited_last_year, handles_allergens
) on public.suppliers to authenticated;
grant update (
  name, category, country, contact_name, contact_email,
  certifications, has_insurance, audited_last_year, handles_allergens
) on public.suppliers to authenticated;

create policy "Staff can read suppliers"
on public.suppliers for select to authenticated
using ((select public.is_staff()));

create policy "Staff can add suppliers"
on public.suppliers for insert to authenticated
with check ((select public.is_staff()));

create policy "Staff can edit drafts"
on public.suppliers for update to authenticated
using ((select public.is_staff()) and status = 'draft')
with check ((select public.is_staff()) and status = 'draft');

create policy "Staff can delete drafts"
on public.suppliers for delete to authenticated
using ((select public.is_staff()) and status = 'draft');

create policy "Staff can read supplier history"
on public.supplier_events for select to authenticated
using ((select public.is_staff()));

create function public.supplier_risk_score(
  p_certifications text[],
  p_has_insurance boolean,
  p_audited_last_year boolean,
  p_handles_allergens boolean
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select
    (case when p_certifications && array['ISO 22000', 'HACCP', 'BRCGS'] then 0 else 40 end)
    + (case when p_has_insurance then 0 else 30 end)
    + (case when p_audited_last_year then 0 else 20 end)
    + (case when p_handles_allergens then 10 else 0 end);
$$;

create function public.risk_level_for(p_score integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_score >= 60 then 'high' when p_score >= 30 then 'medium' else 'low' end;
$$;

revoke execute on function public.supplier_risk_score(text[], boolean, boolean, boolean)
  from public, anon, authenticated;
revoke execute on function public.risk_level_for(integer) from public, anon, authenticated;

-- The only way to change a status. p_expected_status is what the reviewer was looking at, so
-- two people acting on the same supplier can't silently overwrite each other.
create function public.transition_supplier(
  p_id uuid,
  p_expected_status text,
  p_to_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.suppliers;
  clean_note text := nullif(trim(p_note), '');
  score integer;
begin
  if not public.is_staff() then
    raise exception 'Not allowed' using hint = 'forbidden';
  end if;

  select * into current_row from public.suppliers where id = p_id for update;

  if not found then
    raise exception 'Supplier not found' using hint = 'not_found';
  end if;
  if current_row.status <> p_expected_status then
    raise exception 'Supplier status has changed' using hint = 'stale_status';
  end if;
  if (current_row.status, p_to_status) not in (
    ('draft', 'submitted'),
    ('submitted', 'in_review'),
    ('in_review', 'approved'),
    ('in_review', 'rejected'),
    ('rejected', 'draft')
  ) then
    raise exception 'That status change is not allowed' using hint = 'invalid_transition';
  end if;
  if p_to_status = 'rejected' and clean_note is null then
    raise exception 'A reason is required' using hint = 'note_required';
  end if;

  if p_to_status = 'submitted' then
    if current_row.contact_name is null
      or current_row.contact_email is null
      or current_row.has_insurance is null
      or current_row.audited_last_year is null
      or current_row.handles_allergens is null
    then
      raise exception 'The supplier is incomplete' using hint = 'incomplete';
    end if;

    score := public.supplier_risk_score(
      current_row.certifications,
      current_row.has_insurance,
      current_row.audited_last_year,
      current_row.handles_allergens
    );
  end if;

  update public.suppliers
  set
    status = p_to_status,
    risk_score = case
      when p_to_status = 'submitted' then score
      when p_to_status = 'draft' then null
      else risk_score
    end,
    risk_level = case
      when p_to_status = 'submitted' then public.risk_level_for(score)
      when p_to_status = 'draft' then null
      else risk_level
    end
  where id = p_id;

  insert into public.supplier_events (supplier_id, from_status, to_status, note, actor)
  values (
    p_id,
    current_row.status,
    p_to_status,
    clean_note,
    coalesce((select auth.jwt() ->> 'email'), 'System')
  );
end;
$$;

revoke execute on function public.transition_supplier(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.transition_supplier(uuid, text, text, text) to authenticated;

create function public.seed_demo_suppliers()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefixes text[] := array[
    'Northwind', 'Cobalt', 'Saffron', 'Harbor', 'Evergreen', 'Summit', 'Meridian', 'Juniper', 'Atlas'
  ];
  suffixes text[] := array['Ingredients', 'Packaging Co', 'Freight', 'Bottling'];
  categories text[] := array['ingredients', 'packaging', 'logistics', 'co_packing'];
  countries text[] := array[
    'India', 'Germany', 'Brazil', 'Vietnam', 'United States', 'Netherlands', 'Mexico'
  ];
  statuses text[] := array['draft', 'submitted', 'in_review', 'approved', 'approved', 'rejected'];
begin
  insert into public.suppliers (
    name, category, country, contact_name, contact_email, certifications,
    has_insurance, audited_last_year, handles_allergens, status, risk_score, risk_level, created_at
  )
  select
    prefixes[g % 9 + 1] || ' ' || suffixes[g % 4 + 1],
    categories[g % 4 + 1],
    countries[g % 7 + 1],
    'Account Manager ' || (g + 1),
    'contact' || (g + 1) || '@example.com',
    case g % 3
      when 0 then array['ISO 22000', 'HACCP']
      when 1 then array['ISO 9001']
      else array['BRCGS']
    end,
    g % 5 <> 0,
    g % 4 <> 1,
    g % 3 = 0,
    statuses[g % 6 + 1],
    case when statuses[g % 6 + 1] = 'draft' then null else public.supplier_risk_score(
      case g % 3
        when 0 then array['ISO 22000', 'HACCP']
        when 1 then array['ISO 9001']
        else array['BRCGS']
      end,
      g % 5 <> 0, g % 4 <> 1, g % 3 = 0
    ) end,
    case when statuses[g % 6 + 1] = 'draft' then null else public.risk_level_for(
      public.supplier_risk_score(
        case g % 3
          when 0 then array['ISO 22000', 'HACCP']
          when 1 then array['ISO 9001']
          else array['BRCGS']
        end,
        g % 5 <> 0, g % 4 <> 1, g % 3 = 0
      )
    ) end,
    now() - make_interval(days => g)
  from generate_series(0, 35) as g;

  insert into public.supplier_events (supplier_id, from_status, to_status, note)
  select id, 'draft', status, 'Imported with the sample data'
  from public.suppliers
  where status <> 'draft';
end;
$$;

revoke execute on function public.seed_demo_suppliers() from public, anon, authenticated;

create function public.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not allowed' using hint = 'forbidden';
  end if;
  delete from public.suppliers where true;
  perform public.seed_demo_suppliers();
end;
$$;

revoke execute on function public.reset_demo_data() from public, anon, authenticated;
grant execute on function public.reset_demo_data() to authenticated;

select public.seed_demo_suppliers();

insert into public.staff (user_id)
select id from auth.users where email = 'demo@example.com';
