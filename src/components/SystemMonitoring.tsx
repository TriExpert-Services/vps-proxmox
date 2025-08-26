import React, { useState, useEffect } from 'react';
import { Activity, Server, Users, CreditCard, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SystemMetrics {
  totalVPS: number;
  runningVPS: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  openTickets: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
  revenueGrowth: number;
  userGrowth: number;
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

const mockMetrics: SystemMetrics = {
  totalVPS: 2891,
  runningVPS: 2654,
  totalUsers: 1247,
  activeUsers: 892,
  monthlyRevenue: 47580.00,
  openTickets: 23,
  systemLoad: 0.75,
  memoryUsage: 68.2,
  diskUsage: 45.1,
  networkTraffic: 1250.5,
  revenueGrowth: 12.5,
  userGrowth: 8.3
};

const mockPerformanceData: PerformanceData[] = [
  { timestamp: '2025-01-15T08:00:00Z', cpu: 45, memory: 65, disk: 44, network: 120 },
  { timestamp: '2025-01-15T09:00:00Z', cpu: 52, memory: 68, disk: 45, network: 135 },
  { timestamp: '2025-01-15T10:00:00Z', cpu: 48, memory: 71, disk: 46, network: 142 },
  { timestamp: '2025-01-15T11:00:00Z', cpu: 55, memory: 69, disk: 45, network: 138 },
  { timestamp: '2025-01-15T12:00:00Z', cpu: 62, memory: 72, disk: 47, network: 155 },
  { timestamp: '2025-01-15T13:00:00Z', cpu: 58, memory: 70, disk: 46, network: 148 },
  { timestamp: '2025-01-15T14:00:00Z', cpu: 51, memory: 67, disk: 45, network: 141 }
];

const vpsStatusData = [
  { name: 'Running', value: 2654, color: '#10B981' },
  { name: 'Stopped', value: 187, color: '#EF4444' },
  { name: 'Starting', value: 35, color: '#F59E0B' },
  { name: 'Error', value: 15, color: '#8B5CF6' }
];

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics>(mockMetrics);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>(mockPerformanceData);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'usage'>('overview');

  useEffect(() => {
    // In real implementation, fetch data from API
    const interval = setInterval(() => {
      // Simulate real-time updates
      setMetrics(prev => ({
        ...prev,
        systemLoad: Math.random() * 2,
        memoryUsage: 60 + Math.random() * 20,
        networkTraffic: 1000 + Math.random() * 500
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendValue, color }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium ml-1">{trendValue}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">Real-time platform performance and statistics</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Healthy</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Server}
          title="VPS Instances"
          value={metrics.totalVPS.toLocaleString()}
          subtitle={`${metrics.runningVPS} running`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          subtitle={`${metrics.totalUsers} total`}
          trend="up"
          trendValue={metrics.userGrowth}
          color="bg-green-500"
        />
        <StatCard
          icon={CreditCard}
          title="Monthly Revenue"
          value={`$${metrics.monthlyRevenue.toLocaleString()}`}
          trend="up"
          trendValue={metrics.revenueGrowth}
          color="bg-purple-500"
        />
        <StatCard
          icon={AlertTriangle}
          title="Open Tickets"
          value={metrics.openTickets}
          subtitle="Support requests"
          color="bg-orange-500"
        />
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Load</h3>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Load Average</span>
              <span className="font-semibold">{metrics.systemLoad.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.systemLoad * 50, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {metrics.systemLoad < 1 ? 'Normal' : metrics.systemLoad < 2 ? 'High' : 'Critical'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Memory Usage</h3>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Used</span>
              <span className="font-semibold">{metrics.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Disk Usage</h3>
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Used</span>
              <span className="font-semibold">{metrics.diskUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.diskUsage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Network Traffic</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current</span>
              <span className="font-semibold">{metrics.networkTraffic.toFixed(0)} MB/s</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.networkTraffic / 20, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance (Last 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} name="CPU" />
                <Line type="monotone" dataKey="memory" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Memory" />
                <Line type="monotone" dataKey="disk" stroke="#F59E0B" strokeWidth={2} dot={false} name="Disk" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VPS Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">VPS Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vpsStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vpsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {vpsStatusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent System Events</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { type: 'success', message: 'VPS vps-1234 deployed successfully', time: '2 minutes ago' },
              { type: 'warning', message: 'Node pve-node-02 memory usage high (85%)', time: '5 minutes ago' },
              { type: 'info', message: 'Backup completed for 150 VPS instances', time: '1 hour ago' },
              { type: 'error', message: 'Failed to start VPS vps-5678', time: '2 hours ago' },
              { type: 'success', message: 'New user registered: john@example.com', time: '3 hours ago' }
            ].map((event, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  event.type === 'success' ? 'bg-green-500' :
                  event.type === 'warning' ? 'bg-yellow-500' :
                  event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}