import React, { useState } from 'react';
import { DestinationCountry, Language, StudyLevel, University, Theme, Application } from '../types';
import { submitApplicationAPI } from '../services/api';
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
  Loader2
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
  const [destination, setDestination] = useState<DestinationCountry>(prefillCountry || 'uk');
  const [studyLevel, setStudyLevel] = useState<StudyLevel>('bachelor');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+966 5');
  const [email, setEmail] = useState('');
  const [majorInterest, setMajorInterest] = useState(prefillUniversity ? prefillUniversity.popularMajors[0] : 'هندسة وذكاء اصطناعي');
  const [preferredUniversity, setPreferredUniversity] = useState(prefillUniversity ? prefillUniversity.nameAr : '');
  const [hasSponsorship, setHasSponsorship] = useState<'yes' | 'no' | 'applying'>('applying');

  // Notification Preferences (Requirement 2)
  const [optInWhatsapp, setOptInWhatsapp] = useState<boolean>(true);
  const [optInTelegram, setOptInTelegram] = useState<boolean>(false);
  const [telegramUsername, setTelegramUsername] = useState<string>('');

  // Optional Post-Admission Concierge Services (Requirement 1)
  const [selectedOptionalServices, setSelectedOptionalServices] = useState<string[]>([]);
  const [generatedAppNum, setGeneratedAppNum] = useState<string>('');

  const toggleOptionalService = (serviceId: string) => {
    setSelectedOptionalServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      studentName: fullName,
      phone,
      whatsapp: optInWhatsapp ? phone : undefined,
      email,
      countryDestination: destination,
      preferredUniversity: preferredUniversity || (destination === 'uk' ? 'University of Manchester' : destination === 'australia' ? 'University of Sydney' : 'University of Auckland'),
      studyLevel,
      preferredMajor: majorInterest,
      sponsorType: hasSponsorship === 'yes' ? 'مبتعث حكومي' : hasSponsorship === 'applying' ? 'متقدم لبرنامج ابتعاث' : 'نفقة خاصة',
      additionalNotes: `خدمات إضافية مختارة: ${selectedOptionalServices.join(', ') || 'لا يوجد'}. تلغرام: ${optInTelegram ? (telegramUsername || 'موافق') : 'غير محدد'}`,
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
      countryOfResidence: 'الخليج العربي',
      destination,
      universityName: preferredUniversity || (destination === 'uk' ? 'University of Manchester' : destination === 'australia' ? 'University of Sydney' : 'University of Auckland'),
      level: studyLevel,
      courseName: majorInterest,
      intake: 'سبتمبر 2026',
      status: 'under_review',
      submittedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      counselorId: 'c-1',
      counselorName: 'د. فيصل الشمري',
      counselorPhone: '+966 50 123 4567',
      portalPassword: Math.floor(100000 + Math.random() * 900000).toString(),
      scholarshipInterest: hasSponsorship === 'yes',
      documents: [
        { id: 'doc-pass', category: 'passport', nameAr: 'صورة جواز السفر', nameEn: 'Passport Copy', status: 'uploaded', fileName: 'passport.pdf', required: true },
        { id: 'doc-cert', category: 'transcript', nameAr: 'كشف الدرجات الأكاديمي', nameEn: 'Academic Transcript', status: 'uploaded', fileName: 'transcript.pdf', required: true },
      ],
      timeline: [
        { stage: 'submitted', titleAr: 'تم استلام الطلب', titleEn: 'Application Submitted', descriptionAr: 'تم تسجيل الطلب وتعيين مستشارك الخاص', descriptionEn: 'Application received', date: new Date().toISOString().split('T')[0], isCompleted: true, isCurrent: false },
        { stage: 'under_review', titleAr: 'تدقيق الأوراق والأهلية', titleEn: 'Document Verification', descriptionAr: 'جاري فحص المستندات بواسطة المستشار الأكاديمي', descriptionEn: 'Verifying certificates', date: new Date().toISOString().split('T')[0], isCompleted: true, isCurrent: true },
        { stage: 'sent_to_university', titleAr: 'التقديم للجامعة الشريكة', titleEn: 'Submitted to University', descriptionAr: 'تقديم الملف عبر البوابة الرسمية', descriptionEn: 'Application submission', isCompleted: false, isCurrent: false },
        { stage: 'conditional_offer', titleAr: 'صدور القبول المشروط المجاني', titleEn: 'Conditional Offer', descriptionAr: 'إصدار العرض خلال 3-5 أيام عمل', descriptionEn: 'Issuing offer letter', isCompleted: false, isCurrent: false },
      ],
      notes: [`الوجهة المفضلة: ${destination}`, `التخصص: ${majorInterest}`],
    };

    onSubmitSuccess(appNum, fullApp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className={`border rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-start overflow-hidden max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 left-5 p-2 rounded-full transition-colors ${
            isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'القبول الجامعي مجاني 100%' : '100% Free Placement'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              <span>{isAr ? 'بدون أتعاب وكالة' : 'Zero Agency Fees'}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            {step === 3 
              ? (isAr ? 'تم استلام طلبك بنجاح!' : 'Application Submitted!') 
              : (isAr ? 'طلب تأمين قبول جامعي رسمي ومجاني' : 'Apply for Official Admission')}
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {step === 3 
              ? (isAr ? 'تم إشعار إدارة القبولات والمستشار المختص للاستجابة الفورية لطلبك' : 'Admissions team notified for priority response') 
              : (isAr ? 'تأمين القبول مجاني بالكامل. والخدمات التجهيزية بعد القبول اختيارية حسب رغبتك.' : 'Academic placement is free. Logistical concierge services are optional.')}
          </p>
        </div>

        {/* Step 1: Study Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">
                {isAr ? '1. اختر دولة الدراسة:' : '1. Target Destination:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDestination('uk')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    destination === 'uk'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-lg">🇬🇧</span>
                  <span>{isAr ? 'بريطانيا' : 'UK'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDestination('australia')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    destination === 'australia'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-lg">🇦🇺</span>
                  <span>{isAr ? 'أستراليا' : 'Australia'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDestination('new_zealand')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    destination === 'new_zealand'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-lg">🇳🇿</span>
                  <span>{isAr ? 'نيوزيلندا' : 'New Zealand'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">
                {isAr ? '2. الدرجة العلمية المطلوبة:' : '2. Study Degree Level:'}
              </label>
              <select
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value as StudyLevel)}
                className={`w-full border rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="bachelor">{isAr ? 'بكالوريوس (Bachelor)' : 'Bachelor'}</option>
                <option value="master">{isAr ? 'ماجستير (Master)' : 'Master'}</option>
                <option value="foundation">{isAr ? 'سنة تأسيسية وتحضيرية (Foundation)' : 'Foundation'}</option>
                <option value="english_course">{isAr ? 'دورة لغة إنجليزية أكاديمية مكثفة' : 'English Course'}</option>
                <option value="phd">{isAr ? 'دكتوراه (PhD)' : 'PhD'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">
                {isAr ? '3. التخصص أو المجال المرغوب:' : '3. Intended Field of Study:'}
              </label>
              <input
                type="text"
                value={majorInterest}
                onChange={(e) => setMajorInterest(e.target.value)}
                placeholder={isAr ? 'مثال: الذكاء الاصطناعي، الأمن السيبراني، طب، إدارة أعمال...' : 'e.g. AI, Cyber Security, Medicine...'}
                className={`w-full border rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer mt-4 transition-transform active:scale-98"
            >
              <span>{isAr ? 'متابعة إلى بيانات التواصل وقنوات الرد' : 'Continue to Contact & Notification Channels'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Contact, Notification Channels & Optional Services */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">
                {isAr ? 'الاسم الكامل للطالب (كما في جواز السفر):' : 'Student Full Name (As in Passport):'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAr ? 'مثال: محمد بن عبد العزيز الدوسري' : 'e.g. Mohammed Al-Dossary'}
                  className={`w-full border rounded-xl py-2.5 pl-3 pr-9 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Official Email Field (Official response channel) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold">
                  {isAr ? 'البريد الإلكتروني الرسمي:' : 'Official Email Address:'}
                </label>
                <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {isAr ? 'القناة الرسمية المعتمدة للرد' : 'Official Response Channel'}
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className={`w-full border rounded-xl py-2.5 pl-3 pr-9 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {isAr ? '* سيصلك الرد الرسمي وقرارات الجامعة وخطابات القبول المعتمدة عبر هذا البريد.' : '* Official offer letters and official documentation will be delivered to this email.'}
              </div>
            </div>

            {/* Mobile / Phone Number */}
            <div>
              <label className="block text-xs font-bold mb-1.5">
                {isAr ? 'رقم الهاتف المتنقل (مع المفتاح الدولي):' : 'Mobile Number (with Country Code):'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 54 123 4567"
                  className={`w-full border rounded-xl py-2.5 pl-3 pr-9 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Client Notification Choices (Requirement 2) */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'تنبيهات إضافية سريعة باختيار العميل:' : 'Optional Instant Alert Channels:'}</span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={optInWhatsapp}
                    onChange={(e) => setOptInWhatsapp(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                  <span>
                    {isAr ? '💬 إرسال تنبيهات لحظية لحالة طلبي عبر الواتساب (WhatsApp)' : '💬 Send real-time updates via WhatsApp'}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={optInTelegram}
                    onChange={(e) => setOptInTelegram(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                  <span>
                    {isAr ? '✈️ إرسال تنبيهات فورية عبر بوت آفاق في التلغرام (Telegram)' : '✈️ Send instant alerts via Telegram Bot'}
                  </span>
                </label>

                {optInTelegram && (
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder={isAr ? 'اسم المستخدم في تلغرام (مثال: @username)' : 'Telegram username (e.g. @username)'}
                    className={`w-full border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Optional Post-Admission Concierge Services (Requirement 1) */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  {isAr ? 'تجهيزات ما بعد القبول (اختيارية ومأجورة لاحقاً):' : 'Post-Admission Services (Optional & Paid later):'}
                </span>
                <span className="text-[10px] text-amber-500 font-semibold">
                  {isAr ? 'الدفع بعد صدور القبول فقط' : 'Pay only after offer'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleOptionalService('visa')}
                  className={`p-2 rounded-xl border text-start transition-all flex items-center justify-between ${
                    selectedOptionalServices.includes('visa')
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="truncate">{isAr ? 'ملف التأشيرة الطلابية' : 'Student Visa'}</span>
                  {selectedOptionalServices.includes('visa') && <Check className="w-3 h-3 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => toggleOptionalService('accommodation')}
                  className={`p-2 rounded-xl border text-start transition-all flex items-center justify-between ${
                    selectedOptionalServices.includes('accommodation')
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="truncate">{isAr ? 'حجز السكن الجامعي' : 'Accommodation'}</span>
                  {selectedOptionalServices.includes('accommodation') && <Check className="w-3 h-3 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => toggleOptionalService('airport')}
                  className={`p-2 rounded-xl border text-start transition-all flex items-center justify-between ${
                    selectedOptionalServices.includes('airport')
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="truncate">{isAr ? 'استقبال المطار الفاخر' : 'Airport Pickup'}</span>
                  {selectedOptionalServices.includes('airport') && <Check className="w-3 h-3 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => toggleOptionalService('settlement')}
                  className={`p-2 rounded-xl border text-start transition-all flex items-center justify-between ${
                    selectedOptionalServices.includes('settlement')
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="truncate">{isAr ? 'فتح بنك وشريحة' : 'Bank & SIM'}</span>
                  {selectedOptionalServices.includes('settlement') && <Check className="w-3 h-3 text-amber-400" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-3 px-4 rounded-xl font-bold text-xs transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'رجوع' : 'Back'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer transition-transform active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري المعالجة والإرسال للإدارة...' : 'Processing & Dispatching...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'إرسال طلب القبول المجاني 100%' : 'Submit 100% Free Placement'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Confirmation & Manager Dispatch Notification */}
        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr ? 'الرقم المرجعي الموحد لطلبك المجاني:' : 'Your Free Application Reference Number:'}
              </div>
              <div className="text-3xl font-black font-mono text-amber-500 tracking-wider">
                {generatedAppNum}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs leading-relaxed text-start space-y-2 ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2 font-bold text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'الرد الرسمي المعتمد: تم توجيهه إلى بريدك الإلكتروني' : 'Official Response Dispatched to Your Email'}</span>
              </div>
              <p>
                {isAr 
                  ? `تم إرسال إشعار فوري لمدراء النظام في آفاق لتخصيص مستشارك الأكاديمي، وسيصلك الرد الرسمي المعتمد على البريد (${email}).`
                  : `Admissions managers have received your application alert. Official letters will arrive at (${email}).`}
              </p>
              {optInWhatsapp && (
                <div className="text-[11px] text-emerald-600 font-medium">
                  ✓ {isAr ? `تنبيهات الواتساب مفعلة على الرقم: ${phone}` : `WhatsApp alerts enabled for ${phone}`}
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToPortal) {
                    onNavigateToPortal();
                  }
                }}
                className="w-full py-3.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow transition-transform active:scale-98"
              >
                {isAr ? 'متابعة الطلب في بوابة الطالب ➔' : 'Continue to Student Portal ➔'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
