import type { ContactValues } from '../data/contactSchema';

/** Placeholder until the backend exists: it simulates latency and does not send anything. */
export async function sendContactMessage(_values: ContactValues): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
}
