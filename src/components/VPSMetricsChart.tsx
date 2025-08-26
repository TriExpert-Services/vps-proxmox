import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Cpu, HardDrive, MemoryStick, Network } from 'lucide-react';

interface MetricData {
  timestamp: string;
  cpu: number;
  ram: number;
  disk: number;
  networkIn: number;
  networkOut: number;
}

interface VPSMetricsChartProps {
  data: MetricData[];
  metric: 'cpu' | 'ram' | 'disk' | 'network';
  timeframe: '1h' | '24h' | '7d' | '30d';
}

const MetricConfig = {
  cpu: {
    label: 'CPU Usage',
    icon: Cpu,
    color: '#3B82F6',
    unit: '%',
    dataKey: 'cpu'
  },
  ram: {
    label: 'RAM Usage',
    icon: MemoryStick,
    color: '#8B5CF6',
    unit: '%',
    dataKey: 'ram'
  },
  disk: {
    label: 'Disk Usage',
    icon: HardDrive,
    color: '#F59E0B',
    unit: '%',
    dataKey: 'disk'
  },
  network: {
    label: 'Network Traffic',
    icon: Network,
    color: '#10B981',
    unit: 'MB/s',
    dataKey: 'networkIn'
  }
};

export default function VPSMetricsChart({ data, metric, timeframe }: VPSMetricsChartProps) {
  const config = MetricConfig[metric];
  const Icon = config.icon;

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeframe) {
      case '1h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '30d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const timestamp = new Date(label);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">
            {timestamp.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-sm font-semibold" style={{ color: config.color }}>
            {config.label}: {value.toFixed(1)}{config.unit}
          </p>
          {metric === 'network' && payload[1] && (
            <p className="text-sm font-semibold text-red-500">
              Network Out: {payload[1].value.toFixed(1)}MB/s
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
            <Icon className="h-5 w-5" style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-600">Last {timeframe}</p>
          </div>
        </div>
        
        {/* Current Value */}
        {data.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: config.color }}>
              {data[data.length - 1][config.dataKey].toFixed(1)}{config.unit}
            </p>
            <p className="text-xs text-gray-500">Current</p>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'network' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                label={{ value: config.unit, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="networkIn"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Network In"
              />
              <Area
                type="monotone"
                dataKey="networkOut"
                stackId="1"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
                name="Network Out"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                label={{ value: config.unit, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: config.color, strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Average</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.length > 0 
              ? (data.reduce((sum, item) => sum + item[config.dataKey], 0) / data.length).toFixed(1)
              : '0'
            }{config.unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Peak</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.length > 0 
              ? Math.max(...data.map(item => item[config.dataKey])).toFixed(1)
              : '0'
            }{config.unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Minimum</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.length > 0 
              ? Math.min(...data.map(item => item[config.dataKey])).toFixed(1)
              : '0'
            }{config.unit}
          </p>
        </div>
      </div>
    </div>
  );
}