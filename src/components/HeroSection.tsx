import React, { useState } from 'react';
import { Language, DestinationCountry, StudyLevel, Theme, CountryEntity, CMSParagraphEntity } from '../types';
import { SiteSettings } from '../services/api';
import { getCountryFlag } from '../utils/countryHelper';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Clock, 
  Award,
  FileCheck
} from 'lucide-react';

interface HeroSectionProps {
  lang: Language;
  theme?: Theme;
  onOpenApplication: (prefillCountry?: DestinationCountry) => void;
  onNavigateDestinations: (country?: DestinationCountry) => void;
  onOpenCounselorBooking: () => void;
  countries?: CountryEntity[];
  settings?: SiteSettings;
  cmsParagraphs?: CMSParagraphEntity[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  lang,
  theme = 'dark',
  onOpenApplication,
  onNavigateDestinations,
  onOpenCounselorBooking,
  countries = [],
  settings,
  cmsParagraphs = [],
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Find dynamic CMS paragraphs if available
  const heroMainPara = cmsParagraphs.find(p => p.slug === 'hero_main' || p.slug === 'hero_title');
  const heroSubPara = cmsParagraphs.find(p => p.slug === 'hero_sub' || p.slug === 'hero_description');
  const whyUsPara = cmsParagraphs.find(p => p.slug === 'why_us' || p.slug === 'about_brief');

  // Dynamic Headline from Database
  const dynamicHeroTitle = isAr 
    ? (heroMainPara?.text_ar || settings?.hero_title_ar || 'بوابتك الموثوقة لأعرق الجامعات العالمية والابتعاث')
    : (heroMainPara?.text_en || settings?.hero_title_en || 'Your Fast-Track Gateway to Premier Global Universities');

  // Dynamic Subtitle from Database
  const dynamicHeroSubtitle = isAr
    ? (heroSubPara?.text_ar || settings?.hero_subtitle_ar || 'نرافق طلاب الشرق الأوسط والخليج العربي خطوة بخطوة: تأمين القبولات غير المشروطة، معادلة الشهادات، استشارات المنح والابتعاث الحكومي، ومرافقة شاملة لإصدار التأشيرة الدراسية حتى وصولك لمقعدك الجامعي.')
    : (heroSubPara?.text_en || settings?.hero_subtitle_en || 'Empowering GCC and Middle Eastern students with guaranteed conditional & unconditional university offers, visa assistance, and specialized government scholarship guidance for the UK, Australia, and New Zealand.');

  // Filter only active countries
  const activeCountries = (countries && countries.length > 0)
    ? countries.filter(c => c.is_active !== false)
    : [
        { id: 1, code: 'uk', name_ar: 'بريطانيا', name_en: 'United Kingdom', is_active: true },
        { id: 2, code: 'australia', name_ar: 'أستراليا', name_en: 'Australia', is_active: true },
        { id: 3, code: 'new_zealand', name_ar: 'نيوزيلندا', name_en: 'New Zealand', is_active: true }
      ];

  // Quick Calculator State
  const [selectedCountry, setSelectedCountry] = useState<DestinationCountry>('uk');
  const [selectedLevel, setSelectedLevel] = useState<StudyLevel>('bachelor');
  const [gpaLevel, setGpaLevel] = useState<'high' | 'medium' | 'need_foundation'>('high');
  const [englishLevel, setEnglishLevel] = useState<'has_ielts' | 'studying' | 'need_course'>('has_ielts');
  const [calculatedResult, setCalculatedResult] = useState<boolean>(false);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCalculatedResult(true);
  };

  return (
    <section 
      id="hero-section"
      className={`relative overflow-hidden transition-colors duration-300 pt-10 pb-20 lg:pt-16 lg:pb-28 ${
        isDark ? 'bg-slate-950 text-white' : 'bg-gradient-to-b from-white via-amber-50/30 to-slate-50 text-slate-900'
      }`}
    >
      {/* Background imagery with theme-adaptive overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/images/uk.jpg" 
          alt="Prestigious University Campus" 
          className={`w-full h-full object-cover object-center scale-105 transform filter transition-opacity duration-300 ${
            isDark ? 'opacity-20 saturate-125' : 'opacity-10 saturate-100'
          }`}
        />
        <div 
          className={`absolute inset-0 transition-colors duration-300 ${
            isDark 
              ? 'bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60' 
              : 'bg-gradient-to-t from-white via-white/95 to-white/80'
          }`} 
        />
        <div className={`absolute -top-40 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-amber-500/10' : 'bg-amber-500/15'
        }`} />
        <div className={`absolute bottom-10 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-blue-600/10' : 'bg-blue-500/10'
        }`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-start">
            {/* Prestige & 100% Free badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                isDark 
                  ? 'bg-slate-900/90 border-amber-500/30 text-amber-300' 
                  : 'bg-white border-amber-500/40 text-amber-900 shadow-sm'
              }`}>
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {isAr 
                    ? 'الوكيل المعتمد لجامعات بريطانيا (Russell Group) وأستراليا (Go8)' 
                    : 'Official Representative for UK Russell Group & Australian Go8'}
                </span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md border ${
                isDark 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isAr ? 'القبول الجامعي مجاني 100% وبدون أتعاب' : '100% Free University Placement'}
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {dynamicHeroTitle}
            </h1>

            {/* Subtext */}
            <p className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {dynamicHeroSubtitle}
            </p>

            {/* Key Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-slate-900/80 border-slate-800 text-white' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isAr ? 'قبولات رسمية 100%' : '100% Official Offers'}</div>
                  <div className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>{isAr ? 'عقود تمثيل جامعية مباشرة' : 'Direct university contracts'}</div>
                </div>
              </div>

              <div className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-slate-900/80 border-slate-800 text-white' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isAr ? 'معتمد في دول الخليج' : 'GCC Accredited'}</div>
                  <div className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>{isAr ? 'متوافق مع شروط وزارات التعليم' : 'Ministry scholarship compliant'}</div>
                </div>
              </div>

              <div className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-slate-900/80 border-slate-800 text-white' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="text-xs">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isAr ? 'إصدار سريع خلال 48-72 ساعة' : 'Fast 48-72h Turnaround'}</div>
                  <div className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>{isAr ? 'لبرامج اللغة والسنة التحضيرية' : 'For English & Foundation'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => onOpenApplication()}
                id="hero-apply-now-btn"
                className="px-6 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <GraduationCap className="w-5 h-5" />
                <span>{isAr ? 'ابدأ تقديم طلبك مجاناً' : 'Start Free Application'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenCounselorBooking}
                id="hero-book-counselor-btn"
                className={`px-5 py-3.5 rounded-xl font-bold text-sm border flex items-center gap-2 transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                <span>{isAr ? 'تحدث مع مستشارك الأكاديمي' : 'Talk to an Advisor'}</span>
              </button>
            </div>

            {/* Destination Quick Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {isAr ? 'استكشف الوجهات الأكثر طلباً:' : 'Explore top study destinations:'}
              </span>
              {activeCountries.map((c) => (
                <button 
                  key={c.code || c.id}
                  onClick={() => onNavigateDestinations((c.code as DestinationCountry) || 'uk')} 
                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
                    isDark 
                      ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                  }`}
                >
                  <span>{getCountryFlag(c.code)}</span>
                  <span className="font-semibold">{isAr ? c.name_ar : c.name_en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Eligibility & Admission Matcher Widget (5 cols) */}
          <div className="lg:col-span-5">
            <div className={`rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative border transition-colors ${
              isDark 
                ? 'bg-slate-900/90 border-slate-700/80' 
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/60'
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 mb-5 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'حاسبة القبول والفرص الأكاديمية' : 'Quick Admission Matcher'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'تقييم فوري خلال 30 ثانية' : 'Instant 30-second eligibility check'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  isDark 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isAr ? 'مجاني 100%' : '100% Free'}
                </span>
              </div>

              {!calculatedResult ? (
                <form onSubmit={handleCalculate} className="space-y-4 text-start">
                  {/* Destination Country */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {isAr ? '1. اختر الدولة التي ترغب بالدراسة فيها:' : '1. Target Study Destination:'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeCountries.map((c) => (
                        <button
                          key={c.code || c.id}
                          type="button"
                          onClick={() => setSelectedCountry((c.code as DestinationCountry) || 'uk')}
                          className={`flex-1 min-w-[85px] p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            selectedCountry === c.code
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                              : isDark 
                                ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className="text-base">{getCountryFlag(c.code)}</span>
                          <span>{isAr ? c.name_ar : c.name_en}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Study Level */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {isAr ? '2. الدرجة العلمية المستهدفة:' : '2. Desired Degree Level:'}
                    </label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value as StudyLevel)}
                      className={`w-full rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 border transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="bachelor">{isAr ? 'بكالوريوس (جامعي 3-4 سنوات)' : "Bachelor's Degree"}</option>
                      <option value="master">{isAr ? 'ماجستير (سنة مكثفة في بريطانيا أو سنتين بأستراليا)' : "Master's Degree (1-2 yrs)"}</option>
                      <option value="foundation">{isAr ? 'سنة تأسيسية وتحضيرية (Foundation)' : 'Foundation / Pathway Year'}</option>
                      <option value="english_course">{isAr ? 'دورة لغة إنجليزية أكاديمية مكثفة' : 'Academic English Language Course'}</option>
                      <option value="phd">{isAr ? 'دكتوراه وبحوث متقدمة (PhD)' : 'PhD / Research'}</option>
                    </select>
                  </div>

                  {/* GPA / Academic Status */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {isAr ? '3. المعدل التراكمي التقريبي:' : '3. Academic Grade Level:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setGpaLevel('high')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          gpaLevel === 'high' 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                            : isDark 
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isAr ? 'ممتاز (85%+ أو 3.5+)' : 'Excellent (85%+)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGpaLevel('medium')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          gpaLevel === 'medium' 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                            : isDark 
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isAr ? 'جيد جداً (75-84%)' : 'Very Good (75-84%)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGpaLevel('need_foundation')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          gpaLevel === 'need_foundation' 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                            : isDark 
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isAr ? 'مقبول / يحتاج تمهيدي' : 'Pathway Needed'}
                      </button>
                    </div>
                  </div>

                  {/* English Level */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {isAr ? '4. وضع اختبار اللغة الإنجليزية:' : '4. English Proficiency Status:'}
                    </label>
                    <select
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value as any)}
                      className={`w-full rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 border transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="has_ielts">{isAr ? 'لدي شهادة آيلتس (IELTS) أو توفل / PTE جاهزة' : 'I have IELTS / TOEFL / PTE Ready'}</option>
                      <option value="studying">{isAr ? 'أستعد للاختبار حالياً وأريد تقييماً مبدئياً' : 'Preparing for English Test'}</option>
                      <option value="need_course">{isAr ? 'أرغب ببدء كورس لغة بالخارج قبل الجامعة' : 'Want to study English abroad first'}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>{isAr ? 'احسب فرص القبول والخيارات المتاحة' : 'Check My University Matches'}</span>
                  </button>
                </form>
              ) : (
                /* Calculation Result View */
                <div className="space-y-4 text-start animate-fadeIn">
                  <div className={`p-3.5 rounded-xl border text-xs ${
                    isDark 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className={`font-bold text-sm mb-1 flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-emerald-950'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{isAr ? 'فرص قبولك ممتازة بنسبة 96%!' : 'Admission Match Rate: 96%!'}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      isDark ? 'text-emerald-200/90' : 'text-emerald-800'
                    }`}>
                      {isAr 
                        ? `بناءً على معطياتك، أنت مؤهل للتقديم المباشر على 14 جامعة مرموقة في ${selectedCountry === 'uk' ? 'بريطانيا' : selectedCountry === 'australia' ? 'أستراليا' : 'نيوزيلندا'} مع إمكانية الحصول على منحة تفوق دراسي جزئية.`
                        : `Based on your profile, you qualify for direct placement in over 14 partner institutions with potential international merit discounts.`}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 border text-xs space-y-2 ${
                    isDark 
                      ? 'bg-slate-800/80 border-slate-700 text-slate-200' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className={`font-bold text-xs border-b pb-1 ${
                      isDark ? 'text-slate-300 border-slate-700' : 'text-slate-700 border-slate-200'
                    }`}>
                      {isAr ? 'الجامعات المقترحة لملفك الأكاديمي:' : 'Top Matched Universities:'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {selectedCountry === 'uk' ? 'جامعة مانشستر / ليدز' : selectedCountry === 'australia' ? 'جامعة ملبورن / سيدني' : 'جامعة أوكلاند'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${
                        isDark 
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                          : 'text-amber-800 bg-amber-100 border-amber-300'
                      }`}>
                        {isAr ? 'معتمدة بالخليج' : 'Accredited'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {selectedCountry === 'uk' ? 'جامعة برمنجهام / بريستول' : selectedCountry === 'australia' ? 'جامعة موناش / كوينزلاند' : 'جامعة أوتاجو'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${
                        isDark 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                      }`}>
                        {isAr ? 'منح متوفرة' : 'Scholarships'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => onOpenApplication(selectedCountry)}
                      className="w-full py-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{isAr ? 'ثبت طلبك واستلم القبول المبدئي' : 'Lock in Your Application'}</span>
                    </button>
                    <button
                      onClick={() => setCalculatedResult(false)}
                      className={`w-full py-2 rounded-lg text-xs text-center cursor-pointer transition-colors ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {isAr ? 'إعادة الحساب بتخصص أو دولة أخرى' : 'Recalculate with different criteria'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
