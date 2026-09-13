/**
 * ============================================================================
 * خدمة إرسال تنبيهات تلغرام للمدراء (Telegram Bot Notification Service)
 * ============================================================================
 * هذا الملف مسؤول عن:
 * 1. إرسال إشعارات فورية لقناة أو مجموعة المدراء على تطبيق Telegram.
 * 2. دعم التنسيق النصي (Markdown) ورموز المشاعر والأزرار التفاعلية.
 * 3. العمل بسلاسة عند توفر الـ Token أو العمل في وضع التسجيل (Simulated Logging).
 */

import dotenv from 'dotenv';

dotenv.config();

export interface TelegramAlertData {
  applicationNumber: string;
  studentName: string;
  phone: string;
  email: string;
  countryDestination: string;
  studyLevel: string;
  preferredMajor: string;
  preferredUniversity?: string;
}

/**
 * إرسال إشعار فوري لمدراء النظام عبر بوت التلغرام
 */
export async function sendTelegramNotification(
  data: TelegramAlertData,
  customToken?: string,
  customChatId?: string
): Promise<{ success: boolean; message: string }> {
  const token = customToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  const destinationMap: Record<string, string> = {
    uk: 'المملكة المتحدة 🇬🇧',
    australia: 'أستراليا 🇦🇺',
    new_zealand: 'نيوزيلندا 🇳🇿',
  };

  const destinationText = destinationMap[data.countryDestination] || data.countryDestination;

  // نص الرسالة بصيغة Markdown
  const text = `
🚨 *إشعار إداري فوري: طلب قبول جامعي جديد!*
━━━━━━━━━━━━━━━━━━━━
🎓 *رقم الطلب:* \`${data.applicationNumber}\`
👤 *اسم الطالب:* ${data.studentName}
📞 *رقم الجوال:* \`${data.phone}\`
📧 *البريد:* ${data.email}
🌍 *الوجهة المختارة:* ${destinationText}
📚 *المرحلة:* ${data.studyLevel}
🎯 *التخصص المطلوب:* ${data.preferredMajor || 'غير محدد'}
🏛️ *الجامعة:* ${data.preferredUniversity || 'استشارة مفتوحة'}
━━━━━━━━━━━━━━━━━━━━
🌐 *الموقع:* [afaq-global.amrodev.com](https://afaq-global.amrodev.com/#admin)
  `.trim();

  if (!token || !chatId) {
    console.log(`🤖 [Telegram Simulated] إشعار تلغرام للمدراء للطلب (${data.applicationNumber} - ${data.studentName})`);
    return {
      success: true,
      message: 'تم تسجيل إشعار تلغرام (بانتظار إدخال TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID في .env)',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const result: any = await response.json();

    if (result.ok) {
      console.log(`✅ [Telegram Sent] تم إرسال إشعار تلغرام بنجاح للطلب: ${data.applicationNumber}`);
      return { success: true, message: 'Telegram alert sent successfully' };
    } else {
      console.warn('⚠️ [Telegram Warning] خطأ من خادم تلغرام:', result.description);
      return { success: false, message: result.description };
    }
  } catch (error: any) {
    console.error('❌ [Telegram Error] فشل الاتصال بتلغرام:', error.message);
    return { success: false, message: error.message };
  }
}
