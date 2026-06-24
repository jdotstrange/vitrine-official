import { VitrineBootScreen } from '@/components/vitrine-boot-screen';
import { useAuth } from '@/lib/contexts/auth-context';

/**
 * Entry route while auth hydrates. AuthContext owns routing once ready;
 * this screen only provides the void-continuous boot surface (Option A).
 */
export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Keep the boot surface up while auth is hydrating, and also while we have a
  // session but the profile hasn't mounted yet — this avoids both the hang
  // (handled by AuthContext's timeouts/retries) and a profileless flash before
  // routing into the tabs.
  if (isLoading || (isAuthenticated && !user)) {
    return <VitrineBootScreen />;
  }

  return null;
}
