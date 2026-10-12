/**
 * ============================================================================
 * لوحة إدارة إعدادات ومعطيات المنصة (Dynamic Platform Settings Manager)
 * ============================================================================
 * يتيح هذا المكون للمشرفين والمدراء تعديل كافة أرقام الهواتف، الإيميلات،
 * العناوين، ونصوص الواجهة العامة المخزنة في قاعدة بيانات PostgreSQL
 * بشكل فوري وبدون الحاجة لإعادة رفع أو بناء الكود.
 */

import React, { useState, useEffect } from 'react';
import { Language, Theme } from '../types';
import { 
  getSiteSettings, 
  updateSiteSettings, 
  SiteSettings, 
  DEFAULT_SETTINGS,
  checkServerHealthAPI 
} from '../services/api';
import { 
  Save, 
  Database, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Globe, 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal,
  ShieldCheck,
  Server,
  Palette,
  Sparkles,
  Eye
} from 'lucide-react';

interface SettingsManagerProps {
  lang: Language;
  theme: Theme;
  onSettingsUpdated?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ lang, theme, onSettingsUpdated }) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [source, setSource] = useState<string>('loading');
  const [isPostgresOnline, setIsPostgresOnline] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'contact' | 'content' | 'theme' | 'notifications' | 'sql'>('contact');

  // جلب الإعدادات وفحص صحة قاعدة البيانات عند التحميل
  const loadSettings = async () => {
    setSource('loading');
    const res = await getSiteSettings();
    setSettings(res.settings);
    setSource(res.source);

    const health = await checkServerHealthAPI();
    setIsPostgresOnline(health.postgres);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const ok = await updateSiteSettings(settings);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      if (onSettingsUpdated) onSettingsUpdated();
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  // توليد سكريبت SQL للتطبيق المباشر في pgAdmin / DBeaver على السيرفر
  const generateSqlScript = () => {
    return `-- ==========================================================
-- سكريبت تحديث إعدادات آفاق في PostgreSQL (Generated SQL)
-- يمكنك تنفيذه في DBeaver أو pgAdmin أو psql
-- ==========================================================
INSERT INTO site_settings (key, value, updated_at) VALUES
('company_phone', '${settings.company_phone}', NOW()),
('company_whatsapp', '${settings.company_whatsapp}', NOW()),
('company_email', '${settings.company_email}', NOW()),
('support_email', '${settings.support_email}', NOW()),
('company_address_ar', '${settings.company_address_ar}', NOW()),
('company_address_en', '${settings.company_address_en}', NOW()),
('working_hours_ar', '${settings.working_hours_ar}', NOW()),
('working_hours_en', '${settings.working_hours_en}', NOW()),
('hero_title_ar', '${settings.hero_title_ar}', NOW()),
('hero_subtitle_ar', '${settings.hero_subtitle_ar}', NOW()),
('announcement_banner_ar', '${settings.announcement_banner_ar}', NOW()),
('admin_notification_email', '${settings.admin_notification_email}', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSqlScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-xl space-y-6 text-start ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">
                {isAr ? 'إعدادات ومعطيات المنصة (قاعدة بيانات PostgreSQL)' : 'Platform Settings & PostgreSQL Database'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr 
                  ? 'تعديل أرقام الهواتف، الإيميلات، العناوين، ونصوص الواجهة مباشرة في قاعدة البيانات' 
                  : 'Manage contact details, addresses, and announcements stored in PostgreSQL'}
              </p>
            </div>
          </div>
        </div>

        {/* Database Live Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            isPostgresOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          }`}>
            <Server className="w-3.5 h-3.5" />
            <span>
              {isPostgresOnline 
                ? (isAr ? 'متصل بـ PostgreSQL المباشر' : 'PostgreSQL Live Connected') 
                : (isAr ? 'الذاكرة الذكية المتزامنة (In-Memory Active)' : 'In-Memory Store Active')}
            </span>
          </div>

          <button
            onClick={loadSettings}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
              isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
            title={isAr ? 'إعادة تحميل الإعدادات' : 'Reload Settings'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeSubTab === 'contact'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{isAr ? 'أرقام الاتصال والعناوين' : 'Contact & Addresses'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('content')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeSubTab === 'content'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isAr ? 'النصوص والإعلانات' : 'Content & Announcements'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('theme')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeSubTab === 'theme'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{isAr ? 'الهوية البصرية والألوان' : 'Visual Brand & Colors'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeSubTab === 'notifications'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{isAr ? 'إشعارات جيميل وتلغرام' : 'Gmail & Telegram Alerts'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sql')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeSubTab === 'sql'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isAr ? 'تصدير كود SQL المباشر' : 'Export SQL Queries'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'تم حفظ التعديلات بنجاح في قاعدة بيانات PostgreSQL وتحديث المنصة فوراً!' : 'Settings successfully saved to PostgreSQL database!'}</span>
        </div>
      )}

      {/* Form Area */}
      {activeSubTab !== 'sql' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Tab 1: Contact & Address Info */}
          {activeSubTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'رقم الهاتف الرئيسي (الاتصال الهاتفي)' : 'Primary Phone Number'}</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <p className="text-xs text-slate-400 mt-1">يظهر في ترويسة الموقع وتذييله وأزرار الاتصال</p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'رقم الواتساب الرسمي للاستشارات' : 'Official WhatsApp Number'}</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.company_whatsapp}
                    onChange={(e) => handleChange('company_whatsapp', e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <p className="text-xs text-slate-400 mt-1">الرقم الذي تُفتح محادثة الواتساب معه مباشرة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'البريد الإلكتروني للقبولات' : 'Admissions Official Email'}</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={settings.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isAr ? 'بريد الدعم الفني والمتابعة' : 'Support & Follow-up Email'}</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={settings.support_email}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'عنوان المقر الرئيسي (باللغة العربية)' : 'Headquarters Address (Arabic)'}</span>
                </label>
                <input
                  type="text"
                  value={settings.company_address_ar}
                  onChange={(e) => handleChange('company_address_ar', e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'عنوان المقر الرئيسي (باللغة الإنجليزية)' : 'Headquarters Address (English)'}</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={settings.company_address_en}
                  onChange={(e) => handleChange('company_address_en', e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'أوقات العمل الرسمية (عربي)' : 'Working Hours (Arabic)'}</span>
                  </label>
                  <input
                    type="text"
                    value={settings.working_hours_ar}
                    onChange={(e) => handleChange('working_hours_ar', e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'أوقات العمل الرسمية (إنجليزي)' : 'Working Hours (English)'}</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.working_hours_en}
                    onChange={(e) => handleChange('working_hours_en', e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Content & Announcements */}
          {activeSubTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'شريط الإعلانات والتنبيهات العلوي (Top Announcement Banner)' : 'Top Announcement Banner'}</span>
                </label>
                <input
                  type="text"
                  value={settings.announcement_banner_ar}
                  onChange={(e) => handleChange('announcement_banner_ar', e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {isAr ? 'العنوان الرئيسي للواجهة (Hero Main Headline)' : 'Hero Main Headline'}
                </label>
                <input
                  type="text"
                  value={settings.hero_title_ar}
                  onChange={(e) => handleChange('hero_title_ar', e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {isAr ? 'النص التعريفي الفرعي لتأكيد المجانية والاعتماد' : 'Hero Subtitle & Accreditation'}
                </label>
                <textarea
                  rows={3}
                  value={settings.hero_subtitle_ar}
                  onChange={(e) => handleChange('hero_subtitle_ar', e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Tab: Visual Brand & Theme Colors */}
          {activeSubTab === 'theme' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-emerald-500/10 border border-amber-500/20 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-amber-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'محرك التحكم بالألوان الرئيسية والتباين البصري للموقع' : 'Dynamic Theme Color & Contrast Controller'}</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  {isAr 
                    ? 'يمكنك تغيير اللون الأساسي للموقع بالكامل (من البرتقالي الملكي إلى الأزرق الأكاديمي، الزمردي الأخضر، النيلي أو الياقوتي) والتحكم في حدة التباين فوراً بدون إعادة التكويت.'
                    : 'Switch the primary color accent across the entire website dynamically (Amber Gold, Royal Blue, Emerald Green, Indigo, Ruby Red) and adjust contrast sharpness.'}
                </p>
              </div>

              {/* 1. Primary Color Selection */}
              <div>
                <label className="block text-xs font-black mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? '1. اختر اللون الأساسي للمنصة (Primary Brand Color Palette):' : '1. Select Primary Brand Color Palette:'}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'amber', nameAr: 'البرتقالي الملكي (Amber Gold)', nameEn: 'Royal Amber Gold', hex: '#f59e0b', descAr: 'الهوية الرئيسية المعتمدة لمؤسسة آفاق', descEn: 'Official default brand theme' },
                    { id: 'blue', nameAr: 'الأزرق الأكاديمي (Academic Royal Blue)', nameEn: 'Academic Royal Blue', hex: '#2563eb', descAr: 'طابع دبلوماسي وأكاديمي عالي الرقي', descEn: 'Diplomatic & prestige academic theme' },
                    { id: 'emerald', nameAr: 'الزمردي الأخضر (Emerald Green)', nameEn: 'Emerald Green', hex: '#059669', descAr: 'يعكس الأمان والاعتمادية والنمو الأكاديمي', descEn: 'Trust, growth & security accent' },
                    { id: 'indigo', nameAr: 'النيلي المتقدم (Deep Indigo)', nameEn: 'Deep Indigo Violet', hex: '#4f46e5', descAr: 'طابع التكنولوجيا المتقدمة والابتكار', descEn: 'Modern tech & innovation accent' },
                    { id: 'ruby', nameAr: 'الياقوتي الفاخر (Ruby Red)', nameEn: 'Ruby Red', hex: '#e11d48', descAr: 'طابع الحماس والتفوق الأكاديمي', descEn: 'Passionate academic distinction' },
                  ].map((color) => {
                    const isSelected = (settings.theme_primary_color || 'amber') === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          handleChange('theme_primary_color', color.id);
                          document.documentElement.setAttribute('data-theme-color', color.id);
                        }}
                        className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10' 
                            : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color.hex }} />
                            <span className="text-xs font-black">{isAr ? color.nameAr : color.nameEn}</span>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                              {isAr ? 'مُفعل' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isAr ? color.descAr : color.descEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Contrast Control with Visual Switch and Active State Indicator */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-black flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-500" />
                      <span>{isAr ? 'وضعية التباين العالي الفائقة (High Contrast Mode)' : 'High Contrast Mode'}</span>
                    </label>
                    <p className={`text-xs ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
                      {isAr 
                        ? 'تطبيق فلاتر بصرية فورية على مستوى جذر الصفحة (HTML) مع تفتيح وتغميق ذكي للنصوص لتسهيل القراءة.'
                        : 'Apply real-time root CSS filters and intelligent color adaptation to make text exceptionally readable.'}
                    </p>
                  </div>

                  {/* Active Indicator & Toggle Switch */}
                  <div className="flex items-center gap-3">
                    {/* Visual Indicator Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`relative flex h-2.5 w-2.5`}>
                        {settings.theme_contrast_mode === 'high' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${settings.theme_contrast_mode === 'high' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      </span>
                      <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        settings.theme_contrast_mode === 'high'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {settings.theme_contrast_mode === 'high' 
                          ? (isAr ? 'مُفعّل ومحسّن 👁️' : 'Enabled & Optimized 👁️') 
                          : (isAr ? 'معطّل (قياسي) ⚙️' : 'Disabled (Standard) ⚙️')
                        }
                      </span>
                    </div>

                    {/* Sliding Toggle Switch Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newMode = settings.theme_contrast_mode === 'high' ? 'normal' : 'high';
                        handleChange('theme_contrast_mode', newMode);
                        document.documentElement.setAttribute('data-contrast', newMode);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.theme_contrast_mode === 'high' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label="Toggle High Contrast Mode"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.theme_contrast_mode === 'high' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-selectors for visual clarity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('theme_contrast_mode', 'normal');
                      document.documentElement.setAttribute('data-contrast', 'normal');
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      (settings.theme_contrast_mode || 'normal') === 'normal'
                        ? 'border-amber-500 bg-amber-500/10'
                        : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-750' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">{isAr ? '1. التباين القياسي المتوازن' : '1. Standard Balanced Contrast'}</span>
                    <span className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'ألوان ناعمة ومريحة للعين في ظروف الإضاءة القياسية.' : 'Soft and gentle colors for everyday normal lighting.'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleChange('theme_contrast_mode', 'high');
                      document.documentElement.setAttribute('data-contrast', 'high');
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      settings.theme_contrast_mode === 'high'
                        ? 'border-amber-500 bg-amber-500/10'
                        : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-750' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-amber-500">{isAr ? '2. تباين فائق وعالي الوضوح' : '2. Ultra High Contrast'}</span>
                    <span className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isAr ? 'يغمق النصوص الرمادية الباهتة في النهار ويفتحها بالليل للقراءة المريحة بنسبة 100%.' : 'Darkens faded gray text in light mode and clarifies borders.'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Live Preview Card */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="text-xs font-bold mb-3 text-slate-400">{isAr ? 'معاينة حية لشكل العناصر باللون والتباين المختار:' : 'Live Preview of Components:'}</div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
                    {isAr ? 'زر رئيسي معتمد' : 'Primary Button'}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border border-amber-500 text-amber-500 font-bold text-xs">
                    {isAr ? 'زر مفرغ مخصص' : 'Outline Button'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                    {isAr ? 'وسام حالة فعال' : 'Active Status Badge'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Notifications & Bots */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="font-bold text-amber-400">⚡ كيفية عمل نظام التنبيهات:</div>
                <p className="text-slate-300">
                  بمجرد قيام أي طالب بتقديم طلب جديد، يقوم الخادم تلقائياً بإرسال إيميل HTML كامل التفاصيل عبر Gmail SMTP، بالإضافة لإشعار فوري على بوت تلغرام للمدراء.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'قائمة إيميلات الإدارة لاستقبال تنبيهات الطلبات (مفصولة بفواصل)' : 'Admin Notification Emails (comma separated)'}</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={settings.admin_notification_email}
                  onChange={(e) => handleChange('admin_notification_email', e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* ⛔ أُزيلت حقول توكن تلغرام من الواجهة نهائياً.
                  الأسرار لا تُخزَّن في قاعدة بيانات يقرأها المتصفح ولا تُحرَّر من العميل.
                  تُضبط من متغيرات البيئة على السيرفر. */}
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                {isAr
                  ? '🔒 إعدادات تلغرام (التوكن ومعرّف المحادثة) تُضبط الآن من متغيرات البيئة على السيرفر: TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID، ولا يمكن تعديلها أو قراءتها من المتصفح.'
                  : '🔒 Telegram settings (bot token & chat id) are configured server-side via environment variables (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) and can no longer be read or edited from the browser.'}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {isAr 
                ? 'يتم تطبيق الحفظ فوراً في PostgreSQL وتحديث كافة أقسام الموقع بدون إعادة تشغيل.' 
                : 'Changes are written directly to PostgreSQL and update live immediately.'}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 flex items-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (isAr ? 'جاري الحفظ في القاعدة...' : 'Saving to Database...') : (isAr ? 'حفظ التعديلات في قاعدة البيانات' : 'Save Changes to PostgreSQL')}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Tab 4: Raw SQL Script for DBeaver/pgAdmin on Server */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {isAr 
                ? 'يمكنك نسخ هذا الاستعلام وتنفيذه مباشرة في برنامج DBeaver أو pgAdmin أو سطر أوامر psql على سيرفر أوراكل:' 
                : 'You can execute this query directly in DBeaver, pgAdmin, or psql on your Oracle Cloud server:'}
            </p>
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ كود SQL' : 'Copy SQL')}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
            {generateSqlScript()}
          </pre>
        </div>
      )}
    </div>
  );
};
