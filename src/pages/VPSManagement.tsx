import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Server, 
  Activity, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Network, 
  Power, 
  Pause, 
  RotateCcw, 
  Settings, 
  Monitor,
  Terminal,
  Shield,
  Database,
  Clock,
  Download,
  Upload,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface VPSDetails {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'restarting' | 'provisioning';
  ip: string;
  privateIp: string;
  os: string;
  plan: string;
  cpu: number;
  ram: number;
  storage: number;
  bandwidth: number;
  uptime: string;
  created: string;
  nextBilling: string;
  backups: number;
  metrics: {
    cpuUsage: number;
    ramUsage: number;
    diskUsage: number;
    networkIn: number;
    networkOut: number;
  };
}

// Mock VPS data - in real implementation, this would come from Proxmox API
const mockVPSDetails: VPSDetails = {
  id: 'vps-1',
  name: 'Web Server 01',
  status: 'running',
  ip: '203.0.113.100',
  privateIp: '10.0.0.100',
  os: 'Ubuntu 22.04 LTS',
  plan: 'Professional VPS',
  cpu: 2,
  ram: 4,
  storage: 50,
  bandwidth: 2000,
  uptime: '15 days, 8 hours',
  created: '2025-01-01',
  nextBilling: '2025-02-01',
  backups: 7,
  metrics: {
    cpuUsage: 45,
    ramUsage: 67,
    diskUsage: 34,
    networkIn: 1250,
    networkOut: 890
  }
};

const mockBackups = [
  { id: '1', name: 'Daily Backup - 2025-01-15', size: '2.4 GB', created: '2025-01-15 03:00', type: 'automatic' },
  { id: '2', name: 'Manual Backup - 2025-01-14', size: '2.3 GB', created: '2025-01-14 10:30', type: 'manual' },
  { id: '3', name: 'Daily Backup - 2025-01-14', size: '2.3 GB', created: '2025-01-14 03:00', type: 'automatic' }
];

export default function VPSManagement() {
  const { id } = useParams();
  const [vpsData, setVpsData] = useState<VPSDetails>(mockVPSDetails);
  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'backups' | 'network' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  const handleVPSAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true);
    
    // Simulate API call to Proxmox
    setTimeout(() => {
      setVpsData(prev => ({
        ...prev,
        status: action === 'restart' ? 'restarting' : (action === 'start' ? 'running' : 'stopped')
      }));
      setIsLoading(false);

      if (action === 'restart') {
        setTimeout(() => {
          setVpsData(prev => ({ ...prev, status: 'running' }));
        }, 5000);
      }
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'stopped': return 'text-red-600 bg-red-100';
      case 'restarting': return 'text-yellow-600 bg-yellow-100';
      case 'provisioning': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />;
      case 'stopped': return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      case 'restarting': return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-spin" />;
      case 'provisioning': return <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />;
      default: return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
    }
  };

  const MetricCard = ({ icon: Icon, label, value, unit, color }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}{unit}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              to="/dashboard"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vpsData.name}</h1>
              <p className="text-gray-600">Manage your VPS instance</p>
            </div>
          </div>

          {/* Status and Actions Bar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(vpsData.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vpsData.status)}`}>
                    {vpsData.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>IP:</strong> {vpsData.ip}</p>
                  <p><strong>OS:</strong> {vpsData.os}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Plan:</strong> {vpsData.plan}</p>
                  <p><strong>Uptime:</strong> {vpsData.uptime}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {vpsData.status === 'stopped' && (
                  <button
                    onClick={() => handleVPSAction('start')}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Power className="h-4 w-4" />
                    <span>{isLoading ? 'Starting...' : 'Start'}</span>
                  </button>
                )}
                {vpsData.status === 'running' && (
                  <>
                    <button
                      onClick={() => setShowTerminal(true)}
                      className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <Terminal className="h-4 w-4" />
                      <span>Console</span>
                    </button>
                    <button
                      onClick={() => handleVPSAction('restart')}
                      disabled={isLoading}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>{isLoading ? 'Restarting...' : 'Restart'}</span>
                    </button>
                    <button
                      onClick={() => handleVPSAction('stop')}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <Pause className="h-4 w-4" />
                      <span>{isLoading ? 'Stopping...' : 'Stop'}</span>
                    </button>
                  </>
                )}
                <button className="text-gray-600 hover:text-gray-800 p-2 rounded-md transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: Monitor },
                { key: 'console', label: 'Console', icon: Terminal },
                { key: 'backups', label: 'Backups', icon: Database },
                { key: 'network', label: 'Network', icon: Network },
                { key: 'settings', label: 'Settings', icon: Settings }
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
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Resource Usage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <MetricCard
                icon={Cpu}
                label="CPU Usage"
                value={vpsData.metrics.cpuUsage}
                unit="%"
                color="bg-blue-100 text-blue-600"
              />
              <MetricCard
                icon={MemoryStick}
                label="RAM Usage"
                value={vpsData.metrics.ramUsage}
                unit="%"
                color="bg-purple-100 text-purple-600"
              />
              <MetricCard
                icon={HardDrive}
                label="Disk Usage"
                value={vpsData.metrics.diskUsage}
                unit="%"
                color="bg-orange-100 text-orange-600"
              />
              <MetricCard
                icon={Download}
                label="Network In"
                value={vpsData.metrics.networkIn}
                unit=" MB"
                color="bg-green-100 text-green-600"
              />
              <MetricCard
                icon={Upload}
                label="Network Out"
                value={vpsData.metrics.networkOut}
                unit=" MB"
                color="bg-red-100 text-red-600"
              />
            </div>

            {/* VPS Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>Server Information</span>
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Public IP</p>
                      <p className="font-mono text-sm font-semibold">{vpsData.ip}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Private IP</p>
                      <p className="font-mono text-sm font-semibold">{vpsData.privateIp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CPU Cores</p>
                      <p className="font-semibold">{vpsData.cpu} vCPU</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Memory</p>
                      <p className="font-semibold">{vpsData.ram} GB RAM</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Storage</p>
                      <p className="font-semibold">{vpsData.storage} GB NVMe</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bandwidth</p>
                      <p className="font-semibold">{vpsData.bandwidth} GB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'CPU Usage', value: vpsData.metrics.cpuUsage, color: 'bg-blue-500' },
                    { label: 'RAM Usage', value: vpsData.metrics.ramUsage, color: 'bg-purple-500' },
                    { label: 'Disk Usage', value: vpsData.metrics.diskUsage, color: 'bg-orange-500' }
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{metric.label}</span>
                        <span className="font-semibold">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${metric.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Shield className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Firewall</span>
                </button>
                <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Database className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium">Backup Now</span>
                </button>
                <button 
                  onClick={() => setShowTerminal(true)}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Terminal className="h-8 w-8 text-gray-700 mb-2" />
                  <span className="text-sm font-medium">SSH Console</span>
                </button>
                <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="h-8 w-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium">Configure</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Console Tab */}
        {activeTab === 'console' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <span>VNC Console</span>
            </h3>
            
            <div className="bg-black rounded-lg p-4 min-h-96 flex items-center justify-center">
              <div className="text-center">
                <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">VNC Console will load here</p>
                <p className="text-sm text-gray-500">Connect directly to your VPS desktop environment</p>
                <button 
                  onClick={() => setShowTerminal(true)}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open SSH Terminal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Backup Management</span>
                </h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Create Backup</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900">Automatic Backups Enabled</h4>
                    <p className="text-sm text-blue-700">Daily backups at 3:00 AM UTC • Retention: 7 days</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="space-y-4">
                {mockBackups.map(backup => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${backup.type === 'automatic' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        <Database className={`h-5 w-5 ${backup.type === 'automatic' ? 'text-blue-600' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{backup.name}</h4>
                        <p className="text-sm text-gray-600">{backup.size} • {backup.created}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium">
                        Restore
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Network Configuration</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">IP Addresses</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Public IPv4</span>
                        <span className="font-mono text-sm font-semibold">{vpsData.ip}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Private IPv4</span>
                        <span className="font-mono text-sm font-semibold">{vpsData.privateIp}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Firewall Rules</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">SSH (22)</span>
                        <span className="text-xs px-2 py-1 bg-green-200 text-green-700 rounded-full">ALLOW</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">HTTP (80)</span>
                        <span className="text-xs px-2 py-1 bg-green-200 text-green-700 rounded-full">ALLOW</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">HTTPS (443)</span>
                        <span className="text-xs px-2 py-1 bg-green-200 text-green-700 rounded-full">ALLOW</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bandwidth Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Monthly Bandwidth Used</span>
                    <span className="font-semibold">{vpsData.metrics.networkIn + vpsData.metrics.networkOut} MB / {vpsData.bandwidth * 1024} MB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((vpsData.metrics.networkIn + vpsData.metrics.networkOut) / (vpsData.bandwidth * 1024)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">VPS Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
                      <input
                        type="text"
                        value={vpsData.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="ubuntu-22.04">Ubuntu 22.04 LTS</option>
                        <option value="ubuntu-20.04">Ubuntu 20.04 LTS</option>
                        <option value="centos-8">CentOS 8</option>
                        <option value="debian-11">Debian 11</option>
                        <option value="fedora-37">Fedora 37</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Security Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">SSH Key Authentication</label>
                        <p className="text-xs text-gray-500">Disable password authentication</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors">
                        <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">DDoS Protection</label>
                        <p className="text-xs text-gray-500">Advanced DDoS mitigation</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors">
                        <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">Rebuild VPS</h4>
                    <p className="text-sm text-red-700">Completely reinstall the operating system</p>
                  </div>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                    Rebuild
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">Delete VPS</h4>
                    <p className="text-sm text-red-700">Permanently delete this VPS instance</p>
                  </div>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SSH Terminal Modal */}
        {showTerminal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTerminal(false)} />
              
              <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-green-400" />
                    <span className="text-white font-medium">SSH Terminal - {vpsData.name}</span>
                  </div>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="bg-black p-4 h-96">
                  <div className="text-green-400 font-mono text-sm">
                    <p>ubuntu@{vpsData.name}:~$ </p>
                    <p className="mt-2 text-gray-400">Welcome to Ubuntu 22.04 LTS</p>
                    <p className="text-gray-400">Last login: {new Date().toLocaleString()}</p>
                    <p className="mt-2 text-green-400">ubuntu@{vpsData.name}:~$ <span className="animate-pulse">█</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}