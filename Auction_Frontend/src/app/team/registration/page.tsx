'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { Users, AlertTriangle, Plus, X, Trophy, Award, Lock, Eye } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import useAuthToken from '@/lib/hooks/useAuthToken';
import useUserData from '@/lib/hooks/useUserData';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ---------- Types ----------
interface TeamFormData {
  name: string;
  budget: string;
  logoFile: File | null;         
  logoPreview?: string | null;
  ownerId?: number;
  auctionId: number;
}

interface Team {
  id: number;
  name: string;
  budget: number;
  ownerId: number;
  ownerMail: string;
  auctionId: number;
  imageUrl: string;
  status?: 'active' | 'inactive';
  playersCount?: number;
  points?: number;
  remainingPoints?: number;
  rating?: number;
}

interface TeamDetail {
  id: number;
  name: string;
  budget: number;
  ownerId: number;
  ownerMail: string;
  auctionId: number;
  imageUrl: string;
}


interface TeamApiResponse {
  id: number | string;
  name?: string;
  budget?: number | string;
  ownerId: number | string;
  ownerMail?: string;
  auctionId: number | string;
  imageUrl?: string | null;
  image?: string | null;
  imageContentType?: string | null;
  status?: string | null;
  playersCount?: number;
}

// ---------- Form error type ----------
type FormErrors = {
  name?: string;
  budget?: string;
  logoFile?: string; 
  form?: string;
};

// ---------- Helpers ----------
const readFileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

function resolveImmediateImageSrc(t: {
  imageUrl?: string | null;
  image?: string | null;
  imageContentType?: string | null;
}): string {
  if (t.imageUrl && /^https?:\/\//i.test(t.imageUrl)) return t.imageUrl;
  if (t.imageUrl && t.imageUrl.startsWith('/')) return '';
  if (t.image && t.image.length > 40) {
    const mime = t.imageContentType || 'image/jpeg';
    return `data:${mime};base64,${t.image}`;
  }
  return '';
}

async function fetchProtectedImageUrl(teamId: number, token?: string | null) {
  if (!token) return '';
  const res = await fetch(`${BASE_URL}/teams/${teamId}/image`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return '';
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

const TeamAvatar: React.FC<{
  teamId: number;
  initialSrc?: string;
  alt: string;
  token?: string | null;
  className?: string;
}> = ({ teamId, initialSrc, alt, token, className }) => {
  const [src, setSrc] = useState<string | undefined>(initialSrc || undefined);

  useEffect(() => {
    let toRevoke: string | null = null;

    if (!src && token) {
      fetchProtectedImageUrl(teamId, token)
        .then((url) => {
          if (url) {
            toRevoke = url;
            setSrc(url);
          }
        })
        .catch(() => {});
    }

    return () => {
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    };
  }, [teamId, token, src]);

  return (
    <img
      src={src || '/placeholder-team.png'}
      alt={alt}
      className={className || 'w-12 h-12 rounded-md object-cover border'}
    />
  );
};

const TeamRegistration: React.FC = () => {
  const { userId } = useUserData();
  const { token } = useAuthToken();
  const searchParams = useSearchParams();

  // Current auction ID from URL params
  const currentAuctionId = searchParams.get('auctionId');
  const currentAuctionIdNum = currentAuctionId ? Number(currentAuctionId) : null;

  // ---------- Form state ----------
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    budget: '',
    logoFile: null,               
    logoPreview: null,
    ownerId: undefined,
    auctionId: currentAuctionIdNum || 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ---------- List state ----------
  const [teams, setTeams] = useState<Team[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ---------- UI / Edit / Delete state ----------
  const [uiError, setUiError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReadOnly, setModalReadOnly] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (typeof userId === 'number') {
      setFormData((prev) => ({ ...prev, ownerId: userId }));
    }
  }, [userId]);

  // ----- Enhanced ownership and access control helpers -----
  const isTeamOwner = useCallback(
    (team: { ownerId: number } | null | undefined) =>
      typeof userId === 'number' && !!team && Number(team.ownerId) === Number(userId),
    [userId]
  );



  const canManageTeam = useCallback(
    (team: { ownerId: number; auctionId: number } | null | undefined) => {
      if (!team || typeof userId !== 'number') return false;

      const isOwner = Number(team.ownerId) === Number(userId);
      const isCurrentAuction =
        currentAuctionIdNum !== null && Number(team.auctionId) === Number(currentAuctionIdNum);

      return isOwner && isCurrentAuction;
    },
    [userId, currentAuctionIdNum]
  );

  // -------- Fetch teams --------
  const fetchTeams = useCallback(async () => {
    setListLoading(true);
    setListError(null);

    try {
      const res = await fetch(`${BASE_URL}/teams`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Failed to load teams: ${res.status}`);
      }

      const data: unknown = await res.json();

      const mapped: Team[] = (Array.isArray(data) ? (data as TeamApiResponse[]) : [])
        .map((t) => ({
          id: Number(t.id),
          name: t.name || 'Unnamed Team',
          budget: Number(t.budget) || 0,
          ownerId: Number(t.ownerId),
          ownerMail: t.ownerMail || 'No email',
          auctionId: Number(t.auctionId) || 0,
          imageUrl: resolveImmediateImageSrc({
            imageUrl: t.imageUrl ?? undefined,
            image: t.image ?? undefined,
            imageContentType: t.imageContentType ?? undefined,
          }),
          status: (typeof t.status === 'string' ? t.status.toLowerCase() : undefined) as
            | 'active'
            | 'inactive'
            | undefined,
          playersCount: t.playersCount ?? 0,
          points: Number(t.budget) || 0,
          remainingPoints: Number(t.budget) || 0,
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        }))
        .filter((t) => t.status !== 'inactive');

      setTeams(mapped);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to load teams');
      console.error('Error fetching teams:', e);
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTeams();
    }
  }, [token, fetchTeams]);

  // Derived stats - only for current auction teams
  const stats = useMemo(() => {
    const currentAuctionTeams = teams.filter(
      (t) => currentAuctionIdNum !== null && t.auctionId === currentAuctionIdNum
    );

    const total = currentAuctionTeams.length;
    const active = currentAuctionTeams.filter((t) => t.status === 'active' || t.status === undefined).length;
    const avgRating =
      total > 0
        ? (currentAuctionTeams.reduce((sum, t) => sum + (t.rating || 0), 0) / total).toFixed(1)
        : '0.0';

    return { total, active, avgRating };
  }, [teams, currentAuctionIdNum]);

  // Categorized teams for display
  const categorizedTeams = useMemo(() => {
    const currentAuctionTeams: Team[] = [];
    const otherAuctionTeams: Team[] = [];

    teams.forEach((team) => {
      if (currentAuctionIdNum !== null && team.auctionId === currentAuctionIdNum) {
        currentAuctionTeams.push(team);
      } else {
        otherAuctionTeams.push(team);
      }
    });

    return { currentAuctionTeams, otherAuctionTeams };
  }, [teams, currentAuctionIdNum]);

  // ---------- Handlers ----------
  const isErrorKey = (k: string): k is keyof FormErrors =>
    k === 'name' || k === 'budget' || k === 'logoFile' || k === 'form';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.currentTarget;

    if (name === 'logoFile' && files?.[0]) {
      const file = files[0];
      readFileToDataUrl(file)
        .then((url) => {
          setFormData((prev) => ({ ...prev, logoFile: file, logoPreview: url }));
          setErrors((prev) => ({ ...prev, logoFile: undefined })); // clear logoFile error
        })
        .catch(() => setErrors((prev) => ({ ...prev, logoFile: 'Failed to read image' })));
      return;
    }

    if (name === 'name' || name === 'budget') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (isErrorKey(name) && errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) newErrors.name = 'Team name is required';
    if (!formData.budget?.trim() || Number(formData.budget) <= 0)
      newErrors.budget = 'Budget must be greater than 0';
    if (!token) newErrors.form = 'You must be logged in to create a team.';
    if (!currentAuctionIdNum) newErrors.form = 'Auction ID is required';
    if (typeof userId !== 'number') newErrors.form = 'Owner ID is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      const teamRequest = {
        name: formData.name.trim(),
        budget: Number(formData.budget),
        ownerId: userId,
        auctionId: currentAuctionIdNum,
      };

      formDataToSend.append('team', JSON.stringify(teamRequest));
      if (formData.logoFile) formDataToSend.append('image', formData.logoFile);

      const res = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || `Failed to register team: ${res.status}`);
      }

      await fetchTeams();

      setIsSuccess(true);
      setTimeout(() => {
        setFormData({
          name: '',
          budget: '',
          logoFile: null,                
          logoPreview: null,
          ownerId: userId,
          auctionId: currentAuctionIdNum || 0,
        });
        setIsSuccess(false);
      }, 1200);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
      console.error('Error creating team:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTeamDetails = async (id: number, readOnly: boolean) => {
    if (!token) {
      setUiError('Authentication required');
      return;
    }
    setEditLoading(true);
    setUiError(null);

    try {
      const res = await fetch(`${BASE_URL}/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to fetch team details');

      const data = await res.json();
      const detail: TeamDetail = {
        id: Number(data.id),
        name: String(data.name),
        budget: Number(data.budget),
        ownerId: Number(data.ownerId),
        ownerMail: String(data.ownerMail),
        auctionId: Number(data.auctionId),
        imageUrl: resolveImmediateImageSrc({
          imageUrl: data.imageUrl,
          image: data.image,
          imageContentType: data.imageContentType,
        }),
      };

      const canEdit = canManageTeam(detail);
      setSelectedTeam(detail);
      setModalReadOnly(readOnly || !canEdit);
      setModalOpen(true);
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Failed to load team details');
      console.error('Error fetching team details:', e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTeam) return;

    if (!canManageTeam(selectedTeam)) {
      setUiError('You can only edit teams you own in the current auction.');
      return;
    }

    setEditLoading(true);
    setUiError(null);

    try {
      const formDataToSend = new FormData();
      const teamRequest = {
        name: selectedTeam.name,
        budget: Number(selectedTeam.budget),
        ownerId: Number(selectedTeam.ownerId),
        auctionId: selectedTeam.auctionId,
      };

      formDataToSend.append('team', JSON.stringify(teamRequest));

      const res = await fetch(`${BASE_URL}/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to update team');
      }

      await fetchTeams();
      setModalOpen(false);
      setSelectedTeam(null);
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Failed to save changes');
      console.error('Error updating team:', e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !teamToDelete) return;

    if (!canManageTeam(teamToDelete)) {
      setUiError('You can only delete teams you own in the current auction.');
      return;
    }

    setDeleteLoading(true);
    setUiError(null);

    try {
      const res = await fetch(`${BASE_URL}/teams/${teamToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to delete team');
      }

      await fetchTeams();
      setDeleteModalOpen(false);
      setTeamToDelete(null);
    } catch (err: unknown) {
      console.error('💥 Delete Error:', err);
      setUiError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Team card component with different designs
  const TeamCard: React.FC<{ team: Team; isCurrentAuction: boolean }> = ({ team, isCurrentAuction }) => {
    const isOwner = isTeamOwner(team);
    const canManage = canManageTeam(team);
    if (isCurrentAuction) {
      // Enhanced design for current auction teams
      return (
        <li
          className={[
            'rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1',
            isOwner
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-blue-200'
              : 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-100 shadow-green-200',
          ].join(' ')}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <TeamAvatar
                  teamId={team.id}
                  initialSrc={team.imageUrl}
                  token={token}
                  alt={team.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                />
                {isCurrentAuction && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-lg text-gray-900">{team.name}</p>
                  {isOwner && (
                    <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-md">
                      Your Team
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 font-medium">Current Auction Team</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/70 rounded-lg p-3 border border-white/50">
                <div className="text-xs text-gray-600 mb-1">Budget</div>
                <div className="font-bold text-lg text-gray-800">{team.budget.toLocaleString()}</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-white/50">
                <div className="text-xs text-gray-600 mb-1">Rating</div>
                <div className="font-bold text-lg text-gray-800">{team.rating}/5.0</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600 space-y-1">
              <div>
                Owner ID: <span className="font-medium text-gray-800">{team.ownerId}</span>
              </div>
              <div>
                Auction ID: <span className="font-medium text-green-700">{team.auctionId}</span>
              </div>
              <div>
                Status: <span className="font-medium capitalize text-green-600">{team.status ?? 'active'}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => fetchTeamDetails(team.id, true)}
                className="px-4 py-2 text-sm rounded-lg border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                <Eye className="w-4 h-4 inline mr-1" />
                View
              </button>

              {canManage ? (
                <>
                  <button
                    onClick={() => fetchTeamDetails(team.id, false)}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setTeamToDelete(team);
                      setDeleteModalOpen(true);
                    }}
                    className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Delete
                  </button>
                </>
              ) : isOwner ? (
                <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <Lock className="w-3 h-3 mr-1" />
                  View Only
                </div>
              ) : null}
            </div>
          </div>
        </li>
      );
    } else {
      return (
        <li className="rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <TeamAvatar
                teamId={team.id}
                initialSrc={team.imageUrl}
                token={token}
                alt={team.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{team.name}</p>
                </div>
                <p className="text-xs text-gray-500">Other Auction Team</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div>
                Budget: <span className="font-medium">{team.budget}</span>
              </div>
              <div>
                Auction: <span className="font-medium text-blue-600">{team.auctionId}</span>
              </div>
              <div>
                Status: <span className="font-medium">{team.status ?? 'active'}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => fetchTeamDetails(team.id, true)}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-100 transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-1" />
                View Only
              </button>
            </div>
          </div>
        </li>
      );
    }
  };

  
  return (
    <div className="bg-[url('/bg1.jpg')] bg-cover bg-center min-h-screen">
      <style jsx global>{`
        @keyframes grow {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>

      <Navbar />

      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg p-8 text-center max-w-md w-full border border-white/20 relative z-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Registration Successful</h2>
            <p className="text-gray-600 mb-6">
              Your team has been registered successfully for Auction {currentAuctionIdNum}.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="bg-green-600 h-1 rounded-full w-full animate-[grow_1.2s_ease]" />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border mb-8">
            <div className="px-8 py-6 border-b border-gray-200">
              <h1 className="text-4xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-red-400 bg-clip-text text-transparent">
                Team Registration & Management
              </h1>
              <p className="mt-2 text-gray-600">
                Register a team for Auction {currentAuctionIdNum} and view all teams across auctions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm border lg:col-span-2">
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {errors.form && (
                  <div className="mb-6 flex items-center text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {errors.form}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center pb-4 border-b border-gray-200">
                    <Users className="w-5 h-5 text-gray-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Team Information</h3>
                    {currentAuctionIdNum && (
                      <span className="ml-auto text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        Auction {currentAuctionIdNum}
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 text-gray-700'
                        }`}
                        placeholder="Enter team name"
                      />
                      {errors.name && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errors.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                        Budget <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.budget ? 'border-red-300 bg-red-50' : 'border-gray-300 text-gray-700'
                        }`}
                        placeholder="Enter budget"
                        min={1}
                        step={1}
                      />
                      {errors.budget && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errors.budget}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Team Logo (optional)</label>
                      {!formData.logoPreview ? (
                        <label
                          htmlFor="logoFile"
                          className="relative cursor-pointer block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Users className="mx-auto h-12 w-12 text-gray-400" />
                          <span className="mt-2 block text-sm font-medium text-gray-900">Upload team logo</span>
                          <span className="mt-1 block text-sm text-gray-500">Any image format supported</span>
                          <input
                            id="logoFile"
                            type="file"
                            name="logoFile"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <div className="relative w-full h-32 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50">
                            <img src={formData.logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, logoFile: null, logoPreview: null }))}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {/* file name (optional) */}
                          {formData.logoFile && (
                            <p className="mt-2 text-sm text-green-600">{formData.logoFile.name}</p>
                          )}
                        </div>
                      )}
                      {errors.logoFile && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errors.logoFile}
                        </div>
                      )}
                    </div>
                  </div>

                  {serverError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      {serverError}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting || !currentAuctionIdNum}
                    className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                      isSubmitting || !currentAuctionIdNum
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 inline mr-2" />
                        Register Team for Auction {currentAuctionIdNum}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Stats - Only for current auction */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-500 rounded-lg shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-indigo-900">{stats.total}</span>
                </div>
                <p className="text-indigo-800 font-medium">Teams in Auction {currentAuctionIdNum}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-lg shadow-md">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-900">{stats.active}</span>
                </div>
                <p className="text-green-800 font-medium">Active Teams</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500 rounded-lg shadow-md">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-yellow-900">{stats.avgRating}</span>
                </div>
                <p className="text-yellow-800 font-medium">Average Rating</p>
                <p className="text-sm text-yellow-600 mt-1">Out of 5.0</p>
              </div>
            </div>
          </div>

          {/* ===== Current Auction Teams ===== */}
          {categorizedTeams.currentAuctionTeams.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border mb-8">
              <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    Current Auction Teams
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Teams in Auction {currentAuctionIdNum}</p>
                </div>
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {categorizedTeams.currentAuctionTeams.length} team
                  {categorizedTeams.currentAuctionTeams.length === 1 ? '' : 's'}
                </span>
              </div>

              {listLoading ? (
                <div className="p-8 text-sm text-gray-600">Loading teams…</div>
              ) : listError ? (
                <div className="p-8 text-sm text-red-600">{listError}</div>
              ) : (
                <ul className="p-6 grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categorizedTeams.currentAuctionTeams.map((team) => (
                    <TeamCard key={team.id} team={team} isCurrentAuction={true} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* No teams message */}
          {teams.length === 0 && !listLoading && !listError && (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-gray-600">Create the first team using the form above.</p>
            </div>
          )}

          {uiError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {uiError}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Edit / View Modal ===== */}
      {modalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-lg p-6 relative z-10 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{modalReadOnly ? 'Team Details' : 'Edit Team'}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Auction {selectedTeam.auctionId}
                </span>
                {!canManageTeam(selectedTeam) && isTeamOwner(selectedTeam) && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    View Only
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={modalReadOnly ? (e) => e.preventDefault() : handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={selectedTeam.name}
                  disabled={modalReadOnly}
                  onChange={(e) =>
                    setSelectedTeam((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    modalReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={selectedTeam.budget}
                  disabled={modalReadOnly}
                  onChange={(e) =>
                    setSelectedTeam((prev) =>
                      prev ? { ...prev, budget: Number(e.target.value) } : prev
                    )
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    modalReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner ID</label>
                  <input
                    type="text"
                    value={selectedTeam.ownerId}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auction ID</label>
                  <input
                    type="text"
                    value={selectedTeam.auctionId}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {editLoading && <p className="text-sm text-gray-600">Saving…</p>}
              {uiError && <p className="text-sm text-red-600">{uiError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  disabled={editLoading}
                >
                  Close
                </button>

                {!modalReadOnly && (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    disabled={editLoading}
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete Modal ===== */}
      {deleteModalOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-lg p-6 relative z-10 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Team</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-medium">{teamToDelete?.name}</span> from Auction{' '}
              {teamToDelete?.auctionId}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting…' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamRegistration;
