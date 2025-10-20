import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const PlayerControls = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([30]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={progress}
          onValueChange={setProgress}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1:23</span>
          <span>3:45</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon">
          <Shuffle className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-12 w-12">
          <SkipBack className="h-6 w-6" />
        </Button>
        
        <Button
          size="icon"
          className="h-16 w-16 rounded-full music-gradient"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 fill-white" />
          ) : (
            <Play className="h-8 w-8 fill-white ml-1" />
          )}
        </Button>
        
        <Button variant="ghost" size="icon" className="h-12 w-12">
          <SkipForward className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <Repeat className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default PlayerControls;
