import React, { useState } from 'react';
import { Application, DocumentItem, Language, Theme } from '../types';
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
  Check
} from 'lucide-react';

interface StudentDashboardProps {
  lang: Language;
  theme?: Theme;
  application: Application;
  onUpdateDocument: (docId: string, fileName: string) => void;
  onTriggerNotificationTest: (channel: 'whatsapp' | 'telegram' | 'email') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  lang,
  theme = 'dark',
  application,
  onUpdateDocument,
  onTriggerNotificationTest,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // Notification settings state (Official email always on, client can toggle WhatsApp / Telegram)
  const [whatsappAlerts, setWhatsappAlerts] = useState<boolean>(true);
  const [telegramAlerts, setTelegramAlerts] = useState<boolean>(true);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [studentPhone, setStudentPhone] = useState<string>(application.studentPhone);
  const [telegramUser, setTelegramUser] = useState<string>('@m_dossary');

  // Interactive upload state
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: 'student' | 'counselor'; text: string; time: string }[]>([
    {
      id: 'm1',
      sender: 'counselor',
      text: 'أهلاً بك محمد، صدر عرض القبول المشروط من جامعة مانشستر البريطانية مجاناً وبدون أي رسوم! يرجى إرفاق الضمان المالي أو كشف الحساب البنكي ليتم إصدار الـ CAS وبدء إجراءات الفيزا.',
      time: '10:30 ص',
    },
    {
      id: 'm2',
      sender: 'student',
      text: 'شكراً أ. عبد الرحمن، قمت برفع خطاب الضمان المالي البنكي الآن في قائمة الوثائق، أرجو مراجعته.',
      time: '11:15 ص',
    },
    {
      id: 'm3',
      sender: 'counselor',
      text: 'ممتاز جداً! تم استلامه وتدقيقه، وسنرسل لك الرد الرسمي وتحديثات الـ CAS فور صدورها من الجامعة.',
      time: '11:45 ص',
    }
  ]);
  const [newMsg, setNewMsg] = useState<string>('');

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

    // Counselor simulated prompt response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'counselor',
          text: isAr ? 'تم استلام رسالتك، وسيقوم مستشارك بمتابعتها فوراً وإرسال إشعار لك عبر الواتساب والبريد الرسمي.' : 'Message received, counselor will reply shortly.',
          time: isAr ? 'الآن' : 'Just now',
        }
      ]);
    }, 1200);
  };

  const handleSimulatedFileUpload = (docId: string) => {
    setUploadingDocId(docId);
    setTimeout(() => {
      const demoNames: Record<string, string> = {
        'doc-1': 'Passport_Scan_Mohammed.pdf',
        'doc-2': 'HighSchool_Transcript_Attested.pdf',
        'doc-3': 'IELTS_Academic_6.5_Certificate.pdf',
        'doc-4': 'Bank_Financial_Guarantee_2026.pdf',
        'doc-5': 'SOP_Personal_Statement_Afaq.pdf',
      };
      const name = demoNames[docId] || 'Document_Verified.pdf';
      onUpdateDocument(docId, name);
      setUploadingDocId(null);
    }, 1000);
  };

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
                <span className="font-mono text-xs font-black text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {application.applicationNumber}
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {isAr ? '✓ القبول الأكاديمي: مجاني 100%' : '100% Free Placement'}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                  🇬🇧 {isAr ? 'المملكة المتحدة' : 'United Kingdom'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black">
                {application.universityName}
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {application.courseName} | {isAr ? `فصل الالتحاق: ${application.intake}` : `Intake: ${application.intake}`}
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button 
                onClick={() => onTriggerNotificationTest('email')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow cursor-pointer transition-all"
                title="Send test Official Email alert"
              >
                <span>✉️</span>
                <span>{isAr ? 'الرد الرسمي بالبريد' : 'Official Email'}</span>
              </button>
              <button 
                onClick={() => onTriggerNotificationTest('whatsapp')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow cursor-pointer transition-all"
                title="Send test WhatsApp alert"
              >
                <span>💬</span>
                <span>{isAr ? 'تنبيه واتساب' : 'WhatsApp Alert'}</span>
              </button>
              <button 
                onClick={() => onTriggerNotificationTest('telegram')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow cursor-pointer transition-all"
                title="Send test Telegram alert"
              >
                <span>✈️</span>
                <span>{isAr ? 'تنبيه تلغرام' : 'Telegram Alert'}</span>
              </button>
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
              {isAr ? 'المرحلة 4 من 7' : 'Stage 4 of 7'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {application.timeline.map((event, idx) => {
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
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>{isAr ? 'محفظة الوثائق والشهادات الأكاديمية:' : 'Document & Credentials Vault:'}</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAr ? 'ارفع أوراقك بصيغة PDF أو صور واضحة لتدقيقها وتقديمها للجامعة' : 'Upload your official academic files for university lodgement'}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {application.documents.filter(d => d.status === 'verified').length} / {application.documents.length} {isAr ? 'معتمد' : 'Verified'}
              </span>
            </div>

            <div className="space-y-3">
              {application.documents.map((doc) => (
                <div 
                  key={doc.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {isAr ? doc.nameAr : doc.nameEn}
                      </span>
                      {doc.required && (
                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                          {isAr ? 'إلزامي' : 'Required'}
                        </span>
                      )}
                    </div>
                    
                    {doc.fileName ? (
                      <div className="text-[11px] text-emerald-500 flex items-center gap-2 font-mono">
                        <span>📄 {doc.fileName}</span>
                        {doc.uploadedAt && <span className="text-slate-400">({doc.uploadedAt})</span>}
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-500/80">
                        {isAr ? 'لم يتم رفع المستند بعد' : 'Not yet uploaded'}
                      </div>
                    )}

                    {doc.rejectionReason && (
                      <div className="text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{doc.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Status & Upload button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.status === 'verified' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'معتمد' : 'Verified'}</span>
                      </span>
                    )}

                    {doc.status === 'uploaded' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isAr ? 'قيد المراجعة' : 'Under Review'}</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleSimulatedFileUpload(doc.id)}
                      disabled={uploadingDocId === doc.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>
                        {uploadingDocId === doc.id 
                          ? (isAr ? 'جاري الرفع...' : 'Uploading...') 
                          : doc.fileName ? (isAr ? 'استبدال' : 'Replace') : (isAr ? 'رفع الملف' : 'Upload')}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Offer Letter Download Box */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isDark ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30' : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="space-y-1">
                <div className="text-xs font-bold flex items-center gap-2 text-amber-500">
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAr ? 'خطاب القبول المشروط الصادر (Official Offer Letter)' : 'Official Conditional Offer Letter'}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isAr ? 'تم استلامه رسمياً من جامعة مانشستر البريطانية بتاريخ 11 سبتمبر 2026' : 'Issued by University of Manchester on Sep 11, 2026'}
                </p>
              </div>
              <button 
                onClick={() => alert(isAr ? 'جاري تحميل نسخة العرض الأكاديمي الرسمي بصيغة PDF...' : 'Downloading offer letter PDF...')}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Counselor Card, Notification Channels & Messenger (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-start">
            
            {/* Counselor Contact Card */}
            <div className={`rounded-3xl p-6 shadow-xl space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                <span className="text-xs font-bold text-amber-500">
                  {isAr ? 'المستشار التعليمي المخصص لطلبك:' : 'Assigned Personal Counselor:'}
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">
                  {isAr ? 'متصل الآن' : 'Online'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-lg">
                  {application.counselorName.slice(0, 1)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {application.counselorName}
                  </h4>
                  <div className="text-xs text-slate-400">
                    {application.counselorRole}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/40 text-xs">
                <a 
                  href="https://wa.me/966541234567" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>💬</span>
                  <span>{isAr ? 'محادثة واتساب' : 'WhatsApp'}</span>
                </a>
                <a 
                  href="tel:+966541234567" 
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'اتصال هاتفي' : 'Call'}</span>
                </a>
              </div>
            </div>

            {/* Notification Channels Preferences (Requirement 2) */}
            <div className={`rounded-3xl p-6 shadow-xl space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="border-b border-slate-800/40 pb-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-amber-500">
                    <Bell className="w-4 h-4" />
                    <span>{isAr ? 'قنوات استلام الردود والتنبيهات:' : 'Notification & Response Channels:'}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
                    {isAr ? 'الرد الرسمي: البريد' : 'Official: Email'}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAr ? 'الردود الرسمية والخطابات المعتمدة تصلك على الإيميل، والتنبيهات اللحظية عبر القنوات المختارة أدناه:' : 'Official letters via Email, real-time alerts via selected channels below:'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Official Email */}
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
    </div>
  );
};
