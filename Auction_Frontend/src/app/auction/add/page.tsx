"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Target,
  Award,
  AlertTriangle,
  ImageUp,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import useAuthToken from "../../../lib/hooks/useAuthToken";
import { useRouter } from "next/navigation";
import useUserData from "@/lib/hooks/useUserData";

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

type ImageState = {
  file: File | null;
  previewUrl: string | null;
};

const AuctionRegistration = () => {
  const { token, loading: tokenLoading } = useAuthToken(); // Assuming hook provides loading state
  const { userId, loading: userDataLoading } = useUserData(); // Assuming hook provides loading state
  const router = useRouter();

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
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<AuctionFormData> & { form?: string }>({});

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AuctionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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

  useEffect(() => {
    console.log('userId:', userId);
    console.log('token:', token);
    return () => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    };
  }, [image.previewUrl, userId, token]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrors((prev) => ({
        ...prev,
        form: "You must be logged in to create an auction.",
      }));
      router.push('/login');
      return;
    }

    if (userId === undefined || userId === null) {
      setErrors((prev) => ({
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
        return dateTimeString + ':00';
      };
      formDataToSend.append(
        'auction',
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
              status: 'OPEN',
              adminId: userId, // Include adminId here
            }),
          ],
          { type: 'application/json' }
        )
      );

      // Also append adminId separately for backward compatibility
      formDataToSend.append('adminId', String(userId));

      if (image.file) {
        formDataToSend.append('image', image.file);
      }

      // Log FormData contents for debugging
      for (const [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch('http://localhost:8080/auctions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create auction');
      }

      setIsSuccess(true);

      setTimeout(() => {
        router.push('/auction/dashboard');
        setFormData({
          auctionName: '',
          auctionDate: '',
          typeOfSport: '',
          bidIncreaseBy: '',
          minimumBid: '',
          pointsPerTeam: '',
          playerPerTeam: '',
          adminId: userId,
        });
        clearImage();
        setIsSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setErrors((prev) => ({
        ...prev,
        form: error.message || 'Failed to create auction. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenLoading || userDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg p-8 text-center max-w-md w-full border border-white/20 relative z-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Registration Successful
          </h2>
          <p className="text-gray-600 mb-6">
            Your auction has been created successfully. Teams will be notified shortly.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-green-600 h-1 rounded-full w-full transition-all duration-1000"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[url(/bg1.jpg)] bg-custom bg-cover bg-center">
      <Navbar />
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-8 py-6 border-b border-gray-200 text-center">
              <h1 className="text-4xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-red-400 bg-clip-text text-transparent">
                Auction Registration
              </h1>
              <p className="mt-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                Create a new auction for your sports event
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <form
              onSubmit={handleSubmit}
              className="p-8 space-y-8"
              encType="multipart/form-data"
            >
              {errors.form && (
                <div className="mb-6 flex items-center text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.form}
                </div>
              )}
              {/* Auction Details */}
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.auctionName
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 text-gray-700"
                      }`}
                      placeholder="Enter auction name"
                    />
                    {errors.auctionName && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.auctionName}
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.auctionDate
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 text-gray-700"
                      }`}
                    />
                    {errors.auctionDate && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.auctionDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bidding Rules */}
              <div className="space-y-6">
                <div className="flex items-center pb-4 border-b border-gray-200">
                  <Target className="w-5 h-5 text-gray-500 mr-3" />
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
                      Type of Sport <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="typeOfSport"
                      name="typeOfSport"
                      value={formData.typeOfSport}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.typeOfSport
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
                    {errors.typeOfSport && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.typeOfSport}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bidIncreaseBy"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Bid Increase By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="bidIncreaseBy"
                      name="bidIncreaseBy"
                      value={formData.bidIncreaseBy}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.bidIncreaseBy
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 text-gray-700"
                      }`}
                      placeholder="Enter bid increment"
                      step="0.01"
                    />
                    {errors.bidIncreaseBy && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.bidIncreaseBy}
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.minimumBid
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 text-gray-700"
                      }`}
                      placeholder="Enter minimum bid"
                      step="0.01"
                    />
                    {errors.minimumBid && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.minimumBid}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="pointsPerTeam"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Points per Team <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="pointsPerTeam"
                      name="pointsPerTeam"
                      value={formData.pointsPerTeam}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.pointsPerTeam
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 text-gray-700"
                      }`}
                      placeholder="Enter points per player"
                      step="0.01"
                    />
                    {errors.pointsPerTeam && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.pointsPerTeam}
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
                      Players per Team <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="playerPerTeam"
                      name="playerPerTeam"
                      value={formData.playerPerTeam}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.playerPerTeam
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 text-gray-700"
                      }`}
                      placeholder="Enter number of players"
                      step="1"
                      min="1"
                    />
                    {errors.playerPerTeam && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.playerPerTeam}
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
                        className="relative cursor-pointer block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-green-600">
                          Image selected: {image.file?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                    isSubmitting
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Create Auction"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRegistration;