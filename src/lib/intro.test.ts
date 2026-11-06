import { INTRO_KEY, INTRO_STALL_MS, runIntro } from './intro';

const intro = () => document.getElementById('intro');
const root = () => document.getElementById('root');
const html = document.documentElement;

function setUp(play: () => Promise<void> = async () => {}) {
  html.classList.add('intro');
  const introElement = document.createElement('div');
  introElement.id = 'intro';
  const rootElement = document.createElement('div');
  rootElement.id = 'root';
  rootElement.setAttribute('inert', '');
  const video = document.createElement('video');
  video.play = vi.fn(play);
  video.pause = vi.fn();
  introElement.append(video);
  document.body.append(introElement, rootElement);
  return video;
}

describe('runIntro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    html.classList.remove('intro');
    document.body.replaceChildren();
  });

  it('does nothing on a load where the intro is not playing', () => {
    expect(() => runIntro()).not.toThrow();
    expect(sessionStorage.getItem(INTRO_KEY)).toBeNull();
  });

  it('remembers straight away, so a refresh during the video skips it', () => {
    setUp();
    runIntro();
    expect(sessionStorage.getItem(INTRO_KEY)).toBe('1');
  });

  it('keeps the site hidden while the video plays', () => {
    const video = setUp();
    runIntro();
    video.dispatchEvent(new Event('playing'));

    vi.advanceTimersByTime(60_000);

    expect(root()).toHaveAttribute('inert');
    expect(intro()).toBeInTheDocument();
  });

  it('reveals the site when the video ends', () => {
    const video = setUp();
    runIntro();
    video.dispatchEvent(new Event('playing'));

    video.dispatchEvent(new Event('ended'));

    expect(root()).not.toHaveAttribute('inert');
    expect(intro()).toHaveClass('intro-done');

    vi.advanceTimersByTime(600);
    expect(intro()).not.toBeInTheDocument();
    expect(html).not.toHaveClass('intro');
  });

  it('can be skipped', () => {
    setUp();
    runIntro();

    intro()?.querySelector('button')?.click();

    expect(intro()).toHaveClass('intro-done');
  });

  it('opens the site if the video fails to load', () => {
    const video = setUp();
    runIntro();

    video.dispatchEvent(new Event('error'));

    expect(intro()).toHaveClass('intro-done');
  });

  it('opens the site if the browser blocks autoplay', async () => {
    setUp(() => Promise.reject(new Error('NotAllowedError')));
    runIntro();

    await vi.advanceTimersByTimeAsync(0);

    expect(intro()).toHaveClass('intro-done');
  });

  it('opens the site if the video never starts', () => {
    setUp();
    runIntro();

    vi.advanceTimersByTime(INTRO_STALL_MS);

    expect(intro()).toHaveClass('intro-done');
  });

  it('opens the site if the video stalls part way through', () => {
    const video = setUp();
    runIntro();
    video.dispatchEvent(new Event('playing'));

    video.dispatchEvent(new Event('waiting'));
    vi.advanceTimersByTime(INTRO_STALL_MS);

    expect(intro()).toHaveClass('intro-done');
  });

  it('keeps waiting if a stall recovers', () => {
    const video = setUp();
    runIntro();
    video.dispatchEvent(new Event('playing'));

    video.dispatchEvent(new Event('waiting'));
    vi.advanceTimersByTime(INTRO_STALL_MS - 1);
    video.dispatchEvent(new Event('playing'));
    vi.advanceTimersByTime(60_000);

    expect(intro()).not.toHaveClass('intro-done');
  });
});
