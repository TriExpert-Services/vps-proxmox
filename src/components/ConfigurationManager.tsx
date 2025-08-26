import React, { useState, useEffect } from 'react';
import { Settings, Database, Server, CreditCard, Mail, Shield, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemConfiguration {
  app: {
    name: string;
    baseUrl: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  proxmox: {
    host: string;
    port: number;
    status: 'connected' | 'disconnected' | 'error';
    nodes: number;
    lastCheck: string;
  };
  stripe: {
    connected: boolean;
    mode: 'test' | 'live';
    lastCheck: string;
  };
  email: {
    provider: string;
    configured: boolean;
    lastTest: string;
  };
  features: {
    autoProvisioning: boolean;
    backupScheduling: boolean;
    usageBilling: boolean;
    multipleOS: boolean;
    apiAccess: boolean;
  };
}

const mockConfig: SystemConfiguration = {
  app: {
    name: 'CloudVPS Pro',
    baseUrl: 'https://cloudvps.example.com',
    maintenanceMode: false,
    registrationEnabled: true
  },
  proxmox: {
    host: 'proxmox.example.com',
    port: 8006,
    status: 'connected',
    nodes: 3,
    lastCheck: '2025-01-15 14:30:00'
  },
  stripe: {
    connected: true,
    mode: 'test',
    lastCheck: '2025-01-15 14:25:00'
  },
  email: {
    provider: 'SendGrid',
    configured: true,
    lastTest: '2025-01-15 14:20:00'
  },
  features: {
    autoProvisioning: true,
    backupScheduling: true,
    usageBilling: false,
    multipleOS: true,
    apiAccess: true
  }
};

export default function ConfigurationManager() {
  const [config, setConfig] = useState<SystemConfiguration>(mockConfig);
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'features' | 'security'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Simulate API call to save configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (service: string) => {
    // Implement connection testing
    console.log(`Testing ${service} connection...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const StatusIndicator = ({ status, label }: { status: string; label: string }) => (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        status === 'connected' ? 'bg-green-500' :
        status === 'disconnected' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {label}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600 mt-2">Manage platform settings and integrations</p>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          saveStatus === 'success' ? 'bg-green-50 text-green-700' :
          saveStatus === 'error' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : saveStatus === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <RefreshCw className="h-5 w-5 animate-spin" />
          )}
          <span>
            {saveStatus === 'success' && 'Configuration saved successfully!'}
            {saveStatus === 'error' && 'Failed to save configuration. Please try again.'}
            {saveStatus === 'saving' && 'Saving configuration...'}
          </span>
        </div>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <Database className="h-8 w-8 text-blue-600" />
            <StatusIndicator status="connected" label="Connected" />
          </div>
          <h3 className="font-semibold text-gray-900">Database</h3>
          <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <Server className="h-8 w-8 text-orange-600" />
            <StatusIndicator status={config.proxmox.status} label={config.proxmox.status} />
          </div>
          <h3 className="font-semibold text-gray-900">Proxmox VE</h3>
          <p className="text-sm text-gray-600">{config.proxmox.nodes} nodes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <StatusIndicator status={config.stripe.connected ? 'connected' : 'disconnected'} label={config.stripe.connected ? 'Active' : 'Inactive'} />
          </div>
          <h3 className="font-semibold text-gray-900">Stripe</h3>
          <p className="text-sm text-gray-600">{config.stripe.mode} mode</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <Mail className="h-8 w-8 text-green-600" />
            <StatusIndicator status={config.email.configured ? 'connected' : 'disconnected'} label={config.email.configured ? 'Active' : 'Inactive'} />
          </div>
          <h3 className="font-semibold text-gray-900">Email</h3>
          <p className="text-sm text-gray-600">{config.email.provider}</p>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'general', label: 'General', icon: Settings },
              { key: 'integrations', label: 'Integrations', icon: Database },
              { key: 'features', label: 'Features', icon: Server },
              { key: 'security', label: 'Security', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
                    <input
                      type="text"
                      value={config.app.name}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        app: { ...prev.app, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                    <input
                      type="url"
                      value={config.app.baseUrl}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        app: { ...prev.app, baseUrl: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Controls</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                      <p className="text-sm text-gray-600">Temporarily disable the platform for maintenance</p>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        app: { ...prev.app, maintenanceMode: !prev.app.maintenanceMode }
                      }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        config.app.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.app.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">User Registration</h4>
                      <p className="text-sm text-gray-600">Allow new users to create accounts</p>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        app: { ...prev.app, registrationEnabled: !prev.app.registrationEnabled }
                      }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        config.app.registrationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.app.registrationEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-8">
              {/* Proxmox Configuration */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Server className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Proxmox VE</h3>
                  </div>
                  <button
                    onClick={() => testConnection('proxmox')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Test Connection
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                    <p className="text-sm text-gray-900">{config.proxmox.host}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <p className="text-sm text-gray-900">{config.proxmox.port}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <StatusIndicator status={config.proxmox.status} label={config.proxmox.status} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nodes</label>
                    <p className="text-sm text-gray-900">{config.proxmox.nodes} active nodes</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">Last checked: {config.proxmox.lastCheck}</p>
              </div>

              {/* Stripe Configuration */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Stripe Payment Gateway</h3>
                  </div>
                  <button
                    onClick={() => testConnection('stripe')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Test Keys
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <StatusIndicator 
                      status={config.stripe.connected ? 'connected' : 'disconnected'} 
                      label={config.stripe.connected ? 'Connected' : 'Not Connected'} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      config.stripe.mode === 'live' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                    }`}>
                      {config.stripe.mode === 'live' ? 'Live' : 'Test'} Mode
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">Last verified: {config.stripe.lastCheck}</p>
              </div>

              {/* Email Configuration */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Email Service</h3>
                  </div>
                  <button
                    onClick={() => testConnection('email')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Send Test Email
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <p className="text-sm text-gray-900">{config.email.provider}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <StatusIndicator 
                      status={config.email.configured ? 'connected' : 'disconnected'} 
                      label={config.email.configured ? 'Configured' : 'Not Configured'} 
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">Last test: {config.email.lastTest}</p>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Features</h3>
              
              <div className="space-y-4">
                {Object.entries(config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {key === 'autoProvisioning' && 'Automatically provision VPS after successful payment'}
                        {key === 'backupScheduling' && 'Enable scheduled backups for VPS instances'}
                        {key === 'usageBilling' && 'Bill customers based on actual resource usage'}
                        {key === 'multipleOS' && 'Allow customers to choose from multiple OS templates'}
                        {key === 'apiAccess' && 'Enable REST API access for customers'}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        features: { ...prev.features, [key]: !value }
                      }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        value ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}