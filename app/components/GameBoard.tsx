'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import useGameStore from '../store/gameStore';
import { GameSymbol } from '../types';

const SYMBOLS = [
  { id: 'bau', image: '/images/symbols/bau.png' },
  { id: 'cua', image: '/images/symbols/cua.png' },
  { id: 'tom', image: '/images/symbols/tom.png' },
  { id: 'ca', image: '/images/symbols/ca.png' },
  { id: 'ga', image: '/images/symbols/ga.png' },
  { id: 'nai', image: '/images/symbols/nai.png' },
];

const GameBoard = () => {
  const { selectedSymbol, setSelectedSymbol, currentPlayer } = useGameStore();

  const formatXu = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')} xu`;
  };

  const handleSymbolClick = (symbol: GameSymbol) => {
    setSelectedSymbol(selectedSymbol === symbol ? null : symbol);
  };

  return (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto p-4">
      {SYMBOLS.map((symbol) => {
        const betAmount = currentPlayer?.bets[symbol.id as GameSymbol] || 0;
        
        return (
          <motion.button
            key={symbol.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !currentPlayer?.isReady && handleSymbolClick(symbol.id as GameSymbol)}
            className={`aspect-square rounded-lg shadow-lg flex items-center justify-center p-4 relative ${
              selectedSymbol === symbol.id ? 'bg-blue-500 ring-2 ring-blue-600' : 'bg-white hover:bg-gray-50'
            } ${currentPlayer?.isReady ? 'cursor-not-allowed' : ''}`}
          >
            <div className="relative w-full h-full">
              <Image
                src={symbol.image}
                alt={symbol.id}
                width={100}
                height={100}
                className="object-contain"
                priority
              />
              {betAmount > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-1">
                  {formatXu(betAmount)}
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default GameBoard; 