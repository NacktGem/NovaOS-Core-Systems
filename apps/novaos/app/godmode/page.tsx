/**
 * GodMode Dashboard Router - Enhanced vs Original
 *
 * This router allows switching between the original GodMode dashboard
 * and the enhanced version with LLM integration based on feature flags
 * or environment configuration.
 */

import { coreApiJson } from '@/lib/core-api';
import EnhancedGodModeDashboard from './enhanced-page';

// Import original dashboard (backed up)
const OriginalGodModeDashboard = async () => {
  const { default: OriginalDashboard } = await import('./original-page');
  return <OriginalDashboard />;
};

type FlagsResponse = {
  flags: Record<string, {
    value: boolean;
    updated_at: string | null;
    updated_by: string | null;
  }>;
};

async function loadFlags(): Promise<FlagsResponse> {
  try {
    return await coreApiJson<FlagsResponse>('/platform/flags');
  } catch {
    return { flags: {} };
  }
}

async function checkProfile() {
  try {
    const profile = await coreApiJson<{ role: string }>('/me');
    return profile.role?.toLowerCase() === 'godmode';
  } catch {
    return false;
  }
}

export default async function GodModeDashboard() {
  try {
    const isAuthorized = await checkProfile();
    if (!isAuthorized) {
      return (
        <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-2xl font-semibold">Founder only</h1>
            <p className="mt-2 text-sm text-status-danger-light">This dashboard is restricted to GodMode operators.</p>
          </div>
        </div>
      );
    }

    const flags = await loadFlags();

    // Check for enhanced mode via flag or environment variable
    const useEnhancedMode =
      flags.flags?.enhanced_godmode?.value ||
      process.env.ENHANCED_GODMODE === 'true' ||
      process.env.NODE_ENV === 'development'; // Default to enhanced in development

    if (useEnhancedMode) {
      return <EnhancedGodModeDashboard />;
    } else {
      return <OriginalGodModeDashboard />;
    }

  } catch {
    // Fallback to enhanced version for better error handling
    return <EnhancedGodModeDashboard />;
  }
}
