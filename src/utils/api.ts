// API utility functions and axios configuration
import axios, { AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show access denied message
      console.error('Access denied');
    } else if (error.response?.status >= 500) {
      // Server error - show generic error message
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Authentication API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/auth/login', { email, password }),
    
  register: (name: string, email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/auth/register', { name, email, password }),
    
  refreshToken: () =>
    api.post<ApiResponse<{ token: string }>>('/auth/refresh'),
    
  logout: () =>
    api.post<ApiResponse>('/auth/logout'),
    
  forgotPassword: (email: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse>('/auth/reset-password', { token, password }),
};

// User API
export const userApi = {
  getProfile: () =>
    api.get<ApiResponse<any>>('/users/profile'),
    
  updateProfile: (data: any) =>
    api.put<ApiResponse<any>>('/users/profile', data),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse>('/users/change-password', { currentPassword, newPassword }),
    
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<ApiResponse<{ avatar_url: string }>>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// VPS API
export const vpsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; sort?: string; order?: string }) =>
    api.get<ApiResponse<any[]>>('/vps', { params }),
    
  get: (id: string) =>
    api.get<ApiResponse<any>>(`/vps/${id}`),
    
  create: (data: any) =>
    api.post<ApiResponse<any>>('/vps', data),
    
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/vps/${id}`, data),
    
  delete: (id: string, force?: boolean) =>
    api.delete<ApiResponse>(`/vps/${id}`, { params: { force } }),
    
  start: (id: string) =>
    api.post<ApiResponse>(`/vps/${id}/start`),
    
  stop: (id: string) =>
    api.post<ApiResponse>(`/vps/${id}/stop`),
    
  restart: (id: string) =>
    api.post<ApiResponse>(`/vps/${id}/restart`),
    
  rebuild: (id: string, data: { operating_system: string; ssh_keys?: string[] }) =>
    api.post<ApiResponse>(`/vps/${id}/rebuild`, data),
    
  getMetrics: (id: string, params?: { period?: string; start_time?: string; end_time?: string }) =>
    api.get<ApiResponse<any>>(`/vps/${id}/metrics`, { params }),
    
  getConsole: (id: string) =>
    api.get<ApiResponse<{ console_url: string; vnc_password: string; expires_at: string }>>(`/vps/${id}/console`),
    
  getNetwork: (id: string) =>
    api.get<ApiResponse<any>>(`/vps/${id}/network`),
    
  updateNetwork: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/vps/${id}/network`, data),
    
  requestIP: (id: string) =>
    api.post<ApiResponse<{ ip_address: string }>>(`/vps/${id}/network/ip`),
};

// Backup API
export const backupApi = {
  list: (vpsId: string) =>
    api.get<ApiResponse<any[]>>(`/vps/${vpsId}/backups`),
    
  create: (vpsId: string, data: { name: string; description?: string }) =>
    api.post<ApiResponse<any>>(`/vps/${vpsId}/backups`, data),
    
  restore: (vpsId: string, backupId: string) =>
    api.post<ApiResponse>(`/vps/${vpsId}/backups/${backupId}/restore`),
    
  delete: (vpsId: string, backupId: string) =>
    api.delete<ApiResponse>(`/vps/${vpsId}/backups/${backupId}`),
    
  download: (vpsId: string, backupId: string) =>
    api.get(`/vps/${vpsId}/backups/${backupId}/download`, { responseType: 'blob' }),
};

// Plans API
export const plansApi = {
  list: () =>
    api.get<ApiResponse<any[]>>('/plans'),
    
  get: (id: string) =>
    api.get<ApiResponse<any>>(`/plans/${id}`),
};

// Billing API
export const billingApi = {
  getInvoices: (params?: { status?: string; start_date?: string; end_date?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<any[]>>('/billing/invoices', { params }),
    
  getInvoice: (id: string) =>
    api.get<ApiResponse<any>>(`/billing/invoices/${id}`),
    
  downloadInvoice: (id: string) =>
    api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
    
  getUsage: () =>
    api.get<ApiResponse<any>>('/billing/usage'),
    
  getPaymentMethods: () =>
    api.get<ApiResponse<any[]>>('/billing/payment-methods'),
    
  addPaymentMethod: (paymentMethodId: string, setAsDefault?: boolean) =>
    api.post<ApiResponse<any>>('/billing/payment-methods', { payment_method_id: paymentMethodId, set_as_default: setAsDefault }),
    
  removePaymentMethod: (id: string) =>
    api.delete<ApiResponse>(`/billing/payment-methods/${id}`),
    
  createPaymentIntent: (amount: number, currency: string = 'usd') =>
    api.post<ApiResponse<{ client_secret: string }>>('/billing/payment-intent', { amount, currency }),
};

// Support API
export const supportApi = {
  getTickets: (params?: { status?: string; priority?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<any[]>>('/support/tickets', { params }),
    
  createTicket: (data: { subject: string; description: string; priority: string; category: string; vps_id?: string }) =>
    api.post<ApiResponse<any>>('/support/tickets', data),
    
  getTicket: (id: string) =>
    api.get<ApiResponse<any>>(`/support/tickets/${id}`),
    
  updateTicket: (id: string, data: { status?: string; priority?: string }) =>
    api.put<ApiResponse<any>>(`/support/tickets/${id}`, data),
    
  addMessage: (ticketId: string, data: { message: string; attachments?: any[] }) =>
    api.post<ApiResponse<any>>(`/support/tickets/${ticketId}/messages`, data),
    
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ file_url: string; file_id: string }>>('/support/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Admin API (requires admin role)
export const adminApi = {
  getStats: () =>
    api.get<ApiResponse<any>>('/admin/stats'),
    
  getUsers: (params?: { page?: number; limit?: number; status?: string; role?: string }) =>
    api.get<ApiResponse<any[]>>('/admin/users', { params }),
    
  getUser: (id: string) =>
    api.get<ApiResponse<any>>(`/admin/users/${id}`),
    
  updateUser: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/admin/users/${id}`, data),
    
  suspendUser: (id: string, reason?: string) =>
    api.post<ApiResponse>(`/admin/users/${id}/suspend`, { reason }),
    
  unsuspendUser: (id: string) =>
    api.post<ApiResponse>(`/admin/users/${id}/unsuspend`),
    
  getAllVPS: (params?: { page?: number; limit?: number; status?: string; user_id?: string }) =>
    api.get<ApiResponse<any[]>>('/admin/vps', { params }),
    
  suspendVPS: (id: string, reason?: string) =>
    api.post<ApiResponse>(`/admin/vps/${id}/suspend`, { reason }),
    
  unsuspendVPS: (id: string) =>
    api.post<ApiResponse>(`/admin/vps/${id}/unsuspend`),
    
  getAllTickets: (params?: { page?: number; limit?: number; status?: string; priority?: string; assigned_to?: string }) =>
    api.get<ApiResponse<any[]>>('/admin/tickets', { params }),
    
  assignTicket: (id: string, assigneeId: string) =>
    api.post<ApiResponse>(`/admin/tickets/${id}/assign`, { assignee_id: assigneeId }),
    
  getSystemHealth: () =>
    api.get<ApiResponse<any>>('/admin/system/health'),
    
  getAuditLogs: (params?: { page?: number; limit?: number; user_id?: string; action?: string; resource?: string }) =>
    api.get<ApiResponse<any[]>>('/admin/audit-logs', { params }),
    
  getSettings: () =>
    api.get<ApiResponse<any>>('/admin/settings'),
    
  updateSettings: (data: any) =>
    api.put<ApiResponse<any>>('/admin/settings', data),
};

// Webhook API (for receiving notifications)
export const webhookApi = {
  stripe: (payload: any, signature: string) =>
    api.post('/webhooks/stripe', payload, {
      headers: { 'Stripe-Signature': signature },
    }),
};

// File upload utility
export const uploadFile = async (file: File, type: 'avatar' | 'attachment'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await api.post<ApiResponse<{ file_url: string }>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  if (response.data.success && response.data.data) {
    return response.data.data.file_url;
  }
  
  throw new Error('File upload failed');
};

// Error handling utilities
export const handleApiError = (error: AxiosError): string => {
  if (error.response?.data) {
    const apiError = error.response.data as ApiResponse;
    return apiError.error?.message || 'An error occurred';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Network error occurred';
};

// Rate limiting utilities
export const checkRateLimit = (response: AxiosResponse): { remaining: number; resetAt: Date } => {
  const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '0', 10);
  const resetAt = new Date(parseInt(response.headers['x-ratelimit-reset'] || '0', 10) * 1000);
  
  return { remaining, resetAt };
};

// Export the configured axios instance
export default api;