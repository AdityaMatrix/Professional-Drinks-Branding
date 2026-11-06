import { z } from 'zod';
import type { Quote } from '../api/orders';

export const shippingSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(100, 'Keep this under 100 characters'),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  address: z.string().trim().min(5, 'Enter your address').max(200, 'Keep this under 200 characters'),
  city: z.string().trim().min(2, 'Enter your city').max(100, 'Keep this under 100 characters'),
  postcode: z.string().trim().min(3, 'Enter your postcode').max(12, 'Check your postcode'),
  country: z.string().trim().min(2, 'Enter your country').max(80, 'Keep this under 80 characters'),
});
export type ShippingValues = z.infer<typeof shippingSchema>;

/**
 * Only these numbers are accepted, so a real card can't be used by mistake. They're the standard
 * public test numbers.
 */
export const testCards = [
  { number: '4242 4242 4242 4242', label: 'Approved', result: 'approved' },
  { number: '4000 0000 0000 0002', label: 'Declined', result: 'declined' },
] as const;

const digits = (text: string) => text.replace(/\s/g, '');

const findTestCard = (cardNumber: string) =>
  testCards.find((card) => digits(card.number) === digits(cardNumber));

export function isFutureExpiry(expiry: string, now = new Date()) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const year = 2000 + Number(match[2]);
  const month = Number(match[1]);
  // A card is valid until the end of its expiry month.
  return new Date(year, month, 1) > now;
}

export const paymentSchema = z.object({
  cardName: z.string().trim().min(2, 'Enter the name on the card'),
  cardNumber: z.string().refine((value) => Boolean(findTestCard(value)), {
    error: 'This demo only accepts the test cards listed above',
  }),
  expiry: z.string().refine((value) => isFutureExpiry(value), {
    error: 'Enter a future date as MM/YY',
  }),
  cvc: z.string().regex(/^\d{3}$/, 'Enter 3 digits'),
});
export type PaymentValues = z.infer<typeof paymentSchema>;

export function formatCardNumber(text: string) {
  const onlyDigits = text.replace(/\D/g, '').slice(0, 16);
  return onlyDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(text: string) {
  const onlyDigits = text.replace(/\D/g, '').slice(0, 4);
  return onlyDigits.length > 2 ? `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2)}` : onlyDigits;
}

export class CardDeclinedError extends Error {
  constructor() {
    super('Your card was declined. Try the other test card.');
    this.name = 'CardDeclinedError';
  }
}

/** Stands in for a payment provider. Nothing is sent anywhere. */
export async function processMockPayment(cardNumber: string, delayMs = 1500) {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (findTestCard(cardNumber)?.result !== 'approved') throw new CardDeclinedError();
}

export type PlacedOrder = {
  reference: string;
  quote: Quote;
  shipping: ShippingValues;
  cartCleared: boolean;
};

// Session storage survives a refresh and is gone when the tab closes. Card details are never saved.
const SHIPPING_KEY = 'valo-checkout-shipping';
const ORDER_KEY = 'valo-checkout-order';

function read<Value>(key: string, parse: (value: unknown) => Value | null): Value | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is blocked. Checkout still works until the page is refreshed.
  }
}

export const loadShipping = () =>
  read(SHIPPING_KEY, (value) => shippingSchema.safeParse(value).data ?? null);

export const saveShipping = (values: ShippingValues) => write(SHIPPING_KEY, values);

export const loadOrder = () => read(ORDER_KEY, (value) => value as PlacedOrder);

/** True the first time only, so revisiting the confirmation can't empty a newer cart. */
export function takeCartClearance() {
  const order = loadOrder();
  if (!order || order.cartCleared) return false;
  write(ORDER_KEY, { ...order, cartCleared: true });
  return true;
}

export function placeOrder(quote: Quote, shipping: ShippingValues): PlacedOrder {
  const order = {
    reference: `VD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    quote,
    shipping,
    cartCleared: false,
  };
  write(ORDER_KEY, order);
  try {
    sessionStorage.removeItem(SHIPPING_KEY);
  } catch {
    // Nothing to clean up if storage is blocked.
  }
  return order;
}
