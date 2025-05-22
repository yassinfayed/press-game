import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/types/game";
import { useSocket } from "@/lib/socket";

interface GameResultsProps {
  players: Player[];
  onPlayAgain: () => void;
}

export const GameResults = ({ players, onPlayAgain }: GameResultsProps) => {
  const { socket } = useSocket();
  
  // Sort players by taps (highest first) - changed from score to taps
  const sortedPlayers = [...players].sort((a, b) => b.taps - a.taps);
  
  // Determine winners (in case of a tie)
  const highestScore = sortedPlayers.length > 0 ? sortedPlayers[0].taps : 0;
  const winners = sortedPlayers.filter(p => p.taps === highestScore);

  const handlePlayAgain = () => {
    onPlayAgain();
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-[#2D3748] border-[#4A5568]">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold">
            Game Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length > 0 && (
            <div className="text-center mb-6 p-4 bg-gradient-to-r from-[#8B5CF6]/20 to-[#D946EF]/20 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">
                {winners.length === 1 
                  ? `🏆 ${winners[0].name} Wins! 🏆` 
                  : "🤝 It's a Tie! 🤝"}
              </h3>
              <p className="text-gray-300">
                {winners.length === 1 
                  ? `With an amazing ${highestScore} taps!`
                  : `${winners.length} players tied with ${highestScore} taps!`}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center p-4 rounded-lg ${
                  player.taps === highestScore
                    ? "bg-gradient-to-r from-[#8B5CF6]/20 to-[#D946EF]/20 border border-[#8B5CF6]"
                    : "bg-[#1A202C] border border-[#4A5568]"
                }`}
              >
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-xl font-bold ${
                  player.taps === highestScore
                    ? "bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] text-white"
                    : "bg-[#2D3748] border border-[#4A5568] text-gray-300"
                }`}>
                  {index === 0 && player.taps === highestScore ? "👑" : index + 1}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <p className="font-semibold">{player.name}</p>
                    {player.isSelf && <span className="ml-2 text-sm text-gray-400">(You)</span>}
                    {player.taps === highestScore && <span className="ml-2 text-sm text-yellow-400 font-bold">WINNER!</span>}
                  </div>
                  <p className="text-sm text-gray-400">Key: <span className="uppercase font-bold">{player.key}</span></p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-3xl font-bold text-[#06B6D4]">
                    {player.taps}
                  </div>
                  <div className="text-xs text-gray-400">
                    {(player.taps / 15).toFixed(1)} per sec
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] hover:opacity-90 px-8 py-6 text-lg"
          >
            Play Again
          </Button>
        </CardFooter>
      </Card>

      <Card className="bg-[#2D3748] border-[#4A5568]">
        <CardHeader>
          <CardTitle className="text-xl">📊 Game Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPlayers.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#1A202C] rounded-lg">
                <h4 className="font-semibold mb-1 text-sm text-gray-400">Average Taps</h4>
                <p className="text-2xl font-bold text-[#06B6D4]">
                  {Math.round(sortedPlayers.reduce((acc, p) => acc + p.taps, 0) / sortedPlayers.length)}
                </p>
              </div>
              <div className="text-center p-3 bg-[#1A202C] rounded-lg">
                <h4 className="font-semibold mb-1 text-sm text-gray-400">Winner's TPS</h4>
                <p className="text-2xl font-bold text-[#06B6D4]">
                  {(highestScore / 15).toFixed(1)}
                </p>
              </div>
              <div className="text-center p-3 bg-[#1A202C] rounded-lg">
                <h4 className="font-semibold mb-1 text-sm text-gray-400">Total Taps</h4>
                <p className="text-2xl font-bold text-[#06B6D4]">
                  {sortedPlayers.reduce((acc, p) => acc + p.taps, 0)}
                </p>
              </div>
              <div className="text-center p-3 bg-[#1A202C] rounded-lg">
                <h4 className="font-semibold mb-1 text-sm text-gray-400">Players</h4>
                <p className="text-2xl font-bold text-[#06B6D4]">
                  {sortedPlayers.length}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center">No stats available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};