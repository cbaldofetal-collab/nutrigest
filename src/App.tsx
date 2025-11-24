import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import AccessibilityProvider, { SkipToMainContent } from './components/common/AccessibilityProvider';
import ConsentBanner from './components/common/ConsentBanner';
import { useKeyboardNavigation } from './components/common/AccessibilityProvider';
import { useBackupStore } from './stores/backupStore';
import { useAuthStore } from './stores/authStore';

function App() {
  useKeyboardNavigation();
  const { scheduleAutoBackup } = useBackupStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Schedule auto-backup on app start
      scheduleAutoBackup();
      
      // Schedule periodic auto-backup (every 24 hours)
      const interval = setInterval(() => {
        scheduleAutoBackup();
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, scheduleAutoBackup]);

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-gray-50">
        <SkipToMainContent />
        <main id="main-content">
          <AppRoutes />
        </main>
        <ConsentBanner />
      </div>
    </AccessibilityProvider>
  );
}

export default App;
