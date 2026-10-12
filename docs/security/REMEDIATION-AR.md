<!--
  ملاحظة: هذا التقرير أُعِدّ في جلسة مراجعة منفصلة، ويشير إلى مسارات محلية
  (مثل afaq-audit/ وملف afaq-security-fixes.patch) لم تُرفع إلى المستودع
  لأن التغييرات نفسها مُطبَّقة بالفعل على الفرع security-fixes.
  المحتوى تقني كامل ومُتحقَّق منه كما هو.
-->
# الإصلاحات الأمنية المنفّذة — مشروع Afaq

**مرافقة للتقرير:** [التقرير-الأمني.md](التقرير-الأمني.md)
**الملف الجاهز للتطبيق:** `afaq-security-fixes.patch`
**الحالة:** مُطبَّقة ومُتحقَّق منها بالتشغيل الفعلي ✅

---

## 1. كيف تطبّق الإصلاحات

```bash
cd /path/to/Afaq
git checkout -b security-fixes

# تحقّق أولاً أن الـ patch يُطبَّق بلا تعارض
git apply --check afaq-security-fixes.patch

# طبّقه
git apply afaq-security-fixes.patch

# ثبّت واختبر
npm install
npx tsc --noEmit      # يجب أن ينتهي بصفر أخطاء
npm run dev
```

> إن ظهر تعارض لأن `main` تغيّر بعد جرد الكود (`6432722`)، طبّق الملفات يدوياً — القائمة الكاملة في القسم 6.

---

## 2. متغيّرات بيئة جديدة (إلزامية)

أضِف إلى ملف `.env` على السيرفر (وانظر `.env.example` المحدَّث):

| المتغيّر | الوصف | إلزامي؟ |
|----------|-------|---------|
| `INITIAL_ADMIN_PASSWORD` | كلمة مرور المدير الأول، 8 أحرف على الأقل. تُشفَّر وتُخزَّن عند أول إقلاع فقط | **نعم** |
| `DATABASE_URL` | صار إلزامياً بلا قيمة افتراضية مثبتة في الكود | نعم (إن استخدمت PostgreSQL) |
| `PG_SSL` | `true` لتفعيل TLS لقاعدة البيانات | لا |
| `PG_SSL_REJECT_UNAUTHORIZED` | `false` لتعطيل التحقق (تطوير محلي فقط) | لا |
| `PG_SSL_CA` | شهادة CA عند استخدام شهادة موقّعة ذاتياً | لا |

**مهم:** لم يُضَف أي متغيّر جديد للجلسات، لأن رموز الجلسة تُولَّد عشوائياً في الذاكرة — لا يوجد مفتاح توقيع تحتاج إدارته.

---

## 3. أول تشغيل بعد التطبيق

1. انسخ `.env.example` إلى `.env` واضبط `DATABASE_URL` و `INITIAL_ADMIN_PASSWORD`.
2. شغّل الخادم. سيحدث التالي تلقائياً:
   - **أي حساب بكلمة مرور مخزّنة كنص صريح يُقفل** (تُستبدل بـ `!`) ويُطبع عددها في السجل.
   - **حساب المدير الأول المقفل يُهيّأ** من `INITIAL_ADMIN_PASSWORD` (يُشفَّر بـ scrypt).
3. سجّل الدخول بالمدير، ثم:
   - أنشئ حسابات الموظفين من تبويب «إدارة المستخدمين» (كلمات مرور جديدة تُشفَّر تلقائياً).
   - لكل طالب: استخدم زر **«إصدار كلمة مرور جديدة»** — كلمة المرور القديمة غير قابلة للاسترجاع لأنها لم تعد مخزّنة نصاً صريحاً.

> إن لم تضبط `INITIAL_ADMIN_PASSWORD` عند التشغيل بدون قاعدة بيانات، سيُولَّد مدير مؤقت وتُطبع كلمة مروره مرة واحدة في سجل الخادم.
>
> **ملاحظة:** في وضع الذاكرة (بلا PostgreSQL) تُحفظ البيانات في `server/data/store.json`. لذلك إذا غيّرت `INITIAL_ADMIN_PASSWORD` بعد أول تشغيل فلن تُطبَّق (لأن كلمة المرور صارت مخزّنة ومُشفَّرة). لتغييرها: إما غيّرها من لوحة التحكم، أو احذف `server/data/store.json` وأعد التشغيل.

---

## 4. تصحيحات خاصة ببيئة النشر: Cloudflare Tunnel + Zero Trust

بيئتك (نفق Cloudflare + Zero Trust + إيقاف كل المنافذ وإبقاء SSH) **تُغيّر تقييم ثلاث نتائج** في التقرير، لكنها كشفت أيضاً **خللين حقيقيين** أُصلحا:

### أ) خلل `X-Forwarded-Proto` (كان يُعطّل اكتشاف HTTPS) — أُصلح ✅

**الملف:** `afaq-frontend/nginx.conf`

```nginx
# ❌ كان:
proxy_set_header X-Forwarded-Proto $scheme;   # يستبدل "https" القادمة من Cloudflare بـ "http"
```

سلسلة الطلب عندك: `المتصفح ──TLS──> Cloudflare ──نفق──> cloudflared ──http محلي──> nginx ──> Express`

فـ `$scheme` داخل nginx تساوي دائماً `http` (لأن cloudflared يتصل محلياً بلا TLS)، وهذا **يمحو** قيمة `https` التي أرسلتها Cloudflare. النتيجة: الخادم يعتقد أن كل الطلبات HTTP حتى وهي HTTPS — فيفشل `req.secure`، ولا تُرسل ترويسة HSTS، وقد يُفسد منطق كوكي `Secure` في أي إعداد مستقبلي.

**الإصلاح:** `map` يحافظ على القيمة الواردة من Cloudflare ويرجع إلى `$scheme` فقط عند غيابها:
```nginx
map $http_x_forwarded_proto $afaq_forwarded_proto {
    default $http_x_forwarded_proto;
    ""      $scheme;
}
```
مع تمرير `CF-Connecting-IP` صراحةً إلى الخادم.

### ب) تجاوز تحديد المعدّل بتزوير `X-Forwarded-For` — أُصلح ✅

**الملف:** `server/middleware/security.ts`

كان محدّد المعدّل يقرأ **أول** عنصر في `X-Forwarded-For`. والمشكلة أن Cloudflare **تُضيف** عنوان العميل إلى أي `X-Forwarded-For` موجودة في الطلب، فأي مهاجم يرسل `X-Forwarded-For: 1.2.3.4` يجعل أول عنصر عنواناً مزوّراً → **كل محاولة تبدو من عميل مختلف → تجاوز كامل للحجب**.

**الإصلاح:** الاعتماد على `CF-Connecting-IP` التي تكتبها حافة Cloudflare وتستبدلها دائماً (غير قابلة للتزوير)، ثم `X-Real-IP`، ثم **آخر** عنصر في XFF (أقرب قفزة) بدل الأول.

### ج) `trust proxy` صار قابلاً للضبط

أُضيف `TRUST_PROXY` كمتغيّر بيئة (افتراضياً `1` = nginx). لا يؤثر على تحديد المعدّل بعد الإصلاح (ب) لأنه لا يعتمد على `req.ip`.

### د) إعادة تقييم ثلاث نتائج في ضوء بيئتك

| المعرّف | التقييم السابق | التقييم الفعلي في بيئتك |
|---------|----------------|--------------------------|
| **H1** (لا TLS) | 🟠 عالية | 🟡 **منخفضة** — النفق يشفّر المتصفح↔Cloudflare، والجزء الوحيد غير المشفّر هو `cloudflared→nginx` داخل نفس المضيف ولا يمرّ على شبكة. المتبقّي: فعّل HSTS و*Always Use HTTPS* و*Minimum TLS 1.2* من لوحة Cloudflare |
| **H2** (منفذ 5432) | 🟠 عالية | 🟡 **منخفضة-متوسطة** — التفاصيل الحاسمة أدناه |
| **H3** (كلمة مرور القاعدة) | 🟠 عالية | 🔴 **تبقى عالية** — Cloudflare Tunnel لا يحمي من كلمة مرور مكشوفة في مستودع عام |

### هـ) ⚠️ تنبيه حاسم بخصوص "إيقاف المنافذ" مع Docker

قلت إنك أوقفت المنافذ على السيرفر وأبقيت SSH. **هذا يعتمد كلياً على طريقة الإيقاف:**

> 🔴 **Docker يتجاوز `ufw`/`firewalld`.** Docker يُدرج قواعده في سلسلة `iptables` الخاصة به (DOCKER / DOCKER-USER / FORWARD) ولا تمرّ عبر قواعد `INPUT` التي يكتبها `ufw`. لذلك منفذ منشور بـ `ports:` في `docker-compose.yml` **يبقى مفتوحاً من الإنترنت حتى لو كان `ufw` يمنعه**.

النتيجة حسب حالتك:

| كيف أوقفت المنافذ؟ | هل كان 5432 مكشوفاً فعلاً؟ |
|--------------------|---------------------------|
| **Cloud Security Group / Firewall** من مزوّد السحابة | ✅ **آمن** — الفلترة تحدث قبل وصول الحزمة للجهاز، فتُبطل قواعد Docker |
| **`ufw` أو `firewalld` داخل السيرفر** | 🔴 **كان مكشوفاً** (إن كان للسيرفر IP عام) |
| السيرفر بلا IP عام (خلف NAT/CGNAT) | ✅ آمن عملياً |

Cloudflare Tunnel **لا** يسدّ هذه الثغرة: النفق يمرّر أسماء نطاقات محدّدة فقط، لكن Docker ينشر المنفذ على واجهة المضيف مباشرة، **مستقلاً تماماً عن النفق**.

**لهذا إزالة `ports: ["5432:5432"]` ليست تجميلاً** — هي الفرق بين "آمن" و"مكشوف" في الحالتين 🟠 أعلاه. وتحقّق بنفسك من داخل السيرفر:

```bash
# اعرض المنافذ المنشورة فعلاً من Docker
docker ps --format '{{.Names}}\t{{.Ports}}'
# واعرض قواعد iptables التي أدرجها Docker
sudo iptables -t nat -L DOCKER -n
```

وإن أردت إصلاحاً جذرياً لقاعدة ufw مع Docker، أضف إلى `/etc/docker/daemon.json`:
```json
{ "iptables": false }
```
⚠️ لكن هذا **يُعطّل شبكة Docker الداخلية** إن لم تضبط القواعد يدوياً — لا تفعله إلا إن كنت مرتاحاً لإدارة iptables بنفسك. الحل الأسلم هو الاعتماد على Cloud Security Group + عدم نشر أي منفذ إلا `127.0.0.1`.

### و) تحسين مستحسن: صفر منافذ منشورة

إن كان `cloudflared` يعمل كحاوية في نفس شبكة `afaq_internal_net`، فيمكنك **إزالة `ports` نهائياً** من `afaq_frontend` وتوجيه النفق إلى `http://afaq_frontend:80`. وبذلك لا يبقى أي منفذ منشور على المضيف إطلاقاً.

ولأنك أبقيت SSH فقط: إن كان `cloudflared` على المضيف لا في Docker، فالربط الآن على `127.0.0.1:3000:80` بدل `3000:80` (لئلا يُنشر على كل الواجهات).

### ز) Zero Trust — تحقّق من مسارات الإدارة

إن كان لديك سياسة Cloudflare Access، فاجعلها تحمي مسارات الإدارة (مثل `/#admin` و`/api/users*`) كطبقة ثانية. لكن **لا تعتمد عليها وحدها** — المصادقة داخل التطبيق التي بنيناها تبقى الأساس، لأن سياسات Access تُطبَّق على مستوى النطاق وقد تُضبط خطأً أو تُعطَّل.

---

## 5. جدول الإصلاحات (مقابل معرّفات التقرير)

| المعرّف | ما أُصلح | الملفات الرئيسية |
|---------|----------|------------------|
| **C1** | مصادقة وصلاحيات على كل المسارات: `requireAuth` / `requireStaff` / `requireAdmin` | `server/middleware/auth.ts` (جديد)، `server.ts`، وكل ملفات `server/routes/*` |
| **C2** | حذف كلمتي المرور العامّتين `afaq2026` و `admin123` من الخادم والواجهة | `server/routes/usersRoutes.ts`، `src/components/StaffDashboard.tsx` |
| **C3** | تشفير كلمات المرور بـ scrypt + ترحيل تلقائي + قفل كل قيمة نصية قديمة | `server/services/passwordService.ts` (جديد)، `server/db.ts`، ملفات SQL الثلاثة |
| **C4** | حذف `OR $2 = '123456'`، وإلغاء تسريب كلمة المرور، وتوليد كلمات قوية عشوائية | `server/routes/applicationsRoutes.ts`، `server/services/passwordService.ts` |
| **C5** | منع خدمة `uploads` كملفات ثابتة + فحص ملكية + نقل التخزين خارج `public/` | `server.ts`، `server/utils/fileStorage.ts`، `afaq-frontend/nginx.conf` |
| **C6** | إزالة الاعتماد على `sessionStorage` ومنطق `fallbackUser` وأزرار الدخول السريع | `src/components/StaffDashboard.tsx`، `src/App.tsx`، `src/services/api.ts` |
| **C7** | منع بناء مسار الملف من مدخلات العميل — مرجع مجرّد `upload:<uuid>` + تحقق مسار | `server/utils/fileStorage.ts`، `server/routes/applicationsRoutes.ts` |
| **H1** | HTTPS ورؤوس أمان: CSP، HSTS، X-Frame-Options، nosniff، Referrer-Policy، Permissions-Policy | `server/middleware/security.ts` (جديد)، `afaq-frontend/nginx.conf` |
| **H2** | إزالة `ports: ["5432:5432"]` من قاعدة البيانات | `docker-compose.yml` |
| **H3** | إزالة كلمة مرور قاعدة البيانات المثبتة من الكود ومن `.env.example` | `server/db.ts`، `.env.example` |
| **H4** | تحقق من نوع الملف بالتوقيع الثنائي + قائمة بيضاء + حد 10MB + `attachment` بدل `inline` | `server/utils/fileStorage.ts`، `server/routes/applicationsRoutes.ts` |
| **H5** | حماية مسارات إرسال البريد بالصلاحيات | `server/routes/applicationsRoutes.ts` |
| **H6** | فحص ملكية الرسائل + إخفاء الملاحظات الداخلية عن الطالب + اشتقاق هوية المُرسِل من الجلسة | `server/routes/messagesRoutes.ts` |
| **H7** | إخفاء تفاصيل الأخطاء والخدمة؛ `/api/health` لم يعد يكشف الدومين ولا الكاش | `server/middleware/security.ts`، `server.ts`، كل المسارات |
| **H8** | التحقق من شهادة TLS لقاعدة البيانات مُفعَّل افتراضياً | `server/db.ts` |
| **H9** | تحديد معدّل الطلبات على تسجيل الدخول والنماذج العامة | `server/middleware/security.ts` (جديد) |
| **H10** | إزالة `--sourcemap` فلا يُكشف كود الخادم عبر `/server.cjs.map` | `package.json` |
| **H11** | تقنيع المفاتيح السرّية في `GET /api/settings` ورفض كتابتها | `server/routes/settingsRoutes.ts`، `src/components/SettingsManager.tsx` |
| **H12** | إزالة عرض/تحرير توكن تلغرام من الواجهة | `src/components/SettingsManager.tsx`، `src/services/api.ts` |
| **H13** | إزالة الرجوع التلقائي إلى `MOCK_APPLICATIONS[0]` | `src/App.tsx` |
| **H14** | تهريب كل حقول المستخدم في قوالب البريد (`esc` / `escMultiline`) + منع حقن ترويسات البريد | `server/services/emailService.ts` |
| **M1/M2** | تشغيل الحاويات بمستخدم غير جذر + `no-new-privileges` | `Dockerfile`، `afaq-backend/Dockerfile`، `docker-compose.yml` |
| **M3** | ملفات الاستثناء تشمل الآن `.env.*` و`*.pem` و`*.key` وبيانات التطبيق | `.dockerignore`، `.gitignore` |
| **M10** | إزالة تحديث `req.body` العشوائي (Mass Assignment) من عدة مسارات | `customersRoutes`، `meetingsRoutes`، `countriesRoutes`، `majorsRoutes`، `universitiesRoutes`، `paragraphsRoutes`، `usersRoutes` |
| **M12** | `client_max_body_size` و`server_tokens off` في nginx | `afaq-frontend/nginx.conf` |
| **M13** | `crypto.randomInt` و`randomBytes` بدل `Math.random` | `applicationsRoutes.ts`، `meetingsRoutes.ts` |
| **M14** | حذف المستند يحذف الملف فعلياً من القرص | `server/utils/fileStorage.ts`، `applicationsRoutes.ts` |

---

## 6. دليل التحقق الفعلي (تم فعلاً)

شُغِّل الخادم بعد الإصلاح واختُبرت **42 حالة** على نسخة محلية — **النتيجة: 42 نجحت، 0 فشلت**.

> الحالات تعمل ببيئة تحاكي نشرك: `TRUST_PROXY=2` و`TELEGRAM_BOT_TOKEN` و`TELEGRAM_CHAT_ID` بقيم وهمية حقيقية الشكل، وترويسات `CF-Connecting-IP` و`X-Forwarded-For` و`X-Forwarded-Proto` كما ترسلها Cloudflare.

### ملخّص الجولة النهائية

```
✅ GET /api/health                                    200
── وصول مجهول (14 حالة) ──
✅ GET /api/users مجهول                               401
✅ GET /api/applications مجهول                        401
✅ GET /api/customers مجهول                           401
✅ GET /api/meetings مجهول                            401
✅ GET /api/messages?application_id=1 مجهول           401
✅ GET /api/cache/stats مجهول                         401
✅ POST /api/cache/clear مجهول                        401
✅ PUT /api/settings مجهول                            401
✅ PUT /api/paragraphs/hero_main مجهول                401
✅ POST /api/users مجهول                              401
✅ DELETE /api/users/1 مجهول                          401
✅ DELETE /api/countries/1 مجهول                      401
✅ DELETE /api/universities/1 مجهول                   401
✅ DELETE /api/majors/1 مجهول                         401
✅ GET /uploads/... مباشر                             404
── الأبواب الخلفية ──
✅ دخول afaq2026                                      401
✅ دخول admin123                                      401
✅ بوابة 123456                                       401
── الوظائف سليمة ──
✅ دخول صحيح                                          200
✅ GET /api/users بجلسة                               200
✅ GET /api/customers بجلسة                           200
✅ GET /api/meetings بجلسة                            200
✅ GET /api/cache/stats بجلسة                         200
✅ POST /api/users بجلسة                              201
── الثغرات الدقيقة ──
✅ قراءة ملف: ../../../../etc/passwd                  400
✅ قراءة ملف: ../../../.env                           400
✅ رفع evil.html مرفوض                                400
✅ رفع ok.pdf مقبول                                   200
✅ لا حقول كلمة مرور في الطلبات                       0
✅ لا تسريب أسرار في الإعدادات                        0
✅ كتابة مفتاح سرّي مرفوضة                            400
── إصلاحات Cloudflare ──
✅ لا تجاوز لتحديد المعدّل بتزوير XFF               429
✅ عميل آخر بعنوان CF مختلف لا يتأثر                 401
✅ HSTS غائب على HTTP                                False
✅ HSTS يُرسل على HTTPS                              True
── رؤوس الأمان ──
✅ Content-Security-Policy                            True
✅ X-Frame-Options                                    True
✅ X-Content-Type-Options                             True
✅ Referrer-Policy                                    True
✅ Permissions-Policy                                 True
✅ X-Powered-By غائب                                  False
```

**فحص الأنواع:** `npx tsc --noEmit` ينتهي بـ **صفر أخطاء** على 48 ملفاً.

### 🐞 ثغرات اكتشفها الاختبار التشغيلي نفسه وأُصلحت

هذا هو سبب أهمية التحقق بالتشغيل لا بالاكتفاء بالقراءة:

| # | ما اكتُشف | الخطورة | الإصلاح |
|---|-----------|---------|---------|
| 1 | **`telegram_chat_id` كان يمرّ من فلتر التقنيع** — لأنه لا يحتوي كلمة `token` ولا `secret`، فأعاد الخادم معرّف قناة الإدارة لأي زائر مجهول | متوسطة | أُضيفت قائمة صريحة بأسماء المفاتيح السرّية (`SECRET_KEY_NAMES`) بجانب النمط النصي |
| 2 | **مسار الكاش كان يعيد الأسرار** — معالج `PUT /api/settings` كان يخزّن الإعدادات **غير المُقنَّعة** في الكاش، فيُعيدها `GET` التالي مباشرة متجاوزاً التقنيع. لو كان التوكن مضبوطاً في البيئة لتسرّب فعلياً | **عالية** | التقنيع يُطبَّق الآن عند الإنتاج (قراءة) **وعند التخزين في الكاش** معاً |
| 3 | `formatApplicationForResponse` كان يمرّر **أي** حقل عبر `...rawApp`، فظهر `portal_password` في استجابة مسار الذاكرة | **عالية** | فلتر نهائي يُزيل أي حقل يطابق `password\|passwd\|secret\|token` قبل الإرجاع |

> الثلاثة أُصلحت وأُعيد اختبارها جميعاً في الجولة النهائية أعلاه.

### تحقق خاص بتسريب توكن تلغرام (بقيم حقيقية في البيئة)

شُغِّل الخادم بـ `TELEGRAM_BOT_TOKEN` و`TELEGRAM_CHAT_ID` حقيقيَّين (وهميَّين للاختبار)، والنتيجة **13/13**:

- `GET /api/settings` مجهولاً: **لا أثر** للتوكن ولا المعرّف ولا كلمة `telegram`.
- `PUT /api/settings` ثم `GET` (مسار الكاش): **نظيف تماماً**.
- محاولة كتابة `telegram_bot_token` عبر الـ API: **مرفوضة 400**.
- الإعدادات المشروعة (`company_email`, `company_name_ar`, `announcement_banner_ar`): **تعمل بشكل طبيعي**.

---

## 7. الملفات المتغيّرة (32 ملفاً)

### ملفات جديدة (4)
```
server/middleware/auth.ts              ← المصادقة والصلاحيات
server/middleware/security.ts          ← رؤوس الأمان + تحديد المعدّل + إخفاء الأخطاء
server/services/passwordService.ts     ← تشفير scrypt بلا اعتماديات خارجية
server/services/sessionService.ts      ← جلسات برموز عشوائية قابلة للإبطال
```

### ملفات معدّلة (28)
```
server.ts
server/db.ts
server/utils/fileStorage.ts
server/services/emailService.ts
server/routes/{usersRoutes, applicationsRoutes, customersRoutes, settingsRoutes,
               messagesRoutes, meetingsRoutes, countriesRoutes, majorsRoutes,
               universitiesRoutes, paragraphsRoutes, cacheRoutes}.ts
src/App.tsx
src/services/api.ts
src/components/{StaffDashboard, StudentDashboard, SettingsManager, ApplicationModal}.tsx
package.json
.env.example
.gitignore
.dockerignore
docker-compose.yml
Dockerfile
afaq-backend/Dockerfile
afaq-frontend/nginx.conf
server/db/init.sql
server/db/reset_and_init.sql
afaq-db/init.sql
```

---

## 8. ما تبقّى عليك يدوياً

### عاجل
1. **طبّق الـ patch ثم انشره** — الإصلاحات ليست على GitHub بعد.
2. **فعّل GitHub Secret Scanning + Push Protection** وحماية الفرع `main`
   (Settings ← Code security and analysis).
3. **نظّف سجل Git** على الفرعين `main` **و** `static` بكلمة مرور قاعدة البيانات القديمة:
   ```bash
   pip install git-filter-repo
   git filter-repo --replace-text replacements.txt   # ملف فيه: ChangeMeSecurePassword123==>REDACTED
   git push --force --all && git push --force --tags
   ```
   ثم راسل دعم GitHub لتنفيذ GC على السيرفر. **تنبيه:** هذا يمنع الوصول مستقبلاً فقط — القيمة القديمة تبقى "مكشوفة" منطقياً، لذا اعتبرها محروقة.
4. **راجع إعداد SSL في Cloudflare**: اضبط الوضع على **Full (strict)** وفعّل *Always Use HTTPS* و HSTS من لوحة Cloudflare (وليس من nginx، لتجنّب حلقة إعادة توجيه).

### مهم
5. **اختبار يدوي لتدفق رفع المستندات** — مسار الحفظ تغيّر جذرياً (خارج `public/`، بأسماء UUID، بفحص توقيع ثنائي). اختبر: رفع PDF، رفع صورة، محاولة رفع `.html` (يجب أن تُرفض)، تنزيل بجلسة موظف، ومحاولة تنزيل بلا جلسة (يجب 401).
6. **حذف ملف قفل واحد**: احذف `bun.lock` أو `package-lock.json` — وجودهما معاً سبب مشكلة تثبيت واجهتها فعلاً أثناء هذا العمل (`Cannot find module @rollup/rollup-win32-x64-msvc`). بعد الحذف استخدم `npm ci` في Dockerfile.
7. **ترقية Node**: جهازك عليه Node `20.14.0` بينما `@vitejs/plugin-react@5.2` يتطلب `^20.19.0 || >=22.12.0`. رقِّ إلى Node 22 LTS لتجنّب مشاكل بناء.
8. **دوّر كلمات المرور الحقيقية** إن كنت قد استخدمت قيماً حقيقية في قاعدة البيانات أو بريد Gmail أو بوت تلغرام.

### تحسينات مستحسنة
9. **تحقق من صحة المدخلات** — أضف `zod` لكل جسم طلب.
10. **جلسات دائمة** — الجلسات في الذاكرة، فأي إعادة تشغيل تُسجّل الخروج للجميع. للترقية: انقل `Map` في `sessionService.ts` إلى جدول `sessions` في PostgreSQL — لا يحتاج تغيير أي مسار آخر.
11. **CSRF** — محمي حالياً عبر `SameSite=Strict`. إن أضفت نطاقاً فرعياً لاحقاً فأضف رمز CSRF مزدوجاً.
12. **رفع المستندات إلى تخزين كائنات** (S3/R2) بدل القرص المحلي، لتحسين المتانة والنسخ الاحتياطي.

---

## 9. ⚠️ تغييرات في السلوك — انتبه لها

| السلوك السابق | السلوك الجديد |
|---------------|----------------|
| لوحة الموظفين تُفتح بأي كلمة مرور عامة | تحتاج حساباً حقيقياً من قاعدة البيانات |
| الطالب يدخل بـ `123456` لرقم الطلب | كلمة مرور قوية عشوائية أرسلت لبريده |
| الموظف يرى كلمة مرور الطالب في الواجهة | **لا يمكن استرجاعها** — زر «إصدار كلمة مرور جديدة» |
| رابط `/uploads/documents/x.pdf` يعمل مباشرة | **404** — التنزيل عبر `/api/applications/:id/documents/:docId/file` بجلسة |
| كل `GET /api/...` متاح للجميع | قراءات المحتوى العام فقط (إعدادات، دول، جامعات، تخصصات، فقرات) |
| الطالب «مسجَّل الدخول» تلقائياً في البوابة | شاشة الدخول تظهر دائماً |
| الجلسة تبقى بعد إعادة التشغيل | تنتهي (8 ساعات للموظف، ساعتان للطالب) |
| كلمات المرور نص صريح في قاعدة البيانات | scrypt — والقيم القديمة **مقفلة** وتحتاج إعادة تعيين |

---

*أُعِدّ بواسطة DeepSeek Harness — تم التطبيق والتحقق بالتشغيل الفعلي على نسخة محلية من المستودع.*
