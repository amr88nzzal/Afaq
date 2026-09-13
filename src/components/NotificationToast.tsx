import React from 'react';
import { X, ExternalLink, MessageCircle, Send, Mail } from 'lucide-react';
import { Language } from '../types';

export interface NotificationPayload {
  id: string;
  channel: 'whatsapp' | 'telegram' | 'email';
  title: string;
  body: string;
  timestamp: string;
}

interface NotificationToastProps {
  notification: NotificationPayload | null;
  onDismiss: () => void;
  lang: Language;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  lang,
}) => {
  if (!notification) return null;
  const isAr = lang === 'ar';

  const channelConfig = {
    whatsapp: {
      bgColor: 'bg-emerald-950/95 border-emerald-500/50',
      badgeBg: 'bg-emerald-500 text-slate-950',
      icon: '💬',
      channelName: isAr ? 'واتساب الرسمي' : 'Official WhatsApp',
    },
    telegram: {
      bgColor: 'bg-sky-950/95 border-sky-500/50',
      badgeBg: 'bg-sky-500 text-slate-950',
      icon: '✈️',
      channelName: isAr ? 'بوت التلغرام الآلي' : 'Telegram Bot',
    },
    email: {
      bgColor: 'bg-amber-950/95 border-amber-500/50',
      badgeBg: 'bg-amber-500 text-slate-950',
      icon: '✉️',
      channelName: isAr ? 'البريد الإلكتروني الرسمي' : 'Official Email',
    }
  }[notification.channel];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slideUp">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${channelConfig.bgColor} text-start relative`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow">
              {channelConfig.icon}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${channelConfig.badgeBg}`}>
                  {channelConfig.channelName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {notification.timestamp}
                </span>
              </div>

              <div className="text-xs font-bold text-white">
                {notification.title}
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {notification.body}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">
            {isAr ? 'تم إرسال هذا التنبيه الفوري بنجاح' : 'Push alert delivered successfully'}
          </span>
          <button 
            onClick={onDismiss}
            className="text-amber-400 hover:underline font-bold"
          >
            {isAr ? 'تم الاستلام' : 'Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
};
