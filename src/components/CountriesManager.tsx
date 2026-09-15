import React, { useState, useEffect } from 'react';
import { CountryEntity, Language, Theme } from '../types';
import { fetchCountriesAPI, createCountryAPI, updateCountryAPI, deleteCountryAPI } from '../services/api';
import { Globe, Plus, Edit3, Trash2, X, Check, Loader2, AlertTriangle, Power, PowerOff, Image as ImageIcon, Sparkles } from 'lucide-react';
import { getCountryFlag, getCountryFallbackImage } from '../utils/countryHelper';

interface CountriesManagerProps {
  lang: Language;
  theme: Theme;
  onCountriesUpdated?: () => void;
}

export const CountriesManager: React.FC<CountriesManagerProps> = ({ lang, theme, onCountriesUpdated }) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [countries, setCountries] = useState<CountryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryEntity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // In-App Delete Confirmation Modal State
  const [countryToDelete, setCountryToDelete] = useState<CountryEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Quick Toggle State tracking
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [messageToast, setMessageToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    info_ar: '',
    info_en: '',
    image_url: '',
    is_active: true,
  });

  const loadCountries = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCountriesAPI();
      const list = Array.isArray(data) ? data : ((data as any)?.data || []);
      setCountries(list);
    } catch (e) {
      console.error('Failed to load countries in manager', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessageToast({ text, type });
    setTimeout(() => setMessageToast(null), 3500);
  };

  const openAddModal = () => {
    setEditingCountry(null);
    setForm({
      code: '',
      name_ar: '',
      name_en: '',
      info_ar: '',
      info_en: '',
      image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: CountryEntity) => {
    setEditingCountry(c);
    setForm({
      code: c.code,
      name_ar: c.name_ar,
      name_en: c.name_en,
      info_ar: c.info_ar || '',
      info_en: c.info_en || '',
      image_url: c.image_url || getCountryFallbackImage(c.code),
      is_active: c.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  // 1-Click Toggle Active / Inactive
  const handleToggleActive = async (country: CountryEntity) => {
    const nextActive = country.is_active === false ? true : false;
    setTogglingId(country.id);
    try {
      const res = await updateCountryAPI(country.id, { is_active: nextActive });
      if (res.success) {
        setCountries(prev => prev.map(c => c.id === country.id ? { ...c, is_active: nextActive } : c));
        showToast(
          nextActive 
            ? (isAr ? `تم تفعيل وجهة [${country.name_ar}] وإظهارها في الموقع` : `Destination [${country.name_en}] activated`)
            : (isAr ? `تم إيقاف تفعيل وجهة [${country.name_ar}] وإخفاؤها من الموقع` : `Destination [${country.name_en}] deactivated`),
          'success'
        );
        if (onCountriesUpdated) onCountriesUpdated();
      } else {
        showToast(res.error || (isAr ? 'تعذر تعديل حالة الوجهة' : 'Failed to toggle status'), 'error');
      }
    } catch (e: any) {
      showToast(e.message || (isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error'), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Form Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCountry) {
        const res = await updateCountryAPI(editingCountry.id, form);
        if (res.success) {
          showToast(isAr ? 'تم تعديل بيانات الوجهة بنجاح' : 'Destination updated successfully');
        } else {
          showToast(res.error || (isAr ? 'تعذر تعديل الوجهة' : 'Failed to update'), 'error');
        }
      } else {
        const res = await createCountryAPI(form);
        if (res.success) {
          showToast(isAr ? 'تمت إضافة الوجهة الدراسية الجديدة بنجاح' : 'Destination added successfully');
        } else {
          showToast(res.error || (isAr ? 'تعذر إضافة الوجهة' : 'Failed to add'), 'error');
        }
      }
      setIsModalOpen(false);
      await loadCountries();
      if (onCountriesUpdated) onCountriesUpdated();
    } catch (err: any) {
      showToast(err.message || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Save error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // In-App Delete Action
  const confirmDelete = async () => {
    if (!countryToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteCountryAPI(countryToDelete.id);
      if (ok) {
        showToast(isAr ? `تم حذف وجهة [${countryToDelete.name_ar}] بنجاح` : `Destination [${countryToDelete.name_en}] deleted`, 'success');
        setCountryToDelete(null);
        await loadCountries();
        if (onCountriesUpdated) onCountriesUpdated();
      } else {
        showToast(isAr ? 'تعذر حذف الوجهة، قد تكون مرتبطة ببيانات أخرى' : 'Failed to delete destination', 'error');
      }
    } catch (err: any) {
      showToast(err.message || (isAr ? 'حدث خطأ أثناء الحذف' : 'Delete error'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Toast Notification */}
      {messageToast && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-fadeIn ${
          messageToast.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
            : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {messageToast.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{messageToast.text}</span>
          </div>
          <button onClick={() => setMessageToast(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            <span>{isAr ? 'إدارة الوجهات والدول المعتمدة' : 'Destination Countries Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr 
              ? 'إدارة وتخصيص الدول الأكاديمية المعتمدة، مع إمكانية التفعيل والإيقاف الفوري، والحذف والتعديل الديناميكي.' 
              : 'Add, edit, activate/deactivate, or delete study destination countries.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة وجهة جديدة' : 'Add Destination'}</span>
          </button>
        </div>
      </div>

      {/* Countries Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{isAr ? 'جاري تحميل قائمة الوجهات من قاعدة البيانات...' : 'Loading destinations...'}</p>
        </div>
      ) : countries.length === 0 ? (
        <div className={`py-12 px-6 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <Globe className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold">{isAr ? 'لا توجد وجهات مسجلة حالياً' : 'No destinations found'}</p>
          <p className="text-xs text-slate-400 mt-1">{isAr ? 'انقر على "إضافة وجهة جديدة" للبدء' : 'Click Add Destination to create one'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {countries.map((c) => {
            const flag = getCountryFlag(c.code);
            const isActive = c.is_active !== false;
            const isToggling = togglingId === c.id;

            return (
              <div
                key={c.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all relative overflow-hidden shadow-sm ${
                  !isActive 
                    ? isDark ? 'bg-slate-950/70 border-slate-800/60 opacity-80' : 'bg-slate-100/80 border-slate-300/80 opacity-85'
                    : isDark ? 'bg-slate-900 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 hover:border-amber-400'
                }`}
              >
                <div>
                  {/* Top Bar: Code badge & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{flag}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-mono font-bold uppercase border border-amber-500/30">
                        {c.code}
                      </span>
                    </div>

                    {/* Status Pill Badge */}
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                      isActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      <span>{isActive ? (isAr ? 'مفعلة بالموقع' : 'Active') : (isAr ? 'معطلة (مخفية)' : 'Inactive')}</span>
                    </span>
                  </div>

                  {/* Visual Preview */}
                  <div className="relative h-28 rounded-2xl overflow-hidden mb-3 bg-slate-950 border border-slate-800">
                    <img 
                      src={c.image_url || getCountryFallbackImage(c.code)} 
                      alt={c.name_ar} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCountryFallbackImage(c.code);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute bottom-2 inset-x-3 text-white">
                      <h3 className="text-sm font-black leading-tight">{isAr ? c.name_ar : c.name_en}</h3>
                      <p className="text-[11px] text-amber-300 font-medium">{isAr ? c.name_en : c.name_ar}</p>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isAr ? (c.info_ar || 'لا يوجد وصف مضاف') : (c.info_en || 'No description provided')}
                  </p>
                </div>

                {/* Bottom Controls: Direct 1-Click Toggle + Edit + Delete */}
                <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-3">
                  
                  {/* Activation Toggle Switch Button */}
                  <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                    isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="text-[11px] font-bold flex items-center gap-1.5">
                      {isActive ? (
                        <>
                          <Power className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{isAr ? 'الوجهة نشطة وظاهرة للطلاب' : 'Destination is Active'}</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-slate-400">{isAr ? 'الوجهة معطلة ومخفية' : 'Destination is Hidden'}</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleActive(c)}
                      title={isActive ? (isAr ? 'انقر لإلغاء التفعيل' : 'Click to deactivate') : (isAr ? 'انقر للتفعيل' : 'Click to activate')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white mx-auto" />
                      ) : (
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isActive ? 'ltr:translate-x-6 rtl:-translate-x-6' : 'ltr:translate-x-1 rtl:-translate-x-1'
                          }`}
                        />
                      )}
                    </button>
                  </div>

                  {/* Actions Row: Edit & Delete */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark 
                          ? 'border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-amber-400' 
                          : 'border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-amber-600'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تعديل' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => setCountryToDelete(c)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حذف' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT COUNTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`max-w-lg w-full p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                <span>{editingCountry ? (isAr ? 'تعديل بيانات الوجهة الدراسية' : 'Edit Destination') : (isAr ? 'إضافة وجهة دراسية جديدة' : 'Add New Destination')}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'رمز الدولة (Slug Code بالإنجليزية بدون مسافات)' : 'Country Code'}</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().trim() })}
                  placeholder="uk, australia, nz, usa, canada, germany"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                  <input
                    type="text"
                    required
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    placeholder="المملكة المتحدة (بريطانيا)"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                  <input
                    type="text"
                    required
                    value={form.name_en}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    placeholder="United Kingdom"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'رابط الصورة الترويجية (Image URL)' : 'Cover Image URL'}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  {form.code && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: getCountryFallbackImage(form.code) })}
                      className="px-3 py-2.5 rounded-xl border border-slate-700 text-xs text-amber-400 hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                    >
                      {isAr ? 'صورة افتراضية' : 'Default'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'نبذة ومزايا الدراسة بالعربية' : 'Arabic Info'}</label>
                <textarea
                  rows={2}
                  value={form.info_ar}
                  onChange={(e) => setForm({ ...form, info_ar: e.target.value })}
                  placeholder="وجهة التعليم العالي الأولى عالمياً بتراث أكاديمي عريق وفرص تدريب..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'نبذة ومزايا الدراسة بالإنجليزية' : 'English Info'}</label>
                <textarea
                  rows={2}
                  value={form.info_en}
                  onChange={(e) => setForm({ ...form, info_en: e.target.value })}
                  placeholder="Premier higher education destination with world-class faculty..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Active Toggle Inside Modal */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'تفعيل ظهور الوجهة في الموقع' : 'Activate in Public Site'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr ? 'عند التفعيل، ستظهر الوجهة في الصفحة الرئيسية وصفحة الوجهات ونموذج التقديم.' : 'If enabled, destination will show on Home & Destinations pages.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'حفظ البيانات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED IN-APP DELETE CONFIRMATION MODAL */}
      {countryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2 mb-6">
              <h3 className="text-base font-black text-rose-400">
                {isAr ? 'تأكيد حذف الوجهة الدراسية' : 'Confirm Destination Deletion'}
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                {isAr ? (
                  <>
                    هل أنت متأكد من رغبتك في حذف وجهة <strong className="text-amber-400 font-black">[{countryToDelete.name_ar}]</strong> ({countryToDelete.name_en})؟ 
                    <br />
                    سيتم حذفها نهائياً من قاعدة البيانات وإزالتها من قوائم الموقع.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete <strong className="text-amber-400">[{countryToDelete.name_en}]</strong>?
                    This action will remove it permanently from the database.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCountryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء التراجع' : 'Cancel'}
              </button>
              
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer transition-transform active:scale-98"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isAr ? 'تأكيد الحذف النهائي' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
