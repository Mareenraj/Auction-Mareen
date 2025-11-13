"use client";

import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import toast from 'react-hot-toast';

interface Player {
  id: number;
  name: string;
  role: string;
  basePrice: number;
  picture: string;
  status: "available" | "sold" | "unsold";
}

interface BidResponse {
  bidAmount: number;
  teamName: string;
}

interface PlayerCardProps {
  playerId: number;
  auctionId: number;
  token: string;
  userId: number;
}

let stompClient: Client | null = null;

export default function PlayerCard({
  playerId,
  auctionId,
  token,
  userId,
}: PlayerCardProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch player details
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setError(null);
        const res = await fetch(`http://localhost:8080/players/${playerId}`, {
          headers: { Authorization: `Bearer ${token}`},
        });

        if (!res.ok) throw new Error("Failed to fetch player");

        const data = await res.json();
        

        const mapped: Player = {
          id: data.id,
          name: `${data.firstname} ${data.lastname}`,
          role: data.typeOfSportCategory,
          basePrice: data.bidAmount ?? data.minimumBid ?? 0,
          picture: data.imageBase64,
          status: data.playerStatus.toLowerCase() as "available" | "sold" | "unsold",
        };

        setPlayer(mapped);
        setCurrentBid(mapped.basePrice);
      } catch (err) {
        console.error("Error fetching player:", err);
        setError("Failed to load player data");
      }
    };

    fetchPlayer();
  }, [playerId, token]);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    const socket = new SockJS("http://localhost:8080/ws-auction");

    stompClient = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        stompClient?.subscribe(
          `/topic/auction/${auctionId}/player/${playerId}`,
          (message) => {
            if (message.body) {
              const bid: BidResponse = JSON.parse(message.body);
              setCurrentBid(bid.bidAmount);
              setCurrentTeam(bid.teamName);
            }
          }
        );
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("Broker error:", frame.headers["message"], frame.body);
        setIsConnected(false);
      },
    });

    stompClient.activate();

    return () => {
      stompClient?.deactivate();
      setIsConnected(false);
    };
  }, [playerId, auctionId, token]);

  // Place bid
  const placeBid = () => {
  if (!stompClient || !stompClient.connected) {
    toast.error("WebSocket is not connected. Please refresh the page.");
    return;
  }

  setBidLoading(true);
  try {
    const payload = { userId };
    stompClient.publish({
      destination: `/app/bid/${auctionId}/${playerId}`,
      body: JSON.stringify(payload),
    });
    toast.success("Bid placed successfully!");
  } catch (error) {
    console.error("Error placing bid:", error);
    toast.error("Failed to place bid. Please try again.");
  } finally {
    setBidLoading(false);
  }
};

  if (error) {
    return (
      <div className="bg-red-900/50 text-white p-4 rounded-xl w-[400px]">
        <p>{error}</p>
      </div>
    );
  }

  if (!player) return <p className="text-white">Loading player...</p>;

  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-4 rounded-xl shadow-lg w-[400px]">
      {/* Connection Status */}
      <div className="flex justify-between items-center mb-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <div className="flex items-center">
        <img
          src={player.picture}
          alt={player.name}
          className="w-20 h-20 rounded-lg object-cover mr-4"
        />
        <div>
          <h2 className="text-xl font-bold">{player.name}</h2>
          <p>{player.role}</p>
          <p>Status: {player.status}</p>
        </div>
      </div>

      {/* Current Bid */}
      <div className="mt-4 bg-black/40 p-3 rounded-lg">
        <p className="text-sm">CURRENT BID</p>
        <p className="text-lg font-bold">
          {currentBid ?? player.basePrice}{" "}
          {currentTeam && <span>by Team: {currentTeam}</span>}
        </p>
      </div>

      {/* Bid Button */}
      {player.status === "available" && (
        <button
          onClick={placeBid}
          disabled={bidLoading || !isConnected}
          className={`mt-4 px-4 py-2 rounded-lg w-full ${bidLoading || !isConnected
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
        >
          {bidLoading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      )}
    </div>
  );
}