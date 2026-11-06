import type { Page } from '@playwright/test';

const product = (id: string, name: string, agent: string, stock: number, order: number) => ({
  id,
  name,
  agent,
  role: 'duelist',
  price_cents: 2000,
  description: `${name} description`,
  color: '#e26060',
  image_key: agent.toLowerCase(),
  stock,
  sort_order: order,
});

const products = [
  product('vengeberry', 'VengeBerry', 'Reyna', 120, 1),
  product('pink-blaze', 'Pink Blaze', 'Phoenix', 80, 2),
  product('frost-rush', 'Frost Rush', 'Jett', 3, 3),
];

/** These tests stub the API, so they run in CI with no secrets and never touch the real project. */
export async function stubApi(page: Page) {
  await page.route('**/rest/v1/products*', (route) => {
    const id = new URL(route.request().url()).searchParams.get('id')?.replace('eq.', '');
    return route.fulfill({ json: id ? products.filter((item) => item.id === id) : products });
  });

  await page.route('**/rest/v1/rpc/quote_order', (route) => {
    const { p_items: items } = route.request().postDataJSON() as {
      p_items: { id: string; quantity: number }[];
    };
    const lines = items.map(({ id, quantity }) => {
      const item = products.find((candidate) => candidate.id === id);
      return {
        id,
        name: item?.name ?? id,
        quantity,
        unit_cents: 2000,
        line_cents: 2000 * quantity,
      };
    });
    const subtotal = lines.reduce((total, line) => total + line.line_cents, 0);
    const shipping = subtotal >= 5000 ? 0 : 500;
    return route.fulfill({
      json: {
        lines,
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: subtotal + shipping,
      },
    });
  });
}

export const skipIntro = (page: Page) =>
  page.addInitScript(() => sessionStorage.setItem('valo-intro-seen', '1'));
