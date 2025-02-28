'use client';

import { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { GameSymbol } from '../types';

const DICE_IMAGES: Record<GameSymbol, string> = {
  bau: '/images/dice/bau.png',
  cua: '/images/dice/cua.png',
  tom: '/images/dice/tom.png',
  ca: '/images/dice/ca.png',
  ga: '/images/dice/ga.png',
  nai: '/images/dice/nai.png'
};

export default function DiceRoller() {
  const { currentRoom, currentPlayer, rollDice, socketClient } = useGameStore();
  const [isRolling, setIsRolling] = useState(false);

  // Kiểm tra điều kiện để hiển thị nút lắc
  const canRoll = currentRoom && currentPlayer && 
    (currentRoom.players?.length >= 2) && 
    (currentRoom.readyPlayers?.length === currentRoom.players?.length);

  // Hiển thị kết quả xúc xắc
  const diceResults = currentRoom?.diceResults || ['bau', 'cua', 'tom'];

  useEffect(() => {
    // Lắng nghe sự kiện bắt đầu lắc
    socketClient?.socket?.on('startRolling', () => {
      console.log('Rolling started');
      setIsRolling(true);
    });

    // Lắng nghe sự kiện dừng lắc
    socketClient.socket?.on('stopRolling', () => {
      console.log('Rolling stopped');
      setIsRolling(false);
    });

    return () => {
      socketClient.socket?.off('startRolling');
      socketClient.socket?.off('stopRolling');
    };
  }, [socketClient.socket]);

  const handleRollClick = () => {
    if (!canRoll || isRolling) return;
    rollDice();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hiển thị xúc xắc */}
      <div className="flex gap-4">
        {diceResults.map((symbol, index) => (
          <div 
            key={index} 
            className={`w-24 h-24 border rounded-lg overflow-hidden ${
              isRolling ? 'animate-spin' : ''
            }`}
          >
            <img 
              src={DICE_IMAGES[symbol as GameSymbol]} 
              alt={symbol} 
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Thông tin trạng thái */}
      <div className="text-center">
        <p>
          Số người chơi: {currentRoom?.players?.length || 0}/
          {currentRoom?.maxPlayers || 10}
        </p>
        <p>
          Số người sẵn sàng: {currentRoom?.readyPlayers?.length || 0}/
          {currentRoom?.players?.length || 0}
        </p>
      </div>

      {/* Nút lắc xúc xắc */}
      <button
        onClick={handleRollClick}
        disabled={!canRoll || isRolling}
        className={`px-4 py-2 rounded ${
          canRoll && !isRolling
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isRolling ? 'Đang lắc...' : 'Lắc xúc xắc'}
      </button>
    </div>
  );
} 