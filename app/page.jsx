"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Search, Play, Clock, ArrowUpDown, ExternalLink, X, ChevronRight } from 'lucide-react';


const playProjectorClick = (enabled = true) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
};

const formatDuration = (sec) => {
  if (!sec) return 'Reel';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function BritishPatheTimeline() {
  const [indexData, setIndexData] = useState({ totalReels: 0, years: [] });
  const [selectedDecade, setSelectedDecade] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearVideos, setYearVideos] = useState([]);
  const [loadingYear, setLoadingYear] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alpha');
  const [visibleCount, setVisibleCount] = useState(48);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetch('/data/index.json')
      .then((res) => res.json())
      .then((data) => {
        setIndexData(data);
        if (data.years.length > 0) {
          const defaultYr = data.years.find((y) => y.year === 1939)?.year || data.years[0].year;
          setSelectedYear(defaultYr);
          setSelectedDecade(Math.floor(defaultYr / 10) * 10);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setLoadingYear(true);
    setVisibleCount(48);
    fetch(`/data/years/${selectedYear}.json`)
      .then((res) => res.json())
      .then((vids) => {
        setYearVideos(vids);
        setLoadingYear(false);
      })
      .catch(() => setLoadingYear(false));
  }, [selectedYear]);

  const decades = useMemo(() => {
    const set = new Set(indexData.years.map((y) => Math.floor(y.year / 10) * 10));
    return Array.from(set).sort((a, b) => a - b);
  }, [indexData]);

  const yearsInDecade = useMemo(() => {
    if (!selectedDecade) return indexData.years;
    return indexData.years.filter((y) => Math.floor(y.year / 10) * 10 === selectedDecade);
  }, [indexData, selectedDecade]);

  const filteredVideos = useMemo(() => {
    let list = [...yearVideos];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((v) => (v.cleanTitle || v.title).toLowerCase().includes(q));
    }
    if (sortBy === 'alpha') {
      list.sort((a, b) => (a.cleanTitle || a.title).localeCompare(b.cleanTitle || b.title));
    } else if (sortBy === 'shortest') {
      list.sort((a, b) => (a.duration || 9999) - (b.duration || 9999));
    } else if (sortBy === 'longest') {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }
    return list;
  }, [yearVideos, searchQuery, sortBy]);

  return (
    <div className="min-h-screen film-grain flex flex-col">
      <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 block">
                Chronological Film Vault
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-stone-100">
                British Pathé Newsreel Timeline
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-stone-400">
            <span className="px-3 py-1.5 rounded bg-stone-900 border border-stone-800">
              Total Indexed: <strong className="text-amber-400">{indexData.totalReels.toLocaleString()}</strong> reels
            </span>
            <span className="px-3 py-1.5 rounded bg-stone-900 border border-stone-800">
              Years: <strong className="text-stone-200">{indexData.years.length}</strong>
            </span>
          </div>
        </div>

        <div className="border-t border-stone-900 bg-stone-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono uppercase text-stone-500 mr-2 shrink-0">Decade:</span>
            {decades.map((dec) => (
              <button
                key={dec}
                onClick={() => {
                  setSelectedDecade(dec);
                  const firstYr = indexData.years.find((y) => Math.floor(y.year / 10) * 10 === dec);
                  if (firstYr) setSelectedYear(firstYr.year);
                }}
                className={`px-3 py-1 rounded text-xs font-mono transition shrink-0 ${
                  selectedDecade === dec
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                {dec}s
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-stone-800/80 bg-stone-900/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
            {yearsInDecade.map(({ year, count }) => {
              const active = year === selectedYear;
              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`group relative px-3.5 py-1.5 rounded border text-left font-mono transition shrink-0 ${
                    active
                      ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                      : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <div className="text-sm">{year}</div>
                  <div className="text-[10px] opacity-70">{count} reels</div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-stone-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-500">
              Archive Dispatch • {selectedDecade}s
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-stone-100 mt-1">
              The Year {selectedYear}
            </h2>
            <p className="text-sm text-stone-400 mt-1">
              Showing {filteredVideos.length} preserved short newsreels from {selectedYear}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedYear} reels...`}
                className="pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-stone-300 focus:outline-none"
              >
                <option value="alpha" className="bg-stone-900">Sort: A–Z Dispatch</option>
                <option value="shortest" className="bg-stone-900">Sort: Shortest First</option>
                <option value="longest" className="bg-stone-900">Sort: Longest First</option>
              </select>
            </div>
          </div>
        </div>

        {loadingYear ? (
          <div className="py-24 text-center font-mono text-sm text-amber-500 animate-pulse">
            Loading {selectedYear} film canister from archive...
          </div>
        ) : (
          <div className="relative mt-10 pl-6 sm:pl-10 border-l-2 border-stone-800 space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredVideos.slice(0, visibleCount).map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
                  className="relative group bg-stone-900/50 border border-stone-800/90 hover:border-amber-500/60 rounded-lg p-4 sm:p-5 transition"
                >
                  <div className="absolute -left-[31px] sm:-left-[47px] top-7 w-3.5 h-3.5 rounded-full bg-stone-950 border-2 border-amber-500 group-hover:scale-125 group-hover:bg-amber-400 transition" />

                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <button
                      onClick={() => setActiveVideo(video)}
                      className="relative w-full sm:w-56 aspect-video rounded overflow-hidden bg-black shrink-0 border border-stone-800"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.cleanTitle || video.title}
                        loading="lazy"
                        className="w-full h-full object-cover sepia-[.25] group-hover:sepia-0 group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                        <span className="w-11 h-11 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </span>
                      </div>
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-stone-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {formatDuration(video.duration)}
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-mono text-amber-500 mb-1">
                        <span>REEL #{String(idx + 1).padStart(3, '0')}</span>
                        <span>•</span>
                        <span>YEAR {video.year}</span>
                        <span>•</span>
                        <span className="text-stone-500">ID: {video.id}</span>
                      </div>

                      <h3
                        onClick={() => setActiveVideo(video)}
                        className="text-lg sm:text-xl font-serif font-semibold text-stone-100 group-hover:text-amber-400 cursor-pointer transition"
                      >
                        {video.cleanTitle || video.title}
                      </h3>

                      <div className="mt-3 flex items-center gap-4 text-xs font-mono">
                        <button
                          onClick={() => setActiveVideo(video)}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          Screen in Theater <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-500 hover:text-stone-300 flex items-center gap-1"
                        >
                          YouTube Source <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {visibleCount < filteredVideos.length && (
              <div className="pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 60)}
                  className="px-5 py-2.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-mono uppercase tracking-wider text-amber-400 transition"
                >
                  Load More {selectedYear} Reels ({filteredVideos.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-900">
                <div>
                  <span className="text-[11px] font-mono text-amber-500 uppercase">
                    British Pathé Screening Room • {activeVideo.year}
                  </span>
                  <h4 className="text-base font-serif font-bold text-stone-100">
                    {activeVideo.cleanTitle || activeVideo.title}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-1.5 rounded bg-stone-800 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
