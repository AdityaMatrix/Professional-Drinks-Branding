import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchIsStaff } from '../api/suppliers';
import { adminKey } from '../hooks/useSuppliers';
import { supabase } from '../lib/supabase';
import { AuthContext, type AuthValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      // Staff data must not stay in memory for whoever uses this browser next.
      if (event === 'SIGNED_OUT') queryClient.removeQueries({ queryKey: adminKey });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;
  const staff = useQuery({
    queryKey: [...adminKey, 'isStaff', userId],
    queryFn: fetchIsStaff,
    enabled: Boolean(userId),
    staleTime: Infinity,
  });
  const { refetch } = staff;

  const value = useMemo<AuthValue>(
    () => ({
      status: session === undefined ? 'loading' : session ? 'signedIn' : 'signedOut',
      email: session?.user.email ?? null,
      isStaff: staff.data ?? null,
      staffCheckFailed: staff.isError,
      retryStaffCheck: () => void refetch(),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, staff.data, staff.isError, refetch],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
