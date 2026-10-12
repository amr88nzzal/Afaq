import React, { useState } from 'react';

interface LogoRendererProps {
  optionId?: number;
  className?: string;
  variant?: 'light' | 'dark' | 'compact';
  showText?: boolean;
}

export const LogoRenderer: React.FC<LogoRendererProps> = ({ 
  optionId = 1, 
  className = '', 
  variant = 'light',
  showText = true,
}) => {
  const isDark = variant === 'dark';
  const [imgError, setImgError] = useState(false);

  // If optionId is 1 (or default), we render the officially approved 3D emblem from the user's uploaded image
  if (optionId === 1) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Circular Gold 3D Official Crest */}
        <div className="relative w-12 h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-600 shadow-md shadow-amber-900/30 shrink-0 overflow-hidden group">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
            {!imgError ? (
              <img
                src="/afaq_official_logo.jpg"
                alt="AFAQ GLOBAL Official Crest"
                className="w-full h-full object-cover object-center scale-105 transform group-hover:scale-110 transition-transform duration-300"
                onError={() => setImgError(true)}
              />
            ) : (
              <svg viewBox="0 0 100 100" className="w-9 h-9">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#D4AF37" strokeWidth="3" />
                <ellipse cx="50" cy="52" rx="34" ry="14" fill="none" stroke="#D4AF37" strokeWidth="1.5" transform="rotate(-15 50 52)" />
                <circle cx="50" cy="48" r="20" fill="#08182b" stroke="#D4AF37" strokeWidth="2" />
                <polygon points="50,20 74,28 50,36 26,28" fill="#F3D068" stroke="#B8860B" strokeWidth="1" />
                <path d="M 22 75 Q 50 64 50 78 Q 50 64 78 75 Z" fill="#D4AF37" />
              </svg>
            )}
          </div>
        </div>

        {showText && (
          <div className="flex flex-col text-start">
            <div className="flex items-center gap-1.5">
              <span className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                آفـاق
              </span>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                العالمية
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-black tracking-widest uppercase ${isDark ? 'text-amber-300/90' : 'text-amber-600'}`}>
                AFAQ GLOBAL
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                • Education & Migration
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  switch (optionId) {
    case 2:
      // Option 2: International Corporate & Universities Edition
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#C59B4B" strokeWidth="2" opacity="0.5" />
              <path d="M 30 78 Q 60 70 60 48 Q 60 70 90 78" fill="none" stroke={isDark ? '#60A5FA' : '#0B2545'} strokeWidth="5" strokeLinecap="round" />
              <path d="M 46 64 V 40 Q 60 28 74 40 V 64" fill="none" stroke="#C59B4B" strokeWidth="4" />
              <rect x="55" y="44" width="10" height="20" fill="#0B2545" />
              <polygon points="60,20 62,25 67,25 63,28 65,33 60,30 55,33 57,28 53,25 58,25" fill="#C59B4B" />
            </svg>
          </div>
          {showText && (
            <div className="flex flex-col text-start">
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0B2545]'}`}>
                AFAQ GLOBAL
              </span>
              <span className="text-xs font-medium text-amber-600">
                استشارات القبولات الدولية
              </span>
            </div>
          )}
        </div>
      );

    case 3:
      // Option 3: Global Wings & Ascending Student
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="60" cy="38" r="24" fill="none" stroke="#028090" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <circle cx="60" cy="34" r="5" fill="#028090" />
              <path d="M 60 41 L 60 55 M 60 45 L 42 36 M 60 45 L 78 36" stroke="#028090" strokeWidth="3" strokeLinecap="round" />
              <path d="M 22 65 Q 45 56 60 62 Q 75 56 98 65 L 94 72 Q 75 64 60 68 Q 45 64 26 72 Z" fill="#0B2545" />
              <path d="M 28 73 Q 46 66 60 70 Q 74 66 92 73 L 88 80 Q 74 74 60 76 Q 46 74 32 80 Z" fill="#028090" />
              <path d="M 85 86 C 96 76 104 60 106 50" fill="none" stroke="#DFB15B" strokeWidth="2.5" strokeDasharray="3 2" />
              <polygon points="106,47 101,52 108,53" fill="#DFB15B" />
            </svg>
          </div>
          {showText && (
            <div className="flex flex-col text-start">
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0B2545]'}`}>
                آفـاق <span className="text-teal-600 text-lg">GLOBAL</span>
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                EDUCATION & MIGRATION
              </span>
            </div>
          )}
        </div>
      );

    case 4:
      // Option 4: The 3D Royal Gold Medallion & Graduation Cap
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-900/20">
              <div className="w-full h-full rounded-full bg-[#051121] flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-9 h-9">
                  <ellipse cx="50" cy="50" rx="38" ry="16" fill="none" stroke="#D4AF37" strokeWidth="2" transform="rotate(-25 50 50)" />
                  <circle cx="50" cy="50" r="22" fill="#0E233E" stroke="#D4AF37" strokeWidth="1.5" />
                  <polygon points="50,22 72,30 50,38 28,30" fill="#E6CA65" />
                  <line x1="68" y1="31" x2="70" y2="44" stroke="#FFEBA5" strokeWidth="2" />
                  <circle cx="70" cy="45" r="2" fill="#FFEBA5" />
                </svg>
              </div>
            </div>
          </div>
          {showText && (
            <div className="flex flex-col text-start">
              <span className={`text-xl font-black bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent`}>
                آفاق العالمية
              </span>
              <span className="text-xs font-bold text-amber-500/80 tracking-widest uppercase">
                AFAQ ROYAL GLOBAL
              </span>
            </div>
          )}
        </div>
      );

    case 5:
      // Option 5: Architectural Portal to Knowledge
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M 25 85 V 42 C 25 24 75 24 75 42 V 85" fill="none" stroke="#10B981" strokeWidth="4" />
              <line x1="35" y1="75" x2="65" y2="75" stroke="#D97706" strokeWidth="3" />
              <line x1="40" y1="65" x2="60" y2="65" stroke="#D97706" strokeWidth="3" />
              <line x1="45" y1="55" x2="55" y2="55" stroke="#D97706" strokeWidth="3" />
              <polygon points="50,26 52,32 58,32 53,36 55,42 50,38 45,42 47,36 42,32 48,32" fill="#F59E0B" />
            </svg>
          </div>
          {showText && (
            <div className="flex flex-col text-start">
              <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                بوابة آفاق
              </span>
              <span className="text-xs font-bold text-emerald-500">
                AFAQ GLOBAL ACADEMIC GATEWAY
              </span>
            </div>
          )}
        </div>
      );

    case 6:
      // Option 6: The Academic Crest Shield
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M 50 15 L 85 28 C 85 65 50 88 50 88 C 50 88 15 65 15 28 Z" fill="none" stroke="#D97706" strokeWidth="3.5" />
              <circle cx="50" cy="48" r="18" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 3" />
              <polygon points="50,32 64,38 50,44 36,38" fill="#F59E0B" />
            </svg>
          </div>
          {showText && (
            <div className="flex flex-col text-start">
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                آفاق العالمية
              </span>
              <span className="text-xs text-amber-600 font-bold uppercase">
                AFAQ GLOBAL EMBLEM
              </span>
            </div>
          )}
        </div>
      );

    case 7:
    default:
      // Option 7: The Curving Highway to the Future & Guiding Star
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#D69E2E" strokeWidth="2.5" strokeDasharray="3 5" />
              <polygon points="68,26 70,31 75,32 71,35 72,40 68,37 64,40 65,35 61,32 66,31" fill="#D69E2E" />
              <path d="M 50 78 C 42 66 44 48 52 36" fill="none" stroke="#D69E2E" strokeWidth="5" strokeLinecap="round" />
              <path d="M 18 64 Q 38 52 50 56 Q 38 68 18 70 Z" fill="#0B3C68" />
              <path d="M 82 64 Q 62 52 50 56 Q 62 68 82 70 Z" fill="#0284C7" />
            </svg>
          </div>
          {showText && (
            <div className="flex flex-col text-start">
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0B3C68]'}`}>
                آفـاق للتعليم
              </span>
              <span className="text-xs font-bold text-amber-600 tracking-wider">
                AFAQ EDUCATION PATH
              </span>
            </div>
          )}
        </div>
      );
  }
};
