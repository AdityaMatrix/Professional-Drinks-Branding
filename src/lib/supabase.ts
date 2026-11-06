import type { SupabaseClient } from '@supabase/supabase-js';

let client: Promise<SupabaseClient> | undefined;

/** Loaded on first use, so the library isn't part of the download every page waits for. */
export function getSupabase() {
  client ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

    if (!url || !publishableKey) {
      throw new Error(
        'Missing Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.',
      );
    }
    return createClient(url, publishableKey);
  });
  return client;
}
