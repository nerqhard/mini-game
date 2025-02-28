export const GAME_SYMBOLS = {
  BAU: 'bau',
  CUA: 'cua',
  TOM: 'tom',
  CA: 'ca',
  GA: 'ga',
  NAI: 'nai'
} as const;

export const SYMBOL_NAMES = {
  [GAME_SYMBOLS.BAU]: 'Bầu',
  [GAME_SYMBOLS.CUA]: 'Cua',
  [GAME_SYMBOLS.TOM]: 'Tôm',
  [GAME_SYMBOLS.CA]: 'Cá',
  [GAME_SYMBOLS.GA]: 'Gà',
  [GAME_SYMBOLS.NAI]: 'Nai'
} as const;

export const SYMBOL_IMAGES = {
  [GAME_SYMBOLS.BAU]: '🎃',
  [GAME_SYMBOLS.CUA]: '🦀',
  [GAME_SYMBOLS.TOM]: '🦐',
  [GAME_SYMBOLS.CA]: '🐟',
  [GAME_SYMBOLS.GA]: '🐔',
  [GAME_SYMBOLS.NAI]: '🦌'
} as const;

export const INITIAL_MONEY = 1000000; // 1 triệu
export const BET_AMOUNTS = [1000, 5000, 10000, 50000, 100000]; 