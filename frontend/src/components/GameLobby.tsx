import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/types/game";
import { X } from "lucide-react";
import { useSocket } from "@/lib/socket";

interface GameLobbyProps {
  onStartGame: (players: Player[]) => void; // Changed: now passes players
}

export const GameLobby = ({ onStartGame }: GameLobbyProps) => {
  const { socket, isConnected } = useSocket();
  const [playerName, setPlayerName] = useState("");
  const [playerKey, setPlayerKey] = useState("");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!socket) {
      console.log('GameLobby: Socket is not available yet.');
      return;
    }

    console.log('GameLobby: Setting up socket listeners.');

    socket.on('playersUpdate', (updatedPlayers: Player[]) => {
      console.log('GameLobby: Received players update:', updatedPlayers);
      
      // Ensure all players have valid data and log invalid ones
      const validPlayers = updatedPlayers.filter(player => {
        const isValid = player && 
                      typeof player.id === 'string' && // Check id type
                      typeof player.name === 'string' && 
                      typeof player.key === 'string' && // Check key type
                      typeof player.taps === 'number' && // Check taps type
                      typeof player.isReady === 'boolean'; // Check isReady type

        if (!isValid) {
          console.warn('GameLobby: Filtering out invalid player data:', player);
        }
        return isValid;
      });
      
      console.log('GameLobby: Valid players after initial filter:', validPlayers);

      // Mark the current player as self
      const playersWithSelf = validPlayers.map(player => ({
        ...player,
        isSelf: player.id === socket.id
      }));
      
      console.log('GameLobby: Processed players for rendering:', playersWithSelf);
      setPlayers(playersWithSelf);
    });

    socket.on('gameStart', (gameStartData) => {
      console.log('GameLobby: Received gameStart event:', gameStartData);
      console.log('GameLobby: Current players when game starts:', players);
      onStartGame(players); // Changed: pass current players
    });

    socket.on('connect', () => {
        console.log('GameLobby: Socket connected.');
    });

    socket.on('disconnect', (reason) => {
        console.log('GameLobby: Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('GameLobby: Socket connection error:', error);
    });

    return () => {
      console.log('GameLobby: Cleaning up socket listeners.');
      socket.off('playersUpdate');
      socket.off('gameStart');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket, onStartGame, players]); // Added players to dependency array

  // Add a new player
  const addPlayer = () => {
    if (!socket) {
      setError("Not connected to server");
      return;
    }

    if (!playerName.trim()) {
      setError("Please enter a name");
      return;
    }

    if (!playerKey.trim()) {
      setError("Please choose a key");
      return;
    }

    if (players.some(p => p.key === playerKey)) {
      setError("This key is already taken");
      return;
    }

    const playerData = {
      name: playerName.trim(),
      key: playerKey.toLowerCase()
    };

    console.log('Adding player:', playerData);
    socket.emit('join', playerData);
    setError("");
  };

  // Toggle player ready state
  const toggleReady = () => {
    if (!socket) {
      setError("Not connected to server");
      return;
    }
    socket.emit('ready');
    // The UI will update when the server sends the playersUpdate event
  };

  // Handle key input for the player's key choice
  const handleKeyInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    // Filter out keys that wouldn't be good for the game
    const key = e.key.toLowerCase();
    if (key.length === 1 && /[a-z0-9]/.test(key)) {
      setPlayerKey(key);
    }
  };

  // Handle name input
  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
  };

  // Check if all players are ready
  const allPlayersReady = players.length > 0 && players.every(player => player.isReady);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-[#2D3748] border-[#4A5568]">
        <CardHeader>
          <CardTitle className="text-2xl">Game Lobby</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Add Player</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Player Name</label>
                  <Input
                    value={playerName}
                    onChange={handleNameInput}
                    className="bg-[#1A202C] border-[#4A5568] text-white"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tap Key</label>
                  <Input
                    value={playerKey}
                    onKeyDown={handleKeyInput}
                    className="bg-[#1A202C] border-[#4A5568] text-white"
                    placeholder="Press a key"
                    readOnly
                  />
                </div>
              </div>
              {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
              <Button
                onClick={addPlayer}
                className="mt-4 w-full md:w-auto bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] hover:opacity-90"
                disabled={!isConnected}
              >
                Add Player
              </Button>
            </div>

            {players.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Players</h3>
                <div className="space-y-2">
                  {players.map(player => {
                    // Add defensive check
                    if (!player || typeof player.name !== 'string') {
                      console.error('GameLobby: Filtering out invalid player data in map:', player);
                      return null;
                    }

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-3 rounded-md border bg-[#1A202C] text-white ${
                          player.isReady 
                            ? "border-green-500" 
                            : "border-[#4A5568]"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8B5CF6] text-white">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{player.name} {player.isSelf && "(You)"}</p>
                            <p className="text-sm text-gray-400">Key: <span className="uppercase font-bold text-white">{player.key}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {player.isSelf && (
                            <Button
                              onClick={toggleReady}
                              variant={player.isReady ? "destructive" : "secondary"}
                              size="sm"
                              disabled={!isConnected}
                            >
                              {player.isReady ? "Not Ready" : "Ready"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-[#4A5568] pt-4">
          <div className="text-sm text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </CardFooter>
      </Card>

      <Card className="bg-[#2D3748] border-[#4A5568]">
        <CardHeader>
          <CardTitle className="text-xl">How to Play</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Add yourself as a player with a name and tap key</li>
            <li>Mark yourself as ready when you're prepared to play</li>
            <li>When the game starts, rapidly tap your chosen key as fast as possible</li>
            <li>The player with the most taps in 15 seconds wins!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};