'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useCalendarStore } from '@/stores/calendar.store';
import { useAuthStore } from '@/stores/auth.store';
import { FolderSidebar } from '@/components/molecules/folder-sidebar';
import { WorkspaceChatDrawer } from '@/components/organisms/workspace-chat-drawer';
import { WorkspaceSwitcher } from '@/components/molecules/workspace-switcher';
import { UserNavDropdown } from '@/components/molecules/user-nav-dropdown';
import { LanguageSwitcher } from '@/components/molecules/language-switcher';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { Footer } from '@/components/organisms/footer';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Switch } from '@/components/atoms/switch';
import { Card, CardContent } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  Video,
  CheckCircle2,
  Sparkles,
  Link2,
  CalendarCheck2,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardCalendarPage() {
  const { user, logout } = useAuthStore();
  const {
    connection,
    events,
    isLoadingStatus,
    isLoadingEvents,
    isSyncing,
    fetchStatus,
    fetchEvents,
    syncNow,
    toggleAutoRecord,
    connect,
  } = useCalendarStore();

  const [filterTab, setFilterTab] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    void fetchStatus();
    void fetchEvents();
  }, [fetchStatus, fetchEvents]);

  const handleSyncNow = async () => {
    try {
      await syncNow();
      toast.success('Calendar synchronized successfully.');
    } catch {
      toast.error('Failed to sync calendar.');
    }
  };

  const handleToggleAutoRecord = async (eventId: string, currentEnabled: boolean) => {
    try {
      await toggleAutoRecord(eventId, !currentEnabled);
      toast.success(!currentEnabled ? 'Auto-recording scheduled for this meeting.' : 'Auto-recording turned off for this meeting.');
    } catch {
      toast.error('Failed to update event auto-record status.');
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((evt) => {
      const endTime = new Date(evt.end_time);
      const isPast = endTime < now;

      if (filterTab === 'upcoming' && isPast) return false;
      if (filterTab === 'past' && !isPast) return false;

      if (platformFilter !== 'all' && evt.meeting_platform !== platformFilter) return false;

      return true;
    });
  }, [events, filterTab, platformFilter]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.end_time) >= now && e.auto_record_enabled).length;
  }, [events]);

  const isConnected = connection?.connected;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-[68px] bg-background/95 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">Calendar Schedule</span>
        </div>

        <div className="flex items-center gap-3">
          <WorkspaceSwitcher />
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="pl-2 border-l border-border">
            <UserNavDropdown user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Left Folder Sidebar for Navigation */}
        <aside className="w-56 shrink-0 hidden md:block">
          <FolderSidebar />
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <CalendarIcon className="h-6 w-6 text-primary" />
                Meeting Schedule
              </h1>
              <p className="text-xs text-muted-foreground">
                Synchronized with your Google Calendar. Youten AI automatically dispatches bot 2 minutes before meeting starts.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Calendar'}</span>
                </Button>
              )}
              <Link href="/settings?tab=integrations">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Integration Settings</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Not Connected Banner */}
          {!isConnected && !isLoadingStatus && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarCheck2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-foreground">Connect Google Calendar for Automated Meeting Notes</h3>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Link your Google Calendar to automatically detect upcoming Google Meet and Zoom calls. The bot will join and record without manual link pasting.
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => void connect()} className="gap-2 shrink-0 text-xs font-semibold">
                  <Link2 className="h-4 w-4" />
                  <span>Connect Google Calendar</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Metrics Bar */}
          {isConnected && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Upcoming Auto-Record</span>
                  <p className="text-xl font-bold text-primary mt-0.5">{upcomingCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Total Detected Events</span>
                  <p className="text-xl font-bold text-foreground mt-0.5">{events.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Sync Account</span>
                  <p className="text-xs font-semibold text-foreground truncate max-w-[150px] mt-0.5">
                    {connection?.google_email || 'Connected'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border w-full sm:w-auto">
              {[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'all', label: 'All Events' },
                { id: 'past', label: 'Past' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as 'upcoming' | 'all' | 'past')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterTab === tab.id
                      ? 'bg-background text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-muted-foreground">Platform:</span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Platforms</option>
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="ms_teams">Microsoft Teams</option>
              </select>
            </div>
          </div>

          {/* Events List */}
          {isLoadingEvents ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-muted/10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No meetings found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {filterTab === 'upcoming'
                    ? 'There are no upcoming meetings with video links detected in your calendar.'
                    : 'No calendar events match the selected filter.'}
                </p>
              </div>
              {isConnected && (
                <Button variant="outline" size="sm" onClick={handleSyncNow} className="text-xs gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync from Google</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((evt) => {
                const startTime = new Date(evt.start_time);
                const endTime = new Date(evt.end_time);
                const isPast = endTime < new Date();

                const platformBadgeColor =
                  evt.meeting_platform === 'google_meet'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : evt.meeting_platform === 'zoom'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';

                const platformLabel =
                  evt.meeting_platform === 'google_meet'
                    ? 'Google Meet'
                    : evt.meeting_platform === 'zoom'
                    ? 'Zoom'
                    : evt.meeting_platform === 'ms_teams'
                    ? 'MS Teams'
                    : 'Online Meeting';

                return (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-xl border transition-all ${
                      evt.auto_record_enabled
                        ? 'border-border bg-card shadow-xs'
                        : 'border-border/60 bg-muted/20 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${platformBadgeColor}`}>
                            <Video className="h-3 w-3 mr-1" />
                            {platformLabel}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground truncate">{evt.title}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} •{' '}
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {evt.organizer_email && (
                            <span className="truncate max-w-[200px]">
                              Host: {evt.organizer_email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions & Status */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {evt.meeting_url && (
                          <a
                            href={evt.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Join Link</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}

                        {evt.recording_id ? (
                          <Link href={`/recordings/${evt.recording_id}`}>
                            <Badge className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer">
                              View Recording
                            </Badge>
                          </Link>
                        ) : !isPast ? (
                          <div className="flex items-center gap-2 pl-3 border-l border-border">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {evt.auto_record_enabled ? 'Auto-Record' : 'Do Not Record'}
                            </span>
                            <Switch
                              checked={evt.auto_record_enabled}
                              onCheckedChange={() => handleToggleAutoRecord(evt.id, evt.auto_record_enabled)}
                              size="sm"
                            />
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer className="mt-auto" />
      <WorkspaceChatDrawer />
    </div>
  );
}
