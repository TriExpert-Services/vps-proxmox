import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Database, CreditCard, Mail, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import SupabaseService from '../services/SupabaseService';

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
    baseUrl: 'http://localhost:3000'
  }
};

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>(initialSetupData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: 'App Settings', icon: Server, description: 'Configure basic application settings' },
    { id: 2, title: 'Supabase Database', icon: Database, description: 'Connect to Supabase database' },
    { id: 3, title: 'Proxmox VE', icon: Server, description: 'Configure Proxmox virtualization' },
    { id: 4, title: 'Payment Gateway', icon: CreditCard, description: 'Setup Stripe payments' },
    { id: 5, title: 'Email Service', icon: Mail, description: 'Configure email notifications' },
    { id: 6, title: 'Admin Account', icon: Shield, description: 'Create administrator account' },
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
      const supabase = new SupabaseService(setupData.supabase.url, setupData.supabase.anonKey);
      const connected = await supabase.testConnection();
      setTestResults(prev => ({ ...prev, supabase: connected }));
      return connected;
    } catch (error) {
      setTestResults(prev => ({ ...prev, supabase: false }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testProxmoxConnection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/test-proxmox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData.proxmox)
      });
      const connected = response.ok;
      setTestResults(prev => ({ ...prev, proxmox: connected }));
      return connected;
    } catch (error) {
      setTestResults(prev => ({ ...prev, proxmox: false }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Initialize Supabase
      const supabase = new SupabaseService(setupData.supabase.url, setupData.supabase.serviceRoleKey);
      
      // 2. Run database migrations
      await supabase.runMigrations();
      
      // 3. Create admin user
      const { user } = await supabase.createUser({
        email: setupData.admin.email,
        password: setupData.admin.password,
        metadata: {
          name: setupData.admin.name,
          role: 'admin'
        }
      });

      // 4. Save configuration
      await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });

      // 5. Mark setup as complete
      localStorage.setItem('setup_complete', 'true');
      
      // 6. Redirect to login
      navigate('/login');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
                Create a new project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> and get your credentials.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supabase URL</label>
              <input
                type="url"
                value={setupData.supabase.url}
                onChange={(e) => updateSetupData('supabase', { url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-project.supabase.co"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Anonymous Key</label>
              <input
                type="text"
                value={setupData.supabase.anonKey}
                onChange={(e) => updateSetupData('supabase', { anonKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Role Key</label>
              <input
                type="password"
                value={setupData.supabase.serviceRoleKey}
                onChange={(e) => updateSetupData('supabase', { serviceRoleKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>

            <button
              onClick={testSupabaseConnection}
              disabled={!setupData.supabase.url || !setupData.supabase.anonKey || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              <span>Test Connection</span>
            </button>

            {testResults.supabase !== undefined && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                testResults.supabase ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.supabase ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{testResults.supabase ? 'Connection successful!' : 'Connection failed. Please check your credentials.'}</span>
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
                Configure connection to your Proxmox VE cluster for VPS provisioning.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proxmox Host</label>
                <input
                  type="text"
                  value={setupData.proxmox.host}
                  onChange={(e) => updateSetupData('proxmox', { host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="proxmox.example.com"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={setupData.proxmox.username}
                  onChange={(e) => updateSetupData('proxmox', { username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="root"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Realm</label>
                <select
                  value={setupData.proxmox.realm}
                  onChange={(e) => updateSetupData('proxmox', { realm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pam">PAM</option>
                  <option value="pve">Proxmox VE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={setupData.proxmox.password}
                onChange={(e) => updateSetupData('proxmox', { password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Proxmox password"
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
                  HTTP
                </label>
              </div>
            </div>

            <button
              onClick={testProxmoxConnection}
              disabled={!setupData.proxmox.host || !setupData.proxmox.password || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              <span>Test Connection</span>
            </button>

            {testResults.proxmox !== undefined && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                testResults.proxmox ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.proxmox ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{testResults.proxmox ? 'Connection successful!' : 'Connection failed. Please check your credentials.'}</span>
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
                Configure Stripe for processing payments. Get your keys at <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">dashboard.stripe.com</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publishable Key</label>
              <input
                type="text"
                value={setupData.stripe.publishableKey}
                onChange={(e) => updateSetupData('stripe', { publishableKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="pk_test_..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
              <input
                type="password"
                value={setupData.stripe.secretKey}
                onChange={(e) => updateSetupData('stripe', { secretKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk_test_..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
              <input
                type="password"
                value={setupData.stripe.webhookSecret}
                onChange={(e) => updateSetupData('stripe', { webhookSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="whsec_..."
              />
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
                Configure email service for notifications and user communications.
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
                <option value="smtp">SMTP</option>
                <option value="ses">AWS SES</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                <input
                  type="email"
                  value={setupData.email.fromEmail}
                  onChange={(e) => updateSetupData('email', { fromEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@yourdomain.com"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">SendGrid API Key</label>
                <input
                  type="password"
                  value={setupData.email.sendgridApiKey || ''}
                  onChange={(e) => updateSetupData('email', { sendgridApiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SG.your-sendgrid-api-key"
                />
              </div>
            )}

            {setupData.email.provider === 'smtp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={setupData.email.smtpHost || ''}
                      onChange={(e) => updateSetupData('email', { smtpHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={setupData.email.smtpPort || ''}
                      onChange={(e) => updateSetupData('email', { smtpPort: parseInt(e.target.value) || 587 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                    <input
                      type="text"
                      value={setupData.email.smtpUsername || ''}
                      onChange={(e) => updateSetupData('email', { smtpUsername: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={setupData.email.smtpPassword || ''}
                      onChange={(e) => updateSetupData('email', { smtpPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-password"
                    />
                  </div>
                </div>
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
                Create the main administrator account for managing the platform.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Administrator Name</label>
              <input
                type="text"
                value={setupData.admin.name}
                onChange={(e) => updateSetupData('admin', { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Administrator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Administrator Email</label>
              <input
                type="email"
                value={setupData.admin.email}
                onChange={(e) => updateSetupData('admin', { email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@yourdomain.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Administrator Password</label>
              <input
                type="password"
                value={setupData.admin.password}
                onChange={(e) => updateSetupData('admin', { password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a strong password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password should be at least 8 characters with numbers and special characters.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return setupData.app.name && setupData.app.baseUrl;
      case 2:
        return setupData.supabase.url && setupData.supabase.anonKey && setupData.supabase.serviceRoleKey;
      case 3:
        return setupData.proxmox.host && setupData.proxmox.password;
      case 4:
        return setupData.stripe.publishableKey && setupData.stripe.secretKey;
      case 5:
        return setupData.email.fromEmail && setupData.email.fromName;
      case 6:
        return setupData.admin.name && setupData.admin.email && setupData.admin.password;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center py-12">
      <div className="max-w-4xl w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">CloudVPS Pro Setup</h1>
          <p className="text-blue-100">Configure your VPS hosting platform in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-blue-300 text-blue-300'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-blue-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-blue-100 text-sm">{steps[currentStep - 1].description}</span>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep - 1].title}</h2>
          </div>

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
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={completeSetup}
                disabled={!canProceed() || isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                <span>Complete Setup</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}