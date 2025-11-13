

'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  Users,
  Shield,
  Calendar,
  Clock,
  DollarSign,
  Search,
  Filter,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import useUserData from '@/lib/hooks/useUserData';
import useAuthToken from '@/lib/hooks/useAuthToken';


interface AuctionFormData {
  auctionName: string;
  auctionDate: string;
  typeOfSport: string;
  bidIncreaseBy: string;
  minimumBid: string;
  pointsPerTeam: string;
  playerPerTeam: string;
  ownerId: number;
}

interface Auction extends AuctionFormData {
  id: number;
  status: string;
  image?: string;
  imageUrl?: string;           
  imageContentType?: string;
}



export default function TeamDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useUserData();
  console.log("team owner...",userId)
  const { token } = useAuthToken();
  const router = useRouter();

  

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/auctions`, {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        if (!response.ok) throw new Error('Failed to fetch auctions');
        const data = await response.json();
        setAuctions(
          data.map((a: Auction) => ({
            ...a,
            status: a.status || 'unknown',
          }))
        );
      } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError(String(err));
  }
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchAuctions();
  }, [userId, token]);

  
  const getImageUrl = (auction: Auction) => {
    if (auction.imageUrl) {
      return `http://localhost:8080${auction.imageUrl}`;
      
    }
    return null;
  };

  const filteredAuctions = auctions.filter((auction) => {
    const status = auction.status?.toLowerCase() || '';
    const matchesSearch = auction.auctionName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
  const stats = {
    total: auctions.length,
    upcoming: auctions.filter((a) => (a.status?.toLowerCase() || '') === 'upcoming').length,
    live: auctions.filter((a) => (a.status?.toLowerCase() || '') === 'live').length,
    completed: auctions.filter((a) => (a.status?.toLowerCase() || '') === 'completed').length,
    totalPlayers: auctions.reduce((sum, a) => sum + toNum(a.playerPerTeam), 0),
    totalRevenue: auctions.reduce((sum, a) => sum +toNum (a.minimumBid), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'open':
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'live':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'open':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('/bg1.jpg')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[url('/bg1.jpg')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/bg1.jpg')] bg-cover bg-center bg-fixed">
      <Navbar />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-red-400 bg-clip-text text-transparent">
                    Team Dashboard
                  </h1>
                  <p className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent text-lg">
                    Manage your auctions and track performance
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-xl p-6 shadow-lg border border-rose-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-rose-900">{stats.total}</span>
              </div>
              <p className="text-rose-700 font-medium">Total Auctions</p>
              <p className="text-sm text-rose-500 mt-1">All time</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-6 shadow-lg border border-cyan-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-cyan-900">{stats.upcoming}</span>
              </div>
              <p className="text-cyan-700 font-medium">Upcoming</p>
              <p className="text-sm text-cyan-500 mt-1">Scheduled</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl p-6 shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-teal-900">{stats.live}</span>
              </div>
              <p className="text-teal-700 font-medium">Live Now</p>
              <p className="text-sm text-teal-500 mt-1 font-semibold">Active</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-900">{stats.completed}</span>
              </div>
              <p className="text-purple-700 font-medium">Completed</p>
              <p className="text-sm text-purple-500 mt-1">Finished</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl p-6 shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-orange-900">{stats.totalPlayers}</span>
              </div>
              <p className="text-orange-700 font-medium">Total Players</p>
              <p className="text-sm text-orange-500 mt-1">Registered</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 shadow-lg border border-emerald-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-emerald-900">
                  ${stats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <p className="text-emerald-700 font-medium">Total Budget</p>
              <p className="text-sm text-emerald-500 mt-1">Combined</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search auctions by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-700"
                />
              </div>
              <div className="relative lg:w-48">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer bg-white text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Award className="w-6 h-6 mr-3 text-indigo-600" />
                Auction Management
              </h2>
              <p className="text-gray-600 mt-1">Manage all your auctions from one place</p>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                {filteredAuctions.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-xl font-medium">No auctions found</p>
                    <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                  </div>
                ) : (
                  filteredAuctions.map((auction) => (
                    <div
                      key={auction.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex items-start space-x-6 flex-1">
                          <div className="flex-shrink-0">
                            {getImageUrl(auction) ? (
                              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-300 shadow-md">
                                <img
                                  src={getImageUrl(auction)!}
                                  alt={auction.auctionName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-300 shadow-md">
                                <ImageIcon className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-4">
                              <h3 className="text-xl font-bold text-gray-900">{auction.auctionName}</h3>
                              <div
                                className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(
                                  auction.status
                                )}`}
                              >
                                {getStatusIcon(auction.status)}
                                <span className="capitalize">{auction.status.toLowerCase()}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-6 text-lg">{auction.typeOfSport} Tournament</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Date</p>
                                  <p className="font-semibold text-gray-900">
                                    {new Date(auction.auctionDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <Clock className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Time</p>
                                  <p className="font-semibold text-gray-900">
                                    {new Date(auction.auctionDate).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Players</p>
                                  <p className="font-semibold text-gray-900">{auction.playerPerTeam}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                  <DollarSign className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Budget</p>
                                  <p className="font-semibold text-gray-900">
                                    ${auction.minimumBid?.toLocaleString() || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 xl:mt-0 xl:ml-8">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => router.push(`/team/registration?auctionId=${auction.id}`)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Teams</span>
                            </button>

                            <button
                                                            onClick={() =>
                                                              router.push(`/bid?auctionId=${auction.id}`)
                                                            }
                                                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
                                                            title="Go to live bidding"
                                                          >
                                                            <DollarSign className="w-4 h-4" />
                                                            <span>Bid</span>
                                                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-xl p-8 shadow-lg border border-rose-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-rose-900 mb-3">Analytics & Reports</h3>
                <p className="text-rose-700">View detailed auction analytics and performance metrics</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-8 shadow-lg border border-cyan-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-cyan-900 mb-3">Player Management</h3>
                <p className="text-cyan-700">Manage all registered players across all auctions</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl p-8 shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-teal-900 mb-3">Team Overview</h3>
                <p className="text-teal-700">View and manage team compositions and assignments</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
