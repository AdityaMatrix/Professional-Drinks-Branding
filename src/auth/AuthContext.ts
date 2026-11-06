import { createContext, useContext } from 'react';

export type AuthValue = {
  /** 'loading' until the stored session has been checked, so a refresh doesn't bounce to login. */
  status: 'loading' | 'signedOut' | 'signedIn';
  email: string | null;
  /** null while the check is running. */
  isStaff: boolean | null;
  staffCheckFailed: boolean;
  retryStaffCheck: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
