export type Direction = 'next' | 'prev';
export type Slot = 'active' | 'other1' | 'other2' | 'hidden';

export type CarouselState = {
  active: number;
  direction: Direction;
  /** Goes up on every move. The CSS uses its parity to restart the slide animations. */
  step: number;
};

export type CarouselAction = { type: 'next' } | { type: 'prev' };

const wrap = (index: number, count: number) => (index + count) % count;

export function createCarouselReducer(count: number) {
  return (state: CarouselState, action: CarouselAction): CarouselState => {
    const delta = action.type === 'next' ? 1 : -1;
    return {
      active: wrap(state.active + delta, count),
      direction: action.type,
      step: state.step + 1,
    };
  };
}

/**
 * Which visual slot a slide sits in. Moving forward, the slide leaving is behind the active
 * one and the next one is ahead of it. Moving backward, both neighbours come from ahead.
 */
export function getSlot(index: number, state: CarouselState, count: number): Slot {
  const { active, direction } = state;
  if (index === active) return 'active';

  const other1 = wrap(active + (direction === 'next' ? -1 : 1), count);
  const other2 = wrap(direction === 'next' ? active + 1 : other1 + 1, count);

  if (index === other1) return 'other1';
  if (index === other2) return 'other2';
  return 'hidden';
}
