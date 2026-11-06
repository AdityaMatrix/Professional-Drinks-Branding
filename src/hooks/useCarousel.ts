import { useEffect, useMemo, useReducer, useState } from 'react';
import { createCarouselReducer, type CarouselState } from './carouselState';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export function useCarousel(count: number, initialIndex = 0, intervalMs = 5000) {
  const reducer = useMemo(() => createCarouselReducer(count), [count]);
  const [state, dispatch] = useReducer(reducer, {
    active: initialIndex,
    direction: 'next',
    step: 0,
  } satisfies CarouselState);

  const reducedMotion = usePrefersReducedMotion();
  const [pausedByUser, setPausedByUser] = useState(reducedMotion);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPlaying = !pausedByUser && !hovered && !focused;

  // step is a dependency so that moving by hand restarts the countdown.
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => dispatch({ type: 'next' }), intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, intervalMs, state.step]);

  return {
    state,
    pausedByUser,
    isPlaying,
    next: () => dispatch({ type: 'next' }),
    prev: () => dispatch({ type: 'prev' }),
    togglePaused: () => setPausedByUser((paused) => !paused),
    setHovered,
    setFocused,
  };
}
