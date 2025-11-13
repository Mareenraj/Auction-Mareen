'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
  Trophy,
  Users,
  SortAsc,
  Grid,
  List,
  MoreVertical,
  Star,
  Award,
  Activity,
  Link,
  X,
  Mail,
  Phone,
  Shirt,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import useAuthToken from '@/lib/hooks/useAuthToken';

interface Player {
  id: number;
  firstname: string;
  lastname: string;
  age?: number;
  sport: string;
  image?: string;
  position?: string;
  experience?: string;
  rating?: number;
  status: string;
  joinDate: string;
  matches?: number;
  goals?: number;
  auctionId: number;
}

interface PlayerDetail {
  id: number;
  firstname: string | null;
  lastname: string | null;
  mobileno: string | null;
  email: string | null;
  dob: string | null;
  tshirtSize: string | null;
  bottomSize: string | null;
  typeOfSportCategory: string | null;
  sold: boolean;
  auctionId: number | null;
  imageBase64: string | null;
  imageType: string | null;
}

const sportCategories = ["All Sports", "Football", "Basketball", "Tennis", "Cricket", "Volleyball"];
const DEFAULT_ICON = '/api/placeholder/150/150';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('All Sports');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [editPlayer, setEditPlayer] = useState<PlayerDetail>({
    id: 0,
    firstname: null,
    lastname: null,
    mobileno: null,
    email: null,
    dob: null,
    tshirtSize: null,
    bottomSize: null,
    typeOfSportCategory: null,
    sold: false,
    auctionId: null,
    imageBase64: null,
    imageType: null,
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const searchParams = useSearchParams();
  const { token } = useAuthToken();

  const auctionId = searchParams.get('auctionId');

  // Fetch players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!auctionId) {
        setError('Auction ID is required');
        setLoading(false);
        return;
      }
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`🔄 Fetching players for auction ID: ${auctionId}`);
        
        const response = await fetch(`http://localhost:8080/players/auction/${auctionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`📡 API Response Status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to view these players. Please log in with admin credentials or contact support.');
          }
          throw new Error(`Failed to fetch players: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw API Data:', data);
        console.log(`📊 Number of players received: ${data.length}`);

        const mappedPlayers = data.map((player: any, index: number) => {
          console.log(`👤 Processing Player ${index + 1}:`, {
            id: player.id,
            name: `${player.firstname} ${player.lastname}`,
            hasImage: !!player.imageBase64,
            imagePreview: player.imageBase64 ? player.imageBase64.substring(0, 50) + '...' : 'No image',
            imageType: player.imageType || 'Unknown',
          });

          let calculatedAge = null;
          if (player.dob) {
            try {
              const birthDate = new Date(player.dob);
              const today = new Date();
              calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
              console.log(`🎂 Calculated age for ${player.firstname}: ${calculatedAge} years`);
            } catch (ageError) {
              console.warn(`⚠️ Could not calculate age for ${player.firstname}:`, ageError);
            }
          }

          return {
            id: player.id,
            firstname: player.firstname || '',
            lastname: player.lastname || '',
            age: calculatedAge,
            sport: player.typeOfSportCategory || 'Unknown',
            image: player.imageBase64 || null,
            position: player.typeOfSportCategory || 'Player',
            experience: getExperienceForSport(player.typeOfSportCategory),
            rating: generateMockRating(),
            status: player.sold ? 'inactive' : 'active',
            joinDate: player.dob || new Date().toISOString().split('T')[0],
            matches: Math.floor(Math.random() * 50),
            goals: Math.floor(Math.random() * 20),
            auctionId: player.auctionId || 0,
          };
        });

        console.log('✅ Mapped Players:', mappedPlayers);
        console.log(`🖼️ Players with images: ${mappedPlayers.filter((p: { image: any; }) => p.image).length}`);
        console.log(`🚫 Players without images: ${mappedPlayers.filter((p: { image: any; }) => !p.image).length}`);

        setPlayers(mappedPlayers);
      } catch (err) {
        console.error('💥 Fetch Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [auctionId, token]);

  // Fetch player details for modal
  const fetchPlayerDetails = async (id: number) => {
    if (!token) return;
    try {
      setEditLoading(true);
      const response = await fetch(`http://localhost:8080/players/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch player details');
      }
      const data = await response.json();
      setSelectedPlayer(data);
      setEditPlayer(data);
      setModalOpen(true);
    } catch (err) {
      console.error('💥 Fetch Player Details Error:', err);
      setAddError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editPlayer) return;
    setEditLoading(true);
    setAddError(null);

    try {
      const response = await fetch(`http://localhost:8080/players/${editPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPlayer),
      });

      if (!response.ok) {
        throw new Error('Failed to update player');
      }

      setModalOpen(false);
      window.location.reload(); // Refetch to update UI
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete player
  const handleDeletePlayer = async () => {
    if (!token || !playerToDelete) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/players/${playerToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      setDeleteModalOpen(false);
      setPlayerToDelete(null);
      // Remove player from local state
      setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
    } catch (err) {
      console.error('💥 Delete Error:', err);
      setAddError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditPlayer(prev => ({
          ...prev,
          imageBase64: result.split(',')[1], // Base64 without data URI prefix
          imageType: file.type,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getExperienceForSport = (sport: string) => {
    const experiences = {
      'Football': '4-6 years',
      'Basketball': '3-5 years',
      'Cricket': '5-7 years',
      'Tennis': '2-4 years',
      'Volleyball': '3-5 years'
    };
    return experiences[sport as keyof typeof experiences] || '2-3 years';
  };

  const generateMockRating = () => {
    return Math.round((Math.random() * 2 + 3) * 10) / 10;
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, playerName: string) => {
    console.error(`🖼️ Image load error for ${playerName}:`, event);
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  };

  const handleImageLoad = (playerName: string) => {
    console.log(`✅ Image loaded successfully for ${playerName}`);
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.sport.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = filterSport === 'All Sports' || player.sport === filterSport;
    const matchesStatus = filterStatus === 'all' || player.status === filterStatus;
    return matchesSearch && matchesSport && matchesStatus;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`);
      case 'age':
        return (a.age || 0) - (b.age || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'experience':
        return (parseInt((b.experience || '0').split('-')[0]) || 0) - (parseInt((a.experience || '0').split('-')[0]) || 0);
      default:
        return 0;
    }
  });

  const getSportColor = (sport: string) => {
    const colors = {
      'Football': 'bg-green-100 text-green-800 border-green-200',
      'Basketball': 'bg-orange-100 text-orange-800 border-orange-200',
      'Tennis': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Cricket': 'bg-blue-100 text-blue-800 border-blue-200',
      'Volleyball': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[sport as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const stats = {
    total: players.length,
    active: players.filter(p => p.status === 'active').length,
    inactive: players.filter(p => p.status === 'inactive').length,
    avgRating: players.length > 0 ? (players.reduce((sum, p) => sum + (p.rating || 0), 0) / players.length).toFixed(1) : '0.0'
  };

  const PlayerImage = ({ player, className }: { player: Player, className: string }) => {
    const [imageError, setImageError] = useState(false);
    const playerName = `${player.firstname} ${player.lastname}`;

    console.log(`🖼️ Rendering image for ${playerName}:`, {
      hasImage: !!player.image,
      imageLength: player.image?.length || 0,
      isDataUri: player.image?.startsWith('data:') || false
    });

    if (!player.image || imageError) {
      return (
        <div className={`${className} bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg`}>
          <User className="w-16 h-16 text-indigo-600" />
        </div>
      );
    }

    return (
      <div className={`${className} bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl shadow-lg overflow-hidden`}>
        <img 
          src={player.image} 
          alt={playerName}
          className="w-full h-full object-cover"
          onLoad={() => handleImageLoad(playerName)}
          onError={(e) => {
            handleImageError(e, playerName);
            setImageError(true);
          }}
        />
      </div>
    );
  };

  const ModalPlayerImage = ({ player }: { player: PlayerDetail }) => {
    const [imageError, setImageError] = useState(false);
    const playerName = `${player.firstname || 'Unknown'} ${player.lastname || ''}`;

    if (!player.imageBase64 || imageError) {
      return (
        <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
          <User className="w-24 h-24 text-indigo-600" />
        </div>
      );
    }

    return (
      <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl shadow-lg overflow-hidden">
        <img 
          src={player.imageBase64}
          alt={playerName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('/bg1.jpg')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[url('/bg1.jpg')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
          <p className="text-red-600 text-lg font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
          <p className="text-gray-500 mt-2">If the issue persists, ensure you have the correct permissions or contact an administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/bg1.jpg')] bg-cover bg-center bg-fixed">
      <Navbar />
      
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    <Users className="w-10 h-10 mr-4 text-indigo-600" />
                    Player Management
                  </h1>
                  <p className="text-gray-600 text-lg">Manage and organize all registered players</p>
                </div>
             
                <button 
                  onClick={() => window.location.href = `/player/registration?auctionId=${auctionId}`}
                  className="mt-6 lg:mt-0 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-lg flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Player</span>
                </button>
        
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-500 rounded-lg shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-indigo-900">{stats.total}</span>
              </div>
              <p className="text-indigo-800 font-medium">Total Players</p>
              <p className="text-sm text-indigo-600 mt-1">Registered</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-lg shadow-md">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-900">{stats.active}</span>
              </div>
              <p className="text-green-800 font-medium">Active Players</p>
              <p className="text-sm text-green-600 mt-1">Currently playing</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500 rounded-lg shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-red-900">{stats.inactive}</span>
              </div>
              <p className="text-red-800 font-medium">Inactive Players</p>
              <p className="text-sm text-red-600 mt-1">Not playing</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500 rounded-lg shadow-md">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-yellow-900">{stats.avgRating}</span>
              </div>
              <p className="text-yellow-800 font-medium">Average Rating</p>
              <p className="text-sm text-yellow-600 mt-1">Out of 5.0</p>
            </div>
          </div>

          {/* Search, Filter and View Controls */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search players by name or sport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              
              {/* Sport Filter */}
              <div className="relative lg:w-48">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer bg-white"
                >
                  {sportCategories.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative lg:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Sort */}
              <div className="relative lg:w-48">
                <SortAsc className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer bg-white"
                >
                  <option value="name">Sort by Name</option>
                  <option value="age">Sort by Age</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="experience">Sort by Experience</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Players Grid/List */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Award className="w-6 h-6 mr-3 text-indigo-600" />
                    Players Directory
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {sortedPlayers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No players found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {sortedPlayers.map((player) => (
                    <div key={player.id} className={`bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105 ${
                      viewMode === 'list' ? 'flex items-center p-6' : 'p-6'
                    }`}>
                      
                      {/* Player Image */}
                      <div className={`${viewMode === 'list' ? 'w-24 h-24 mr-6' : 'w-full h-48 mb-4'} relative`}>
                        <PlayerImage 
                          player={player} 
                          className={viewMode === 'list' ? 'w-24 h-24' : 'w-32 h-32 mx-auto'} 
                        />
                        <div className={`absolute ${viewMode === 'list' ? 'top-0 right-0' : '-top-2 -right-2'} bg-white rounded-full p-2 shadow-lg`}>
                          <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(player.status)}`}>
                            {player.status}
                          </div>
                        </div>
                      </div>

                      {/* Player Info */}
                      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className={`${viewMode === 'list' ? 'flex items-center justify-between' : 'text-center'}`}>
                          <div className={`${viewMode === 'list' ? 'text-left' : ''}`}>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{`${player.firstname} ${player.lastname}`}</h3>
                            
                            <div className={`flex ${viewMode === 'list' ? 'space-x-4' : 'flex-col space-y-2'} mb-4`}>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{player.age ? `${player.age} years` : 'Age unknown'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Trophy className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{player.position}</span>
                              </div>
                            </div>

                            <div className={`flex ${viewMode === 'list' ? 'space-x-2' : 'flex-wrap gap-2 justify-center'} mb-4`}>
                              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getSportColor(player.sport)}`}>
                                {player.sport}
                              </div>
                            </div>

                            <div className={`flex items-center ${viewMode === 'list' ? 'space-x-4' : 'justify-center space-x-2'} mb-4`}>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{player.rating?.toFixed(1) || 0}</span>
                              </div>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-600">{player.experience || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className={`flex ${viewMode === 'list' ? 'flex-row space-x-2' : 'flex-wrap gap-2 justify-center'}`}>
                            <button 
                              onClick={() => { setModalMode('view'); fetchPlayerDetails(player.id); }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              {viewMode === 'grid' && <span>View</span>}
                            </button>
                            <button 
                              onClick={() => { setModalMode('edit'); fetchPlayerDetails(player.id); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              {viewMode === 'grid' && <span>Edit</span>}
                            </button>
                            <button 
                              onClick={() => {
                                setPlayerToDelete(player);
                                setDeleteModalOpen(true);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              {viewMode === 'grid' && <span>Delete</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modern View/Edit Modal */}
          {modalOpen && selectedPlayer && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center">
                        {modalMode === 'view' ? (
                          <>
                            <Eye className="w-6 h-6 mr-3" />
                            Player Details
                          </>
                        ) : (
                          <>
                            <Edit className="w-6 h-6 mr-3" />
                            Edit Player
                          </>
                        )}
                      </h2>
                      <p className="text-indigo-100 mt-1">
                        {selectedPlayer.firstname} {selectedPlayer.lastname}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setModalOpen(false);
                        setAddError(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
                  <div className="p-8">
                    {/* Player Image Section */}
                    <div className="mb-8">
                      <div className="flex justify-center">
                        <div className="relative">
                          <ModalPlayerImage player={selectedPlayer} />
                          {selectedPlayer.sold && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Sold
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {addError && (
                      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                        <p className="text-red-700">{addError}</p>
                      </div>
                    )}

                    {modalMode === 'view' ? (
                      /* View Mode */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <User className="w-5 h-5 mr-2" />
                              Personal Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                <p className="text-lg font-medium text-gray-900">
                                  {selectedPlayer.firstname || 'N/A'} {selectedPlayer.lastname || ''}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                <p className="text-gray-900 flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {selectedPlayer.dob || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <Phone className="w-5 h-5 mr-2" />
                              Contact Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                                <p className="text-gray-900 flex items-center">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {selectedPlayer.mobileno || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Email Address</label>
                                <p className="text-gray-900 flex items-center">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {selectedPlayer.email || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <Trophy className="w-5 h-5 mr-2" />
                              Sports Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Sport Category</label>
                                <p className="text-gray-900">
                                  {selectedPlayer.typeOfSportCategory || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedPlayer.sold 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {selectedPlayer.sold ? 'Sold' : 'Available'}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Auction ID</label>
                                <p className="text-gray-900">{selectedPlayer.auctionId || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <Shirt className="w-5 h-5 mr-2" />
                              Clothing Sizes
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">T-Shirt Size</label>
                                <p className="text-gray-900">{selectedPlayer.tshirtSize || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Bottom Size</label>
                                <p className="text-gray-900">{selectedPlayer.bottomSize || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Edit Mode */
                      <form onSubmit={handleEditSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Personal Information
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editPlayer.firstname || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, firstname: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="Enter first name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editPlayer.lastname || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, lastname: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="Enter last name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date of Birth
                                  </label>
                                  <input
                                    type="date"
                                    value={editPlayer.dob || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, dob: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Phone className="w-5 h-5 mr-2" />
                                Contact Information
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mobile Number
                                  </label>
                                  <input
                                    type="tel"
                                    value={editPlayer.mobileno || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, mobileno: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="Enter mobile number"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                  </label>
                                  <input
                                    type="email"
                                    value={editPlayer.email || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="Enter email address"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Trophy className="w-5 h-5 mr-2" />
                                Sports Information
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sport Category
                                  </label>
                                  <select
                                    value={editPlayer.typeOfSportCategory || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, typeOfSportCategory: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                  >
                                    <option value="">Select Sport</option>
                                    {sportCategories.filter(s => s !== 'All Sports').map(sport => (
                                      <option key={sport} value={sport}>{sport}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="sold"
                                    checked={editPlayer.sold}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, sold: e.target.checked })}
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded "
                                  />
                                  <label htmlFor="sold" className="ml-3 text-sm font-medium text-gray-700">
                                    Player is sold
                                  </label>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Auction ID
                                  </label>
                                  <input
                                    type="number"
                                    value={editPlayer.auctionId || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, auctionId: parseInt(e.target.value) || null })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="Enter auction ID"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Shirt className="w-5 h-5 mr-2" />
                                Clothing Sizes & Image
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    T-Shirt Size
                                  </label>
                                  <input
                                    type="text"
                                    value={editPlayer.tshirtSize || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, tshirtSize: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="e.g., S, M, L, XL"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bottom Size
                                  </label>
                                  <input
                                    type="text"
                                    value={editPlayer.bottomSize || ''}
                                    onChange={(e) => setEditPlayer({ ...editPlayer, bottomSize: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                    placeholder="e.g., S, M, L, XL"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Update Player Image
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                                  />
                                  {editPlayer.imageBase64 && (
                                    <div className="mt-3">
                                      <img 
                                        src={`data:${editPlayer.imageType || 'image/jpeg'};base64,${editPlayer.imageBase64}`}
                                        alt="Preview" 
                                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                          <button 
                            type="button"
                            onClick={() => {
                              setModalOpen(false);
                              setAddError(null);
                            }}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={editLoading}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center"
                          >
                            {editLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && playerToDelete && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Player</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Are you sure you want to delete <strong>{playerToDelete.firstname} {playerToDelete.lastname}</strong>? 
                    This action cannot be undone.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setDeleteModalOpen(false);
                        setPlayerToDelete(null);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeletePlayer}
                      disabled={deleteLoading}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
                    >
                      {deleteLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Player
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div> 
    </div>
  );
}