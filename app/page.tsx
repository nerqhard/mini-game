'use client';

import { useEffect } from 'react';
import useGameStore from './store/gameStore';
import RoomList from './components/RoomList';
import GameRoom from './components/GameRoom';
import LoginForm from './components/LoginForm';

export default function Home() {
  const { currentPlayer, currentRoom, initialize } = useGameStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Hiển thị loading state nếu cần
  // if (isLoading) return <div>Loading...</div>;

  // Hiển thị component tương ứng với trạng thái game
  if (!currentPlayer) {
    return <LoginForm />;
  }

  if (!currentRoom) {
    return <RoomList />;
  }

  return <GameRoom />;
}
