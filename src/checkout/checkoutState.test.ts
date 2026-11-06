import {
  CardDeclinedError,
  formatCardNumber,
  formatExpiry,
  isFutureExpiry,
  loadOrder,
  loadShipping,
  paymentSchema,
  placeOrder,
  processMockPayment,
  saveShipping,
  type ShippingValues,
} from './checkoutState';

const shipping: ShippingValues = {
  fullName: 'Sova',
  email: 'sova@example.com',
  address: '1 Frost Lane',
  city: 'Moscow',
  postcode: '101000',
  country: 'Russia',
};

const validCard = {
  cardName: 'Sova',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/34',
  cvc: '123',
};

describe('isFutureExpiry', () => {
  const now = new Date(2026, 5, 15);

  it('accepts the current month, because a card lasts to the end of it', () => {
    expect(isFutureExpiry('06/26', now)).toBe(true);
  });

  it('rejects last month', () => {
    expect(isFutureExpiry('05/26', now)).toBe(false);
  });

  it.each(['13/30', '00/30', '1/30', '1230', 'ab/cd', ''])('rejects the format %s', (expiry) => {
    expect(isFutureExpiry(expiry, now)).toBe(false);
  });
});

describe('paymentSchema', () => {
  it('accepts a test card', () => {
    expect(paymentSchema.safeParse(validCard).success).toBe(true);
  });

  it('accepts a test card typed without spaces', () => {
    const card = { ...validCard, cardNumber: '4242424242424242' };
    expect(paymentSchema.safeParse(card).success).toBe(true);
  });

  it('rejects any other card, so a real number cannot be used', () => {
    const card = { ...validCard, cardNumber: '4111 1111 1111 1111' };
    expect(paymentSchema.safeParse(card).success).toBe(false);
  });

  it('requires a 3 digit CVC', () => {
    expect(paymentSchema.safeParse({ ...validCard, cvc: '12' }).success).toBe(false);
  });
});

describe('input formatting', () => {
  it('groups a card number and drops anything else', () => {
    expect(formatCardNumber('4242-4242x42424242999')).toBe('4242 4242 4242 4242');
  });

  it('adds the slash to an expiry', () => {
    expect(formatExpiry('1234')).toBe('12/34');
    expect(formatExpiry('12')).toBe('12');
  });
});

describe('processMockPayment', () => {
  it('approves the approved test card', async () => {
    await expect(processMockPayment('4242 4242 4242 4242', 0)).resolves.toBeUndefined();
  });

  it('declines the declined test card', async () => {
    await expect(processMockPayment('4000 0000 0000 0002', 0)).rejects.toThrow(CardDeclinedError);
  });
});

describe('session storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('remembers delivery details', () => {
    saveShipping(shipping);
    expect(loadShipping()).toEqual(shipping);
  });

  it('ignores damaged details', () => {
    sessionStorage.setItem('valo-checkout-shipping', '{"fullName":1}');
    expect(loadShipping()).toBeNull();
  });

  it('keeps the order and forgets the delivery form once placed', () => {
    saveShipping(shipping);
    const quote = { lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0 };

    const order = placeOrder(quote, shipping);

    expect(loadOrder()).toEqual(order);
    expect(order.reference).toMatch(/^VD-[0-9A-F-]{8}$/);
    expect(loadShipping()).toBeNull();
  });

  it('never stores card details', () => {
    saveShipping(shipping);
    placeOrder({ lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0 }, shipping);

    const stored = JSON.stringify({ ...sessionStorage });
    expect(stored).not.toMatch(/4242|cvc|card/i);
  });
});
