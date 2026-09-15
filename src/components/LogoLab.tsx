import React, { useState } from 'react';
import { LOGO_PROPOSALS } from '../data/mockData';
import { LogoRenderer } from './LogoRenderer';
import { Language, LogoProposal, Theme } from '../types';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Star, 
  Eye, 
  Layers, 
  Award, 
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface LogoLabProps {
  lang: Language;
  theme?: Theme;
  selectedLogoId: number;
  onSelectLogo: (id: number) => void;
}

export const LogoLab: React.FC<LogoLabProps> = ({
  lang,
  theme = 'dark',
  selectedLogoId,
  onSelectLogo,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<number>(selectedLogoId || 1);
  const currentLogo = LOGO_PROPOSALS.find(p => p.id === activeTab) || LOGO_PROPOSALS[0];

  return (
    <div className={`py-12 min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
            <Palette className="w-3.5 h-3.5" />
            <span>{isAr ? 'مختبر الهوية البصرية وتحليل الشعارات المقترحة' : 'Brand Identity & Logo Proposals Lab'}</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {isAr ? 'دراسة وتحسين خيارات الشعار السبعة (آفاق العالمية)' : 'Evaluation & Refinement of the 7 Logo Concepts'}
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {isAr 
              ? 'قمنا بتحليل النماذج السبعة المرفوعة من قبلكم تفصيلياً، ودراسة فلسفة الرموز وتناسقها مع طلاب الخليج والجامعات العالمية، مع تقديم مقترحات لتطويرها واختبارها مباشرة على الموقع.'
              : 'Detailed artistic, cultural, and typographical analysis for each of the 7 uploaded logo proposals with refinement recommendations.'}
          </p>
        </div>

        {/* Logo Selector Tabs (1 to 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-10">
          {LOGO_PROPOSALS.map((proposal) => {
            const isSelected = activeTab === proposal.id;
            const isLive = selectedLogoId === proposal.id;

            return (
              <button
                key={proposal.id}
                onClick={() => setActiveTab(proposal.id)}
                className={`p-3 rounded-xl border text-start transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/20 shadow-lg' 
                    : isDark ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {isLive && (
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black shadow">
                    {isAr ? 'المعتمد حياً' : 'Live'}
                  </span>
                )}
                <div className="text-xs font-bold text-amber-500 mb-1">
                  {isAr ? `الخيار ${proposal.id}` : `Option ${proposal.id}`}
                </div>
                <div className={`text-[11px] line-clamp-2 leading-tight ${
                  isDark ? 'text-slate-200' : 'text-slate-700 font-medium'
                }`}>
                  {isAr ? proposal.titleAr.split(':')[1] || proposal.titleAr : proposal.titleEn}
                </div>
                <div className={`mt-2 flex items-center justify-between text-[10px] border-t pt-1.5 ${
                  isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
                }`}>
                  <span>{isAr ? 'الملاءمة' : 'Appeal'}</span>
                  <span className="font-bold text-amber-500">{proposal.culturalAppealScore}/10</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Logo Deep-Dive View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Visual Mockups Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Canvas 1: Clean White Stationery */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-slate-900 text-start relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2 mb-4">
                <span className="font-semibold text-slate-500">{isAr ? 'معاينة على خلفية فاتحة / أوراق رسمية' : 'Light Canvas / Official Letterhead'}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">White BG</span>
              </div>
              <div className="py-6 flex justify-center items-center">
                <LogoRenderer optionId={currentLogo.id} variant="light" className="scale-125" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500 italic">
                {currentLogo.taglineAr} — {currentLogo.taglineEn}
              </div>
            </div>

            {/* Visual Canvas 2: Luxury Deep Navy Acrylic Sign */}
            <div className="bg-[#0A1A2E] rounded-2xl p-6 shadow-2xl border border-blue-900/60 text-white text-start relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-blue-900/60 pb-2 mb-4">
                <span className="font-semibold text-blue-200">{isAr ? 'معاينة على خلفية داكنة / جدار الاستقبال الفاخر' : 'Dark Canvas / Executive Wall Signage'}</span>
                <span className="text-[10px] bg-blue-950/80 px-2 py-0.5 rounded font-mono text-amber-400">Navy 3D</span>
              </div>
              <div className="py-6 flex justify-center items-center">
                <LogoRenderer optionId={currentLogo.id} variant="dark" className="scale-125" />
              </div>
            </div>

            {/* Action to set as live website logo */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-white text-start">
                  {isAr ? 'هل يعجبك هذا الخيار؟' : 'Like this concept?'}
                </div>
                <div className="text-[11px] text-slate-400 text-start">
                  {isAr ? 'اضغط لتعيينه كشعار نشط للموقع بالكامل الآن' : 'Apply it as the live active website logo'}
                </div>
              </div>
              <button
                onClick={() => onSelectLogo(currentLogo.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedLogoId === currentLogo.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                }`}
              >
                {selectedLogoId === currentLogo.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'معتمد كشعار رئيسي حالياً' : 'Currently Active'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'تفعيل كشعار الموقع' : 'Activate This Logo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Symbol Breakdown & Recommendations (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-start">
            
            {/* Title & Cultural Fit Score */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isAr ? `الخيار رقم ${currentLogo.id}` : `Concept #${currentLogo.id}`}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span>{isAr ? 'مؤشر الجاذبية للخليج:' : 'Gulf Cultural Appeal:'}</span>
                  <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{currentLogo.culturalAppealScore} / 10</span>
                  </div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? currentLogo.titleAr : currentLogo.titleEn}
              </h2>

              <p className="text-xs sm:text-sm text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                {isAr ? `التوصية المثالية: ${currentLogo.recommendedFor}` : `Recommended Use: ${currentLogo.recommendedFor}`}
              </p>
            </div>

            {/* Symbolic Elements Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'دلالات العناصر والرموز المكونة للشعار:' : 'Symbolic Breakdown & Iconography:'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLogo.symbols.map((symbol, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                    <div className="text-xs font-bold text-amber-300">
                      {isAr ? symbol.symbolAr : symbol.symbolEn}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      {isAr ? symbol.meaningAr : symbol.meaningEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Critique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Strengths */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'نقاط القوة البصرية:' : 'Visual Strengths:'}</span>
                </h4>
                <ul className="space-y-2 text-[11px] text-slate-300">
                  {currentLogo.strengthsAr.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actionable Improvements */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'مقترحات التحسين والتطوير:' : 'Refinement Advice:'}</span>
                </h4>
                <ul className="space-y-2 text-[11px] text-slate-300">
                  {currentLogo.improvementsAr.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">✦</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Color Palette */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  {isAr ? 'لوحة الألوان الرسمية المقترحة لهذا النموذج:' : 'Proposed Palette:'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'متناسقة مع معايير الفخامة والوقار الأكاديمي' : 'Compliant with luxury academic standards'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {currentLogo.colorPalette.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span 
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[11px] font-mono">{col.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
