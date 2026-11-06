import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

type Options = { typeMs?: number; deleteMs?: number; holdMs?: number };

/** Types and deletes each phrase in a loop. Pass a stable array, or the loop restarts. */
export function useTypewriter(
  phrases: readonly string[],
  { typeMs = 50, deleteMs = 50, holdMs = 1500 }: Options = {},
) {
  const reducedMotion = usePrefersReducedMotion();
  const [text, setText] = useState('');

  useEffect(() => {
    if (reducedMotion) return;

    let phraseIndex = 0;
    let length = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = phrases[phraseIndex] ?? '';
      length += deleting ? -1 : 1;
      setText(phrase.slice(0, length));

      let delay = deleting ? deleteMs : typeMs;
      if (!deleting && length === phrase.length) {
        deleting = true;
        delay = holdMs;
      } else if (deleting && length === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, typeMs);
    return () => clearTimeout(timer);
  }, [phrases, typeMs, deleteMs, holdMs, reducedMotion]);

  return reducedMotion ? (phrases[0] ?? '') : text;
}
