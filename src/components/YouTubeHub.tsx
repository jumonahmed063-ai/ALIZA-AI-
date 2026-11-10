import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Play,
  Pause,
  Search,
  ExternalLink,
  Music2,
  Volume2,
  X,
  Sparkles,
} from 'lucide-react';
import { YouTubeVideo } from '../types';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface YouTubeHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  autoplayVideoId?: string;
  onSpeak: (text: string) => void;
}

// Curated video catalog for high-quality, verified in-app streaming
const CURATED_VIDEOS: YouTubeVideo[] = [
  {
    id: '1',
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio – Relaxing Beats to Chill / Study To',
    channel: 'Lofi Girl',
    duration: '24/7 Live Stream',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    category: 'lofi',
  },
  {
    id: '2',
    videoId: '4xDzrJKXOOY',
    title: 'Synthwave Cyberpunk Mix – Retro Futuristic Music',
    channel: 'Astral Vibes',
    duration: '3:45:00',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    category: 'music',
  },
  {
    id: '3',
    videoId: 'kJQP7kiw5Fk',
    title: 'Top Global Pop Hits – Uplifting Energetic Anthems',
    channel: 'Vevo Music Hits',
    duration: '45:20',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    category: 'music',
  },
  {
    id: '4',
    videoId: '21X5lGlDOfg',
    title: 'Focus Coding & Study Session – Instrumental Deep Flow',
    channel: 'Aliza AI Sounds',
    duration: '1:12:00',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    category: 'tech',
  },
  {
    id: '5',
    videoId: 'DWcJFNfaw9c',
    title: 'Acoustic Guitar Melodies – Calm Evening Relaxation',
    channel: 'Peaceful Strings',
    duration: '52:10',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    category: 'lofi',
  },
];

export const YouTubeHub: React.FC<YouTubeHubProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  autoplayVideoId,
  onSpeak,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo>(CURATED_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'lofi' | 'music' | 'tech'>('all');
  const [lastExternalSearch, setLastExternalSearch] = useState<string | null>(null);

  // Helper to open real YouTube search page via Capacitor Browser or web tab
  const openRealYouTube = async (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    setLastExternalSearch(query);
    onSpeak(`Opening YouTube search for "${query}".`);

    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url });
        return;
      } catch (_) {}
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      // Check if matches curated list
      const lower = initialQuery.toLowerCase();
      const match = CURATED_VIDEOS.find(
        (v) =>
          v.title.toLowerCase().includes(lower) ||
          v.category.toLowerCase().includes(lower)
      );
      if (match) {
        setActiveVideo(match);
        setIsPlaying(true);
      } else {
        // Open real YouTube search for the query honestly!
        openRealYouTube(initialQuery);
      }
    }
  }, [initialQuery]);

  useEffect(() => {
    if (autoplayVideoId) {
      const match = CURATED_VIDEOS.find((v) => v.videoId === autoplayVideoId);
      if (match) {
        setActiveVideo(match);
      }
      setIsPlaying(true);
    }
  }, [autoplayVideoId]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    openRealYouTube(searchQuery.trim());
  };

  const filteredVideos =
    filterCategory === 'all'
      ? CURATED_VIDEOS
      : CURATED_VIDEOS.filter((v) => v.category === filterCategory);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-slate-900 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/40">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  YouTube Control Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
                  Voice Powered
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Curated in-app playback & direct search in real YouTube
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Search Bar (Opens real YouTube results honestly) */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real YouTube for songs, artists, videos..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium text-xs tracking-wider uppercase hover:opacity-95 transition shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Search YouTube</span>
            </button>
          </form>

          {/* Real YouTube Search Notice */}
          {lastExternalSearch && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs text-red-200">
              <span>Opened real YouTube search for: <strong>"{lastExternalSearch}"</strong></span>
              <button
                type="button"
                onClick={() => openRealYouTube(lastExternalSearch)}
                className="text-red-400 hover:text-white underline text-[11px] font-semibold"
              >
                Re-open ↗
              </button>
            </div>
          )}

          {/* Embedded Active Video Player */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
            <div className="relative aspect-video w-full bg-black">
              {isPlaying ? (
                <iframe
                  title="Aliza AI YouTube Player"
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(originUrl)}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={activeVideo.thumbnail}
                    alt={activeVideo.title}
                    className="w-full h-full object-cover opacity-60 filter blur-xs"
                  />
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute p-4 rounded-full bg-red-600 text-white shadow-2xl hover:scale-110 transition cursor-pointer"
                  >
                    <Play className="w-8 h-8 fill-current" />
                  </button>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80">
              <div className="min-w-0">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                  Now Playing in Aliza Player:
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeVideo.title}
                </h3>
                <p className="text-xs text-slate-400">{activeVideo.channel}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => openRealYouTube(activeVideo.title)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open on YouTube ↗</span>
                </button>
              </div>
            </div>
          </div>

          {/* Curated In-App Streaming Catalog */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Music2 className="w-4 h-4 text-red-500" />
                Curated In-App Music Streams:
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px]">
                {(['all', 'lofi', 'music', 'tech'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded capitalize font-medium transition cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-red-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredVideos.map((video) => {
                const isSelected = activeVideo.id === video.id;
                return (
                  <div
                    key={video.id}
                    onClick={() => {
                      setActiveVideo(video);
                      setIsPlaying(true);
                      onSpeak(`Playing ${video.title} on YouTube player.`);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && isPlaying && (
                        <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center">
                          <Volume2 className="w-5 h-5 text-red-400 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {video.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {video.channel}
                      </p>
                      <span className="text-[10px] text-red-400 font-medium">
                        {video.duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
