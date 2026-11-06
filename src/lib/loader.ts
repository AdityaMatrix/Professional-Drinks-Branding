export const MIN_LOADER_MS = 2500;
const FADE_MS = 400;

/**
 * Hides the loader from index.html. Timing starts at navigation, not here, so time spent
 * downloading counts towards the minimum and a slow connection doesn't wait twice.
 */
export function hideLoader(elapsedMs = performance.now()) {
  const loader = document.getElementById('loader');
  if (!loader) return;

  setTimeout(
    () => {
      loader.classList.add('loader-done');
      document.getElementById('root')?.removeAttribute('inert');
      document.documentElement.classList.remove('loading');
      setTimeout(() => loader.remove(), FADE_MS);
    },
    Math.max(0, MIN_LOADER_MS - elapsedMs),
  );
}
