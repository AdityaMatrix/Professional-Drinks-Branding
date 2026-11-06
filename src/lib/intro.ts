export const INTRO_KEY = 'valo-intro-seen';

/** How long to wait for a video that won't start or has stalled, before opening the site. */
export const INTRO_STALL_MS = 4000;

const FADE_MS = 600;

/**
 * Takes over the video that index.html started, and reveals the site when it ends. Every failure
 * leads to the same place, because a broken intro must never block the site.
 */
export function runIntro() {
  const html = document.documentElement;
  const intro = document.getElementById('intro');
  const video = intro?.querySelector('video');
  if (!intro || !video || !html.classList.contains('intro')) return;

  intro.dataset.running = 'true';
  try {
    // Saved now, not at the end, so refreshing during the video doesn't start it again.
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    // Storage is blocked. The intro just plays again on the next load.
  }

  let finished = false;
  let stallTimer: ReturnType<typeof setTimeout>;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(stallTimer);
    document.getElementById('root')?.removeAttribute('inert');
    intro.classList.add('intro-done');
    setTimeout(() => {
      video.pause();
      intro.remove();
      html.classList.remove('intro');
    }, FADE_MS);
  };

  const watchForStall = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(finish, INTRO_STALL_MS);
  };

  video.addEventListener('playing', () => clearTimeout(stallTimer));
  video.addEventListener('waiting', watchForStall);
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);

  const skip = document.createElement('button');
  skip.type = 'button';
  skip.textContent = 'Skip intro';
  skip.addEventListener('click', finish);
  intro.append(skip);

  // The video had a head start in index.html, so it may already have ended or failed.
  if (video.error || video.ended) {
    finish();
    return;
  }
  if (video.paused || video.readyState < 3) watchForStall();
  video.play()?.catch(finish);
}
