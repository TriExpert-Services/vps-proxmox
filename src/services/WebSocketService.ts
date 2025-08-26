// Real-time WebSocket service for VPS monitoring
export interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface VPSStatusUpdate {
  vpsId: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  metrics?: {
    cpu: number;
    ram: number;
    disk: number;
    network: {
      in: number;
      out: number;
    };
  };
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting: boolean = false;

  constructor(private baseUrl: string, private token: string) {
    this.connect();
  }

  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws?token=${this.token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.send({ type: 'ping', payload: {}, timestamp: Date.now() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: WSMessage): void {
    const { type, payload } = message;
    
    switch (type) {
      case 'pong':
        // Handle ping/pong for keep-alive
        break;
      
      case 'vps_status_update':
        this.emit('vps_status', payload as VPSStatusUpdate);
        break;
      
      case 'vps_metrics_update':
        this.emit('vps_metrics', payload);
        break;
      
      case 'notification':
        this.emit('notification', payload);
        break;
      
      case 'system_alert':
        this.emit('system_alert', payload);
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  public send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  public subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  public subscribeToVPS(vpsId: string): void {
    this.send({
      type: 'subscribe_vps',
      payload: { vpsId },
      timestamp: Date.now()
    });
  }

  public unsubscribeFromVPS(vpsId: string): void {
    this.send({
      type: 'unsubscribe_vps',
      payload: { vpsId },
      timestamp: Date.now()
    });
  }

  public requestVPSMetrics(vpsId: string, timeframe: string = '1h'): void {
    this.send({
      type: 'request_metrics',
      payload: { vpsId, timeframe },
      timestamp: Date.now()
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Utility methods for common operations
  public startVPSMonitoring(vpsIds: string[]): void {
    vpsIds.forEach(id => this.subscribeToVPS(id));
  }

  public stopVPSMonitoring(vpsIds: string[]): void {
    vpsIds.forEach(id => this.unsubscribeFromVPS(id));
  }
}

export default WebSocketService;

// React hook for WebSocket integration
import { useEffect, useRef, useState } from 'react';

export function useWebSocket(baseUrl: string, token: string) {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocketService(baseUrl, token);
    }

    const checkConnection = setInterval(() => {
      setIsConnected(wsRef.current?.isConnected() || false);
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      wsRef.current?.disconnect();
    };
  }, [baseUrl, token]);

  const subscribe = (event: string, callback: (data: any) => void) => {
    return wsRef.current?.subscribe(event, callback) || (() => {});
  };

  const subscribeToVPS = (vpsId: string) => {
    wsRef.current?.subscribeToVPS(vpsId);
  };

  const unsubscribeFromVPS = (vpsId: string) => {
    wsRef.current?.unsubscribeFromVPS(vpsId);
  };

  return {
    isConnected,
    subscribe,
    subscribeToVPS,
    unsubscribeFromVPS,
    ws: wsRef.current
  };
}