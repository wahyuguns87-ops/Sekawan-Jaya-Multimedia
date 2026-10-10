/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Music,
  Palette,
  TrendingUp,
  Search,
  X,
  Copy,
  Check,
  Sparkles,
  Sliders,
  FileText,
  AlertCircle,
  Loader2,
  Share2,
  Info,
  CheckCircle2,
  Volume2,
  Settings,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Save,
  XCircle,
} from 'lucide-react';

interface MusicPlanResult {
  titleSuggestions: string[];
  styleOfMusic: string;
  lyrics: string;
  recommendedSettings: {
    styleInfluence: string;
    weirdness: string;
    bpm: string;
    settingsExplanation: string;
  };
  producerNotes: string;
}

interface VisualResult {
  conceptTitle: string;
  thumbnailPrompt: string;
  coverArtPrompt: string;
  videoVisualizerConcept: string;
  colorPalette: string[];
  negativePrompt: string;
}

interface TrendResult {
  summary: string;
  marketSignals: string[];
  audienceDemographics: string;
  contentOpportunities: {
    title: string;
    rationale: string;
    suggestedFormat: string;
  }[];
  actionableStrategy: string;
}

export default function App() {
  // Navigation & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<
    'music' | 'visual' | 'research' | 'settings' | null
  >(null);

  // Server Health state for Settings
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    hasApiKey: boolean;
    service: string;
    latencyMs: number;
    lastChecked: string;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const json = await res.json();
      const duration = Math.round(performance.now() - start);
      setServerHealth({
        ...json,
        latencyMs: duration,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch {
      setServerHealth({
        status: 'error',
        hasApiKey: false,
        service: 'Offline / Gagal Terhubung',
        latencyMs: 0,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // User Session API Key State
  const [activeApiKey, setActiveApiKey] = useState<string>(() => {
    return sessionStorage.getItem('gemini_user_api_key') || '';
  });
  const [inputApiKey, setInputApiKey] = useState<string>(() => {
    return sessionStorage.getItem('gemini_user_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'claude'>('gemini');
  const [connectionStatus, setConnectionStatus] = useState<
    'not_configured' | 'testing' | 'connected' | 'failed'
  >(() => {
    return sessionStorage.getItem('gemini_user_api_key') ? 'connected' : 'not_configured';
  });
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  const handleTestConnection = async () => {
    const keyToTest = inputApiKey.trim();
    if (!keyToTest) {
      setConnectionStatus('failed');
      setStatusFeedback('Masukkan API key terlebih dahulu sebelum menguji koneksi.');
      return;
    }
    setConnectionStatus('testing');
    setStatusFeedback('Menguji koneksi ke Google Gemini 3.8 Flash...');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': keyToTest,
        },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionStatus('connected');
        setStatusFeedback('Koneksi berhasil diverifikasi! API key siap digunakan.');
      } else {
        setConnectionStatus('failed');
        setStatusFeedback(data.error || 'Pengujian koneksi gagal. Periksa kembali API key Anda.');
      }
    } catch {
      setConnectionStatus('failed');
      setStatusFeedback('Gagal menghubungi server untuk verifikasi koneksi.');
    }
  };

  const handleSaveApiKey = () => {
    const key = inputApiKey.trim();
    if (!key) {
      setConnectionStatus('not_configured');
      setStatusFeedback('Kolom API key kosong. Masukkan kunci sebelum menyimpan.');
      return;
    }
    sessionStorage.setItem('gemini_user_api_key', key);
    setActiveApiKey(key);
    setConnectionStatus('connected');
    setStatusFeedback('API key berhasil disimpan pada sesi aktif browser Anda! ✓');
  };

  const handleRemoveApiKey = () => {
    sessionStorage.removeItem('gemini_user_api_key');
    setActiveApiKey('');
    setInputApiKey('');
    setConnectionStatus('not_configured');
    setStatusFeedback('API key telah dihapus dari sesi aktif.');
  };

  // Music Form State (Preserved across runs)
  const [audience, setAudience] = useState('USA');
  const [genre, setGenre] = useState('Reggae');
  const [referenceChannel, setReferenceChannel] = useState('');
  const [theme, setTheme] = useState('');
  const [mood, setMood] = useState('Hangat & santai');
  const [language, setLanguage] = useState('English (natural, conversational)');
  const [vocal, setVocal] = useState('Pria — hangat, lembut, dan emosional');
  const [mode, setMode] = useState('Lagu baru dengan vokal dan lirik');
  const [format, setFormat] = useState('YouTube long video (video panjang)');
  const [notes, setNotes] = useState('');

  // Visual Form State
  const [visualTheme, setVisualTheme] = useState('');
  const [visualGenre, setVisualGenre] = useState('Pop');
  const [visualMood, setVisualMood] = useState('Energik');
  const [visualFormat, setVisualFormat] = useState('YouTube Thumbnail (16:9)');
  const [visualNotes, setVisualNotes] = useState('');

  // Research Form State
  const [researchAudience, setResearchAudience] = useState('USA');
  const [researchGenre, setResearchGenre] = useState('Reggae');
  const [researchTheme, setResearchTheme] = useState('');
  const [researchNotes, setResearchNotes] = useState('');

  // AI Loading & Results State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [musicResult, setMusicResult] = useState<MusicPlanResult | null>(null);
  const [visualResult, setVisualResult] = useState<VisualResult | null>(null);
  const [trendResult, setTrendResult] = useState<TrendResult | null>(null);

  // Copy Feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const triggerCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  // Open modal handler
  const openModal = (type: 'music' | 'visual' | 'research' | 'settings') => {
    setActiveModal(type);
    setErrorMessage(null);
    if (type === 'settings') {
      runHealthCheck();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrorMessage(null);
  };

  // Generate Music Plan with Gemini
  const handleGenerateMusic = async () => {
    if (!activeApiKey.trim()) {
      setErrorMessage(
        'API key belum dikonfigurasi! Buka menu Pengaturan (ikon roda gigi di kanan atas) untuk memasukkan Google Gemini API key Anda.'
      );
      return;
    }

    if (!theme.trim()) {
      setErrorMessage('Tema proyek wajib diisi! Masukkan tema lagu untuk hasil yang spesifik.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/plan-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': activeApiKey.trim(),
        },
        body: JSON.stringify({
          apiKey: activeApiKey.trim(),
          audience,
          genre,
          referenceChannel,
          theme,
          mood,
          language,
          vocal,
          mode,
          format,
          notes,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghasilkan Plan Music.');
      }

      setMusicResult(json.data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Visual Prompts with Gemini
  const handleGenerateVisual = async () => {
    if (!activeApiKey.trim()) {
      setErrorMessage(
        'API key belum dikonfigurasi! Buka menu Pengaturan (ikon roda gigi di kanan atas) untuk memasukkan Google Gemini API key Anda.'
      );
      return;
    }

    if (!visualTheme.trim()) {
      setErrorMessage('Tema visual wajib diisi!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/visual-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': activeApiKey.trim(),
        },
        body: JSON.stringify({
          apiKey: activeApiKey.trim(),
          theme: visualTheme,
          genre: visualGenre,
          mood: visualMood,
          format: visualFormat,
          notes: visualNotes,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghasilkan Visual Prompt.');
      }

      setVisualResult(json.data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Trend Research with Gemini
  const handleGenerateResearch = async () => {
    if (!activeApiKey.trim()) {
      setErrorMessage(
        'API key belum dikonfigurasi! Buka menu Pengaturan (ikon roda gigi di kanan atas) untuk memasukkan Google Gemini API key Anda.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/trend-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': activeApiKey.trim(),
        },
        body: JSON.stringify({
          apiKey: activeApiKey.trim(),
          audience: researchAudience,
          genre: researchGenre,
          theme: researchTheme,
          notes: researchNotes,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghasilkan riset tren.');
      }

      setTrendResult(json.data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Cards data
  const cards = [
    {
      id: 'music' as const,
      tag: 'CREATE',
      icon: '🎵',
      title: 'PLAN MUSIC',
      desc: 'Style of Music + struktur + lirik siap salin ke Suno',
      fullDesc:
        'Hasilkan paket lagu orisinal yang siap disalin ke Suno: Style of Music, struktur lagu, dan lirik human sesuai konsep dengan intro singkat 1 bar.',
    },
    {
      id: 'visual' as const,
      tag: 'VISUAL',
      icon: '🎨',
      title: 'VISUAL PROMPT',
      desc: 'Thumbnail, cover art, visualizer, video',
      fullDesc:
        'Buat prompt visual khusus untuk thumbnail YouTube 16:9, cover art 1:1, visualizer, dan video musik yang sesuai dengan karya.',
    },
    {
      id: 'research' as const,
      tag: 'RESEARCH',
      icon: '📈',
      title: 'MUSIC TREND RESEARCH',
      desc: 'Validasi tren musik dan ide konten',
      fullDesc:
        'Riset dan validasi peluang musik yang sedang naik berdasarkan negara, genre, kata kunci, dan bukti sumber.',
    },
  ];

  const filteredCards = cards.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.fullDesc.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1180px] mx-auto px-5 py-7 sm:py-9">
      {/* HEADER */}
      <header className="border border-[#343044] bg-gradient-to-br from-[#1b1d2ef5] to-[#0e111afa] rounded-[24px] p-6 sm:p-9 text-center shadow-[0_18px_55px_rgba(0,0,0,0.35)] relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-[#e7b83f0f] via-transparent to-transparent pointer-events-none" />

        {/* IKON RODA GIGI DI KANAN ATAS DASHBOARD */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <button
            onClick={() => openModal('settings')}
            className="bg-[#141824] hover:bg-[#1e2436] border border-[#374059] hover:border-[#ffd977] text-[#ffd977] p-2.5 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer shadow-lg hover:scale-105 flex items-center gap-2 group"
            title="Buka Menu Pengaturan (AI Provider & API Key)"
            aria-label="Pengaturan Studio"
          >
            <Settings className="w-4 h-4 text-[#e7b83f] group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline text-xs font-semibold text-[#ffd977]">Pengaturan</span>
          </button>
        </div>

        <h1 className="brand-font text-[32px] sm:text-[48px] md:text-[54px] text-[#e7b83f] tracking-tight leading-tight drop-shadow-[0_0_25px_rgba(231,184,63,0.18)]">
          Sekawan Jaya Multimedia™
        </h1>
        <div className="mt-2 mb-4 text-[#e6e2d7] font-semibold text-xs sm:text-[13px] tracking-wide">
          ✦ <span className="text-[#e7b83f]">AI MUSIC</span> · VISUAL · YOUTUBE CREATOR STUDIO ✦
        </div>
        <div className="flex justify-center gap-2.5 flex-wrap">
          <span className="border border-[#343a4c] bg-[#202535] rounded-full px-3.5 py-1.5 text-xs text-[#dce0e9]">
            🎵 Music Lab
          </span>
          <span className="border border-[#343a4c] bg-[#202535] rounded-full px-3.5 py-1.5 text-xs text-[#dce0e9]">
            🎨 Visual Studio
          </span>
          <span className="border border-[#343a4c] bg-[#202535] rounded-full px-3.5 py-1.5 text-xs text-[#dce0e9]">
            📈 Creator Growth
          </span>
          <button
            onClick={() => openModal('settings')}
            className="border border-[#554728] hover:border-[#ffd977] bg-[#221c12] hover:bg-[#2e2518] text-[#ffd977] rounded-full px-3.5 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer font-medium shadow-sm hover:scale-105"
          >
            <Settings className="w-3.5 h-3.5 text-[#e7b83f]" />
            <span>⚙️ Pengaturan & Kunci API</span>
          </button>
        </div>
        <button
          onClick={() => openModal('settings')}
          className={`inline-flex items-center gap-2 mt-4.5 border rounded-full px-3.5 py-1.5 text-[11px] transition-all cursor-pointer ${
            activeApiKey
              ? 'bg-[#14251f] hover:bg-[#1a3329] border-[#28513e] text-[#8ff0c4]'
              : 'bg-[#2b1f13] hover:bg-[#382817] border-[#5e411b] text-[#ffd977]'
          }`}
          title="Klik untuk membuka pengaturan AI Provider & API Key"
        >
          {activeApiKey ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#49d49d] shadow-[0_0_10px_#49d49d] animate-pulse" />
              <span>AI Engine Siap · Gemini 3.8 Flash (Kunci Sesi Aktif)</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b] animate-ping" />
              <span>⚠️ API Key Belum Dikonfigurasi (Klik Pengaturan untuk Memasukkan Key)</span>
            </>
          )}
        </button>
      </header>

      {/* SECTION HEAD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-8 mb-4">
        <div>
          <h2 className="text-[19px] font-semibold text-[#f4f3ef] m-0">Creator Dashboard</h2>
          <p className="mt-1 text-[13px] text-[#a3a9b8]">
            Pilih alat untuk mulai menyusun proyek kreatif Anda dengan AI sungguhan.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-[270px] relative">
            <input
              id="search"
              type="search"
              placeholder="⌕ Cari fitur, mis. reggae, thumbnail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111521] border border-[#292f40] rounded-xl text-[#f4f3ef] px-3.5 py-2.5 outline-none focus:border-[#e7b83f] transition-colors text-sm"
            />
          </div>
          <button
            onClick={() => openModal('settings')}
            className="border border-[#3b435b] hover:border-[#ffd977] bg-[#161c2a] hover:bg-[#20293d] text-[#ffd977] rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Buka Pengaturan Studio & Kunci API"
          >
            <Settings className="w-4 h-4 text-[#e7b83f]" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </div>

      {/* MAIN CARDS GRID */}
      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filteredCards.map((card) => (
          <button
            key={card.id}
            onClick={() => openModal(card.id)}
            className="relative min-h-[142px] bg-gradient-to-br from-[#131722] to-[#0f121b] border border-[#252b3a] hover:border-[#9e7a2a] focus:border-[#e7b83f] rounded-2xl p-4.5 flex flex-col items-center justify-center text-center gap-2.5 text-[#f4f3ef] transition-all duration-200 hover:-translate-y-1 hover:bg-[#171a25] shadow-lg group cursor-pointer"
          >
            <span className="absolute top-2.5 right-2.5 text-[9px] border border-[#3a3440] rounded-full px-2 py-0.5 text-[#e7c76f] bg-[#201d25] font-semibold">
              {card.tag}
            </span>
            <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(220,169,43,0.18)] group-hover:scale-110 transition-transform">
              {card.icon}
            </span>
            <strong className="text-xs tracking-wider text-[#ffd977] font-bold">
              {card.title}
            </strong>
            <small className="text-[11px] text-[#a3a9b8] max-w-[240px] leading-tight">
              {card.desc}
            </small>
          </button>
        ))}
      </main>

      {/* NOTICE BOX */}
      <div className="mt-6 border border-[#343044] bg-[#111521] rounded-2xl p-4.5 flex gap-3.5 items-start">
        <div className="text-2xl text-[#ffd977] shrink-0">💡</div>
        <div>
          <h3 className="m-0 mb-1 text-sm font-semibold text-[#f4f3ef]">
            Integrasi AI Otentik & Siap Pakai
          </h3>
          <p className="m-0 text-xs text-[#a3a9b8] leading-relaxed">
            Plan Music telah terhubung secara penuh ke Google Gemini di backend. Setiap generasi
            menghasilkan Style of Music spesifik Suno, lirik orisinal tanpa [Bridge] dengan intro 1
            bar, dan rekomendasi slider terpisah yang siap Anda pakai.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-[#777f90] text-xs mt-7 pb-4">
        SEKAWAN JAYA MULTIMEDIA™ · Creator Studio · Powered by Google Gemini 3.8 Flash
      </footer>

      {/* MODAL BACKDROP */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-[#03040ad9] backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[760px] max-h-[92vh] overflow-y-auto bg-[#111521] border border-[#494052] rounded-[22px] p-5 sm:p-7 shadow-[0_25px_90px_rgba(0,0,0,0.65)] text-left flex flex-col gap-4">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-start gap-4 border-b border-[#252b3a] pb-4">
              <div>
                <h2 className="text-[#ffd977] text-xl sm:text-2xl font-bold flex items-center gap-2">
                  {activeModal === 'music' && <>🎵 Plan Music</>}
                  {activeModal === 'visual' && <>🎨 Visual Prompt Studio</>}
                  {activeModal === 'research' && <>📈 Music Trend Research</>}
                  {activeModal === 'settings' && <>⚙️ Pengaturan Studio & Kunci API</>}
                </h2>
                <p className="text-xs sm:text-sm text-[#a3a9b8] mt-1">
                  {activeModal === 'music' &&
                    'Hasilkan Style of Music dan lirik berstruktur orisinal siap salin ke Suno.'}
                  {activeModal === 'visual' &&
                    'Buat prompt visual khusus thumbnail, cover art, visualizer, dan video.'}
                  {activeModal === 'research' &&
                    'Validasi data dan peluang tren musik berdasarkan target audiens dan genre.'}
                  {activeModal === 'settings' &&
                    'Pantau koneksi engine AI dan kelola kunci API Anda dengan aman tanpa membebani kuota.'}
                </p>
                {activeModal === 'music' && (
                  <div className="mt-2 text-[11px] text-[#e7c76f] bg-[#221e14] border border-[#483c18] rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Dihasilkan melalui Gemini API server-side: Tanpa [Bridge], intro 1 bar,
                      rekomendasi slider terpisah.
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={closeModal}
                className="bg-[#242938] hover:bg-[#32394d] border border-[#394052] text-white rounded-xl w-9 h-9 flex items-center justify-center text-lg transition-colors cursor-pointer shrink-0"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="bg-[#2e1315] border border-[#6b2529] rounded-xl p-3.5 text-xs text-[#fca5a5] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ef4444]" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
                {errorMessage.includes('Pengaturan') && (
                  <button
                    onClick={() => openModal('settings')}
                    className="bg-[#e7b83f] hover:bg-[#ffd977] text-[#17130a] px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer shadow flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Buka Settings</span>
                  </button>
                )}
              </div>
            )}

            {/* FORM BODY FOR MUSIC */}
            {activeModal === 'music' && (
              <div className="flex flex-col gap-3.5 text-xs text-[#d5d8e0]">
                {/* AUDIENCE & GENRE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">
                      Target audiens / negara
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>USA</option>
                      <option>United Kingdom</option>
                      <option>Germany</option>
                      <option>France</option>
                      <option>Spain</option>
                      <option>Italy</option>
                      <option>Netherlands</option>
                      <option>Sweden</option>
                      <option>Global English-speaking audience</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Genre musik</label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>Reggae</option>
                      <option>Blues</option>
                      <option>Jazz</option>
                      <option>Pop</option>
                      <option>R&B / Soul</option>
                      <option>Hip-Hop / Rap</option>
                      <option>Rock / Alternative</option>
                      <option>Electronic / Dance</option>
                      <option>Ambient / Lo-fi</option>
                      <option>Cinematic / Orchestral</option>
                      <option>Acoustic / Folk / Country</option>
                      <option>Latin / Global Fusion</option>
                      <option>Genre fusion (gabungan beberapa genre)</option>
                    </select>
                  </div>
                </div>

                {/* THEME (Wajib) & REFERENCE CHANNEL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#ffd977] flex items-center justify-between">
                      <span>Tema lagu / konsep cerita *</span>
                      <span className="text-[10px] text-[#e7b83f]">Wajib diisi</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kebebasan di pantai, kenangan masa kecil, perjuangan"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">
                      Channel referensi musik (opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nama atau URL channel YouTube referensi"
                      value={referenceChannel}
                      onChange={(e) => setReferenceChannel(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    />
                  </div>
                </div>

                {/* MOOD & BAHASA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Mood utama</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>Hangat & santai</option>
                      <option>Emosional & penuh harapan</option>
                      <option>Romantis & dreamy</option>
                      <option>Energik & membangkitkan semangat</option>
                      <option>Melankolis & introspektif</option>
                      <option>AI pilih mood terbaik berdasarkan konsep</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Bahasa lirik</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>English (natural, conversational)</option>
                      <option>English (poetic but natural)</option>
                      <option>Bahasa Indonesia</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Instrumental — no lyrics</option>
                    </select>
                  </div>
                </div>

                {/* VOCAL & MODE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Karakter vokal</label>
                    <select
                      value={vocal}
                      onChange={(e) => setVocal(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>Pria — hangat, lembut, dan emosional</option>
                      <option>Pria — serak, soulful, dan berkarakter</option>
                      <option>Pria — ringan, jernih, dan melodis</option>
                      <option>Pria — kuat, energik, dan ekspresif</option>
                      <option>Wanita — lembut, intim, dan emosional</option>
                      <option>Wanita — soulful, kaya ekspresi, dan hangat</option>
                      <option>Wanita — kuat, jernih, dan penuh tenaga</option>
                      <option>Duet pria dan wanita</option>
                      <option>Vokal grup / backing vocal harmonis</option>
                      <option>Tanpa vokal — instrumental</option>
                      <option>AI memilih karakter vokal paling cocok</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Mode produksi</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>Lagu baru dengan vokal dan lirik</option>
                      <option>Musik instrumental tanpa vokal</option>
                      <option>Lagu dengan vokal dan bagian instrumental</option>
                      <option>Lagu orisinal terinspirasi tren musik (bukan meniru lagu tertentu)</option>
                    </select>
                  </div>
                </div>

                {/* FORMAT & NOTES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Format konten</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>YouTube long video (video panjang)</option>
                      <option>YouTube Shorts (video pendek vertikal)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">
                      Catatan tambahan (opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Instrumen kunci, suasana akustik, tempo khusus, dll."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2.5 flex-wrap pt-2">
                  <button
                    onClick={handleGenerateMusic}
                    disabled={isLoading}
                    className="border border-[#d2a52f] bg-gradient-to-br from-[#f1c653] to-[#c9931d] text-[#17130a] font-bold rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(231,184,63,0.25)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#17130a]" />
                        <span>Menghubungkan Gemini 3.8 Flash...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current text-[#17130a]" />
                        <span>Generate AI Plan Music</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const brief = `SEKAWAN JAYA MULTIMEDIA™ Brief:
Target: ${audience} | Genre: ${genre}
Tema: ${theme || '-'} | Mood: ${mood}
Bahasa: ${language} | Vokal: ${vocal}
Mode: ${mode} | Format: ${format}
Catatan: ${notes || '-'}`;
                      triggerCopy(brief, 'raw-brief');
                    }}
                    className="border border-[#3a4053] bg-[#202536] hover:bg-[#2b3147] text-[#e8eaf0] rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'raw-brief' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#49d49d]" />
                        <span className="text-[#49d49d]">Brief Tersalin ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Input Brief</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RESULTS SECTION FOR MUSIC */}
                {musicResult && (
                  <div className="mt-4 flex flex-col gap-4 border-t border-[#2d3345] pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* TITLE SUGGESTIONS */}
                    <div className="bg-[#141824] border border-[#2e3549] rounded-xl p-3.5">
                      <div className="text-[11px] font-semibold text-[#a3a9b8] uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Opsi Judul Lagu Orisinal</span>
                        <span className="text-[#e7b83f] text-[10px]">Klik untuk salin</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {musicResult.titleSuggestions?.map((title, idx) => (
                          <button
                            key={idx}
                            onClick={() => triggerCopy(title, `title-${idx}`)}
                            className="bg-[#1b2030] hover:bg-[#23293f] border border-[#3b435b] rounded-lg px-3 py-1.5 text-xs text-[#ffd977] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>&quot;{title}&quot;</span>
                            {copiedKey === `title-${idx}` ? (
                              <Check className="w-3 h-3 text-[#49d49d]" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* RECOMMENDED SLIDERS BAR */}
                    <div className="bg-[#18151f] border border-[#483c26] rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#e7b83f]" />
                          <span className="text-xs font-semibold text-[#ffd977]">
                            Rekomendasi Setelan Slider Suno
                          </span>
                        </div>
                        <span className="text-[10px] text-[#a3a9b8]">
                          (Sesuaikan manual di Suno · Tidak digabung ke teks prompt)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
                        <div className="bg-[#110f17] border border-[#342b1f] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#a3a9b8] block">Style Influence</span>
                          <span className="text-xs font-bold text-[#ffd977]">
                            {musicResult.recommendedSettings?.styleInfluence || '65%'}
                          </span>
                        </div>
                        <div className="bg-[#110f17] border border-[#342b1f] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#a3a9b8] block">Weirdness</span>
                          <span className="text-xs font-bold text-[#ffd977]">
                            {musicResult.recommendedSettings?.weirdness || '20%'}
                          </span>
                        </div>
                        <div className="bg-[#110f17] border border-[#342b1f] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#a3a9b8] block">Rekomendasi Tempo</span>
                          <span className="text-xs font-bold text-[#49d49d]">
                            {musicResult.recommendedSettings?.bpm || '92 BPM'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#a3a9b8] bg-[#120f18] border border-[#2e2618] rounded-lg p-2.5 flex items-start gap-2 mt-1">
                        <Info className="w-4 h-4 text-[#e7b83f] shrink-0 mt-0.5" />
                        <span>
                          <strong>Perhatian:</strong> Rekomendasi di atas ditampilkan terpisah dan sengaja tidak dimasukkan ke dalam teks Style of Music agar prompt Suno Anda tetap bersih. Aplikasi ini tidak terhubung langsung ke Suno dan tidak mengubah slider Suno secara otomatis—silakan sesuaikan slider secara manual di Suno.
                        </span>
                      </div>

                      <p className="text-[11px] text-[#c7cbd6] m-0 italic mt-0.5">
                        💡 {musicResult.recommendedSettings?.settingsExplanation}
                      </p>
                    </div>

                    {/* TWO SEPARATE RESULT PANELS */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* PANEL 1: STYLE OF MUSIC */}
                      <div className="bg-[#0b0e16] border-2 border-[#d2a52f88] rounded-xl p-4 relative shadow-lg">
                        <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-[#252b3a]">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#e7b83f]" />
                            <h4 className="text-xs sm:text-sm font-bold text-[#ffd977] uppercase tracking-wider m-0">
                              1. STYLE OF MUSIC (SIAP SALIN KE SUNO)
                            </h4>
                          </div>
                          <button
                            onClick={() =>
                              triggerCopy(musicResult.styleOfMusic, 'style-of-music')
                            }
                            className="bg-[#242b3d] hover:bg-[#323c57] border border-[#485373] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedKey === 'style-of-music' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#49d49d]" />
                                <span className="text-[#49d49d]">Tersalin ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#ffd977]" />
                                <span>Salin Style of Music</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-[#a3a9b8] mb-2">
                          Tempelkan teks di bawah ke kolom input{' '}
                          <code className="text-[#ffd977] bg-[#1a1c24] px-1 py-0.5 rounded">
                            Style of Music
                          </code>{' '}
                          di Suno:
                        </div>
                        <div className="bg-[#07090f] border border-[#272d3f] rounded-lg p-3 text-[#f0f2f7] text-xs font-mono leading-relaxed whitespace-pre-wrap select-all">
                          {musicResult.styleOfMusic}
                        </div>
                      </div>

                      {/* PANEL 2: LYRICS / ARRANGEMENT */}
                      <div className="bg-[#0b0e16] border-2 border-[#49d49d66] rounded-xl p-4 relative shadow-lg">
                        <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-[#252b3a]">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#49d49d]" />
                            <h4 className="text-xs sm:text-sm font-bold text-[#8ff0c4] uppercase tracking-wider m-0">
                              {mode.toLowerCase().includes('instrumental') ||
                              language.toLowerCase().includes('instrumental') ||
                              vocal.toLowerCase().includes('tanpa vokal')
                                ? '2. ARANSEMEN STRUKTUR (SIAP SALIN KE SUNO)'
                                : '2. LYRICS (SIAP SALIN KE SUNO)'}
                            </h4>
                          </div>
                          <button
                            onClick={() => triggerCopy(musicResult.lyrics, 'lyrics-text')}
                            className="bg-[#183127] hover:bg-[#234538] border border-[#356752] text-[#8ff0c4] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedKey === 'lyrics-text' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#49d49d]" />
                                <span className="text-[#49d49d]">Tersalin ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#8ff0c4]" />
                                <span>
                                  {mode.toLowerCase().includes('instrumental') ||
                                  language.toLowerCase().includes('instrumental') ||
                                  vocal.toLowerCase().includes('tanpa vokal')
                                    ? 'Salin Aransemen'
                                    : 'Salin Lirik'}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-[#a3a9b8] mb-2 flex items-center gap-2">
                          <span>
                            {mode.toLowerCase().includes('instrumental') ||
                            language.toLowerCase().includes('instrumental') ||
                            vocal.toLowerCase().includes('tanpa vokal')
                              ? 'Struktur aransemen instrumental tanpa lirik bernyanyi, dengan section tags resmi Suno.'
                              : 'Lirik orisinal American English dengan section tags resmi Suno, intro singkat ~1 bar, tanpa [Bridge].'}
                          </span>
                        </div>
                        <div className="bg-[#07090f] border border-[#272d3f] rounded-lg p-3 text-[#f0f2f7] text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto select-all">
                          {musicResult.lyrics}
                        </div>
                      </div>
                    </div>

                    {/* PRODUCER NOTES */}
                    {musicResult.producerNotes && (
                      <div className="bg-[#141926] border border-[#2d354d] rounded-xl p-3.5 text-xs">
                        <div className="text-[11px] font-semibold text-[#a3a9b8] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-[#e7b83f]" />
                          <span>Catatan Produser & Saran Publikasi</span>
                        </div>
                        <p className="text-[#c7cbd6] m-0 leading-relaxed">
                          {musicResult.producerNotes}
                        </p>
                      </div>
                    )}

                    {/* COPY ALL BUTTON */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          const fullPackage = `SEKAWAN JAYA MULTIMEDIA™ | SUNO PACKAGE
JUDUL REKOMENDASI:
${musicResult.titleSuggestions?.join(', ')}

==============================
STYLE OF MUSIC (SUNO):
==============================
${musicResult.styleOfMusic}

REKOMENDASI SETELAN INTERNAL:
Style Influence: ${musicResult.recommendedSettings?.styleInfluence}
Weirdness: ${musicResult.recommendedSettings?.weirdness}
BPM: ${musicResult.recommendedSettings?.bpm}
Rasional: ${musicResult.recommendedSettings?.settingsExplanation}

==============================
LYRICS / ARANSEMEN:
==============================
${musicResult.lyrics}

==============================
CATATAN PRODUSER:
==============================
${musicResult.producerNotes}`;
                          triggerCopy(fullPackage, 'all-package');
                        }}
                        className="bg-[#212638] hover:bg-[#2d344d] border border-[#434d6b] text-[#ffd977] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'all-package' ? (
                          <>
                            <Check className="w-4 h-4 text-[#49d49d]" />
                            <span className="text-[#49d49d]">Semua Paket Tersalin ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin Lengkap (Style + Lirik + Catatan)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM BODY FOR VISUAL PROMPT */}
            {activeModal === 'visual' && (
              <div className="flex flex-col gap-3.5 text-xs text-[#d5d8e0]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#ffd977]">Tema visual musik *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Sunset di tepi pantai, mobil klasik neon, suasana kafe malam"
                      value={visualTheme}
                      onChange={(e) => setVisualTheme(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Genre musik</label>
                    <select
                      value={visualGenre}
                      onChange={(e) => setVisualGenre(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>Pop</option>
                      <option>Reggae</option>
                      <option>Lo-Fi / Chill</option>
                      <option>Electronic / Synthwave</option>
                      <option>Rock / Grunge</option>
                      <option>Jazz / Vintage</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Mood & Pencahayaan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Golden hour, sinematik, hangat, neon dramatis"
                      value={visualMood}
                      onChange={(e) => setVisualMood(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Format Utama</label>
                    <select
                      value={visualFormat}
                      onChange={(e) => setVisualFormat(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>YouTube Thumbnail (16:9)</option>
                      <option>Spotify & Apple Music Cover Art (1:1)</option>
                      <option>Vertical Shorts / TikTok (9:16)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-[#d5d8e0]">Catatan gaya estetika</label>
                  <input
                    type="text"
                    placeholder="Contoh: 35mm film photography, anime aesthetic, realistic hyper-detailed"
                    value={visualNotes}
                    onChange={(e) => setVisualNotes(e.target.value)}
                    className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleGenerateVisual}
                    disabled={isLoading}
                    className="border border-[#d2a52f] bg-gradient-to-br from-[#f1c653] to-[#c9931d] text-[#17130a] font-bold rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#17130a]" />
                        <span>Menyusun Prompt Visual...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current text-[#17130a]" />
                        <span>Generate AI Visual Prompts</span>
                      </>
                    )}
                  </button>
                </div>

                {/* VISUAL RESULTS */}
                {visualResult && (
                  <div className="mt-4 flex flex-col gap-3.5 border-t border-[#2d3345] pt-4 animate-in fade-in duration-300">
                    <h3 className="text-sm font-bold text-[#ffd977] m-0">
                      Konsep: {visualResult.conceptTitle}
                    </h3>

                    {/* Thumbnail Prompt */}
                    <div className="bg-[#0b0e16] border border-[#272d3f] rounded-xl p-3.5">
                      <div className="flex justify-between items-center mb-2">
                        <strong className="text-xs text-[#ffd977]">
                          YouTube Thumbnail (16:9 Prompt)
                        </strong>
                        <button
                          onClick={() =>
                            triggerCopy(visualResult.thumbnailPrompt, 'thumb-prompt')
                          }
                          className="text-[11px] bg-[#1d2333] hover:bg-[#283147] px-2.5 py-1 rounded text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'thumb-prompt' ? 'Tersalin ✓' : 'Salin Prompt'}
                        </button>
                      </div>
                      <div className="text-xs font-mono text-[#e8eaf0] bg-[#07090f] p-2.5 rounded border border-[#1e2333]">
                        {visualResult.thumbnailPrompt}
                      </div>
                    </div>

                    {/* Cover Art Prompt */}
                    <div className="bg-[#0b0e16] border border-[#272d3f] rounded-xl p-3.5">
                      <div className="flex justify-between items-center mb-2">
                        <strong className="text-xs text-[#ffd977]">
                          Music Cover Art (1:1 Prompt)
                        </strong>
                        <button
                          onClick={() => triggerCopy(visualResult.coverArtPrompt, 'cover-prompt')}
                          className="text-[11px] bg-[#1d2333] hover:bg-[#283147] px-2.5 py-1 rounded text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'cover-prompt' ? 'Tersalin ✓' : 'Salin Prompt'}
                        </button>
                      </div>
                      <div className="text-xs font-mono text-[#e8eaf0] bg-[#07090f] p-2.5 rounded border border-[#1e2333]">
                        {visualResult.coverArtPrompt}
                      </div>
                    </div>

                    {/* Negative Prompt */}
                    <div className="bg-[#141824] border border-[#252c3d] rounded-xl p-3">
                      <strong className="text-[11px] text-[#a3a9b8] block mb-1">
                        Negative Prompt Rekomendasi
                      </strong>
                      <div className="text-[11px] font-mono text-[#c5c8d4]">
                        {visualResult.negativePrompt}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM BODY FOR RESEARCH */}
            {activeModal === 'research' && (
              <div className="flex flex-col gap-3.5 text-xs text-[#d5d8e0]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Target Negara</label>
                    <select
                      value={researchAudience}
                      onChange={(e) => setResearchAudience(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>USA</option>
                      <option>United Kingdom</option>
                      <option>Germany</option>
                      <option>Global English-speaking</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-[#d5d8e0]">Genre Musik Riset</label>
                    <select
                      value={researchGenre}
                      onChange={(e) => setResearchGenre(e.target.value)}
                      className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                    >
                      <option>Reggae</option>
                      <option>Lo-Fi Hip-Hop</option>
                      <option>Country / Folk</option>
                      <option>Synthwave / Retro</option>
                      <option>Pop</option>
                      <option>R&B</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-[#d5d8e0]">
                    Topik / Pertanyaan spesifik (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Format video berkinerja tinggi, subgenre yang sedang naik daun"
                    value={researchTheme}
                    onChange={(e) => setResearchTheme(e.target.value)}
                    className="bg-[#0b0e16] border border-[#303649] rounded-lg px-3 py-2.5 text-[#f4f3ef] outline-none focus:border-[#e7b83f]"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleGenerateResearch}
                    disabled={isLoading}
                    className="border border-[#d2a52f] bg-gradient-to-br from-[#f1c653] to-[#c9931d] text-[#17130a] font-bold rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#17130a]" />
                        <span>Menganalisis Tren Pasar...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-[#17130a]" />
                        <span>Validasi Tren dengan AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RESEARCH RESULTS */}
                {trendResult && (
                  <div className="mt-4 flex flex-col gap-3.5 border-t border-[#2d3345] pt-4 animate-in fade-in duration-300">
                    <div className="bg-[#141926] border border-[#2d354d] rounded-xl p-3.5">
                      <h4 className="text-xs font-bold text-[#ffd977] uppercase mb-1">
                        Ringkasan Sinyal Pasar
                      </h4>
                      <p className="text-xs text-[#d5d8e0] leading-relaxed mb-2">
                        {trendResult.summary}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {trendResult.marketSignals?.map((sig, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-[#1e2538] border border-[#37415d] text-[#8ff0c4] px-2 py-0.5 rounded-full"
                          >
                            ✓ {sig}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0b0e16] border border-[#272d3f] rounded-xl p-3.5">
                      <h4 className="text-xs font-bold text-[#ffd977] uppercase mb-2">
                        3 Peluang Eksperimen Produksi Lagu Orisinal
                      </h4>
                      <div className="flex flex-col gap-2">
                        {trendResult.contentOpportunities?.map((opp, idx) => (
                          <div
                            key={idx}
                            className="bg-[#10141f] border border-[#202738] rounded-lg p-2.5 text-xs"
                          >
                            <strong className="text-[#ffd977] block">{opp.title}</strong>
                            <p className="text-[#a3a9b8] text-[11px] m-0 mt-0.5">{opp.rationale}</p>
                            <span className="inline-block mt-1 text-[10px] text-[#49d49d] bg-[#14261e] px-2 py-0.5 rounded">
                              Format: {opp.suggestedFormat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#1a1824] border border-[#3d3148] rounded-xl p-3 text-xs text-[#d5d8e0]">
                      <strong className="text-[#ffd977] block mb-1">Strategi Eksekusi</strong>
                      <p className="m-0 text-[11px] leading-relaxed text-[#c7cbd6]">
                        {trendResult.actionableStrategy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM BODY FOR SETTINGS & API KEY */}
            {activeModal === 'settings' && (
              <div className="flex flex-col gap-4 text-xs text-[#d5d8e0]">
                {/* AI PROVIDER & API KEY SECTION */}
                <div className="bg-[#0c0f17] border-2 border-[#e7b83f88] rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col gap-4">
                  {/* Section Title & Status Indicator */}
                  <div className="flex items-center justify-between border-b border-[#252c3d] pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#272115] border border-[#52411e] flex items-center justify-center">
                        <Key className="w-4 h-4 text-[#ffd977]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#ffd977] uppercase tracking-wider m-0">
                          AI PROVIDER & API KEY
                        </h3>
                        <p className="text-[11px] text-[#a3a9b8] m-0">
                          Konfigurasi kunci AI aktif untuk sesi browser Anda
                        </p>
                      </div>
                    </div>

                    {/* 5. Indikator Status Koneksi */}
                    <div className="flex items-center gap-2">
                      {connectionStatus === 'connected' && (
                        <span className="inline-flex items-center gap-1.5 bg-[#14261e] border border-[#2b5943] text-[#8ff0c4] px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#49d49d]" />
                          Connected
                        </span>
                      )}
                      {connectionStatus === 'testing' && (
                        <span className="inline-flex items-center gap-1.5 bg-[#252012] border border-[#534e1c] text-[#ffd977] px-3 py-1 rounded-full text-xs font-semibold">
                          <Loader2 className="w-3.5 h-3.5 text-[#e7b83f] animate-spin" />
                          Testing...
                        </span>
                      )}
                      {connectionStatus === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 bg-[#2b1417] border border-[#632a30] text-[#fca5a5] px-3 py-1 rounded-full text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                          Failed
                        </span>
                      )}
                      {connectionStatus === 'not_configured' && (
                        <span className="inline-flex items-center gap-1.5 bg-[#1b1e28] border border-[#343b4f] text-[#a3a9b8] px-3 py-1 rounded-full text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-[#f59e0b]" />
                          Not Configured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. Dropdown Provider AI */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#d5d8e0] flex items-center justify-between">
                      <span>Provider AI</span>
                      <span className="text-[10px] text-[#49d49d] bg-[#14261e] border border-[#234533] px-2 py-0.5 rounded">
                        Model: Gemini 3.8 Flash
                      </span>
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as 'gemini' | 'openai' | 'claude')}
                      className="bg-[#080b12] border border-[#2e374c] rounded-xl px-3.5 py-2.5 text-[#f4f3ef] text-xs outline-none focus:border-[#e7b83f]"
                    >
                      <option value="gemini">Google Gemini (Gemini 3.8 Flash - Aktif & Didukung)</option>
                      <option value="openai" disabled>OpenAI GPT-4o (Segera Hadir)</option>
                      <option value="claude" disabled>Anthropic Claude 3.5 Sonnet (Segera Hadir)</option>
                    </select>
                  </div>

                  {/* 2 & 3. Kolom Input API Key bertipe password + Show/Hide */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <label className="text-xs font-semibold text-[#ffd977] flex items-center gap-1.5">
                        <span>Google Gemini API Key</span>
                        <span className="text-[10px] text-[#e7b83f]">*Wajib untuk sesi</span>
                      </label>
                      {/* 8. Link Resmi */}
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#49d49d] hover:text-[#8ff0c4] hover:underline inline-flex items-center gap-1 font-medium transition-colors"
                      >
                        <span>Dapatkan Gemini API Key Gratis di Google AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={inputApiKey}
                        onChange={(e) => {
                          setInputApiKey(e.target.value);
                          if (statusFeedback) setStatusFeedback('');
                        }}
                        placeholder="Tempelkan Gemini API Key Anda di sini (AIzaSy...)"
                        className="w-full bg-[#080b12] border border-[#2e374c] focus:border-[#e7b83f] rounded-xl pl-3.5 pr-24 py-2.5 text-xs text-[#f4f3ef] font-mono outline-none transition-colors"
                      />
                      {/* 3. Tombol Show/Hide */}
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 px-2.5 py-1 text-[11px] bg-[#1a2133] hover:bg-[#252f47] border border-[#37425e] text-[#d5d8e0] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title={showApiKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
                      >
                        {showApiKey ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-[#ffd977]" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-[#ffd977]" />
                            <span>Show</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {statusFeedback && (
                    <div
                      className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
                        connectionStatus === 'connected'
                          ? 'bg-[#14261e] border border-[#2b5943] text-[#8ff0c4]'
                          : connectionStatus === 'failed'
                          ? 'bg-[#2b1417] border border-[#632a30] text-[#fca5a5]'
                          : 'bg-[#1b2030] border border-[#37425e] text-[#ffd977]'
                      }`}
                    >
                      {connectionStatus === 'connected' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#49d49d] shrink-0 mt-0.5" />
                      ) : connectionStatus === 'failed' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#ef4444] shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-[#e7b83f] shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed">{statusFeedback}</span>
                    </div>
                  )}

                  {/* Action Buttons: 4. Test Connection, 6. Save, 7. Remove API Key */}
                  <div className="flex items-center justify-between flex-wrap gap-2.5 pt-2 border-t border-[#1f2638]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 4. Tombol Test Connection */}
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={connectionStatus === 'testing' || !inputApiKey.trim()}
                        className="bg-[#1b2233] hover:bg-[#26314a] border border-[#394564] hover:border-[#ffd977] text-[#ffd977] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`}
                        />
                        <span>Test Connection</span>
                      </button>

                      {/* 6. Tombol Save */}
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        disabled={!inputApiKey.trim()}
                        className="bg-gradient-to-r from-[#e7b83f] to-[#c9931d] hover:brightness-110 text-[#17130a] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        <Save className="w-3.5 h-3.5 text-[#17130a]" />
                        <span>Save (Gunakan untuk Sesi)</span>
                      </button>
                    </div>

                    {/* 7. Tombol Remove API Key */}
                    {activeApiKey && (
                      <button
                        type="button"
                        onClick={handleRemoveApiKey}
                        className="bg-[#291719] hover:bg-[#381f22] border border-[#5a282d] text-[#fca5a5] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove API Key</span>
                      </button>
                    )}
                  </div>

                  {/* Notice & Disclaimer */}
                  <div className="text-[11px] text-[#a3a9b8] bg-[#090c14] border border-[#202738] rounded-xl p-3 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#e7b83f] shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Privasi Sesi Aktif:</strong> Kunci disimpan sementara di browser Anda (<code>sessionStorage</code>) khusus untuk sesi ini dan dikirim via HTTPS hanya untuk memproses permintaan AI Anda. Backend tidak menyimpan kunci secara permanen di database server dan tidak menggunakan kunci pembuat aplikasi sebagai fallback. Bila browser ditutup atau tombol <em>Remove</em> diklik, kunci akan terhapus.
                    </div>
                  </div>
                </div>

                {/* TOMBOL TUTUP */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={closeModal}
                    className="border border-[#485373] bg-[#22293b] hover:bg-[#2c354d] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Tutup Pengaturan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
