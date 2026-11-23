'use client';

import React, { useEffect, useState } from 'react';
import { useCalendarStore } from '@/stores/calendar.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Switch } from '@/components/atoms/switch';
import { Label } from '@/components/atoms/label';
import { Badge } from '@/components/atoms/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms/alert-dialog';
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link2,
  Unlink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export const GoogleCalendarCard: React.FC = () => {
  const {
    connection,
    isLoadingStatus,
    isSyncing,
    isUpdatingSettings,
    fetchStatus,
    connect,
    disconnect,
    updateSettings,
    syncNow,
  } = useCalendarStore();

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch {
      toast.error('Failed to initiate Google authorization.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setDisconnectDialogOpen(false);
      toast.success('Google Calendar disconnected.');
    } catch {
      toast.error('Failed to disconnect Google Calendar.');
    }
  };

  const handleToggleAutoRecord = async (enabled: boolean) => {
    try {
      await updateSettings({ is_auto_record_enabled: enabled });
      toast.success(enabled ? 'Auto-recording enabled.' : 'Auto-recording disabled.');
    } catch {
      toast.error('Failed to update auto-record preference.');
    }
  };

  const handleLeadTimeChange = async (minutes: number) => {
    try {
      await updateSettings({ lead_time_minutes: minutes });
      toast.success(`Bot will join ${minutes} minutes before meeting starts.`);
    } catch {
      toast.error('Failed to update lead time.');
    }
  };

  const handleSyncNow = async () => {
    try {
      await syncNow();
      toast.success('Calendar events synchronized successfully.');
    } catch {
      toast.error('Failed to synchronize calendar.');
    }
  };

  const isConnected = connection?.connected;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Google Calendar
                {isConnected ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Automatically detect scheduled Google Meet and Zoom meetings and assign bot to record.
              </CardDescription>
            </div>
          </div>
        </div>

        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="text-xs gap-1.5 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {isLoadingStatus ? (
          <div className="py-6 flex items-center justify-center text-xs text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Checking integration status...</span>
          </div>
        ) : isConnected ? (
          <>
            {/* Account Details */}
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] font-medium">Connected Google Account</span>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {connection?.google_email || 'Google User'}
                </p>
              </div>
              {connection?.last_synced_at && (
                <div className="text-right text-[11px] text-muted-foreground">
                  <span>Last synced: </span>
                  <span className="font-medium text-foreground">
                    {new Date(connection.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Auto Record Global Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="auto-record-toggle" className="text-xs font-semibold cursor-pointer">
                  Auto-record scheduled meetings
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Automatically dispatch the voice bot to join meetings you have accepted.
                </p>
              </div>
              <Switch
                id="auto-record-toggle"
                checked={connection?.is_auto_record_enabled ?? true}
                onCheckedChange={handleToggleAutoRecord}
                disabled={isUpdatingSettings}
              />
            </div>

            {/* Lead Time Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Bot Join Time (Lead Time)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                How early should the voice bot join the meeting room before the start time?
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { minutes: 1, label: '1 Minute before' },
                  { minutes: 2, label: '2 Minutes (Recommended)' },
                  { minutes: 5, label: '5 Minutes before' },
                ].map((opt) => (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => handleLeadTimeChange(opt.minutes)}
                    disabled={isUpdatingSettings}
                    className={`px-3 py-2 text-xs rounded-lg border text-center transition-all ${
                      (connection?.lead_time_minutes ?? 2) === opt.minutes
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Disconnect Action */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Revoke access and stop automatic calendar syncing.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDisconnectDialogOpen(true)}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
              >
                <Unlink className="h-3.5 w-3.5" />
                <span>Disconnect</span>
              </Button>
            </div>
          </>
        ) : (
          /* Disconnected State */
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Connect your Google Calendar
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm">
                  Never miss meeting notes again. Youten AI reads your upcoming Google Meet & Zoom schedules and sends a bot to record automatically.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="sm"
                  className="gap-2 text-xs font-semibold"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Redirecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Connect with Google</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>We only request read-only access to calendar events and meeting links. Your data is private and encrypted.</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Disconnect Confirmation Alert */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Disconnect Google Calendar?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to disconnect Google Calendar? Future scheduled meetings will no longer be synced or automatically recorded by Youten AI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
