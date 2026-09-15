import React, { useState, useEffect } from 'react';
import { Language, University, Theme, UniversityEntity, CountryEntity } from '../types';
import { fetchUniversitiesAPI, fetchCountriesAPI } from '../services/api';
import { 
  Search, 
  GraduationCap, 
  MapPin, 
  Award, 
  Coins, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  BookOpen,
  Loader2
} from 'lucide-react';

interface UniversitiesDirectoryProps {
  lang: Language;
  theme?: Theme;
  onApplyForUniversity: (univ: any) => void;
}

export const UniversitiesDirectory: React.FC<UniversitiesDirectoryProps> = ({
  lang,
  theme = 'dark',
  onApplyForUniversity,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [universities, setUniversities] = useState<UniversityEntity[]>([]);
  const [countries, setCountries] = useState<CountryEntity[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDirectory() {
      setIsLoading(true);
      try {
        const [uniList, countryList] = await Promise.all([
          fetchUniversitiesAPI(),
          fetchCountriesAPI()
        ]);
        setUniversities(uniList);
        setCountries(countryList);
      } catch (e) {
        console.error('Failed to load universities:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDirectory();
  }, []);

  const filteredUniversities = universities.filter((univ) => {
    if (!univ) return false;
    const matchesCountry = selectedCountryId === 'all' || univ.country_id?.toString() === selectedCountryId;
    const q = (searchQuery || '').toLowerCase();
    const nameEn = (univ.name_en || '').toLowerCase();
    const nameAr = univ.name_ar || '';
    const cityEn = (univ.city_en || '').toLowerCase();
    const cityAr = univ.city_ar || '';

    const matchesSearch = 
      nameEn.includes(q) ||
      nameAr.includes(searchQuery) ||
      cityEn.includes(q) ||
      cityAr.includes(searchQuery) ||
      Boolean(univ.majors?.some(m => 
        (m.name_ar && m.name_ar.includes(searchQuery)) || 
        (m.name_en && m.name_en.toLowerCase().includes(q))
      ));

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
              onClick={() => setSelectedCountryId('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCountryId === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'جميع الوجهات' : 'All Destinations'}
            </button>
            {countries.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountryId(c.id.toString())}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCountryId === c.id.toString()
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{isAr ? c.name_ar : c.name_en}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن جامعة، مدينة، تخصص...' : 'Search university, city, major...'}
              className={`w-full ps-10 pe-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors border ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm text-slate-400">{isAr ? 'جاري استرجاع بيانات الجامعات المعتمدة...' : 'Loading verified universities...'}</p>
          </div>
        )}

        {/* Universities Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniversities.map((univ) => (
              <div 
                key={univ.id}
                className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800/80 hover:border-amber-500/40 shadow-slate-950/40' 
                    : 'bg-white border-slate-200 hover:border-amber-500/40 shadow-slate-200/50'
                }`}
              >
                <div>
                  {/* Image & Rank Badge */}
                  <div className="relative h-48 overflow-hidden group">
                    <img 
                      src={univ.image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80'} 
                      alt={univ.name_ar}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3.5 start-3.5 flex flex-wrap gap-1.5">
                      {univ.ranking && (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>#{univ.ranking}</span>
                        </div>
                      )}
                      <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-amber-400 font-bold text-xs border border-amber-500/30">
                        {isAr ? univ.country_name_ar : univ.country_name_en}
                      </div>
                    </div>

                    {/* City & Name Overlay */}
                    <div className="absolute bottom-3 start-3.5 end-3.5 text-start">
                      <div className="flex items-center gap-1 text-slate-300 text-xs mb-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isAr ? (univ.city_ar || 'المدينة') : (univ.city_en || 'City')}</span>
                      </div>
                      <h3 className="text-lg font-black text-white leading-snug">
                        {isAr ? univ.name_ar : univ.name_en}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 text-start space-y-4">
                    <p className={`text-xs sm:text-sm line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isAr ? univ.details_ar : univ.details_en}
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/40">
                      <div className={`p-2 rounded-xl text-xs ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? 'الرسوم التقديرية' : 'Est. Tuition'}</span>
                        <span className="font-bold text-amber-500">{univ.cost_info || 'تنافسية'}</span>
                      </div>
                      <div className={`p-2 rounded-xl text-xs ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? 'نسبة القبول' : 'Acceptance'}</span>
                        <span className="font-bold text-emerald-400">{univ.acceptance_rate || 'سريعة ومضمونة'}</span>
                      </div>
                    </div>

                    {/* Majors Sample */}
                    {univ.majors && univ.majors.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-amber-500" />
                          {isAr ? 'أبرز البرامج المتاحة:' : 'Popular Majors:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {univ.majors.slice(0, 3).map((m) => (
                            <span key={m.id} className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                              isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
                              {isAr ? m.name_ar : m.name_en}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply Action Footer */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => onApplyForUniversity(univ)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <span>{isAr ? 'تقديم طلب قبول مجاني للجامعة' : 'Apply for Free Admission'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredUniversities.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
            <h4 className="text-lg font-bold">{isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No universities match your search'}</h4>
            <p className="text-xs text-slate-400 mt-1">{isAr ? 'جرب البحث بكلمات أخرى أو اختر جميع الوجهات' : 'Try different keywords or select All Destinations'}</p>
          </div>
        )}

      </div>
    </section>
  );
};
