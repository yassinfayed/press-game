import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

interface Player {
  id: string;
  name: string;
  key: string;
  taps: number;
  isReady: boolean;
  // isSelf is a frontend concept
}

interface GameState {
  players: { [key: string]: Player };
  gameStartTime: number | null;
  isGameActive: boolean;
  gameDuration: number;
}

const gameState: GameState = {
  players: {},
  gameStartTime: null,
  isGameActive: false,
  gameDuration: 15000 // 15 seconds
};

io.on('connection', (socket) => {
//   console.log('Player connected:', socket.id);

  socket.on('join', (playerData: { name: string; key: string }) => {
    console.log('Server received join event:', playerData);
    console.log('Server received join event:', playerData);
    // Ensure name and key are strings, although frontend should handle this validation
    const playerName = typeof playerData.name === 'string' ? playerData.name.trim() : 'Unknown Player';
    const playerKey = typeof playerData.key === 'string' ? playerData.key.toLowerCase() : '';

    // Only add player if name and key are valid
    if (playerName && playerKey) {
      gameState.players[socket.id] = {
        id: socket.id,
        name: playerName,
        key: playerKey,
        taps: 0,
        isReady: false,
        // isSelf is a frontend concept, server doesn't need to track this
      };

      console.log('Player added to game state:', gameState.players[socket.id]);
      
      // Construct the player data to emit, excluding isSelf
      const playersToEmit = Object.values(gameState.players).map(player => ({
        id: player.id,
        name: player.name,
        key: player.key,
        taps: player.taps,
        isReady: player.isReady,
        // isSelf is a frontend concept, calculated on the client
      }));
      console.log('Server preparing to emit playersUpdate with data:', playersToEmit);

      io.emit('playersUpdate', playersToEmit); // Send array of players
      console.log('Server emitted playersUpdate.');

    } else {
      console.log('Server received invalid player data on join:', playerData);
    }
  });

  socket.on('ready', () => {
    console.log('Server received ready event from', socket.id);
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].isReady = true;
      console.log(`Player ${socket.id} is now ready.`);
      
      const allPlayersReady = Object.values(gameState.players).every(player => player.isReady);
      const playerCount = Object.keys(gameState.players).length;

      // Construct the player data to emit after ready change, excluding isSelf
      const playersToEmit = Object.values(gameState.players).map(player => ({
          id: player.id,
          name: player.name,
          key: player.key,
          taps: player.taps,
          isReady: player.isReady,
          // isSelf is a frontend concept, calculated on the client
      }));

      io.emit('playersUpdate', playersToEmit); // Update all clients on ready state change
      console.log('Server emitted playersUpdate after ready change.');

      if (allPlayersReady && playerCount >= 2) {
        console.log(`All ${playerCount} players are ready. Starting game...`);
        gameState.gameStartTime = Date.now() + 5000; // 5 seconds countdown
        gameState.isGameActive = true;
        
        io.emit('gameStart', {
          startTime: gameState.gameStartTime,
          duration: gameState.gameDuration,
          initialCountdown: 5000 // Explicitly send initial countdown duration
        });

        console.log('Server emitted gameStart with data:', { startTime: gameState.gameStartTime, duration: gameState.gameDuration, initialCountdown: 5000 });

        // Reset game after duration
        setTimeout(() => {
          console.log('Game duration ended. Ending game...');
          endGame();
        }, gameState.gameDuration + 5000); // Add 5 seconds for countdown
      }
    }
  });

  socket.on('tap', () => {
    if (gameState.isGameActive && gameState.players[socket.id]) {
      gameState.players[socket.id].taps++;
      io.emit('tapsUpdate', {
        playerId: socket.id,
        taps: gameState.players[socket.id].taps
      });
    }
  });

  socket.on('syncTime', (clientSentAt: number) => {
    const serverTime = Date.now();
    socket.emit('syncTimeResponse', {
      serverTime,
      clientSentAt,
    });
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    // Construct the player data to emit after disconnect, excluding isSelf
    const playersToEmit = Object.values(gameState.players).map(player => ({
        id: player.id,
        name: player.name,
        key: player.key,
        taps: player.taps,
        isReady: player.isReady,
        // isSelf is a frontend concept, calculated on the client
    }));
    io.emit('playersUpdate', playersToEmit);
    console.log('Player disconnected:', socket.id);
  });
});

function endGame() {
  const results = Object.values(gameState.players)
    .sort((a, b) => b.taps - a.taps);

  // Construct the player data to emit in gameEnd, excluding isSelf
  const playersToEmit = results.map(player => ({
      id: player.id,
      name: player.name,
      key: player.key,
      taps: player.taps,
      isReady: player.isReady,
      // isSelf is a frontend concept, calculated on the client
  }));

  io.emit('gameEnd', {
    results: playersToEmit,
    winner: playersToEmit[0]
  });

  // Reset game state
  gameState.players = {};
  gameState.gameStartTime = null;
  gameState.isGameActive = false;
}

const PORT = process.env.PORT || 3100;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 