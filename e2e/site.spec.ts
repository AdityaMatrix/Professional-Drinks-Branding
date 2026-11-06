import { expect, test } from '@playwright/test';
import { skipIntro, stubApi } from './support';

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('the intro plays on the first visit, not on a refresh', async ({ page }) => {
  const videoRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('intro.mp4')) videoRequests.push(request.url());
  });

  await page.goto('./');
  const skip = page.getByRole('button', { name: 'Skip intro' });
  await skip.click();
  await expect(page.locator('#intro')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Our drinks' })).toBeVisible();

  videoRequests.length = 0;
  await page.reload();
  await expect(page.getByRole('region', { name: 'Our drinks' })).toBeVisible();
  await expect(skip).toHaveCount(0);
  expect(videoRequests).toHaveLength(0);
});

test('a customer can buy a drink, recovering from a declined card', async ({ page }) => {
  await skipIntro(page);
  await page.goto('products');

  await page.getByRole('button', { name: 'Add Pink Blaze to cart' }).click();
  await page.getByRole('button', { name: 'Add Pink Blaze to cart' }).click();
  await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();

  await page.getByRole('link', { name: 'Cart, 2 items' }).click();
  await expect(page.getByText('Subtotal: $40')).toBeVisible();
  await page.getByRole('link', { name: 'Go to checkout' }).click();

  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByText('Enter your name')).toBeVisible();

  await page.getByLabel('Full name').fill('Sova');
  await page.getByLabel('Email').fill('sova@example.com');
  await page.getByLabel('Address').fill('1 Frost Lane');
  await page.getByLabel('City').fill('Moscow');
  await page.getByLabel('Postcode').fill('101000');
  await page.getByLabel('Country').fill('Russia');
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  const pay = page.getByRole('button', { name: 'Pay $45' });
  await expect(pay).toBeEnabled();

  await page.getByRole('button', { name: 'Use declined card' }).click();
  await pay.click();
  await expect(page.getByText('Your card was declined')).toBeVisible();

  await page.getByRole('button', { name: 'Use approved card' }).click();
  await pay.click();
  await expect(page.getByRole('heading', { name: 'Thanks, Sova!' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Thanks, Sova!' })).toBeVisible();
});

test('a real card number is refused', async ({ page }) => {
  await skipIntro(page);
  await page.goto('products/pink-blaze');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('checkout');

  await page.getByLabel('Full name').fill('Sova');
  await page.getByLabel('Email').fill('sova@example.com');
  await page.getByLabel('Address').fill('1 Frost Lane');
  await page.getByLabel('City').fill('Moscow');
  await page.getByLabel('Postcode').fill('101000');
  await page.getByLabel('Country').fill('Russia');
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  await page.getByLabel('Name on card').fill('Sova');
  await page.getByLabel('Card number').fill('4111111111111111');
  await page.getByLabel('Expiry (MM/YY)').fill('1234');
  await page.getByLabel('CVC').fill('123');
  await page.getByRole('button', { name: /^Pay/ }).click();

  await expect(page.getByText(/test cards listed above/)).toBeVisible();
  await expect(page).toHaveURL(/checkout\/payment$/);
});

test('the portal sends signed-out visitors to login', async ({ page }) => {
  await skipIntro(page);
  await page.goto('admin/suppliers');

  await expect(page.getByRole('heading', { name: 'Supplier portal' })).toBeVisible();
  await expect(page).toHaveURL(/login\?next=/);
});

test('filters survive a refresh', async ({ page }) => {
  await skipIntro(page);
  await page.goto('products');

  await page.getByLabel('Sort by').selectOption('name');
  await expect(page).toHaveURL(/sort=name/);

  await page.reload();
  await expect(page.getByLabel('Sort by')).toHaveValue('name');
});
