export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

export interface Room {
  id: string;
  name: string;
  players: string[];
  isPlaying: boolean;
  createdAt: Date;
  maxPlayers: number;
  readyPlayers: string[];
  diceResults: GameSymbol[];
}

export interface Player {
  id: string;
  username: string;
  money: number;
  bets: Record<GameSymbol, number>;
  isOnline: boolean;
  lastActive: Date;
  roomId: string | null;
  isReady: boolean;
}

export interface GameState {
  players: Record<string, Player>;
  rooms: Record<string, Room>;
} 