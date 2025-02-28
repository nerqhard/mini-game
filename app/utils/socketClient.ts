'use client';
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { GameState, Player, Room } from '../types/types';

class SocketClient {
  public socket: Socket | null = null;
  private serverUrl: string;
  private static instance: SocketClient | null = null;

  private constructor() {
    // Kiểm tra môi trường để xác định URL server
    this.serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    this.connect();
  }

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  private connect() {
    try {
      console.log('Connecting to server:', this.serverUrl);
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
      });

      // Xử lý kết nối
      this.socket.on('connect', () => {
        console.log('Connected to server');
        
        // Thử khôi phục session
        const savedSession = this.getSavedSession();
        if (savedSession) {
          console.log('Restoring session:', savedSession);
          this.socket?.emit('restoreSession', savedSession);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      this.setupListeners();
    } catch (error) {
      console.error('Error connecting to server:', error);
    }
  }

  private getSavedSession() {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('gameSession');
      return savedSession ? JSON.parse(savedSession) : null;
    }
    return null;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('gameState', (state: GameState) => {
      console.log('Received game state:', state);
    });

    this.socket.on('error', (error: any) => {
      console.error('Server error:', error);
    });

    this.socket.on('startRolling', () => {
      console.log('Received start rolling event');
    });

    this.socket.on('stopRolling', () => {
      console.log('Received stop rolling event');
    });
  }

  public login(username: string): Promise<Player> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('Attempting login with username:', username);
      this.socket.emit('login', username);

      this.socket.once('loginSuccess', (player: Player) => {
        console.log('Login successful:', player);
        if (typeof window !== 'undefined') {
          localStorage.setItem('gameSession', JSON.stringify({
            playerId: player.id,
            username: player.username
          }));
        }
        resolve(player);
      });

      this.socket.once('error', (error: any) => {
        console.error('Login error:', error);
        reject(error);
      });
    });
  }

  public createRoom(name: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Creating room:', name);
    this.socket.emit('createRoom', name);
  }

  public joinRoom(roomId: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Joining room:', roomId);
    this.socket.emit('joinRoom', roomId);
  }

  public placeBet(symbol: string, amount: number) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Placing bet:', { symbol, amount });
    this.socket.emit('placeBet', { symbol, amount });
  }

  public toggleReady() {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Toggling ready state');
    this.socket.emit('toggleReady');
  }

  public rollDice() {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Rolling dice');
    this.socket.emit('rollDice');
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public onGameState(callback: (state: GameState) => void) {
    this.socket?.on('gameState', callback);
  }

  public onRoomState(callback: (room: Room) => void) {
    this.socket?.on('roomState', callback);
  }

  public offGameState(callback: (state: GameState) => void) {
    this.socket?.off('gameState', callback);
  }

  public offRoomState(callback: (room: Room) => void) {
    this.socket?.off('roomState', callback);
  }
}

export default SocketClient; 