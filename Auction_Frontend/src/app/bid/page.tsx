"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@mui/material";
import useAuthToken from "@/lib/hooks/useAuthToken";
import { ImageIcon } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import useUserData from "@/lib/hooks/useUserData";
import { useSearchParams } from "next/navigation";
import SlotCounter from "@/components/SlotCounter";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";


// ---------- Types normalized for your UI ----------
interface Team {
  id: number;
  name: string;
  imageUrl: string;
  playerCount: number;
  maxBudget: number;
  remainingBudget: number;
  currentBid: number;
}

interface Player {
  id: number;
  firstname: string;
  lastname?: string;
  role: string;
  age: string;
  photo: string;
  status: "available" | "sold" | "unsold" | string;
  basePrice: number;
  team: string;
  soldPrice: number;
  imageBase64: string;
}

const getTeamImageUrl = (team: Team) => {
  if (team.imageUrl) {
    return `http://localhost:8080${team.imageUrl}`;
  }
  return null;
};

const getPlayerImageUrl = (player: Player) => {
  if (player.photo) {
    return `data:image/jpeg;base64,${player.photo}`;
  }
  return null;
};

export default function BidingPage() {
  const { token } = useAuthToken();
  const { userId } = useUserData();
  const searchParams = useSearchParams();
  
 const auctionIdParam = searchParams.get('auctionId');
 const playerIdParam = searchParams.get('playerId');
  
  const auctionId = auctionIdParam ? Number(auctionIdParam) : NaN;
  const playerId = playerIdParam ? Number(playerIdParam) : NaN;

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
const [showWheel, setShowWheel] = useState(true);


   
  // const auctionId = searchParams.get('auctionId');
  //   const playerId = searchParams.get('playerId');

  // ---------- UI state ----------
  const [activeTab, setActiveTab] = useState<"teams" | "players">("teams");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "available" | "sold" | "unsold"
  >("all");
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>("ALL");
  const [showBidButton, setShowBidButton] = useState<boolean>(true);

  // ---------- Data state ----------
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Fetch teams ----------
  const fetchTeams = async (signal: AbortSignal): Promise<Team[]> => {
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(`${BASE_URL}/teams`, {
      headers,
      signal,
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch teams: ${response.status} ${response.statusText}`
      );
    }

    const rawTeams = await response.json();
    console.log("Raw teams data:", rawTeams); // Debug log

    return (rawTeams || []).map(
      (t: any): Team => ({
        id: Number(t.id),
        name: String(t.name),
        imageUrl: String(t.imageUrl),
        playerCount: Number(t.playersCount),
        maxBudget: Number(t.maxBudget),
        remainingBudget: Number(t.remainingBudget),
        currentBid: Number(t.currentBid),
      })
    );
  };

  // ---------- Fetch players ----------
  const fetchPlayers = async (signal: AbortSignal): Promise<Player[]> => {
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(`${BASE_URL}/players`, {
      headers,
      signal,
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch players: ${response.status} ${response.statusText}`
      );
    }

    const rawPlayers = await response.json();
    console.log("Raw players data:", rawPlayers); // Debug log

    return (rawPlayers || []).map((p: any): Player => {
      const roleRaw = String(p.role).toUpperCase();
      const statusRaw = String(p.status).toLowerCase();

      return {
        id: Number(p.id),
        firstname: String(p.firstname),
        lastname: String(p.lastname),
        role: String(p.role),
        age: Number(p.age).toString(),
        photo: String(p.photoUrl),
        status: statusRaw as Player["status"],
        basePrice: Number(p.basePrice),
        team: String(p.teamName),
        soldPrice: Number(p.soldPrice),
        imageBase64: String(p.imageBase64),
      };
    });
  };

  // ---------- Fetch all data ----------
  useEffect(() => {
    const abortController = new AbortController();

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [teamsData, playersData] = await Promise.all([
          fetchTeams(abortController.signal),
          fetchPlayers(abortController.signal),
        ]);

        setTeams(teamsData);
        setPlayers(playersData);

        console.log(
          `Loaded ${teamsData.length} teams and ${playersData.length} players`
        );
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }

        console.error("Error fetching data:", err);
        setError(err?.message || "Failed to load auction data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      abortController.abort();
    };
  }, [token]);

  // ---------- Derived counts from API data ----------
  const soldCount = useMemo(
    () => players.filter((p) => p.status === "sold" || p.soldPrice > 0).length,
    [players]
  );
  const unsoldCount = useMemo(
    () => players.filter((p) => p.status === "unsold").length,
    [players]
  );
  const availableCount = useMemo(
    () => players.filter((p) => p.status === "available").length,
    [players]
  );

  // ---------- Current player (first available or first player) ----------
  const currentPlayer: Player | undefined = useMemo(() => {
    if (!players.length) return undefined;
    const firstAvailable = players.find((p) => p.status === "available");
    return firstAvailable ?? players[0];
  }, [players]);

  // Normalize ids from URL
const hasValidAuctionId = Number.isFinite(auctionId);
const hasValidPlayerIdFromUrl = Number.isFinite(playerId);

// Choose a player to show: URL > first available > first player
const effectivePlayerId = useMemo(() => {
  if (hasValidPlayerIdFromUrl) return playerId;
  if (currentPlayer?.id) return currentPlayer.id;
  return NaN;
}, [hasValidPlayerIdFromUrl, playerId, currentPlayer]);



  

  const roleFilters = [
    "ALL",
    "BATSMAN",
    "ALLROUNDER",
    "BOWLER",
    "WICKETKEEPER",
  ];

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      let statusMatch = true;
      if (activeFilter === "sold")
        statusMatch = player.status === "sold" || player.soldPrice > 0;
      else if (activeFilter === "unsold")
        statusMatch = player.status === "unsold";
      else if (activeFilter === "available")
        statusMatch = player.status === "available";

      let roleMatch = true;
      if (activeRoleFilter !== "ALL")
        roleMatch = player.role === activeRoleFilter.toUpperCase();

      return statusMatch && roleMatch;
    });
  }, [players, activeFilter, activeRoleFilter]);

  const formatCurrency = (amount: number) => amount.toLocaleString();

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <div className="text-white text-base sm:text-lg md:text-xl">
            Loading auction data...
          </div>
        </div>
      </div>
    );
  }

  // ---------- Error state ----------
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="text-red-400 text-lg sm:text-xl md:text-2xl mb-4">
            ⚠️ Error Loading Data
          </div>
          <div className="text-red-300 mb-4 text-sm sm:text-base md:text-lg">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-2 md:px-8 md:py-3 rounded-lg text-sm sm:text-base md:text-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col md:flex-row"
      style={{ backgroundImage: "url('/bg1.jpg')" }}
    >
      {/* Left Section */}
      <div className="w-full md:w-4/12  p-4 sm:p-5">
        <Card className="bg-blue-300 mb-4 rounded-2xl shadow-lg">
          <CardContent className="bg-blue-900/90 border border-blue-700 flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img
                src="/rensa-logo.png"
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg border-2 border-yellow-400 object-cover shadow-sm"
                alt="Rensa Logo"
              />
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">
                  RENSA BSPL-2
                </h1>
              </div>
            </div>
            <img
              src="/rensa-sponsor.png"
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg border-2 border-yellow-400 object-cover shadow-sm"
              alt="Sponsor Logo"
            />
          </CardContent>
        </Card>

        {/* Current Player Card */}
        {/* {currentPlayer && (
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-700 rounded-xl border border-blue-400 p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="bg-yellow-400 text-black font-bold text-xs sm:text-sm px-2 py-0.5 rounded-tl-xl shadow">
                {currentPlayer.id}
              </div>
              <div className="bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-tr-xl shadow">
                {currentPlayer.role}
              </div>
            </div>

            <div className="flex items-start space-x-2 sm:space-x-3 pl-2 sm:pl-3 mb-2 sm:mb-3">
              <img
                src={currentPlayer.photo}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg border-2 border-yellow-400 object-cover shadow-sm"
                alt={`${currentPlayer.firstname} ${currentPlayer.lastname}`}
              />
              <div className="flex-1">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-yellow-400">
                  {currentPlayer.firstname} {currentPlayer.lastname}
                </h2>
                <div className="space-y-0.5 text-xs sm:text-sm text-gray-200 leading-snug">
                  <p>{currentPlayer.role}</p>
                  <p>AGE: {currentPlayer.age}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-600 to-gray-800 rounded-lg p-2 sm:p-3 ml-2 sm:ml-3 mr-2 sm:mr-3 mb-2 sm:mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-xs sm:text-sm uppercase">
                  Current Price
                </span>
              </div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-300">
                {formatCurrency(
                  currentPlayer.soldPrice || currentPlayer.basePrice || 0
                )}
              </div>
            </div>

            <div className="text-center text-white font-semibold tracking-wide uppercase text-xs sm:text-sm border-t border-gray-700 pt-1 sm:pt-2">
              {currentPlayer.team || "—"}
            </div>
          </div>
        )} */}
<SlotCounter />
<div className="min-h-screen bg-gray-900 py-8">
  <div className="text-center mb-8">
    <h1 className="text-3xl font-bold text-white mb-2">Live Auction</h1>
    <p className="text-gray-400">
      {Number.isFinite(effectivePlayerId) ? `Player #${effectivePlayerId}` : "No player selected"}
    </p>
  </div>

  <div className="flex justify-center items-center">
    {token && hasValidAuctionId && Number.isFinite(effectivePlayerId) ? (
      <PlayerCard
        playerId={effectivePlayerId}
        auctionId={auctionId}
        token={token}
        userId={userId}
      />
    ) : (
      <div className="bg-red-900/50 text-white p-4 rounded-xl w-[400px]">
        {!token && <p>Missing auth token. Please sign in.</p>}
        {!hasValidAuctionId && <p>Missing or invalid <code>auctionId</code> in URL.</p>}
        {!Number.isFinite(effectivePlayerId) && <p>No player to display (none available).</p>}
      </div>
    )}
  </div>
</div>





        {/* Action Button */}
        <div className="flex justify-center pt-2 sm:pt-3">
          <button
            onClick={() => setShowBidButton(!showBidButton)}
            className={`
              w-full sm:w-64 md:w-80 h-12 sm:h-14 md:h-16 
              ${
                showBidButton
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 active:from-green-600 active:to-emerald-700 border-green-300 hover:border-green-200 focus:ring-green-300 hover:shadow-green-500/30 text-white"
                  : "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 active:from-yellow-600 active:to-orange-700 border-yellow-300 hover:border-yellow-200 focus:ring-yellow-300 hover:shadow-yellow-500/30 text-black"
              }
              text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider
              rounded-xl
              shadow-xl hover:shadow-2xl
              transform hover:-translate-y-1 active:translate-y-0
              transition-all duration-200 ease-out
              border-2
              focus:outline-none focus:ring-4
              relative group
              animate-pulse
            `}
          >
            <span className="flex items-center justify-center space-x-2 sm:space-x-3">
              {showBidButton ? (
                <>
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>PLACE BID</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 animate-spin"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>SPIN WHEEL</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-8/12    p-4 sm:p-3">
        {/* Header */}
        <Card className="rounded-2xl shadow-lg border border-blue-700 mb-2 sm:mb-3 m-0 sm:m-4">
          <CardContent className="px-3 py-3 sm:px-4 sm:py-4 bg-blue-900/90">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
              {/* Tabs */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("teams")}
                  className={`px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "teams"
                      ? "bg-orange-400 text-black shadow-lg"
                      : "bg-transparent text-white border border-blue-200 hover:bg-blue-00"
                  }`}
                >
                  TEAMS ({teams.length})
                </button>
                <button
                  onClick={() => setActiveTab("players")}
                  className={`px-4 py-2 sm:px-5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "players"
                      ? "bg-orange-400 text-black shadow-lg"
                      : "bg-transparent text-white border border-blue-200 hover:bg-blue-600"
                  }`}
                >
                  PLAYERS ({players.length})
                </button>
              </div>

              {/* Statistics */}
              {activeTab === "teams" && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg">
                    <span>SOLD:</span>
                    <span>{soldCount}</span>
                  </div>
                  <div className="bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg">
                    <span>UNSOLD:</span>
                    <span>{unsoldCount}</span>
                  </div>
                  <div className="bg-yellow-500 text-black px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg">
                    <span>AVAILABLE:</span>
                    <span>{availableCount}</span>
                  </div>
                </div>
              )}

              {/* Filters for Players */}
              {activeTab === "players" && (
                <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-2">
                  {(["all", "available", "sold", "unsold"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors border border-blue-400 hover:scale-105 ${
                          activeFilter === filter
                            ? "bg-orange-400 text-black shadow-lg"
                            : "bg-blue-800 text-white hover:bg-blue-600"
                        }`}
                      >
                        {filter.toUpperCase()}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Filter for Players */}
        {activeTab === "players" && (
          <Card className=" rounded-2xl shadow-lg border border-blue-700 m-0 sm:m-4 mb-2 sm:mb-3">
            <CardContent className="px-3 py-3 sm:px-4 sm:py-4  bg-blue-900/90">
              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-2">
                <span className="bg-yellow-400 text-black px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-bold">
                  {filteredPlayers.length}
                </span>
                {roleFilters.map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRoleFilter(role)}
                    className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors hover:scale-105 border border-blue-400 ${
                      activeRoleFilter === role
                        ? "bg-orange-400 text-black shadow-lg"
                        : "bg-blue-800 text-white hover:bg-blue-600"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Section */}
        <div className="overflow-hidden m-0  sm:m-4">
          <div className="max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-250px)] overflow-y-auto custom-scroll p-2 sm:p-4">
            {activeTab === "teams" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 ">
                {teams.length === 0 ? (
                  <div className="col-span-full text-center text-white py-6 sm:py-8">
                    <div className="text-white-400 text-sm sm:text-base">
                      No teams found
                    </div>
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="relative w-full rounded-lg shadow-md transition-transform transform hover:scale-105 backdrop-blur-sm bg-blue-600/60 p-3 sm:p-4"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                        {getTeamImageUrl(team) ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-gray-300 shadow-md">
                            <img
                              src={getTeamImageUrl(team)!}
                              alt={team.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-300 shadow-md">
                            <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm sm:text-base md:text-base font-bold text-white">
                            {team.name}
                          </h3>

                          <div className="text-sm sm:text-base md:text-base  font-bold text-yellow-400 pt-1">
                            {team.playerCount} Players
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm sm:text-base md:text-base  font-bold text-yellow-400">
                            ₹{formatCurrency(team.currentBid)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-300">
                            Max ₹{formatCurrency(team.maxBudget)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            Remaining ₹{formatCurrency(team.remainingBudget)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "players" && (
              <div className="max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto custom-scroll p-1 sm:p-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {filteredPlayers.length === 0 ? (
                    <div className="col-span-full text-center text-white py-6 sm:py-8">
                      <div className="text-gray-400 text-sm sm:text-base">
                        No players found for the selected filters
                      </div>
                    </div>
                  ) : (
                    filteredPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className={`relative w-full rounded-lg shadow-md transition-transform transform hover:scale-105 backdrop-blur-sm  ${
                          player.status === "sold"
                            ? "bg-green-600/60 "
                            : player.status === "unsold"
                            ? "bg-red-600/80"
                            : "bg-blue-600/60 "
                        }`}
                      >
                        <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs sm:text-sm font-bold rounded-tl-lg px-2 py-1 shadow">
                          {index + 1}
                        </div>
                        <div
                          className={`absolute top-0 right-0 text-white text-xs sm:text-sm font-bold rounded-tr-lg px-2 py-1 shadow ${
                            player.status === "sold"
                              ? "bg-green-600"
                              : player.status === "unsold"
                              ? "bg-red-600"
                              : "bg-orange-500"
                          }`}
                        >
                          {player.status.toUpperCase()}
                        </div>
                        <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 pt-6 sm:pt-8 md:pt-8">
                          <div className="w-16 h-16 sm:w-15 sm:h-15 md:w-18 md:h-18 rounded-xl overflow-hidden border-2 border-gray-300 shadow-md flex-shrink-0">
                            <img
                              src={player.imageBase64}
                              alt={`${player.firstname} ${player.lastname}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm md:text-sm font-semibold text-yellow-400 uppercase leading-tight break-words">
                              {player.firstname}
                            </h3>

                            <div className="text-xs sm:text-sm text-white leading-tight mt-1">
                              {player.role && <p>Role: {player.role}</p>}
                              <p>Age: {player.age}</p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`absolute bottom-0 left-0 w-full text-xs sm:text-sm font-bold ${
                            player.status === "sold"
                              ? "bg-green-600 text-white py-1 px-2"
                              : ""
                          }`}
                        >
                          {player.status === "sold" ? (
                            <div className="flex justify-between">
                              <span className="truncate">{player.team}</span>
                              <span className="text-yellow-200">
                                ₹{formatCurrency(player.soldPrice)}
                              </span>
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
