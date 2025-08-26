import { useState, useEffect } from 'react';

export interface SetupStatus {
  isSetupComplete: boolean;
  isLoading: boolean;
  error: string | null;
  configExists: boolean;
  supabaseConnected: boolean;
}

export function useSetupCheck(): SetupStatus & { 
  markSetupComplete: () => void;
  checkSetup: () => void; 
} {
  const [status, setStatus] = useState<SetupStatus>({
    isSetupComplete: false,
    isLoading: true,
    error: null,
    configExists: false,
    supabaseConnected: false
  });

  const checkSetup = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if setup is already complete (local storage first)
      const localSetupComplete = localStorage.getItem('cloudvps_setup_complete') === 'true';
      
      if (localSetupComplete) {
        // Verify with backend
        const response = await fetch('/api/setup/status');
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            isSetupComplete: data.isComplete,
            isLoading: false,
            error: null,
            configExists: data.configExists,
            supabaseConnected: data.supabaseConnected
          });
        } else {
          // If API is not ready, assume setup is needed
          setStatus({
            isSetupComplete: false,
            isLoading: false,
            error: null,
            configExists: false,
            supabaseConnected: false
          });
        }
      } else {
        // Check environment variables for basic configuration
        const hasBasicConfig = checkEnvironmentVariables();
        
        setStatus({
          isSetupComplete: hasBasicConfig,
          isLoading: false,
          error: null,
          configExists: hasBasicConfig,
          supabaseConnected: false
        });
      }
    } catch (error) {
      console.error('Setup check error:', error);
      setStatus({
        isSetupComplete: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check setup status',
        configExists: false,
        supabaseConnected: false
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
      return value && value !== '' && value !== 'your-supabase-url-here';
    });
  };

  const markSetupComplete = () => {
    localStorage.setItem('cloudvps_setup_complete', 'true');
    setStatus(prev => ({ ...prev, isSetupComplete: true }));
  };

  useEffect(() => {
    checkSetup();
  }, []);

  return {
    ...status,
    markSetupComplete,
    checkSetup
  };
}