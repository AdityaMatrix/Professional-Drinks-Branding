import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia. Tests can override this to simulate reduced motion.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;
