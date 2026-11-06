import { createCarouselReducer, getSlot, type CarouselState } from './carouselState';

const COUNT = 4;
const reduce = createCarouselReducer(COUNT);
const start: CarouselState = { active: 1, direction: 'next', step: 0 };
const slots = (state: CarouselState) =>
  Array.from({ length: COUNT }, (_, index) => getSlot(index, state, COUNT));

describe('carousel reducer', () => {
  it('wraps from the last slide to the first', () => {
    expect(reduce({ ...start, active: 3 }, { type: 'next' }).active).toBe(0);
  });

  it('wraps from the first slide to the last', () => {
    expect(reduce({ ...start, active: 0 }, { type: 'prev' }).active).toBe(3);
  });

  it('records the direction and counts each step', () => {
    expect(reduce(start, { type: 'prev' })).toEqual({ active: 0, direction: 'prev', step: 1 });
  });
});

describe('getSlot', () => {
  it('puts the neighbours either side when moving forward', () => {
    expect(slots(start)).toEqual(['other1', 'active', 'other2', 'hidden']);
  });

  it('puts both neighbours ahead when moving backward', () => {
    expect(slots({ ...start, direction: 'prev' })).toEqual([
      'hidden',
      'active',
      'other1',
      'other2',
    ]);
  });

  it('wraps slots around the ends', () => {
    expect(slots({ ...start, active: 0 })).toEqual(['active', 'other2', 'hidden', 'other1']);
  });
});
