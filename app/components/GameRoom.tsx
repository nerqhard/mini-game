'use client';

import { useEffect } from 'react';
import GameBoard from './GameBoard';
import BetControls from './BetControls';
import DiceRoller from './DiceRoller';
import useGameStore from '../store/gameStore';

export default function GameRoom() {
  const { currentRoom, currentPlayer } = useGameStore();

  if (!currentRoom || !currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Không tìm thấy phòng hoặc người chơi</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Phòng: {currentRoom.name}</h1>
        <p>Số người chơi: {currentRoom.players?.length || 0}/{currentRoom.maxPlayers}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <GameBoard />
          <BetControls />
        </div>
        <div>
          <DiceRoller />
          
          {/* Danh sách người chơi */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Người chơi trong phòng</h2>
            <div className="space-y-2">
              {currentRoom.players?.map((playerId) => {
                const player = useGameStore.getState().players[playerId];
                if (!player) return null;
                
                return (
                  <div 
                    key={playerId}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <span>{player.username}</span>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        player.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      {player.money.toLocaleString()} xu
                      {player.isReady && (
                        <span className="text-green-500">✓ Sẵn sàng</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 