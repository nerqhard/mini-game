export const GAME_SYMBOLS = {
  BAU: 'bau',
  CUA: 'cua',
  TOM: 'tom',
  CA: 'ca',
  GA: 'ga',
  NAI: 'nai'
} as const;

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

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

export function createEmptyBets(): Record<GameSymbol, number> {
  return {
    bau: 0,
    cua: 0,
    tom: 0,
    ca: 0,
    ga: 0,
    nai: 0
  };
}

// Helper function để kiểm tra xem một string có phải là GameSymbol hợp lệ không
export const isValidGameSymbol = (symbol: string): symbol is GameSymbol => {
  return Object.values(GAME_SYMBOLS).includes(symbol as GameSymbol);
}; 