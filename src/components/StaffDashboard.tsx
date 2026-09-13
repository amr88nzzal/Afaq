import React, { useState } from 'react';
import { MOCK_APPLICATIONS, INITIAL_ADMIN_ALERTS } from '../data/mockData';
import { Application, ApplicationStage, Language, Theme, AdminAlert } from '../types';
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
  Moon
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
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // default true for preview, with pin lock
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

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

  // Quick Dispatch modal/message
  const [customMsg, setCustomMsg] = useState<string>('');
  const [dispatchChannel, setDispatchChannel] = useState<'email' | 'whatsapp' | 'telegram'>('email');

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === 'afaq2026' || adminPin === 'admin' || adminPin === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
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

  const handleAdvanceStage = (appId: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const updated: Application = {
        ...app,
        status: 'unconditional_offer',
        notes: isAr ? 'تم استلام الضمان المالي وطلب إصدار الـ CAS للفيزا' : 'CAS requested from university',
      };
      if (selectedApp?.id === appId) {
        setSelectedApp(updated);
      }
      return updated;
    }));

    setAlertSuccessToast(isAr ? 'تم تحديث مرحلة القبول وإرسال إشعار رسمي للطالب عبر البريد!' : 'Stage updated and official email dispatched!');
    setTimeout(() => setAlertSuccessToast(null), 3000);
  };

  const handleVerifyDocument = (docId: string) => {
    if (!selectedApp) return;
    const updatedDocs = selectedApp.documents.map(d => d.id === docId ? { ...d, status: 'verified' as const } : d);
    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
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
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = 
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // If locked, show secure login gate
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}>
        <div className={`max-w-md w-full rounded-3xl p-8 border shadow-2xl space-y-6 text-center ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
              {isAr ? 'بوابة الإدارة والمشرفين (./admin)' : 'Staff & Admins Portal'}
            </div>
            <h2 className="text-2xl font-black">
              {isAr ? 'تسجيل دخول المشرفين المعتمدين' : 'Authorized Personnel Login'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'لوحة تحكم إدارة طلبات القبول وسرعة الاستجابة للطلاب' : 'Admissions CRM and rapid inquiry desk'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder={isAr ? 'أدخل رمز PIN الإداري (التجريبي: afaq2026)' : 'Enter Admin PIN (Demo: afaq2026)'}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className={`w-full text-center py-3 px-4 rounded-xl border text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              {pinError && (
                <div className="text-xs text-red-400 font-bold mt-1.5">
                  {isAr ? 'رمز الدخول غير صحيح، استخدم الرمز التجريبي: afaq2026' : 'Invalid PIN, use demo PIN: afaq2026'}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg cursor-pointer transition-transform active:scale-98"
            >
              {isAr ? 'تسجيل الدخول للنظام' : 'Access Admin Dashboard'}
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminPin('afaq2026');
                setIsAuthenticated(true);
              }}
              className="w-full py-2 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer"
            >
              {isAr ? '⚡ دخول فوري للمشرف التجريبي (1-Click Demo)' : '⚡ Quick 1-Click Demo Access'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onReturnToPublicSite}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
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

          <div className="flex items-center gap-2 flex-wrap justify-center">
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
              <span>{isAr ? 'العودة للموقع العام للطلاب' : 'Return to Student Site'}</span>
            </button>

            {/* Logout Lock */}
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              title={isAr ? 'قفل الجلسة' : 'Lock Session'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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

        {/* KPI Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-5 text-start space-y-1 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="text-slate-400 text-xs font-semibold">{isAr ? 'إجمالي الملفات الأكاديمية' : 'Total Active Files'}</div>
            <div className="text-2xl font-black">142</div>
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
                          {app.destination.toUpperCase()}
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

                {/* Uploaded Documents Verification */}
                <div className="space-y-2">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{isAr ? 'تدقيق وثائق الطالب المرفوعة:' : 'Uploaded Documents Review:'}</span>
                    <span className="text-[10px] text-slate-400">{selectedApp.documents.length} {isAr ? 'ملفات' : 'files'}</span>
                  </div>

                  <div className="space-y-2">
                    {selectedApp.documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">
                            {isAr ? doc.nameAr : doc.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {doc.fileName || (isAr ? 'غير مرفوع' : 'No file')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {doc.status === 'verified' ? (
                            <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'معتمد' : 'Approved'}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyDocument(doc.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black transition-colors cursor-pointer shadow"
                            >
                              {isAr ? 'اعتماد الوثيقة' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
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

      </div>
    </div>
  );
};
