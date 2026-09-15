import React, { useState, useEffect } from 'react';
import { DESTINATION_DETAILS } from '../data/mockData';
import { Language, DestinationCountry, Theme, CountryEntity } from '../types';
import { fetchCountriesAPI, fetchUniversitiesAPI } from '../services/api';
import { getCountryFlag, getCountryFallbackImage } from '../utils/countryHelper';
import { 
  Building2, 
  Coins, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  PlaneTakeoff, 
  FileText,
  Sparkles
} from 'lucide-react';

interface DestinationsSectionProps {
  lang: Language;
  theme?: Theme;
  onApplyForCountry: (country: DestinationCountry) => void;
  initialSelectedCountry?: DestinationCountry;
  countries?: CountryEntity[];
}

export const DestinationsSection: React.FC<DestinationsSectionProps> = ({
  lang,
  theme = 'dark',
  onApplyForCountry,
  initialSelectedCountry = 'uk',
  countries: propCountries,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [countries, setCountries] = useState<CountryEntity[]>(
    propCountries ? propCountries.filter(c => c.is_active !== false) : []
  );
  const [activeCountryCode, setActiveCountryCode] = useState<string>(initialSelectedCountry);
  const [activeCountryId, setActiveCountryId] = useState<number | null>(null);

  useEffect(() => {
    if (propCountries && propCountries.length > 0) {
      const activeList = propCountries.filter(c => c.is_active !== false);
      setCountries(activeList);
      const match = activeList.find(c => c.code === initialSelectedCountry) || activeList[0];
      if (match) {
        setActiveCountryCode(match.code);
        setActiveCountryId(match.id);
      }
    } else {
      fetchCountriesAPI().then(data => {
        const list = Array.isArray(data) ? data : ((data as any)?.data || []);
        const activeList = list.filter(c => c.is_active !== false);
        if (activeList.length > 0) {
          setCountries(activeList);
          const match = activeList.find(c => c.code === initialSelectedCountry) || activeList[0];
          if (match) {
            setActiveCountryCode(match.code);
            setActiveCountryId(match.id);
          }
        }
      }).catch(err => console.error('Failed to load countries', err));
    }
  }, [propCountries, initialSelectedCountry]);

  // Current active country entity from DB
  const currentDbCountry = countries.find(c => c.code === activeCountryCode) || countries[0];
  
  // Static mockData fallback details if available for uk/australia/new_zealand
  const staticData = DESTINATION_DETAILS[activeCountryCode as DestinationCountry] || DESTINATION_DETAILS['uk'];

  const heroImg = currentDbCountry?.image_url || staticData?.heroImage || getCountryFallbackImage(activeCountryCode);
  const countryNameAr = currentDbCountry?.name_ar || staticData?.nameAr || 'الوجهة الدراسية';
  const countryNameEn = currentDbCountry?.name_en || staticData?.nameEn || 'Study Destination';
  const countryInfoAr = currentDbCountry?.info_ar || staticData?.taglineAr || 'وجهة أكاديمية مميزة معتمدة رسمياً.';
  const countryInfoEn = currentDbCountry?.info_en || staticData?.taglineEn || 'Premier study destination with world-class universities.';
  const flag = getCountryFlag(activeCountryCode);

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
            {isAr ? 'استكشف وجهتك الأكاديمية حول العالم' : 'Explore Global Study Destinations'}
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isAr 
              ? 'وجهات معتمدة رسمياً تجمع بين جودة التعليم المصنف عالمياً، والأمان، وتأشيرات العمل بعد التخرج، مع توافق كامل مع برامج الابتعاث الحكومي.'
              : 'World-renowned academic hubs offering post-study work visas, top safety ratings, and full GCC ministry accreditations.'}
          </p>
        </div>

        {/* Destination Country Buttons (Loaded dynamically from Database) */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {countries.map((c) => {
            const isSelected = activeCountryCode === c.code;
            const cFlag = getCountryFlag(c.code);
            return (
              <button
                key={c.id || c.code}
                onClick={() => {
                  setActiveCountryCode(c.code);
                  setActiveCountryId(c.id);
                }}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : isDark 
                      ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
                }`}
              >
                <span className="text-xl">{cFlag}</span>
                <span>{isAr ? c.name_ar : c.name_en}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Country Spotlight Card */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-200 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Country Visual & Key Overview (5 cols) */}
            <div className="lg:col-span-5 relative min-h-[350px] lg:min-h-full">
              <img 
                src={heroImg} 
                alt={countryNameAr}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = getCountryFallbackImage(activeCountryCode);
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900" />
              
              <div className="absolute bottom-6 inset-x-6 space-y-2 text-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{flag}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    {isAr ? 'وجهة تعليمية معتمدة' : 'Accredited Study Destination'}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {isAr ? countryNameAr : countryNameEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed">
                  {isAr ? countryInfoAr : countryInfoEn}
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
                    {staticData?.costEstimates?.tuition || (isAr ? 'من 12,000 إلى 28,000 $ سنوي' : '$12,000 - $28,000 / yr')}
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
                    {staticData?.costEstimates?.living || (isAr ? '1,000 - 1,600 $ شهرياً' : '$1,000 - $1,600 / mo')}
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
                    {activeCountryCode === 'uk' ? (isAr ? 'سنتين (Graduate Route)' : '2 Years (Graduate Route)') :
                     activeCountryCode === 'australia' ? (isAr ? 'حتى 3-4 سنوات (485)' : '3-4 Years (485 Visa)') :
                     activeCountryCode === 'new_zealand' ? (isAr ? 'حتى 3 سنوات عمل' : 'Up to 3 Years') :
                     (isAr ? 'متاحة وفق القوانين الرسمية' : 'Available post-graduation')}
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
                  {(staticData?.keyPointsAr && isAr ? staticData.keyPointsAr : [
                    isAr ? 'شهادات جامعية معترف بها عالمياً ومن وزارات التعليم العالي الخليجية' : 'Internationally accredited degree programs',
                    isAr ? 'بيئة آمنة ومتعددة الثقافات مع دعم شامل للطلاب الدوليين' : 'Safe multicultural environment with full student support',
                    isAr ? 'إمكانية العمل بدوام جزئي أثناء فترة الدراسة' : 'Part-time work rights during study terms',
                    isAr ? 'مسارات سريعة للقبول والفيزا الدراسية' : 'Fast-track admissions and visa processing'
                  ]).map((point, idx) => (
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
                  {(staticData?.admissionRequirementsAr && isAr ? staticData.admissionRequirementsAr : [
                    isAr ? 'الشهادة الثانوية أو البكالوريوس وكشف الدرجات' : 'Academic transcripts & certificate',
                    isAr ? 'شهادة إجادة اللغة الإنجليزية (IELTS / TOEFL / Duolingo)' : 'English Proficiency (IELTS/TOEFL)',
                    isAr ? 'جواز سفر ساري المفعول لمدة لا تقل عن 6 أشهر' : 'Valid Passport (min 6 months validity)',
                    isAr ? 'السيرة الذاتية وخطاب الغرض من الدراسة (Statement of Purpose)' : 'CV and Statement of Purpose'
                  ]).map((req, idx) => (
                    <span key={idx} className={`px-2.5 py-1 rounded-lg border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      • {req}
                    </span>
                  ))}
                </div>
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
                  onClick={() => onApplyForCountry((activeCountryCode as DestinationCountry) || 'uk')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer transition-all active:scale-95"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAr ? `تقديم طلب قبول مجاني في ${countryNameAr}` : `Apply Free to ${countryNameEn}`}</span>
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
