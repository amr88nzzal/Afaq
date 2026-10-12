import React, { useState } from 'react';
import { Language, Theme } from '../types';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  Compass, 
  Award, 
  MessageSquare,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ResearchSectionProps {
  lang: Language;
  theme?: Theme;
  onSelectLogoOption: (id: number) => void;
  selectedLogoId: number;
}

export const ResearchSection: React.FC<ResearchSectionProps> = ({
  lang,
  theme = 'dark',
  onSelectLogoOption,
  selectedLogoId,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  // User decisions state (interactive questionnaire)
  const [feeModel, setFeeModel] = useState<'free_all' | 'freemium_vip'>('free_all');
  const [primaryAlertChannel, setPrimaryAlertChannel] = useState<'whatsapp_first' | 'telegram_first' | 'omnichannel'>('omnichannel');
  const [scholarshipHighlight, setScholarshipHighlight] = useState<boolean>(true);
  const [fastTrackGuarantee, setFastTrackGuarantee] = useState<boolean>(true);
  const [savedDecisionToast, setSavedDecisionToast] = useState<boolean>(false);

  const handleSaveDecisions = () => {
    setSavedDecisionToast(true);
    setTimeout(() => setSavedDecisionToast(false), 3500);
  };

  return (
    <section className={`py-16 border-t transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-200'
    }`} id="research-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isAr 
                ? 'ما يميزنا — لأننا نهتم برحلتكم الأكاديمية' 
                : 'Why Choose Us — Dedicated Student Care'}
            </span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-black ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {isAr ? 'ما يميزنا والخدمات الاستثنائية التي نضعها بين يديك' : 'What Sets Us Apart & Why We Care For Your Journey'}
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {isAr 
              ? 'في "آفاق العالمية"، صممنا حلولنا الأكاديمية خصيصاً لتلبية تطلعات طلاب الخليج والشرق الأوسط، بتوفير تجربة تعليمية سلسة، شفافة، ومجانية بالكامل مع الاهتمام بجميع تفاصيل رحلتك الدراسية من التقديم وحتى الاستقرار.'
              : 'At Afaq Global, we tailored our services specifically for GCC students, combining complete financial transparency, official university partnerships, and dedicated personal support throughout your academic voyage.'}
          </p>
        </div>

        {/* Value Proposition Grid: Signature Advantages vs Avoided Complexities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* 1. Signature Advantages (ما يميزنا - لأننا نهتم بناجحك) */}
          <div className={`border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl transition-all ${
            isDark ? 'bg-slate-900/90 border-emerald-500/30 text-slate-100' : 'bg-white border-emerald-300 text-slate-900 shadow-md'
          }`}>
            <div className={`flex items-center gap-3 border-b pb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-start">
                <h3 className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {isAr ? '5 مزايا استثنائية نقدمها لك (لأننا نهتم بنجاحك)' : '5 Signature Advantages Designed For Your Success'}
                </h3>
                <p className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {isAr ? 'مقومات الجودة والرعاية التي تضمن لك ولعائلتك راحة البال' : 'Core service pillars that guarantee smooth admission and total peace of mind'}
                </p>
              </div>
            </div>

            <ul className="space-y-4 text-start">
              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  1
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'الشراكات المباشرة والقبولات الرسمية المعتمدة (Russell Group & Go8):' : 'Official & Direct University Partnerships:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'نركز حصرياً على جامعات النخبة المعتمدة في قوائم وزارات التعليم الخليجية، مما يمنح الطالب وولي أمره ثقة مطلقة بأن الشهادة مصدقة ومطلوبة في سوق العمل.'
                      : 'Prioritizing officially accredited GCC government scholarship list universities (UK Russell Group & Australian Group of Eight).'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  2
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'نظام التتبع الشفاف والمباشر لحالة طلبك (Visual Tracker):' : 'Live Transparent Application Tracker:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'يمكنك متابعة رحلة طلبك خطوة بخطوة عبر 7 مراحل محددة، بدءاً من التقديم وحتى صدور القبول والتأشيرة، دون حاجة لانتظار اتصالات مطولة.'
                      : 'Students and parents view real-time stage progress, eliminating anxiety and endless phone follow-ups.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  3
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'التنبيهات الفورية عبر الواتساب والتلغرام لضمان عدم تفويت أي تحديث:' : 'Instant Mobile & Messaging Push Notifications:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'نصلك فوراً عبر تطبيقك المفضل (واتساب أو تلغرام) بمجرد صدور القبول أو طلب مستند إضافي، لضمان سرعة الإنجاز وعدم تأخير الدراسة.'
                      : 'Bridging regional messaging habits where WhatsApp and Telegram alerts ensure immediate updates.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  4
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'التخصص العميق والخبرة المباشرة في 3 وجهات (بريطانيا، أستراليا، نيوزيلندا):' : 'Deep Tri-Destination Specialization (UK, AU, NZ):'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'نصب تركيزنا على الوجهات الأكاديمية الثلاث الأبرز عالمياً، لتقديم استشارات دقيقة حول أفضل المدن والسكن الجامعي والفيزا.'
                      : 'Hyper-focused expertise in three premier English-speaking academic destinations.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  5
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'مستشار أكاديمي خاص متابع لملفك من التقديم حتى وصولك لمقر دراستك:' : 'Dedicated Counselor Guidance From Start To Campus:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'يتم تعيين مستشار مختص لملفك يساندك في صياغة الخطاب الشخصي ومراجعة الوثائق وترتيب السكن والاستقبال في المطار.'
                      : 'Robust support workflow where a dedicated advisor guides your file every step of the way.'}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* 2. Complexities Avoided (تسهيلات استثنائية وتحديات تجنبناها من أجلك) */}
          <div className={`border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl transition-all ${
            isDark ? 'bg-slate-900/90 border-rose-500/30 text-slate-100' : 'bg-white border-rose-200 text-slate-900 shadow-md'
          }`}>
            <div className={`flex items-center gap-3 border-b pb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="text-start">
                <h3 className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {isAr ? '5 تعقيدات تجنبناها تماماً (لتوفير أقصى درجات الراحة)' : '5 Complexities Eliminated For Your Comfort'}
                </h3>
                <p className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {isAr ? 'حذف الروتين والرسوم المبهمة لتنعم بتجربة تقديم سلسة ومريحة' : 'Removing administrative friction and hidden fees for a seamless student experience'}
                </p>
              </div>
            </div>

            <ul className="space-y-4 text-start">
              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}>
                  ✕
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'تجنب الرسوم الخفية والغموض المالي (قبولك مجاني 100%):' : 'Eliminated: Hidden Fees & Financial Ambiguity:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'خدمات التقديم للجامعات الشريكة مجانية بالكامل بدون أي عمولات خفية، مع توضيح رسوم الدراسة والمصاريف فوراً وبكل شفافية.'
                      : 'We establish upfront transparency that university admission application support is 100% free.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}>
                  ✕
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'تجنب الترجمة الآلية والجافة (محتوى بلغة عربية أصيلة ومفهومة):' : 'Eliminated: Stiff Machine Translations:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'صيغ محتوانا بلغة عربية راقية تراعي خصوصية الطالب والأسرة الخليجية، وتعرف تماماً مفاهيم الابتعاث ومسارات الرواد.'
                      : 'Authentic Arabic native phrasing respecting Gulf cultural prestige, rather than cold literal translations.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}>
                  ✕
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'تجنب النماذج الطويلة والمعقدة (تقديم سريع في 30 ثانية فقط):' : 'Eliminated: Exhausting 10-Page Forms:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'بدلاً من ملء استمارات طويلة قبل التقييم، وفرنا حاسبة سريعة تمكنك من معرفة فرص قبولك والبدء في ثوانٍ معدودة.'
                      : 'Replaced long intimidating questionnaires with an instant 30-second preliminary eligibility checker.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}>
                  ✕
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'تجنب الانقطاع بعد صدور القبول (رعاية كاملة للفيزا والسكن):' : 'Eliminated: Abandoning Students After Offer:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'لا ينتهي دورنا بصدور القبول، بل نواصل معك في إجراءات التأشيرة والتأمين الصحي وتوفير السكن المناسب حتى وصولك بسلام.'
                      : 'Complete post-offer support covering visas, health insurance (OSHC/NHS), and student accommodation.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}>
                  ✕
                </div>
                <div>
                  <strong className={`block mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? 'تجنب الإهمال وبطء الرد (الالتزام بالمتابعة المباشرة):' : 'Eliminated: Unresponsive Support:'}
                  </strong>
                  <span className={`text-xs leading-relaxed block ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isAr 
                      ? 'نضمن لك التجاوب السريع والتحديث المستمر لحالة ملفك، لتكون دائماً على علم بكل خطوة في رحلتك الدراسية.'
                      : 'Dedicated counselor assigned with direct messaging channels and strict response SLAs.'}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Interactive Strategic Decisions / Questions for the User */}
        <div className={`border-2 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-amber-500/40 text-slate-100' 
            : 'bg-white border-amber-400/60 text-slate-900'
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-6 mb-6 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-3 text-start">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>{isAr ? 'قرارات وسياسات خدمية مصممة لراحتكم' : 'Tailored Service Policies & Platform Preferences'}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    {isAr ? 'خيارات تخصصية' : 'Your Options'}
                  </span>
                </h3>
                <p className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {isAr 
                    ? 'حدد الخيارات التي تناسب رؤيتك التشغيلية ليتم تفعيلها فوراً في واجهة الموقع ولوحات التحكم:' 
                    : 'Select your preferred business policies to activate them across the portal:'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveDecisions}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتثبيت القرارات' : 'Save & Apply Policies'}</span>
            </button>
          </div>

          {savedDecisionToast && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{isAr ? 'تم حفظ اختياراتك وتطبيقها على كامل النظام بنجاح!' : 'Your strategic policies have been applied!'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-start">
            
            {/* Question 1: Pricing Model */}
            <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>{isAr ? '1. سياسة رسوم القبول للطالب' : '1. Student Pricing Policy'}</span>
              </div>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isAr ? 'كيف ترغب في تقديم خدمات آفاق للطلاب المتقدمين؟' : 'Which monetization model matches your agency?'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setFeeModel('free_all')}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-start border transition-all ${
                    feeModel === 'free_all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">{isAr ? '✓ مجاني 100% (موصى به)' : '✓ 100% Free (Recommended)'}</div>
                  <div className="text-xs opacity-85">{isAr ? 'عمولة التقديم مغطاة بالكامل من الجامعات' : 'Commissions paid by institutions'}</div>
                </button>
                <button
                  onClick={() => setFeeModel('freemium_vip')}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-start border transition-all ${
                    feeModel === 'freemium_vip'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">{isAr ? 'باقات VIP مدفوعة' : 'Freemium + VIP Concierge'}</div>
                  <div className="text-xs opacity-85">{isAr ? 'القبول مجاني + باقة مدفوعة للسكن والتأشيرة' : 'Free admission + paid relocation'}</div>
                </button>
              </div>
            </div>

            {/* Question 2: Notifications */}
            <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>{isAr ? '2. قناة التنبيهات الفورية المفضلة' : '2. Primary Notification Route'}</span>
              </div>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isAr ? 'أي وسيلة ترغب بجعلها قناة الإشعارات الأولى للطالب؟' : 'How should admission status changes notify students?'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setPrimaryAlertChannel('omnichannel')}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-start border transition-all ${
                    primaryAlertChannel === 'omnichannel'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">{isAr ? '✓ ثلاثية شاملة (Omnichannel)' : '✓ Omnichannel (All 3)'}</div>
                  <div className="text-xs opacity-85">{isAr ? 'واتساب + تلغرام + بريد معاً لضمان الوصول' : 'WhatsApp + Telegram + Email'}</div>
                </button>
                <button
                  onClick={() => setPrimaryAlertChannel('whatsapp_first')}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-start border transition-all ${
                    primaryAlertChannel === 'whatsapp_first'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">{isAr ? 'واتساب أولاً (WhatsApp First)' : 'WhatsApp First'}</div>
                  <div className="text-xs opacity-85">{isAr ? 'إرسال قوالب رسمية معتمدة' : 'Official WhatsApp Business alerts'}</div>
                </button>
              </div>
            </div>

            {/* Question 3: Government Scholarships */}
            <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{isAr ? '3. برامج الابتعاث الحكومي الخليجي' : '3. GCC Government Scholarships'}</span>
              </div>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isAr ? 'هل نبرز شروط مسارات الابتعاث الحكومي في الصفحة الأولى؟' : 'Highlight official GCC scholarship pathways?'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setScholarshipHighlight(true)}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-start border transition-all ${
                    scholarshipHighlight
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">{isAr ? '✓ نعم، إبرازها بقوة' : '✓ Yes, Highlight Strongly'}</div>
                  <div className="text-xs opacity-85">{isAr ? 'مسار الرواد، بعثات الإمارات، الكويت، عمان' : 'KAUST, Saudi Custodian, UAE, Kuwait'}</div>
                </button>
                <button
                  onClick={() => setScholarshipHighlight(false)}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-start border transition-all ${
                    !scholarshipHighlight
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">{isAr ? 'التركيز على الطلاب ذوي التمويل الخاص' : 'Focus on Self-Funded'}</div>
                  <div className="text-xs opacity-85">{isAr ? 'تسهيلات الدفع والمنح الجامعية المباشرة' : 'Direct university merit discounts'}</div>
                </button>
              </div>
            </div>

            {/* Question 4: Logo Selection */}
            <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>{isAr ? '4. اعتماد الشعار النشط (7 خيارات)' : '4. Active Logo Selection'}</span>
              </div>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isAr ? 'اختر أي شعار ترغب في اعتماده حالياً وتجربته حياً:' : 'Select which concept to preview active site-wide:'}
              </p>
              <select
                value={selectedLogoId}
                onChange={(e) => onSelectLogoOption(Number(e.target.value))}
                className={`w-full rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-amber-400 border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value={1}>{isAr ? 'الخيار 1: بوابة الآفاق والكتاب والنجمة (الموصى به)' : 'Option 1: Door, Book & Star (Recommended)'}</option>
                <option value={2}>{isAr ? 'الخيار 2: النسخة العالمية للجامعات الرسمية' : 'Option 2: Corporate Brand Guide'}</option>
                <option value={3}>{isAr ? 'الخيار 3: جناح المعرفة وطائر الطموح' : 'Option 3: Global Wings & Jetpath'}</option>
                <option value={4}>{isAr ? 'الخيار 4: الخاتم الملكي المذهب الفاخر 3D' : 'Option 4: 3D Royal Gold Medallion'}</option>
                <option value={5}>{isAr ? 'الخيار 5: البوابة المعمارية والدرج المضيء' : 'Option 5: Architectural Portal'}</option>
                <option value={6}>{isAr ? 'الخيار 6: التاج الأكاديمي والكرة الأرضية' : 'Option 6: Academic Globe & Crest'}</option>
                <option value={7}>{isAr ? 'الخيار 7: طريق الآفاق الممتد المبسط' : 'Option 7: Modern Highway & Star'}</option>
              </select>
              <div className="text-xs text-emerald-500 font-medium pt-1">
                {isAr ? '✦ يمكنك الانتقال لصفحة الإدارة لمعاينة "مختبر الشعارات" بتفاصيل أعمق' : '✦ Check the Logo Lab tab in Admin panel to compare all 7 in high fidelity'}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
