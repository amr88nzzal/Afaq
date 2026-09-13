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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Search className="w-3.5 h-3.5" />
            <span>
              {isAr 
                ? 'دراسة الجدوى وتحليل المنافسين في الخليج والشرق الأوسط' 
                : 'Regional Competitive Intelligence & Strategic Choices'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {isAr ? 'نقاط القوة الواجب تبنيها، ونقاط الضعف المستبعدة' : 'Benchmark Strengths Adopted & Weaknesses Eliminated'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {isAr 
              ? 'قمنا بفحص شامل لأبرز الوكالات والمواقع التعليمية في السعودية والإمارات والكويت (مثل IDP Middle East، IEC Abroad، UniHawk، Global Study UK) لاستخلاص أفضل الممارسات وبناء منصة تتفوق عليها نوعياً.'
              : 'Detailed analysis of top Middle Eastern study agencies to build an elite, frictionless platform tailored to GCC culture.'}
          </p>
        </div>

        {/* Competitor Grid: Strengths vs Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* 1. Strengths to Adopt (نقاط القوة المستلهمة) */}
          <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-start">
                <h3 className="text-lg font-bold text-white">
                  {isAr ? '5 نقاط قوة جوهرية تم تبنيها في "آفاق العالمية"' : '5 Core Strengths Integrated into Afaq'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'عوامل النجاح الأساسية التي بنينا عليها النظام' : 'Pillars driving student conversion & parent peace of mind'}
                </p>
              </div>
            </div>

            <ul className="space-y-4 text-start">
              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  1
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'عقود الشراكة الرسمية المباشرة (Russell Group & Go8):' : 'Direct Official University Partnerships:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'التركيز على جامعات النخبة المعتمدة في قوائم وزارات التعليم الخليجية (بدلاً من الجامعات غير المعتمدة)، مما يمنح الطالب وولي أمره ثقة مطلقة بأن شهادته ستكون مصدقة ومطلوبة في سوق العمل.'
                      : 'Prioritizing officially accredited GCC government scholarship list universities (UK Russell Group & Australian Group of Eight).'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  2
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'نظام تتبع حالة القبول الشفاف (Visual Application Tracker):' : 'Live Transparent Application Tracker:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'تمكين الطالب من معرفة مرحلة طلبه في أي لحظة عبر 7 محطات واضحة (استلام -> تدقيق -> تقديم للجامعة -> قبول مشروط -> قبول نهائي CAS/CoE -> تأشيرة -> سفر).'
                      : 'Students and parents view real-time stage progress, eliminating anxiety and endless phone follow-ups.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  3
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'التنبيهات الفورية عبر الواتساب والتلغرام:' : 'Instant Telegram & WhatsApp Push Notifications:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'معدل فتح الإيميلات في الشرق الأوسط لا يتجاوز 20%، بينما يتجاوز الواتساب والتلغرام 95%. إرسال التنبيه فور صدور القبول المشروط أو طلب وثيقة إضافية يحدث فرقاً حاسماً.'
                      : 'Bridging the regional communication preference where mobile messaging open rates exceed 95%.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  4
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'التخصص العميق في 3 وجهات فائقة الجودة (UK, AU, NZ):' : 'Deep Tri-Destination Specialization (UK, AU, NZ):'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'تجنب تشتت المنافسين الذين يعرضون 40 دولة بسطحية؛ التخصص في بريطانيا وأستراليا ونيوزيلندا يجعل مستشاري آفاق خبراء مطلعين على أدق تفاصيل الفيزا والتكاليف والسكن.'
                      : 'Hyper-focused expertise in three premier English-speaking academic destinations.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  5
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'لوحة تحكم إدارية (CRM) للموظفين والمستشارين:' : 'Dedicated Staff & Counselor CRM Portal:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'إدارة منظمة للطلبات، تعيين مستشار خاص لكل طالب، واعتماد ومراجعة الوثائق المرفوعة بضغطة زر دون ضياع الملفات في رسائل البريد المتفرقة.'
                      : 'Robust internal workflow for consultants to review documents, issue notes, and broadcast updates.'}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* 2. Weaknesses to Avoid (نقاط الضعف المستبعدة) */}
          <div className="bg-slate-800/60 border border-rose-500/30 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="text-start">
                <h3 className="text-lg font-bold text-white">
                  {isAr ? '5 نقاط ضعف لدى المنافسين تم استبعادها وتجاوزها' : '5 Common Pitfalls Eliminated'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'أخطاء تجارية وتقنية قمنا بحلها جذرياً في تجربة المستخدم' : 'Flaws in rival agencies that we resolved'}
                </p>
              </div>
            </div>

            <ul className="space-y-4 text-start">
              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'استبعاد: الغموض المالي والرسوم الخفية:' : 'Eliminated: Hidden Fees & Ambiguity:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'العديد من الشركات لا توضح هل الاستشارة مجانية أم بمقابل حتى يدفع الطالب. في آفاق: الشفافية معلنة من اليوم الأول (التقديم للجامعات الشريكة مجاني 100%).'
                      : 'We establish upfront transparency that university admission application support is 100% free.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'استبعاد: الترجمة الآلية الركيكة وتصميم الواجهات الغربية الباردة:' : 'Eliminated: Stiff Machine Translations:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'الوكالات العالمية تستخدم قوالب مترجمة آلياً ومصطلحات غير دارجة. في آفاق: صياغة المحتوى بالعربية الأصيلة الوقورة التي تفهم مصطلحات (الابتعاث، CAS، CoE، مسار الرواد).'
                      : 'Authentic Arabic native phrasing respecting Gulf cultural prestige, rather than cold literal translations.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'استبعاد: استمارات التقديم الطويلة المعقدة قبل التقييم:' : 'Eliminated: Exhausting 10-Page Forms:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'إجبار الطالب على ملء 15 صفحة ورفع ملفات قبل معرفة توفر تخصصه يؤدي لانسحاب 70% من الزوار. استبدلناها بحاسبة سريعة 30 ثانية تمكنه من البدء فوراً.'
                      : 'Replaced long intimidating questionnaires with an instant 30-second preliminary eligibility checker.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'استبعاد: إهمال مرحلة ما بعد القبول (التأشيرة والسكن):' : 'Eliminated: Abandoning Students After Offer:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'الكثير من الوكلاء يتوقف دورهم عند تسليم ورقة القبول. وفرنا في آفاق مساراً مدمجاً للتأشيرة (Visa Support) وحجز السكن العائلي والجامعي والاستقبال.'
                      : 'Complete post-offer support covering visas, health insurance (OSHC/NHS), and student accommodation.'}
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <strong className="text-white block mb-0.5">
                    {isAr ? 'استبعاد: بطء التواصل والرد بعد 4-5 أيام:' : 'Eliminated: Days of Radio Silence:'}
                  </strong>
                  <span className="text-slate-300 text-xs leading-relaxed">
                    {isAr 
                      ? 'ربط كل طالب بمستشار معتمد عبر الواتساب والتلغرام والمحادثة الداخلية مع التزام رد خلال 24 ساعة كحد أقصى.'
                      : 'Dedicated counselor assigned with direct messaging channels and strict response SLAs.'}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Interactive Strategic Decisions / Questions for the User */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-3 text-start">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{isAr ? 'الأسئلة والقرارات الاستراتيجية لموقعك' : 'Strategic Questions & Policy Decisions'}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isAr ? 'أنت صاحب القرار' : 'Your Call'}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
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
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تم حفظ اختياراتك وتطبيقها على كامل النظام بنجاح!' : 'Your strategic policies have been applied!'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-start">
            
            {/* Question 1: Pricing Model */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>{isAr ? '1. سياسة رسوم القبول للطالب' : '1. Student Pricing Policy'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr ? 'كيف ترغب في تقديم خدمات آفاق للطلاب المتقدمين؟' : 'Which monetization model matches your agency?'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setFeeModel('free_all')}
                  className={`w-full p-2 rounded-lg text-xs font-semibold text-start border transition-all ${
                    feeModel === 'free_all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold">{isAr ? '✓ مجاني 100% (موصى به)' : '✓ 100% Free (Recommended)'}</div>
                  <div className="text-[10px] opacity-85">{isAr ? 'عمولة التقديم مغطاة بالكامل من الجامعات' : 'Commissions paid by institutions'}</div>
                </button>
                <button
                  onClick={() => setFeeModel('freemium_vip')}
                  className={`w-full p-2 rounded-lg text-xs font-semibold text-start border transition-all ${
                    feeModel === 'freemium_vip'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold">{isAr ? 'باقات VIP مدفوعة' : 'Freemium + VIP Concierge'}</div>
                  <div className="text-[10px] opacity-85">{isAr ? 'القبول مجاني + باقة مدفوعة للسكن والتأشيرة' : 'Free admission + paid relocation'}</div>
                </button>
              </div>
            </div>

            {/* Question 2: Notifications */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>{isAr ? '2. قناة التنبيهات الفورية المفضلة' : '2. Primary Notification Route'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr ? 'أي وسيلة ترغب بجعلها قناة الإشعارات الأولى للطالب؟' : 'How should admission status changes notify students?'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setPrimaryAlertChannel('omnichannel')}
                  className={`w-full p-2 rounded-lg text-xs font-semibold text-start border transition-all ${
                    primaryAlertChannel === 'omnichannel'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold">{isAr ? '✓ ثلاثية شاملة (Omnichannel)' : '✓ Omnichannel (All 3)'}</div>
                  <div className="text-[10px] opacity-85">{isAr ? 'واتساب + تلغرام + بريد معاً لضمان الوصول' : 'WhatsApp + Telegram + Email'}</div>
                </button>
                <button
                  onClick={() => setPrimaryAlertChannel('whatsapp_first')}
                  className={`w-full p-2 rounded-lg text-xs font-semibold text-start border transition-all ${
                    primaryAlertChannel === 'whatsapp_first'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold">{isAr ? 'واتساب أولاً (WhatsApp First)' : 'WhatsApp First'}</div>
                  <div className="text-[10px] opacity-85">{isAr ? 'إرسال قوالب رسمية معتمدة' : 'Official WhatsApp Business alerts'}</div>
                </button>
              </div>
            </div>

            {/* Question 3: Government Scholarships */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{isAr ? '3. برامج الابتعاث الحكومي الخليجي' : '3. GCC Government Scholarships'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr ? 'هل نبرز شروط مسارات الابتعاث الحكومي في الصفحة الأولى؟' : 'Highlight official GCC scholarship pathways?'}
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setScholarshipHighlight(true)}
                  className={`w-full p-2 rounded-lg text-xs font-semibold text-start border transition-all ${
                    scholarshipHighlight
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold">{isAr ? '✓ نعم، إبرازها بقوة' : '✓ Yes, Highlight Strongly'}</div>
                  <div className="text-[10px] opacity-85">{isAr ? 'مسار الرواد، بعثات الإمارات، الكويت، عمان' : 'KAUST, Saudi Custodian, UAE, Kuwait'}</div>
                </button>
                <button
                  onClick={() => setScholarshipHighlight(false)}
                  className={`w-full p-2 rounded-lg text-xs font-semibold text-start border transition-all ${
                    !scholarshipHighlight
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold">{isAr ? 'التركيز على الطلاب ذوي التمويل الخاص' : 'Focus on Self-Funded'}</div>
                  <div className="text-[10px] opacity-85">{isAr ? 'تسهيلات الدفع والمنح الجامعية المباشرة' : 'Direct university merit discounts'}</div>
                </button>
              </div>
            </div>

            {/* Question 4: Logo Selection */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>{isAr ? '4. اعتماد الشعار النشط (7 خيارات)' : '4. Active Logo Selection'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr ? 'اختر أي شعار ترغب في اعتماده حالياً وتجربته حياً:' : 'Select which concept to preview active site-wide:'}
              </p>
              <select
                value={selectedLogoId}
                onChange={(e) => onSelectLogoOption(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value={1}>{isAr ? 'الخيار 1: بوابة الآفاق والكتاب والنجمة (الموصى به)' : 'Option 1: Door, Book & Star (Recommended)'}</option>
                <option value={2}>{isAr ? 'الخيار 2: النسخة العالمية للجامعات الرسمية' : 'Option 2: Corporate Brand Guide'}</option>
                <option value={3}>{isAr ? 'الخيار 3: جناح المعرفة وطائر الطموح' : 'Option 3: Global Wings & Jetpath'}</option>
                <option value={4}>{isAr ? 'الخيار 4: الخاتم الملكي المذهب الفاخر 3D' : 'Option 4: 3D Royal Gold Medallion'}</option>
                <option value={5}>{isAr ? 'الخيار 5: البوابة المعمارية والدرج المضيء' : 'Option 5: Architectural Portal'}</option>
                <option value={6}>{isAr ? 'الخيار 6: التاج الأكاديمي والكرة الأرضية' : 'Option 6: Academic Globe & Crest'}</option>
                <option value={7}>{isAr ? 'الخيار 7: طريق الآفاق الممتد المبسط' : 'Option 7: Modern Highway & Star'}</option>
              </select>
              <div className="text-[11px] text-emerald-400 font-medium pt-1">
                {isAr ? '✦ يمكنك النقر على تبويب "مختبر الشعارات" لمعاينة تفاصيل كل خيار بالتفصيل' : '✦ Check the Logo Lab tab to compare all 7 in high fidelity'}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
