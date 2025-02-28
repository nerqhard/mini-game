import { GAME_SYMBOLS } from '../constants/gameConstants';

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

export type DiceSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

export interface Player {
  isReady: any;
  id: string;
  username: string;
  money: number;
  bets: Record<GameSymbol, number>;
  isOnline: boolean;
  lastActive: Date;
  roomId: string | null;
}

export interface Room {
  id: string;
  name: string;
  players: string[]; // array of player IDs
  isPlaying: boolean;
  createdAt: Date;
  maxPlayers: number;
  readyPlayers: string[];
  diceResults?: DiceSymbol[];
}

export interface GameState {
  players: Record<string, Player>;
  rooms: Record<string, Room>;
  currentPlayerId: string | null;
  currentRoomId: string | null;
  isRolling: boolean;
  diceResults: GameSymbol[];
  selectedSymbol: GameSymbol | null;
} 