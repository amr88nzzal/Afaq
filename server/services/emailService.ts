/**
 * ============================================================================
 * خدمة إرسال البريد الإلكتروني عبر Gmail SMTP (Gmail Email Notification Service)
 * ============================================================================
 * هذا الملف مسؤول عن:
 * 1. الاتصال بخادم Gmail SMTP باستخدام حساب جيميل وكلمة مرور التطبيقات (App Password).
 * 2. صياغة قوالب بريد HTML فاخرة باللغتين العربية والإنجليزية.
 * 3. إرسال تنبيه فوري للإدارة وأولياء الأمور بمجرد تقديم طلب تسجيل جديد.
 */

import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// قراءة إعدادات الجيميل من متغيرات البيئة
const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || 'admissions@afaq-global.amrodev.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
const ADMIN_EMAILS = process.env.ADMIN_NOTIFICATION_EMAILS || 'admin@amrodev.com, amr.nzzal@gmail.com';

// إنشاء ناقل البريد (Transporter)
let transporter: Transporter | null = null;

if (GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
  console.log(`📧 [EmailService] تم تهيئة بريد Gmail للإرسال عبر الحساب: ${GMAIL_USER}`);
} else {
  console.log('ℹ️ [EmailService] لم يتم إدخال GMAIL_APP_PASSWORD بعد. سيتم تشغيل التنبيهات في وضع المحاكاة والتسجيل.');
}

export interface ApplicationEmailPayload {
  applicationNumber: string;
  studentName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  countryDestination: string;
  studyLevel: string;
  preferredMajor: string;
  preferredUniversity?: string;
  gpa?: string;
  highSchoolType?: string;
}

/**
 * إرسال بريد إلكتروني للإدارة عند وصول طلب قبول جامعي جديد
 */
export async function sendNewApplicationEmailToAdmin(data: ApplicationEmailPayload): Promise<{ success: boolean; message: string }> {
  const destinationMap: Record<string, string> = {
    uk: 'المملكة المتحدة 🇬🇧 (بريطانيا)',
    australia: 'أستراليا 🇦🇺',
    new_zealand: 'نيوزيلندا 🇳🇿',
  };

  const levelMap: Record<string, string> = {
    bachelor: 'بكالوريوس (Bachelor)',
    master: 'ماجستير (Master)',
    phd: 'دكتوراه (PhD)',
    foundation: 'سنة تحضيرية (Foundation Year)',
    language: 'دورة لغة إنجليزية مكثفة (English Course)',
  };

  const destinationText = destinationMap[data.countryDestination] || data.countryDestination;
  const levelText = levelMap[data.studyLevel] || data.studyLevel;

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 24px; text-align: center; }
        .badge { display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px; }
        .content { padding: 24px; line-height: 1.6; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px; }
        .info-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-table td.label { font-weight: bold; color: #64748b; width: 35%; }
        .info-table td.value { color: #0f172a; font-weight: 600; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">طلب قبول جامعي جديد ✨</div>
          <h2 style="margin: 0; font-size: 20px;">آفاق العالمية للخدمات التعليمية</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">afaq-global.amrodev.com</p>
        </div>
        <div class="content">
          <p>السلام عليكم ورحمة الله وبركاته،</p>
          <p>وصل طلب تسجيل جامعي جديد عبر المنصة الإلكترونية، والتفاصيل كالتالي:</p>
          
          <table class="info-table">
            <tr>
              <td class="label">رقم الطلب:</td>
              <td class="value" style="color: #d97706;">${data.applicationNumber}</td>
            </tr>
            <tr>
              <td class="label">اسم الطالب:</td>
              <td class="value">${data.studentName}</td>
            </tr>
            <tr>
              <td class="label">رقم الهاتف:</td>
              <td class="value" dir="ltr" style="text-align: right;">${data.phone}</td>
            </tr>
            <tr>
              <td class="label">البريد الإلكتروني:</td>
              <td class="value" dir="ltr" style="text-align: right;">${data.email}</td>
            </tr>
            <tr>
              <td class="label">الدولة المستهدفة:</td>
              <td class="value">${destinationText}</td>
            </tr>
            <tr>
              <td class="label">المرحلة الدراسية:</td>
              <td class="value">${levelText}</td>
            </tr>
            <tr>
              <td class="label">التخصص المطلوب:</td>
              <td class="value">${data.preferredMajor || 'لم يحدد بعد'}</td>
            </tr>
            <tr>
              <td class="label">الجامعة المرغوبة:</td>
              <td class="value">${data.preferredUniversity || 'استشارة مفتوحة'}</td>
            </tr>
            ${data.gpa ? `<tr><td class="label">المعدل التراكمي (GPA):</td><td class="value">${data.gpa}</td></tr>` : ''}
          </table>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://afaq-global.amrodev.com/#admin" class="btn">الدخول إلى لوحة إدارة الطلبات (CRM)</a>
          </div>
        </div>
        <div class="footer">
          هذه رسالة آلية تم إرسالها من منصة آفاق التعليمية (Afaq Global) إلى مدراء النظام والمستشارين المعتمدين.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`📨 [Email Simulated] إشعار بريدي صادر إلى [${ADMIN_EMAILS}] للطلب (${data.applicationNumber} - ${data.studentName})`);
    return {
      success: true,
      message: 'تم تسجيل إشعار البريد (وضع المحاكاة - بانتظار إدخال GMAIL_APP_PASSWORD في ملف .env)',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Afaq Global Admissions" <${GMAIL_USER}>`,
      to: ADMIN_EMAILS,
      subject: `🎓 طلب جديد [${data.applicationNumber}] - ${data.studentName} (${destinationText})`,
      html: htmlContent,
    });
    console.log(`✅ [Email Sent] تم إرسال إيميل التنبيه بنجاح. معرف الرسالة: ${info.messageId}`);
    return { success: true, message: `Email sent successfully: ${info.messageId}` };
  } catch (error: any) {
    console.error('❌ [Email Error] فشل إرسال البريد الإلكتروني:', error.message);
    return { success: false, message: error.message };
  }
}
