'use client';

import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

const PlayersList = () => {
  const { players, currentPlayer } = useGameStore();
  const logout = useGameStore(state => state.logout);

  return (
    <div className="fixed left-4 top-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
      <h3 className="text-lg font-bold mb-2">Người chơi</h3>
      <div className="space-y-2">
        {Object.values(players).map((player) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-2 rounded ${
              player.id === currentPlayer?.id ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{player.username}</span>
                <div className="text-sm text-gray-600">
                  {player.money.toLocaleString()}đ
                </div>
              </div>
              {player.id === currentPlayer?.id && (
                <button
                  onClick={() => logout(player.id)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Thoát
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList; 