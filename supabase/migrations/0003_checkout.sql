-- Prices an order on the server, so the browser can't set its own total. Run once.
--
-- It writes nothing. This is a public demo, so no customer details are stored and stock doesn't
-- go down, otherwise any visitor could sell out the shop.
create function public.quote_order(p_items jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  item jsonb;
  product public.products;
  quantity integer;
  lines jsonb := '[]'::jsonb;
  subtotal integer := 0;
  shipping integer;
begin
  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 20
  then
    raise exception 'Invalid order' using hint = 'invalid_order';
  end if;

  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item ->> 'quantity', '') !~ '^[1-9][0-9]?$' then
      raise exception 'Invalid quantity' using hint = 'invalid_order';
    end if;
    quantity := (item ->> 'quantity')::integer;

    select * into product from public.products where id = item ->> 'id';

    if not found then
      raise exception 'Item unavailable' using hint = 'item_unavailable';
    end if;
    if product.stock < quantity then
      raise exception 'Not enough stock' using hint = 'out_of_stock', detail = product.name;
    end if;

    subtotal := subtotal + product.price_cents * quantity;
    lines := lines || jsonb_build_object(
      'id', product.id,
      'name', product.name,
      'quantity', quantity,
      'unit_cents', product.price_cents,
      'line_cents', product.price_cents * quantity
    );
  end loop;

  shipping := case when subtotal >= 5000 then 0 else 500 end;

  return jsonb_build_object(
    'lines', lines,
    'subtotal_cents', subtotal,
    'shipping_cents', shipping,
    'total_cents', subtotal + shipping
  );
end;
$$;

revoke execute on function public.quote_order(jsonb) from public, anon, authenticated;
grant execute on function public.quote_order(jsonb) to anon, authenticated;
