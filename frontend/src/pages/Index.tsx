import { useState, useEffect } from "react";
import { GameLobby } from "@/components/GameLobby";
import { GamePlay } from "@/components/GamePlay";
import { GameResults } from "@/components/GameResults";
import { Player } from "@/types/game";
import { useSocket } from "@/lib/socket";

const Index = () => {
  const { socket } = useSocket();
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'results'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for players updates to keep track of current players
    socket.on('playersUpdate', (updatedPlayers: Player[]) => {
      const playersWithSelf = updatedPlayers.map(player => ({
        ...player,
        isSelf: player.id === socket.id
      }));
      setCurrentPlayers(playersWithSelf);
    });

    // Remove the duplicate gameStart listener since GameLobby handles it now
    // socket.on('gameStart', (gameStartData) => {
    //   console.log('Index: Received gameStart event:', gameStartData);
    //   console.log('Index: Current players when game starts:', currentPlayers);
    //   setGameState('playing');
    // });

    return () => {
      // socket.off('gameStart');
      socket.off('playersUpdate');
    };
  }, [socket, currentPlayers]);

  const handleStartGame = (playersFromLobby: Player[]) => {
    console.log("Game start requested with players:", playersFromLobby);
    setCurrentPlayers(playersFromLobby);
    setGameState('playing');
  };

  const handleGameEnd = (finalPlayers: Player[]) => {
    setPlayers(finalPlayers);
    setGameState('results');
  };

  const handlePlayAgain = () => {
    setGameState('lobby');
    setPlayers([]);
    setCurrentPlayers([]);
  };

  return (
    <div className="min-h-screen bg-[#1A202C] text-white container mx-auto px-4 py-8">
      {gameState === 'lobby' && <GameLobby onStartGame={handleStartGame} />}
      {gameState === 'playing' && <GamePlay onGameEnd={handleGameEnd} initialPlayers={currentPlayers} />}
      {gameState === 'results' && <GameResults players={players} onPlayAgain={handlePlayAgain} />}
    </div>
  );
};

export default Index;