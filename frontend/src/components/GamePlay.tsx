import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Player } from "@/types/game";
import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/lib/socket";

interface GamePlayProps {
  onGameEnd: (players: Player[]) => void;
  initialPlayers: Player[]; // Add this prop
}

export const GamePlay = ({ onGameEnd, initialPlayers }: GamePlayProps) => {
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [players, setPlayers] = useState<Player[]>(initialPlayers); // Use initial players
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const gameStarted = useRef(false); // Prevent multiple starts

  // Start the game immediately when component mounts
  useEffect(() => {
    if (gameStarted.current) return;
    gameStarted.current = true;

    console.log("GamePlay: Starting countdown...");
    
    // Start 5 second countdown immediately
    let count = 5;
    setCountdown(count);
    setGameActive(false);
    
    countdownTimer.current = setInterval(() => {
      count--;
      setCountdown(count);
      console.log("Countdown:", count);
      
      if (count <= 0) {
        clearInterval(countdownTimer.current!);
        
        // Start the actual game
        console.log("GamePlay: Starting game!");
        setGameActive(true);
        setTimeRemaining(15);
        
        // 15 second game timer
        let gameTime = 15;
        gameTimer.current = setInterval(() => {
          gameTime--;
          setTimeRemaining(gameTime);
          
          if (gameTime <= 0) {
            clearInterval(gameTimer.current!);
            // Game ends naturally after 15 seconds
          }
        }, 1000);
      }
    }, 1000);
  }, []); // Only run once

  useEffect(() => {
    if (!socket) return;

    // Only listen for game updates, not game start
    socket.on("playersUpdate", (updatedPlayers: Player[]) => {
      console.log("GamePlay: Players update received");
      const playersWithSelf = updatedPlayers.map(player => ({
        ...player,
        isSelf: player.id === socket.id
      }));
      setPlayers(playersWithSelf);
    });

    socket.on("tapsUpdate", ({ playerId, taps }) => {
      console.log("GamePlay: Tap update received", playerId, taps);
      setPlayers((prev) =>
        prev.map((player) =>
          player.id === playerId ? { ...player, taps } : player
        )
      );
    });

    socket.on("gameEnd", ({ results }) => {
      console.log("GamePlay: Game end received");
      setGameActive(false);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (gameTimer.current) clearInterval(gameTimer.current);
      onGameEnd(results);
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("tapsUpdate");
      socket.off("gameEnd");
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (gameTimer.current) clearInterval(gameTimer.current);
    };
  }, [socket, onGameEnd]);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || !socket) return;
      
      const key = e.key.toLowerCase();
      const selfPlayer = players.find((p) => p.isSelf && p.key === key);
      
      if (selfPlayer) {
        console.log("GamePlay: Tap registered for key:", key);
        socket.emit("tap");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, players, socket]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        {!gameActive ? (
          <div className="text-6xl font-bold text-[#8B5CF6]">{countdown}</div>
        ) : (
          <>
            <div className="text-4xl font-bold text-[#06B6D4] mb-2">{timeRemaining}s</div>
            <Progress value={(timeRemaining / 15) * 100} className="h-2 bg-[#4A5568]" />
          </>
        )}
      </div>

      <div className="text-center bg-[#2D3748] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">
          {!gameActive ? "Get ready!" : "TAP YOUR KEY!"}
        </h2>
        <p className="text-gray-300">
          {!gameActive
            ? `Game starts in ${countdown} seconds...`
            : "Press your assigned key repeatedly!"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {players.map((player) => (
          <Card
            key={player.id}
            className={`bg-[#2D3748] border-2 ${
              player.isSelf ? "border-[#D946EF]" : "border-[#4A5568]"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {player.name} {player.isSelf ? "(You)" : ""}
                  </p>
                  <div className="mt-1 inline-block px-2 py-1 bg-[#1A202C] rounded text-xs">
                    Key: {player.key}
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#06B6D4]">{player.taps}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};