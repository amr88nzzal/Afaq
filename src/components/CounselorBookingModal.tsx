import React, { useState } from 'react';
import { Language } from '../types';
import { 
  X, 
  Calendar, 
  Clock, 
  MessageSquare, 
  User, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  Video,
  Award
} from 'lucide-react';

interface CounselorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const CounselorBookingModal: React.FC<CounselorBookingModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const [selectedTopic, setSelectedTopic] = useState('uk_admission');
  const [selectedSlot, setSelectedSlot] = useState('16:00 (توقيت مكة المكرمة)');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+966 5');
  const [isBooked, setIsBooked] = useState(false);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-start overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isBooked ? (
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                <Video className="w-3.5 h-3.5" />
                <span>{isAr ? 'جلسة استشارية مرئية مجانية (1-on-1)' : '1-on-1 Free Video Consultation'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'احجز استشارة مع مستشارك الأكاديمي' : 'Book an Academic Advising Session'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? '30 دقيقة للإجابة على كافة أسئلتك حول التخصص، الابتعاث، وتأشيرة السفر' : '30-minute tailored strategy session for your study abroad goals'}
              </p>
            </div>

            {/* Topic selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'موضوع الجلسة الاستشارية:' : 'Consultation Topic:'}
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="uk_admission">{isAr ? 'قبولات بريطانيا ومجموعة راسل (Russell Group)' : 'UK Admissions & Russell Group'}</option>
                <option value="au_nz">{isAr ? 'قبولات أستراليا ونيوزيلندا وفرص العمل بعد التخرج' : 'Australia & New Zealand Placement'}</option>
                <option value="scholarship">{isAr ? 'شروط الابتعاث الحكومي الخليجي ومسار الرواد' : 'GCC Government Scholarship Support'}</option>
                <option value="visa">{isAr ? 'متطلبات وإجراءات الفيزا الطلابية والسكن' : 'Student Visa & Relocation Support'}</option>
              </select>
            </div>

            {/* Date & Time Slot */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'الموعد المفضل (توقيت مكة المكرمة / دبي):' : 'Preferred Time Slot:'}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['اليوم 04:00 عصراً', 'اليوم 06:30 مساءً', 'غداً 11:00 صباحاً', 'غداً 05:00 عصراً'].map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                      selectedSlot === slot 
                        ? 'bg-amber-500 text-slate-950 border-amber-400' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'الاسم:' : 'Your Name:'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'مثال: عبد الله السبيعي' : 'e.g. Abdullah'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'رقم الواتساب لإرسال رابط الاجتماع:' : 'WhatsApp for Meeting Link:'}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'تأكيد الحجز المجاني' : 'Confirm Free Session'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white">
              {isAr ? 'تم تأكيد موعد جلستك بنجاح!' : 'Session Confirmed!'}
            </h3>

            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {isAr 
                ? `تم حجز موعدك (${selectedSlot})، وتم إرسال رابط Google Meet وتفاصيل الجلسة إلى رقم الواتساب ${phone}.`
                : `Your session (${selectedSlot}) is confirmed. Meeting details sent to ${phone}.`}
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
