'use client';
import { create } from 'zustand';
import { GAME_SYMBOLS, INITIAL_MONEY } from '../constants/gameConstants';
import type { GameSymbol, Player, Room, GameState, DiceSymbol } from '../types/types';
import { gameStateSync } from '../utils/stateSync';
import SocketClient from '../utils/socketClient';

// Helper function để kiểm tra môi trường browser
const isBrowser = typeof window !== 'undefined';

// Helper functions để thao tác với localStorage an toàn
const getFromStorage = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
};

const setToStorage = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('Error setting localStorage:', e);
  }
};

const removeFromStorage = (key: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing from localStorage:', e);
  }
};

const createEmptyBets = (): Record<GameSymbol, number> => {
  return Object.values(GAME_SYMBOLS).reduce((acc, symbol) => ({
    ...acc,
    [symbol]: 0
  }), {} as Record<GameSymbol, number>);
};

interface GameStore {
  currentPlayer: Player | null;
  currentRoom: Room | null;
  rooms: Record<string, Room>;
  players: Record<string, Player>;
  isLoading: boolean;
  error: string | null;
  socketClient: SocketClient;
  selectedSymbol: GameSymbol | null;
  currentPlayerId: string | null;
  
  // Thêm các getter methods
  getCurrentPlayer: () => Player | null;
  getCurrentRoom: () => Room | null;
  
  initialize: () => void;
  login: (username: string) => Promise<void>;
  createRoom: (name: string) => void;
  joinRoom: (roomId: string) => void;
  placeBet: (symbol: string, amount: number) => void;
  toggleReady: () => void;
  rollDice: () => void;
  setError: (error: string | null) => void;
  setSelectedSymbol: (symbol: GameSymbol | null) => void;
  logout: (playerId: string) => void;
}

const useGameStore = create<GameStore>((set, get) => ({
  currentPlayer: null,
  currentRoom: null,
  rooms: {},
  players: {},
  isLoading: false,
  error: null,
  socketClient: SocketClient.getInstance(),
  selectedSymbol: null,
  currentPlayerId: null,

  // Thêm các getter methods
  getCurrentPlayer: () => get().currentPlayer,
  getCurrentRoom: () => get().currentRoom,

  initialize: () => {
    const { socketClient } = get();
    
    socketClient.onGameState((state: GameState) => {
      console.log('Handling game state update');
      
      const savedSession = localStorage.getItem('gameSession');
      const currentPlayerId = savedSession ? JSON.parse(savedSession).playerId : null;
      
      if (!currentPlayerId) {
        console.log('No current player ID when handling game state');
        return;
      }

      const currentPlayer = state.players[currentPlayerId];
      
      // Nếu không tìm thấy player trong state mới (đã bị xóa)
      // hoặc player đã out khỏi phòng do hết tiền
      if (!currentPlayer || (currentPlayer && currentPlayer.money <= 0 && !currentPlayer.roomId)) {
        // Clear local storage và reset state
        localStorage.removeItem('gameSession');
        set({
          currentPlayer: null,
          currentRoom: null,
          rooms: {},
          players: {},
          selectedSymbol: null
        });
        return;
      }

      const currentRoom = currentPlayer?.roomId ? state.rooms[currentPlayer.roomId] : null;

      set({
        rooms: state.rooms || {},
        players: state.players || {},
        currentPlayer: currentPlayer || null,
        currentRoom: currentRoom || null,
      });
    });

    // Lắng nghe thông báo
    socketClient.socket?.on('notification', (notification: { type: string; message: string }) => {
      if (notification.type === 'error') {
        alert(notification.message);
      }
    });

    socketClient.onRoomState((room: Room) => {
      set((store) => ({
        currentRoom: room,
        rooms: { ...store.rooms, [room.id]: room }
      }));
    });
  },

  login: async (username: string) => {
    const { socketClient } = get();
    set({ isLoading: true, error: null });
    
    try {
      const player = await socketClient.login(username);
      set({ 
        currentPlayer: player,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  createRoom: (name: string) => {
    const { socketClient } = get();
    socketClient.createRoom(name);
  },

  joinRoom: (roomId: string) => {
    const { socketClient } = get();
    socketClient.joinRoom(roomId);
  },

  placeBet: (symbol: string, amount: number) => {
    const { socketClient, selectedSymbol } = get();
    if (!selectedSymbol) {
      console.error('No symbol selected for betting');
      return;
    }
    socketClient.placeBet(symbol, amount);
    set({ selectedSymbol: null });
  },

  toggleReady: () => {
    const { socketClient } = get();
    socketClient.toggleReady();
  },

  rollDice: () => {
    const { socketClient } = get();
    socketClient.rollDice();
  },

  setError: (error: string | null) => set({ error }),

  setSelectedSymbol: (symbol: GameSymbol | null) => {
    console.log('Setting selected symbol:', symbol);
    set({ selectedSymbol: symbol });
  },

  logout: (playerId: string) => {
    const { socketClient } = get();
    socketClient.disconnect();
    localStorage.removeItem('gameSession');
    set({ currentPlayer: null, currentRoom: null, currentPlayerId: null });
  },
}));

export default useGameStore; 