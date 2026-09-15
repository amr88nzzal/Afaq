import React, { useState, useEffect } from 'react';
import { UniversityEntity, CountryEntity, MajorEntity, Language, Theme } from '../types';
import { 
  fetchUniversitiesAPI, 
  createUniversityAPI, 
  updateUniversityAPI, 
  deleteUniversityAPI,
  fetchCountriesAPI,
  createMajorAPI,
  updateMajorAPI,
  deleteMajorAPI
} from '../services/api';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Search, 
  Award, 
  MapPin, 
  X, 
  Check, 
  Loader2,
  ExternalLink,
  Coins
} from 'lucide-react';

interface UniversitiesManagerProps {
  lang: Language;
  theme: Theme;
}

export const UniversitiesManager: React.FC<UniversitiesManagerProps> = ({ lang, theme }) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [universities, setUniversities] = useState<UniversityEntity[]>([]);
  const [countries, setCountries] = useState<CountryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');

  // University Modal State
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<UniversityEntity | null>(null);
  const [uniForm, setUniForm] = useState({
    country_id: 1,
    name_ar: '',
    name_en: '',
    city_ar: '',
    city_en: '',
    details_ar: '',
    details_en: '',
    cost_info: '',
    ranking: 50,
    acceptance_rate: '85%',
    image_url: '',
    website_url: '',
  });

  // Major Modal State
  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [activeUniForMajor, setActiveUniForMajor] = useState<UniversityEntity | null>(null);
  const [editingMajor, setEditingMajor] = useState<MajorEntity | null>(null);
  const [majorForm, setMajorForm] = useState({
    name_ar: '',
    name_en: '',
    category: 'الهندسة والتقنية',
    degree_level: 'Bachelor',
    duration: '3-4 سنوات',
    annual_tuition: '£18,000 - £26,000',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [messageToast, setMessageToast] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [unis, cntrs] = await Promise.all([
        fetchUniversitiesAPI(),
        fetchCountriesAPI(),
      ]);
      setUniversities(unis);
      setCountries(cntrs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddUniModal = () => {
    setEditingUni(null);
    setUniForm({
      country_id: countries.length > 0 ? countries[0].id : 1,
      name_ar: '',
      name_en: '',
      city_ar: '',
      city_en: '',
      details_ar: '',
      details_en: '',
      cost_info: '£18,000 - £28,000 سنوياً',
      ranking: 100,
      acceptance_rate: '80%',
      image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      website_url: 'https://',
    });
    setIsUniModalOpen(true);
  };

  const openEditUniModal = (uni: UniversityEntity) => {
    setEditingUni(uni);
    setUniForm({
      country_id: uni.country_id,
      name_ar: uni.name_ar,
      name_en: uni.name_en,
      city_ar: uni.city_ar || '',
      city_en: uni.city_en || '',
      details_ar: uni.details_ar || '',
      details_en: uni.details_en || '',
      cost_info: uni.cost_info || '',
      ranking: uni.ranking || 100,
      acceptance_rate: uni.acceptance_rate || '',
      image_url: uni.image_url || '',
      website_url: uni.website_url || '',
    });
    setIsUniModalOpen(true);
  };

  const handleSaveUni = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingUni) {
        await updateUniversityAPI(editingUni.id, uniForm);
        setMessageToast(isAr ? 'تم تعديل بيانات الجامعة بنجاح' : 'University updated successfully');
      } else {
        await createUniversityAPI(uniForm);
        setMessageToast(isAr ? 'تمت إضافة الجامعة الجديدة بنجاح' : 'New university added successfully');
      }
      setIsUniModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessageToast(null), 3500);
    }
  };

  const handleDeleteUni = async (id: number) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الجامعة وجميع تخصصاتها؟' : 'Are you sure you want to delete this university?')) return;
    await deleteUniversityAPI(id);
    setMessageToast(isAr ? 'تم حذف الجامعة' : 'University deleted');
    await loadData();
    setTimeout(() => setMessageToast(null), 3000);
  };

  // Majors Handling
  const openAddMajorModal = (uni: UniversityEntity) => {
    setActiveUniForMajor(uni);
    setEditingMajor(null);
    setMajorForm({
      name_ar: '',
      name_en: '',
      category: 'الهندسة والتقنية',
      degree_level: 'Bachelor',
      duration: '3-4 سنوات',
      annual_tuition: uni.cost_info || '£19,000',
    });
    setIsMajorModalOpen(true);
  };

  const openEditMajorModal = (uni: UniversityEntity, major: MajorEntity) => {
    setActiveUniForMajor(uni);
    setEditingMajor(major);
    setMajorForm({
      name_ar: major.name_ar,
      name_en: major.name_en,
      category: major.category || 'الهندسة والتقنية',
      degree_level: major.degree_level || 'Bachelor',
      duration: major.duration || '3-4 سنوات',
      annual_tuition: major.annual_tuition || '',
    });
    setIsMajorModalOpen(true);
  };

  const handleSaveMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUniForMajor) return;
    setIsSaving(true);
    try {
      if (editingMajor) {
        await updateMajorAPI(editingMajor.id, majorForm);
        setMessageToast(isAr ? 'تم تعديل التخصص بنجاح' : 'Major updated');
      } else {
        await createMajorAPI({ ...majorForm, university_id: activeUniForMajor.id });
        setMessageToast(isAr ? 'تمت إضافة التخصص الجديد بنجاح' : 'Major added');
      }
      setIsMajorModalOpen(false);
      await loadData();
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessageToast(null), 3500);
    }
  };

  const handleDeleteMajor = async (majorId: number) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف التخصص؟' : 'Delete this major?')) return;
    await deleteMajorAPI(majorId);
    setMessageToast(isAr ? 'تم حذف التخصص' : 'Major deleted');
    await loadData();
    setTimeout(() => setMessageToast(null), 3000);
  };

  const filteredUnis = universities.filter(u => {
    if (!u) return false;
    const matchCountry = selectedCountryFilter === 'all' || u.country_id?.toString() === selectedCountryFilter;
    const q = (searchQuery || '').toLowerCase();
    const nameAr = u.name_ar || '';
    const nameEn = (u.name_en || '').toLowerCase();
    const cityAr = u.city_ar || '';
    const cityEn = (u.city_en || '').toLowerCase();

    const matchSearch = 
      nameAr.includes(searchQuery) ||
      nameEn.includes(q) ||
      cityAr.includes(searchQuery) ||
      cityEn.includes(q);

    return matchCountry && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {messageToast && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{messageToast}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>{isAr ? 'إدارة الجامعات والتخصصات الأكاديمية' : 'Universities & Majors Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr 
              ? 'إضافة، تعديل وحذف الجامعات والبرامج الأكاديمية والتصنيفات في قاعدة البيانات' 
              : 'Add, edit and manage verified universities and degrees in PostgreSQL'}
          </p>
        </div>

        <button
          onClick={openAddUniModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة جامعة جديدة' : 'Add University'}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedCountryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCountryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isAr ? 'جميع الدول' : 'All Countries'}
          </button>
          {countries.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCountryFilter(c.id.toString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCountryFilter === c.id.toString()
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isAr ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث عن جامعة...' : 'Search university...'}
            className={`w-full ps-9 pe-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{isAr ? 'جاري تحميل الجامعات والتخصصات...' : 'Loading universities & majors...'}</p>
        </div>
      )}

      {/* Universities List */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {filteredUnis.map((uni) => (
            <div
              key={uni.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <img
                    src={uni.image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80'}
                    alt={uni.name_ar}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black">{isAr ? uni.name_ar : uni.name_en}</h3>
                      <span className="text-xs text-slate-400">({isAr ? uni.name_en : uni.name_ar})</span>
                      {uni.ranking && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>#{uni.ranking}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <MapPin className="w-3 h-3" />
                        <span>{isAr ? uni.country_name_ar : uni.country_name_en} - {isAr ? uni.city_ar : uni.city_en}</span>
                      </span>
                      <span>•</span>
                      <span>{isAr ? 'الرسوم:' : 'Tuition:'} {uni.cost_info || 'غير محدد'}</span>
                      <span>•</span>
                      <span>{isAr ? 'القبول:' : 'Acceptance:'} {uni.acceptance_rate || 'سريع'}</span>
                    </div>
                  </div>
                </div>

                {/* University Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => openAddMajorModal(uni)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة تخصص' : 'Add Major'}</span>
                  </button>
                  <button
                    onClick={() => openEditUniModal(uni)}
                    className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    title={isAr ? 'تعديل بيانات الجامعة' : 'Edit University'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUni(uni.id)}
                    className="p-2 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title={isAr ? 'حذف الجامعة' : 'Delete University'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Majors Accordion / List for this university */}
              {uni.majors && uni.majors.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">
                    {isAr ? `التخصصات والبرامج المتاحة بالجامعة (${uni.majors.length}):` : `Available Majors (${uni.majors.length}):`}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {uni.majors.map(m => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-200">{isAr ? m.name_ar : m.name_en}</p>
                          <p className="text-[10px] text-slate-400">{m.degree_level} • {m.duration}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditMajorModal(uni, m)}
                            className="p-1 text-slate-400 hover:text-amber-400"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMajor(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* University Add / Edit Modal */}
      {isUniModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`max-w-xl w-full p-6 rounded-3xl border shadow-2xl overflow-y-auto max-h-[90vh] ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>{editingUni ? (isAr ? 'تعديل بيانات الجامعة' : 'Edit University') : (isAr ? 'إضافة جامعة جديدة' : 'Add New University')}</span>
              </h3>
              <button onClick={() => setIsUniModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUni} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'الدولة التابعة لها' : 'Country'}</label>
                <select
                  value={uniForm.country_id}
                  onChange={(e) => setUniForm({ ...uniForm, country_id: parseInt(e.target.value, 10) })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_en}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'اسم الجامعة (بالعربي)' : 'Name (Arabic)'}</label>
                  <input
                    type="text"
                    required
                    value={uniForm.name_ar}
                    onChange={(e) => setUniForm({ ...uniForm, name_ar: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'اسم الجامعة (بالإنجليزي)' : 'Name (English)'}</label>
                  <input
                    type="text"
                    required
                    value={uniForm.name_en}
                    onChange={(e) => setUniForm({ ...uniForm, name_en: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'المدينة (بالعربي)' : 'City (Arabic)'}</label>
                  <input
                    type="text"
                    value={uniForm.city_ar}
                    onChange={(e) => setUniForm({ ...uniForm, city_ar: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'المدينة (بالإنجليزي)' : 'City (English)'}</label>
                  <input
                    type="text"
                    value={uniForm.city_en}
                    onChange={(e) => setUniForm({ ...uniForm, city_en: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'التصنيف العالمي' : 'Ranking'}</label>
                  <input
                    type="number"
                    value={uniForm.ranking}
                    onChange={(e) => setUniForm({ ...uniForm, ranking: parseInt(e.target.value, 10) || 100 })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'الرسوم التقديرية' : 'Tuition Range'}</label>
                  <input
                    type="text"
                    value={uniForm.cost_info}
                    onChange={(e) => setUniForm({ ...uniForm, cost_info: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'نسبة القبول' : 'Acceptance'}</label>
                  <input
                    type="text"
                    value={uniForm.acceptance_rate}
                    onChange={(e) => setUniForm({ ...uniForm, acceptance_rate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'رابط صورة الجامعة' : 'Image URL'}</label>
                <input
                  type="url"
                  value={uniForm.image_url}
                  onChange={(e) => setUniForm({ ...uniForm, image_url: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'نبذة تفصيلية (بالعربي)' : 'Details (Arabic)'}</label>
                <textarea
                  rows={2}
                  value={uniForm.details_ar}
                  onChange={(e) => setUniForm({ ...uniForm, details_ar: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUniModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'حفظ في قاعدة البيانات' : 'Save to DB'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Major Add / Edit Modal */}
      {isMajorModalOpen && activeUniForMajor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>{editingMajor ? (isAr ? 'تعديل التخصص' : 'Edit Major') : (isAr ? 'إضافة تخصص جديد' : 'Add Major')}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeUniForMajor.name_ar}</p>
              </div>
              <button onClick={() => setIsMajorModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMajor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'اسم التخصص (بالعربي)' : 'Major Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  value={majorForm.name_ar}
                  onChange={(e) => setMajorForm({ ...majorForm, name_ar: e.target.value })}
                  placeholder="مثال: هندسة البرمجيات والذكاء الاصطناعي"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'اسم التخصص (بالإنجليزي)' : 'Major Name (English)'}</label>
                <input
                  type="text"
                  required
                  value={majorForm.name_en}
                  onChange={(e) => setMajorForm({ ...majorForm, name_en: e.target.value })}
                  placeholder="e.g. Software Engineering & AI"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'الدرجة العلمية' : 'Degree Level'}</label>
                  <select
                    value={majorForm.degree_level}
                    onChange={(e) => setMajorForm({ ...majorForm, degree_level: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="Bachelor">بكالوريوس (Bachelor)</option>
                    <option value="Master">ماجستير (Master)</option>
                    <option value="Foundation">سنة تحضيرية (Foundation)</option>
                    <option value="PhD">دكتوراه (PhD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'مدة الدراسة' : 'Duration'}</label>
                  <input
                    type="text"
                    value={majorForm.duration}
                    onChange={(e) => setMajorForm({ ...majorForm, duration: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'الرسوم السنوية التقديرية' : 'Annual Tuition'}</label>
                <input
                  type="text"
                  value={majorForm.annual_tuition}
                  onChange={(e) => setMajorForm({ ...majorForm, annual_tuition: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMajorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'حفظ التخصص' : 'Save Major'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
