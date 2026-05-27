export interface WifiConfig {
  ssid: string;
  password?: string;
  ipAddress: string;
  port: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'sent' | 'received';
  message: string;
}

export type ConnectionMode = 'wifi' | 'usb';
