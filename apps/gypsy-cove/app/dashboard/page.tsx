/**
 * GypsyCove Dashboard Router - Enhanced vs Original
 *
 * This router allows switching between the original basic dashboard
 * and the enhanced family-friendly educational platform based on
 * feature flags or environment configuration.
 */

'use client'
import { useState, useEffect } from 'react';
import EnhancedGypsyCoveDashboard from './enhanced-page';

// Import original dashboard (backed up)
const OriginalGypsyCoveDashboard = () => {
  // Use dynamic import for the original dashboard
  const [OriginalComponent, setOriginalComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('./original-page').then(module => {
      setOriginalComponent(() => module.default);
    });
  }, []);

  if (!OriginalComponent) {
    return <div>Loading...</div>;
  }

  return <OriginalComponent />;
};

export default function GypsyCoveDashboard() {
  const [useEnhancedMode, setUseEnhancedMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for enhanced mode via environment or feature flags
    const checkEnhancedMode = async () => {
      try {
        // Check if enhanced mode is enabled
        const enhanced =
          process.env.NODE_ENV === 'development' || // Default to enhanced in development
          localStorage.getItem('gypsy_cove_enhanced') === 'true';

        setUseEnhancedMode(enhanced);
      } catch {
        // Fallback to enhanced mode
        setUseEnhancedMode(true);
      } finally {
        setLoading(false);
      }
    };

    checkEnhancedMode();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-4">
            GC
          </div>
          <p className="text-gray-600">Loading GypsyCove Academy...</p>
        </div>
      </div>
    );
  }

  if (useEnhancedMode) {
    return <EnhancedGypsyCoveDashboard />;
  } else {
    return <OriginalGypsyCoveDashboard />;
  }
}
