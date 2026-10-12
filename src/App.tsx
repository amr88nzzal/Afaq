import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DestinationsSection } from './components/DestinationsSection';
import { UniversitiesDirectory } from './components/UniversitiesDirectory';
import { StudentDashboard } from './components/StudentDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { ConciergeServicesSection } from './components/ConciergeServicesSection';
import { LogoLab } from './components/LogoLab';
import { ResearchSection } from './components/ResearchSection';
import { Footer } from './components/Footer';
import { ApplicationModal } from './components/ApplicationModal';
import { CounselorBookingModal } from './components/CounselorBookingModal';
import { NotificationToast, NotificationPayload } from './components/NotificationToast';
import { MOCK_APPLICATIONS, TESTIMONIALS } from './data/mockData';
import { DestinationCountry, Language, University, Theme, Application, CountryEntity, CMSParagraphEntity, DocumentItem } from './types';
import { fetchCountriesAPI, getSiteSettings, fetchCMSParagraphsAPI, SiteSettings, uploadStudentDocumentAPI, deleteStudentDocumentAPI, fetchPortalSessionAPI, logoutPortalAPI } from './services/api';
import { getCountryFlag, getCountryFallbackImage } from './utils/countryHelper';
import { 
  Award, 
  ShieldCheck, 
  GraduationCap, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Plane,
  FileCheck,
  Star
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('afaq_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  const [activeView, setActiveView] = useState<'home' | 'destinations' | 'universities' | 'student-portal' | 'logo-lab' | 'research' | 'staff-crm'>('home');
  const [selectedDestinationCountry, setSelectedDestinationCountry] = useState<DestinationCountry>('uk');
  const [selectedUniversity, setSelectedUniversity] = useState<University | undefined>(undefined);
  const [countries, setCountries] = useState<CountryEntity[]>([]);
  const [settings, setSettings] = useState<SiteSettings | undefined>(undefined);
  const [cmsParagraphs, setCmsParagraphs] = useState<CMSParagraphEntity[]>([]);

  const refreshCountries = async () => {
    try {
      const data = await fetchCountriesAPI();
      const list = Array.isArray(data) ? data : ((data as any)?.data || []);
      setCountries(list);
    } catch (err) {
      console.error('Failed to load countries in App', err);
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await getSiteSettings();
      if (res && res.settings) setSettings(res.settings);
    } catch (err) {
      console.error('Failed to load site settings in App', err);
    }
  };

  const refreshCMS = async () => {
    try {
      const paras = await fetchCMSParagraphsAPI();
      if (Array.isArray(paras)) setCmsParagraphs(paras);
    } catch (err) {
      console.error('Failed to load CMS paragraphs in App', err);
    }
  };

  // Load countries, site settings, and CMS paragraphs from database API on mount
  useEffect(() => {
    refreshCountries();
    refreshSettings();
    refreshCMS();
  }, []);

  // Sync theme primary color and contrast mode attributes on root html tag
  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute('data-theme-color', settings.theme_primary_color || 'amber');
      document.documentElement.setAttribute('data-contrast', settings.theme_contrast_mode || 'normal');
    }
  }, [settings]);

  // Filter only active countries for public visitor views
  const activeCountries = countries.length > 0
    ? countries.filter(c => c.is_active !== false)
    : [
        { 
          id: 1, 
          code: 'uk', 
          name_ar: 'المملكة المتحدة (بريطانيا)', 
          name_en: 'United Kingdom', 
          image_url: '/images/uk.jpg',
          info_ar: 'أعرق النظم الأكاديمية عالمياً، دراسة البكالوريوس في 3 سنوات والماجستير في سنة مكثفة مع تأشيرة عمل لمدة سنتين بعد التخرج.',
          info_en: '3-year Bachelor and 1-year Master with 2-year Graduate Route work visa.',
          is_active: true
        },
        { 
          id: 2, 
          code: 'australia', 
          name_ar: 'أستراليا', 
          name_en: 'Australia', 
          image_url: '/images/australia.jpg',
          info_ar: 'أعلى جودة حياة وتصنيف جامعي، مع تصريح عمل أثناء الدراسة وتأشيرة عمل بعد التخرج تصل إلى 4 سنوات.',
          info_en: 'Top ranked universities with work rights and post-study visas.',
          is_active: true
        },
        { 
          id: 3, 
          code: 'new_zealand', 
          name_ar: 'نيوزيلندا', 
          name_en: 'New Zealand', 
          image_url: '/images/new_zealand.jpg',
          info_ar: 'جميع جامعات نيوزيلندا مصنفة عالمياً مع بيئة آمنة وترحيب بالطلاب الدوليين.',
          info_en: 'All NZ universities ranked in the top 3% worldwide with outstanding safety.',
          is_active: true
        }
      ];
  
  // Modals
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState<boolean>(false);
  const [isCounselorBookingOpen, setIsCounselorBookingOpen] = useState<boolean>(false);

  // Active student application for the portal
  // ⛔ أُزيل الرجوع التلقائي إلى MOCK_APPLICATIONS[0].
  // كان هذا يجعل بوابة الطالب "مسجَّلة الدخول" وهمياً عند أول زيارة فلا تظهر
  // شاشة الدخول إطلاقاً. الآن: لا جلسة ⇒ لا طلب نشط.
  // ولا تُخزَّن أي كلمة مرور محلياً (الخادم لا يُرسلها أصلاً).
  const [activeStudentApp, setActiveStudentApp] = useState<Application | null>(() => {
    try {
      const saved = localStorage.getItem('afaq_active_app');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.documents?.some((d: any) => d.fileName === 'passport_mohammed.pdf' || d.fileName === 'passport_scan.pdf')) {
          const freshApp = {
            ...parsed,
            documents: MOCK_APPLICATIONS[0]?.documents || parsed.documents
          };
          localStorage.setItem('afaq_active_app', JSON.stringify(freshApp));
          return freshApp;
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  // التحقق من جلسة الطالب على الخادم — المصدر الوحيد للحقيقة.
  // أي بيانات محفوظة في المتصفح لا قيمة لها بدون جلسة صالحة على السيرفر.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await fetchPortalSessionAPI();
      if (cancelled) return;
      if (session.authenticated && session.data) {
        setActiveStudentApp(session.data);
        try {
          localStorage.setItem('afaq_active_app', JSON.stringify(session.data));
        } catch {}
      } else {
        setActiveStudentApp(null);
        try {
          localStorage.removeItem('afaq_active_app');
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Selected Logo Option (Option 1 was confirmed by user)
  const [selectedLogoId, setSelectedLogoId] = useState<number>(1);

  // Live Toast Notification
  const [activeNotification, setActiveNotification] = useState<NotificationPayload | null>(null);

  // Sync theme class to documentElement and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    try {
      localStorage.setItem('afaq_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Support #admin direct link as requested by user
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#/admin' || hash === '#staff' || hash === '#staff-crm') {
        setActiveView('staff-crm');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Trigger real-time alert simulation
  const triggerNotification = (
    channel: 'email' | 'whatsapp' | 'telegram',
    title?: string,
    message?: string
  ) => {
    const channelTitles = {
      email: isAr ? '📧 إشعار رسمي عبر البريد الإلكتروني' : '📧 Official Email Notification',
      whatsapp: isAr ? '💬 تنبيه فوري عبر الواتساب' : '💬 Instant WhatsApp Alert',
      telegram: isAr ? '✈️ إشعار عبر قناة التلغرام' : '✈️ Telegram Channel Alert',
    };

    const channelBodies = {
      email: isAr ? 'تم إرسال رسالة رسمية بخصوص تحديث ملف قبولك الجامعي.' : 'Official letter sent regarding your academic offer update.',
      whatsapp: isAr ? 'مستشارك الأكاديمي متصل الآن لمساعدتك في استكمال الإجراءات.' : 'Your academic counselor is active and ready to assist.',
      telegram: isAr ? 'تم استلام تحديث جديد من عمادة القبول بالجامعة.' : 'New admission notice received from partner university.',
    };

    setActiveNotification({
      id: Date.now().toString(),
      type: channel,
      channel,
      title: title || channelTitles[channel],
      body: message || channelBodies[channel],
      message: message || channelBodies[channel],
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleOpenApplicationWithCountry = (country?: DestinationCountry) => {
    if (country) {
      setSelectedDestinationCountry(country);
    }
    setSelectedUniversity(undefined);
    setIsApplicationModalOpen(true);
  };

  const handleOpenApplicationWithUniversity = (univ: University) => {
    setSelectedUniversity(univ);
    setSelectedDestinationCountry(univ.country);
    setIsApplicationModalOpen(true);
  };

  const handleUpdateStudentDocument = async (
    docId: string, 
    fileName: string, 
    extraData?: {
      fileSize?: string;
      fileUrl?: string;
      docType?: string;
      nameAr?: string;
      nameEn?: string;
    }
  ) => {
    if (!activeStudentApp) return;

    const targetId = activeStudentApp.applicationNumber || activeStudentApp.id;

    // 1. Send upload request to backend server
    const response = await uploadStudentDocumentAPI(targetId, {
      docId,
      docType: extraData?.docType || 'other',
      nameAr: extraData?.nameAr || fileName,
      nameEn: extraData?.nameEn || fileName,
      fileName,
      fileSize: extraData?.fileSize,
      fileUrl: extraData?.fileUrl,
    });

    const serverDoc = response.success ? response.data : null;
    const finalFileUrl = serverDoc?.file_url || serverDoc?.fileUrl || (extraData?.fileUrl?.startsWith('data:') ? undefined : extraData?.fileUrl);
    const finalDocId = serverDoc?.id || docId;

    setActiveStudentApp(prev => {
      if (!prev) return null;
      const currentDocs = prev.documents || [];
      const docIndex = currentDocs.findIndex(d => 
        d.id === docId || 
        d.id === finalDocId || 
        d.category === extraData?.docType || 
        (d as any).doc_type === extraData?.docType
      );

      let newDocs: DocumentItem[];
      if (docIndex >= 0) {
        newDocs = currentDocs.map((d, idx) => 
          idx === docIndex 
            ? { 
                ...d, 
                id: String(finalDocId),
                fileName, 
                fileSize: serverDoc?.file_size || serverDoc?.fileSize || extraData?.fileSize || d.fileSize, 
                file_url: finalFileUrl || d.file_url,
                status: fileName ? ('uploaded' as const) : ('pending' as const),
                uploadedAt: serverDoc?.uploadedAt || new Date().toISOString().split('T')[0]
              } 
            : d
        );
      } else {
        const newDoc: DocumentItem = {
          id: String(finalDocId),
          nameAr: extraData?.nameAr || fileName,
          nameEn: extraData?.nameEn || fileName,
          category: (extraData?.docType as any) || 'other',
          required: false,
          status: 'uploaded',
          fileName,
          fileSize: serverDoc?.file_size || serverDoc?.fileSize || extraData?.fileSize,
          file_url: finalFileUrl,
          uploadedAt: new Date().toISOString().split('T')[0]
        };
        newDocs = [...currentDocs, newDoc];
      }

      const updated = {
        ...prev,
        documents: newDocs,
      };

      try {
        // تنظيف الكائن لعدم تجاوز سعة localStorage
        const safeStorageCopy = JSON.parse(JSON.stringify(updated));
        if (safeStorageCopy.documents) {
          safeStorageCopy.documents = safeStorageCopy.documents.map((d: any) => {
            if (d.file_url && d.file_url.startsWith('data:')) {
              return { ...d, file_url: `/uploads/documents/${d.fileName || 'file.pdf'}` };
            }
            return d;
          });
        }
        localStorage.setItem('afaq_active_app', JSON.stringify(safeStorageCopy));
      } catch (e) {}

      return updated;
    });

    if (fileName) {
      triggerNotification('whatsapp', 
        isAr ? 'تم استلام وثيقتك بنجاح' : 'Document Received',
        isAr ? `تم رفع ملفك (${fileName}) وجاري مراجعته من قبل المستشار المختص.` : `File ${fileName} uploaded and assigned for verification.`
      );
    }
  };

  const handleDeleteStudentDocument = (docId: string) => {
    setActiveStudentApp(prev => {
      if (!prev) return null;
      const currentDocs = prev.documents || [];
      const updated = {
        ...prev,
        documents: currentDocs.map(d => 
          d.id === docId 
            ? { ...d, fileName: undefined, fileSize: undefined, file_url: undefined, status: 'pending' as const }
            : d
        ),
      };
      try {
        localStorage.setItem('afaq_active_app', JSON.stringify(updated));
      } catch (e) {}

      if (prev.id || prev.applicationNumber) {
        deleteStudentDocumentAPI(prev.applicationNumber || prev.id, docId).catch(() => {});
      }
      return updated;
    });
  };

  // شريط الإجراء الثابت على الجوال.
  // السبب: صفحة الجوال طويلة (~13 شاشة)، فيضطر الطالب للعودة إلى أعلى الصفحة
  // ليجد زر التقديم. الشريط يجعله متاحاً في أي موضع تمرير.
  // يظهر في صفحات الموقع العامة فقط — لا في لوحات الطلاب أو الموظفين ولا
  // أثناء فتح أي نافذة، حتى لا يغطّي محتوى يحتاج تفاعلاً.
  const showStickyCta =
    ['home', 'destinations', 'universities', 'research'].includes(activeView as string) &&
    !isApplicationModalOpen &&
    !isCounselorBookingOpen;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-900'
    } ${showStickyCta ? 'pb-24 lg:pb-0' : ''}`}>
      
      {/* Header & Navigation */}
      <Navbar
        lang={lang}
        theme={theme}
        settings={settings}
        cmsParagraphs={cmsParagraphs}
        onToggleTheme={handleToggleTheme}
        onToggleLang={handleToggleLang}
        activeView={activeView as any}
        onNavigate={(view) => {
          if (view !== 'staff-crm' && window.location.hash.includes('admin')) {
            window.location.hash = '';
          }
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        selectedLogoId={selectedLogoId}
        onOpenApplicationModal={() => handleOpenApplicationWithCountry()}
        onOpenCounselorBooking={() => setIsCounselorBookingOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* VIEW: HOME */}
        {activeView === 'home' && (
          <div>
            {/* Hero Section with Quick Eligibility Calculator */}
            <HeroSection
              lang={lang}
              theme={theme}
              countries={activeCountries}
              settings={settings}
              cmsParagraphs={cmsParagraphs}
              onOpenApplication={handleOpenApplicationWithCountry}
              onNavigateDestinations={(country) => {
                if (country) setSelectedDestinationCountry(country);
                setActiveView('destinations');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenCounselorBooking={() => setIsCounselorBookingOpen(true)}
            />

            {/* Gulf Trust Bar: Government Scholarships Recognized */}
            <section className={`border-y py-6 transition-colors duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-start">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                      {isAr ? 'الاعتماد والتوافق الحكومي' : 'Government Accreditation & Compliance'}
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'معتمدون ومتوافقون مع مسارات الابتعاث الحكومي في دول مجلس التعاون الخليجي:' : 'Fully compliant with GCC Government Scholarship Schemes:'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className={`px-3 py-1.5 rounded-xl border font-semibold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      🇸🇦 {isAr ? 'برنامج خادم الحرمين الشريفين للابتعاث' : 'Custodian of Two Holy Mosques'}
                    </span>
                    <span className={`px-3 py-1.5 rounded-xl border font-semibold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      🇦🇪 {isAr ? 'بعثات ديوان الرئاسة ووزارة التربية بالإمارات' : 'UAE Presidential & MOE Scholarships'}
                    </span>
                    <span className={`px-3 py-1.5 rounded-xl border font-semibold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      🇰🇼 {isAr ? 'خطة بعثات وزارة التعليم العالي الكويتية' : 'Kuwait MOHE Approved'}
                    </span>
                    <span className={`px-3 py-1.5 rounded-xl border font-semibold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      🇶🇦 {isAr ? 'الابتعاث الحكومي بدولة قطر' : 'Qatar MOEHE Scholarships'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Destinations Highlights (Loaded from Database) */}
            <section className={`py-16 transition-colors duration-200 ${
              isDark ? 'bg-slate-950' : 'bg-slate-50'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 text-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                      {isAr ? 'الوجهات الدراسية المعتمدة' : 'Accredited Study Destinations'}
                    </span>
                    <h2 className={`text-2xl sm:text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'أين ترغب في بدء رحلتك الجامعية؟' : 'Where Would You Like to Study?'}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setActiveView('destinations');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isAr ? 'استكشف تفاصيل وتكاليف كافة الوجهات' : 'View full destination guide'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCountries.map((country) => {
                    const countryCode = (country.code as DestinationCountry) || 'uk';
                    const flag = getCountryFlag(country.code);
                    const heroImg = country.image_url || getCountryFallbackImage(country.code);
                    const name = isAr ? country.name_ar : country.name_en;
                    const info = isAr ? (country.info_ar || 'وجهة دراسية رائدة معتمدة رسمياً.') : (country.info_en || 'Top accredited study destination.');

                    return (
                      <div 
                        key={country.id || country.code}
                        onClick={() => {
                          setSelectedDestinationCountry(countryCode);
                          setActiveView('destinations');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`border rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all cursor-pointer group shadow-xl flex flex-col justify-between ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 hover:shadow-2xl'
                        }`}
                      >
                        <div>
                          <div className="relative h-48 overflow-hidden bg-slate-900">
                            <img 
                              src={heroImg} 
                              alt={name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getCountryFallbackImage(country.code);
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                            <span className="absolute top-3 right-3 text-2xl">{flag}</span>
                            <div className="absolute bottom-3 inset-x-3 text-start">
                              <span className="text-xs font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded">
                                {isAr ? 'وجهة معتمدة للابتعاث' : 'Accredited Destination'}
                              </span>
                              <h3 className="text-lg font-bold text-white mt-1">
                                {name}
                              </h3>
                            </div>
                          </div>
                          <div className="p-5 text-start space-y-2 text-xs">
                            <p className={`leading-relaxed line-clamp-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {info}
                            </p>
                          </div>
                        </div>

                        <div className="p-5 pt-0">
                          <div className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                            isDark ? 'bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200' : 'bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700'
                          }`}>
                            <span>{isAr ? 'تفاصيل شروط القبول والتأشيرة' : 'Admission & Visa Guide'}</span>
                            <ArrowIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Concierge Services Section: 100% Free Placement vs Optional Paid Concierge */}
            <ConciergeServicesSection
              lang={lang}
              theme={theme}
              onOpenApplication={() => handleOpenApplicationWithCountry()}
            />

            {/* 6-Step Journey: From Consultation to University Seat */}
            <section className={`py-16 border-t text-start transition-colors duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    {isAr ? 'رحلتك معنا من الألف إلى الياء' : 'End-to-End Student Roadmap'}
                  </span>
                  <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isAr ? 'كيف نضمن لك قبولك وسفرك بكل سلاسة؟' : 'Guaranteed Placement in 6 Simple Steps'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                      1
                    </div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'استشارة أكاديمية متخصصة ومجانية' : '1. Initial Profile Assessment'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? 'تقييم شهادتك ومعدلك، وتحديد الجامعات والتخصصات المتوافقة مع متطلبات وزارات التعليم والابتعاث.' : 'Analyzing your GPA, budget, and career goals to match prime university programs.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                      2
                    </div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'تدقيق الوثائق وخطاب الغرض (SOP)' : '2. Document & SOP Refinement'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? 'صياغة خطاب الغرض من الدراسة وتدقيق الشهادات والتوصيات بما يتطابق تماماً مع معايير القبول البريطانية والأسترالية.' : 'Academic editing of your statement of purpose and recommendation letters.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                      3
                    </div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'التقديم المباشر وإصدار القبول المشروط' : '3. Direct Admission Submission'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? 'رفع الطلب عبر بواباتنا المؤسسية المباشرة مع الجامعات الشريكة لضمان تسريع الرد وإصدار العرض الأكاديمي.' : 'Direct institutional submission cutting waiting times from months to days.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                      4
                    </div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'تأكيد القبول النهائي (CAS / CoE)' : '4. Unconditional Offer & Confirmation'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? 'استيفاء الشروط (اللغة أو الضمان المالي)، واستخراج رقم الـ CAS في بريطانيا أو CoE في أستراليا اللازمين للفيزا.' : 'Fulfilling offer conditions and generating official immigration sponsorship codes.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                      5
                    </div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'ملف التأشيرة الطلابية (Student Visa)' : '5. Student Visa Lodgement'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? 'إعداد ملف الفيزا، الفحص الطبي، التأمين الصحي المعتمد (OSHC/IHS)، وحجز موعد البصمة بنسبة قبول 98.4%.' : 'Complete visa packaging, health insurance, and biometric appointments.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                      6
                    </div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'السكن الطلابي والاستقبال في المطار' : '6. Accommodation & Airport Pickup'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? 'حجز سكن جامعي آمن أو سكن مع عائلة مضيفة، وترتيب الاستقبال في المطار والاندماج بالمجتمع الأكاديمي.' : 'Pre-arrival briefing, student halls reservation, and airport meet-and-greet.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials from Gulf Students & Parents */}
            <section className={`py-16 transition-colors duration-200 ${
              isDark ? 'bg-slate-950' : 'bg-slate-50'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    {isAr ? 'قصص نجاح وثقة' : 'Student & Parent Testimonials'}
                  </span>
                  <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isAr ? 'ماذا يقول طلابنا المبتعثون وأولياء أمورهم؟' : 'Trusted by Families Across the Gulf'}
                  </h2>
                </div>

                {/* جوال: شريط أفقي قابل للسحب. من md فأعلى: شبكة 3 أعمدة كما كانت.
                    السبب: ثلاث شهادات مكدّسة تستهلك 897px = 1.1 شاشة كاملة على
                    الجوال، بينما لا يقرأ الطالب عادةً أكثر من واحدة أو اثنتين. */}
                <div className="-mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
                  {TESTIMONIALS.map((testi) => (
                    <div 
                      key={testi.id}
                      className={`border rounded-2xl p-6 flex flex-col justify-between text-start space-y-4 shadow-lg transition-colors shrink-0 w-[85%] snap-center md:w-auto md:shrink ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(testi.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400" />
                          ))}
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed italic ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          "{isAr ? testi.textAr : testi.textEn}"
                        </p>
                      </div>

                      <div className={`pt-4 border-t flex items-center justify-between text-xs ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <div>
                          <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isAr ? testi.nameAr : testi.nameEn}</div>
                          <div className="text-xs opacity-70">{isAr ? testi.cityAr : testi.cityEn}</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                          isDark ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {testi.university}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Consultation Banner with Photo */}
            <section className="py-12 bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950/60 border-y border-slate-800 text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 text-start space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'لا تتردد في بدء مستقبلك اليوم' : 'Take the Next Step Today'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      {isAr ? 'احصل على قبولك الجامعي المشروط خلال 72 ساعة' : 'Secure Your Conditional Admission in 72 Hours'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                      {isAr 
                        ? 'مستشارونا جاهزون لمراجعة مؤهلاتك وتأمين أفضل التخصصات بأعرق الجامعات في بريطانيا، أستراليا ونيوزيلندا دون أية رسوم وكالة.'
                        : 'Our certified advisors assist you with zero placement fees for partner institutions.'}
                    </p>
                  </div>

                  <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                    <button
                      onClick={() => handleOpenApplicationWithCountry()}
                      className="w-full py-3.5 px-6 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{isAr ? 'قدم طلب القبول المباشر مجاناً 100%' : 'Start Free Application'}</span>
                    </button>
                    <button
                      onClick={() => setIsCounselorBookingOpen(true)}
                      className="w-full py-3 px-6 rounded-xl font-bold text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>{isAr ? 'حجز جلسة استشارية مرئية' : 'Book 1-on-1 Video Session'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW: DESTINATIONS */}
        {activeView === 'destinations' && (
          <DestinationsSection
            lang={lang}
            theme={theme}
            countries={activeCountries}
            initialSelectedCountry={selectedDestinationCountry}
            onApplyForCountry={(country) => handleOpenApplicationWithCountry(country)}
          />
        )}

        {/* VIEW: UNIVERSITIES DIRECTORY */}
        {activeView === 'universities' && (
          <UniversitiesDirectory
            lang={lang}
            theme={theme}
            onApplyForUniversity={handleOpenApplicationWithUniversity}
          />
        )}

        {/* VIEW: STUDENT PORTAL */}
        {activeView === 'student-portal' && (
          <StudentDashboard
            lang={lang}
            theme={theme}
            application={activeStudentApp}
            onUpdateDocument={handleUpdateStudentDocument}
            onDeleteDocument={handleDeleteStudentDocument}
            onTriggerNotificationTest={(channel) => triggerNotification(channel)}
            onLoginSuccess={(app) => {
              setActiveStudentApp(app);
              try {
                localStorage.setItem('afaq_active_app', JSON.stringify(app));
              } catch (e) {}
            }}
            onLogout={async () => {
              // إبطال جلسة الطالب على الخادم فعلياً — لا يكفي مسح المتصفح
              await logoutPortalAPI();
              setActiveStudentApp(null);
              try {
                localStorage.removeItem('afaq_active_app');
              } catch (e) {}
            }}
            onOpenApplyModal={() => handleOpenApplicationWithCountry()}
          />
        )}

        {/* VIEW: STAFF CRM */}
        {activeView === 'staff-crm' && (
          <StaffDashboard
            lang={lang}
            theme={theme}
            selectedLogoId={selectedLogoId}
            onSelectLogo={(id) => {
              setSelectedLogoId(id);
              triggerNotification('whatsapp', 
                isAr ? 'تم اعتماد الشعار الجديد للموقع' : 'New Logo Activated',
                isAr ? `تم تحديث شعار الموقع بالكامل بنجاح إلى النموذج رقم ${id}!` : `Logo Option ${id} set as primary brand mark!`
              );
            }}
            onToggleTheme={handleToggleTheme}
            onToggleLang={handleToggleLang}
            onCountriesUpdated={refreshCountries}
            onSettingsUpdated={refreshSettings}
            onCMSUpdated={refreshCMS}
            onReturnToPublicSite={() => {
              window.location.hash = '';
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectApplication={(app) => setActiveStudentApp(app)}
            onSendStudentAlert={(appId, channel, msg) => {
              triggerNotification(channel, 
                isAr ? `تنبيه إداري للطلب ${appId}` : `Staff Alert for ${appId}`,
                msg
              );
            }}
          />
        )}

        {/* VIEW: LOGO LAB (7 PROPOSALS) */}
        {activeView === 'logo-lab' && (
          <LogoLab
            lang={lang}
            theme={theme}
            selectedLogoId={selectedLogoId}
            onSelectLogo={(id) => {
              setSelectedLogoId(id);
              triggerNotification('whatsapp', 
                isAr ? 'تم اعتماد الشعار الجديد للموقع' : 'New Logo Activated',
                isAr ? `تم تحديث شعار الموقع بالكامل بنجاح إلى النموذج رقم ${id}!` : `Logo Option ${id} set as primary brand mark!`
              );
            }}
          />
        )}

        {/* VIEW: RESEARCH & DECISIONS */}
        {activeView === 'research' && (
          <ResearchSection
            lang={lang}
            theme={theme}
            selectedLogoId={selectedLogoId}
            onSelectLogoOption={(id) => setSelectedLogoId(id)}
          />
        )}

      </main>

      {/* Footer */}
      <Footer
        lang={lang}
        theme={theme}
        settings={settings}
        selectedLogoId={selectedLogoId}
        onNavigate={(view) => {
          if (view === 'staff-crm') {
            window.location.hash = 'admin';
          } else if (window.location.hash.includes('admin')) {
            window.location.hash = '';
          }
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Application Modal */}
      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        lang={lang}
        prefillCountry={selectedDestinationCountry}
        prefillUniversity={selectedUniversity}
        onSubmitSuccess={(newAppNum, fullApp) => {
          if (fullApp) {
            setActiveStudentApp(fullApp);
            try {
              localStorage.setItem('afaq_active_app', JSON.stringify(fullApp));
            } catch (e) {}
          }
          triggerNotification('whatsapp', 
            isAr ? `تم إنشاء طلبك بنجاح (${newAppNum})` : `Application Created (${newAppNum})`,
            isAr ? `مرحباً بك في آفاق العالمية! تم تعيين مستشارك وسيتواصل معك عبر الواتساب.` : `Welcome to Afaq! Your advisor has been assigned.`
          );
        }}
        onNavigateToPortal={() => {
          setActiveView('student-portal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Counselor Booking Modal */}
      <CounselorBookingModal
        isOpen={isCounselorBookingOpen}
        onClose={() => setIsCounselorBookingOpen(false)}
        lang={lang}
      />

      {/* Floating Simulated Notification Toast */}
      <NotificationToast
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
        lang={lang}
      />

      {/* شريط الإجراء الثابت — جوال فقط.
          يحلّ مشكلة طول الصفحة: زر التقديم متاح دائماً بلا حاجة للتمرير للأعلى.
          pb بـ env(safe-area-inset-bottom) لتجنّب شريط الإيماءات في iPhone. */}
      {showStickyCta && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => handleOpenApplicationWithCountry()}
            className="w-full min-h-12 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
            <span>{isAr ? 'قدم طلبك الجامعي مجاناً' : 'Apply Free — 100% Placement'}</span>
          </button>
        </div>
      )}

    </div>
  );
}
