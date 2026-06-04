import { VitrineBootScreen } from '@/components/vitrine-boot-screen';
import { useAuth } from '@/lib/contexts/auth-context';

/**
 * Entry route while auth hydrates. AuthContext owns routing once ready;
 * this screen only provides the void-continuous boot surface (Option A).
 */
export default function Index() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <VitrineBootScreen />;
  }

  return null;
}
