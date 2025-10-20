import { Heart, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayerControls from "@/components/PlayerControls";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import album1 from "@/assets/album1.jpg";

const Player = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 px-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between py-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
        <span className="text-sm text-muted-foreground">Now Playing</span>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </header>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="relative w-full max-w-sm aspect-square animate-slide-up">
          <div className="absolute inset-0 music-gradient blur-3xl opacity-40 rounded-full" />
          <img
            src={album1}
            alt="Album Cover"
            className="relative w-full h-full rounded-3xl shadow-2xl object-cover"
          />
        </div>
      </div>

      {/* Song Info */}
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Neon Dreams</h1>
            <p className="text-lg text-muted-foreground">Electric Pulse</p>
          </div>
          <Button variant="ghost" size="icon" className="mt-2">
            <Heart className="h-6 w-6" />
          </Button>
        </div>

        {/* Controls */}
        <PlayerControls />
      </div>

      <BottomNav />
    </div>
  );
};

export default Player;
