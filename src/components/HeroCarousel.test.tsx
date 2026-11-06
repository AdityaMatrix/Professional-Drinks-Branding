import { act, fireEvent, render, screen } from '@testing-library/react';
import { drinks } from '../data/drinks';
import { HeroCarousel } from './HeroCarousel';

const activeName = () => document.querySelector('[data-slot="active"] h2')?.textContent;

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves with the next and previous buttons', () => {
    render(<HeroCarousel drinks={drinks} />);
    expect(activeName()).toBe('Pink Blaze');

    fireEvent.click(screen.getByRole('button', { name: 'Next drink' }));
    expect(activeName()).toBe('Frost Rush');

    fireEvent.click(screen.getByRole('button', { name: 'Previous drink' }));
    expect(activeName()).toBe('Pink Blaze');
  });

  it('advances on its own every 5 seconds', () => {
    render(<HeroCarousel drinks={drinks} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeName()).toBe('Frost Rush');
  });

  it('stops advancing when paused and resumes when played', () => {
    render(<HeroCarousel drinks={drinks} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(activeName()).toBe('Pink Blaze');

    fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(activeName()).toBe('Frost Rush');
  });

  it('pauses while the pointer is over it', () => {
    render(<HeroCarousel drinks={drinks} />);
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Our drinks' }));
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(activeName()).toBe('Pink Blaze');
  });

  it('restarts the countdown after a manual move', () => {
    render(<HeroCarousel drinks={drinks} />);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next drink' }));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(activeName()).toBe('Frost Rush');
  });

  // jsdom has no accessibility tree, so this checks the attribute browsers act on.
  it('marks every slide except the active one as inert', () => {
    render(<HeroCarousel drinks={drinks} />);
    const slides = [...document.querySelectorAll('[data-slot]')];

    expect(slides.filter((slide) => !slide.hasAttribute('inert'))).toEqual([
      document.querySelector('[data-slot="active"]'),
    ]);
  });
});
