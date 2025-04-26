/**
 * WebSocket Server
 * 
 * This module provides a WebSocket server for real-time communication
 * and tracks connected clients for monitoring purposes.
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

// Track connected clients
let connectedClients = 0;
let io: Server | null = null;

/**
 * Initialize the WebSocket server
 * @param server HTTP server instance
 */
export function initializeSocketServer(server: HTTPServer): void {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://app.example.com'] 
        : ['http://localhost:5000', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // Increment connected clients counter
    connectedClients++;
    
    console.log(`Client connected: ${socket.id}, total: ${connectedClients}`);
    
    // Send initial data to the client
    socket.emit('welcome', { message: 'Connected to BCBS WebSocket server' });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      connectedClients--;
      console.log(`Client disconnected: ${socket.id}, total: ${connectedClients}`);
    });
    
    // Example: Listen for events from clients
    socket.on('client:event', (data) => {
      console.log(`Received event from client ${socket.id}:`, data);
      // Process event and potentially broadcast to other clients
    });
  });
  
  console.log('WebSocket server initialized');
}

/**
 * Get the number of connected clients
 * @returns Number of connected WebSocket clients
 */
export function getConnectedClients(): number {
  return connectedClients;
}

/**
 * Broadcast a message to all connected clients
 * @param event Event name
 * @param data Data to send
 */
export function broadcastToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Send a message to a specific client
 * @param socketId Socket ID of the client
 * @param event Event name
 * @param data Data to send
 */
export function sendToClient(socketId: string, event: string, data: any): void {
  if (io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}

export default {
  initializeSocketServer,
  getConnectedClients,
  broadcastToAll,
  sendToClient,
};