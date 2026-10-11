'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ApiResponse, BaseResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse, UserResponse } from '@/server/dtos/auth.dto';
import { Button } from '@/components/atoms/button';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/atoms/card';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Progress } from '@/components/atoms/progress';
import { UserNavDropdown } from '@/components/molecules/user-nav-dropdown';
import { toast } from 'sonner';
import {
  User,
  Shield,
  KeyRound,
  LayoutDashboard,
  Search,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  // Auth & Profile State
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security / Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 1. Session verification on mount
  useEffect(() => {
    let isMounted = true;
    apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me')
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setUser(res.data);
          setFullName(res.data.full_name || '');
          setAuthLoading(false);
        } else {
          router.push('/login?redirect=/settings');
        }
      })
      .catch(() => {
        if (isMounted) {
          router.push('/login?redirect=/settings');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Handle Logout
  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      toast.error('Gagal keluar dari sesi. Silakan coba kembali.');
    }
  };

  // 3. Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      toast.error('Nama lengkap minimal harus terdiri dari 2 karakter.');
      return;
    }
    if (trimmed.length > 100) {
      toast.error('Nama lengkap tidak boleh lebih dari 100 karakter.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await apiFetch<ApiResponse<UserResponse>>('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: trimmed }),
      });

      if (res && res.data) {
        const updated = res.data;
        setUser((prev) => (prev ? Object.assign({}, prev, { full_name: updated.full_name }) : prev));
        toast.success('Profil berhasil diperbarui!');
      } else {
        toast.error('Gagal memperbarui profil.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      toast.error(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 4. Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error('Harap masukkan kata sandi saat ini.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      toast.error('Kata sandi baru harus berukuran antara 8 hingga 72 karakter.');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error('Kata sandi baru harus mengandung minimal satu angka (0-9).');
      return;
    }

    if (newPassword === oldPassword) {
      toast.error('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiFetch<BaseResponse>('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (res) {
        toast.success('Kata sandi berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Gagal memperbarui kata sandi.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div
        data-testid="settings-loading"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memeriksa sesi akun...</p>
        </div>
      </div>
    );
  }

  const quotaTotal = user?.daily_quota ?? 5;
  const quotaUsed = user?.quota_used_today ?? 0;
  const quotaRemaining = user?.quota_remaining ?? 0;
  const quotaPercent = Math.min(100, Math.round((quotaUsed / (quotaTotal || 1)) * 100));

  return (
    <div data-testid="settings-page" className="min-h-screen bg-slate-50/60 font-sans">
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
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-blue-600 hover:bg-slate-100 gap-1.5 h-8 text-xs font-medium"
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

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manajemen Akun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pengaturan Akun
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Kelola profil pengguna, preferensi keamanan sandi, dan pantau status alokasi kuota harian Anda.
            </p>
          </div>
        </div>

        {/* Custom Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            data-testid="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px',
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <User className="w-4 h-4" />
            <span>Profil & Kuota</span>
          </button>
          <button
            type="button"
            data-testid="tab-security"
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px',
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Keamanan & Kata Sandi</span>
          </button>
        </div>

        {/* Tab 1: Profile & Quota */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Profile Edit Form */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Informasi Profil
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Perbarui nama identitas yang ditampilkan di seluruh ruang rapat dan notulen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-semibold text-slate-700">
                        Nama Lengkap
                      </Label>
                      <Input
                        id="full_name"
                        data-testid="input-full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        disabled={isUpdatingProfile}
                        className="bg-white border-slate-200 focus-visible:ring-blue-500"
                        required
                        minLength={2}
                        maxLength={100}
                      />
                      <p className="text-[11px] text-slate-400">
                        Nama ini akan digunakan pada kepemilikan rapat dan notulen AI.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                        Alamat Email
                      </Label>
                      <Input
                        id="email"
                        data-testid="input-email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                      />
                      <p className="text-[11px] text-slate-400">
                        Email ini terikat dengan akun Anda dan digunakan untuk masuk ke sistem.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        data-testid="button-save-profile"
                        disabled={isUpdatingProfile || fullName.trim() === user?.full_name}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: Daily Quota & Status Card */}
            <div className="space-y-6">
              <Card data-testid="quota-card" className="border-slate-200 shadow-xs bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Alokasi Kuota Harian
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Batas proses transkripsi & ringkasan rapat harian Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Sisa Kuota Hari Ini</span>
                      <span className="text-xl font-extrabold text-blue-700">
                        {quotaRemaining} <span className="text-xs font-medium text-slate-500">/ {quotaTotal}</span>
                      </span>
                    </div>
                    <Progress value={quotaPercent} className="h-2 bg-slate-200" />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>Terpakai: {quotaUsed} rapat</span>
                      <span>{quotaPercent}% terpakai</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status Akun:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3" />
                        {user?.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Verifikasi Email:</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[11px]',
                        user?.email_verified
                          ? 'text-blue-700 bg-blue-50 border border-blue-200'
                          : 'text-amber-700 bg-amber-50 border border-amber-200'
                      )}>
                        {user?.email_verified ? 'Terverifikasi' : 'Belum Diverifikasi'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Reset Kuota:
                      </span>
                      <span className="font-medium text-slate-700">00:00 UTC</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Ubah Kata Sandi
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun rapat.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="old_password" className="text-xs font-semibold text-slate-700">
                      Kata Sandi Saat Ini
                    </Label>
                    <div className="relative">
                      <Input
                        id="old_password"
                        data-testid="input-old-password"
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan kata sandi saat ini"
                        disabled={isChangingPassword}
                        className="bg-white border-slate-200 pr-10 focus-visible:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="new_password" className="text-xs font-semibold text-slate-700">
                      Kata Sandi Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        data-testid="input-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter dan mengandung angka"
                        disabled={isChangingPassword}
                        className="bg-white border-slate-200 pr-10 focus-visible:ring-blue-500"
                        required
                        minLength={8}
                        maxLength={72}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-xs font-semibold text-slate-700">
                      Konfirmasi Kata Sandi Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        data-testid="input-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi baru Anda"
                        disabled={isChangingPassword}
                        className="bg-white border-slate-200 pr-10 focus-visible:ring-blue-500"
                        required
                        minLength={8}
                        maxLength={72}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Hint */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                      Ketentuan Kata Sandi:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 pl-1">
                      <li className={newPassword.length >= 8 ? 'text-emerald-600 font-medium' : ''}>
                        Minimal 8 karakter dan maksimal 72 karakter
                      </li>
                      <li className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-medium' : ''}>
                        Mengandung sekurang-kurangnya satu angka (0-9)
                      </li>
                      <li className={newPassword && newPassword !== oldPassword ? 'text-emerald-600 font-medium' : ''}>
                        Berbeda dari kata sandi saat ini
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      data-testid="button-change-password"
                      disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isChangingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
