import { Play, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SongCardProps {
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
  onPlay?: () => void;
}

const SongCard = ({ title, artist, album, duration, coverUrl, onPlay }: SongCardProps) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg smooth-transition hover:bg-secondary/50 group">
      <div className="relative w-14 h-14 flex-shrink-0">
        <img
          src={coverUrl}
          alt={album}
          className="w-full h-full rounded-md object-cover"
        />
        <button
          onClick={onPlay}
          className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center"
        >
          <Play className="h-6 w-6 text-white fill-white" />
        </button>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{title}</h3>
        <p className="text-sm text-muted-foreground truncate">{artist}</p>
      </div>
      
      <span className="text-sm text-muted-foreground">{duration}</span>
      
      <Button variant="ghost" size="icon" className="flex-shrink-0">
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default SongCard;
