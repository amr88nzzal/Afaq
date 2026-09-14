import React, { useState } from 'react';
import { UNIVERSITIES_DATA } from '../data/mockData';
import { Language, DestinationCountry, University, Theme } from '../types';
import { 
  Search, 
  GraduationCap, 
  MapPin, 
  Award, 
  Coins, 
  ArrowLeft, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface UniversitiesDirectoryProps {
  lang: Language;
  theme?: Theme;
  onApplyForUniversity: (univ: University) => void;
}

export const UniversitiesDirectory: React.FC<UniversitiesDirectoryProps> = ({
  lang,
  theme = 'dark',
  onApplyForUniversity,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredUniversities = UNIVERSITIES_DATA.filter((univ) => {
    const matchesCountry = selectedCountry === 'all' || univ.country === selectedCountry;
    const matchesSearch = 
      univ.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      univ.nameAr.includes(searchQuery) ||
      univ.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      univ.cityAr.includes(searchQuery) ||
      univ.popularMajors.some(m => m.includes(searchQuery));

    return matchesCountry && matchesSearch;
  });

  return (
    <section className={`py-16 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`} id="universities-directory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل الجامعات الشريكة والمنح الدراسية' : 'Partner Universities & Scholarship Directory'}</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isAr ? 'ابحث في نخبة جامعات بريطانيا، أستراليا ونيوزيلندا' : 'Explore Top Universities in UK, Australia & NZ'}
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isAr 
              ? 'جميع الجامعات المدرجة معتمدة رسمياً ومندرجة في قوائم وزارات التعليم العالي بالخليج العربي مع إمكانية التقديم المباشر دون رسوم وكالة.'
              : 'Direct representations offering unconditional admissions, conditional offers, and fast-track processing.'}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className={`rounded-2xl p-4 mb-10 shadow-lg border flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Country Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedCountry('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCountry === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'جميع الوجهات' : 'All Destinations'}
            </button>
            <button
              onClick={() => setSelectedCountry('uk')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCountry === 'uk'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>🇬🇧</span>
              <span>{isAr ? 'بريطانيا' : 'UK'}</span>
            </button>
            <button
              onClick={() => setSelectedCountry('australia')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCountry === 'australia'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>🇦🇺</span>
              <span>{isAr ? 'أستراليا' : 'Australia'}</span>
            </button>
            <button
              onClick={() => setSelectedCountry('new_zealand')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCountry === 'new_zealand'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>🇳🇿</span>
              <span>{isAr ? 'نيوزيلندا' : 'New Zealand'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث باسم الجامعة أو التخصص أو المدينة...' : 'Search university, major or city...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl py-2 pl-3 pr-9 text-xs focus:outline-none focus:border-amber-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* University Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniversities.map((univ) => (
            <div 
              key={univ.id}
              className={`border rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group ${
                isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Image & Rank Badge */}
                <div className="relative h-44 overflow-hidden">
                  <img 
                    src={univ.image} 
                    alt={univ.nameAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback image if local file fails
                      const target = e.currentTarget;
                      const fallback = univ.country === 'uk'
                        ? 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80'
                        : univ.country === 'australia'
                        ? 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&auto=format&fit=crop&q=80';
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Top Bar on Image */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>{isAr ? `المرتبة #${univ.worldRank} عالمياً` : `QS Rank #${univ.worldRank}`}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-900/90 text-white font-bold border border-slate-700">
                      {univ.country === 'uk' ? '🇬🇧 UK' : univ.country === 'australia' ? '🇦🇺 Australia' : '🇳🇿 New Zealand'}
                    </span>
                  </div>

                  {/* Location badge on bottom of image */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1 font-semibold text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? `${univ.cityAr}` : `${univ.city}`}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      {isAr ? 'معتمدة بالخليج' : 'GCC Recognized'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 text-start">
                  <h3 className={`text-lg font-bold group-hover:text-amber-500 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? univ.nameAr : univ.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {univ.name}
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr ? univ.descriptionAr : univ.descriptionEn}
                  </p>

                  {/* Badges / Key info */}
                  <div className={`space-y-1.5 pt-2 border-t text-[11px] ${
                    isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">{isAr ? 'الرسوم السنوية:' : 'Tuition:'}</span>
                      <span className="font-bold text-amber-500">{univ.tuitionRange}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">{isAr ? 'المنح المتوفرة:' : 'Scholarships:'}</span>
                      <span className="text-emerald-500 font-bold">{univ.scholarshipRate}</span>
                    </div>
                  </div>

                  {/* Majors tags */}
                  <div className="pt-2">
                    <div className="text-[10px] opacity-70 mb-1 font-semibold">{isAr ? 'أبرز التخصصات المتاحة:' : 'Popular Majors:'}</div>
                    <div className="flex flex-wrap gap-1">
                      {univ.popularMajors.slice(0, 3).map((major, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded text-[10px] border ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {major}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onApplyForUniversity(univ)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-800 border-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAr ? 'تقديم طلب قبول مجاني 100%' : 'Apply for Free Placement'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
