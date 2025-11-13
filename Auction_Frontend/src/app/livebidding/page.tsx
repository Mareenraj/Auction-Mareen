"use client";

import { useEffect, useState } from "react";
import PlayerCard from "@/components/PlayerCard";
import useAuthToken from "@/lib/hooks/useAuthToken";
import useUserData from "@/lib/hooks/useUserData";
import { useRouter, useSearchParams } from "next/navigation";

const Page = () => {
  const { token, clearToken } = useAuthToken();
  const { userId } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  
     const auctionIdParam = searchParams.get('auctionId');
  const playerIdParam = searchParams.get('playerId');
  
  const auctionId = auctionIdParam ? Number(auctionIdParam) : NaN;
  const playerId = playerIdParam ? Number(playerIdParam) : NaN;

  useEffect(() => {
    setLoading(false);
  }, [token, userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !userId) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">⚠️ Please log in to access live bidding</p>
          <button
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

 

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Live Auction</h1>
        <p className="text-gray-400">Player #{playerId}</p>
      </div>
      <div className="flex justify-center items-center">
        <PlayerCard
          playerId={playerId}
          auctionId={auctionId}
          token={token}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default Page;