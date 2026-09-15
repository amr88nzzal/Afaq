import React, { useState, useEffect } from 'react';
import { MeetingEntity, Language, Theme } from '../types';
import { fetchMeetingsAPI, updateMeetingAPI, bookMeetingAPI } from '../services/api';
import { Calendar, Video, Phone, Check, Clock, X, ExternalLink, Loader2, User, Plus } from 'lucide-react';

interface MeetingsManagerProps {
  lang: Language;
  theme: Theme;
}

export const MeetingsManager: React.FC<MeetingsManagerProps> = ({ lang, theme }) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [meetings, setMeetings] = useState<MeetingEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingEntity | null>(null);
  const [form, setForm] = useState({
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'no_show',
    meeting_link: '',
    notes: '',
  });

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMeetingsAPI();
      setMeetings(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const openEdit = (m: MeetingEntity) => {
    setEditingMeeting(m);
    setForm({
      status: m.status,
      meeting_link: m.meeting_link || '',
      notes: m.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    await updateMeetingAPI(editingMeeting.id, form);
    setToast(isAr ? 'تم تحديث الموعد بنجاح' : 'Meeting updated');
    setIsModalOpen(false);
    await loadMeetings();
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>{isAr ? 'مواعيد الاستشارات وجلسات الإرشاد' : 'Consultation Appointments'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr ? 'جدول الجلسات الافتراضية، روابط Google Meet، وتحديث حالات المواعيد' : 'Manage online consultation sessions and Google Meet links'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{isAr ? 'جاري تحميل المواعيد...' : 'Loading appointments...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                    m.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : m.status === 'cancelled'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {m.status === 'completed' ? (isAr ? 'مكتملة' : 'Completed') : m.status === 'cancelled' ? (isAr ? 'ملغية' : 'Cancelled') : (isAr ? 'مجدولة' : 'Scheduled')}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{m.meeting_date} - {m.meeting_time}</span>
                  </span>
                </div>

                <h3 className="text-base font-black flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-500" />
                  <span>{m.customer_name}</span>
                </h3>
                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <p>{m.customer_email}</p>
                  <p>{m.customer_phone}</p>
                  {m.destination_country && (
                    <p className="text-amber-400 font-semibold">{isAr ? 'الوجهة:' : 'Destination:'} {m.destination_country}</p>
                  )}
                  {m.counselor_name && (
                    <p className="text-indigo-400">{isAr ? 'المستشار:' : 'Counselor:'} {m.counselor_name}</p>
                  )}
                </div>

                {m.meeting_link && (
                  <a
                    href={m.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/25 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رابط الجلسة (Google Meet)' : 'Open Meet Link'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/60 mt-4">
                <button
                  onClick={() => openEdit(m)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-amber-400 text-xs font-bold transition-colors"
                >
                  {isAr ? 'تعديل الحالة / الرابط' : 'Edit Status / Link'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'تحديث موعد الاستشارة' : 'Update Appointment'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'حالة الموعد' : 'Status'}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                >
                  <option value="scheduled">{isAr ? 'مجدولة (Scheduled)' : 'Scheduled'}</option>
                  <option value="completed">{isAr ? 'مكتملة (Completed)' : 'Completed'}</option>
                  <option value="cancelled">{isAr ? 'ملغية (Cancelled)' : 'Cancelled'}</option>
                  <option value="no_show">{isAr ? 'لم يحضر الطالب' : 'No Show'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'رابط جلسة الفيديو (Google Meet / Zoom)' : 'Video Link'}</label>
                <input
                  type="url"
                  value={form.meeting_link}
                  onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'ملاحظات المستشار' : 'Notes'}</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ التحديث' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
