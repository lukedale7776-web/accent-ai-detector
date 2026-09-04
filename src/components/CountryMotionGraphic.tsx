'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Sparkles, Layers, RefreshCw, Compass, Volume2 } from 'lucide-react';
import { getCountryTheme, CountryTheme } from '@/lib/countryData';

interface CountryMotionGraphicProps {
  country: string;
  confidence?: number;
  className?: string;
}

export const CountryMotionGraphic: React.FC<CountryMotionGraphicProps> = ({
  country,
  confidence = 90,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(-8);
  const [rotateY, setRotateY] = useState(12);
  const [isHovered, setIsHovered] = useState(false);
  const [isExploded, setIsExploded] = useState(false);
  const [regenKey, setRegenKey] = useState(0);

  // Retrieve or procedurally generate theme for ANY country
  const theme: CountryTheme = useMemo(() => {
    return getCountryTheme(country);
  }, [country, regenKey]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rY = ((x - centerX) / centerX) * 22; // horizontal tilt (-22deg to +22deg)
    const rX = -((y - centerY) / centerY) * 22; // vertical tilt (-22deg to +22deg)

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(-6);
    setRotateY(10);
  };

  const toggleExplode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExploded((prev) => !prev);
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRegenKey((k) => k + 1);
  };

  // Depth multipliers for normal vs 3D Explode view
  const zBack = isExploded ? -140 : -60;
  const zGround = isExploded ? -70 : -25;
  const zMid = 0;
  const zFront = isExploded ? 80 : 35;
  const zTop = isExploded ? 150 : 65;

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 2.5D Perspective Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-[320px] sm:max-w-[360px] h-[240px] sm:h-[260px] rounded-3xl overflow-hidden cursor-pointer border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 backdrop-blur-xl"
        style={{
          background: `radial-gradient(circle at 50% 120%, ${theme.primaryColor}33, #090d16 80%)`,
          perspective: '1200px',
        }}
      >
        {/* Parallax 3D World Stage */}
        <div
          className="absolute inset-0 w-full h-full preserve-3d transition-transform ease-out"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.04 : 1}, ${isHovered ? 1.04 : 1}, 1)`,
            transformStyle: 'preserve-3d',
            transitionDuration: isHovered ? '100ms' : '600ms',
          }}
        >
          {/* ==============================================================
              LAYER 0: Atmospheric Backdrop & Deep Starfield
             ============================================================== */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500"
            style={{ transform: `translateZ(${zBack}px)` }}
          >
            {/* Ambient Radial Color Bloom */}
            <div
              className="absolute w-64 h-64 rounded-full blur-3xl opacity-40 animate-pulse"
              style={{ background: theme.primaryColor }}
            />

            {/* Rotating Dialect Coordinate Ring */}
            <div className="absolute w-56 h-56 rounded-full border border-dashed border-white/15 animate-[spin_60s_linear_infinite]" />
            <div className="absolute w-44 h-44 rounded-full border border-dotted border-white/20 animate-[spin_40s_linear_infinite_reverse]" />

            {/* Floating Star / Particle Grid */}
            {[...Array(14)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full animate-ping"
                style={{
                  top: `${(i * 19 + 11) % 85}%`,
                  left: `${(i * 27 + 7) % 88}%`,
                  backgroundColor: i % 2 === 0 ? theme.primaryColor : theme.secondaryColor,
                  animationDuration: `${2.5 + (i % 4)}s`,
                  animationDelay: `${(i * 0.3) % 2}s`,
                  opacity: 0.5,
                }}
              />
            ))}
          </div>

          {/* ==============================================================
              LAYER 1: Isometric Platform Pedestal & Acoustic Ring
             ============================================================== */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500"
            style={{ transform: `translateZ(${zGround}px)` }}
          >
            {/* Tilted Isometric Ground Hexagon */}
            <div
              className="relative w-52 h-28 rounded-[40px] border-2 border-white/20 shadow-2xl flex items-center justify-center"
              style={{
                transform: 'rotateX(62deg) rotateZ(-30deg)',
                background: `linear-gradient(135deg, ${theme.primaryColor}40 0%, #0f172a 100%)`,
                boxShadow: `0 15px 35px ${theme.primaryColor}55`,
              }}
            >
              {/* Ground Grid lines */}
              <div className="absolute inset-2 rounded-[34px] border border-white/10" />
              <div className="absolute inset-6 rounded-[26px] border border-dashed border-white/15" />

              {/* Pulsing Acoustic Beacon Wave */}
              <div
                className="absolute inset-0 rounded-[40px] border border-white/40 animate-ping"
                style={{ animationDuration: '3s' }}
              />
            </div>
          </div>

          {/* ==============================================================
              LAYER 2: Procedural 2.5D Isometric Architectural Landmark
             ============================================================== */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500"
            style={{ transform: `translateZ(${zMid}px)` }}
          >
            <ProceduralLandmark theme={theme} />
          </div>

          {/* ==============================================================
              LAYER 3: 2.5D Audio Frequency Equalizer Bars & Flag Banner
             ============================================================== */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between p-4 pointer-events-none transition-transform duration-500"
            style={{ transform: `translateZ(${zFront}px)` }}
          >
            {/* Top Bar: Flag & Dialect Greeting Pill */}
            <div className="w-full flex items-center justify-between pointer-events-auto">
              {/* 2.5D Country Flag Badge with Specular Sheen */}
              <div className="relative group px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl flex items-center space-x-2">
                <span className="text-xl filter drop-shadow">{theme.flag}</span>
                <span className="text-xs font-bold text-white tracking-wide">{theme.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Dialect Greeting Pill */}
              <div
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/90 border border-white/15 shadow-md flex items-center space-x-1"
                style={{ background: `linear-gradient(90deg, ${theme.primaryColor}80, ${theme.secondaryColor}80)` }}
              >
                <span>&ldquo;{theme.greeting}&rdquo;</span>
              </div>
            </div>

            {/* Bottom: 2.5D Isometric Soundwave Equalizer Columns */}
            <div className="w-full flex items-end justify-center space-x-1.5 mb-2">
              {[28, 48, 75, 52, 90, 64, 82, 45, 68, 38, 55, 30].map((baseH, idx) => (
                <div
                  key={idx}
                  className="w-2 rounded-t-full shadow-lg transition-all"
                  style={{
                    height: `${Math.round(baseH * (0.6 + ((idx + regenKey) % 5) * 0.1))}px`,
                    background: `linear-gradient(to top, ${theme.primaryColor}, ${theme.secondaryColor}, #ffffff)`,
                    opacity: 0.85,
                    animation: `pulse ${1.2 + (idx % 4) * 0.2}s ease-in-out infinite alternate`,
                    animationDelay: `${idx * 0.08}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ==============================================================
              LAYER 4: Floating 3D Cultural Emblems & Interactive HUD
             ============================================================== */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-500"
            style={{ transform: `translateZ(${zTop}px)` }}
          >
            {/* Floating Cultural Emblems */}
            {theme.symbols.slice(0, 3).map((sym, i) => (
              <div
                key={i}
                className="absolute text-2xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
                style={{
                  top: i === 0 ? '30%' : i === 1 ? '62%' : '42%',
                  left: i === 0 ? '12%' : i === 1 ? '82%' : '78%',
                  animation: `bounce ${3 + i * 0.8}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                {sym}
              </div>
            ))}
          </div>
        </div>

        {/* HUD Controls (Overlay Outside 3D tilt for clean clicking) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center space-x-1.5">
          {/* Explode 3D Layers Button */}
          <button
            onClick={toggleExplode}
            title={isExploded ? 'Collapse 3D Layers' : 'Explode 3D Layers in Z-Space'}
            className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 backdrop-blur-md border ${
              isExploded
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/40 shadow-lg'
                : 'bg-black/50 text-slate-300 border-white/10 hover:bg-black/80 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{isExploded ? '3D Active' : '3D Layers'}</span>
          </button>

          {/* Regenerate Animation Seed Button */}
          <button
            onClick={handleRegenerate}
            title="Regenerate live motion graphic seed"
            className="p-1.5 rounded-xl text-[10px] font-bold bg-black/50 text-slate-300 border border-white/10 hover:bg-black/80 hover:text-white transition-all"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Live Motion Status Tag */}
        <div className="absolute bottom-2.5 left-3 z-20 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-slate-300">
          <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
          <span className="font-semibold text-white">{theme.landmark}</span>
        </div>
      </div>

      <span className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
        <Compass className="w-3 h-3 text-indigo-400" />
        <span>Move cursor to tilt in 2.5D space &bull; Click &ldquo;3D Layers&rdquo; to expand depth</span>
      </span>
    </div>
  );
};

/**
 * Procedural 2.5D Isometric Landmark Generator for ANY Country
 */
const ProceduralLandmark: React.FC<{ theme: CountryTheme }> = ({ theme }) => {
  const { landmarkType, primaryColor, secondaryColor, accentColor } = theme;

  // 1. MODERN SKYLINE (USA, Singapore, etc.)
  if (landmarkType === 'modern_skyline') {
    return (
      <div className="relative w-48 h-36 flex items-end justify-center space-x-2">
        {/* Left Skyscraper */}
        <div
          className="w-9 h-24 rounded-t-sm shadow-2xl relative flex flex-col justify-between p-1 border-t border-l border-white/30"
          style={{ background: `linear-gradient(to top, #0f172a, ${primaryColor}99)` }}
        >
          <div className="grid grid-cols-2 gap-1 opacity-70">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-2.5 h-1.5 bg-amber-200/80 rounded-xs" />
            ))}
          </div>
        </div>

        {/* Center Main Art Deco Tower / Empire Spire */}
        <div
          className="w-14 h-36 rounded-t-sm shadow-[0_0_30px_rgba(59,130,246,0.5)] relative flex flex-col items-center justify-between p-1.5 border-t-2 border-white/60"
          style={{ background: `linear-gradient(to top, #0f172a 10%, ${primaryColor} 70%, ${secondaryColor} 100%)` }}
        >
          {/* Spire Needle & Aviation Beacon */}
          <div className="absolute -top-7 w-1 h-8 bg-slate-100 flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>

          <div className="grid grid-cols-3 gap-1 pt-3 opacity-80">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-2.5 h-1.5 bg-cyan-200 rounded-xs" />
            ))}
          </div>
        </div>

        {/* Right Skyscraper */}
        <div
          className="w-10 h-28 rounded-t-sm shadow-xl relative flex flex-col justify-between p-1 border-t border-r border-white/30"
          style={{ background: `linear-gradient(to top, #0f172a, ${secondaryColor}88)` }}
        >
          <div className="grid grid-cols-2 gap-1 opacity-70">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-3 h-1.5 bg-yellow-200/80 rounded-xs" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. GOTHIC TOWER / CLOCK TOWER (UK, France, Spain)
  if (landmarkType === 'gothic_tower') {
    return (
      <div className="relative w-36 h-36 flex flex-col items-center justify-end">
        {/* Spire Peak */}
        <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[36px] border-b-amber-400/90 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        {/* Clock Section */}
        <div
          className="w-16 h-16 rounded-lg border-2 border-amber-300/80 shadow-2xl flex items-center justify-center relative p-1"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, #0f172a)` }}
        >
          {/* Animated Clock Dial */}
          <div className="w-12 h-12 rounded-full border-2 border-amber-200 bg-amber-50/90 flex items-center justify-center relative shadow-inner">
            <div className="w-0.5 h-4 bg-slate-900 absolute origin-bottom rotate-45 animate-[spin_12s_linear_infinite]" />
            <div className="w-0.5 h-3 bg-red-600 absolute origin-bottom -rotate-45 animate-[spin_60s_linear_infinite]" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          </div>
        </div>
        {/* Tower Body */}
        <div
          className="w-20 h-16 border-t-2 border-amber-400/40 flex items-center justify-around px-2"
          style={{ background: `linear-gradient(to bottom, #1e293b, #0f172a)` }}
        >
          <div className="w-3 h-12 bg-amber-200/20 rounded-t-full border border-amber-400/40" />
          <div className="w-4 h-12 bg-amber-200/30 rounded-t-full border border-amber-400/40" />
          <div className="w-3 h-12 bg-amber-200/20 rounded-t-full border border-amber-400/40" />
        </div>
      </div>
    );
  }

  // 3. DOME & MINARET (India, Pakistan, Middle East)
  if (landmarkType === 'dome_minaret') {
    return (
      <div className="relative w-48 h-36 flex items-end justify-center space-x-1.5">
        {/* Left Minaret */}
        <div className="w-3 h-28 bg-gradient-to-t from-slate-300 via-amber-100 to-white rounded-t-sm shadow-lg flex flex-col items-center">
          <div className="w-4 h-2.5 bg-amber-300 rounded-t-full -mt-1 shadow-sm" />
          <div className="w-1 h-3 bg-amber-400 -mt-1" />
        </div>

        {/* Central Taj Dome */}
        <div
          className="relative w-32 h-26 rounded-t-[54px] shadow-[0_10px_35px_rgba(249,115,22,0.4)] flex flex-col items-center justify-end pb-1 border-t-2 border-white"
          style={{ background: `linear-gradient(to top, #1e293b 0%, #f8fafc 80%, #ffffff 100%)` }}
        >
          {/* Top Golden Spire */}
          <div className="absolute -top-6 w-1.5 h-7 bg-amber-400 rounded-t-full shadow-md animate-pulse">
            <div className="w-3 h-3 rounded-full bg-amber-300 -ml-0.5 mt-1 shadow-sm" />
          </div>

          {/* Central Arch */}
          <div className="w-12 h-14 bg-gradient-to-b from-amber-950/60 to-slate-950 rounded-t-[24px] border border-amber-300/40 flex items-center justify-center">
            <div className="w-4 h-8 bg-amber-200/30 rounded-t-full" />
          </div>
        </div>

        {/* Right Minaret */}
        <div className="w-3 h-28 bg-gradient-to-t from-slate-300 via-amber-100 to-white rounded-t-sm shadow-lg flex flex-col items-center">
          <div className="w-4 h-2.5 bg-amber-300 rounded-t-full -mt-1 shadow-sm" />
          <div className="w-1 h-3 bg-amber-400 -mt-1" />
        </div>
      </div>
    );
  }

  // 4. COASTAL HARBOR / OPERA HOUSE (Australia)
  if (landmarkType === 'coastal_harbor') {
    return (
      <div className="relative w-48 h-36 flex flex-col items-center justify-end">
        {/* Opera Shell Sails */}
        <div className="relative w-44 h-24 flex items-end justify-center">
          {/* Sail 1 */}
          <div
            className="w-16 h-20 rounded-tl-[45px] rounded-tr-md shadow-2xl border-t border-l border-white/80"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor} 100%)`,
              transform: 'skewX(-14deg)',
            }}
          />
          {/* Sail 2 (Taller Main Shell) */}
          <div
            className="w-20 h-26 rounded-tl-[60px] rounded-tr-md -ml-6 shadow-2xl border-t border-l border-white"
            style={{
              background: `linear-gradient(135deg, #ffffff 20%, #fef3c7 70%, ${secondaryColor} 100%)`,
              transform: 'skewX(-16deg)',
            }}
          />
          {/* Sail 3 */}
          <div
            className="w-14 h-16 rounded-tl-[40px] rounded-tr-md -ml-4 shadow-xl border-t border-l border-white/80"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor} 100%)`,
              transform: 'skewX(-12deg)',
            }}
          />
        </div>

        {/* Ocean Wave Reflection Base */}
        <div
          className="w-48 h-5 rounded-full blur-xs opacity-70 animate-pulse"
          style={{ background: `linear-gradient(90deg, #0284c7, #38bdf8, #0284c7)` }}
        />
      </div>
    );
  }

  // 5. NATURAL PEAKS (Canada, New Zealand, Ireland, etc.)
  if (landmarkType === 'natural_peaks') {
    return (
      <div className="relative w-48 h-36 flex items-end justify-center">
        {/* Left Ridge */}
        <div
          className="w-0 h-0 border-l-[35px] border-l-transparent border-r-[35px] border-r-transparent border-b-[60px] border-b-slate-700 relative"
          style={{ borderBottomColor: `${primaryColor}cc` }}
        >
          {/* Snow cap */}
          <div className="absolute top-[28px] -left-[16px] w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[24px] border-b-white" />
        </div>

        {/* Main High Mountain Peak */}
        <div
          className="w-0 h-0 border-l-[48px] border-l-transparent border-r-[48px] border-r-transparent border-b-[88px] -ml-6 z-10 relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          style={{ borderBottomColor: `${secondaryColor}dd` }}
        >
          {/* Snow cap */}
          <div className="absolute top-[42px] -left-[24px] w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[38px] border-b-white" />
        </div>

        {/* Right Ridge */}
        <div
          className="w-0 h-0 border-l-[38px] border-l-transparent border-r-[38px] border-r-transparent border-b-[68px] -ml-6 relative"
          style={{ borderBottomColor: `${primaryColor}99` }}
        >
          <div className="absolute top-[32px] -left-[18px] w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[28px] border-b-white" />
        </div>
      </div>
    );
  }

  // 6. ORIENTAL PAGODA (Japan, China, East Asia)
  if (landmarkType === 'oriental_pagoda') {
    return (
      <div className="relative w-40 h-36 flex flex-col items-center justify-end">
        {/* Spire */}
        <div className="w-1.5 h-8 bg-amber-400 rounded-t-full shadow-md" />
        {/* Tier 3 (Top Roof) */}
        <div
          className="w-16 h-3 rounded-full border-t border-amber-200"
          style={{ background: primaryColor }}
        />
        <div className="w-8 h-4 bg-slate-900 border-x border-amber-400/40" />
        {/* Tier 2 */}
        <div
          className="w-24 h-4 rounded-full border-t border-amber-200 shadow-md"
          style={{ background: primaryColor }}
        />
        <div className="w-14 h-5 bg-slate-900 border-x border-amber-400/40" />
        {/* Tier 1 (Base Roof) */}
        <div
          className="w-32 h-5 rounded-full border-t-2 border-amber-200 shadow-xl"
          style={{ background: primaryColor }}
        />
        <div className="w-20 h-7 bg-slate-950 border-x border-amber-400/60 flex items-center justify-around px-2">
          <div className="w-2 h-5 bg-amber-300/40 rounded-xs" />
          <div className="w-2 h-5 bg-amber-300/40 rounded-xs" />
        </div>
      </div>
    );
  }

  // 7. CLASSICAL COLONNADE (Germany, Italy, Greece)
  if (landmarkType === 'classical_columns') {
    return (
      <div className="relative w-44 h-36 flex flex-col items-center justify-end">
        {/* Triangular Pediment */}
        <div
          className="w-0 h-0 border-l-[45px] border-l-transparent border-r-[45px] border-r-transparent border-b-[22px] border-b-amber-300/80 filter drop-shadow-md"
        />
        <div className="w-36 h-2.5 bg-amber-200 border-b border-amber-400 shadow-sm" />
        {/* Columns Row */}
        <div className="w-32 h-18 flex justify-between px-1 bg-slate-950/40 py-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-full rounded-xs shadow-md border-x border-white/40"
              style={{ background: `linear-gradient(to bottom, #f8fafc, #94a3b8)` }}
            />
          ))}
        </div>
        {/* Colonnade Base Plinth */}
        <div className="w-38 h-3.5 bg-slate-700 border-t border-slate-500 rounded-sm shadow-xl" />
      </div>
    );
  }

  // DEFAULT / PROCEDURAL CITADEL
  return (
    <div className="relative w-40 h-36 flex items-end justify-center space-x-2">
      <div
        className="w-10 h-22 rounded-t-lg shadow-xl border-t border-white/40"
        style={{ background: `linear-gradient(to top, #0f172a, ${primaryColor})` }}
      />
      <div
        className="w-16 h-30 rounded-t-xl shadow-2xl border-t-2 border-white flex flex-col items-center justify-between p-1"
        style={{ background: `linear-gradient(to top, #0f172a, ${secondaryColor})` }}
      >
        <div className="w-1.5 h-6 bg-white rounded-full -mt-4 shadow-lg animate-pulse" />
        <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-sm">
          {theme.symbols[0] || '🌐'}
        </div>
      </div>
      <div
        className="w-10 h-22 rounded-t-lg shadow-xl border-t border-white/40"
        style={{ background: `linear-gradient(to top, #0f172a, ${accentColor})` }}
      />
    </div>
  );
};
