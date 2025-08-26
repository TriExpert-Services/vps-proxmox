import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Mock support tickets
const mockTickets = [
  {
    id: '1',
    subject: 'VPS Performance Issues',
    status: 'open',
    priority: 'high',
    created: '2025-01-15',
    lastUpdate: '2025-01-15',
    messages: [
      {
        id: '1',
        author: 'John Doe',
        role: 'user',
        content: 'My VPS has been running very slowly since yesterday. CPU usage is constantly at 100% even with minimal load.',
        timestamp: '2025-01-15 10:30 AM'
      },
      {
        id: '2',
        author: 'Support Team',
        role: 'support',
        content: 'Thank you for contacting us. We are investigating the performance issue on your VPS. Can you please provide the output of "top" command?',
        timestamp: '2025-01-15 11:15 AM'
      }
    ]
  },
  {
    id: '2',
    subject: 'Backup Configuration Help',
    status: 'in-progress',
    priority: 'medium',
    created: '2025-01-14',
    lastUpdate: '2025-01-14',
    messages: [
      {
        id: '1',
        author: 'John Doe',
        role: 'user',
        content: 'I need help setting up automated backups for my VPS. Can you guide me through the process?',
        timestamp: '2025-01-14 2:00 PM'
      },
      {
        id: '2',
        author: 'Support Team',
        role: 'support',
        content: 'I\'d be happy to help you set up automated backups. Our backup system creates daily snapshots by default. Would you like to configure custom backup schedules?',
        timestamp: '2025-01-14 2:30 PM'
      }
    ]
  },
  {
    id: '3',
    subject: 'Billing Question',
    status: 'closed',
    priority: 'low',
    created: '2025-01-13',
    lastUpdate: '2025-01-13',
    messages: [
      {
        id: '1',
        author: 'John Doe',
        role: 'user',
        content: 'I have a question about my monthly billing. The charge seems higher than expected.',
        timestamp: '2025-01-13 9:00 AM'
      },
      {
        id: '2',
        author: 'Support Team',
        role: 'support',
        content: 'The additional charge is for the extra storage you added last month. The billing breakdown is available in your dashboard under the billing section.',
        timestamp: '2025-01-13 9:30 AM'
      },
      {
        id: '3',
        author: 'John Doe',
        role: 'user',
        content: 'That makes sense. Thank you for clarifying!',
        timestamp: '2025-01-13 10:00 AM'
      }
    ]
  }
];

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    priority: 'medium',
    message: ''
  });
  const [newMessage, setNewMessage] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-orange-600 bg-orange-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'closed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTicket = {
      id: Date.now().toString(),
      subject: newTicketData.subject,
      status: 'open',
      priority: newTicketData.priority,
      created: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: '1',
          author: user?.name || 'User',
          role: 'user',
          content: newTicketData.message,
          timestamp: new Date().toLocaleString()
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewTicketData({ subject: '', priority: 'medium', message: '' });
    setShowNewTicket(false);
    setSelectedTicket(newTicket.id);
  };

  const handleSendMessage = (ticketId: string) => {
    if (!newMessage.trim()) return;

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          messages: [
            ...ticket.messages,
            {
              id: (ticket.messages.length + 1).toString(),
              author: user?.name || 'User',
              role: 'user',
              content: newMessage,
              timestamp: new Date().toLocaleString()
            }
          ]
        };
      }
      return ticket;
    }));

    setNewMessage('');
  };

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Get help with your VPS hosting needs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
                  <button
                    onClick={() => setShowNewTicket(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Ticket</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTicket === ticket.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{ticket.subject}</h3>
                        <div className="flex items-center space-x-2 mt-2">
                          {getStatusIcon(ticket.status)}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Updated: {ticket.lastUpdate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Details or New Ticket Form */}
          <div className="lg:col-span-2">
            {showNewTicket ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Create New Ticket</h2>
                  <button
                    onClick={() => setShowNewTicket(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={newTicketData.subject}
                      onChange={(e) => setNewTicketData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newTicketData.priority}
                      onChange={(e) => setNewTicketData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      required
                      rows={6}
                      value={newTicketData.message}
                      onChange={(e) => setNewTicketData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowNewTicket(false)}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Ticket
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedTicketData ? (
              <div className="bg-white rounded-lg shadow-md">
                {/* Ticket Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{selectedTicketData.subject}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicketData.status)}`}>
                      {selectedTicketData.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Ticket #{selectedTicketData.id}</span>
                    <span>Created: {selectedTicketData.created}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicketData.priority)}`}>
                      {selectedTicketData.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                  {selectedTicketData.messages.map(message => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-3xl px-4 py-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{message.author}</span>
                          <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.timestamp}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {selectedTicketData.status !== 'closed' && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your reply..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={() => handleSendMessage(selectedTicketData.id)}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h3>
                <p className="text-gray-600">Select a ticket from the list to view its details or create a new ticket to get support.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}