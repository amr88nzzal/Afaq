import React, { useState, useEffect } from 'react';
import { DestinationCountry, Language, StudyLevel, University, Theme, Application, CountryEntity, UniversityEntity, MajorEntity } from '../types';
import { submitApplicationAPI, fetchCountriesAPI, fetchUniversitiesAPI, fetchMajorsAPI } from '../services/api';
import { 
  X, 
  GraduationCap, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  Mail, 
  User, 
  BookOpen, 
  Sparkles,
  Plane,
  ShieldCheck,
  Send,
  Building2,
  Check,
  Loader2,
  Globe2
} from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theme?: Theme;
  prefillCountry?: DestinationCountry;
  prefillUniversity?: University | null;
  onSubmitSuccess: (newAppNumber: string, appData?: any) => void;
  onNavigateToPortal?: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  lang,
  theme = 'dark',
  prefillCountry = 'uk',
  prefillUniversity = null,
  onSubmitSuccess,
  onNavigateToPortal,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Dynamic Data Lists from Database
  const [dbCountries, setDbCountries] = useState<CountryEntity[]>([]);
  const [dbUniversities, setDbUniversities] = useState<UniversityEntity[]>([]);
  const [dbMajors, setDbMajors] = useState<MajorEntity[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(true);

  // Form State
  const [selectedCountryId, setSelectedCountryId] = useState<number>(1);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number>(1);
  const [selectedMajorId, setSelectedMajorId] = useState<number>(1);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>('bachelor');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+966 5');
  const [email, setEmail] = useState('');
  const [hasSponsorship, setHasSponsorship] = useState<'yes' | 'no' | 'applying'>('applying');

  // Notification Preferences
  const [optInWhatsapp, setOptInWhatsapp] = useState<boolean>(true);
  const [optInTelegram, setOptInTelegram] = useState<boolean>(false);
  const [telegramUsername, setTelegramUsername] = useState<string>('');

  // Optional Post-Admission Concierge Services
  const [selectedOptionalServices, setSelectedOptionalServices] = useState<string[]>([]);
  const [generatedAppNum, setGeneratedAppNum] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Countries on Mount
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingLists(true);
      const countries = await fetchCountriesAPI();
      const list = Array.isArray(countries) ? countries : ((countries as any)?.data || []);
      const activeList = list.filter(c => c.is_active !== false);
      if (activeList.length > 0) {
        setDbCountries(activeList);
        // Match prefillCountry
        const found = activeList.find(c => c.code === prefillCountry);
        const initialCountryId = found ? found.id : activeList[0].id;
        setSelectedCountryId(initialCountryId);
      }
      setIsLoadingLists(false);
    }
    loadInitialData();
  }, [prefillCountry]);

  // 2. Fetch Universities when Country Changes
  useEffect(() => {
    async function loadUnis() {
      if (!selectedCountryId) return;
      const unis = await fetchUniversitiesAPI(selectedCountryId);
      setDbUniversities(unis);
      if (unis.length > 0) {
        const initialUniId = (prefillUniversity && typeof prefillUniversity.id === 'number') 
          ? prefillUniversity.id 
          : unis[0].id;
        setSelectedUniversityId(initialUniId);
      }
    }
    loadUnis();
  }, [selectedCountryId, prefillUniversity]);

  // 3. Fetch Majors when University Changes
  useEffect(() => {
    async function loadMajors() {
      if (!selectedUniversityId) return;
      const majors = await fetchMajorsAPI(selectedUniversityId);
      setDbMajors(majors);
      if (majors.length > 0) {
        setSelectedMajorId(majors[0].id);
      }
    }
    loadMajors();
  }, [selectedUniversityId]);

  const toggleOptionalService = (serviceId: string) => {
    setSelectedOptionalServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedCountry = dbCountries.find(c => c.id === selectedCountryId);
    const selectedUni = dbUniversities.find(u => u.id === selectedUniversityId);
    const selectedMajor = dbMajors.find(m => m.id === selectedMajorId);

    const payload = {
      studentName: fullName,
      studentPhone: phone,
      studentWhatsapp: optInWhatsapp ? phone : undefined,
      studentEmail: email,
      countryId: selectedCountryId,
      universityId: selectedUniversityId,
      majorId: selectedMajorId,
      studyLevel,
      intakeSeason: 'سبتمبر 2026',
      sponsorType: hasSponsorship === 'yes' ? 'government' : hasSponsorship === 'applying' ? 'scholarship' : 'self',
      notes: `خدمات إضافية مختارة: ${selectedOptionalServices.join(', ') || 'لا يوجد'}. تلغرام: ${optInTelegram ? (telegramUsername || 'موافق') : 'غير محدد'}`,
    };

    const res = await submitApplicationAPI(payload);
    const appNum = res.applicationNumber;
    setGeneratedAppNum(appNum);
    setIsSubmitting(false);
    setStep(3);

    const fullApp: Application = res.data || {
      id: `app-${Date.now()}`,
      applicationNumber: appNum,
      studentName: fullName,
      studentEmail: email,
      studentPhone: phone,
      countryOfResidence: 'المملكة العربية السعودية',
      destination: (selectedCountry?.code as DestinationCountry) || 'uk',
      countryId: selectedCountryId,
      countryNameAr: selectedCountry?.name_ar,
      universityId: selectedUniversityId,
      universityName: selectedUni?.name_ar || 'جامعة مانشستر',
      universityNameAr: selectedUni?.name_ar,
      universityNameEn: selectedUni?.name_en,
      majorId: selectedMajorId,
      majorNameAr: selectedMajor?.name_ar || 'علوم الحاسب',
      majorNameEn: selectedMajor?.name_en || 'Computer Science',
      level: studyLevel,
      status: 'under_review',
      counselorId: '1',
      counselorName: 'د. فيصل الشمري',
      counselorPhone: '+966 50 123 4567',
      portalPassword: '123456',
      notes: [`الوجهة: ${selectedCountry?.name_ar || 'بريطانيا'}`, `الجامعة: ${selectedUni?.name_ar || ''}`],
      documents: [
        { id: '1', category: 'passport', nameAr: 'جواز السفر ساري المفعول', nameEn: 'Valid Passport', status: 'pending', required: true },
        { id: '2', category: 'transcript', nameAr: 'كشف الدرجات الأكاديمي', nameEn: 'Academic Transcript', status: 'pending', required: true },
      ],
    };

    onSubmitSuccess(appNum, fullApp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className={`border rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-start overflow-hidden max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-5 end-5 p-2 rounded-full transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'تقديم طلب قبول مجاني 100%' : '100% Free Application'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {isAr ? 'ابدأ رحلة قبولك الجامعي المعتمد' : 'Start Your Direct University Admission'}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isAr 
              ? 'مربوط مباشرة بقاعدة البيانات الرسمية لضمان إصدار العرض الأكاديمي في أسرع وقت' 
              : 'Direct integration with official admissions DB for accelerated offers'}
          </p>
        </div>

        {/* Step 1: Academic Choices (Relational from DB) */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-amber-500" />
                {isAr ? '1. اختر دولة الدراسة (الوجهة الأكاديمية)' : '1. Choose Destination Country'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {dbCountries.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCountryId(c.id)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedCountryId === c.id
                        ? 'border-amber-500 bg-amber-500/15 font-bold text-amber-500 shadow-md'
                        : isDark
                        ? 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Plane className={`w-4 h-4 ${selectedCountryId === c.id ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">{isAr ? c.name_ar : c.name_en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* University Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                {isAr ? '2. اختر الجامعة المفضلة' : '2. Select University'}
              </label>
              <select
                value={selectedUniversityId}
                onChange={(e) => setSelectedUniversityId(parseInt(e.target.value, 10))}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none ${
                  isDark ? 'bg-slate-800/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {dbUniversities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {isAr ? `${u.name_ar} (تصنيف #${u.ranking || 'عالمي'})` : `${u.name_en} (Rank #${u.ranking || 'Global'})`}
                  </option>
                ))}
                {dbUniversities.length === 0 && (
                  <option value="">{isAr ? 'جاري تحميل الجامعات...' : 'Loading universities...'}</option>
                )}
              </select>
            </div>

            {/* Major & Degree Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  {isAr ? '3. التخصص الأكاديمي' : '3. Program / Major'}
                </label>
                <select
                  value={selectedMajorId}
                  onChange={(e) => setSelectedMajorId(parseInt(e.target.value, 10))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none ${
                    isDark ? 'bg-slate-800/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {dbMajors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {isAr ? m.name_ar : m.name_en}
                    </option>
                  ))}
                  {dbMajors.length === 0 && (
                    <option value="">{isAr ? 'برامج عامة متوفرة' : 'General Programs'}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  {isAr ? '4. المرحلة الدراسية' : '4. Study Level'}
                </label>
                <select
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value as StudyLevel)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none ${
                    isDark ? 'bg-slate-800/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="bachelor">{isAr ? 'بكالوريوس (Undergraduate)' : 'Bachelor Degree'}</option>
                  <option value="master">{isAr ? 'ماجستير (Postgraduate)' : 'Master Degree'}</option>
                  <option value="foundation">{isAr ? 'سنة تحضيرية (Foundation Year)' : 'Foundation Year'}</option>
                  <option value="phd">{isAr ? 'دكتوراه (PhD)' : 'Doctorate / PhD'}</option>
                  <option value="english_course">{isAr ? 'دورة لغة إنجليزية مكثفة' : 'English Language Course'}</option>
                </select>
              </div>
            </div>

            {/* Sponsorship */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                {isAr ? 'التمويل والابتعاث' : 'Funding & Sponsorship'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'applying', labelAr: 'متقدم للابتعاث', labelEn: 'Applying' },
                  { id: 'yes', labelAr: 'مبتعث رسمي', labelEn: 'Sponsored' },
                  { id: 'no', labelAr: 'نفقة خاصة', labelEn: 'Self-Funded' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHasSponsorship(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      hasSponsorship === item.id
                        ? 'border-amber-500 bg-amber-500/15 font-bold text-amber-500'
                        : isDark
                        ? 'border-slate-800 bg-slate-800/40 text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
            >
              <span>{isAr ? 'متابعة بيانات الطالب' : 'Continue to Personal Details'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Personal Contact Details & Channels */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                {isAr ? 'الاسم الكامل (مطابق لجواز السفر)' : 'Full Name (As in Passport)'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? 'مثال: محمد عبدالله القحطاني' : 'e.g. Mohammed Abdullah Al-Qahtani'}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-amber-500 outline-none ${
                  isDark ? 'bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  {isAr ? 'رقم الجوال / الواتساب' : 'Mobile / WhatsApp'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-amber-500 outline-none ${
                    isDark ? 'bg-slate-800/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  {isAr ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-amber-500 outline-none ${
                    isDark ? 'bg-slate-800/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Notification Checkboxes */}
            <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="block text-xs font-bold uppercase tracking-wider text-amber-500">
                {isAr ? 'قنوات الإشعارات الفورية بمراحل القبول' : 'Instant Notification Channels'}
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={optInWhatsapp}
                  onChange={(e) => setOptInWhatsapp(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span>{isAr ? 'استلام تحديثات القبول ورابط البوابة عبر الواتساب' : 'Receive instant updates & portal link via WhatsApp'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={optInTelegram}
                  onChange={(e) => setOptInTelegram(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span>{isAr ? 'إشعار فوري عبر بوت تلغرام' : 'Instant alerts via Telegram Bot'}</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {isAr ? 'الرجوع' : 'Back'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري تسجيل الطلب في قاعدة البيانات...' : 'Saving to Database...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'إرسال الطلب واعتماد التسجيل المجاني' : 'Submit Application (100% Free)'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                {isAr ? 'تم استلام طلبك بنجاح وحفظه في النظام!' : 'Application Successfully Saved in DB!'}
              </h3>
              <p className={`text-xs sm:text-sm mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isAr 
                  ? 'تم تعيين مستشار أكاديمي معتمد لطلبك وإرسال بيانات تسجيل الدخول لبوابة المتابعة إلى بريدك الإلكتروني.'
                  : 'An academic counselor has been assigned and your portal credentials have been emailed to you.'}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border max-w-sm mx-auto ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <span className="text-xs uppercase font-bold text-slate-400 block">{isAr ? 'رقم الطلب الرسمي' : 'Official Application No.'}</span>
              <span className="text-xl font-black text-amber-500 tracking-wider font-mono">{generatedAppNum}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 justify-center">
              {onNavigateToPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPortal();
                  }}
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm transition-all"
                >
                  {isAr ? 'الدخول إلى بوابة متابعة الطلب' : 'Go to Student Tracking Portal'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`py-3 px-6 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {isAr ? 'إغلاق والعودة للموقع' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
