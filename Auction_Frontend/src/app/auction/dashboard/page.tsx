"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Search,
  Filter,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Image as ImageIcon,
  ImageUp,
  X as CloseIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import useUserData from "@/lib/hooks/useUserData";
import useAuthToken from "@/lib/hooks/useAuthToken";
import toast from "react-hot-toast";
import DeleteConfirmation from "@/components/DeleteConfirmation";

interface AuctionFormData {
  auctionName: string;
  auctionDate: string;
  typeOfSport: string;
  bidIncreaseBy: string;
  minimumBid: string;
  pointsPerTeam: string;
  playerPerTeam: string;
  adminId: number;
}

interface Auction extends AuctionFormData {
  id: number;
  status: string;
  imageUrl?: string;
}

type ImageState = {
  file: File | null;
  previewUrl: string | null;
};

type ModalState = {
  isOpen: boolean;
  mode: "view" | "edit" | null;
  auctionId: number | null;
};

export default function AuctionDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useUserData();
  const { token } = useAuthToken();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: null,
    auctionId: null,
  });
  const [formData, setFormData] = useState<AuctionFormData>({
    auctionName: "",
    auctionDate: "",
    typeOfSport: "",
    bidIncreaseBy: "",
    minimumBid: "",
    pointsPerTeam: "",
    playerPerTeam: "",
    adminId: userId || 0,
  });
  const [image, setImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<AuctionFormData> & { form?: string }
  >({});
  const lastStatusesRef = useRef<Record<number, string>>({});

  const sportCategories = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Badminton",
    "Volleyball",
    "Hockey",
    "Swimming",
  ];

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/auctions`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch auctions");
        }
        const data = await response.json();
        setAuctions(
          data.map((a: Auction) => ({
            ...a,
            status: a.status || "unknown",
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAuctions();
    }
  }, [userId, token]);

  useEffect(() => {
    if (!userId || !token) return;

    let isFetching = false;
    const refresh = async () => {
      if (isFetching) return;
      try {
        isFetching = true;
        const res = await fetch(`http://localhost:8080/auctions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuctions(
            data.map((a: Auction) => ({
              ...a,
              status: a.status || "unknown",
            }))
          );
        }
      } catch (_) {
        /* optional: console.warn(_) */
      } finally {
        isFetching = false;
      }
    };

    // initial + poll every 20s
    refresh();
    const id = setInterval(refresh, 20000);

    // refresh when user comes back to the tab
    const onFocus = () => refresh();
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, token]);

  const navigatingRef = useRef(false);

  useEffect(() => {
    if (navigatingRef.current) return;

    const currentStatuses: Record<number, string> = {};
    auctions.forEach((a) => {
      currentStatuses[a.id] = (a.status || "").toLowerCase();
    });

    for (const a of auctions) {
      const prev = lastStatusesRef.current[a.id];
      const curr = currentStatuses[a.id];

      if (prev && prev !== "live" && curr === "live") {
        navigatingRef.current = true; // prevent double redirects
        toast.success(
          `"${a.auctionName}" is now LIVE! Redirecting to bid page...`
        );
        router.push(`/bid?auctionId=${a.id}`);
        break;
      }
    }

    lastStatusesRef.current = currentStatuses;
  }, [auctions, router]);

  const fetchAuction = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch auction");
      const data = await response.json();

      console.log("data.....", data);
      setFormData({
        auctionName: data.auctionName,
        auctionDate: data.auctionDate.slice(0, 16),
        typeOfSport: data.typeOfSport,
        bidIncreaseBy: String(data.bidIncreaseBy),
        minimumBid: String(data.minimumBid),
        pointsPerTeam: String(data.pointsPerTeam),
        playerPerTeam: String(data.playerPerTeam),
        adminId: data.adminId,
      });
      setImage({
        file: null,
        previewUrl: data.image ? `data:image/jpeg;base64,${data.image}` : null,
      });
    } catch (error: any) {
      setFormErrors((prev) => ({
        ...prev,
        form: "Failed to load auction details",
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof AuctionFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage({ file, previewUrl: url });
    }
  };

  const clearImage = () => {
    if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage({ file: null, previewUrl: null });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AuctionFormData> = {};

    if (!formData.auctionName.trim())
      newErrors.auctionName = "Auction name is required";
    if (!formData.auctionDate)
      newErrors.auctionDate = "Auction date is required";
    if (!formData.typeOfSport)
      newErrors.typeOfSport = "Sport category is required";

    if (!formData.bidIncreaseBy.trim()) {
      newErrors.bidIncreaseBy = "Bid increase amount is required";
    } else if (
      isNaN(Number(formData.bidIncreaseBy)) ||
      Number(formData.bidIncreaseBy) <= 0
    ) {
      newErrors.bidIncreaseBy = "Please enter a valid positive number";
    }

    if (!formData.minimumBid.trim()) {
      newErrors.minimumBid = "Minimum bid is required";
    } else if (
      isNaN(Number(formData.minimumBid)) ||
      Number(formData.minimumBid) <= 0
    ) {
      newErrors.minimumBid = "Please enter a valid positive number";
    }

    if (!formData.pointsPerTeam.trim()) {
      newErrors.pointsPerTeam = "Points per team player is required";
    } else if (
      isNaN(Number(formData.pointsPerTeam)) ||
      Number(formData.pointsPerTeam) <= 0
    ) {
      newErrors.pointsPerTeam = "Please enter a valid positive number";
    }

    if (!formData.playerPerTeam.trim()) {
      newErrors.playerPerTeam = "Number of players per team is required";
    } else if (
      isNaN(Number(formData.playerPerTeam)) ||
      Number(formData.playerPerTeam) <= 0
    ) {
      newErrors.playerPerTeam = "Please enter a valid positive number";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setFormErrors((prev) => ({
        ...prev,
        form: "You must be logged in to update an auction.",
      }));
      router.push("/login");
      return;
    }

    if (userId === undefined || userId === null) {
      setFormErrors((prev) => ({
        ...prev,
        form: "User ID is not available. Please ensure you are logged in.",
      }));
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const formatDateForBackend = (dateTimeString: string) => {
        if (!dateTimeString) return null;
        return dateTimeString + ":00";
      };

      formDataToSend.append(
        "auction",
        new Blob(
          [
            JSON.stringify({
              auctionName: formData.auctionName,
              auctionDate: formatDateForBackend(formData.auctionDate),
              typeOfSport: formData.typeOfSport,
              bidIncreaseBy: Number(formData.bidIncreaseBy),
              minimumBid: Number(formData.minimumBid),
              pointsPerTeam: Number(formData.pointsPerTeam),
              playerPerTeam: Number(formData.playerPerTeam),
              status: "OPEN",
              adminId: userId,
            }),
          ],
          { type: "application/json" }
        )
      );

      formDataToSend.append("adminId", String(userId));

      if (image.file) {
        formDataToSend.append("image", image.file);
      } else if (image.previewUrl === null) {
        // If image is cleared, send a flag or handle in backend to remove image
        formDataToSend.append("removeImage", "true"); // Optional: if backend supports removing image
      }

      const response = await fetch(
        `http://localhost:8080/auctions/${modal.auctionId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update auction");
      }

      toast.success("Auction updated successfully!");
      setModal({ isOpen: false, mode: null, auctionId: null });
      setFormData({
        auctionName: "",
        auctionDate: "",
        typeOfSport: "",
        bidIncreaseBy: "",
        minimumBid: "",
        pointsPerTeam: "",
        playerPerTeam: "",
        adminId: userId,
      });
      clearImage();
      setFormErrors({});

      // Refresh auctions asynchronously without await in non-async context
      fetch(`http://localhost:8080/auctions/admin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (refreshResponse) => {
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setAuctions(
              data.map((a: Auction) => ({
                ...a,
                status: a.status || "unknown",
              }))
            );
          }
        })
        .catch((err) => console.error("Failed to refresh auctions", err));
    } catch (error: any) {
      setFormErrors((prev) => ({
        ...prev,
        form: error.message || "Failed to update auction. Please try again.",
      }));
      toast.error("Error updating auction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`http://localhost:8080/auctions/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete auction");

      setAuctions((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("Auction deleted successfully!");
    } catch (error: any) {
      toast.error("Error deleting auction");
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  const openViewModal = (id: number) => {
    fetchAuction(id);
    setModal({ isOpen: true, mode: "view", auctionId: id });
  };

  const openEditModal = (id: number) => {
    fetchAuction(id);
    setModal({ isOpen: true, mode: "edit", auctionId: id });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: null, auctionId: null });
    setFormData({
      auctionName: "",
      auctionDate: "",
      typeOfSport: "",
      bidIncreaseBy: "",
      minimumBid: "",
      pointsPerTeam: "",
      playerPerTeam: "",
      adminId: userId || 0,
    });
    clearImage();
    setFormErrors({});
  };

  const getImageUrl = (auction: Auction) => {
    if (auction.imageUrl) {
      return `http://localhost:8080${auction.imageUrl}`;
    }
    return null;
  };

  const filteredAuctions = auctions.filter((auction) => {
    const status = auction.status?.toLowerCase() || "";
    const matchesSearch = auction.auctionName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: auctions.length,
    upcoming: auctions.filter(
      (a) => (a.status?.toLowerCase() || "") === "upcoming"
    ).length,
    live: auctions.filter((a) => (a.status?.toLowerCase() || "") === "live")
      .length,
    completed: auctions.filter(
      (a) => (a.status?.toLowerCase() || "") === "completed"
    ).length,
    totalPlayers: auctions.reduce((sum, a) => sum + (a.playerPerTeam || 0), 0),
    totalRevenue: auctions.reduce((sum, a) => sum + (a.minimumBid || 0), 0),
  };

  const isLive = (s?: string) => (s || "").toLowerCase() === "live";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "live":
        return "bg-green-100 text-green-800 border-green-200";
      case "open":
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return <Clock className="w-4 h-4" />;
      case "live":
        return <Activity className="w-4 h-4 animate-pulse" />;
      case "open":
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCreateAuction = () => {
    router.push("/auction/add");
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
        <div className="bg-white p-6 rounded-lg shadow-lg text-red-600">
          Error: {error}
        </div>
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
                    Auction Dashboard
                  </h1>
                  <p className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent text-lg">
                    Manage your auctions and track performance
                  </p>
                </div>
                <button
                  onClick={handleCreateAuction}
                  className="mt-6 lg:mt-0 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-lg flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Auction</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-xl p-6 shadow-lg border border-rose-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-rose-900">
                  {stats.total}
                </span>
              </div>
              <p className="text-rose-700 font-medium">Total Auctions</p>
              <p className="text-sm text-rose-500 mt-1">All time</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-6 shadow-lg border border-cyan-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-cyan-900">
                  {stats.upcoming}
                </span>
              </div>
              <p className="text-cyan-700 font-medium">Upcoming</p>
              <p className="text-sm text-cyan-500 mt-1">Scheduled</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl p-6 shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-teal-900">
                  {stats.live}
                </span>
              </div>
              <p className="text-teal-700 font-medium">Live Now</p>
              <p className="text-sm text-teal-500 mt-1 font-semibold">Active</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-900">
                  {stats.completed}
                </span>
              </div>
              <p className="text-purple-700 font-medium">Completed</p>
              <p className="text-sm text-purple-500 mt-1">Finished</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl p-6 shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-orange-900">
                  {stats.totalPlayers}
                </span>
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
              <p className="text-gray-600 mt-1">
                Manage all your auctions from one place
              </p>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                {filteredAuctions.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-xl font-medium">
                      No auctions found
                    </p>
                    <p className="text-gray-400 mt-2">
                      Try adjusting your search or filter criteria
                    </p>
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
                                  src={getImageUrl(auction)}
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
                              <h3 className="text-xl font-bold text-gray-900">
                                {auction.auctionName}
                              </h3>

                              <div
                                className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(
                                  auction.status
                                )}`}
                              >
                                {getStatusIcon(auction.status)}
                                <span className="capitalize">
                                  {auction.status.toLowerCase()}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-6 text-lg">
                              {auction.typeOfSport} Tournament
                            </p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Date</p>
                                  <p className="font-semibold text-gray-900">
                                    {new Date(
                                      auction.auctionDate
                                    ).toLocaleDateString()}
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
                                    {new Date(
                                      auction.auctionDate
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Players
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {auction.playerPerTeam}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                  <DollarSign className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Budget
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    $
                                    {auction.minimumBid?.toLocaleString() ||
                                      "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 xl:mt-0 xl:ml-8">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => openViewModal(auction.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            {/* <button
                              onClick={() => openEditModal(auction.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button> */}

                            {!isLive(auction.status) && (
    <button
      onClick={() => openEditModal(auction.id)}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
    >
      <Edit className="w-4 h-4" />
      <span>Edit</span>
    </button>
  )}
                            <button
                              onClick={() =>
                                router.push(
                                  `/player/list?auctionId=${auction.id}`
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
                            >
                              <Users className="w-4 h-4" />
                              <span>Players</span>
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/team/registration?auctionId=${auction.id}`
                                )
                              }
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md cursor-pointer"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Teams</span>
                            </button>

                            {(auction.status || "").toLowerCase() ===
                              "live" && (
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
                            )}

                            {/* <button
                              onClick={() => setDeleteId(auction.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md font-medium transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button> */}


                             {!isLive(auction.status) && (
    <button
      onClick={() => setDeleteId(auction.id)}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md font-medium transition-colors duration-200"
    >
      <Trash2 className="w-4 h-4" />
      <span>Delete</span>
    </button>
  )}
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
                <h3 className="text-xl font-bold text-rose-900 mb-3">
                  Analytics & Reports
                </h3>
                <p className="text-rose-700">
                  View detailed auction analytics and performance metrics
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-8 shadow-lg border border-cyan-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-cyan-900 mb-3">
                  Player Management
                </h3>
                <p className="text-cyan-700">
                  Manage all registered players across all auctions
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl p-8 shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-teal-900 mb-3">
                  Team Overview
                </h3>
                <p className="text-teal-700">
                  View and manage team compositions and assignments
                </p>
              </div>
            </div>
          </div>

          {modal.isOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
                {modal.mode === "view" ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      View Auction
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Auction Name
                        </p>
                        <p className="text-gray-900">{formData.auctionName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Auction Date
                        </p>
                        <p className="text-gray-900">
                          {new Date(formData.auctionDate).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Type of Sport
                        </p>
                        <p className="text-gray-900">{formData.typeOfSport}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Bid Increase By
                        </p>
                        <p className="text-gray-900">
                          {formData.bidIncreaseBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Minimum Bid
                        </p>
                        <p className="text-gray-900">{formData.minimumBid}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Points per Team
                        </p>
                        <p className="text-gray-900">
                          {formData.pointsPerTeam}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Players per Team
                        </p>
                        <p className="text-gray-900">
                          {formData.playerPerTeam}
                        </p>
                      </div>
                      {image.previewUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Auction Logo
                          </p>
                          <img
                            src={image.previewUrl}
                            alt="Auction Logo"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setModal({ ...modal, mode: "edit" })}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Edit Auction
                      </button>
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleEditSubmit}
                    className="space-y-8"
                    encType="multipart/form-data"
                  >
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Edit Auction
                    </h2>
                    {formErrors.form && (
                      <div className="mb-6 flex items-center text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.form}
                      </div>
                    )}
                    <div className="space-y-6">
                      <div className="flex items-center pb-4 border-b border-gray-200">
                        <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Auction Details
                        </h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="auctionName"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Auction Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="auctionName"
                            name="auctionName"
                            value={formData.auctionName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.auctionName
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                            placeholder="Enter auction name"
                          />
                          {formErrors.auctionName && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.auctionName}
                            </div>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="auctionDate"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Auction Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            id="auctionDate"
                            name="auctionDate"
                            value={formData.auctionDate}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.auctionDate
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                          />
                          {formErrors.auctionDate && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.auctionDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center pb-4 border-b border-gray-200">
                        <Users className="w-5 h-5 text-gray-500 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Bidding Rules
                        </h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="typeOfSport"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Type of Sport{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="typeOfSport"
                            name="typeOfSport"
                            value={formData.typeOfSport}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.typeOfSport
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                          >
                            <option value="">Select sport category</option>
                            {sportCategories.map((sport) => (
                              <option key={sport} value={sport}>
                                {sport}
                              </option>
                            ))}
                          </select>
                          {formErrors.typeOfSport && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.typeOfSport}
                            </div>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="bidIncreaseBy"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Bid Increase By{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="bidIncreaseBy"
                            name="bidIncreaseBy"
                            value={formData.bidIncreaseBy}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.bidIncreaseBy
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                            placeholder="Enter bid increment"
                            step="0.01"
                          />
                          {formErrors.bidIncreaseBy && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.bidIncreaseBy}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="minimumBid"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Minimum Bid <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="minimumBid"
                            name="minimumBid"
                            value={formData.minimumBid}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.minimumBid
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                            placeholder="Enter minimum bid"
                            step="0.01"
                          />
                          {formErrors.minimumBid && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.minimumBid}
                            </div>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="pointsPerTeam"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Points per Team{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="pointsPerTeam"
                            name="pointsPerTeam"
                            value={formData.pointsPerTeam}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.pointsPerTeam
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                            placeholder="Enter points per player"
                            step="0.01"
                          />
                          {formErrors.pointsPerTeam && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.pointsPerTeam}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="playerPerTeam"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Players per Team{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="playerPerTeam"
                            name="playerPerTeam"
                            value={formData.playerPerTeam}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.playerPerTeam
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                            placeholder="Enter number of players"
                            step="1"
                            min="1"
                          />
                          {formErrors.playerPerTeam && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {formErrors.playerPerTeam}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Auction Logo (optional)
                          </label>
                          {!image.previewUrl ? (
                            <label
                              htmlFor="imageUpload"
                              className="relative cursor-pointer block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <ImageUp className="mx-auto h-12 w-12 text-gray-400" />
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Upload auction logo
                              </span>
                              <span className="mt-1 block text-sm text-gray-500">
                                Any image format supported
                              </span>
                              <input
                                id="imageUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                          ) : (
                            <div className="relative">
                              <div className="relative w-full h-32 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50">
                                <img
                                  src={image.previewUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={clearImage}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="mt-2 text-sm text-green-600">
                                Image selected:{" "}
                                {image.file?.name || "Existing image"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                          isSubmitting
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        }`}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          "Update Auction"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-8 py-3 rounded-lg font-medium bg-gray-300 text-gray-900 hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <DeleteConfirmation
            isOpen={!!deleteId}
            title="Delete Auction"
            message="Are you sure you want to delete this auction? This action cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        </div>
      </div>
    </div>
  );
}
