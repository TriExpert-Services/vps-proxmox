import { useState, useEffect } from 'react';

export interface SetupStatus {
  isSetupComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSetupCheck(): SetupStatus {
  const [status, setStatus] = useState<SetupStatus>({
    isSetupComplete: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check localStorage first (quick check)
      const localSetupComplete = localStorage.getItem('setup_complete') === 'true';
      
      if (localSetupComplete) {
        // Verify with API
        const response = await fetch('/api/setup/status');
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            isSetupComplete: data.setupComplete,
            isLoading: false,
            error: null
          });
        } else {
          // If API fails but localStorage says complete, assume it's complete
          setStatus({
            isSetupComplete: true,
            isLoading: false,
            error: null
          });
        }
      } else {
        // Check if environment variables are configured
        const hasRequiredEnvVars = checkEnvironmentVariables();
        
        setStatus({
          isSetupComplete: hasRequiredEnvVars,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      setStatus({
        isSetupComplete: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check setup status'
      });
    }
  };

  const checkEnvironmentVariables = (): boolean => {
    // Check if critical environment variables are present
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    return requiredVars.every(varName => {
      const value = import.meta.env[varName];
      return value && value !== '';
    });
  };

  const markSetupComplete = () => {
    localStorage.setItem('setup_complete', 'true');
    setStatus(prev => ({ ...prev, isSetupComplete: true }));
  };

  return {
    ...status,
    markSetupComplete
  } as SetupStatus & { markSetupComplete: () => void };
}