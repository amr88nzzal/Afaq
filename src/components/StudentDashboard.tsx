import React, { useState, useRef } from 'react';
import { Application, DocumentItem, Language, Theme, TimelineEvent } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  UploadCloud, 
  MessageSquare, 
  Send, 
  Bell, 
  Phone, 
  ShieldCheck, 
  FileCheck, 
  AlertCircle,
  ExternalLink,
  Download,
  Sparkles,
  Plane,
  GraduationCap,
  Building2,
  Check,
  Lock,
  LogIn,
  KeyRound,
  UserCheck,
  LogOut,
  RefreshCw,
  Mail,
  Copy,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Trash2,
  Eye,
  Plus,
  FileUp,
  X,
  CheckCircle,
  FileCheck2
} from 'lucide-react';
import { studentPortalLoginAPI } from '../services/api';

const DEFAULT_TIMELINE: TimelineEvent[] = [
  { stage: 'submitted', titleAr: 'تم استلام الطلب', titleEn: 'Application Submitted', descriptionAr: 'تم تسجيل الطلب وتعيين مستشارك الخاص', descriptionEn: 'Application received and advisor assigned', isCompleted: true, isCurrent: false },
  { stage: 'under_review', titleAr: 'تدقيق الأوراق والأهلية', titleEn: 'Document Verification', descriptionAr: 'جاري فحص الشهادات والوثائق من قبل المستشار المختص', descriptionEn: 'Verifying certificates against partner criteria', isCompleted: true, isCurrent: true },
  { stage: 'sent_to_university', titleAr: 'التقديم للجامعة الشريكة', titleEn: 'Submitted to University', descriptionAr: 'تقديم الملف الأكاديمي المعتمد', descriptionEn: 'Application submission to university', isCompleted: false, isCurrent: false },
  { stage: 'conditional_offer', titleAr: 'صدور القبول المشروط المجاني', titleEn: 'Conditional Offer', descriptionAr: 'إصدار العرض المشروط خلال 3-5 أيام عمل', descriptionEn: 'Issuing official offer letter', isCompleted: false, isCurrent: false },
  { stage: 'unconditional_offer', titleAr: 'القبول النهائي والـ CAS / CoE', titleEn: 'Final Offer & CAS / CoE', descriptionAr: 'تأكيد المقعد واستخراج رمز التأشيرة', descriptionEn: 'Seat confirmation and visa voucher', isCompleted: false, isCurrent: false },
  { stage: 'visa_processing', titleAr: 'معاملة تأشيرة الطالب وحجز السكن', titleEn: 'Student Visa & Housing', descriptionAr: 'تجهيز ملف السفارة وحجز السكن المعتمد', descriptionEn: 'Visa lodgement and student accommodation', isCompleted: false, isCurrent: false },
  { stage: 'approved_ready', titleAr: 'منح التأشيرة والاستعداد للسفر', titleEn: 'Visa Granted & Departure', descriptionAr: 'حجز استقبال المطار وبدء الدراسة الجامعية', descriptionEn: 'Flight departure briefing & welcome', isCompleted: false, isCurrent: false }
];

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { id: 'doc-pass', category: 'passport', nameAr: 'صورة جواز السفر (ساري المفعول)', nameEn: 'Valid Passport Copy', status: 'pending', required: true },
  { id: 'doc-cert', category: 'transcript', nameAr: 'كشف الدرجات والشهادة الأخيرة', nameEn: 'Academic Transcripts & Certificate', status: 'pending', required: true },
  { id: 'doc-lang', category: 'english_test', nameAr: 'شهادة اللغة (آيلتس / توفل إن وجدت)', nameEn: 'English Test Score (IELTS / PTE / Duolingo)', status: 'pending', required: false },
  { id: 'doc-fin', category: 'financial_guarantee', nameAr: 'الضمان المالي أو كشف الحساب البنكي', nameEn: 'Financial Guarantee / Bank Statement', status: 'pending', required: true },
];

interface StudentDashboardProps {
  lang: Language;
  theme?: Theme;
  application: Application | null;
  onUpdateDocument: (
    docId: string, 
    fileName: string, 
    extraData?: {
      fileSize?: string;
      fileUrl?: string;
      docType?: string;
      nameAr?: string;
      nameEn?: string;
    }
  ) => void;
  onDeleteDocument?: (docId: string) => void;
  onTriggerNotificationTest: (channel: 'whatsapp' | 'telegram' | 'email') => void;
  onLoginSuccess?: (app: Application) => void;
  onLogout?: () => void;
  onOpenApplyModal?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  lang,
  theme = 'dark',
  application,
  onUpdateDocument,
  onDeleteDocument,
  onTriggerNotificationTest,
  onLoginSuccess,
  onLogout,
  onOpenApplyModal,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // Login form state
  const [loginAppNumber, setLoginAppNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Notification settings state
  const [whatsappAlerts, setWhatsappAlerts] = useState<boolean>(true);
  const [telegramAlerts, setTelegramAlerts] = useState<boolean>(true);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [studentPhone, setStudentPhone] = useState<string>(application?.studentPhone || '');
  const [telegramUser, setTelegramUser] = useState<string>('@m_student');

  // Real upload state and feedback
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);

  // Add custom extra document modal state
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState<boolean>(false);
  const [newDocNameAr, setNewDocNameAr] = useState<string>('');
  const [newDocNameEn, setNewDocNameEn] = useState<string>('');
  const [newDocCategory, setNewDocCategory] = useState<string>('other');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isSubmittingNewDoc, setIsSubmittingNewDoc] = useState<boolean>(false);

  // Preview document modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: 'student' | 'counselor'; text: string; time: string }[]>([
    {
      id: 'm1',
      sender: 'counselor',
      text: isAr ? 'أهلاً بك، تم استلام ملفك الأكاديمي وجاري تدقيقه للتواصل مع الجامعة الشريكة وإصدار القبول المشروط مجاناً 100%.' : 'Welcome! Your academic file has been received and is being verified for free conditional offer issuance.',
      time: '10:30 ص',
    },
  ]);
  const [newMsg, setNewMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAppNumber.trim() || !loginPassword.trim()) {
      setLoginError(isAr ? 'يرجى كتابة رقم الطلب وكلمة المرور' : 'Please enter application number and password');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    const res = await studentPortalLoginAPI(loginAppNumber, loginPassword);
    setLoginLoading(false);

    if (res.success && res.data) {
      if (onLoginSuccess) {
        onLoginSuccess(res.data);
      }
    } else {
      setLoginError(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
    }
  };

  const handleQuickDemoLogin = async (appNum: string, pass: string) => {
    setLoginAppNumber(appNum);
    setLoginPassword(pass);
    setLoginLoading(true);
    setLoginError('');

    const res = await studentPortalLoginAPI(appNum, pass);
    setLoginLoading(false);

    if (res.success && res.data) {
      if (onLoginSuccess) {
        onLoginSuccess(res.data);
      }
    } else {
      setLoginError(res.error || (isAr ? 'تعذر تسجيل الدخول بالطلب التجريبي' : 'Failed demo login'));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const msgObj = {
      id: Date.now().toString(),
      sender: 'student' as const,
      text: newMsg,
      time: isAr ? 'الآن' : 'Just now',
    };

    setChatMessages(prev => [...prev, msgObj]);
    setNewMsg('');

    // Counselor prompt response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'counselor',
          text: isAr 
            ? 'تم استلام استفسارك، وسيقوم مستشارك الأكاديمي المختص بمراجعته وتحديث ملفك فوراً.'
            : 'Message received, your dedicated academic counselor will review and update your file shortly.',
          time: isAr ? 'الآن' : 'Just now',
        }
      ]);
    }, 1000);
  };

  // Maximum file size: 5 MB in bytes
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];

  const validateAndUploadFile = (
    docId: string, 
    file: File, 
    meta?: { nameAr?: string; nameEn?: string; docType?: string }
  ) => {
    setUploadError(null);

    // 1. Validate File Extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setUploadError(
        isAr 
          ? `صيغة الملف (.${fileExt}) غير مقبولة. الصيغ المسموحة هي: PDF, DOC, DOCX, JPG, JPEG, PNG`
          : `File format (.${fileExt}) is not supported. Allowed formats: PDF, DOC, DOCX, JPG, JPEG, PNG`
      );
      return false;
    }

    // 2. Validate File Size (Maximum 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(
        isAr
          ? `حجم الملف (${sizeMB} ميغابايت) يتجاوز الحد الأقصى المسموح (5 ميغابايت). يرجى ضغط أو تقليل حجم الملف واختيار ملف أقل من 5 ميغا.`
          : `File size (${sizeMB} MB) exceeds the maximum allowed limit of 5 MB. Please select a file under 5 MB.`
      );
      return false;
    }

    // 3. Read File as Data URL for instant preview/download and upload
    setUploadingDocId(docId);
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      const formattedSize = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      onUpdateDocument(docId, file.name, {
        fileSize: formattedSize,
        fileUrl,
        docType: meta?.docType,
        nameAr: meta?.nameAr,
        nameEn: meta?.nameEn,
      });

      setUploadingDocId(null);
      setUploadSuccess(
        isAr 
          ? `تم رفع الملف "${file.name}" بنجاح (${formattedSize}) وجاري التدقيق الأكاديمي!`
          : `File "${file.name}" (${formattedSize}) uploaded successfully!`
      );
      setTimeout(() => setUploadSuccess(null), 4000);
    };

    reader.onerror = () => {
      setUploadingDocId(null);
      setUploadError(isAr ? 'حدث خطأ أثناء قراءة الملف، يرجى المحاولة مجدداً' : 'Error reading file, please try again');
    };

    reader.readAsDataURL(file);
    return true;
  };

  const handleDeleteDoc = (docId: string, docName: string) => {
    if (window.confirm(isAr ? `هل تريد بالتأكيد إزالة ملف "${docName}"؟` : `Are you sure you want to remove "${docName}"?`)) {
      if (onDeleteDocument) {
        onDeleteDocument(docId);
      } else {
        onUpdateDocument(docId, '', { fileSize: undefined, fileUrl: undefined });
      }
      setUploadSuccess(isAr ? 'تم حذف الملف بنجاح، يمكنك رفع ملف جديد الآن.' : 'File removed. You can upload a new file now.');
      setTimeout(() => setUploadSuccess(null), 3500);
    }
  };

  const handleDownloadOrView = (doc: DocumentItem) => {
    if (doc.file_url && doc.file_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.fileName || `${doc.nameEn || 'document'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setPreviewDoc(doc);
    }
  };

  const handleCreateCustomDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile) {
      setUploadError(isAr ? 'يرجى اختيار الملف المراد رفعه (بحد أقصى 5 ميغا)' : 'Please select a file to upload (max 5MB)');
      return;
    }
    if (!newDocNameAr.trim()) {
      setUploadError(isAr ? 'يرجى كتابة اسم أو وصف الوثيقة' : 'Please provide document title');
      return;
    }

    setIsSubmittingNewDoc(true);
    const customDocId = `doc-custom-${Date.now()}`;
    const ok = validateAndUploadFile(customDocId, newDocFile, {
      nameAr: newDocNameAr.trim(),
      nameEn: newDocNameEn.trim() || newDocNameAr.trim(),
      docType: newDocCategory,
    });

    setIsSubmittingNewDoc(false);
    if (ok !== false) {
      setIsAddDocModalOpen(false);
      setNewDocNameAr('');
      setNewDocNameEn('');
      setNewDocCategory('other');
      setNewDocFile(null);
    }
  };

  const copyApplicationNumber = () => {
    if (application?.applicationNumber) {
      navigator.clipboard.writeText(application.applicationNumber);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // =========================================================================
  // VIEW: IF NOT LOGGED IN / NO APPLICATION LOADED -> SHOW STUDENT LOGIN GATE
  // =========================================================================
  if (!application) {
    return (
      <div className={`py-12 sm:py-16 min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="max-w-md mx-auto px-4 text-start">
          
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-6">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="space-y-1 mb-6">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                {isAr ? 'بوابة الطالب المخصصة' : 'Dedicated Student Portal'}
              </span>
              <h2 className="text-2xl font-black">
                {isAr ? 'تسجيل دخول متابعة الطلب' : 'Track Your Application'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isAr 
                  ? 'أدخل رقم الطلب وكلمة المرور الخاصة بك والمُرسلة إلى بريدك الإلكتروني عند التقديم.'
                  : 'Enter your application number and portal password sent to your email.'}
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">
                  {isAr ? 'رقم الطلب أو البريد الإلكتروني:' : 'Application Number or Email:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: AFQ-2026-1048' : 'e.g. AFQ-2026-1048'}
                    value={loginAppNumber}
                    onChange={(e) => setLoginAppNumber(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl text-xs font-mono border focus:outline-none focus:border-amber-500 transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <FileText className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold block">
                    {isAr ? 'كلمة المرور الخاصة بالطلب:' : 'Portal Password:'}
                  </label>
                  <span className="text-[10px] text-amber-500 font-medium">
                    {isAr ? 'مرسلة عبر الإيميل' : 'Sent to email'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl text-xs font-mono border focus:outline-none focus:border-amber-500 transition-colors ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري التحقق والربط...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isAr ? 'دخول إلى بوابة طلبي الأكاديمي' : 'Access My Application'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Box for Testing */}
            <div className={`mt-6 pt-5 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="text-[11px] font-bold text-slate-400">
                {isAr ? 'تجربة سريعة (طلب تجريبي جاهز ومسجل في النظام):' : 'Quick Demo Access (Registered Application):'}
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('AFQ-2026-8812', '123456')}
                className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                  isDark ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="font-bold text-amber-500">AFQ-2026-8812</span>
                  <span className="text-slate-400">|</span>
                  <span>{isAr ? 'عبدالرحمن العتيبي' : 'Abdulrahman Al-Otaibi'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-500">{isAr ? 'دخول مباشر ➔' : 'Quick Access ➔'}</span>
              </button>
            </div>

            {/* If no application submitted yet */}
            {onOpenApplyModal && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={onOpenApplyModal}
                  className="text-xs text-amber-500 hover:underline font-bold"
                >
                  {isAr ? 'لم تقدم طلباً بعد؟ قدم طلب القبول المجاني 100% الآن' : "Haven't applied yet? Submit a free application now"}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // Safe Fallback Arrays to prevent any TypeError
  const timeline: TimelineEvent[] = (application.timeline && application.timeline.length > 0)
    ? application.timeline
    : DEFAULT_TIMELINE;

  const documents: DocumentItem[] = (application.documents && application.documents.length > 0)
    ? application.documents
    : DEFAULT_DOCUMENTS;

  const currentStageIndex = timeline.findIndex(t => t.isCurrent);
  const displayStageNumber = currentStageIndex >= 0 ? currentStageIndex + 1 : 2;

  // =========================================================================
  // VIEW: LOGGED IN STUDENT DASHBOARD
  // =========================================================================
  return (
    <div className={`py-8 sm:py-12 min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Status Header */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden text-start ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={copyApplicationNumber}
                  title="نسخ رقم الطلب"
                  className="font-mono text-xs font-black text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{application.applicationNumber}</span>
                  <Copy className="w-3 h-3 text-amber-500" />
                  {copiedId && <span className="text-[10px] text-emerald-500 font-sans">{isAr ? 'تم النسخ!' : 'Copied!'}</span>}
                </button>

                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {isAr ? '✓ القبول الأكاديمي: مجاني 100%' : '100% Free Placement'}
                </span>

                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                  {application.destination === 'uk' ? '🇬🇧 المملكة المتحدة' : application.destination === 'australia' ? '🇦🇺 أستراليا' : '🇳🇿 نيوزيلندا'}
                </span>

                {application.portalPassword && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    🔑 {isAr ? `رمز الدخول: ${application.portalPassword}` : `Pass: ${application.portalPassword}`}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black">
                {application.universityName || 'الجامعة الشريكة'}
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {application.courseName || 'التخصص العام'} | {isAr ? `فصل الالتحاق: ${application.intake || 'سبتمبر 2026'}` : `Intake: ${application.intake || 'September 2026'}`}
                {application.studentName && <span className="mr-2 font-bold text-amber-500">({application.studentName})</span>}
              </p>
            </div>

            {/* Actions: Live Test Notification + Switch Account */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => onTriggerNotificationTest('whatsapp')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow cursor-pointer transition-all"
                title="Send test WhatsApp alert"
              >
                <span>💬</span>
                <span>{isAr ? 'تنبيه واتساب' : 'WhatsApp'}</span>
              </button>

              <button 
                onClick={() => onTriggerNotificationTest('email')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow cursor-pointer transition-all"
                title="Send test Email alert"
              >
                <span>📧</span>
                <span>{isAr ? 'بريد رسمي' : 'Email'}</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="تسجيل الخروج من البوابة ومتابعة طلب آخر"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تبديل الطلب' : 'Switch'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 7-Stage Admission Progress Roadmap */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl text-start ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>{isAr ? 'مسار تتبع حالة القبول والتأشيرة (المراحل السبعة):' : 'Application & Visa Milestone Tracker:'}</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr ? 'يتم تحديث كل مرحلة لحظياً من قبل فريق القبولات والمستشار المختص' : 'Real-time progression monitored by your admissions team'}
              </p>
            </div>
            <span className="text-xs font-black text-amber-500">
              {isAr ? `المرحلة ${displayStageNumber} من 7` : `Stage ${displayStageNumber} of 7`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {timeline.map((event, idx) => {
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border relative flex flex-col justify-between transition-all ${
                    event.isCurrent
                      ? 'bg-amber-500/15 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                      : event.isCompleted
                      ? isDark ? 'bg-slate-800/80 border-emerald-500/40 text-slate-200' : 'bg-emerald-50 border-emerald-300 text-slate-800'
                      : isDark ? 'bg-slate-950/60 border-slate-800/80 opacity-60 text-slate-400' : 'bg-slate-100 border-slate-200 opacity-60 text-slate-400'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        event.isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : event.isCompleted
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {event.isCompleted ? '✓' : idx + 1}
                      </span>
                      {event.isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                          {isAr ? 'قيد الإجراء' : 'Active'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold pt-1">
                      {isAr ? event.titleAr : event.titleEn}
                    </div>

                    <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isAr ? event.descriptionAr : event.descriptionEn}
                    </p>
                  </div>

                  {event.date && (
                    <div className="mt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/40 pt-1">
                      {event.date}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Grid: Documents Vault (7 cols) + Counselor & Alerts (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Documents Vault (7 cols) */}
          <div className={`lg:col-span-7 rounded-3xl p-6 shadow-xl space-y-6 text-start border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>{isAr ? 'خزنة وثائق القبول والشهادات المعتمدة' : 'Official Academic Document Vault'}</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAr 
                    ? 'ارفع شهاداتك وأوراقك بصيغ (PDF, DOC, DOCX, JPG, PNG) بحجم أقصى 5 ميغابايت لكل ملف'
                    : 'Upload your documents (PDF, DOC, DOCX, JPG, PNG) up to 5MB per file'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إضافة وثيقة أخرى' : 'Add Document'}</span>
                </button>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 hidden sm:inline-block">
                  {isAr ? 'مشفر 256-bit' : 'Encrypted'}
                </span>
              </div>
            </div>

            {/* Upload Specs and Guidance Notice */}
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
              isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-amber-50/50 border-amber-200 text-slate-700'
            }`}>
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-500">
                  {isAr ? 'شروط ومعايير الملفات المقبولة للجامعات:' : 'Accepted Document Standards & Criteria:'}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  {isAr ? (
                    <span>
                      • الصيغ المدعومة: <strong className="text-amber-400 font-mono">PDF, DOC, DOCX, JPG, JPEG, PNG</strong>
                      <br />
                      • الحد الأقصى لحجم الملف الواحد: <strong className="text-amber-400 font-mono">5 ميغابايت (5MB)</strong>
                      <br />
                      • يمكنك سحب وإفلات الملف مباشرة على الخانة أو النقر على "رفع الملف".
                    </span>
                  ) : (
                    <span>
                      • Supported formats: <strong className="text-amber-400 font-mono">PDF, DOC, DOCX, JPG, JPEG, PNG</strong>
                      <br />
                      • Maximum size per file: <strong className="text-amber-400 font-mono">5 Megabytes (5MB)</strong>
                      <br />
                      • Drag & drop any file directly onto the card or click "Upload File".
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message Banner */}
            {uploadError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setUploadError(null)} 
                  className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Message Banner */}
            {uploadSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setUploadSuccess(null)} 
                  className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Documents List */}
            <div className="space-y-3">
              {documents.map((doc) => {
                const isUploaded = !!doc.fileName || (!!doc.file_url && doc.file_url !== 'null') || doc.status === 'uploaded' || doc.status === 'verified';
                const isUploading = uploadingDocId === doc.id;
                const isDragOver = dragOverDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverDocId(doc.id);
                    }}
                    onDragLeave={() => setDragOverDocId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverDocId(null);
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        validateAndUploadFile(doc.id, files[0], {
                          nameAr: doc.nameAr,
                          nameEn: doc.nameEn,
                          docType: doc.category,
                        });
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDragOver
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-400/30'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      id={`file-input-${doc.id}`}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          validateAndUploadFile(doc.id, file, {
                            nameAr: doc.nameAr,
                            nameEn: doc.nameEn,
                            docType: doc.category,
                          });
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                        doc.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isUploaded
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {doc.status === 'verified' ? (
                          <FileCheck2 className="w-5 h-5 text-emerald-400" />
                        ) : isUploaded ? (
                          <FileCheck className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                          <span>{isAr ? doc.nameAr : doc.nameEn}</span>
                          {doc.required && (
                            <span className="text-[10px] text-amber-500 font-semibold">
                              ({isAr ? 'إلزامي' : 'Mandatory'})
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono flex items-center gap-2 flex-wrap">
                          {isUploaded ? (
                            <>
                              <span className="text-emerald-400 font-semibold">{doc.fileName}</span>
                              {doc.fileSize && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                                  {doc.fileSize}
                                </span>
                              )}
                              {doc.uploadedAt && (
                                <span className="text-[10px] text-slate-400">
                                  {doc.uploadedAt}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">
                              {isAr ? 'لم يتم الرفع بعد (الحد الأقصى 5MB)' : 'Not uploaded yet (Max 5MB)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        doc.status === 'verified'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : isUploaded
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {doc.status === 'verified' 
                          ? (isAr ? 'معتمد رسمياً' : 'Verified') 
                          : isUploaded 
                          ? (isAr ? 'تم الرفع' : 'Uploaded') 
                          : (isAr ? 'مطلوب الرفع' : 'Required')}
                      </span>

                      {/* If Uploaded: Preview/Download, Replace, Delete */}
                      {isUploaded ? (
                        <div className="flex items-center gap-1.5">
                          {/* Preview / Download */}
                          <button
                            type="button"
                            onClick={() => handleDownloadOrView(doc)}
                            title={isAr ? 'معاينة / تنزيل الملف' : 'Preview / Download'}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Replace File Button */}
                          <label
                            htmlFor={`file-input-${doc.id}`}
                            title={isAr ? 'استبدال الملف الحالي' : 'Replace file'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {isUploading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )}
                            <span>{isAr ? 'استبدال' : 'Replace'}</span>
                          </label>

                          {/* Delete File Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.fileName || doc.nameAr)}
                            title={isAr ? 'حذف الملف' : 'Delete file'}
                            className="p-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        /* If Pending: Upload Button */
                        <label
                          htmlFor={`file-input-${doc.id}`}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                            isUploading
                              ? 'bg-amber-500/50 cursor-not-allowed text-slate-900'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:scale-[1.02]'
                          }`}
                        >
                          {isUploading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileUp className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع الملف' : 'Upload File')}</span>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official Offer Letter Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'عرض القبول الجامعي المشروط (Offer Letter):' : 'Official University Offer Letter:'}</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isAr ? 'تم استخراج القبول المشروط بدون رسوم، يمكنك تحميل النسخة المعتمدة.' : 'Conditional admission issued free of charge.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert(isAr ? 'جاري تحميل ملف القبول الأكاديمي المعتمد من عمادة الجامعة...' : 'Downloading authenticated university acceptance letter...');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحميل العرض PDF' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Counselor & Communication & Live Notification Settings (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-start">
            
            {/* Counselor Direct Contact Card */}
            <div className={`rounded-3xl p-6 shadow-xl space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                  {isAr ? 'المستشار الأكاديمي المباشر لملفك' : 'Your Dedicated Academic Counselor'}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-base shadow">
                  {application.counselorName ? application.counselorName.slice(0, 2) : 'آفاق'}
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {application.counselorName || 'د. فيصل الشمري'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'مستشار قبولات بريطانيا وأستراليا المعتمد' : 'Certified UK & Australia Placement Advisor'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href={`https://wa.me/966501234567?text=${encodeURIComponent(isAr ? `السلام عليكم دكتور فيصل، بخصوص طلبي رقم ${application.applicationNumber}` : `Hello, regarding my application ${application.applicationNumber}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>💬</span>
                  <span>{isAr ? 'واتساب المستشار' : 'WhatsApp'}</span>
                </a>
                <a
                  href={`tel:${application.counselorPhone || '+966501234567'}`}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isAr ? 'اتصال مباشر' : 'Call'}</span>
                </a>
              </div>
            </div>

            {/* Notification Channels Settings */}
            <div className={`rounded-3xl p-6 shadow-xl space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="border-b border-slate-800/40 pb-3">
                <h4 className="text-xs font-bold flex items-center gap-2 text-amber-500">
                  <Bell className="w-4 h-4" />
                  <span>{isAr ? 'قنوات استلام إشعارات القبول والتحديثات:' : 'Notification Channels:'}</span>
                </h4>
              </div>

              <div className="space-y-3">
                {/* Email channel (Always on) */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>✉️</span>
                      <span>{isAr ? 'البريد الإلكتروني الرسمي (معتمد دائماً)' : 'Official Email (Always Active)'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{application.studentEmail}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    {isAr ? 'أساسي' : 'Primary'}
                  </span>
                </div>

                {/* WhatsApp toggle */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>💬</span>
                      <span>{isAr ? 'تنبيهات الواتساب اللحظية' : 'WhatsApp Real-Time Alerts'}</span>
                    </div>
                    <input 
                      type="text"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className={`border rounded px-2 py-0.5 text-[11px] text-emerald-500 font-mono w-40 ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={whatsappAlerts} 
                      onChange={() => setWhatsappAlerts(!whatsappAlerts)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Telegram toggle */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>✈️</span>
                      <span>{isAr ? 'بوت التلغرام الآلي الفوري' : 'Automated Telegram Bot'}</span>
                    </div>
                    <input 
                      type="text"
                      value={telegramUser}
                      onChange={(e) => setTelegramUser(e.target.value)}
                      className={`border rounded px-2 py-0.5 text-[11px] text-sky-500 font-mono w-40 ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={telegramAlerts} 
                      onChange={() => setTelegramAlerts(!telegramAlerts)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* In-Portal Messenger Box */}
            <div className={`rounded-3xl p-5 shadow-xl space-y-3 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-2 border-b border-slate-800/40 pb-2 text-amber-500">
                <MessageSquare className="w-4 h-4" />
                <span>{isAr ? 'محادثة سريعة مع المستشار داخل البوابة:' : 'Direct In-Portal Counselor Chat:'}</span>
              </h4>

              {/* Chat thread */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                      msg.sender === 'student' 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 mr-auto text-start' 
                        : isDark ? 'bg-slate-800 text-slate-200 border border-slate-700 ml-auto text-start' : 'bg-slate-100 text-slate-800 border border-slate-200 ml-auto text-start'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 mb-0.5 font-semibold">
                      {msg.sender === 'student' ? (isAr ? 'أنت' : 'You') : application.counselorName} • {msg.time}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800/40">
                <input
                  type="text"
                  placeholder={isAr ? 'اكتب استفسارك هنا...' : 'Type message here...'}
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: ADD EXTRA DOCUMENT */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 text-start ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {isAr ? 'رفع وثيقة أو شهادة إضافية' : 'Upload Additional Document'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'صيغ (PDF, DOC, DOCX, JPG, PNG) - حد أقصى 5 ميغابايت' : 'PDF, DOC, DOCX, JPG, PNG - Max 5MB'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddDocModalOpen(false);
                  setNewDocFile(null);
                  setNewDocNameAr('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomDocSubmit} className="space-y-4">
              {/* Document Category */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-300">
                  {isAr ? 'نوع الوثيقة' : 'Document Type'}
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="recommendation">{isAr ? 'خطاب توصية أكاديمية (Recommendation Letter)' : 'Academic Recommendation'}</option>
                  <option value="transcript">{isAr ? 'كشف درجات إضافي / شهادة دبلوم' : 'Additional Transcript / Diploma'}</option>
                  <option value="sop">{isAr ? 'السيرة الذاتية أو خطاب الدافع (CV / SOP)' : 'Resume / CV / SOP'}</option>
                  <option value="financial">{isAr ? 'إفادة ابتعاث أو ضمان مالي جديد' : 'Financial Guarantee / Sponsorship'}</option>
                  <option value="other">{isAr ? 'شهادة دورة / خبرة عملية / مستند آخر' : 'Experience / Certificate / Other'}</option>
                </select>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-300">
                  {isAr ? 'اسم أو وصف المستند *' : 'Document Name / Description *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: خطاب التوصية من الدكتور أحمد، السيرة الذاتية...' : 'e.g., Recommendation Letter from Dean, Resume...'}
                  value={newDocNameAr}
                  onChange={(e) => {
                    setNewDocNameAr(e.target.value);
                    if (!newDocNameEn) setNewDocNameEn(e.target.value);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* File Dropzone / Selector */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-300">
                  {isAr ? 'اختيار الملف (بحد أقصى 5MB) *' : 'Choose File (Max 5MB) *'}
                </label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    newDocFile
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isDark ? 'border-slate-700 bg-slate-950/40 hover:border-amber-500' : 'border-slate-300 bg-slate-50 hover:border-amber-500'
                  }`}
                >
                  <input
                    type="file"
                    id="new-custom-doc-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > MAX_FILE_SIZE_BYTES) {
                          setUploadError(isAr ? 'حجم الملف يتجاوز 5 ميغابايت' : 'File size exceeds 5MB');
                          return;
                        }
                        setNewDocFile(f);
                        if (!newDocNameAr) {
                          setNewDocNameAr(f.name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="new-custom-doc-input" className="cursor-pointer block space-y-2">
                    <UploadCloud className="w-8 h-8 text-amber-500 mx-auto" />
                    {newDocFile ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-emerald-400">{newDocFile.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {(newDocFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                        <span className="text-[10px] text-amber-400 underline">{isAr ? 'تغيير الملف' : 'Change file'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-300">
                          {isAr ? 'انقر لاختيار الملف من جهازك أو اسحبه إلى هنا' : 'Click to select file or drag & drop'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newDocFile || isSubmittingNewDoc}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                    !newDocFile || isSubmittingNewDoc
                      ? 'bg-amber-500/50 text-slate-900 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg'
                  }`}
                >
                  {isSubmittingNewDoc && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAr ? 'تأكيد ورفع الوثيقة' : 'Confirm & Upload'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5 text-start ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {isAr ? previewDoc.nameAr : previewDoc.nameEn}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {previewDoc.fileName || (isAr ? 'وثيقة مرفوعة' : 'Uploaded document')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'حالة الاعتماد:' : 'Verification Status:'}</span>
                  <span className="font-bold text-emerald-400">
                    {previewDoc.status === 'verified' 
                      ? (isAr ? 'معتمد رسمياً للتقديم الجامعي' : 'Officially Verified') 
                      : (isAr ? 'تم الرفع وقيد المراجعة الأكاديمية' : 'Uploaded - Under Counselor Review')}
                  </span>
                </div>
                {previewDoc.fileSize && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'حجم الملف:' : 'File Size:'}</span>
                    <span className="font-mono text-slate-200">{previewDoc.fileSize}</span>
                  </div>
                )}
                {previewDoc.uploadedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'تاريخ الرفع:' : 'Uploaded At:'}</span>
                    <span className="font-mono text-slate-200">{previewDoc.uploadedAt}</span>
                  </div>
                )}
              </div>

              {previewDoc.file_url && previewDoc.file_url.startsWith('data:image') && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-60 flex items-center justify-center bg-black/40">
                  <img src={previewDoc.file_url} alt={previewDoc.fileName} className="max-h-60 object-contain" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              {previewDoc.file_url ? (
                <a
                  href={previewDoc.file_url}
                  download={previewDoc.fileName || 'document.pdf'}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحميل الملف إلى جهازك' : 'Download File'}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
