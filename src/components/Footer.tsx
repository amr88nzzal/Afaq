import React from 'react';
import { LogoRenderer } from './LogoRenderer';
import { Language, Theme } from '../types';
import { SiteSettings } from '../services/api';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award, 
  ExternalLink,
  GraduationCap,
  Lock,
  CheckCircle2,
  Sparkles,
  Clock,
  MessageCircle
} from 'lucide-react';

interface FooterProps {
  lang: Language;
  theme?: Theme;
  selectedLogoId: number;
  onNavigate: (view: any) => void;
  settings?: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  theme = 'dark',
  selectedLogoId,
  onNavigate,
  settings,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const companyName = isAr 
    ? (settings?.company_name_ar || '*** آفاق العالمية للخدمات التعليمية والقبولات الجامعية')
    : (settings?.company_name_en || 'Afaq Global Education & University Placements');

  const companyAddress = isAr
    ? (settings?.company_address_ar || 'استراليا - سيدني - شارع الحرية 15')
    : (settings?.company_address_en || 'Australia - Sydney - 15 Liberty Street');

  const workingHours = isAr
    ? (settings?.working_hours_ar || 'الأحد إلى الخميس: 9:00 صباحاً - 6:00 مساءً (توقيت مكة)')
    : (settings?.working_hours_en || 'Sunday to Thursday: 9:00 AM - 6:00 PM (GMT+3)');

  const phone = settings?.company_phone || '+61468827480';
  const rawWhatsapp = settings?.company_whatsapp || '+491556009968';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '') || '491556009968';
  const email = settings?.company_email || 'afaq@amrodev.com';
  const supportEmail = settings?.support_email || 'support@amrodev.com';

  return (
    <footer className={`border-t text-start transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-300'
    }`}>
      {/* Upper Trust Strip */}
      <div className={`border-b py-8 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-300 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-start">
            <div className="space-y-1">
              <div className="text-amber-500 font-bold text-sm flex items-center justify-center md:justify-start gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'عقود تمثيل جامعي مباشر' : 'Direct University Contracts'}</span>
              </div>
              <p className="text-xs opacity-80">
                {isAr ? 'بدون وسطاء لضمان سرعة إصدار القبول' : 'Direct admission pipeline without intermediaries'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-amber-500 font-bold text-sm flex items-center justify-center md:justify-start gap-1.5">
                <Award className="w-4 h-4" />
                <span>{isAr ? 'معتمدون ببرامج الابتعاث' : 'GCC Scholarship Recognized'}</span>
              </div>
              <p className="text-xs opacity-80">
                {isAr ? 'متوافق مع شروط وزارات التعليم في الخليج' : 'Aligned with GCC Education Ministry criteria'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-amber-500 font-bold text-sm flex items-center justify-center md:justify-start gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span>{isAr ? 'تنبيهات فورية ومباشرة' : 'Instant Alerts via WhatsApp/Telegram'}</span>
              </div>
              <p className="text-xs opacity-80">
                {isAr ? 'متابعة لحظية لحالة الـ CAS والفيزا' : 'Live progress alerts on every admission stage'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-emerald-500 font-bold text-sm flex items-center justify-center md:justify-start gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>{isAr ? 'القبول مجاني 100%' : '100% Free Placement'}</span>
              </div>
              <p className="text-xs opacity-80">
                {isAr ? 'بدون أي أتعاب تقديم أو عمولة وكالة' : 'Zero application fees or agency charges'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <LogoRenderer optionId={selectedLogoId} variant={isDark ? 'dark' : 'light'} />
            
            <p className="text-xs leading-relaxed max-w-sm opacity-85 font-medium">
              {companyName}: {isAr 
                ? 'شريكك المعتمد في الخليج العربي لتأمين القبولات الأكاديمية المجانية في أفضل 100 جامعة ببريطانيا، أستراليا، ونيوزيلندا.'
                : 'Your accredited GCC partner for free academic placements in premier UK, Australian, and New Zealand universities.'}
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs flex-wrap">
              <a 
                href={`https://wa.me/${cleanWhatsapp}`} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1.5 rounded-lg bg-emerald-600/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600/25 transition-colors flex items-center gap-1.5 font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>واتساب {rawWhatsapp}</span>
              </a>
              <a 
                href="https://t.me/Afaq_Abdulrahman" 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1.5 rounded-lg bg-sky-600/15 text-sky-500 border border-sky-500/30 hover:bg-sky-600/25 transition-colors flex items-center gap-1.5 font-bold"
              >
                <span>✈️</span>
                <span>قناة التلغرام</span>
              </a>
            </div>
          </div>

          {/* Destination Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'الوجهات المعتمدة' : 'Destinations'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('destinations')} className="hover:text-amber-500 transition-colors">
                  🇬🇧 {isAr ? 'جامعات بريطانيا (Russell)' : 'UK Universities'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('destinations')} className="hover:text-amber-500 transition-colors">
                  🇦🇺 {isAr ? 'جامعات أستراليا (Go8)' : 'Australian Universities'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('destinations')} className="hover:text-amber-500 transition-colors">
                  🇳🇿 {isAr ? 'جامعات نيوزيلندا' : 'New Zealand Universities'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('universities')} className="hover:text-amber-500 transition-colors">
                  {isAr ? 'معاهد اللغة الإنجليزية' : 'Accredited Language Institutes'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('universities')} className="hover:text-amber-500 transition-colors">
                  {isAr ? 'السنة التحضيرية (Foundation)' : 'Foundation Programs'}
                </button>
              </li>
            </ul>
          </div>

          {/* Portals & Tools (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'الأنظمة والخدمات' : 'Systems & Services'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('student-portal')} className="hover:text-amber-500 transition-colors flex items-center gap-1.5 text-blue-500 font-bold">
                  <span>•</span>
                  <span>{isAr ? 'بوابة متابعة طلبات الطلاب' : 'Student Status Portal'}</span>
                </button>
              </li>
              <li>
                <a href="#services-model-section" className="hover:text-amber-500 transition-colors flex items-center gap-1.5 text-emerald-500 font-bold">
                  <span>•</span>
                  <span>{isAr ? 'باقات ما بعد القبول الاختيارية' : 'Post-Admission Concierge Services'}</span>
                </a>
              </li>
              <li>
                <button onClick={() => onNavigate('logo-lab')} className="hover:text-amber-500 transition-colors flex items-center gap-1.5 text-amber-500">
                  <span>•</span>
                  <span>{isAr ? 'مختبر الشعارات (7 مقترحات للهوية)' : 'Logo Lab (7 Proposals)'}</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('research')} className="hover:text-amber-500 transition-colors flex items-center gap-1.5 text-teal-500">
                  <span>•</span>
                  <span>{isAr ? 'دراسة المنافسين والقرارات' : 'Competitive Research'}</span>
                </button>
              </li>
              <li className="pt-2 border-t border-slate-700/30">
                <button 
                  onClick={() => {
                    window.location.hash = 'admin';
                    onNavigate('staff-crm');
                  }} 
                  className="hover:text-amber-500 transition-colors flex items-center gap-1.5 opacity-70 hover:opacity-100 text-[11px]"
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>{isAr ? 'بوابة المدراء والمشرفين (./admin)' : 'Staff & Admins Portal (./admin)'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Regional Offices & Contact Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'معلومات التواصل المباشر' : 'Direct Contact & Offices'}
            </h4>
            <div className="space-y-2.5 text-xs opacity-90">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{companyAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span dir="ltr" className="font-mono">{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-mono">{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{workingHours}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className={`border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-500'
        }`}>
          <div>
            © 2026 {companyName}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-amber-500 cursor-pointer">{isAr ? 'القبول الجامعي مجاني 100%' : '100% Free Placement'}</span>
            <span>•</span>
            <span className="hover:text-amber-500 cursor-pointer">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
            <span>•</span>
            <button 
              onClick={() => {
                window.location.hash = 'admin';
                onNavigate('staff-crm');
              }}
              className="hover:text-amber-500 flex items-center gap-1 cursor-pointer font-mono"
            >
              <Lock className="w-3 h-3" />
              <span>./admin</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
