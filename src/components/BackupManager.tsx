import React, { useState, useEffect } from 'react';
import { Database, Download, Trash2, Plus, Clock, CheckCircle, AlertCircle, RotateCw } from 'lucide-react';

interface Backup {
  id: string;
  vpsId: string;
  vpsName: string;
  name: string;
  size: number; // in GB
  type: 'manual' | 'automatic' | 'snapshot';
  status: 'completed' | 'in-progress' | 'failed' | 'queued';
  created: Date;
  expires?: Date;
  description?: string;
}

interface BackupSchedule {
  id: string;
  vpsId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  retention: number; // days
  enabled: boolean;
}

const mockBackups: Backup[] = [
  {
    id: 'backup-1',
    vpsId: 'vps-1',
    vpsName: 'Web Server 01',
    name: 'Daily Backup - 2025-01-15',
    size: 2.4,
    type: 'automatic',
    status: 'completed',
    created: new Date('2025-01-15T03:00:00Z'),
    expires: new Date('2025-01-22T03:00:00Z')
  },
  {
    id: 'backup-2',
    vpsId: 'vps-1',
    vpsName: 'Web Server 01',
    name: 'Pre-update Backup',
    size: 2.3,
    type: 'manual',
    status: 'completed',
    created: new Date('2025-01-14T10:30:00Z'),
    description: 'Backup before system updates'
  },
  {
    id: 'backup-3',
    vpsId: 'vps-2',
    vpsName: 'Database Server',
    name: 'Daily Backup - 2025-01-15',
    size: 4.1,
    type: 'automatic',
    status: 'in-progress',
    created: new Date('2025-01-15T03:05:00Z')
  }
];

const mockSchedules: BackupSchedule[] = [
  {
    id: 'schedule-1',
    vpsId: 'vps-1',
    frequency: 'daily',
    time: '03:00',
    retention: 7,
    enabled: true
  },
  {
    id: 'schedule-2',
    vpsId: 'vps-2',
    frequency: 'daily',
    time: '03:00',
    retention: 14,
    enabled: true
  }
];

export default function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>(mockBackups);
  const [schedules, setSchedules] = useState<BackupSchedule[]>(mockSchedules);
  const [activeTab, setActiveTab] = useState<'backups' | 'schedules'>('backups');
  const [selectedVPS, setSelectedVPS] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <RotateCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'queued':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual':
        return 'text-purple-600 bg-purple-100';
      case 'automatic':
        return 'text-blue-600 bg-blue-100';
      case 'snapshot':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (gb: number) => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(0)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const filteredBackups = selectedVPS === 'all' 
    ? backups 
    : backups.filter(backup => backup.vpsId === selectedVPS);

  const handleCreateBackup = (vpsId: string, name: string, description?: string) => {
    const newBackup: Backup = {
      id: `backup-${Date.now()}`,
      vpsId,
      vpsName: `VPS ${vpsId}`,
      name,
      size: 0,
      type: 'manual',
      status: 'queued',
      created: new Date(),
      description
    };

    setBackups(prev => [newBackup, ...prev]);
    setShowCreateModal(false);

    // Simulate backup process
    setTimeout(() => {
      setBackups(prev => prev.map(b => 
        b.id === newBackup.id 
          ? { ...b, status: 'in-progress' as const }
          : b
      ));
    }, 1000);

    setTimeout(() => {
      setBackups(prev => prev.map(b => 
        b.id === newBackup.id 
          ? { ...b, status: 'completed' as const, size: Math.random() * 5 + 1 }
          : b
      ));
    }, 10000);
  };

  const handleDeleteBackup = (backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
  };

  const handleRestoreBackup = (backupId: string) => {
    // Implement restore logic
    console.log('Restoring backup:', backupId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup Management</h2>
          <p className="text-gray-600">Manage backups and schedules for your VPS instances</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Schedule Backup</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Backup</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900">{backups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {backups.filter(b => b.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <RotateCw className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {backups.filter(b => b.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full">
              <Database className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(backups.reduce((sum, b) => sum + (b.size || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'backups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Backup Files
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Backup Schedules
            </button>
          </nav>
        </div>

        {/* Backup Files Tab */}
        {activeTab === 'backups' && (
          <div className="p-6">
            {/* Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by VPS
              </label>
              <select
                value={selectedVPS}
                onChange={(e) => setSelectedVPS(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All VPS Instances</option>
                <option value="vps-1">Web Server 01</option>
                <option value="vps-2">Database Server</option>
              </select>
            </div>

            {/* Backup List */}
            <div className="space-y-4">
              {filteredBackups.map((backup) => (
                <div key={backup.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(backup.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{backup.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                            {backup.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(backup.type)}`}>
                            {backup.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">VPS:</span> {backup.vpsName}
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {formatFileSize(backup.size)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {backup.created.toLocaleDateString()}
                          </div>
                          {backup.expires && (
                            <div>
                              <span className="font-medium">Expires:</span> {backup.expires.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {backup.description && (
                          <p className="text-sm text-gray-600 mt-2">{backup.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
                          >
                            Restore
                          </button>
                          <button className="text-green-600 hover:text-green-700 p-1">
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backup Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="p-6">
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          VPS {schedule.vpsId} - {schedule.frequency} backup
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          schedule.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                        }`}>
                          {schedule.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Frequency:</span> {schedule.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {schedule.time}
                        </div>
                        <div>
                          <span className="font-medium">Retention:</span> {schedule.retention} days
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Manual Backup</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleCreateBackup(
                    formData.get('vps') as string,
                    formData.get('name') as string,
                    formData.get('description') as string
                  );
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VPS Instance
                      </label>
                      <select
                        name="vps"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select VPS</option>
                        <option value="vps-1">Web Server 01</option>
                        <option value="vps-2">Database Server</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Backup Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="e.g., Pre-update backup"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        placeholder="Brief description of this backup..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Backup
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}