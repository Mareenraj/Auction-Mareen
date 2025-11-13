import { useEffect, useRef, useState, useCallback } from 'react';
import { WSEvents, Bid, Player, Auction, WheelSpinState } from '@/models/types';

interface UseAuctionSocketProps {
  auctionId: string;
  userId: string;
  onWheelSpinStart: () => void;
  onWheelSpinEnd: (playerId: string, playerName: string) => void;
  onNewBid: (bid: Bid) => void;
  onBidUpdate: (playerId: string, highestBid: Bid) => void;
  onPlayerAllocated: (playerId: string, teamId: string, newTeamPlayerCount: number) => void;
  onPlayerUnsold: (playerId: string) => void;
  onPlayersUpdate: (players: Player[]) => void;
  onAuctionStateUpdate: (auction: Auction, currentPlayer?: Player) => void;
}

export const useAuctionSocket = ({
  auctionId,
  userId,
  onWheelSpinStart,
  onWheelSpinEnd,
  onNewBid,
  onBidUpdate,
  onPlayerAllocated,
  onPlayerUnsold,
  onPlayersUpdate,
  onAuctionStateUpdate,
}: UseAuctionSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/auction/${auctionId}?userId=${userId}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      setConnectionError('Failed to connect');
    }
  }, [auctionId, userId]);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'wheel:spin:start':
        onWheelSpinStart();
        break;
      case 'wheel:spin:end':
        onWheelSpinEnd(message.data.playerId, message.data.playerName);
        break;
      case 'bid:new':
        onNewBid(message.data.bid);
        break;
      case 'bid:update':
        onBidUpdate(message.data.playerId, message.data.highestBid);
        break;
      case 'player:allocated':
        onPlayerAllocated(message.data.playerId, message.data.teamId, message.data.newTeamPlayerCount);
        break;
      case 'player:unsold':
        onPlayerUnsold(message.data.playerId);
        break;
      case 'players:update':
        onPlayersUpdate(message.data.players);
        break;
      case 'auction:state':
        onAuctionStateUpdate(message.data.auction, message.data.currentPlayer);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [
    onWheelSpinStart,
    onWheelSpinEnd,
    onNewBid,
    onBidUpdate,
    onPlayerAllocated,
    onPlayerUnsold,
    onPlayersUpdate,
    onAuctionStateUpdate,
  ]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket not connected');
    }
  }, []);

  const spinWheel = useCallback((adminId: string) => {
    sendMessage('wheel:spin', { adminId, auctionId });
  }, [sendMessage, auctionId]);

  const placeBid = useCallback((playerId: string, teamId: string, amount: number) => {
    sendMessage('bid:place', { auctionId, playerId, teamId, amount });
  }, [sendMessage, auctionId]);

  const allocatePlayer = useCallback((adminId: string, playerId: string, teamId: string) => {
    sendMessage('player:allocate', { adminId, auctionId, playerId, teamId });
  }, [sendMessage, auctionId]);

  const markPlayerUnsold = useCallback((adminId: string, playerId: string) => {
    sendMessage('player:unsold', { adminId, auctionId, playerId });
  }, [sendMessage, auctionId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000);
      }
    };
  }, [connect]);

  return {
    isConnected,
    connectionError,
    spinWheel,
    placeBid,
    allocatePlayer,
    markPlayerUnsold,
  };
};