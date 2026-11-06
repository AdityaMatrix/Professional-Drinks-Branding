/** Sends a copy of the can from where it was added up to the cart link, which then bumps. */
export function flyToCart(source: HTMLImageElement | null) {
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  if (!source || !target || typeof source.animate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const x = to.left + to.width / 2 - (from.left + from.width / 2);
  const y = to.top + to.height / 2 - (from.top + from.height / 2);

  const can = source.cloneNode() as HTMLImageElement;
  // Dropping the style also drops the view transition name, which must stay unique on the page.
  can.removeAttribute('style');
  can.removeAttribute('class');
  can.alt = '';
  Object.assign(can.style, {
    position: 'fixed',
    top: `${from.top}px`,
    left: `${from.left}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: 'contain',
    pointerEvents: 'none',
    zIndex: '60',
  });
  document.body.append(can);

  const flight = can.animate(
    [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${x * 0.6}px, ${y * 0.8}px) scale(0.55)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${x}px, ${y}px) scale(0.08)`, opacity: 0.4 },
    ],
    { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
  );

  flight.finished
    .then(() => {
      target.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
        { duration: 260, easing: 'ease-out' },
      );
    })
    .catch(() => {
      // Cancelled because the page changed mid-flight. Nothing to bump.
    })
    .finally(() => can.remove());
}
