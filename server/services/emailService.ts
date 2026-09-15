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

/**
 * إرسال بريد ترحيبي رسمي للطالب يحتوي على بيانات الدخول لبوابة متابعة طلبه
 */
export async function sendStudentCredentialsEmail(data: {
  studentName: string;
  studentEmail: string;
  applicationNumber: string;
  portalPassword: string;
  destination: string;
  universityName?: string;
  counselorName?: string;
}): Promise<{ success: boolean; message: string }> {
  const portalUrl = 'https://afaq-global.amrodev.com/#student-portal';

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 28px; text-align: center; }
        .badge { display: inline-block; background-color: #10b981; color: #ffffff; font-weight: bold; font-size: 12px; padding: 4px 14px; border-radius: 9999px; margin-bottom: 10px; }
        .content { padding: 28px; line-height: 1.7; }
        .cred-card { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 20px; margin: 20px 0; text-align: center; }
        .cred-label { font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 4px; }
        .cred-val { font-family: monospace; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 2px; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 900; font-size: 15px; margin-top: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">القبول الجامعي مجاني 100% ✨</div>
          <h2 style="margin: 0; font-size: 22px;">أهلاً بك في آفاق العالمية للخدمات التعليمية</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">بوابتك المعتمدة للجامعات العريقة</p>
        </div>
        <div class="content">
          <p style="font-size: 16px;">مرحباً <strong>${data.studentName}</strong>،</p>
          <p>يسرنا إبلاغك بأنه تم تسجيل واستلام طلب قبولك الأكاديمي بنجاح، وتعيين مستشار أكاديمي مختص لمتابعة ملفك لدى عمادات القبول بالجامعات الشريكة.</p>
          
          <div class="cred-card">
            <div style="margin-bottom: 14px;">
              <div class="cred-label">رقم الطلب الخاص بك (Application Number):</div>
              <div class="cred-val" style="color: #d97706;">${data.applicationNumber}</div>
            </div>
            <div>
              <div class="cred-label">كلمة المرور الافتراضية لبوابة الطالب (Portal Password):</div>
              <div class="cred-val" style="color: #2563eb;">${data.portalPassword}</div>
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            💡 يمكنك استخدام هذه البيانات للدخول إلى صفحة متابعة طلبك في أي وقت، ومتابعة المراحل السبعة لصدور القبول والفيزا، ورفع مستنداتك واستلام عروض الجامعات.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${portalUrl}" class="btn">الدخول إلى بوابة متابعة طلبي الآن</a>
          </div>
        </div>
        <div class="footer">
          إذا كانت لديك أي استفسارات، يمكنك التواصل مع مستشارك المباشر عبر الواتساب أو الرد على هذا البريد الإلكتروني.<br>
          © 2026 آفاق العالمية للخدمات التعليمية والقبولات الجامعية
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`📨 [Email Simulated] إرسال بيانات دخول الطالب إلى [${data.studentEmail}]: طلب ${data.applicationNumber} - كلمة المرور: ${data.portalPassword}`);
    return {
      success: true,
      message: 'تم إرسال بيانات الدخول (وضع المحاكاة)',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Afaq Global Admissions" <${GMAIL_USER}>`,
      to: data.studentEmail,
      subject: `🎓 بيانات دخول بوابة متابعة طلبك [${data.applicationNumber}] - آفاق العالمية`,
      html: htmlContent,
    });
    console.log(`✅ [Student Email Sent] تم إرسال بيانات الدخول للطالب (${data.studentEmail}): ${info.messageId}`);
    return { success: true, message: `Credentials email sent: ${info.messageId}` };
  } catch (error: any) {
    console.error('❌ [Student Email Error] فشل إرسال بريد بيانات الدخول للطالب:', error.message);
    return { success: false, message: error.message };
  }
}

export async function sendStatusUpdateNotification(data: {
  applicationNumber: string;
  studentName: string;
  studentEmail: string;
  newStatus: string;
  statusLabelAr?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a;">تحديث حالة طلب القبول [${data.applicationNumber}]</h2>
        <p>عزيزي <strong>${data.studentName}</strong>،</p>
        <p>تم تحديث حالة طلب قبولك الأكاديمي إلى: <span style="font-weight: bold; color: #d97706;">${data.statusLabelAr || data.newStatus}</span></p>
        ${data.notes ? `<p style="background: #f1f5f9; padding: 12px; border-radius: 8px;"><strong>ملاحظات المستشار:</strong> ${data.notes}</p>` : ''}
        <p>يمكنك تسجيل الدخول إلى بوابة الطالب لمتابعة كافة تفاصيل القبول ومراحله.</p>
        <p style="color: #64748b; font-size: 12px;">آفاق العالمية للخدمات التعليمية</p>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`📨 [Email Simulated] إشعار تحديث الحالة إلى [${data.studentEmail}]: ${data.newStatus}`);
    return { success: true, message: 'Status notification sent (simulated)' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Afaq Global Admissions" <${GMAIL_USER}>`,
      to: data.studentEmail,
      subject: `🔔 تحديث حالة طلبك الجامعي [${data.applicationNumber}] - آفاق العالمية`,
      html: htmlContent,
    });
    return { success: true, message: `Status update email sent: ${info.messageId}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * إرسال خطاب/رد رسمي مخصص إلى بريد الطالب من قبل المستشار الأكاديمي
 */
export async function sendCustomStudentEmailResponse(data: {
  studentName: string;
  studentEmail: string;
  applicationNumber: string;
  messageText: string;
}): Promise<{ success: boolean; message: string }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 24px; text-align: center; }
        .badge { display: inline-block; background-color: #d97706; color: #ffffff; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px; }
        .content { padding: 24px; line-height: 1.7; font-size: 14px; }
        .msg-box { background: #f1f5f9; border-right: 4px solid #d97706; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; white-space: pre-wrap; color: #0f172a; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">إشعار رسمي من قسم القبول والابتعاث 🎓</div>
          <h2 style="margin: 0; font-size: 20px;">آفاق العالمية للخدمات التعليمية</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">متابعة طلب القبول رقم: ${data.applicationNumber}</p>
        </div>
        <div class="content">
          <p>عزيزي الطالب <strong>${data.studentName}</strong>،</p>
          <p>أرسل لك قسم القبول والمتابعة الأكاديمية الرد الرسمي التالي بشأن طلبك:</p>
          
          <div class="msg-box">
            ${data.messageText}
          </div>

          <p style="font-size: 13px; color: #64748b;">
            💡 يمكنك مراجعة المستندات والرد مباشرة عبر تسجيل الدخول إلى <a href="https://afaq-global.amrodev.com/#student-portal" style="color: #d97706; font-weight: bold;">بوابة الطالب الخاصة بك</a>.
          </p>
        </div>
        <div class="footer">
          آفاق العالمية للخدمات التعليمية والقبولات الجامعية<br>
          © 2026 Afaq Global Education
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`📨 [Email Simulated] تم إرسال الخطاب الرسمي للطالب [${data.studentEmail}]: ${data.messageText}`);
    return { success: true, message: 'تم تسجيل الإيميل بنجاح (وضع المحاكاة الخادمي)' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Afaq Global Admissions" <${GMAIL_USER}>`,
      to: data.studentEmail,
      subject: `📧 إشعار رسمي من آفاق بشأن طلبك رقم [${data.applicationNumber}]`,
      html: htmlContent,
    });
    console.log(`✅ [Custom Email Sent] تم إرسال البريد للطالب (${data.studentEmail}) بنجاح: ${info.messageId}`);
    return { success: true, message: `Email sent successfully: ${info.messageId}` };
  } catch (error: any) {
    console.error('❌ [Custom Email Error] فشل إرسال البريد للطالب:', error.message);
    return { success: false, message: error.message };
  }
}


