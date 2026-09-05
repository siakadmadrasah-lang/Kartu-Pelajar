import React, { useState, useEffect } from 'react';
import { KemenagLogo, MadrasahLogo } from './Logos';
import { Sparkles, ShieldCheck, FileSpreadsheet, Layers, CheckCircle2, School } from 'lucide-react';
import { PageLoaderConfig } from '../types';
import { INITIAL_LOADER_CONFIG } from '../constants/initialData';
import { makeLogoTransparent } from '../utils/imageUtils';

export const LOADER_THEMES = {
  'dark-emerald': {
    name: 'Hijau Emerald Kemenag',
    bg: 'bg-slate-950',
    radialGlow: 'bg-emerald-600/30',
    ringGradient: 'from-emerald-500 via-amber-400 to-teal-500',
    logoContainer: 'from-slate-900 via-emerald-950 to-slate-900 border-emerald-500/60',
    badge: 'bg-amber-400 text-emerald-950',
    progressBar: 'from-emerald-500 via-teal-400 to-amber-400',
    accentText: 'text-emerald-400',
    subText: 'text-emerald-300/80',
    cardBg: 'bg-slate-900/90 border-slate-800/80',
  },
  'royal-navy': {
    name: 'Biru Navy Prestasi',
    bg: 'bg-slate-950',
    radialGlow: 'bg-blue-600/30',
    ringGradient: 'from-blue-500 via-cyan-400 to-indigo-500',
    logoContainer: 'from-slate-900 via-blue-950 to-slate-900 border-cyan-500/60',
    badge: 'bg-cyan-400 text-slate-950',
    progressBar: 'from-blue-500 via-cyan-400 to-sky-300',
    accentText: 'text-cyan-400',
    subText: 'text-cyan-300/80',
    cardBg: 'bg-slate-900/90 border-slate-800/80',
  },
  'islamic-green': {
    name: 'Hijau Tradisi Islami',
    bg: 'bg-emerald-950',
    radialGlow: 'bg-emerald-500/40',
    ringGradient: 'from-emerald-400 via-green-300 to-emerald-600',
    logoContainer: 'from-emerald-900 via-emerald-950 to-slate-950 border-emerald-400/70',
    badge: 'bg-emerald-300 text-emerald-950',
    progressBar: 'from-emerald-400 via-teal-300 to-emerald-200',
    accentText: 'text-emerald-300',
    subText: 'text-emerald-200/80',
    cardBg: 'bg-emerald-900/80 border-emerald-800/80',
  },
  'gold-amber': {
    name: 'Emas Elegan Madrasah',
    bg: 'bg-stone-950',
    radialGlow: 'bg-amber-600/30',
    ringGradient: 'from-amber-500 via-yellow-300 to-orange-500',
    logoContainer: 'from-stone-900 via-amber-950 to-stone-900 border-amber-500/70',
    badge: 'bg-amber-400 text-stone-950',
    progressBar: 'from-amber-500 via-yellow-400 to-amber-300',
    accentText: 'text-amber-400',
    subText: 'text-amber-200/80',
    cardBg: 'bg-stone-900/90 border-stone-800/80',
  },
  'minimalist-dark': {
    name: 'Modern Charcoal Dark',
    bg: 'bg-zinc-950',
    radialGlow: 'bg-zinc-500/20',
    ringGradient: 'from-zinc-400 via-slate-300 to-zinc-600',
    logoContainer: 'from-zinc-900 to-zinc-950 border-zinc-700',
    badge: 'bg-zinc-200 text-zinc-950',
    progressBar: 'from-zinc-400 via-slate-200 to-white',
    accentText: 'text-zinc-300',
    subText: 'text-zinc-400',
    cardBg: 'bg-zinc-900/90 border-zinc-800/80',
  },
};

interface InitialPageLoaderProps {
  config?: PageLoaderConfig;
  progress?: number;
  statusText?: string;
  madrasahLogoUrl?: string;
  isInlinePreview?: boolean;
  onSkip?: () => void;
}

export const InitialPageLoader: React.FC<InitialPageLoaderProps> = ({
  config = INITIAL_LOADER_CONFIG,
  progress = 100,
  statusText,
  madrasahLogoUrl,
  isInlinePreview = false,
  onSkip,
}) => {
  const theme = LOADER_THEMES[config.theme] || LOADER_THEMES['dark-emerald'];
  const displayStatus = statusText || (
    progress <= 35 
      ? config.step1Text 
      : progress <= 75 
        ? config.step2Text 
        : config.step3Text
  );

  const containerClasses = isInlinePreview
    ? `relative w-full h-full min-h-[440px] ${theme.bg} rounded-2xl flex flex-col items-center justify-center p-6 select-none overflow-hidden border border-slate-700/80`
    : `fixed inset-0 z-50 ${theme.bg} flex flex-col items-center justify-center p-6 select-none overflow-hidden`;

  // Raw logo source candidate
  const rawLogoSrc = config.logoType === 'custom'
    ? config.customLogoUrl
    : config.logoType === 'madrasah'
      ? (madrasahLogoUrl || config.customLogoUrl)
      : '';

  // Real-time automatic background transparency state
  const [autoTransparentLogoSrc, setAutoTransparentLogoSrc] = useState<string>(rawLogoSrc || '');

  useEffect(() => {
    let isMounted = true;
    if (!rawLogoSrc) {
      setAutoTransparentLogoSrc('');
      return;
    }

    // If auto transparent background is enabled (default: true)
    if (config.autoTransparentBg !== false) {
      makeLogoTransparent(rawLogoSrc, { tolerance: 42, feather: 16, autoCrop: true })
        .then((res) => {
          if (isMounted && res) {
            setAutoTransparentLogoSrc(res);
          }
        })
        .catch(() => {
          if (isMounted) setAutoTransparentLogoSrc(rawLogoSrc);
        });
    } else {
      setAutoTransparentLogoSrc(rawLogoSrc);
    }

    return () => {
      isMounted = false;
    };
  }, [rawLogoSrc, config.autoTransparentBg]);

  // Render Logo based on configuration
  const renderLogo = () => {
    if (config.logoType === 'none') {
      return (
        <div className="w-16 h-16 flex items-center justify-center text-amber-400">
          <School className="w-12 h-12 opacity-80" />
        </div>
      );
    }

    if (config.logoType === 'madrasah') {
      const src = autoTransparentLogoSrc || madrasahLogoUrl || config.customLogoUrl;
      if (src) {
        return (
          <img
            src={src}
            alt="Logo Madrasah"
            className="w-16 h-16 object-contain drop-shadow-md transition-all duration-300"
            crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'}
          />
        );
      }
      return (
        <div className="w-16 h-16 flex items-center justify-center text-amber-400">
          <School className="w-12 h-12 opacity-80" />
        </div>
      );
    }

    if (config.logoType === 'custom') {
      const src = autoTransparentLogoSrc || config.customLogoUrl;
      if (src) {
        return (
          <img
            src={src}
            alt="Logo Kustom"
            className="w-16 h-16 object-contain drop-shadow-md transition-all duration-300"
            crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'}
          />
        );
      }
      return (
        <div className="w-16 h-16 flex items-center justify-center text-amber-400">
          <School className="w-12 h-12 opacity-80" />
        </div>
      );
    }

    // Default when no custom logo is uploaded
    const customSrc = autoTransparentLogoSrc || madrasahLogoUrl || config.customLogoUrl;
    if (customSrc) {
      return (
        <img
          src={customSrc}
          alt="Logo"
          className="w-16 h-16 object-contain drop-shadow-md transition-all duration-300"
          crossOrigin={customSrc.startsWith('data:') ? undefined : 'anonymous'}
        />
      );
    }

    return (
      <div className="w-16 h-16 flex items-center justify-center text-amber-400">
        <School className="w-12 h-12 opacity-80" />
      </div>
    );
  };

  return (
    <div className={containerClasses}>
      {/* Background Radial Glow */}
      {config.showRadialGlow && (
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <div className={`w-[600px] h-[600px] rounded-full ${theme.radialGlow} blur-[120px] animate-pulse`} />
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        {/* Animated Badge Container */}
        {config.logoType !== 'none' && (
          <div className="relative mb-6">
            {/* Glowing ring animation */}
            {config.logoAnimation === 'spin-glow' && (
              <div className={`absolute -inset-3 bg-gradient-to-r ${theme.ringGradient} rounded-2xl blur-lg opacity-40 animate-spin-slow`} />
            )}
            {config.logoAnimation === 'glow-pulse' && (
              <div className={`absolute -inset-3 bg-gradient-to-r ${theme.ringGradient} rounded-2xl blur-lg opacity-50 animate-pulse`} />
            )}
            
            <div
              className={`relative w-24 h-24 rounded-2xl bg-gradient-to-b ${theme.logoContainer} p-4 border-2 shadow-2xl flex items-center justify-center ${
                config.logoAnimation === 'float' ? 'animate-bounce' : ''
              }`}
              style={{ animationDuration: config.logoAnimation === 'float' ? '3s' : undefined }}
            >
              {renderLogo()}
            </div>
          </div>
        )}

        {/* Title and Branding */}
        <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2 flex-wrap">
          <span>{config.title || 'KARTU PELAJAR MI'}</span>
          {config.badgeText && (
            <span className={`text-[10px] font-extrabold uppercase ${theme.badge} px-2 py-0.5 rounded shadow-sm`}>
              {config.badgeText}
            </span>
          )}
        </h1>
        {config.subtitle && (
          <p className={`text-xs ${theme.subText} font-medium mt-1`}>
            {config.subtitle}
          </p>
        )}

        {/* Status & Progress Box */}
        {(config.showProgressBar || config.showChecklist) && (
          <div className={`w-full mt-6 ${theme.cardBg} rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-3`}>
            {/* Current Step Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="truncate">{displayStatus}</span>
              </span>
              {config.showProgressBar && (
                <span className={`${theme.accentText} font-mono font-bold text-xs ml-2 flex-shrink-0`}>
                  {Math.min(100, Math.round(progress))}%
                </span>
              )}
            </div>

            {/* Progress Bar Track */}
            {config.showProgressBar && (
              <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className={`bg-gradient-to-r ${theme.progressBar} h-full rounded-full transition-all duration-300 ease-out shadow-sm`}
                  style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
                />
              </div>
            )}

            {/* Stepped Checklist Indicators */}
            {config.showChecklist && config.checklistItems && config.checklistItems.length > 0 && (
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                {config.checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 truncate" title={item}>
                    <CheckCircle2 className={`w-3 h-3 ${theme.accentText} flex-shrink-0`} />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Note & Quick Skip Action */}
        <div className="flex flex-col items-center gap-2 mt-4">
          {config.footerText && (
            <p className="text-[11px] text-slate-500 font-mono text-center">
              {config.footerText}
            </p>
          )}
          {onSkip && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
              className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-[11px] rounded-full border border-slate-700/60 transition active:scale-95 shadow-sm mt-1"
            >
              Langsung Masuk &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ActionProcessingOverlayProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  progress?: number;
  iconType?: 'zip' | 'pdf' | 'save' | 'load';
}

export const ActionProcessingOverlay: React.FC<ActionProcessingOverlayProps> = ({
  isOpen,
  title,
  subtitle,
  progress,
  iconType = 'load',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4">
        {/* Animated Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner">
          {iconType === 'zip' && <Layers className="w-8 h-8 animate-bounce text-amber-400" />}
          {iconType === 'pdf' && <FileSpreadsheet className="w-8 h-8 animate-pulse text-emerald-400" />}
          {iconType === 'save' && <ShieldCheck className="w-8 h-8 text-emerald-300" />}
          {iconType === 'load' && <Sparkles className="w-8 h-8 animate-spin text-amber-400" />}
        </div>

        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {typeof progress === 'number' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Progres Proses:</span>
              <span className="text-emerald-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Mohon tunggu sebentar, proses sedang berjalan...</span>
        </div>
      </div>
    </div>
  );
};

