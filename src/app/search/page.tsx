'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import {
  SearchResultItemDTO,
  SemanticSearchResponse,
  WorkspaceAskResponse,
  MeetingSourceCitationDTO,
} from '@/server/dtos/workspace.dto';
import { ChatMessageInput } from '@/server/dtos/chat.dto';
import { ChatRole } from '@/server/constants/recording.constant';
import { Button } from '@/components/atoms/button';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { Input } from '@/components/atoms/input';
import { Card } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/atoms/tabs';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/atoms/command';
import { UserChip } from '@/components/molecules/user-chip';
import { EmptyState } from '@/components/molecules/empty-state';
import { SearchResultCard } from '@/components/molecules/search-result-card';
import { CitationBadge } from '@/components/atoms/citation-badge';
import { toast } from 'sonner';
import {
  Search,
  Sparkles,
  Command as CommandIcon,
  Bot,
  Send,
  RefreshCw,
  LogOut,
  ArrowLeft,
  X,
  PlayCircle,
  FolderOpen,
  SlidersHorizontal,
  ChevronRight,
  User,
  Quote,
  Users,
} from 'lucide-react';

let messageSequence = 1;
function createMessageId(prefix: 'usr' | 'ai'): string {
  messageSequence += 1;
  return `${prefix}-${messageSequence}`;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MeetingSourceCitationDTO[];
  timestamp: string;
}

const SEARCH_QUICK_CHIPS = [
  'Sprint Planning',
  'Architecture Review',
  'Action Items',
  'Jadwal Rilis',
  'Budget Marketing',
];

const ASK_SUGGESTIONS = [
  'Apa rangkuman keputusan arsitektur terbaru?',
  'Kapan target rilis produk versi 2?',
  'Siapa yang bertanggung jawab untuk pengujian QA?',
  'Isu utama apa saja yang dibahas pada sprint terakhir?',
];

export default function SearchPage() {
  const router = useRouter();

  // Auth User State
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'semantic' | 'ask'>('semantic');

  // Global Command Dialog State
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Semantic Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [threshold, setThreshold] = useState(0.0);
  const [limit] = useState(20);
  const [searchResults, setSearchResults] = useState<SearchResultItemDTO[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Workspace Ask AI State
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Halo! Saya asisten memori workspace Youten AI. Tanyakan apa saja mengenai rapat, keputusan, atau poin diskusi yang pernah dicatat di seluruh arsip rekaman Anda.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  // 1. Auth Guard Lifecycle
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const res = await apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me');
        if (mounted) {
          if (res.data) {
            setUser(res.data);
          } else {
            router.push('/login?redirect=/search');
          }
        }
      } catch {
        if (mounted) {
          router.push('/login?redirect=/search');
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  // 2. Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // 3. Handle Logout
  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      toast.error('Gagal keluar dari sesi. Silakan coba kembali.');
    }
  };

  // 4. Handle Semantic Search
  const handleExecuteSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) {
      toast.error('Silakan masukkan kata kunci pencarian');
      return;
    }

    if (queryText !== undefined) {
      setSearchQuery(queryText);
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const queryParams = new URLSearchParams({
        q,
        limit: String(limit),
        threshold: String(threshold),
      });

      const res = await apiFetch<ApiResponse<SemanticSearchResponse>>(
        `/api/recordings/search?${queryParams.toString()}`
      );

      if (res.data) {
        setSearchResults(res.data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal melakukan pencarian semantik.';
      setSearchError(msg);
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // 5. Handle Ask Workspace
  const handleAskWorkspace = async (e?: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    const q = (customQuestion || questionInput).trim();
    if (!q || isAsking) return;

    const userMessage: ChatMessageItem = {
      id: createMessageId('usr'),
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestionInput('');
    setIsAsking(true);
    setAskError(null);

    try {
      const historyPayload: ChatMessageInput[] = messages
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({
          role: m.role as ChatRole,
          content: m.content,
        }));

      const res = await apiFetch<ApiResponse<WorkspaceAskResponse>>('/api/recordings/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          history: historyPayload.length > 0 ? historyPayload : undefined,
        }),
      });

      if (res.data) {
        const assistantMessage: ChatMessageItem = {
          id: createMessageId('ai'),
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources || [],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mendapatkan respon dari memori workspace.';
      setAskError(msg);
      toast.error(msg);
    } finally {
      setIsAsking(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 space-y-4">
        <YoutenLogo size="lg" className="animate-pulse shadow-lg" />
        <p className="text-sm font-medium text-slate-500">Memeriksa autentikasi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-16 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <Link href="/dashboard" className="flex items-center gap-2 group">
              <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Youten AI
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">
                  Search & Ask
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Cmd+K trigger button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 text-xs text-slate-500 border-slate-200 hover:border-blue-300 h-9"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Cari cepat...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">
                <CommandIcon className="w-2.5 h-2.5" /> K
              </kbd>
            </Button>

            <Link href="/speakers">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-300 h-9"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Direktori Pembicara</span>
              </Button>
            </Link>

            <Link href="/settings">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-300 h-9"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Pengaturan</span>
              </Button>
            </Link>

            <UserChip
              name={user?.full_name || 'Pengguna'}
              role={user?.email || 'Akun Terverifikasi'}
              initials={
                user?.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'U'
              }
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Sparkles className="w-3.5 h-3.5" />
                Kecerdasan Memori Rapat
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Pencarian Semantik &amp; Memori AI Workspace
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Jelajahi seluruh arsip transkrip, keputusan, dan diskusi dari seluruh rekaman rapat Anda menggunakan pencarian vektor atau tanyakan langsung ke memori AI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/recordings/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium shadow-sm shadow-blue-500/20">
                <span>Rekaman Baru</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Workspace Search & Ask Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'semantic' | 'ask')}
          className="space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="semantic"
                onClick={() => setActiveTab('semantic')}
                className="gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Pencarian Semantik</span>
              </TabsTrigger>
              <TabsTrigger
                value="ask"
                onClick={() => setActiveTab('ask')}
                className="gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs"
              >
                <Bot className="w-4 h-4" />
                <span>Tanya Workspace AI</span>
              </TabsTrigger>
            </TabsList>

            <span className="text-xs text-slate-500 hidden sm:inline">
              Tekan <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-[10px]">Cmd+K</kbd> untuk modal cepat
            </span>
          </div>

          {/* TAB 1: PENCARIAN SEMANTIK */}
          <TabsContent value="semantic" className="space-y-6 focus:outline-hidden">
            {/* Search Input Bar Card */}
            <Card className="border border-slate-200/80 bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteSearch();
                }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan makna, topik, atau kata kunci rapat..."
                    className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-sm focus-visible:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 rounded-xl font-medium w-full sm:w-auto shadow-sm shadow-blue-500/20"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Cari</span>
                  </Button>
                </div>
              </form>

              {/* Quick Chips & Filter Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium">Contoh pencarian:</span>
                  {SEARCH_QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleExecuteSearch(chip)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Relevance Threshold selector */}
                <div className="flex items-center gap-2 self-end sm:self-auto text-slate-500">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Ambang Relevansi:</span>
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={0.0}>Semua (0%)</option>
                    <option value={0.5}>Sedang (&gt;50%)</option>
                    <option value={0.7}>Tinggi (&gt;70%)</option>
                    <option value={0.85}>Sangat Tinggi (&gt;85%)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Results Section */}
            {isSearching ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            ) : searchError ? (
              <Card className="border border-rose-200 bg-rose-50/50 rounded-2xl p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-700">{searchError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecuteSearch()}
                  className="gap-2 bg-white hover:bg-rose-50 border-rose-200 text-rose-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </Button>
              </Card>
            ) : hasSearched && searchResults.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="w-8 h-8 text-slate-400" />}
                title="Tidak Ada Hasil Ditemukan"
                description={`Tidak ada segmen rapat yang cocok dengan "${searchQuery}". Coba gunakan kata kunci umum atau turunkan ambang batas relevansi.`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setHasSearched(false);
                    }}
                    className="text-xs"
                  >
                    Atur Ulang Pencarian
                  </Button>
                }
              />
            ) : hasSearched && searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Ditemukan <strong className="text-slate-800">{searchResults.length}</strong> potongan transkrip relevan
                  </span>
                  <span>Diurutkan berdasarkan skor relevansi semantik</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((item, idx) => (
                    <SearchResultCard
                      key={`${item.recording_id}-${item.chunk_index}-${idx}`}
                      result={item}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Pre-search informative guide */
              <Card className="border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-bold text-base text-slate-900">
                    Mulai Pencarian Semantik
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ketik topik atau pertanyaan di kolom pencarian di atas untuk menemukan pembahasan spesifik dalam seluruh arsip rapat Anda.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: TANYA WORKSPACE AI */}
          <TabsContent value="ask" className="space-y-6 focus:outline-hidden">
            <Card className="border border-slate-200/80 bg-white rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[500px]">
              {/* Chat Feed Header */}
              <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Asisten Memori AI Workspace
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Menganalisis dan menyintesis jawaban dari seluruh rapat yang Anda miliki
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setMessages([
                      {
                        id: 'welcome-reset',
                        role: 'assistant',
                        content:
                          'Riwayat percakapan telah dibersihkan. Silakan tanyakan hal lain seputar rapat Anda.',
                        timestamp: new Date().toISOString(),
                      },
                    ])
                  }
                  className="text-xs text-slate-500 hover:text-slate-800 gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Bersihkan Chat</span>
                </Button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed space-y-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Attached Sources & Citations if available */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Quote className="w-3 h-3 text-blue-600" />
                            Sumber Rujukan ({msg.sources.length} Segmen):
                          </span>
                          <div className="space-y-2">
                            {msg.sources.map((src, sIdx) => (
                              <div
                                key={`${src.recording_id}-${src.chunk_index}-${sIdx}`}
                                className="bg-white border border-slate-200/80 rounded-xl p-2.5 space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <Link
                                    href={`/recordings/${src.recording_id}?t=${Math.floor(
                                      src.start_time
                                    )}`}
                                    className="font-semibold text-blue-600 hover:underline truncate"
                                  >
                                    {src.recording_title}
                                  </Link>
                                  <CitationBadge
                                    timestamp={src.start_time}
                                    recordingTitle={src.recording_title}
                                    snippet={src.snippet}
                                  />
                                </div>
                                <p className="text-[11px] text-slate-600 italic line-clamp-2">
                                  &ldquo;{src.snippet}&rdquo;
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isAsking && (
                  <div className="flex items-start gap-3.5 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-bl-xs p-4 text-xs text-slate-600 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Youten AI sedang menganalisis rekaman rapat Anda...</span>
                    </div>
                  </div>
                )}

                {askError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
                    <span>{askError}</span>
                    <button
                      type="button"
                      onClick={() => setAskError(null)}
                      className="underline font-semibold ml-2 hover:text-rose-800"
                    >
                      Tutup
                    </button>
                  </div>
                )}
              </div>

                {/* Suggestions Carousel / Chips */}
              <div className="px-6 py-2 bg-slate-50/40 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-slate-400 font-medium shrink-0">Saran:</span>
                {ASK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAskWorkspace(undefined, suggestion)}
                    disabled={isAsking}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 whitespace-nowrap disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleAskWorkspace}
                className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Tanyakan sesuatu tentang rapat Anda (contoh: Apa komitmen sprint minggu ini?)..."
                    disabled={isAsking}
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-xl text-sm focus-visible:ring-blue-500 pr-10"
                  />
                  {questionInput && (
                    <button
                      type="button"
                      onClick={() => setQuestionInput('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isAsking || !questionInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-5 rounded-xl font-medium shadow-sm shadow-blue-500/20 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Kirim</span>
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Global Cmd+K Command Dialog */}
      <CommandDialog
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        title="Pencarian Cepat Workspace"
        description="Cari rekaman atau navigasi ke menu workspace"
      >
        <CommandInput placeholder="Ketik kata kunci untuk mencari..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil yang ditemukan.</CommandEmpty>
          <CommandGroup heading="Aksi Pencarian">
            <CommandItem
              onSelect={() => {
                setActiveTab('semantic');
                setIsCommandOpen(false);
              }}
            >
              <Search className="mr-2 h-4 w-4 text-blue-600" />
              <span>Buka Mode Pencarian Semantik</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('ask');
                setIsCommandOpen(false);
              }}
            >
              <Bot className="mr-2 h-4 w-4 text-blue-600" />
              <span>Buka Asisten Memori Workspace AI</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigasi Cepat">
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false);
                router.push('/dashboard');
              }}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Dashboard Rekaman</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false);
                router.push('/recordings/new');
              }}
            >
              <PlayCircle className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Unggah Rekaman Baru</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
