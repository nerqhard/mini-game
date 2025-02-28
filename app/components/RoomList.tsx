'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

const RoomList = () => {
  const { rooms, createRoom, joinRoom, currentPlayer } = useGameStore();
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom(newRoomName);
      setNewRoomName('');
    }
  };

  const roomList = Object.values(rooms || {});

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Danh sách phòng</h1>
      
      {/* Form tạo phòng */}
      <form onSubmit={handleCreateRoom} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Tên phòng mới"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tạo phòng
          </button>
        </div>
      </form>

      {/* Danh sách phòng */}
      <div className="grid gap-4">
        {roomList && roomList.length > 0 ? (
          roomList.map((room) => (
            <div
              key={room.id}
              className="border p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <h2 className="font-bold">{room.name}</h2>
                <div>
                  {room.players?.length || 0}/{room.maxPlayers || 10} người chơi
                </div>
              </div>
              <button
                onClick={() => joinRoom(room.id)}
                disabled={room.players?.length >= (room.maxPlayers || 10)}
                className={`px-4 py-2 rounded ${
                  room.players?.length >= (room.maxPlayers || 10)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Vào phòng
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">Chưa có phòng nào</p>
        )}
      </div>
    </div>
  );
};

export default RoomList; 