import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import type { LeaderboardEntry } from "../types";

const TABS = ["This Week", "This Month", "All Time"];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-green-600", "bg-blue-600", "bg-purple-600",
  "bg-red-500", "bg-amber-500", "bg-pink-600",
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState("All Time");

  useEffect(() => {
    client.get("/leaderboard/").then((r) => setEntries(r.data));
  }, [activeTab]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="pb-24">
      <div className="px-4 py-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">Leaderboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 px-6 py-6 bg-gradient-to-b from-green-50 to-white">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[1]} text-white flex items-center justify-center font-bold text-sm`}>
              {getInitials(top3[1]?.full_name)}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-1 max-w-16 text-center truncate">{top3[1]?.full_name?.split(" ")[0]}</p>
            <p className="text-xs text-gray-500">{top3[1]?.points} pts</p>
            <div className="w-16 h-12 bg-gray-300 rounded-t-md mt-2 flex items-center justify-center text-gray-600 font-bold">2</div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[0]} text-white flex items-center justify-center font-bold`}>
              {getInitials(top3[0]?.full_name)}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-1 max-w-16 text-center truncate">{top3[0]?.full_name?.split(" ")[0]}</p>
            <p className="text-xs text-gray-500">{top3[0]?.points} pts</p>
            <div className="w-16 h-16 bg-amber-400 rounded-t-md mt-2 flex items-center justify-center text-white font-bold">1</div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[2]} text-white flex items-center justify-center font-bold text-sm`}>
              {getInitials(top3[2]?.full_name)}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-1 max-w-16 text-center truncate">{top3[2]?.full_name?.split(" ")[0]}</p>
            <p className="text-xs text-gray-500">{top3[2]?.points} pts</p>
            <div className="w-16 h-10 bg-amber-700 rounded-t-md mt-2 flex items-center justify-center text-white font-bold">3</div>
          </div>
        </div>
      )}

      {/* Ranked list */}
      <div className="px-4 space-y-2 mt-2">
        {rest.map((entry, i) => {
          const isMe = entry.id === user?.id;
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-lg p-3 border ${
                isMe ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              }`}
            >
              <span className="text-sm font-semibold text-gray-400 w-5">{entry.rank}</span>
              <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white flex items-center justify-center text-xs font-bold`}>
                {getInitials(entry.full_name)}
              </div>
              <span className={`flex-1 text-sm font-medium ${isMe ? "text-green-700" : "text-gray-800"}`}>
                {entry.full_name} {isMe && "(You)"}
              </span>
              <span className="text-sm font-semibold text-amber-500">{entry.points} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
