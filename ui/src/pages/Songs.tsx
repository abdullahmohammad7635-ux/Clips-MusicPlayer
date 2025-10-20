import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SongCard from "@/components/SongCard";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import album1 from "@/assets/album1.jpg";
import album2 from "@/assets/album2.jpg";
import album3 from "@/assets/album3.jpg";
import album4 from "@/assets/album4.jpg";

const Songs = () => {
  const navigate = useNavigate();

  const songs = [
    {
      id: 1,
      title: "Neon Dreams",
      artist: "Electric Pulse",
      album: "Synthwave Nights",
      duration: "3:45",
      coverUrl: album1,
    },
    {
      id: 2,
      title: "Golden Hour",
      artist: "The Wanderers",
      album: "Sunset Sessions",
      duration: "4:12",
      coverUrl: album2,
    },
    {
      id: 3,
      title: "Urban Flow",
      artist: "Street Poets",
      album: "City Beats",
      duration: "3:28",
      coverUrl: album3,
    },
    {
      id: 4,
      title: "Midnight Clouds",
      artist: "Lofi Collective",
      album: "Chill Vibes",
      duration: "5:03",
      coverUrl: album4,
    },
    {
      id: 5,
      title: "Digital Paradise",
      artist: "Electric Pulse",
      album: "Synthwave Nights",
      duration: "3:55",
      coverUrl: album1,
    },
    {
      id: 6,
      title: "Sunset Drive",
      artist: "The Wanderers",
      album: "Sunset Sessions",
      duration: "4:20",
      coverUrl: album2,
    },
  ];

  return (
    <div className="min-h-screen pb-24 px-4">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-6 mb-6">
        <h1 className="text-3xl font-bold mb-4 music-gradient bg-clip-text text-transparent">
          My Library
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search songs, artists..."
            className="pl-10 bg-secondary border-none"
          />
        </div>
      </header>

      <section className="space-y-1 animate-fade-in">
        {songs.map((song) => (
          <SongCard
            key={song.id}
            {...song}
            onPlay={() => navigate("/player")}
          />
        ))}
      </section>

      <BottomNav />
    </div>
  );
};

export default Songs;
