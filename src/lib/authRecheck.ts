/**
 * Module-level recheck mechanism for useAuthState.
 *
 * After a profile save or skip, the auth status needs to re-read the DB
 * to see the updated `onboarding_complete` flag. Supabase's onAuthStateChange
 * only fires on auth events (sign-in / token refresh / sign-out), not on
 * profile table writes. This module lets profile-setup trigger a recheck
 * without creating a second hook instance or a circular dependency.
 *
 * Usage:
 *   registerAuthRecheck(fn)  — called inside useAuthState's useEffect
 *   triggerAuthRecheck()     — called by profile-setup after save/skip
 */

type RecheckFn = () => Promise<void>;
let _recheck: RecheckFn | null = null;

/**
 * Register the current useAuthState resolve function.
 * Returns an unregister callback to call on cleanup.
 */
export function registerAuthRecheck(fn: RecheckFn): () => void {
  _recheck = fn;
  return () => {
    if (_recheck === fn) _recheck = null;
  };
}

/**
 * Trigger a re-resolve of auth status from the DB.
 * Fire-and-forget — the _layout.tsx router guard reacts when status updates.
 */
export function triggerAuthRecheck(): void {
  void _recheck?.();
}
