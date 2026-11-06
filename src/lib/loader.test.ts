import { hideLoader, MIN_LOADER_MS } from './loader';

const loader = () => document.getElementById('loader');
const root = () => document.getElementById('root');

describe('hideLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.classList.add('loading');
    document.body.innerHTML = '<div id="loader"></div><div id="root" inert></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove('loading');
    document.body.innerHTML = '';
  });

  it('keeps the loader up for the minimum time', () => {
    hideLoader(0);

    vi.advanceTimersByTime(MIN_LOADER_MS - 1);
    expect(loader()).not.toHaveClass('loader-done');
    expect(root()).toHaveAttribute('inert');

    vi.advanceTimersByTime(1);
    expect(loader()).toHaveClass('loader-done');
  });

  it('counts time already spent loading', () => {
    hideLoader(2000);

    vi.advanceTimersByTime(500);
    expect(loader()).toHaveClass('loader-done');
  });

  it('adds no extra wait when loading took longer than the minimum', () => {
    hideLoader(MIN_LOADER_MS + 3000);

    vi.advanceTimersByTime(0);
    expect(loader()).toHaveClass('loader-done');
  });

  it('gives the page back and removes the loader after fading', () => {
    hideLoader(MIN_LOADER_MS);
    vi.advanceTimersByTime(0);

    expect(root()).not.toHaveAttribute('inert');
    expect(document.documentElement).not.toHaveClass('loading');

    vi.advanceTimersByTime(400);
    expect(loader()).not.toBeInTheDocument();
  });

  it('does nothing if the loader is already gone', () => {
    loader()?.remove();
    expect(() => hideLoader(0)).not.toThrow();
  });
});
