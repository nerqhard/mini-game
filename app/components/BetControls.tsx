'use client';

import { useState } from 'react';
import useGameStore from '../store/gameStore';

const QUICK_BET_AMOUNTS = [
  { label: '1K', value: 1000 },
  { label: '5K', value: 5000 },
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
];

export default function BetControls() {
  const { currentPlayer, selectedSymbol, placeBet, toggleReady } = useGameStore();
  const [customBetAmount, setCustomBetAmount] = useState('');

  const handleQuickBet = (amount: number) => {
    if (!selectedSymbol || !currentPlayer) return;
    
    if (amount > currentPlayer.money) {
      alert('Không đủ xu để đặt cược!');
      return;
    }

    placeBet(selectedSymbol, amount);
  };

  const handleCustomBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSymbol || !currentPlayer || !customBetAmount) return;

    const amount = parseInt(customBetAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Vui lòng nhập số xu hợp lệ!');
      return;
    }

    if (amount > currentPlayer.money) {
      alert('Không đủ xu để đặt cược!');
      return;
    }

    placeBet(selectedSymbol, amount);
    setCustomBetAmount('');
  };

  const formatXu = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')} xu`;
  };

  const handleCustomBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ cho phép nhập số
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomBetAmount(value);
  };

  if (!currentPlayer) return null;

  const totalBets = Object.values(currentPlayer.bets).reduce((sum, bet) => sum + bet, 0);
  const canBet = selectedSymbol && currentPlayer.money > 0 && !currentPlayer?.isReady;  

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <span>Số dư: {formatXu(currentPlayer.money)}</span>
        <span>Tổng cược: {formatXu(totalBets)}</span>
      </div>

      {/* Quick bet buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {QUICK_BET_AMOUNTS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => handleQuickBet(value)}
            disabled={!canBet || value > currentPlayer.money}
            className={`p-2 rounded ${
              canBet && value <= currentPlayer.money
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom bet form */}
      <form onSubmit={handleCustomBet} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={customBetAmount}
            onChange={handleCustomBetChange}
            placeholder="Nhập số xu muốn cược"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!canBet}
            className={`px-4 py-2 rounded ${
              canBet
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Đặt cược
          </button>
        </div>
      </form>

      {/* Ready button */}
      {totalBets > 0 && (
        <button
          onClick={toggleReady}
          className={`w-full p-2 rounded ${
            currentPlayer.isReady
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {currentPlayer.isReady ? 'Hủy sẵn sàng' : 'Sẵn sàng'}
        </button>
      )}
    </div>
  );
} 