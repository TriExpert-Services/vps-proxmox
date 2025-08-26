import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Database, CreditCard, Mail, Shield, CheckCircle, AlertCircle, Loader, Key, Globe, Settings } from 'lucide-react';

interface SetupData {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // Proxmox Configuration
  proxmox: {
    host: string;
    port: number;
    username: string;
    password: string;
    realm: string;
    protocol: 'http' | 'https';
  };

  // Stripe Configuration
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };

  // Email Configuration
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    fromEmail: string;
    fromName: string;
    // SMTP
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    // SendGrid
    sendgridApiKey?: string;
    // AWS SES
    awsRegion?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
  };

  // Admin User
  admin: {
    name: string;
    email: string;
    password: string;
  };

  // App Settings
  app: {
    name: string;
    baseUrl: string;
    domain: string;
  };
}

const initialSetupData: SetupData = {
  supabase: {
    url: '',
    anonKey: '',
    serviceRoleKey: ''
  },
  proxmox: {
    host: '',
    port: 8006,
    username: 'root',
    password: '',
    realm: 'pam',
    protocol: 'https'
  },
  stripe: {
    publishableKey: '',
    secretKey: '',
    webhookSecret: ''
  },
  email: {
    provider: 'sendgrid',
    fromEmail: '',
    fromName: 'CloudVPS Pro'
  },
  admin: {
    name: '',
    email: '',
    password: ''
  },
  app: {
    name: 'CloudVPS Pro',
    baseUrl: 'http://localhost:3000',
    domain: 'localhost'
  }
};

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>(initialSetupData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [setupProgress, setSetupProgress] = useState<string>('');
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: 'App Settings', icon: Settings, description: 'Configure basic application settings' },
    { id: 2, title: 'Supabase Database', icon: Database, description: 'Connect to Supabase database' },
    { id: 3, title: 'Proxmox VE', icon: Server, description: 'Configure Proxmox virtualization' },
    { id: 4, title: 'Payment Gateway', icon: CreditCard, description: 'Setup Stripe payments' },
    { id: 5, title: 'Email Service', icon: Mail, description: 'Configure email notifications' },
    { id: 6, title: 'Admin Account', icon: Shield, description: 'Create administrator account' },
    { id: 7, title: 'Finalize Setup', icon: CheckCircle, description: 'Complete setup and initialize' },
  ];

  const updateSetupData = (section: keyof SetupData, data: any) => {
    setSetupData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const testSupabaseConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/setup/test-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData.supabase)
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, supabase: result.success }));
      
      if (!result.success) {
        setError(result.error || 'Failed to connect to Supabase');
      }
      
      return result.success;
    } catch (error) {
      setTestResults(prev => ({ ...prev, supabase: false }));
      setError('Network error testing Supabase connection');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testProxmoxConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/setup/test-proxmox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData.proxmox)
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, proxmox: result.success }));
      
      if (!result.success) {
        setError(result.error || 'Failed to connect to Proxmox');
      }
      
      return result.success;
    } catch (error) {
      setTestResults(prev => ({ ...prev, proxmox: false }));
      setError('Network error testing Proxmox connection');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/setup/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setupData.email,
          testEmail: setupData.admin.email
        })
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, email: result.success }));
      
      if (!result.success) {
        setError(result.error || 'Failed to send test email');
      }
      
      return result.success;
    } catch (error) {
      setTestResults(prev => ({ ...prev, email: false }));
      setError('Network error testing email configuration');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSetupProgress('Initializing setup...');

      // Step 1: Save configuration
      setSetupProgress('Saving configuration...');
      const configResponse = await fetch('/api/setup/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });

      if (!configResponse.ok) {
        throw new Error('Failed to save configuration');
      }

      // Step 2: Initialize Supabase
      setSetupProgress('Initializing Supabase...');
      const supabaseResponse = await fetch('/api/setup/init-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData.supabase)
      });

      if (!supabaseResponse.ok) {
        const error = await supabaseResponse.json();
        throw new Error(error.message || 'Failed to initialize Supabase');
      }

      // Step 3: Run migrations
      setSetupProgress('Running database migrations...');
      const migrationsResponse = await fetch('/api/setup/run-migrations', {
        method: 'POST'
      });

      if (!migrationsResponse.ok) {
        throw new Error('Failed to run database migrations');
      }

      // Step 4: Create admin user
      setSetupProgress('Creating admin user...');
      const adminResponse = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData.admin)
      });

      if (!adminResponse.ok) {
        const error = await adminResponse.json();
        throw new Error(error.message || 'Failed to create admin user');
      }

      // Step 5: Seed default data
      setSetupProgress('Setting up default data...');
      const seedResponse = await fetch('/api/setup/seed-data', {
        method: 'POST'
      });

      if (!seedResponse.ok) {
        throw new Error('Failed to seed default data');
      }

      // Step 6: Mark setup as complete
      setSetupProgress('Finalizing setup...');
      const completeResponse = await fetch('/api/setup/complete', {
        method: 'POST'
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete setup');
      }

      // Success!
      setSetupProgress('Setup completed successfully!');
      localStorage.setItem('cloudvps_setup_complete', 'true');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Setup error:', error);
      setError(error instanceof Error ? error.message : 'Setup failed');
      setSetupProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Application Configuration</h3>
              </div>
              <p className="text-sm text-blue-700">
                Configure basic application settings and domain information.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
              <input
                type="text"
                value={setupData.app.name}
                onChange={(e) => updateSetupData('app', { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CloudVPS Pro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
              <input
                type="text"
                value={setupData.app.domain}
                onChange={(e) => updateSetupData('app', { 
                  domain: e.target.value,
                  baseUrl: e.target.value.startsWith('http') ? e.target.value : `https://${e.target.value}`
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-domain.com"
              />
              <p className="text-xs text-gray-500 mt-1">Enter your domain without http/https</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
              <input
                type="url"
                value={setupData.app.baseUrl}
                onChange={(e) => updateSetupData('app', { baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-domain.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Supabase Configuration</h3>
              </div>
              <p className="text-sm text-blue-700">
                Create a new project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">supabase.com</a> and get your credentials from Settings → API.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Project URL
                <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={setupData.supabase.url}
                onChange={(e) => updateSetupData('supabase', { url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-project-ref.supabase.co"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Found in your Supabase dashboard under Settings → API</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anonymous Key (Public)
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={setupData.supabase.anonKey}
                onChange={(e) => updateSetupData('supabase', { anonKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">This is safe to use in frontend code</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Role Key (Secret)
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={setupData.supabase.serviceRoleKey}
                onChange={(e) => updateSetupData('supabase', { serviceRoleKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
              />
              <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret! Used for admin operations</p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testSupabaseConnection}
                disabled={!setupData.supabase.url || !setupData.supabase.anonKey || isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                <span>Test Connection</span>
              </button>

              <a
                href="https://supabase.com/dashboard/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>Create Supabase Project</span>
              </a>
            </div>

            {testResults.supabase !== undefined && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                testResults.supabase ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.supabase ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{testResults.supabase ? 'Connection successful! Database is ready.' : 'Connection failed. Please check your credentials.'}</span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Server className="h-5 w-5 text-orange-600" />
                <h3 className="font-medium text-orange-900">Proxmox VE Configuration</h3>
              </div>
              <p className="text-sm text-orange-700">
                Configure connection to your Proxmox VE cluster for automatic VPS provisioning. Make sure the API user has appropriate permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proxmox Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={setupData.proxmox.host}
                  onChange={(e) => updateSetupData('proxmox', { host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="proxmox.example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                  type="number"
                  value={setupData.proxmox.port}
                  onChange={(e) => updateSetupData('proxmox', { port: parseInt(e.target.value) || 8006 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8006"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={setupData.proxmox.username}
                  onChange={(e) => updateSetupData('proxmox', { username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="root"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Realm</label>
                <select
                  value={setupData.proxmox.realm}
                  onChange={(e) => updateSetupData('proxmox', { realm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pam">PAM (Linux users)</option>
                  <option value="pve">Proxmox VE authentication</option>
                  <option value="ad">Active Directory</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={setupData.proxmox.password}
                onChange={(e) => updateSetupData('proxmox', { password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Proxmox password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Protocol</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="https"
                    checked={setupData.proxmox.protocol === 'https'}
                    onChange={(e) => updateSetupData('proxmox', { protocol: e.target.value as 'https' })}
                    className="mr-2"
                  />
                  HTTPS (Recommended)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="http"
                    checked={setupData.proxmox.protocol === 'http'}
                    onChange={(e) => updateSetupData('proxmox', { protocol: e.target.value as 'http' })}
                    className="mr-2"
                  />
                  HTTP (Insecure)
                </label>
              </div>
            </div>

            <button
              onClick={testProxmoxConnection}
              disabled={!setupData.proxmox.host || !setupData.proxmox.password || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              <span>Test Connection</span>
            </button>

            {testResults.proxmox !== undefined && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                testResults.proxmox ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.proxmox ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>
                  {testResults.proxmox 
                    ? 'Connection successful! Proxmox API is accessible.' 
                    : 'Connection failed. Please verify your credentials and network access.'
                  }
                </span>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium text-purple-900">Stripe Payment Gateway</h3>
              </div>
              <p className="text-sm text-purple-700">
                Configure Stripe for processing payments. Get your keys from the 
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline font-medium ml-1">Stripe Dashboard</a>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publishable Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={setupData.stripe.publishableKey}
                onChange={(e) => updateSetupData('stripe', { publishableKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="pk_test_... or pk_live_..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">This key is safe to expose in frontend</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={setupData.stripe.secretKey}
                onChange={(e) => updateSetupData('stripe', { secretKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="sk_test_... or sk_live_..."
                required
              />
              <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret! Never expose in frontend</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
              <input
                type="password"
                value={setupData.stripe.webhookSecret}
                onChange={(e) => updateSetupData('stripe', { webhookSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="whsec_..."
              />
              <p className="text-xs text-gray-500 mt-1">Optional: For webhook signature verification</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚡ Quick Setup Tips:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use test keys for development (pk_test_... / sk_test_...)</li>
                <li>• Switch to live keys for production deployment</li>
                <li>• Configure webhooks after deployment for automated billing</li>
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-900">Email Service Configuration</h3>
              </div>
              <p className="text-sm text-green-700">
                Configure email service for user notifications, VPS credentials, and support communications.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
              <select
                value={setupData.email.provider}
                onChange={(e) => updateSetupData('email', { provider: e.target.value as 'smtp' | 'sendgrid' | 'ses' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sendgrid">SendGrid (Recommended)</option>
                <option value="smtp">SMTP Server</option>
                <option value="ses">AWS SES</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={setupData.email.fromEmail}
                  onChange={(e) => updateSetupData('email', { fromEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@yourdomain.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                <input
                  type="text"
                  value={setupData.email.fromName}
                  onChange={(e) => updateSetupData('email', { fromName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CloudVPS Pro"
                />
              </div>
            </div>

            {setupData.email.provider === 'sendgrid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SendGrid API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={setupData.email.sendgridApiKey || ''}
                  onChange={(e) => updateSetupData('email', { sendgridApiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="SG.your-sendgrid-api-key"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" className="underline">SendGrid Settings</a>
                </p>
              </div>
            )}

            {setupData.email.provider === 'smtp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.email.smtpHost || ''}
                      onChange={(e) => updateSetupData('email', { smtpHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                    <input
                      type="number"
                      value={setupData.email.smtpPort || ''}
                      onChange={(e) => updateSetupData('email', { smtpPort: parseInt(e.target.value) || 587 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={setupData.email.smtpUsername || ''}
                      onChange={(e) => updateSetupData('email', { smtpUsername: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-email@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={setupData.email.smtpPassword || ''}
                      onChange={(e) => updateSetupData('email', { smtpPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-app-password"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={testEmailConfiguration}
              disabled={!setupData.email.fromEmail || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              <span>Send Test Email</span>
            </button>

            {testResults.email !== undefined && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                testResults.email ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.email ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>
                  {testResults.email 
                    ? `Test email sent successfully to ${setupData.admin.email}!` 
                    : 'Failed to send test email. Please check your configuration.'
                  }
                </span>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-900">Administrator Account</h3>
              </div>
              <p className="text-sm text-red-700">
                Create the main administrator account. This account will have full access to manage the platform.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Administrator Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={setupData.admin.name}
                onChange={(e) => updateSetupData('admin', { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Administrator"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Administrator Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={setupData.admin.email}
                onChange={(e) => updateSetupData('admin', { email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@yourdomain.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Administrator Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={setupData.admin.password}
                onChange={(e) => updateSetupData('admin', { password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a strong password (min 8 chars)"
                required
                minLength={8}
              />
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Password strength:</div>
                <div className="flex space-x-1">
                  {[1,2,3,4].map(i => (
                    <div 
                      key={i} 
                      className={`h-1 flex-1 rounded ${
                        setupData.admin.password.length >= i * 2 ? 'bg-green-500' : 'bg-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Include uppercase, lowercase, numbers and special characters
                </p>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-xl font-medium text-gray-900">Setup Complete!</h3>
                  <p className="text-gray-600">Ready to initialize your CloudVPS Pro platform</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Summary:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Name:</span>
                  <span className="font-medium">{setupData.app.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domain:</span>
                  <span className="font-medium">{setupData.app.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supabase Project:</span>
                  <span className="font-medium text-green-600">✓ Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proxmox Host:</span>
                  <span className="font-medium">{setupData.proxmox.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Gateway:</span>
                  <span className="font-medium">Stripe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Provider:</span>
                  <span className="font-medium capitalize">{setupData.email.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admin Email:</span>
                  <span className="font-medium">{setupData.admin.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🚀 What happens next:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Generate and save environment configuration</li>
                <li>Initialize Supabase database with required tables</li>
                <li>Run database migrations for VPS, users, and billing</li>
                <li>Create your administrator account</li>
                <li>Set up default VPS plans and pricing</li>
                <li>Configure webhook endpoints for automation</li>
                <li>Initialize system monitoring and logging</li>
              </ol>
            </div>

            {setupProgress && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-gray-900 font-medium">{setupProgress}</span>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {!isLoading && !setupProgress && (
              <button
                onClick={completeSetup}
                disabled={!canProceed() || isLoading}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg font-semibold"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Initialize CloudVPS Pro Platform</span>
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return setupData.app.name && setupData.app.baseUrl && setupData.app.domain;
      case 2:
        return setupData.supabase.url && setupData.supabase.anonKey && setupData.supabase.serviceRoleKey;
      case 3:
        return setupData.proxmox.host && setupData.proxmox.password && setupData.proxmox.username;
      case 4:
        return setupData.stripe.publishableKey && setupData.stripe.secretKey;
      case 5:
        return setupData.email.fromEmail && (
          setupData.email.provider === 'sendgrid' ? setupData.email.sendgridApiKey :
          setupData.email.provider === 'smtp' ? setupData.email.smtpHost && setupData.email.smtpUsername && setupData.email.smtpPassword :
          true
        );
      case 6:
        return setupData.admin.name && setupData.admin.email && setupData.admin.password && setupData.admin.password.length >= 8;
      case 7:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Server className="h-16 w-16 text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">CloudVPS Pro Setup</h1>
          <p className="text-blue-100 text-lg">Configure your professional VPS hosting platform</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                    : currentStep === step.id
                    ? 'bg-white border-blue-400 text-blue-600 shadow-md'
                    : 'border-blue-300 text-blue-300 bg-blue-800'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                  {currentStep === step.id && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 lg:w-16 h-0.5 mx-2 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-blue-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-blue-100 text-sm font-medium">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
            </span>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center space-x-3">
              <steps[currentStep - 1].icon className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white">{steps[currentStep - 1].title}</h2>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setCurrentStep(Math.max(1, currentStep - 1));
                  setError(null);
                }}
                disabled={currentStep === 1 || isLoading}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>← Previous</span>
              </button>

              <div className="text-sm text-gray-500">
                {currentStep} of {steps.length}
              </div>

              {currentStep < steps.length ? (
                <button
                  onClick={() => {
                    setCurrentStep(currentStep + 1);
                    setError(null);
                    setTestResults({});
                  }}
                  disabled={!canProceed() || isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next →</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm">
            Need help? Check our <a href="/docs" className="underline">documentation</a> or contact support
          </p>
        </div>
      </div>
    </div>
  );
}