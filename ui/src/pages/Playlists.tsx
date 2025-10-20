import { Plus, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import album1 from "@/assets/album1.jpg";
import album2 from "@/assets/album2.jpg";
import album3 from "@/assets/album3.jpg";
import album4 from "@/assets/album4.jpg";

const Playlists = () => {
  const playlists = [
    {
      id: 1,
      name: "Workout Mix",
      songCount: 24,
      coverUrl: album1,
    },
    {
      id: 2,
      name: "Chill Vibes",
      songCount: 18,
      coverUrl: album4,
    },
    {
      id: 3,
      name: "Road Trip",
      songCount: 32,
      coverUrl: album2,
    },
    {
      id: 4,
      name: "Focus Mode",
      songCount: 15,
      coverUrl: album3,
    },
  ];

  return (
    <div className="min-h-screen pb-24 px-4">
      <header className="py-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold music-gradient bg-clip-text text-transparent">
            Playlists
          </h1>
          <Button size="icon" className="music-gradient rounded-full">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="glass rounded-2xl p-4 smooth-transition hover:scale-105 cursor-pointer"
          >
            <div className="relative w-full aspect-square mb-3">
              <img
                src={playlist.coverUrl}
                alt={playlist.name}
                className="w-full h-full rounded-xl object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
            </div>
            <h3 className="font-semibold mb-1 truncate">{playlist.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Music2 className="h-3 w-3" />
              {playlist.songCount} songs
            </p>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Playlists;
