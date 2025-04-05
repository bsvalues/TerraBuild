import { apiRequest } from '@/lib/queryClient';

export interface FTPConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  details?: any;
}

/**
 * Test an FTP connection using the provided credentials
 */
export async function testFTPConnection(connectionData: {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
}): Promise<FTPConnectionStatus> {
  try {
    const result = await apiRequest('/api/ftp/test-connection', {
      method: 'POST',
      data: connectionData
    });
    
    return {
      status: result.success ? 'connected' : 'error',
      message: result.message || 'Connection successful',
      details: result.details
    };
  } catch (error: any) {
    console.error('FTP connection test error:', error);
    return {
      status: 'error',
      message: error?.response?.data?.message || 'Connection failed',
      details: error?.response?.data || { error: 'Unknown error' }
    };
  }
}

/**
 * Get the connection status for a saved FTP connection
 */
export async function checkFTPConnectionStatus(connectionId: number): Promise<FTPConnectionStatus> {
  try {
    const result = await apiRequest(`/api/ftp/connections/${connectionId}/status`, {
      method: 'GET'
    });
    
    return {
      status: result.connected ? 'connected' : 'disconnected',
      message: result.message || 'Connection status checked',
      details: result.details
    };
  } catch (error: any) {
    console.error('FTP connection status check error:', error);
    return {
      status: 'error',
      message: error?.response?.data?.message || 'Status check failed',
      details: error?.response?.data || { error: 'Unknown error' }
    };
  }
}

/**
 * List files in a specific directory on the FTP server
 */
export async function listFTPDirectory(connectionId: number, path: string): Promise<any[]> {
  try {
    const result = await apiRequest(`/api/ftp/connections/${connectionId}/list`, {
      method: 'POST',
      data: { path }
    });
    
    return result.files || [];
  } catch (error: any) {
    console.error('FTP directory listing error:', error);
    throw new Error(error?.response?.data?.message || 'Failed to list directory');
  }
}

/**
 * Get all saved FTP connections
 */
export async function getFTPConnections(): Promise<any[]> {
  try {
    const result = await apiRequest('/api/ftp/connections', {
      method: 'GET'
    });
    
    return result || [];
  } catch (error: any) {
    console.error('Error getting FTP connections:', error);
    throw new Error(error?.response?.data?.message || 'Failed to get FTP connections');
  }
}