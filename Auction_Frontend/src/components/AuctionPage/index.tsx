// src/components/AuctionPage/index.tsx
import React, { useState, useEffect } from 'react';
import { Player, Team, Auction, Bid, UserRole, AuctionState, WheelSpinState } from '@/models/types';

// Component imports
import Wheel from '../Wheel/Wheel';
import CurrentPlayerCard from '../CurrentPlayer/CurrentPlayerCard';
import BidInput from '../CurrentPlayer/BidInput';
import RecentBids from '../CurrentPlayer/RecentBids';
import { AdminSpinButton } from '../AdminControls/AdminSpinButton';
import { useAuctionSocket } from '@/lib/hooks/useAuctionSocket';
import { useAuctionApi } from '@/lib/hooks/useAuctionApi';
import FinalizeAllocate from '../AdminControls/FinalizeAllocate';

interface AuctionPageProps {
  auctionId: string;
  userRole: UserRole;
}

const AuctionPage: React.FC<AuctionPageProps> = ({ auctionId, userRole }) => {
  // State management
  const [auctionState, setAuctionState] = useState<AuctionState>({
    auction: {
      id: auctionId,
      name: '',
      status: 'draft',
      bidIncrement: 500,
      soldCount: 0,
      unsoldCount: 0,
      totalPlayers: 0,
    },
    players: [],
    teams: [],
    recentBids: [],
    wheelSpinState: {
      isSpinning: false,
    },
  });

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  // API hook
  const {
    loading: apiLoading,
    error: apiError,
    fetchAuctionDetails,
    placeBid: apiPlaceBid,
    allocatePlayer: apiAllocatePlayer,
    markPlayerUnsold: apiMarkPlayerUnsold,
  } = useAuctionApi(auctionId);

  // WebSocket event handlers
  const handleWheelSpinStart = () => {
    setAuctionState(prev => ({
      ...prev,
      wheelSpinState: {
        isSpinning: true,
        selectedPlayerId: undefined,
        spinStartTime: Date.now(),
      },
    }));
  };

  const handleWheelSpinEnd = (playerId: string, playerName: string) => {
    setAuctionState(prev => ({
      ...prev,
      auction: {
        ...prev.auction,
        currentPlayerId: playerId,
      },
      wheelSpinState: {
        isSpinning: false,
        selectedPlayerId: playerId,
      },
      // Clear previous bids when new player is selected
      recentBids: prev.recentBids.filter(bid => bid.playerId === playerId),
    }));
  };

  const handleNewBid = (bid: Bid) => {
    setAuctionState(prev => ({
      ...prev,
      highestBid: bid,
      recentBids: [bid, ...prev.recentBids.filter(b => b.id !== bid.id)],
    }));
  };

  const handleBidUpdate = (playerId: string, highestBid: Bid) => {
    setAuctionState(prev => ({
      ...prev,
      highestBid: playerId === prev.auction.currentPlayerId ? highestBid : prev.highestBid,
    }));
  };

  const handlePlayerAllocated = (playerId: string, teamId: string, newTeamPlayerCount: number) => {
    setAuctionState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, status: 'sold', teamId } : p
      ),
      teams: prev.teams.map(t => 
        t.id === teamId ? { ...t, playerCount: newTeamPlayerCount } : t
      ),
      auction: {
        ...prev.auction,
        soldCount: prev.auction.soldCount + 1,
        currentPlayerId: undefined,
      },
      highestBid: undefined,
      recentBids: [],
    }));
  };

  const handlePlayerUnsold = (playerId: string) => {
    setAuctionState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, status: 'unsold' } : p
      ),
      auction: {
        ...prev.auction,
        unsoldCount: prev.auction.unsoldCount + 1,
        currentPlayerId: undefined,
      },
      highestBid: undefined,
      recentBids: [],
    }));
  };

  const handlePlayersUpdate = (players: Player[]) => {
    setAuctionState(prev => ({
      ...prev,
      players,
    }));
  };

  const handleAuctionStateUpdate = (auction: Auction, currentPlayer?: Player) => {
    setAuctionState(prev => ({
      ...prev,
      auction,
      currentPlayer,
    }));
  };

  // WebSocket hook
  const {
    isConnected,
    connectionError,
    spinWheel,
    placeBid: socketPlaceBid,
    allocatePlayer: socketAllocatePlayer,
    markPlayerUnsold: socketMarkPlayerUnsold,
  } = useAuctionSocket({
    auctionId,
    userId: userRole.id,
    onWheelSpinStart: handleWheelSpinStart,
    onWheelSpinEnd: handleWheelSpinEnd,
    onNewBid: handleNewBid,
    onBidUpdate: handleBidUpdate,
    onPlayerAllocated: handlePlayerAllocated,
    onPlayerUnsold: handlePlayerUnsold,
    onPlayersUpdate: handlePlayersUpdate,
    onAuctionStateUpdate: handleAuctionStateUpdate,
  });

  // Update connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
      setError(null);
    } else if (connectionError) {
      setConnectionStatus('disconnected');
      setError(connectionError);
    } else {
      setConnectionStatus('connecting');
    }
  }, [isConnected, connectionError]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const data = await fetchAuctionDetails();
      if (data) {
        setAuctionState(prev => ({
          ...prev,
          auction: data.auction,
          players: data.players,
          teams: data.teams,
          currentPlayer: data.currentPlayer,
          highestBid: data.highestBid,
          recentBids: data.recentBids,
        }));
      }
    };

    loadInitialData();
  }, [fetchAuctionDetails]);

  // Action handlers
  const handleSpinWheel = () => {
    if (userRole.role === 'admin') {
      spinWheel(userRole.id);
    }
  };

  const handlePlaceBid = async (amount: number) => {
    if (!auctionState.currentPlayer || !userRole.teamId) return;
    
    try {
      // Optimistic update
      const optimisticBid: Bid = {
        id: `temp-${Date.now()}`,
        playerId: auctionState.currentPlayer.id,
        teamId: userRole.teamId,
        teamName: userRole.teamName || 'Unknown',
        amount,
        timestamp: new Date(),
        auctionId,
      };
      
      handleNewBid(optimisticBid);
      
      // Send via WebSocket for real-time updates
      socketPlaceBid(auctionState.currentPlayer.id, userRole.teamId, amount);
      
      // Also send via API for persistence
      await apiPlaceBid(auctionState.currentPlayer.id, userRole.teamId, amount);
    } catch (error) {
      console.error('Failed to place bid:', error);
      setError('Failed to place bid. Please try again.');
    }
  };

  const handleAllocatePlayer = async (playerId: string, teamId: string) => {
    if (userRole.role !== 'admin') return;
    
    try {
      // Send via WebSocket for real-time updates
      socketAllocatePlayer(userRole.id, playerId, teamId);
      
      // Also send via API for persistence
      await apiAllocatePlayer(playerId, teamId, userRole.id);
    } catch (error) {
      console.error('Failed to allocate player:', error);
      setError('Failed to allocate player. Please try again.');
    }
  };

  const handleMarkUnsold = async (playerId: string) => {
    if (userRole.role !== 'admin') return;
    
    try {
      // Send via WebSocket for real-time updates
      socketMarkPlayerUnsold(userRole.id, playerId);
      
      // Also send via API for persistence
      await apiMarkPlayerUnsold(playerId, userRole.id);
    } catch (error) {
      console.error('Failed to mark player as unsold:', error);
      setError('Failed to mark player as unsold. Please try again.');
    }
  };

  const availablePlayers = auctionState.players.filter(p => p.status === 'available');
  const currentPlayer = auctionState.currentPlayer || 
    auctionState.players.find(p => p.id === auctionState.auction.currentPlayerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 transform -skew-y-6 scale-150"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-indigo-600/20 to-blue-600/20 transform skew-y-6 scale-150 translate-y-12"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black bg-opacity-30 border-b border-purple-400/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{auctionState.auction.name || 'Cricket Auction'}</h1>
              <div className="flex items-center space-x-4 mt-1 text-sm">
                <span className="text-purple-200">
                  Sold: <span className="text-green-400 font-semibold">{auctionState.auction.soldCount}</span>
                </span>
                <span className="text-purple-200">
                  Unsold: <span className="text-red-400 font-semibold">{auctionState.auction.unsoldCount}</span>
                </span>
                <span className="text-purple-200">
                  Available: <span className="text-yellow-400 font-semibold">{availablePlayers.length}</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span className="text-white text-sm capitalize">{connectionStatus}</span>
              </div>

              {/* User Info */}
              <div className="text-right">
                <div className="text-white font-semibold">{userRole.teamName || 'Admin'}</div>
                <div className="text-purple-200 text-sm capitalize">{userRole.role}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {(error || apiError) && (
        <div className="relative z-10 bg-red-900 bg-opacity-90 border-b border-red-600 px-4 py-3">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-200">{error || apiError}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Wheel and Admin Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* Player Wheel */}
            <div className="flex flex-col items-center">
              <Wheel
                players={availablePlayers}
                currentPlayerId={auctionState.auction.currentPlayerId}
                isSpinning={auctionState.wheelSpinState.isSpinning}
                disabled={userRole.role !== 'admin' || availablePlayers.length === 0}
              />
              
              {/* Spin Button */}
              {userRole.role === 'admin' && (
                <div className="mt-6">
                  <AdminSpinButton
                    onSpin={handleSpinWheel}
                    isSpinning={auctionState.wheelSpinState.isSpinning}
                    playersCount={availablePlayers.length}
                    disabled={!isConnected}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Current Player and Bidding */}
          <div className="xl:col-span-1 space-y-6">
            {/* Current Player Card */}
            <CurrentPlayerCard
              player={currentPlayer}
              highestBid={auctionState.highestBid}
              isSpinning={auctionState.wheelSpinState.isSpinning}
            />

            {/* Bid Input */}
            <BidInput
              player={currentPlayer}
              currentHighestBid={auctionState.highestBid}
              bidIncrement={auctionState.auction.bidIncrement}
              userRole={userRole}
              onPlaceBid={handlePlaceBid}
              disabled={!isConnected || !currentPlayer || auctionState.wheelSpinState.isSpinning}
              loading={apiLoading}
            />
          </div>

          {/* Right Column - Bid History and Admin Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* Recent Bids */}
            <RecentBids
              bids={auctionState.recentBids}
            />

            {/* Admin Controls */}
            {userRole.role === 'admin' && (
              <FinalizeAllocate
                currentPlayer={currentPlayer}
                highestBid={auctionState.highestBid}
                teams={auctionState.teams}
                onAllocate={handleAllocatePlayer}
                onMarkUnsold={handleMarkUnsold}
                disabled={!isConnected || auctionState.wheelSpinState.isSpinning}
                loading={apiLoading}
              />
            )}
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {connectionStatus === 'connecting' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Connecting to auction...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionPage;