import { useCallback, useEffect } from 'react';

const DEFAULT_MESSAGE =
  'Du har ulagrede endringer. Er du sikker på at du vil fortsette uten å lagre?';

type UseUnsavedChangesWarningOptions = {
  enabled: boolean;
  message?: string;
};

/**
 * Protects forms with unsaved changes.
 *
 * Browsers show their own localized message for beforeunload events, while
 * in-app actions can use confirmNavigation to display the supplied message.
 */
export function useUnsavedChangesWarning({
  enabled,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesWarningOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  const confirmNavigation = useCallback(() => {
    if (!enabled) return true;
    return window.confirm(message);
  }, [enabled, message]);

  return { confirmNavigation };
}
