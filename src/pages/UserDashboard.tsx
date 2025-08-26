import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Server, Activity, CreditCard, Settings, Plus, Power, Pause, RotateCcw } from 'lucide-react';

// Mock data for user's VPS instances
const mockVPS = [
  {
    id: 'vps-1',
    name: 'Web Server 01',
    plan: 'Professional VPS',
    status: 'running',
    ip: '192.168.1.100',
    os: 'Ubuntu 22.04 LTS',
    cpu: 2,
    ram: 4,
    storage: 50,
    uptime: '15 days',
    created: '2025-01-01'
  },
  {
    id: 'vps-2',
    name: 'Database Server',
    plan: 'Business VPS',
    status: 'stopped',
    ip: '192.168.1.101',
    os: 'CentOS 8',
    cpu: 2,
    ram: 8,
    storage: 80,
    uptime: '0 days',
    created: '2025-01-10'
  }
];

const mockUsage = {
  totalServers: 2,
  runningServers: 1,
  monthlyBill: 49.98,
  bandwidthUsed: 1250
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [vpsInstances, setVpsInstances] = useState(mockVPS);

  const handleVPSAction = (vpsId: string, action: 'start' | 'stop' | 'restart') => {
    setVpsInstances(prev => prev.map(vps => {
      if (vps.id === vpsId) {
        let newStatus = vps.status;
        switch (action) {
          case 'start':
            newStatus = 'running';
            break;
          case 'stop':
            newStatus = 'stopped';
            break;
          case 'restart':
            newStatus = 'restarting';
            // Simulate restart process
            setTimeout(() => {
              setVpsInstances(current => current.map(v => 
                v.id === vpsId ? { ...v, status: 'running' } : v
              ));
            }, 3000);
            break;
        }
        return { ...vps, status: newStatus };
      }
      return vps;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'stopped': return 'text-red-600 bg-red-100';
      case 'restarting': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'stopped': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'restarting': return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-spin" />;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your VPS instances and monitor performance</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Servers</p>
                <p className="text-2xl font-bold text-gray-900">{mockUsage.totalServers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-gray-900">{mockUsage.runningServers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Bill</p>
                <p className="text-2xl font-bold text-gray-900">${mockUsage.monthlyBill}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bandwidth Used</p>
                <p className="text-2xl font-bold text-gray-900">{mockUsage.bandwidthUsed} GB</p>
              </div>
            </div>
          </div>
        </div>

        {/* VPS Instances */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Your VPS Instances</h2>
              <Link
                to="/plans"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Deploy New VPS</span>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {vpsInstances.map((vps) => (
              <div key={vps.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Server className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{vps.name}</h3>
                      <p className="text-sm text-gray-600">{vps.plan} • {vps.os}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(vps.status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(vps.status)}`}>
                          {vps.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">IP Address</p>
                    <p className="font-mono text-sm font-semibold">{vps.ip}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">CPU</p>
                    <p className="font-semibold">{vps.cpu} vCPU</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RAM</p>
                    <p className="font-semibold">{vps.ram} GB</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Storage</p>
                    <p className="font-semibold">{vps.storage} GB</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Uptime</p>
                    <p className="font-semibold">{vps.uptime}</p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Link
                    to={`/vps/${vps.id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage
                  </Link>
                  {vps.status === 'stopped' && (
                    <button
                      onClick={() => handleVPSAction(vps.id, 'start')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Power className="h-4 w-4" />
                      <span>Start</span>
                    </button>
                  )}
                  {vps.status === 'running' && (
                    <>
                      <button
                        onClick={() => handleVPSAction(vps.id, 'stop')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <Pause className="h-4 w-4" />
                        <span>Stop</span>
                      </button>
                      <button
                        onClick={() => handleVPSAction(vps.id, 'restart')}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restart</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}