// src/hooks/useAuctionApi.ts
import { useState, useCallback } from 'react';
import { Player, Team, Auction, Bid, ApiResponse } from '@/models/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useAuctionApi = (auctionId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(async <T>(
    request: () => Promise<Response>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request();
      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('API request failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuctionDetails = useCallback(async () => {
    return handleRequest<{
      auction: Auction;
      players: Player[];
      teams: Team[];
      currentPlayer?: Player;
      highestBid?: Bid;
      recentBids: Bid[];
    }>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}`)
    );
  }, [auctionId, handleRequest]);

  const fetchPlayers = useCallback(async () => {
    return handleRequest<Player[]>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}/players`)
    );
  }, [auctionId, handleRequest]);

  const fetchTeams = useCallback(async () => {
    return handleRequest<Team[]>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}/teams`)
    );
  }, [auctionId, handleRequest]);

  const placeBid = useCallback(async (playerId: string, teamId: string, amount: number) => {
    return handleRequest<Bid>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, teamId, amount }),
      })
    );
  }, [auctionId, handleRequest]);

  const allocatePlayer = useCallback(async (playerId: string, teamId: string, adminId: string) => {
    return handleRequest<{
      player: Player;
      team: Team;
    }>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}/players/${playerId}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, adminId }),
      })
    );
  }, [auctionId, handleRequest]);

  const markPlayerUnsold = useCallback(async (playerId: string, adminId: string) => {
    return handleRequest<Player>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}/players/${playerId}/unsold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId }),
      })
    );
  }, [auctionId, handleRequest]);

  const triggerWheelSpin = useCallback(async (adminId: string) => {
    return handleRequest<{ selectedPlayerId: string }>(() =>
      fetch(`${API_BASE}/auctions/${auctionId}/wheel/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId }),
      })
    );
  }, [auctionId, handleRequest]);

  const fetchBidHistory = useCallback(async (playerId?: string) => {
    const url = playerId 
      ? `${API_BASE}/auctions/${auctionId}/bids?playerId=${playerId}`
      : `${API_BASE}/auctions/${auctionId}/bids`;
    
    return handleRequest<Bid[]>(() => fetch(url));
  }, [auctionId, handleRequest]);

  return {
    loading,
    error,
    fetchAuctionDetails,
    fetchPlayers,
    fetchTeams,
    placeBid,
    allocatePlayer,
    markPlayerUnsold,
    triggerWheelSpin,
    fetchBidHistory,
  };
};