import React, { useState, useEffect } from 'react';
import { LogoRenderer } from './LogoRenderer';
import { Language, Theme, CMSParagraphEntity } from '../types';
import { SiteSettings } from '../services/api';
import { 
  Globe, 
  UserCheck, 
  Palette, 
  Menu, 
  X, 
  GraduationCap, 
  Compass, 
  BookOpen, 
  Sparkles,
  Sun,
  Moon,
  Plane,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Eye
} from 'lucide-react';

interface NavbarProps {
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  activeView: 'home' | 'destinations' | 'universities' | 'student-portal' | 'logo-lab' | 'research';
  onNavigate: (view: 'home' | 'destinations' | 'universities' | 'student-portal' | 'logo-lab' | 'research') => void;
  selectedLogoId: number;
  onOpenApplicationModal: () => void;
  onOpenCounselorBooking: () => void;
  settings?: SiteSettings;
  cmsParagraphs?: CMSParagraphEntity[];
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  theme,
  onToggleTheme,
  onToggleLang,
  activeView,
  onNavigate,
  selectedLogoId,
  onOpenApplicationModal,
  onOpenCounselorBooking,
  settings,
  cmsParagraphs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contrastMode, setContrastMode] = useState<string>(() => {
    return typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-contrast') || 'normal') : 'normal';
  });

  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // Sync contrast mode state when settings change
  useEffect(() => {
    if (settings?.theme_contrast_mode) {
      setContrastMode(settings.theme_contrast_mode);
      document.documentElement.setAttribute('data-contrast', settings.theme_contrast_mode);
    }
  }, [settings?.theme_contrast_mode]);

  const handleToggleContrast = () => {
    const nextContrast = contrastMode === 'high' ? 'normal' : 'high';
    setContrastMode(nextContrast);
    document.documentElement.setAttribute('data-contrast', nextContrast);
    
    // Also save in local storage for instant loading on reload if settings aren't loaded yet
    try {
      localStorage.setItem('theme_contrast_mode', nextContrast);
    } catch (e) {}
  };

  const handleScrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeView !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById('services-model-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const element = document.getElementById('services-model-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setMobileMenuOpen(false);
  };

  const rawWhatsapp = settings?.company_whatsapp || '+966 50 876 5432';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '') || '966508765432';
  
  const announcementPara = cmsParagraphs?.find(p => p.slug === 'announcement' || p.slug === 'announcement_banner');
  // مصدر الحقيقة لشريط التنبيه هو الإعدادات (settings)، والفقرة احتياطية فقط.
  // كان الترتيب معكوساً: الفقرة أولاً، وهي مخزَّنة في جدول paragraphs منفصل،
  // ولأن مزامنة الإعدادات لم تكن تكتب في ذلك الجدول بقي نص قديم معروضاً.
  // (حدث فعلاً على الموقع الحيّ: الشريط عرض 55% بينما الإعدادات تقول 40%.)
  const announcementText = isAr
    ? (settings?.announcement_banner_ar || announcementPara?.text_ar || 'التسجيل مفتوح الآن للفصل الدراسي 2026/2027 مع منح تفوق تصل حتى 40% من الرسوم الدراسية')
    : (settings?.announcement_banner_en || announcementPara?.text_en || 'Admissions now open for 2026/2027 intakes with merit scholarships up to 40% tuition reduction');

  return (
    <header className={`sticky top-0 z-50 border-b shadow-md transition-colors duration-200 ${
      isDark 
        ? 'bg-slate-950/95 border-slate-800 text-white backdrop-blur-md' 
        : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'
    }`}>
      {/* شريط التنبيه العلوي: الإعلان + واتساب الاستشارات المباشر */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 text-xs font-semibold py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-1">

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-xs font-black whitespace-nowrap">
              {isAr ? 'مجاني 100%' : '100% FREE'}
            </span>
            <span className="font-bold">{announcementText}</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noreferrer"
              aria-label={isAr ? `تواصل معنا على واتساب ${rawWhatsapp}` : `Contact us on WhatsApp ${rawWhatsapp}`}
              className="hover:underline inline-flex items-center gap-1.5 font-black text-slate-950 text-xs min-h-[44px] py-1"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
              <span>{isAr ? 'واتساب الاستشارات:' : 'Advisor WhatsApp:'}</span>
              {/* dir="ltr" ضروري: بدونه يظهر الرقم وعلامة + معكوسين (491556009968+ بدل +491556009968) */}
              <span dir="ltr" className="inline-block tabular-nums">{rawWhatsapp.trim()}</span>
            </a>

            <span className="hidden lg:inline opacity-60" aria-hidden="true">|</span>
            <span className="hidden lg:inline font-bold">
              {isAr ? '🇸🇦 🇰🇼 🇦🇪 معتمدون لبرامج الابتعاث الحكومي' : 'GCC Scholarship Approved'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo - Option 1 is user-approved emblem */}
          <div 
            onClick={() => onNavigate('home')} 
            className="cursor-pointer py-2 group transition-transform hover:scale-[1.01]"
            id="brand-logo-button"
          >
            <LogoRenderer optionId={selectedLogoId} variant={isDark ? 'dark' : 'light'} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeView === 'home' 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                  : isDark ? 'text-slate-200 hover:text-white hover:bg-slate-850' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </button>

            <button
              onClick={() => onNavigate('destinations')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeView === 'destinations' 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                  : isDark ? 'text-slate-200 hover:text-white hover:bg-slate-850' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'وجهات الدراسة' : 'Destinations'}</span>
            </button>

            <button
              onClick={() => onNavigate('universities')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeView === 'universities' 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                  : isDark ? 'text-slate-200 hover:text-white hover:bg-slate-850' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'دليل الجامعات والمنح' : 'Universities Directory'}</span>
            </button>

            <button
              onClick={handleScrollToServices}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isDark ? 'text-slate-200 hover:text-white hover:bg-slate-850' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'القبول المجاني وباقات ما بعد القبول' : 'Concierge & Free Model'}</span>
            </button>

            <button
              onClick={() => onNavigate('research')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeView === 'research' 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                  : isDark ? 'text-slate-200 hover:text-white hover:bg-slate-850' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? `نهتم بكم` : `We Care About You`}</span>
            </button>
          </nav>

          {/* Right Action CTAs & Controls */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Student Portal Navigation Button */}
            <button
              onClick={() => onNavigate('student-portal')}
              id="student-portal-nav-btn"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                activeView === 'student-portal'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : isDark ? 'bg-slate-900 text-blue-400 border-blue-500/30 hover:bg-blue-950/50' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'بوابة متابعة طلبي' : 'Student Portal'}</span>
            </button>

            {/* Apply Free Button */}
            <button
              onClick={onOpenApplicationModal}
              id="header-apply-button"
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'قدم طلبك مجاناً' : 'Apply Free'}</span>
            </button>

            {/* Theme Toggle (Sun/Moon) */}
            <button
              onClick={onToggleTheme}
              id="theme-toggle-btn"
              aria-label={isDark ? (isAr ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (isAr ? 'تفعيل الوضع الداكن' : 'Switch to dark mode')}
              className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDark ? 'تفعيل الوضع الفاتح (Light Mode)' : 'تفعيل الوضع الداكن (Dark Mode)'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              onClick={handleToggleContrast}
              id="contrast-toggle-btn"
              aria-label={isAr ? 'تفعيل وضع التباين العالي' : 'Toggle high contrast mode'}
              aria-pressed={contrastMode === 'high'}
              className={`p-2 rounded-xl border text-xs font-bold transition-colors relative group ${
                contrastMode === 'high'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title={isAr ? 'وضعية التباين العالي الفائقة' : 'High Contrast Mode'}
            >
              <Eye className="w-4 h-4" />
              {contrastMode === 'high' && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              id="language-toggle-btn"
              aria-label={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          </div>

          {/* أزرار الجوال: كل هدف لمس ≥ 44×44px (توصية Apple HIG) مع aria-label */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? (isAr ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (isAr ? 'تفعيل الوضع الداكن' : 'Switch to dark mode')}
              className={`min-h-11 min-w-11 flex items-center justify-center rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleToggleContrast}
              aria-label={isAr ? 'تفعيل وضع التباين العالي' : 'Toggle high contrast mode'}
              aria-pressed={contrastMode === 'high'}
              className={`min-h-11 min-w-11 flex items-center justify-center rounded-xl border relative ${
                contrastMode === 'high'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <Eye className="w-5 h-5" />
              {contrastMode === 'high' && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>

            <button
              onClick={onToggleLang}
              aria-label={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              className={`min-h-11 min-w-11 flex items-center justify-center rounded-xl border text-xs font-bold ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {isAr ? 'EN' : 'عربي'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={isAr ? (mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة') : (mobileMenuOpen ? 'Close menu' : 'Open menu')}
              aria-expanded={mobileMenuOpen}
              className={`min-h-11 min-w-11 flex items-center justify-center rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-t px-4 pt-3 pb-6 space-y-2 animate-fadeIn ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-start ${
              activeView === 'home' ? 'bg-amber-500/20 text-amber-500' : ''
            }`}
          >
            {isAr ? 'الرئيسية' : 'Home'}
          </button>

          <button
            onClick={() => { onNavigate('destinations'); setMobileMenuOpen(false); }}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-start ${
              activeView === 'destinations' ? 'bg-amber-500/20 text-amber-500' : ''
            }`}
          >
            {isAr ? 'وجهات الدراسة (بريطانيا، أستراليا، نيوزيلندا)' : 'Study Destinations'}
          </button>

          <button
            onClick={() => { onNavigate('universities'); setMobileMenuOpen(false); }}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-start ${
              activeView === 'universities' ? 'bg-amber-500/20 text-amber-500' : ''
            }`}
          >
            {isAr ? 'دليل الجامعات والمنح' : 'Universities & Scholarships'}
          </button>

          <button
            onClick={handleScrollToServices}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-start text-emerald-500 hover:bg-emerald-500/10"
          >
            {isAr ? 'القبول المجاني وباقات ما بعد القبول' : 'Concierge & Free Model'}
          </button>

          <button
            onClick={() => { onNavigate('student-portal'); setMobileMenuOpen(false); }}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-start bg-blue-600/20 text-blue-400 border border-blue-500/30"
          >
            {isAr ? 'بوابة الطالب لمتابعة حالة القبول' : 'Student Status Portal'}
          </button>

          <button
            onClick={() => { onNavigate('research'); setMobileMenuOpen(false); }}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-start text-emerald-400"
          >
            {isAr ? 'نهتم بكم' : 'We Care About You'}
          </button>

          <div className="pt-2">
            <button
              onClick={() => { onOpenApplicationModal(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 text-center shadow"
            >
              {isAr ? 'تقديم طلب قبول جامعي مجاني 100%' : 'Apply for 100% Free Placement'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
