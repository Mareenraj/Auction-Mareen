"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import useAuthToken from "@/lib/hooks/useAuthToken";
import useUserData from "@/lib/hooks/useUserData";
import toast from "react-hot-toast";

interface AuctionFormData {
  auctionName: string;
  auctionDate: string;
  typeOfSport: string;
  bidIncreaseBy: string;
  minimumBid: string;
  pointsPerTeam: string;
  playerPerTeam: string;
}

interface AuctionFormProps {
  mode: "add" | "edit" | "view";
  auctionId?: string;
}

const AuctionForm: React.FC<AuctionFormProps> = ({ mode, auctionId }) => {
  const { token } = useAuthToken();
  const { userId } = useUserData();
  const router = useRouter();

  const [formData, setFormData] = useState<AuctionFormData>({
    auctionName: "",
    auctionDate: "",
    typeOfSport: "",
    bidIncreaseBy: "",
    minimumBid: "",
    pointsPerTeam: "",
    playerPerTeam: "",
  });

  const [errors, setErrors] = useState<Partial<AuctionFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    if ((mode === "edit" || mode === "view") && auctionId) {
      const fetchAuction = async () => {
        try {
          const res = await fetch(
            `http://localhost:8080/auctions/${auctionId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          setFormData({
            auctionName: data.auctionName,
            auctionDate: data.auctionDate,
            typeOfSport: data.typeOfSport,
            bidIncreaseBy: data.bidIncreaseBy.toString(),
            minimumBid: data.minimumBid.toString(),
            pointsPerTeam: data.pointsPerTeam.toString(),
            playerPerTeam: data.playerPerTeam.toString(),
          });
        } catch (error) {
          console.error(error);
        }
      };
      fetchAuction();
    }
  }, [mode, auctionId, token]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AuctionFormData])
      setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AuctionFormData> = {};
    if (!formData.auctionName.trim())
      newErrors.auctionName = "Auction name is required";
    if (!formData.auctionDate)
      newErrors.auctionDate = "Auction date is required";
    if (!formData.typeOfSport)
      newErrors.typeOfSport = "Sport category is required";
    if (!formData.bidIncreaseBy.trim() || Number(formData.bidIncreaseBy) <= 0)
      newErrors.bidIncreaseBy = "Valid positive number required";
    if (!formData.minimumBid.trim() || Number(formData.minimumBid) <= 0)
      newErrors.minimumBid = "Valid positive number required";
    if (!formData.pointsPerTeam.trim() || Number(formData.pointsPerTeam) <= 0)
      newErrors.pointsPerTeam = "Valid positive number required";
    if (!formData.playerPerTeam.trim() || Number(formData.playerPerTeam) <= 0)
      newErrors.playerPerTeam = "Valid positive number required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const url = auctionId
        ? `http://localhost:8080/auctions/${auctionId}?adminId=${userId}`
        : `http://localhost:8080/auctions?adminId=${userId}`;
      const method = auctionId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auctionName: formData.auctionName,
          auctionDate: formData.auctionDate,
          typeOfSport: formData.typeOfSport,
          bidIncreaseBy: Number(formData.bidIncreaseBy),
          minimumBid: Number(formData.minimumBid),
          pointsPerTeam: Number(formData.pointsPerTeam),
          playerPerTeam: Number(formData.playerPerTeam),
          status: "OPEN",
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      setIsSuccess(true);

      if (mode === "edit") {
        toast.success("Auction updated successfully!");
      } else {
        toast.success("Auction created successfully!");
      }

      setTimeout(() => router.push("/auction/dashboard"), 1000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isViewMode = mode === "view";

  return (
    <div className="min-h-screen bg-[url(/bg1.jpg)] bg-cover bg-center">
      <Navbar />
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-8 py-6 border-b border-gray-200 text-center">
            <h1 className="text-4xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-red-400 bg-clip-text text-transparent">
              {mode === "add"
                ? "Add Auction"
                : mode === "edit"
                ? "Edit Auction"
                : "View Auction"}
            </h1>
            <p className="mt-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
              {mode === "add"
                ? "Create a new auction for your sports event"
                : mode === "edit"
                ? "Update the details of your auction"
                : "View the details of this auction"}
            </p>
          </div>
        </div>
        {isViewMode ? (
          <div className="bg-white p-8 rounded-lg shadow space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Auction Name</strong>
              </div>
              <div> {formData.auctionName}</div>
              <div>
                <strong>Type of Sport</strong>
              </div>
              <div> {formData.typeOfSport}</div>
              <div>
                <strong>Auction Date</strong>
              </div>
              <div> {formData.auctionDate}</div>
              <div>
                <strong>Bid Increase By</strong>
              </div>
              <div> {formData.bidIncreaseBy}</div>
              <div>
                <strong>Minimum Bid</strong>
              </div>
              <div> {formData.minimumBid}</div>
              <div>
                <strong>Points per Team</strong>
              </div>
              <div> {formData.pointsPerTeam}</div>
              <div>
                <strong>Players per Team</strong>
              </div>
              <div> {formData.playerPerTeam}</div>
            </div>
            <button
              onClick={() => router.push("/auction/dashboard")}
              className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow space-y-6"
          >
            <div>
              <label className="block mb-1">Auction Name</label>
              <input
                name="auctionName"
                value={formData.auctionName}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full p-3 border rounded ${
                  errors.auctionName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.auctionName && (
                <p className="text-red-500">{errors.auctionName}</p>
              )}
            </div>
            <div>
              <label className="block mb-1">Auction Date</label>
              <input
                type="datetime-local"
                name="auctionDate"
                value={formData.auctionDate}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full p-3 border rounded ${
                  errors.auctionDate ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            <div>
              <label className="block mb-1">Type of Sport</label>
              <select
                name="typeOfSport"
                value={formData.typeOfSport}
                onChange={handleInputChange}
                disabled={isViewMode}
                className={`w-full p-3 border rounded ${
                  errors.typeOfSport ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select sport</option>
                {sportCategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label>Bid Increase By</label>
                <input
                  type="number"
                  name="bidIncreaseBy"
                  value={formData.bidIncreaseBy}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className={`w-full p-3 border rounded ${
                    errors.bidIncreaseBy ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label>Minimum Bid</label>
                <input
                  type="number"
                  name="minimumBid"
                  value={formData.minimumBid}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className={`w-full p-3 border rounded ${
                    errors.minimumBid ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label>Points per Team</label>
                <input
                  type="number"
                  name="pointsPerTeam"
                  value={formData.pointsPerTeam}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className={`w-full p-3 border rounded ${
                    errors.pointsPerTeam ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label>Players per Team</label>
                <input
                  type="number"
                  name="playerPerTeam"
                  value={formData.playerPerTeam}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className={`w-full p-3 border rounded ${
                    errors.playerPerTeam ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
            </div>
            {!isViewMode && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isSubmitting
                  ? "Processing..."
                  : mode === "add"
                  ? "Create Auction"
                  : "Update Auction"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AuctionForm;
