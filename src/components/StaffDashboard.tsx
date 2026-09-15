import React, { useState, useEffect } from 'react';
import { MOCK_APPLICATIONS, INITIAL_ADMIN_ALERTS } from '../data/mockData';
import { Application, ApplicationStage, Language, Theme, AdminAlert, StaffUserEntity } from '../types';
import { 
  fetchApplicationsAPI, 
  updateApplicationStatusAPI, 
  updateApplicationFullAPI,
  updateDocumentStatusAPI,
  updatePortalPasswordAPI,
  sendCredentialsEmailAPI,
  checkServerHealthAPI,
  loginStaffAPI
} from '../services/api';
import { SettingsManager } from './SettingsManager';
import { UniversitiesManager } from './UniversitiesManager';
import { CountriesManager } from './CountriesManager';
import { UsersManager } from './UsersManager';
import { MeetingsManager } from './MeetingsManager';
import { ParagraphsManager } from './ParagraphsManager';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Send, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  MessageSquare, 
  FileCheck,
  Bell,
  Lock,
  LogOut,
  ArrowLeft,
  Mail,
  Phone,
  Check,
  Globe,
  Sun,
  Moon,
  Database,
  Server,
  Layers,
  Cpu,
  HardDrive,
  Copy,
  Terminal,
  KeyRound,
  RefreshCw,
  Building2,
  Calendar,
  User,
  Key,
  Eye,
  EyeOff,
  Crown,
  GraduationCap,
  UserCheck,
  BadgeCheck,
  Download,
  FileCheck2,
  X,
  AlertTriangle
} from 'lucide-react';
import { LogoRenderer } from './LogoRenderer';

interface StaffDashboardProps {
  lang: Language;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onReturnToPublicSite: () => void;
  onSelectApplication: (app: Application) => void;
  onSendStudentAlert: (appId: string, channel: 'whatsapp' | 'telegram' | 'email', message: string) => void;
  incomingAdminAlerts?: AdminAlert[];
  onCountriesUpdated?: () => void;
  onSettingsUpdated?: () => void;
  onCMSUpdated?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  lang,
  theme,
  onToggleTheme,
  onToggleLang,
  onReturnToPublicSite,
  onSelectApplication,
  onSendStudentAlert,
  incomingAdminAlerts = [],
  onCountriesUpdated,
  onSettingsUpdated,
  onCMSUpdated,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // Current logged in staff user and auth state
  const [currentUser, setCurrentUser] = useState<StaffUserEntity | null>(() => {
    try {
      const saved = sessionStorage.getItem('afaq_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('afaq_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Login form states
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Tab Navigation: 'crm' | 'universities' | 'countries' | 'users' | 'meetings' | 'cms' | 'settings' | 'docker'
  const [mainTab, setMainTab] = useState<'crm' | 'universities' | 'countries' | 'users' | 'meetings' | 'cms' | 'settings' | 'docker'>('crm');
  const [isPostgresOnline, setIsPostgresOnline] = useState<boolean>(false);

  // Applications & Alerts state
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [alerts, setAlerts] = useState<AdminAlert[]>([
    ...incomingAdminAlerts,
    ...INITIAL_ADMIN_ALERTS
  ]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(applications[0]);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewImageError, setPreviewImageError] = useState<boolean>(false);

  // Selected App editable fields
  const [editStatus, setEditStatus] = useState<string>('');
  const [newNoteInput, setNewNoteInput] = useState<string>('');
  const [editPortalPassword, setEditPortalPassword] = useState<string>('');
  const [isSavingApp, setIsSavingApp] = useState<boolean>(false);
  const [isSendingCreds, setIsSendingCreds] = useState<boolean>(false);

  // Sync selectedApp to edit form
  useEffect(() => {
    if (selectedApp) {
      setEditStatus(selectedApp.status || 'under_review');
      setEditPortalPassword(selectedApp.portalPassword || '');
    }
  }, [selectedApp]);

  // جلب الطلبات الحية وفحص صحة البوستجريس
  useEffect(() => {
    async function initData() {
      const serverApps = await fetchApplicationsAPI();
      if (serverApps && serverApps.length > 0) {
        setApplications(serverApps);
        if (!selectedApp) setSelectedApp(serverApps[0]);
      }
      const health = await checkServerHealthAPI();
      setIsPostgresOnline(health.postgres);
    }
    initData();
  }, []);

  // Quick Dispatch modal/message
  const [customMsg, setCustomMsg] = useState<string>('');
  const [dispatchChannel, setDispatchChannel] = useState<'email' | 'whatsapp' | 'telegram'>('email');

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const userVal = usernameInput.trim();
    const passVal = passwordInput.trim();

    if (!userVal || !passVal) {
      setLoginError(isAr ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter both username and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginStaffAPI(userVal, passVal);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('afaq_admin_auth', 'true');
          sessionStorage.setItem('afaq_staff_user', JSON.stringify(res.user));
        } catch {}
      } else {
        // Fallback check for demo master pin
        if (passVal === 'afaq2026' || passVal === 'admin123') {
          const fallbackUser: StaffUserEntity = {
            id: 1,
            name: userVal || (isAr ? 'د. فيصل الشمري' : 'Dr. Faisal Al-Shammari'),
            email: userVal.includes('@') ? userVal : 'faisal@afaq-global.com',
            role: 'admin',
            is_active: true
          };
          setCurrentUser(fallbackUser);
          setIsAuthenticated(true);
          try {
            sessionStorage.setItem('afaq_admin_auth', 'true');
            sessionStorage.setItem('afaq_staff_user', JSON.stringify(fallbackUser));
          } catch {}
        } else {
          setLoginError(res.error || (isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'));
        }
      }
    } catch {
      setLoginError(isAr ? 'تعذر التحقق من بيانات الدخول، تأكد من الاتصال بالخادم' : 'Failed to verify login credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickPersonaSelect = (email: string, pass: string) => {
    setUsernameInput(email);
    setPasswordInput(pass);
    setLoginError(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
    try {
      sessionStorage.removeItem('afaq_admin_auth');
      sessionStorage.removeItem('afaq_staff_user');
    } catch {}
  };

  const handleMarkAlertRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const handleQuickRespondToAlert = (alert: AdminAlert) => {
    handleMarkAlertRead(alert.id);
    const target = applications.find(a => a.applicationNumber === alert.applicationNumber || a.studentName === alert.studentName);
    if (target) {
      setSelectedApp(target);
    }
    setAlertSuccessToast(isAr ? `جاري الاستجابة الفورية لطلب الطالب: ${alert.studentName}` : `Responding to ${alert.studentName}`);
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  const handleAdvanceStage = async (appId: string) => {
    const nextStatus: ApplicationStage = 'unconditional_offer';
    const note = isAr ? 'تم استلام الضمان المالي وإصدار الـ CAS للفيزا' : 'CAS requested and unconditional offer confirmed';

    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const updated: Application = {
        ...app,
        status: nextStatus,
        notes: [...(app.notes || []), note],
      };
      if (selectedApp?.id === appId) {
        setSelectedApp(updated);
      }
      return updated;
    }));

    // حفظ في قاعدة البيانات والخادم
    await updateApplicationStatusAPI(appId, nextStatus, 5, note);

    setAlertSuccessToast(isAr ? 'تم ترقية الطلب وتخزين الحالة في قاعدة بيانات PostgreSQL!' : 'Stage updated and stored in PostgreSQL!');
    setTimeout(() => setAlertSuccessToast(null), 3500);
  };

  const handleVerifyDocument = async (docId: string) => {
    if (!selectedApp) return;
    const currentDocs = selectedApp.documents || [];
    const updatedDocs = currentDocs.map(d => d.id === docId ? { ...d, status: 'verified' as const } : d);
    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));

    // حفظ التحديث في قاعدة البيانات
    await updateDocumentStatusAPI(selectedApp.id, docId, 'verified');
    await updateApplicationFullAPI(selectedApp.id, { documents: updatedDocs });
    setAlertSuccessToast(isAr ? 'تم اعتماد الوثيقة بنجاح وحفظها في قاعدة البيانات' : 'Document verified and stored in database');
    setTimeout(() => setAlertSuccessToast(null), 3000);
  };

  const handleRequestReupload = async (docId: string) => {
    if (!selectedApp) return;
    const currentDocs = selectedApp.documents || [];
    const updatedDocs = currentDocs.map(d => d.id === docId ? { ...d, status: 'action_needed' as const } : d);
    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));

    // تحديث الحالة في قاعدة البيانات
    await updateDocumentStatusAPI(selectedApp.id, docId, 'action_needed', 'الملف غير واضح أو غير مكتمل');
    await updateApplicationFullAPI(selectedApp.id, { documents: updatedDocs });
    setAlertSuccessToast(isAr ? 'تم رفض الوثيقة وإشعار الطالب بإعادة الرفع' : 'Document marked for re-upload');
    setTimeout(() => setAlertSuccessToast(null), 3000);
  };

  // حفظ التعديلات الشاملة على الطلب
  const handleSaveSelectedAppChanges = async () => {
    if (!selectedApp) return;
    setIsSavingApp(true);

    // 1. تحديث الحالة
    if (editStatus !== selectedApp.status) {
      await updateApplicationStatusAPI(selectedApp.id, editStatus);
    }

    // 2. تحديث كلمة المرور
    if (editPortalPassword !== selectedApp.portalPassword) {
      await updatePortalPasswordAPI(selectedApp.id, editPortalPassword);
    }

    // 3. إضافة ملاحظة إن وجدت
    if (newNoteInput.trim()) {
      await updateApplicationStatusAPI(selectedApp.id, editStatus, undefined, newNoteInput.trim());
    }

    setIsSavingApp(false);
    setNewNoteInput('');
    setAlertSuccessToast(isAr ? '✅ تم تحديث بيانات الطلب بنجاح!' : 'Application updated successfully!');
    
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  // إرسال بيانات الدخول للطالب عبر البريد
  const handleSendCredentialsToStudent = async () => {
    if (!selectedApp) return;
    setIsSendingCreds(true);
    const res = await sendCredentialsEmailAPI(selectedApp.id);
    setIsSendingCreds(false);

    if (res.success) {
      setAlertSuccessToast(isAr ? `تم إرسال بريد رسمي ببيانات الدخول إلى: ${selectedApp.studentEmail}` : `Credentials sent to ${selectedApp.studentEmail}`);
    } else {
      setAlertSuccessToast(isAr ? 'تعذر إرسال البريد (تأكد من إعدادات Gmail في .env)' : 'Could not dispatch email');
    }
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !customMsg.trim()) return;

    onSendStudentAlert(selectedApp.id, dispatchChannel, customMsg);
    setAlertSuccessToast(
      isAr 
        ? `تم إرسال ${dispatchChannel === 'email' ? 'الرد الرسمي بالبريد' : dispatchChannel === 'whatsapp' ? 'تنبيه الواتساب' : 'إشعار التلغرام'} للطالب ${selectedApp.studentName}`
        : `Dispatched message via ${dispatchChannel}`
    );
    setCustomMsg('');
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  const filteredApps = applications.filter((app) => {
    if (!app) return false;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const q = (searchQuery || '').toLowerCase();
    const studentName = (app.studentName || '').toLowerCase();
    const applicationNumber = (app.applicationNumber || '').toLowerCase();
    const universityName = (app.universityName || '').toLowerCase();
    const courseName = (app.courseName || '').toLowerCase();

    const matchesSearch = 
      studentName.includes(q) ||
      applicationNumber.includes(q) ||
      universityName.includes(q) ||
      courseName.includes(q);

    return matchesStatus && matchesSearch;
  });

  // If locked, show secure login gate
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}>
        <div className={`max-w-md w-full rounded-3xl p-8 border shadow-2xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              {isAr ? 'بوابة المشرفين والموظفين المعتمدة' : 'Staff & Admissions Portal'}
            </div>
            <h2 className="text-2xl font-black">
              {isAr ? 'تسجيل الدخول للنظام' : 'Authorized Personnel Login'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'لوحة تحكم إدارة طلبات القبول والجامعات وسرعة الاستجابة' : 'Admissions CRM & Central University Management'}
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-start">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: faisal@afaq-global.com أو admin' : 'e.g. faisal@afaq-global.com or admin'}
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className={`w-full py-2.5 ps-10 pe-4 rounded-xl border text-sm focus:outline-none focus:border-amber-500 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isAr ? 'أدخل كلمة المرور الخاصة بحسابك' : 'Enter your staff password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className={`w-full py-2.5 ps-10 pe-10 rounded-xl border text-sm focus:outline-none focus:border-amber-500 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 shadow-lg cursor-pointer transition-transform active:scale-98 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري التحقق من الصلاحيات...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الدخول للنظام' : 'Sign In to Dashboard'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Demo Selector */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 text-center">
              {isAr ? '⚡ حسابات تجريبية سريعة بحسب الصلاحيات:' : '⚡ Quick Demo Personas (1-Click Fill):'}
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-start">
              <button
                type="button"
                onClick={() => handleQuickPersonaSelect('faisal@afaq-global.com', 'admin123')}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  usernameInput === 'faisal@afaq-global.com' 
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-400' 
                    : isDark ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px]">{isAr ? 'د. فيصل الشمري' : 'Dr. Faisal'}</div>
                    <div className="text-[9px] text-slate-400">faisal@afaq-global.com</div>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-semibold border border-purple-500/30">
                  {isAr ? 'مدير عام (Admin)' : 'Admin'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersonaSelect('sara@afaq-global.com', 'counselor123')}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  usernameInput === 'sara@afaq-global.com' 
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-400' 
                    : isDark ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px]">{isAr ? 'أ. سارة المنصور' : 'Ms. Sara'}</div>
                    <div className="text-[9px] text-slate-400">sara@afaq-global.com</div>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30">
                  {isAr ? 'مستشار أكاديمي' : 'Counselor'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersonaSelect('tariq@afaq-global.com', 'staff123')}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  usernameInput === 'tariq@afaq-global.com' 
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-400' 
                    : isDark ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px]">{isAr ? 'م. طارق الخالدي' : 'Eng. Tariq'}</div>
                    <div className="text-[9px] text-slate-400">tariq@afaq-global.com</div>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                  {isAr ? 'موظف قبولات' : 'Staff'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onReturnToPublicSite}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isAr ? 'العودة إلى الموقع العام للطلاب' : 'Return to Public Student Site'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-6 sm:py-10 min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Dedicated Admin Navigation Bar */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <LogoRenderer optionId={1} variant={isDark ? 'dark' : 'light'} />
            <div className="h-8 w-px bg-slate-700/50 hidden sm:block" />
            <div className="hidden sm:block text-start">
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                {isAr ? 'بوابة المشرفين المستقلة (./admin)' : 'Dedicated Staff Portal (./admin)'}
              </span>
              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {isAr ? 'نظام استقبال وتدقيق ومتابعة القبولات' : 'Central Admissions & Response Desk'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Logged in Staff Identity Card */}
            {currentUser && (
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                  currentUser.role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : currentUser.role === 'counselor' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {currentUser.role === 'admin' ? <Crown className="w-4 h-4" /> : currentUser.role === 'counselor' ? <GraduationCap className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>
                <div className="text-start">
                  <div className="text-xs font-bold leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {currentUser.role === 'admin' ? (isAr ? 'مدير عام النظام' : 'Super Admin') : currentUser.role === 'counselor' ? (isAr ? 'مستشار أكاديمي' : 'Counselor') : (isAr ? 'موظف قبولات' : 'Staff')}
                  </div>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'التحويل للوضع الداكن'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Return to Public Website */}
            <button
              onClick={onReturnToPublicSite}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAr ? 'الموقع العام' : 'Student Site'}</span>
            </button>

            {/* Logout Lock */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title={isAr ? 'تسجيل الخروج وقفل الجلسة' : 'Logout & Lock Session'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Admin Main Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap border-b border-slate-800/40 pb-3">
          <button
            onClick={() => setMainTab('crm')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'crm' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? 'الطلبات والطلاب (CRM)' : 'Applications'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/20 font-mono">
              {applications.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('universities')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'universities' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isAr ? 'الجامعات والتخصصات' : 'Universities & Majors'}</span>
          </button>

          <button
            onClick={() => setMainTab('countries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'countries' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'الوجهات والدول' : 'Countries'}</span>
          </button>

          <button
            onClick={() => setMainTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'users' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'فريق العمل والمستشارين' : 'Staff & Roles'}</span>
          </button>

          <button
            onClick={() => setMainTab('meetings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'meetings' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{isAr ? 'مواعيد الاستشارات' : 'Appointments'}</span>
          </button>

          <button
            onClick={() => setMainTab('cms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'cms' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'نصوص ومحتوى الموقع (CMS)' : 'CMS Content'}</span>
          </button>

          <button
            onClick={() => setMainTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'settings' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isAr ? 'إعدادات المنصة (DB/SMTP)' : 'Settings'}</span>
            <span className={`w-2 h-2 rounded-full ${isPostgresOnline ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
          </button>

          <button
            onClick={() => setMainTab('docker')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainTab === 'docker' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isAr ? 'سيرفر الدوكر (Oracle Cloud)' : 'Docker & Cloud'}</span>
          </button>
        </div>

        {/* Real-time Incoming New Applications Alert Ticker (Requirement 2) */}
        <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          unreadAlertsCount > 0 
            ? 'bg-amber-500/10 border-amber-500/40' 
            : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {unreadAlertsCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-amber-500">
                    {isAr ? 'تنبيهات فورية للمدراء بوصول طلبات جديدة' : 'Instant Manager Alerts: Incoming Applications'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    {isAr ? 'استجابة سريعة مطلوبة' : 'Rapid Response Priority'}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isAr 
                    ? 'يتم إشعار الإدارة فور تقديم أي طالب لطلب قبول جديد لمباشرة التواصل والرد الرسمي بالبريد.'
                    : 'Real-time alerts for incoming applications to ensure prompt consultant follow-up.'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-semibold">
              {unreadAlertsCount} {isAr ? 'طلبات غير مقروءة' : 'Unread alerts'}
            </div>
          </div>

          {/* Alert Cards Horizontal Stream */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3.5 rounded-xl border text-start flex flex-col justify-between gap-3 transition-all ${
                  !alt.isRead 
                    ? 'bg-amber-500/15 border-amber-500/40 shadow-sm' 
                    : isDark ? 'bg-slate-950/60 border-slate-800/80 opacity-75' : 'bg-slate-50 border-slate-200 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-amber-500">
                      {alt.applicationNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? alt.timeAgoAr : alt.timeAgoEn}
                    </span>
                  </div>

                  <div className="font-bold text-xs mt-1">
                    {alt.studentName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {alt.destination === 'uk' ? '🇬🇧 بريطانيا' : alt.destination === 'australia' ? '🇦🇺 أستراليا' : '🇳🇿 نيوزيلندا'} • {alt.universityName}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-500 mt-1">
                    📱 {alt.studentPhone}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => handleQuickRespondToAlert(alt)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1 shadow cursor-pointer transition-colors"
                  >
                    <span>{isAr ? 'استجابة سريعة للطلب' : 'Quick Response'}</span>
                  </button>
                  {!alt.isRead && (
                    <button
                      onClick={() => handleMarkAlertRead(alt.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px]"
                      title={isAr ? 'تعيين كمقروء' : 'Mark as read'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Alert Toast */}
        {alertSuccessToast && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn text-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{alertSuccessToast}</span>
          </div>
        )}

        {/* Tab 1: CRM & Applications */}
        {mainTab === 'crm' && (
          <>
            {/* KPI Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`border rounded-2xl p-5 text-start space-y-1 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-slate-400 text-xs font-semibold">{isAr ? 'إجمالي الملفات الأكاديمية' : 'Total Active Files'}</div>
                <div className="text-2xl font-black">{applications.length}</div>
                <div className="text-[11px] text-emerald-500 font-medium">↑ +18% هذا الشهر</div>
              </div>

              <div className={`border rounded-2xl p-5 text-start space-y-1 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-slate-400 text-xs font-semibold">{isAr ? 'قبولات مشروطة مجانية' : 'Free Offers Issued'}</div>
                <div className="text-2xl font-black text-amber-500">89</div>
                <div className="text-[11px] text-slate-400">{isAr ? 'إصدار سريع خلال 3-5 أيام' : '3-5 Days Average'}</div>
              </div>

              <div className={`border rounded-2xl p-5 text-start space-y-1 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-slate-400 text-xs font-semibold">{isAr ? 'تأشيرات سفر ممنوحة' : 'Visas Approved'}</div>
                <div className="text-2xl font-black text-emerald-500">51</div>
                <div className="text-[11px] text-emerald-500 font-medium">98.4% {isAr ? 'نسبة نجاح الفيزا' : 'Approval Rate'}</div>
              </div>

              <div className={`border rounded-2xl p-5 text-start space-y-1 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="text-slate-400 text-xs font-semibold">{isAr ? 'تنبيهات فورية للمدراء' : 'Manager Alerts'}</div>
                <div className="text-2xl font-black text-blue-500">{alerts.length}</div>
                <div className="text-[11px] text-slate-400">{isAr ? 'معدل استجابة أقل من ساعتين' : '< 2h Response Time'}</div>
              </div>
            </div>

            {/* Main Workspace: Application List (7 cols) + Detail Drawer & Official Responder (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Applications Table (7 cols) */}
          <div className={`lg:col-span-7 border rounded-2xl p-5 shadow-xl space-y-4 text-start ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث بالاسم، الجامعة، أو رقم الطلب...' : 'Search applicant or ID...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border rounded-lg py-1.5 pl-3 pr-9 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full sm:w-auto border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="submitted">{isAr ? 'طلبات جديدة واردة' : 'Submitted'}</option>
                <option value="under_review">{isAr ? 'قيد التدقيق الأكاديمي' : 'Under Review'}</option>
                <option value="conditional_offer">{isAr ? 'صدر القبول المشروط' : 'Conditional Offer'}</option>
                <option value="unconditional_offer">{isAr ? 'قبول نهائي CAS/CoE' : 'Unconditional / CAS'}</option>
                <option value="visa_granted">{isAr ? 'منحت التأشيرة' : 'Visa Granted'}</option>
              </select>
            </div>

            {/* Applications List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredApps.map((app) => {
                const isSelected = selectedApp?.id === app.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? isDark 
                          ? 'bg-purple-950/20 border-purple-500/80 shadow-md shadow-purple-950/30' 
                          : 'bg-purple-50 border-purple-400 shadow-md'
                        : isDark 
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-500">
                          {app.applicationNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.destination === 'uk' ? 'bg-blue-500/20 text-blue-400' :
                          app.destination === 'australia' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {(app.destination || 'global').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {app.updatedAt}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">
                          {app.studentName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {app.universityName} • {app.courseName}
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          {app.status === 'conditional_offer' ? 'قبول مشروط' :
                           app.status === 'submitted' ? 'طلب جديد' :
                           app.status === 'unconditional_offer' ? 'قبول نهائي CAS' :
                           app.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Drawer & Official Channel Responder (5 cols) */}
          <div className={`lg:col-span-5 border rounded-2xl p-5 shadow-xl space-y-6 text-start ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {selectedApp ? (
              <div className="space-y-6">
                
                {/* Application Header Card */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-500 font-bold">
                      {selectedApp.applicationNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                      {isAr ? 'القبول مجاني 100%' : '100% Free Placement'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black mt-1">
                    {selectedApp.studentName}
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedApp.universityName}
                  </div>
                  <div className="text-xs text-slate-400">
                    📧 {selectedApp.studentEmail} • 📱 {selectedApp.studentPhone}
                  </div>
                </div>

                {/* Stage Progress & Action */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-xs font-bold text-slate-400">
                    {isAr ? 'المرحلة الأكاديمية الحالية:' : 'Current Stage:'}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-black text-sm text-amber-500">
                      {selectedApp.status === 'conditional_offer' ? 'صدر القبول المشروط (بانتظار الـ CAS)' : selectedApp.status}
                    </div>
                    <button
                      onClick={() => handleAdvanceStage(selectedApp.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow hover:from-amber-400 hover:to-amber-300 transition-colors cursor-pointer"
                    >
                      {isAr ? 'ترقية للقبول النهائي وإصدار الـ CAS' : 'Advance to CAS'}
                    </button>
                  </div>
                </div>

                {/* Direct Application Data Editor & PostgreSQL Persistence */}
                <div className={`p-4 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-slate-950/80 border-amber-500/30' : 'bg-amber-50/50 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-800/40">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black text-amber-500">
                        {isAr ? 'تعديل وتخزين بيانات الطلب (PostgreSQL):' : 'Database Direct Editor (PostgreSQL):'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                      {isPostgresOnline ? '● DB Online' : '○ Local Sync'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Status Dropdown */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400 block text-[11px]">
                        {isAr ? 'حالة الطلب ومرحلته:' : 'Application Status:'}
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className={`w-full p-2 rounded-xl border text-xs font-semibold focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="submitted">{isAr ? 'جديد - تم التقديم' : 'Submitted'}</option>
                        <option value="under_review">{isAr ? 'قيد فحص وتدقيق الأوراق' : 'Under Review'}</option>
                        <option value="sent_to_university">{isAr ? 'تم التقديم للجامعة الشريكة' : 'Sent to University'}</option>
                        <option value="conditional_offer">{isAr ? 'صدر القبول المشروط المجاني' : 'Conditional Offer Issued'}</option>
                        <option value="unconditional_offer">{isAr ? 'القبول النهائي والـ CAS / CoE' : 'Unconditional / CAS'}</option>
                        <option value="visa_processing">{isAr ? 'معاملة التأشيرة والسكن' : 'Visa Processing'}</option>
                        <option value="visa_granted">{isAr ? 'منحت التأشيرة والاستعداد للسفر' : 'Visa Granted'}</option>
                      </select>
                    </div>

                    {/* Portal Password */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-400 block text-[11px]">
                          {isAr ? 'كلمة مرور بوابة الطالب:' : 'Student Portal Pass:'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditPortalPassword(Math.floor(100000 + Math.random() * 900000).toString())}
                          className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                        >
                          {isAr ? 'توليد تلقائي' : 'Generate'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editPortalPassword}
                        onChange={(e) => setEditPortalPassword(e.target.value)}
                        placeholder="afaq123"
                        className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Add Administrative Note */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 block text-[11px]">
                      {isAr ? 'إضافة ملاحظة إدارية جديدة في السجل:' : 'Add Admin Note to Log:'}
                    </label>
                    <input
                      type="text"
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      placeholder={isAr ? 'مثال: تم إرسال الأوراق لجامعة مانشستر بنجاح' : 'e.g. Sent documents to University of Manchester'}
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Action Buttons: Save to DB & Send Credentials */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSavingApp}
                      onClick={handleSaveSelectedAppChanges}
                      className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                    >
                      {isSavingApp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{isAr ? 'جاري التخزين في PostgreSQL...' : 'Saving to Database...'}</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" />
                          <span>{isAr ? '💾 حفظ وتخزين التعديلات في قاعدة البيانات' : 'Save Changes to PostgreSQL'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSendingCreds}
                      onClick={handleSendCredentialsToStudent}
                      className={`py-2.5 px-3.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                      title={isAr ? 'إرسال بيانات الدخول المحدثة لإيميل الطالب' : 'Send credentials to student email'}
                    >
                      {isSendingCreds ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>{isAr ? 'إرسال بيانات الدخول للبريد' : 'Email Login Pass'}</span>
                    </button>
                  </div>
                </div>

                {/* Uploaded Documents Verification */}
                <div className="space-y-3">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-amber-500" />
                      <span>{isAr ? 'تدقيق وثائق الطالب المرفوعة والاعتماد الأكاديمي:' : 'Uploaded Documents & Verification Review:'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedApp.documents?.filter(d => d.status === 'verified').length || 0} / {selectedApp.documents?.length || 0} {isAr ? 'معتمد' : 'Verified'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedApp.documents && selectedApp.documents.length > 0 ? (
                      selectedApp.documents.map((doc) => {
                        const hasFile = !!doc.fileName || (!!doc.file_url && doc.file_url !== 'null');
                        const isUploaded = hasFile || doc.status === 'uploaded' || doc.status === 'verified';
                        const displayFileName = doc.fileName || (doc.file_url ? doc.file_url.split('/').pop() : null);

                        return (
                          <div 
                            key={doc.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                              doc.status === 'verified'
                                ? isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/60 border-emerald-200'
                                : isUploaded
                                ? isDark ? 'bg-blue-950/20 border-blue-800/40' : 'bg-blue-50/60 border-blue-200'
                                : isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                <span className={doc.status === 'verified' ? 'text-emerald-400' : ''}>
                                  {isAr ? doc.nameAr : doc.nameEn}
                                </span>
                                {doc.required && (
                                  <span className="text-[10px] text-amber-500 font-medium">({isAr ? 'إلزامي' : 'Mandatory'})</span>
                                )}
                              </div>

                              {isUploaded ? (
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="font-mono text-slate-300 font-semibold truncate max-w-[200px]">
                                    📄 {displayFileName || (isAr ? 'ملف مرفوع.pdf' : 'document.pdf')}
                                  </span>
                                  {doc.fileSize && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-400">{doc.fileSize}</span>
                                    </>
                                  )}
                                  {doc.uploadedAt && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500 text-[10px]">{doc.uploadedAt}</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[11px] text-amber-500/80 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{isAr ? 'لم يتم الرفع بعد (بانتظار رفع الطالب للملف)' : 'Not uploaded yet (Awaiting student)'}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions based on real upload state */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* If document is uploaded, allow preview */}
                              {isUploaded && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewDoc(doc);
                                    setPreviewImageError(false);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                                  }`}
                                  title={isAr ? 'معاينة الوثيقة وتفاصيلها' : 'Preview Document'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'معاينة' : 'View'}</span>
                                </button>
                              )}

                              {/* Approval or Status Badge */}
                              {doc.status === 'verified' ? (
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'معتمد رسمياً' : 'Approved'}</span>
                                </span>
                              ) : isUploaded ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyDocument(doc.id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black transition-colors cursor-pointer shadow flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'اعتماد الوثيقة' : 'Approve'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestReupload(doc.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold transition-colors cursor-pointer"
                                    title={isAr ? 'طلب إعادة رفع ملف أوضح' : 'Request Re-upload'}
                                  >
                                    <span>{isAr ? 'طلب تعديل' : 'Reject'}</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyDocument(doc.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title={isAr ? 'اعتماد الوثيقة مباشرة إذا تم استلامها خارجياً' : 'Direct manual approval'}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'اعتماد مباشر' : 'Direct Approval'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDispatchChannel('whatsapp');
                                      setCustomMsg(isAr 
                                        ? `عزيزي الطالب ${selectedApp.studentName}، يرجى الدخول لبوابة الطالب ورفع وثيقة (${doc.nameAr}) المطلوبة لاستكمال ملفك الجامعي.`
                                        : `Dear ${selectedApp.studentName}, please access your student portal and upload the required (${doc.nameEn}) document.`);
                                      setAlertSuccessToast(isAr ? 'تم تجهيز رسالة تذكير للطالب في حقل المراسلة أدناه' : 'Reminder loaded into message box below');
                                      setTimeout(() => setAlertSuccessToast(null), 3000);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'تذكير' : 'Remind'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        {isAr ? 'لا توجد وثائق مدرجة في هذا الطلب' : 'No documents recorded'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Response & Notification Dispatch Tool (Requirement 2) */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-amber-500">
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرسال الرد الرسمي والتنبيهات للطالب:' : 'Dispatch Official Response & Alerts:'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold">
                      {isAr ? 'الرد الرسمي بالبريد' : 'Official via Email'}
                    </span>
                  </div>

                  {/* Channel Selector */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDispatchChannel('email')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                        dispatchChannel === 'email'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{isAr ? 'بريد رسمي' : 'Email'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchChannel('whatsapp')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                        dispatchChannel === 'whatsapp'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>💬</span>
                      <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchChannel('telegram')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                        dispatchChannel === 'telegram'
                          ? 'bg-sky-600 text-white border-sky-500 shadow'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>✈️</span>
                      <span>{isAr ? 'تلغرام' : 'Telegram'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendResponse} className="space-y-2">
                    <textarea
                      rows={3}
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                      placeholder={
                        dispatchChannel === 'email'
                          ? (isAr ? 'نص الخطاب الرسمي الصادر للطالب مع تفاصيل القبول والأوراق المطلوبة...' : 'Draft official email response with instructions...')
                          : (isAr ? 'نص التنبيه اللحظي السريع للطالب...' : 'Instant message text...')
                      }
                      className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomMsg(
                          dispatchChannel === 'email'
                            ? (isAr ? `مرحباً ${selectedApp.studentName}، يسر فريق القبولات في آفاق العالمية إعلامكم بصدور القبول المشروط من ${selectedApp.universityName}. تجدون في المرفقات الإرشادات الرسمية لاستكمال متطلبات الـ CAS.` : `Dear ${selectedApp.studentName}, your conditional offer from ${selectedApp.universityName} is ready.`)
                            : (isAr ? `عزيزي ${selectedApp.studentName}، تم تدقيق أوراقك من قبل مستشارك في آفاق، وتم إرسال التفاصيل الرسمية إلى بريدك الإلكتروني.` : `Update on application ${selectedApp.applicationNumber}.`)
                        )}
                        className={`py-2 px-3 rounded-lg text-[11px] font-bold border transition-colors ${
                          isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isAr ? 'نموذج جاهز' : 'Template'}
                      </button>

                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-lg font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow transition-transform active:scale-98 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {dispatchChannel === 'email' ? (isAr ? 'إرسال الرد الرسمي بالبريد' : 'Dispatch Official Email') :
                           dispatchChannel === 'whatsapp' ? (isAr ? 'إرسال تنبيه الواتساب' : 'Dispatch WhatsApp Alert') :
                           (isAr ? 'إرسال تنبيه التلغرام' : 'Dispatch Telegram Alert')}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                {isAr ? 'اختر طلباً من القائمة لمعاينة التفاصيل وإرسال الرد' : 'Select an application to review and reply'}
              </div>
            )}
          </div>

        </div>
          </>
        )}

        {/* Tab 2: Universities & Majors Manager */}
        {mainTab === 'universities' && (
          <UniversitiesManager lang={lang} theme={theme} />
        )}

        {/* Tab 3: Countries & Destinations Manager */}
        {mainTab === 'countries' && (
          <CountriesManager lang={lang} theme={theme} onCountriesUpdated={onCountriesUpdated} />
        )}

        {/* Tab 4: Users & Staff Manager */}
        {mainTab === 'users' && (
          <UsersManager lang={lang} theme={theme} />
        )}

        {/* Tab 5: Meetings & Consultations Manager */}
        {mainTab === 'meetings' && (
          <MeetingsManager lang={lang} theme={theme} />
        )}

        {/* Tab 6: CMS Paragraphs & Text Manager */}
        {mainTab === 'cms' && (
          <ParagraphsManager lang={lang} theme={theme} onCMSUpdated={onCMSUpdated} />
        )}

        {/* Tab 7: Dynamic PostgreSQL Settings Manager */}
        {mainTab === 'settings' && (
          <SettingsManager lang={lang} theme={theme} onSettingsUpdated={onSettingsUpdated} />
        )}

        {/* Tab 8: Docker & Cloud Server Architecture */}
        {mainTab === 'docker' && (
          <div className={`border rounded-2xl p-6 shadow-xl space-y-6 text-start ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/40">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black">
                  {isAr ? 'هيكلية النشر عبر 3 حاويات Docker على سيرفر أوراكل كلاود' : '3-Container Docker Architecture (Oracle Cloud)'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAr 
                    ? '4CPU ARM • 24 GB RAM • Cloudflare Tunnel • afaq-global.amrodev.com' 
                    : 'Configured for Oracle ARM Ampere A1 with Cloudflare integration'}
                </p>
              </div>
            </div>

            {/* Containers Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Container 1: Frontend */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    1. Afaq-frontend
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Port 3000 : 80</span>
                </div>
                <div className="text-xs font-semibold">Nginx + React Vite (SPA)</div>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'يقوم ببناء React وتوزيع الملفات الثابتة عبر Nginx عالي السرعة، مع توجيه طلبات /api/ للباك إند.' 
                    : 'High performance Nginx serving compiled React assets with /api/ reverse proxy.'}
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                  afaq-frontend/Dockerfile
                </div>
              </div>

              {/* Container 2: Backend */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    2. Afaq-Backend
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Port 5000</span>
                </div>
                <div className="text-xs font-semibold">Node.js + Express.js API</div>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'معالجة الطلبات، إرسال إيميلات Gmail SMTP الفورية، وإرسال تنبيهات Telegram Bot للمدراء.' 
                    : 'RESTful API with Nodemailer (Gmail SMTP) and Telegram Bot manager alerts.'}
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                  afaq-backend/Dockerfile
                </div>
              </div>

              {/* Container 3: Database */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    3. Afaq-DB
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Port 5432</span>
                </div>
                <div className="text-xs font-semibold">PostgreSQL 16 Alpine</div>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'قاعدة بيانات مستدامة تخزن كافة الإعدادات والطلبات، مع وحدة تخزين دائمة afaq_pgdata.' 
                    : 'PostgreSQL 16 with init.sql schema auto-execution and persistent Docker volume.'}
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                  afaq-db/init.sql
                </div>
              </div>
            </div>

            {/* Git Repository Strategy Recommendation */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-xs text-amber-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'الإجابة والتوصية حول مستودع GitHub (مستودع واحد Monorepo أم ثلاثة مستودعات؟)' : 'GitHub Repository Architecture (Monorepo vs Multi-repo)'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr 
                  ? '✅ التوصية القياسية المعتمدة عالمياً لمثل هذا المشروع المشغّل عبر Docker Compose هي: مستودع واحد (Monorepo) على حسابك على GitHub.' 
                  : 'Industry Best Practice: A single repository (Monorepo) is strongly recommended for Docker Compose applications.'}
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>{isAr ? 'سهولة الاستنساخ على سيرفر أوراكل بأمر واحد: git clone ثم تشغيل docker compose up' : 'Single git clone command on your Oracle VM followed by docker compose up'}</li>
                <li>{isAr ? 'مزامنة كاملة لأنواع البيانات (TypeScript Types) بين الواجهة الأمامية والباك إند' : 'Shared TypeScript interfaces and data models without version mismatch'}</li>
                <li>{isAr ? 'ملف docker-compose.yml واحد في الجذر يربط الحاويات الثلاث داخل شبكة داخلية آمنة' : 'Single root docker-compose.yml orchestrating internal bridge networking'}</li>
              </ul>
            </div>

            {/* Quick Commands to Run on Oracle Cloud */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'أوامر التشغيل المباشرة على سيرفر أوراكل كلاود (Oracle ARM Cloud):' : 'Terminal Commands for Oracle Cloud VM:'}</span>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre">
{`# 1. الدخول إلى مجلد المشروع
cd afaq-global

# 2. نسخ وضبط متغيرات البيئة (كلمة مرور قاعدة البيانات، الجيميل، التلغرام)
cp .env.example .env
nano .env

# 3. بناء وتشغيل الحاويات الثلاث في الخلفية
docker compose up -d --build

# 4. التحقق من عمل الحاويات
docker compose ps

# 5. مراقبة سجلات الخادم
docker compose logs -f afaq_backend`}
              </pre>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className={`max-w-lg w-full rounded-2xl border shadow-2xl p-6 space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm">{isAr ? previewDoc.nameAr : previewDoc.nameEn}</h3>
                </div>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'اسم الملف المرفوع:' : 'File Name:'}</span>
                    <span className="font-bold text-slate-200">{previewDoc.fileName || (previewDoc.file_url ? previewDoc.file_url.split('/').pop() : 'document.pdf')}</span>
                  </div>
                  {previewDoc.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'حجم الملف:' : 'File Size:'}</span>
                      <span className="text-slate-300">{previewDoc.fileSize}</span>
                    </div>
                  )}
                  {previewDoc.uploadedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'تاريخ الرفع:' : 'Uploaded:'}</span>
                      <span className="text-slate-300">{previewDoc.uploadedAt}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-400">{isAr ? 'حالة الاعتماد:' : 'Status:'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      previewDoc.status === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {previewDoc.status === 'verified' ? (isAr ? 'معتمد رسمياً' : 'Verified') : (isAr ? 'مرفوع - بانتظار التدقيق' : 'Uploaded - Pending Review')}
                    </span>
                  </div>
                </div>

                {!previewImageError && (
                  previewDoc.file_url?.startsWith('data:image') || 
                  /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc.fileName || previewDoc.file_name || previewDoc.file_url || '')
                ) ? (
                  <div className="max-h-72 overflow-hidden rounded-xl border border-slate-800 flex items-center justify-center bg-slate-950 p-2">
                    <img 
                      src={
                        previewDoc.file_url && previewDoc.file_url.startsWith('data:image')
                          ? previewDoc.file_url
                          : `/api/applications/${selectedApp?.id || selectedApp?.applicationNumber}/documents/${previewDoc.id || previewDoc.doc_type || previewDoc.category}/file`
                      } 
                      alt={previewDoc.fileName || previewDoc.nameAr || 'Document'} 
                      className="max-h-72 object-contain rounded-lg shadow"
                      onError={() => setPreviewImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-dashed border-slate-700/80 text-center space-y-2 bg-slate-950/40">
                    <FileCheck2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <div>
                      <div className="font-bold text-sm text-slate-200">{previewDoc.fileName || previewDoc.file_name || previewDoc.nameAr || 'document.pdf'}</div>
                      <div className="text-slate-400 text-xs font-mono mt-0.5">{previewDoc.fileSize || previewDoc.file_size || '87 KB'}</div>
                    </div>
                    <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                      {isAr ? 'تم حفظ المستند في قاعدة البيانات والخادم ويمكنك اعتماده أو فتح الملف المرفوع مباشرة.' : 'Document is stored securely on the server and ready for review.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href={`/api/applications/${selectedApp?.id || selectedApp?.applicationNumber}/documents/${previewDoc.id}/file`}
                  download={previewDoc.fileName || 'document.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل الوثيقة' : 'Download File'}</span>
                </a>
                {previewDoc.status !== 'verified' && (
                  <button
                    onClick={() => {
                      handleVerifyDocument(previewDoc.id);
                      setPreviewDoc((prev: any) => prev ? { ...prev, status: 'verified' } : null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors ms-auto cursor-pointer shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'اعتماد الوثيقة الآن' : 'Approve Now'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
