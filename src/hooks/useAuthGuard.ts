import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  isStaffForcedLogout,
  isResidentForcedLogout,
  markStaffForcedLogout,
  markResidentForcedLogout,
} from '@/utils/authNavigationGuard';

interface UseAuthGuardOptions {
  type: 'resident' | 'staff';
  /** Called when session is found to be invalid on a protected page */
  onUnauthenticated?: () => void;
  /** If true, this is a login/public page — back/forward with an active session triggers sign-out */
  isLoginPage?: boolean;
  /** Staff-specific: function to call to validate staff session */
  validateStaffSession?: () => Promise<boolean>;
  /** Staff-specific: function to call to log out staff */
  logoutStaff?: () => Promise<void>;
}

/**
 * Shared auth guard hook that:
 * 1. Revalidates session on mount + pageshow (bfcache)
 * 2. Revalidates on popstate (back/forward)
 * 3. On login pages: signs out stale sessions arrived at via back/forward
 */
export const useAuthGuard = ({
  type,
  onUnauthenticated,
  isLoginPage = false,
  validateStaffSession,
  logoutStaff,
}: UseAuthGuardOptions) => {
  const hasRun = useRef(false);

  // Helper: check if resident session exists
  const checkResidentSession = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  };

  // Helper: sign out resident and clear tokens
  const signOutResident = async () => {
    markResidentForcedLogout();
    await supabase.auth.signOut({ scope: 'local' });
    // Clear any lingering Supabase auth tokens
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('-auth-token')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Helper: sign out staff
  const signOutStaff = async () => {
    markStaffForcedLogout();
    localStorage.removeItem('bris_staff_token');
    if (logoutStaff) {
      await logoutStaff();
    }
  };

  // --- Login page guard: sign out stale sessions on back/forward ---
  useEffect(() => {
    if (!isLoginPage) return;

    const isBackForward = (() => {
      try {
        const entries = performance.getEntriesByType?.('navigation');
        if (entries?.[0]) {
          return (entries[0] as PerformanceNavigationTiming).type === 'back_forward';
        }
      } catch {}
      return false;
    })();

    const clearStaleSession = async () => {
      if (type === 'resident') {
        const hasSession = await checkResidentSession();
        if (hasSession) {
          await signOutResident();
        }
      } else if (type === 'staff') {
        const token = localStorage.getItem('bris_staff_token');
        if (token || (validateStaffSession && await validateStaffSession())) {
          await signOutStaff();
        }
      }
    };

    if (isBackForward) {
      clearStaleSession();
    }

    // Also handle popstate while on login page
    const handlePopState = () => {
      clearStaleSession();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoginPage, type]);

  // --- Protected page guard: revalidate on mount + pageshow + visibilitychange ---
  useEffect(() => {
    if (isLoginPage) return;

    const isForcedLogout = type === 'resident' ? isResidentForcedLogout : isStaffForcedLogout;

    const revalidate = async (reason: string) => {
      if (isForcedLogout()) {
        onUnauthenticated?.();
        return;
      }

      if (type === 'resident') {
        const hasSession = await checkResidentSession();
        if (!hasSession) {
          onUnauthenticated?.();
        }
      } else if (type === 'staff') {
        if (validateStaffSession) {
          const valid = await validateStaffSession();
          if (!valid) {
            onUnauthenticated?.();
          }
        }
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        revalidate('pageshow');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidate('visibilitychange');
      }
    };

    const handlePopState = () => {
      revalidate('popstate');
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoginPage, type, onUnauthenticated, validateStaffSession]);
};
