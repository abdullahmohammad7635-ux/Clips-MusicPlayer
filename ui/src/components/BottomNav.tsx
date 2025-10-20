import { Link, useLocation } from "react-router-dom";
import { Music, Play, ListMusic } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Music, label: "Songs" },
    { path: "/player", icon: Play, label: "Player" },
    { path: "/playlists", icon: ListMusic, label: "Playlists" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 smooth-transition ${
                isActive ? "text-primary scale-110" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "animate-pulse-slow" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
