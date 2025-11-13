

export interface Team {
  id: string;
  name: string;
  logo?: string;
  budget: number;
  remainingBudget: number;
  playerCount: number;
  maxPlayers: number;
  color?: string;
}

export interface Bid {
  id: string;
  playerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: Date;
  auctionId: string;
}

export interface Auction {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  currentPlayerId?: string;
  bidIncrement: number;
  soldCount: number;
  unsoldCount: number;
  totalPlayers: number;
}

export interface WheelSpinState {
  isSpinning: boolean;
  selectedPlayerId?: string;
  spinStartTime?: number;
  spinDuration?: number;
}

export interface UserRole {
  id: string;
  role: 'admin' | 'bidder';
  teamId?: string;
  teamName?: string;
}

// WebSocket Events
export interface WSEvents {
  'wheel:spin:start': { auctionId: string; timestamp: number };
  'wheel:spin:end': { playerId: string; auctionId: string; playerName: string };
  'bid:new': { bid: Bid };
  'bid:update': { playerId: string; highestBid: Bid };
  'player:allocated': { playerId: string; teamId: string; newTeamPlayerCount: number };
  'player:unsold': { playerId: string };
  'players:update': { players: Player[] };
  'auction:state': { auction: Auction; currentPlayer?: Player };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuctionState {
  auction: Auction;
  players: Player[];
  teams: Team[];
  currentPlayer?: Player;
  highestBid?: Bid;
  recentBids: Bid[];
  wheelSpinState: WheelSpinState;
}

// src/models/types.ts
export interface Player {
  id: number;
  name: string;
  role: string;
  basePrice: number;
  picture: string;
  status: 'available' | 'sold' | 'unsold';
  team?: Team | null;
}