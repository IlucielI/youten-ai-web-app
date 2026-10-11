'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ApiResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import { SpeakerSummaryDTO, SpeakerDirectoryResponse } from '@/server/dtos/workspace.dto';
import { Button } from '@/components/atoms/button';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { Card, CardContent } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { UserNavDropdown } from '@/components/molecules/user-nav-dropdown';
import { EmptyState } from '@/components/molecules/empty-state';
import { SpeakerCard, formatTalkDuration } from '@/components/molecules/speaker-card';
import { toast } from 'sonner';
import {
  Users,
  Mic,
  Clock,
  Search,
  RefreshCw,
  LayoutDashboard,
  Sparkles,
  ArrowUpDown,
  X,
  AlertCircle,
} from 'lucide-react';

type SortOption = 'talk_time' | 'meetings' | 'last_active' | 'name';

export default function SpeakersPage() {
  const router = useRouter();

  // Auth User State
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [speakers, setSpeakers] = useState<SpeakerSummaryDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('talk_time');

  const handleRefresh = useCallback(() => {
    setDataLoading(true);
    setDataError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  // 1. Session check
  useEffect(() => {
    let isMounted = true;
    apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me')
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setUser(res.data);
        } else {
          router.push('/login?redirect=/speakers');
        }
      })
      .catch(() => {
        if (isMounted) {
          router.push('/login?redirect=/speakers');
        }
      })
      .finally(() => {
        if (isMounted) {
          setAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Fetch speakers directory
  useEffect(() => {
    if (authLoading || !user) return;

    let isMounted = true;

    apiFetch<ApiResponse<SpeakerDirectoryResponse>>('/api/speakers')
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setDataError(null);
          setSpeakers(res.data.speakers || []);
        } else {
          setSpeakers([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Gagal memuat direktori pembicara.';
        setDataError(msg);
      })
      .finally(() => {
        if (isMounted) {
          setDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, refreshKey]);

  // 3. Handle Logout
  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      toast.error('Gagal keluar dari sesi. Silakan coba kembali.');
    }
  };

  // 4. Filter & Sort Speakers
  const filteredAndSortedSpeakers = useMemo(() => {
    let result = [...speakers];

    // Filter by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'talk_time':
          return b.total_talk_time - a.total_talk_time;
        case 'meetings':
          return b.total_meetings - a.total_meetings;
        case 'last_active':
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [speakers, searchQuery, sortBy]);

  // Summary Metrics
  const totalTalkSeconds = useMemo(() => {
    return speakers.reduce((acc, curr) => acc + (curr.total_talk_time || 0), 0);
  }, [speakers]);

  const totalMeetings = useMemo(() => {
    return speakers.reduce((acc, curr) => acc + (curr.total_meetings || 0), 0);
  }, [speakers]);

  if (authLoading) {
    return (
      <div
        data-testid="speakers-loading"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memeriksa sesi pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="speakers-page" className="min-h-screen bg-slate-50/60 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Navigation Links */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Youten AI
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">
                  Workspace
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-blue-600 hover:bg-slate-100 gap-1.5 h-8 text-xs font-medium"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Link href="/search">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-blue-600 hover:bg-slate-100 gap-1.5 h-8 text-xs font-medium"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Pencarian Semantik</span>
                </Button>
              </Link>
              <Link href="/speakers">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 gap-1.5 h-8 text-xs font-semibold border border-blue-200/60"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Direktori Pembicara</span>
                </Button>
              </Link>
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <UserNavDropdown user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Direktori Pembicara
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Pantau partisipasi, durasi waktu bicara, dan riwayat interaksi setiap pembicara di
              seluruh rekaman rapat dalam workspace Anda.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={dataLoading}
            className="self-start md:self-auto gap-2 text-xs border-slate-200 hover:border-slate-300"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', dataLoading && 'animate-spin')} />
            <span>Segarkan Data</span>
          </Button>
        </section>

        {/* Aggregated Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-2xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Pembicara Unik</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dataLoading ? '-' : speakers.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-2xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Waktu Bicara</p>
                <p className="text-2xl font-extrabold text-slate-900 truncate">
                  {dataLoading ? '-' : formatTalkDuration(totalTalkSeconds)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-2xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Sesi Kehadiran</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dataLoading ? '-' : totalMeetings}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Sorting Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pembicara..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Urutkan:</span>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-52 h-9 text-xs border-slate-200 bg-white">
                <SelectValue placeholder="Pilih urutan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talk_time">Waktu Bicara Terbanyak</SelectItem>
                <SelectItem value="meetings">Rapat Terbanyak</SelectItem>
                <SelectItem value="last_active">Terakhir Aktif</SelectItem>
                <SelectItem value="name">Nama (A - Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Area */}
        {dataLoading ? (
          /* Skeletons while loading */
          <div
            data-testid="speakers-grid-skeleton"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="border border-slate-200/80 bg-white rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-2xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="w-28 h-4 rounded-md" />
                      <Skeleton className="w-20 h-3 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-5 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Skeleton className="h-14 rounded-xl" />
                  <Skeleton className="h-14 rounded-xl" />
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <Skeleton className="w-16 h-3 rounded-md" />
                  <Skeleton className="w-20 h-6 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : dataError ? (
          /* Error State */
          <Card className="border border-rose-200 bg-rose-50/40 rounded-2xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-rose-900">Terjadi Kesalahan</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{dataError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-2 text-xs border-rose-300 hover:bg-rose-100 text-rose-800"
            >
              Coba Lagi
            </Button>
          </Card>
        ) : filteredAndSortedSpeakers.length === 0 ? (
          /* Empty State */
          searchQuery ? (
            <EmptyState
              title="Pembicara Tidak Ditemukan"
              description={`Tidak ada pembicara yang cocok dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs"
                >
                  Reset Pencarian
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Belum Ada Pembicara Terindeks"
              description="Ketika rekaman rapat diunggah dan ditranskripsi, profil pembicara akan dianalisis dan dirangkum otomatis di halaman ini."
              action={
                <Link href="/dashboard">
                  <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                    Buka Dashboard Rekaman
                  </Button>
                </Link>
              }
            />
          )
        ) : (
          /* Speaker Cards Grid */
          <div
            data-testid="speakers-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAndSortedSpeakers.map((speaker) => (
              <SpeakerCard key={speaker.name} speaker={speaker} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
