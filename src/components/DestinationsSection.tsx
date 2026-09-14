import React, { useState } from 'react';
import { DESTINATION_DETAILS } from '../data/mockData';
import { Language, DestinationCountry, Theme } from '../types';
import { 
  Building2, 
  Coins, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  PlaneTakeoff,
  FileText
} from 'lucide-react';

interface DestinationsSectionProps {
  lang: Language;
  theme?: Theme;
  onApplyForCountry: (country: DestinationCountry) => void;
  initialSelectedCountry?: DestinationCountry;
}

export const DestinationsSection: React.FC<DestinationsSectionProps> = ({
  lang,
  theme = 'dark',
  onApplyForCountry,
  initialSelectedCountry = 'uk',
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const [activeCountry, setActiveCountry] = useState<DestinationCountry>(initialSelectedCountry);

  const countryData = DESTINATION_DETAILS[activeCountry];

  return (
    <section className={`py-16 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`} id="destinations-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-bold">
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>{isAr ? 'الوجهات الدراسية العالمية المعتمدة' : 'Accredited Global Study Destinations'}</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isAr ? 'اختر وجهتك الأكاديمية: بريطانيا، أستراليا، ونيوزيلندا' : 'Study in the UK, Australia & New Zealand'}
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isAr 
              ? 'وجهات تجمع بين جودة التعليم المصنف عالمياً، والأمان العالي، وفرص العمل أثناء وبعد التخرج، مع اعتماد رسمي كامل في كافة برامج الابتعاث الحكومي بدول الخليج.'
              : 'World-renowned academic hubs offering post-study work visas, top safety ratings, and full GCC ministry accreditations.'}
          </p>
        </div>

        {/* Destination Country Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveCountry('uk')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 border cursor-pointer ${
              activeCountry === 'uk'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : isDark 
                  ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <span className="text-xl">🇬🇧</span>
            <span>{isAr ? 'المملكة المتحدة (بريطانيا)' : 'United Kingdom'}</span>
          </button>

          <button
            onClick={() => setActiveCountry('australia')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 border cursor-pointer ${
              activeCountry === 'australia'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : isDark 
                  ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <span className="text-xl">🇦🇺</span>
            <span>{isAr ? 'أستراليا (Group of Eight)' : 'Australia (Go8)'}</span>
          </button>

          <button
            onClick={() => setActiveCountry('new_zealand')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 border cursor-pointer ${
              activeCountry === 'new_zealand'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : isDark 
                  ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <span className="text-xl">🇳🇿</span>
            <span>{isAr ? 'نيوزيلندا (أعلى درجات الأمان)' : 'New Zealand'}</span>
          </button>
        </div>

        {/* Selected Country Spotlight Card */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-200 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Country Visual & Key Overview (5 cols) */}
            <div className="lg:col-span-5 relative min-h-[350px] lg:min-h-full">
              <img 
                src={countryData.heroImage} 
                alt={countryData.nameAr}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = activeCountry === 'uk'
                    ? 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80'
                    : activeCountry === 'australia'
                    ? 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80';
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900" />
              
              <div className="absolute bottom-6 inset-x-6 space-y-2 text-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{countryData.flag}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    {isAr ? 'وجهة تعليمية مميزة' : 'Top Study Destination'}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {isAr ? countryData.nameAr : countryData.nameEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                  {isAr ? countryData.taglineAr : countryData.taglineEn}
                </p>
              </div>
            </div>

            {/* Country Detailed Data & Features (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6 text-start">
              
              {/* Cost & Work Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-2xl border space-y-1 ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'تكاليف الدراسة التقريبية' : 'Tuition Estimate'}</span>
                  </div>
                  <div className={`text-xs sm:text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {countryData.costEstimates.tuition}
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border space-y-1 ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isAr ? 'المعيشة والسكن' : 'Living Expenses'}</span>
                  </div>
                  <div className={`text-xs sm:text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {countryData.costEstimates.living}
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border space-y-1 ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'تأشيرة العمل بعد التخرج' : 'Post-Study Visa'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-500">
                    {activeCountry === 'uk' ? 'سنتين (Graduate Route)' : activeCountry === 'australia' ? 'حتى 3-4 سنوات (485)' : 'حتى 3 سنوات عمل'}
                  </div>
                </div>
              </div>

              {/* Main Selling Points */}
              <div className="space-y-3">
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'أهم مزايا الدراسة في هذه الوجهة:' : 'Key Advantages:'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {countryData.keyPointsAr.map((point, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${
                      isDark ? 'bg-slate-800/40 text-slate-200' : 'bg-slate-100 text-slate-800'
                    }`}>
                      <span className="text-amber-500 font-bold shrink-0">✓</span>
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admission Checklist */}
              <div className={`space-y-2 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'المتطلبات الأساسية للقبول في هذه الدولة:' : 'General Admission Requirements:'}</span>
                </h4>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {countryData.admissionRequirementsAr.map((req, idx) => (
                    <span key={idx} className={`px-2.5 py-1 rounded-lg border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      • {req}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cities */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                <span>{isAr ? 'أشهر المدن الجامعية:' : 'Top Cities:'}</span>
                {countryData.popularCitiesAr.map((city, idx) => (
                  <span key={idx} className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                    isDark ? 'bg-slate-800 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {city}
                  </span>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="text-xs text-emerald-500 font-black flex items-center gap-1">
                  <span>✓</span>
                  <span>{isAr ? 'خدمة تأمين القبول مجانية 100%' : '100% Free Placement'}</span>
                </div>
                <button
                  onClick={() => onApplyForCountry(activeCountry)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer transition-all active:scale-95"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAr ? `تقديم طلب قبول مجاني في ${countryData.nameAr}` : `Apply Free to ${countryData.nameEn}`}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
