-- Products and contact messages. Run once in the Supabase SQL Editor.

create table public.products (
  id text primary key,
  name text not null,
  agent text not null,
  role text not null check (role in ('duelist', 'sentinel')),
  price_cents integer not null check (price_cents > 0),
  description text not null,
  color text not null,
  image_key text not null,
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  search_text text generated always as (lower(name || ' ' || agent)) stored,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint contact_name_length check (char_length(name) between 2 and 100),
  phone text constraint contact_phone_format check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  email text not null constraint contact_email_format check (
    char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  subject text not null constraint contact_subject_length check (char_length(subject) between 3 and 150),
  message text not null constraint contact_message_length check (char_length(message) between 10 and 1000),
  created_at timestamptz not null default now()
);

create index contact_messages_email_created_at on public.contact_messages (lower(email), created_at desc);

-- The browser can't enforce this, because it can't see earlier messages. Security definer lets
-- the check read a table that visitors have no select access to.
create function public.limit_contact_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.contact_messages
    where lower(email) = lower(new.email)
      and created_at > now() - interval '1 minute'
  ) then
    raise exception 'Too many messages from this address' using hint = 'rate_limited';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_contact_messages() from public, anon, authenticated;

create trigger contact_messages_rate_limit
before insert on public.contact_messages
for each row execute function public.limit_contact_messages();

-- Visitors can read products, and can send messages but never read them back.
grant select on public.products to anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;

alter table public.products enable row level security;
alter table public.contact_messages enable row level security;

create policy "Anyone can read products"
on public.products for select to anon, authenticated
using (true);

create policy "Anyone can send a contact message"
on public.contact_messages for insert to anon, authenticated
with check (true);

insert into public.products
  (id, name, agent, role, price_cents, description, color, image_key, stock, sort_order)
values
  ('vengeberry', 'VengeBerry', 'Reyna', 'duelist', 2000,
   'Unleash your power with Reyna''s bold red berry blend, crafted for the ultimate fierce competitor. Embrace the intensity of Reyna''s spirit as you conquer your opponents with ruthless determination.',
   '#e26060', 'reyna', 120, 1),
  ('pink-blaze', 'Pink Blaze', 'Phoenix', 'duelist', 2000,
   'Ignite your day with Phoenix''s vibrant pink burst, bringing a fiery energy to every challenge. Feel the unstoppable surge of passion with each sip, empowering you to rise above the competition.',
   '#f5bfaf', 'phoenix', 80, 2),
  ('frost-rush', 'Frost Rush', 'Jett', 'duelist', 2000,
   'Chill out with Jett''s cool and exhilarating flavor, designed for those who thrive on speed and excitement. Experience the rush of the wind at your back, propelling you forward with every sip of icy exhilaration.',
   '#dedfe1', 'jett', 3, 3),
  ('zengreen', 'ZenGreen', 'Sage', 'sentinel', 2000,
   'Refresh your senses with Sage''s invigorating green blend, perfect for keeping your cool in any situation. Let Sage guide you through the chaos with a taste of tranquility, ensuring clarity in every sip.',
   '#5da45d', 'sage', 0, 4);
