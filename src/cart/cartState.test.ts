import { cartReducer, parseStoredCart } from './cartState';

describe('cartReducer', () => {
  it('adds a new item and increases an existing one', () => {
    const once = cartReducer({}, { type: 'add', id: 'a', max: 5 });
    expect(cartReducer(once, { type: 'add', id: 'a', max: 5 })).toEqual({ a: 2 });
  });

  it('never goes above the stock limit', () => {
    expect(cartReducer({ a: 3 }, { type: 'add', id: 'a', max: 3 })).toEqual({ a: 3 });
    expect(cartReducer({}, { type: 'setQuantity', id: 'a', quantity: 9, max: 3 })).toEqual({ a: 3 });
  });

  it('ignores adding a sold-out item', () => {
    expect(cartReducer({}, { type: 'add', id: 'a', max: 0 })).toEqual({});
  });

  it('removes an item when its quantity reaches zero', () => {
    expect(cartReducer({ a: 1 }, { type: 'setQuantity', id: 'a', quantity: 0, max: 5 })).toEqual({});
  });

  it('removes only the named item', () => {
    expect(cartReducer({ a: 1, b: 2 }, { type: 'remove', id: 'a' })).toEqual({ b: 2 });
  });
});

describe('parseStoredCart', () => {
  it('reads a valid cart', () => {
    expect(parseStoredCart('{"a":2}')).toEqual({ a: 2 });
  });

  it.each([null, '', 'not json', '[1,2]', '{"a":"two"}', '{"a":-1}'])(
    'treats %s as an empty cart',
    (raw) => {
      expect(parseStoredCart(raw)).toEqual({});
    },
  );
});
