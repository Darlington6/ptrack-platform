import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] || user?.username || "User";
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <span className="text-xl font-bold text-green-600">pTrack</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Hi, {firstName}</span>
        <button className="relative p-1 text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
