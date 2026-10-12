import React, { useState } from 'react';
import { CONCIERGE_SERVICES } from '../data/mockData';
import { Language, Theme } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Plane, 
  Building2, 
  FileCheck, 
  CreditCard,
  PhoneCall,
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

interface ConciergeServicesSectionProps {
  lang: Language;
  theme: Theme;
  onOpenApplication: () => void;
}

export const ConciergeServicesSection: React.FC<ConciergeServicesSectionProps> = ({
  lang,
  theme,
  onOpenApplication,
}) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  const [activeTab, setActiveTab] = useState<'all' | 'visa' | 'accommodation' | 'airport' | 'settlement'>('all');

  // بطاقات الخدمات: قائمة "ما يشمله" مطويّة افتراضياً على الجوال فقط.
  // السبب: أربع بطاقات × 3-4 بنود = ~600px من الطول بلا فائدة فورية —
  // العنوان والسعر يكفيان للقرار الأول. على md فأعلى تبقى مفتوحة كما كانت.
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const toggleCard = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'visa':
        return <FileCheck className="w-5 h-5 text-blue-400" />;
      case 'accommodation':
        return <Building2 className="w-5 h-5 text-emerald-400" />;
      case 'airport':
        return <Plane className="w-5 h-5 text-amber-400" />;
      case 'settlement':
        return <CreditCard className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredServices = activeTab === 'all' 
    ? CONCIERGE_SERVICES 
    : CONCIERGE_SERVICES.filter(s => s.category === activeTab);

  return (
    <section className={`py-16 sm:py-24 transition-colors duration-200 relative overflow-hidden ${
      isDark ? 'bg-slate-900/90 text-slate-100' : 'bg-slate-100/80 text-slate-900'
    }`} id="services-model-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header with Two-Tier Comparison Model */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 text-amber-500 border-amber-500/30">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'نموذج الشفافية الأكاديمية المطلقة' : '100% Transparent Business Model'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            {isAr ? (
              <>القبول الجامعي <span className="text-emerald-500 underline decoration-emerald-500/30">مجاني 100%</span>.. والخدمات اللوجستية باختيارك</>
            ) : (
              <>University Admission is <span className="text-emerald-500">100% Free</span>. Post-Arrival Services Optional</>
            )}
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isAr 
              ? 'في آفاق العالمية، لا نتقاضى أي أتعاب أو عمولات من الطالب مقابل تأمين القبول الجامعي المعتمد في بريطانيا وأستراليا ونيوزيلندا. وبعد صدور قبولك الرسمي، يبقى الخيار لك بالكامل لطلب خدمات ما بعد القبول المأجورة بأسعار رمزية ومحددة سلفاً.'
              : 'At Afaq Global, academic placement is 100% free with zero agent markup. Once your offer is secured, you can optionally request paid post-admission concierge services at transparent rates.'}
          </p>
        </div>

        {/* 2-Pillar Visual Model Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Pillar 1: 100% Free Academic Placement */}
          <div className={`rounded-3xl p-6 sm:p-8 border relative overflow-hidden transition-all flex flex-col justify-between ${
            isDark 
              ? 'bg-slate-950/80 border-emerald-500/40 shadow-xl shadow-emerald-950/20' 
              : 'bg-white border-emerald-300 shadow-xl shadow-emerald-100/60'
          }`}>
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-black">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-emerald-500">
                      {isAr ? '1. القبول الجامعي الأكاديمي' : '1. University Placement'}
                    </h3>
                    <div className="text-xs font-semibold text-slate-400">
                      {isAr ? 'بريطانيا • أستراليا • نيوزيلندا' : 'UK • Australia • New Zealand'}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
                  {isAr ? 'مجاني 100%' : '100% FREE'}
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isAr
                  ? 'خدمة مجانية بالكامل ومكفولة بموجب عقود تمثيل معتمدة ومباشرة مع جامعات مجموعة راسل (Russell Group) والجامعات الأسترالية الرائدة (Go8).'
                  : 'Completely free service supported directly through our direct university representative contracts.'}
              </p>

              <div className="space-y-2 md:space-y-3 pt-2">
                {[
                  isAr ? 'استشارات توجيه أكاديمي ومطابقة التخصص مع شروط الابتعاث' : 'Degree matching with GCC scholarship accreditations',
                  isAr ? 'مراجعة وتدقيق مستندات الطالب والسيرة الذاتية ورسالة الدافع' : 'SOP and document evaluation & verification',
                  isAr ? 'التقديم الرسمي للجامعات الشريكة ومتابعة لجنة القبول' : 'Direct university application lodgement',
                  isAr ? 'إصدار القبول المشروط (Conditional Offer) والنهائي' : 'Securing conditional and unconditional offers',
                  isAr ? 'دعم إصدار خطاب التأكيد الرسمي (CAS في بريطانيا / CoE في أستراليا)' : 'Assistance with CAS (UK) & CoE (Australia)'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-emerald-500/20">
              <button
                onClick={onOpenApplication}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <span>{isAr ? 'ابدأ طلب القبول الجامعي المجاني الآن' : 'Start Free Admission Process'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pillar 2: Paid Post-Admission Concierge Services */}
          <div className={`rounded-3xl p-6 sm:p-8 border relative overflow-hidden transition-all flex flex-col justify-between ${
            isDark 
              ? 'bg-slate-950/80 border-amber-500/40 shadow-xl shadow-amber-950/20' 
              : 'bg-white border-amber-300 shadow-xl shadow-amber-100/60'
          }`}>
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black">
                    <Plane className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-amber-500">
                      {isAr ? '2. تجهيزات ما بعد القبول' : '2. Post-Admission Concierge'}
                    </h3>
                    <div className="text-xs font-semibold text-slate-400">
                      {isAr ? 'اختيارية بالكامل وبأسعار شفافة' : '100% Optional & Transparent'}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
                  {isAr ? 'مأجورة واختيارية' : 'PAID / OPTIONAL'}
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isAr
                  ? 'بعد صدور قبولك الجامعي، يمكنك اختيار ما تحتاجه فقط من باقات التجهيز والراحة. لا نفرض أي خدمة إجبارية وتختار بحرية تامة.'
                  : 'You only pay for the specific logistical arrangements you choose after your unconditional offer is in hand.'}
              </p>

              <div className="space-y-3 pt-2">
                {[
                  isAr ? 'استقبال المطار الفاخر ونقل الحقائب مباشرة إلى مقر السكن' : 'VIP Airport meet, greet and luggage transfer to dorm',
                  isAr ? 'حجز وتأمين غرف السكن الجامعي الرسمي أو الإقامة العائلية' : 'Student accommodation booking (Halls & Studios)',
                  isAr ? 'تجهيز ملف التأشيرة الطلابية والتأمين الصحي وحجز البصمة' : 'Student visa filing, health insurance (OSHC/IHS) & biometrics',
                  isAr ? 'الترجمة المحلفة المعتمدة للوثائق والشهادات الأكاديمية' : 'Certified legal translations of certificates',
                  isAr ? 'المرافقة لفتح الحساب البنكي وإصدار شريحة اتصال مع باقة إنترنت' : 'Bank account opening and local SIM card onboarding'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-amber-500/20">
              <a
                href="#concierge-cards-grid"
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-colors flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30' 
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <span>{isAr ? 'استعراض أسعار وتفاصيل خدمات ما بعد القبول' : 'Browse Services & Transparent Pricing'}</span>
                <ArrowIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Detailed Service Cards Grid */}
        <div id="concierge-cards-grid" className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black">
                {isAr ? 'تفاصيل باقات ما بعد القبول الاختيارية' : 'Available Post-Admission Services'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr ? 'أسعار محددة وواضحة بدون أي مصاريف خفية' : 'Exact upfront pricing with no hidden charges'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all' 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setActiveTab('visa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'visa' 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {isAr ? 'التأشيرة' : 'Visa'}
              </button>
              <button
                onClick={() => setActiveTab('accommodation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'accommodation' 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {isAr ? 'السكن' : 'Housing'}
              </button>
              <button
                onClick={() => setActiveTab('airport')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'airport' 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {isAr ? 'المطار' : 'Airport'}
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'settlement' 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {isAr ? 'الاستقرار' : 'Settlement'}
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredServices.map((svc) => (
              <div 
                key={svc.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 hover:border-amber-500/50' 
                    : 'bg-white border-slate-200 hover:border-amber-500/50 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      {getServiceIcon(svc.category)}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {isAr ? 'اختياري بعد القبول' : 'Optional'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm leading-snug">
                      {isAr ? svc.nameAr : svc.nameEn}
                    </h4>
                    <p className={`text-xs mt-1.5 leading-relaxed line-clamp-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isAr ? svc.descriptionAr : svc.descriptionEn}
                    </p>
                  </div>

                  <div id={`svc-details-${svc.id}`} className={`space-y-1.5 pt-2 border-t border-slate-800/60 ${openCards[String(svc.id)] ? 'block' : 'hidden'} md:block`}>
                    {(isAr ? svc.includedItemsAr : svc.includedItemsEn).map((inc, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>

                  {/* مفتاح الطي — جوال فقط (md وما فوق تظهر القائمة دائماً) */}
                  <button
                    onClick={() => toggleCard(String(svc.id))}
                    aria-expanded={!!openCards[String(svc.id)]}
                    aria-controls={`svc-details-${svc.id}`}
                    className={`md:hidden w-full min-h-11 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>
                      {openCards[String(svc.id)]
                        ? (isAr ? 'إخفاء التفاصيل' : 'Hide details')
                        : (isAr
                            ? `عرض ما يشمله (${(isAr ? svc.includedItemsAr : svc.includedItemsEn).length})`
                            : `Show what's included (${(isAr ? svc.includedItemsAr : svc.includedItemsEn).length})`)}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openCards[String(svc.id)] ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">{isAr ? 'التكلفة الرمزية:' : 'Fixed Cost:'}</div>
                    <div className="text-xs font-black text-amber-500">
                      {isAr ? svc.estimatedCostAr : svc.estimatedCostEn}
                    </div>
                  </div>
                  <button
                    onClick={onOpenApplication}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition-colors"
                  >
                    {isAr ? 'طلب الخدمة' : 'Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice Banner */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
          isDark ? 'bg-blue-950/30 border-blue-800/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{isAr ? 'ملاحظة لطلبة الابتعاث الحكومي:' : 'Note for GCC Government Sponsored Students:'} </span>
            {isAr 
              ? 'إذا كنت حاصلاً على بعثة حكومية (مثل برنامج خادم الحرمين الشريفين للابتعاث أو بعثات الكويت والإمارات)، فإن رسوم التأشيرة والتأمين الصحي وتذاكر السفر تكون مغطاة من الملحقية الثقافية مباشرة، ولا حاجة لدفع أي تكاليف إضافية.'
              : 'Students with official government scholarships usually have their visa, OSHC/IHS, and tickets covered directly by their cultural attache.'}
          </div>
        </div>

      </div>
    </section>
  );
};
