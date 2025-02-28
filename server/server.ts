import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { 
  GameSymbol, 
  Player, 
  Room, 
  GAME_SYMBOLS, 
  isValidGameSymbol,
  createEmptyBets
} from './types';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Trong production nên giới hạn origin cụ thể
    methods: ["GET", "POST"]
  }
});

interface GameState {
  players: Record<string, Player>;
  rooms: Record<string, Room>;
}

const gameState: GameState = {
  players: {},
  rooms: {}
};

// Thêm tracking cho sessions
const sessions: Record<string, {
  playerId: string;
  username: string;
  lastActive: Date;
}> = {};

// Helper functions
function calculateTotalAssets(player: Player): number {
  const totalBets = Object.values(player.bets).reduce((sum, bet) => sum + bet, 0);
  return player.money + totalBets;
}

function handleBrokePlater(playerId: string) {
  const player = gameState.players[playerId];
  if (!player) return;

  // Kiểm tra lại một lần nữa tổng tài sản
  const totalAssets = calculateTotalAssets(player);
  if (totalAssets > 0) return;

  console.log(`Player ${player.username} is out of money (total assets: ${totalAssets})`);

  // Xóa khỏi phòng
  if (player.roomId) {
    const room = gameState.rooms[player.roomId];
    if (room) {
      room.players = room.players.filter(id => id !== playerId);
      room.readyPlayers = room.readyPlayers.filter(id => id !== playerId);
      
      console.log(`Removed broke player ${player.username} from room ${room.name}`);

      // Gửi thông báo cho người chơi
      io.to(playerId).emit('notification', {
        type: 'error',
        message: 'Bạn đã hết xu và bị đưa ra khỏi phòng!'
      });

      // Reset room ID của player
      player.roomId = null;
      player.isReady = false;
      player.bets = createEmptyBets();

      // Nếu phòng không còn ai thì xóa phòng
      if (room.players.length === 0) {
        delete gameState.rooms[room.id];
        console.log(`Deleted empty room ${room.name}`);
      }
    }
  }
}

function calculateWinnings(room: Room, results: GameSymbol[]) {
  room.players.forEach(playerId => {
    const player = gameState.players[playerId];
    if (!player) return;

    // Tính tiền thắng cho mỗi symbol
    Object.entries(player.bets).forEach(([symbol, betAmount]) => {
      const count = results.filter(result => result === symbol).length;
      if (count > 0) {
        // Người chơi thắng: nhận lại tiền cược + tiền thắng
        const winAmount = betAmount * count;
        player.money += betAmount + winAmount;
        console.log(`Player ${player.username} won ${winAmount} xu on ${symbol}`);
      }
    });

    console.log(`Player ${player.username} final money: ${player.money}`);
    console.log(`Player ${player.username} total assets: ${calculateTotalAssets(player)}`);
  });
}

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Xử lý restore session
  socket.on('restoreSession', (sessionData: { playerId: string; username: string }) => {
    console.log('Attempting to restore session:', sessionData);
    
    if (sessionData && sessionData.playerId && sessionData.username) {
      const existingPlayer = gameState.players[sessionData.playerId];
      
      if (existingPlayer) {
        // Update player's socket ID and online status
        const updatedPlayer: Player = {
          ...existingPlayer,
          id: socket.id,
          isOnline: true,
          lastActive: new Date()
        };
        
        // Remove old socket entry and add new one
        delete gameState.players[sessionData.playerId];
        gameState.players[socket.id] = updatedPlayer;

        // Update room player list if player was in a room
        if (updatedPlayer.roomId) {
          const room = gameState.rooms[updatedPlayer.roomId];
          if (room) {
            room.players = room.players.map(id => 
              id === sessionData.playerId ? socket.id : id
            );
            socket.join(updatedPlayer.roomId);
          }
        }

        // Update session tracking
        sessions[socket.id] = {
          playerId: socket.id,
          username: sessionData.username,
          lastActive: new Date()
        };

        console.log(`Session restored for ${sessionData.username} with new socket ID ${socket.id}`);
        socket.emit('loginSuccess', updatedPlayer);
        io.emit('gameState', gameState);
        return;
      }
    }
  });

  socket.on('login', (username: string) => {
    console.log(`Player ${username} logging in with socket ${socket.id}`);
    
    // Kiểm tra username đã tồn tại và online
    const existingPlayer = Object.values(gameState.players).find(
      p => p.username === username && p.isOnline
    );
    
    if (existingPlayer) {
      socket.emit('error', { message: 'Username already taken' });
      return;
    }

    const player: Player = {
      id: socket.id,
      username,
      money: 100000,
      bets: createEmptyBets(),
      isOnline: true,
      lastActive: new Date(),
      roomId: null,
      isReady: false
    };

    gameState.players[socket.id] = player;
    
    // Save session
    sessions[socket.id] = {
      playerId: socket.id,
      username: username,
      lastActive: new Date()
    };

    console.log(`Player ${username} logged in successfully`);
    console.log('Current players:', Object.values(gameState.players).map(p => p.username));
    
    socket.emit('loginSuccess', player);
    io.emit('gameState', gameState);
  });

  socket.on('createRoom', (roomName: string) => {
    const player = gameState.players[socket.id];
    if (!player) {
      console.log('Player not found when creating room');
      return;
    }

    const roomId = `room_${Date.now()}`;
    const newRoom: Room = {
      id: roomId,
      name: roomName,
      players: [],
      readyPlayers: [],
      diceResults: ['bau', 'cua', 'tom'],
      isPlaying: false,
      maxPlayers: 10,
      createdAt: new Date(),
    };

    gameState.rooms[roomId] = newRoom;
    player.roomId = roomId;
    socket.join(roomId);
    
    console.log(`Room ${roomName} created by ${player.username}`);
    console.log('Room created:', newRoom);
    
    io.emit('gameState', gameState);
  });

  socket.on('joinRoom', (roomId: string) => {
    const player = gameState.players[socket.id];
    if (!player) {
      console.log(`Player ${socket.id} not found when joining room ${roomId}`);
      return;
    }

    const room = gameState.rooms[roomId];
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return;
    }

    // Leave current room if any
    if (player.roomId && player.roomId !== roomId) {
      const oldRoom = gameState.rooms[player.roomId];
      if (oldRoom) {
        oldRoom.players = oldRoom.players.filter(id => id !== socket.id);
        socket.leave(player.roomId);
      }
    }

    // Join new room
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
      player.roomId = roomId;
      socket.join(roomId);
      
      console.log('Player joined room:', {
        playerId: socket.id,
        roomId: roomId,
        roomPlayers: room.players
      });
    }

    io.to(roomId).emit('roomState', room);
    io.emit('gameState', gameState);
  });

  socket.on('leaveRoom', () => {
    const player = gameState.players[socket.id];
    if (player && player.roomId) {
      const room = gameState.rooms[player.roomId];
      if (room) {
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0) {
          delete gameState.rooms[player.roomId];
        }
      }
      const roomIdToLeave = player.roomId; // Lưu roomId trước khi set null
      player.roomId = null;
      if (roomIdToLeave) {
        socket.leave(roomIdToLeave);
      }
      io.emit('gameState', gameState);
    }
  });

  // Sửa lại hàm xử lý đặt cược
  socket.on('placeBet', ({ symbol, amount }: { symbol: GameSymbol; amount: number }) => {
    const player = gameState.players[socket.id];
    if (!player) {
      console.log('Player not found when placing bet');
      return;
    }

    console.log(`Attempting to place bet: ${amount} xu on ${symbol}`);
    console.log('Player current money:', player.money);

    // Kiểm tra số xu cược
    if (amount <= 0) {
      socket.emit('error', { message: 'Số xu cược phải lớn hơn 0' });
      return;
    }

    if (amount > player.money) {
      socket.emit('error', { message: 'Không đủ xu để đặt cược' });
      return;
    }

    // Kiểm tra người chơi đã sẵn sàng chưa
    if (player.isReady) {
      socket.emit('error', { message: 'Không thể đặt cược khi đã sẵn sàng' });
      return;
    }

    // Cập nhật tiền cược
    player.bets[symbol] = (player.bets[symbol] || 0) + amount;
    player.money -= amount;

    console.log(`Player ${player.username} bet ${amount} xu on ${symbol}`);
    console.log('Updated bets:', player.bets);
    console.log('Remaining money:', player.money);
    console.log('Total assets:', calculateTotalAssets(player));

    io.emit('gameState', gameState);
  });

  // Thêm handler cho ready/unready
  socket.on('toggleReady', () => {
    const player = gameState.players[socket.id];
    if (player && player.roomId) {
      const room = gameState.rooms[player.roomId];
      if (room) {
        // Kiểm tra xem người chơi đã đặt cược chưa
        const hasBets = Object.values(player.bets).some(amount => amount > 0);
        if (!hasBets) {
          socket.emit('error', { message: 'Bạn phải đặt cược trước khi sẵn sàng!' });
          return;
        }

        // Toggle trạng thái ready
        player.isReady = !player.isReady;
        
        // Cập nhật danh sách ready players
        if (player.isReady) {
          if (!room.readyPlayers.includes(player.id)) {
            room.readyPlayers.push(player.id);
          }
        } else {
          room.readyPlayers = room.readyPlayers.filter(id => id !== player.id);
        }

        // Kiểm tra điều kiện để enable roll dice
        const canRollDice = room.players.length >= 2 && 
                           room.readyPlayers.length === room.players.length;

        // Gửi trạng thái mới cho tất cả người chơi trong phòng
        io.to(room.id).emit('gameState', {
          ...gameState,
          canRollDice // Thêm trạng thái này vào gameState
        });
      }
    }
  });

  // Lắc xúc xắc
  socket.on('rollDice', async () => {
    const player = gameState.players[socket.id];
    if (!player?.roomId) return;

    const room = gameState.rooms[player.roomId];
    if (!room) return;

    // Sửa lại điều kiện kiểm tra - bỏ dấu ! ở đầu điều kiện
    if (room.players.length < 2 || room.readyPlayers.length !== room.players.length) {
      socket.emit('error', { message: 'Chưa đủ điều kiện để lắc' });
      return;
    }

    // Bắt đầu animation ở tất cả clients trong phòng
    room.isPlaying = true;
    io.to(room.id).emit('startRolling');
    
    // Đợi 3 giây
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Tạo kết quả ngẫu nhiên
    const symbols: GameSymbol[] = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const results = Array(3).fill(null).map(() => 
      symbols[Math.floor(Math.random() * symbols.length)]
    ) as GameSymbol[];

    room.diceResults = results;
    room.isPlaying = false;

    // Tính tiền thắng thua
    calculateWinnings(room, results);

    // Reset toàn bộ tiền cược và trạng thái sẵn sàng
    room.players.forEach(playerId => {
      const player = gameState.players[playerId];
      if (player) {
        // Reset trạng thái sẵn sàng
        player.isReady = false;
        // Reset tất cả tiền cược về 0
        player.bets = createEmptyBets();
      }
    });
    room.readyPlayers = [];

    // Kiểm tra người chơi hết tiền
    room.players.forEach(playerId => {
      const player = gameState.players[playerId];
      if (!player) return;

      const totalAssets = calculateTotalAssets(player);
      if (totalAssets <= 0) {
        handleBrokePlater(playerId);
      }
    });

    // Gửi kết quả và dừng animation
    io.to(room.id).emit('diceResults', results);
    io.to(room.id).emit('stopRolling');
    io.emit('gameState', gameState);
  });

  // Xử lý khi người chơi disconnect (tắt tab)
  socket.on('disconnect', () => {
    const player = gameState.players[socket.id];
    if (player) {
      console.log(`Player ${player.username} disconnected`);
      
      // Xóa khỏi phòng ngay lập tức
      if (player.roomId) {
        const room = gameState.rooms[player.roomId];
        if (room) {
          // Xóa khỏi danh sách người chơi và người sẵn sàng
          room.players = room.players.filter(id => id !== socket.id);
          room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
          
          console.log(`Removed player ${player.username} from room ${room.name}`);
          console.log('Remaining players:', room.players.map(id => gameState.players[id]?.username));

          // Nếu phòng không còn ai thì xóa phòng
          if (room.players.length === 0) {
            delete gameState.rooms[player.roomId];
            console.log(`Deleted empty room ${room.name}`);
          }
        }
      }

      // Xóa player khỏi game state
      delete gameState.players[socket.id];
      console.log(`Removed player ${player.username} from game state`);

      // Thông báo cho các người chơi khác
      io.emit('gameState', gameState);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 