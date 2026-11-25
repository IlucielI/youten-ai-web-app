'use client';

import React from 'react';
import {
  User,
  Shield,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  UploadCloud,
  Users,
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/atoms/card';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Progress } from '@/components/atoms/progress';
import { Navbar } from '@/components/organisms/navbar';
import { WorkspaceSettingsTab } from '@/components/organisms/workspace-settings-tab';
import { Footer } from '@/components/organisms/footer';
import { useSettingsProfile } from '@/hooks/use-settings-profile';
import { cn } from '@/lib/utils';

export const SettingsTemplate: React.FC = () => {
  const {
    user,
    authLoading,
    activeTab,
    setActiveTab,
    fullName,
    setFullName,
    isUpdatingProfile,
    handleUpdateProfile,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isChangingPassword,
    handleChangePassword,
    handleLogout,
    quotaTotal,
    quotaUsed,
    quotaRemaining,
    quotaDisplayPercent,
    quotaProgressValue,
    t,
  } = useSettingsProfile();

  if (authLoading || !user) {
    return (
      <div
        data-testid="settings-loading"
        className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">{t('settings.header.loadingSession')}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="settings-page" className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Global Application Navbar */}
      <Navbar
        user={user ? { name: user.full_name || user.email, email: user.email } : null}
        onLogout={handleLogout}
        currentPath="/settings"
      />

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Page Title & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('settings.header.badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {t('settings.header.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {t('settings.header.subtitle')}
            </p>
          </div>
        </div>

        {/* Custom Tab Selector */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            data-testid="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer',
              activeTab === 'profile'
                ? 'border-primary text-primary bg-primary/10 rounded-t-lg'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <User className="w-4 h-4" />
            <span>{t('settings.tabs.profile')}</span>
          </button>
          <button
            type="button"
            data-testid="tab-security"
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer',
              activeTab === 'security'
                ? 'border-primary text-primary bg-primary/10 rounded-t-lg'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Shield className="w-4 h-4" />
            <span>{t('settings.tabs.security')}</span>
          </button>
          <button
            type="button"
            data-testid="tab-workspaces"
            onClick={() => setActiveTab('workspaces')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer',
              activeTab === 'workspaces'
                ? 'border-primary text-primary bg-primary/10 rounded-t-lg'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Workspace</span>
          </button>
        </div>

        {/* Tab 1: Profile & Quota */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Profile Edit Form */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border shadow-xs bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{t('settings.profile.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {t('settings.profile.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                        {t('settings.profile.fullNameLabel')}
                      </Label>
                      <Input
                        id="full_name"
                        data-testid="input-full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('settings.profile.fullNamePlaceholder')}
                        disabled={isUpdatingProfile}
                        className="bg-card border-border text-foreground focus-visible:ring-primary"
                        required
                        minLength={2}
                        maxLength={100}
                      />
                      <p className="text-[11px] text-muted-foreground/80">
                        {t('settings.profile.fullNameHint')}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                        {t('settings.profile.emailLabel')}
                      </Label>
                      <Input
                        id="email"
                        data-testid="input-email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted text-muted-foreground border-border cursor-not-allowed"
                      />
                      <p className="text-[11px] text-muted-foreground/80">
                        {t('settings.profile.emailHint')}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        data-testid="button-save-profile"
                        disabled={isUpdatingProfile || fullName.trim() === user?.full_name}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isUpdatingProfile ? t('settings.profile.saving') : t('settings.profile.saveButton')}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: Daily Quota & Status Card */}
            <div className="space-y-6">
              <Card data-testid="quota-card" className="border-border shadow-xs bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{t('settings.quota.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {t('settings.quota.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">{t('settings.quota.remainingToday')}</span>
                      <span className="text-xl font-extrabold text-primary">
                        {quotaRemaining} <span className="text-xs font-medium text-muted-foreground">/ {quotaTotal}</span>
                      </span>
                    </div>
                    <Progress value={quotaProgressValue} className="h-2 bg-muted" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                      <span>{t('settings.quota.usedRatio', { used: quotaUsed })}</span>
                      <span>{t('settings.quota.percentUsed', { percent: quotaDisplayPercent })}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 border-t border-border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('settings.quota.accountStatus')}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {user?.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('settings.quota.emailVerification')}</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[11px]',
                        user?.email_verified
                          ? 'text-primary bg-primary/10 border border-primary/20'
                          : 'text-amber-500 bg-amber-500/10 border border-amber-500/30'
                      )}>
                        {user?.email_verified ? t('settings.quota.verified') : t('settings.quota.unverified')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UploadCloud className="w-3.5 h-3.5" />
                        {t('settings.quota.maxFileSize')}
                      </span>
                      <span className="font-semibold text-foreground">{user?.max_file_size_mb ?? 500} MB</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {t('settings.quota.resetTime')}
                      </span>
                      <span className="font-medium text-foreground">00:00 UTC</span>
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
            <Card className="border-border shadow-xs bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>{t('settings.security.title')}</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t('settings.security.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="old_password" className="text-xs font-semibold text-foreground">
                      {t('settings.security.currentPasswordLabel')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="old_password"
                        data-testid="input-old-password"
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder={t('settings.security.currentPasswordPlaceholder')}
                        disabled={isChangingPassword}
                        className="bg-card border-border text-foreground pr-10 focus-visible:ring-primary"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="new_password" className="text-xs font-semibold text-foreground">
                      {t('settings.security.newPasswordLabel')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        data-testid="input-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('settings.security.newPasswordPlaceholder')}
                        disabled={isChangingPassword}
                        className="bg-card border-border text-foreground pr-10 focus-visible:ring-primary"
                        required
                        minLength={8}
                        maxLength={72}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-xs font-semibold text-foreground">
                      {t('settings.security.confirmPasswordLabel')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        data-testid="input-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('settings.security.confirmPasswordPlaceholder')}
                        disabled={isChangingPassword}
                        className="bg-card border-border text-foreground pr-10 focus-visible:ring-primary"
                        required
                        minLength={8}
                        maxLength={72}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Hint */}
                  <div className="p-3.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1.5">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary" />
                      <span>{t('settings.security.rulesTitle')}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground pl-1">
                      <li className={newPassword.length >= 8 ? 'text-emerald-500 font-medium' : ''}>
                        {t('settings.security.ruleMinLength')}
                      </li>
                      <li className={/[0-9]/.test(newPassword) ? 'text-emerald-500 font-medium' : ''}>
                        {t('settings.security.ruleNumber')}
                      </li>
                      <li className={newPassword && newPassword !== oldPassword ? 'text-emerald-500 font-medium' : ''}>
                        {t('settings.security.ruleDifferent')}
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      data-testid="button-change-password"
                      disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isChangingPassword ? t('settings.security.saving') : t('settings.security.saveButton')}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Workspace & Team Collaboration */}
        {activeTab === 'workspaces' && (
          <div className="space-y-6">
            <WorkspaceSettingsTab />
          </div>
        )}
      </main>

      <Footer className="mt-auto" />
    </div>
  );
};

