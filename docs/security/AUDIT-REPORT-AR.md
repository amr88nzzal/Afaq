<!--
  ملاحظة: هذا التقرير أُعِدّ في جلسة مراجعة منفصلة، ويشير إلى مسارات محلية
  (مثل afaq-audit/ وملف afaq-security-fixes.patch) لم تُرفع إلى المستودع
  لأن التغييرات نفسها مُطبَّقة بالفعل على الفرع security-fixes.
  المحتوى تقني كامل ومُتحقَّق منه كما هو.
-->
# التقرير الأمني — مشروع Afaq Global Education

> ## ✅ تم إصلاح الثغرات — راجع [الإصلاحات-المنفذة.md](الإصلاحات-المنفذة.md)
>
> **الملف الجاهز للتطبيق:** `afaq-security-fixes.patch` (276 KB، 32 ملفاً، +2289/−975 سطراً)
>
> | الحالة | العدد |
> |--------|-------|
> | ثغرات حرجة أُصلحت | **7 من 7** ✅ |
> | ثغرات عالية أُصلحت | **14 من 14** ✅ |
> | ثغرات متوسطة أُصلحت | **11 من 17** (الباقي تحسينات اختيارية) |
> | اختبار تشغيلي فعلي | **42 حالة — 42 نجحت، 0 فشلت** ✅ |
> | فحص الأنواع | `tsc --noEmit` بصفر أخطاء ✅ |
> | ثغرات إضافية اكتشفها الاختبار وأُصلحت | **5** (تسريب عبر الكاش، فلتر `chat_id`، حقل كلمة مرور في الاستجابة، محو `X-Forwarded-Proto`، تجاوز تحديد المعدّل) |
>
> ### 🌩️ تصحيح مهم بخصوص بيئة النشر (Cloudflare Tunnel + Zero Trust)
>
> بيئتك **تُخفّض خطورة نتيجتين** في هذا التقرير:
> - **H1 (لا TLS)** → من 🟠 عالية إلى 🟡 منخفضة: النفق يشفّر المسار بالكامل، والجزء الوحيد غير المشفّر (`cloudflared → nginx`) لا يمرّ على شبكة خارجية.
> - **H2 (منفذ 5432)** → من 🟠 عالية إلى 🟡 منخفضة: يعتمد على طريقة إيقاف المنافذ لديك — التفاصيل في [الإصلاحات-المنفذة.md](الإصلاحات-المنفذة.md) القسم 4.
> - **H3 (كلمة مرور القاعدة)** → 🔴 **تبقى عالية**: النفق لا يحمي من سر مكشوف في مستودع عام.
>
> ⚠️ **لكن انتبه:** `Docker` يتجاوز `ufw` بقواعده الخاصة في `iptables` — فإن كنت تعتمد على `ufw` لإيقاف المنافذ، فالمنفذ المنشور بـ `ports:` **يبقى مفتوحاً من الإنترنت**. راجع القسم 4 من ملف الإصلاحات قبل أن تعتبر هذه النتيجة مغلقة.
>
> القسمان 3 و4 أدناه يسردان الثغرات **كما كانت** قبل الإصلاح، وهما مرجع لما تمّت معالجته.

**المستودع:** `github.com/amr88nzzal/Afaq` — الفرع `main`
**آخر Commit مفحوص:** `6432722a48a3fc592ff4bb9cee7da37390a5bbe3` (2026-09-16)
**تاريخ الفحص:** جلسة DSH الحالية
**نوع الفحص:** مراجعة كود المصدر (White-box) + فحص سجل Git + فحص إعدادات النشر
**الملف المحلي المفحوص:** `afaq-audit/repo/Afaq-main/` (83 ملفاً)

---

## 1. الملخص التنفيذي

المشروع **غير آمن للنشر على الإنترنت بحالته الحالية**. الخلاصة في سطر واحد:

> **لا توجد أي مصادقة على الـ API إطلاقاً، وتوجد كلمتا مرور عامّتان تفتحان أي حساب بمن فيه المدير، وكلمات المرور مخزنة كنص صريح، ومستندات الطلاب (جوازات السفر) قابلة للتنزيل من أي شخص.**

### أهم 7 نتائج

| # | الخطورة | الوصف | الملف |
|---|---------|-------|-------|
| C1 | 🔴 حرجة | 35 مسار API بلا أي مصادقة أو فحص صلاحيات (0 من 35 محمي) | `server.ts:50-60` |
| C2 | 🔴 حرجة | كلمتا مرور عامّتان (`afaq2026` / `admin123`) تفتحان أي حساب | `server/routes/usersRoutes.ts:53-56` |
| C3 | 🔴 حرجة | كلمات المرور مخزنة ومقارنة كنص صريح (لا bcrypt) | `server/db/init.sql:236-239` |
| C4 | 🔴 حرجة | كلمة مرور افتراضية `123456` تفتح بوابة أي طالب | `server/routes/applicationsRoutes.ts:892` |
| C5 | 🔴 حرجة | جوازات السفر ومستندات الطلاب متاحة للعامة بلا مصادقة | `applicationsRoutes.ts:772` + `server.ts:71-72` |
| C6 | 🔴 حرجة | المصادقة في المتصفح فقط + باب خلفي في الواجهة | `src/components/StaffDashboard.tsx:123-129, 241-254` |
| C7 | 🔴 حرجة | قراءة أي ملف على السيرفر (Arbitrary File Read) | `applicationsRoutes.ts:813-826` |

### حالة النشر الحالية ✅ (خبر مطمئن نسبياً)

النطاق `afaq-global.amrodev.com` المذكور في الكود **لم يعد يُحلّ DNS** حالياً — أي أن النشر متوقف أو تمت إزالته. هذا يعني أن الثغرات **غير قابلة للاستغلال الآن**. لكن:

- الكود ما زال **عاماً على GitHub**، وأي إعادة نشر تعيد فتح كل هذه الثغرات فوراً.
- أي شخص حمّل نسخة أثناء عمل الموقع قد يكون استغل الثغرات بالفعل.
- **يجب** افتراض أن كلمة مرور قاعدة البيانات وكلمات مرور الموظفين **مكشوفة** وأن تُغيَّر.

---

## 2. منهجية الفحص وما لم يُفحص

### ما تم التحقق منه فعلياً
- ✅ قراءة كود المصدر الفعلي (83 ملفاً) بعد تنزيل المستودع محلياً.
- ✅ فحص سجل Git كاملاً (15 commit) بحثاً عن أسرار محذوفة أو مُسرّبة.
- ✅ فحص ملفات الإعداد: Docker، nginx، `.env.example`، `.gitignore`، `package.json`.
- ✅ البحث عن أنماط معروفة: أسرار مثبتة، SQL Injection، XSS، تجاوز مصادقة.

### نتائج سلبية مهمة (أشياء جيدة)
- ✅ **لا يوجد SQL Injection** — كل استعلامات قاعدة البيانات تستخدم Parameterized Queries (`$1`, `$2`)، ولم يُعثر على أي تركيب نصي في `pool.query`.
- ✅ **لا توجد أسرار طرف ثالث مُسرّبة** — لا مفاتيح Gemini (`AIza…`)، لا توكن تلغرام، لا مفاتيح AWS، لا مفاتيح OpenAI.
- ✅ **`.gitignore` سليم** — يستثني `.env*` و`uploads/` و`dist/`.
- ✅ **لا يوجد `dangerouslySetInnerHTML`** ولا `eval` ولا `innerHTML` في الواجهة.
- ✅ الواجهة تستخدم مسارات نسبية (`/api/...`) ولا يوجد Host مثبت في الكود.

### ما لم يمكن التحقق منه (شفافية)
- ⚠️ لم نتحقق إن كانت القيم في `.env.example` مطابقة لما كان مستخدماً فعلياً في الإنتاج.
- ⚠️ لم نتمكن من فحص السيرفر الحي (النطاق متوقف).
- ⚠️ لم نفحص ثغرات الحزم (CVEs) في `package-lock.json` / `bun.lock` — يحتاج أدوات مثل `npm audit` مع اتصال بالشبكة.
- ⚠️ لم يُفحص الجانب القانوني لبيانات الطلاب (نظام حماية البيانات السعودي PDPL).

---

## 3. الثغرات الحرجة (CRITICAL)

### C1 — لا توجد أي مصادقة على الـ API (35 مساراً مكشوفاً)

**الملف:** `server.ts:50-60`

```ts
app.use('/api/settings', settingsRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/majors', majorsRoutes);
app.use('/api/users', usersRoutes);        // ← إدارة المستخدمين!
app.use('/api/customers', customersRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/paragraphs', paragraphsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/cache', cacheRoutes);
```

**الدليل:** بحث شامل في المشروع كله عن `requireAuth` أو `authenticate` أو `jwt` أو `bcrypt` أو `authorization` أعاد **صفر نتيجة** على مستوى الـ backend. لا يوجد أي middleware للمصادقة في المشروع.

**الأثر:** أي شخص على الإنترنت — دون أي بيانات دخول — يستطيع تنفيذ التالي:

| الطلب | النتيجة |
|-------|---------|
| `GET /api/users` | استرجاع كل الموظفين: الأسماء، الإيميلات، الجوالات، توكن تلغرام |
| `POST /api/users` مع `{"role":"admin"}` | **إنشاء حساب مدير دائم** (باب خلفي) |
| `PUT /api/users/1` | **تغيير كلمة مرور أي مستخدم** |
| `DELETE /api/users/1` | حذف كل المستخدمين |
| `GET /api/applications` | كل بيانات الطلاب: الأسماء، الإيميلات، الجوالات، واتساب، المعدلات |
| `PUT /api/settings` | تعديل نصوص وبيانات الموقع بالكامل |
| `POST /api/cache/clear` | إسقاط الكاش (DoS) |
| `GET /api/messages?application_id=X` | قراءة المحادثات الداخلية للموظفين |

**الإصلاح:** إضافة middleware مصادقة على مستوى التطبيق قبل تركيب المسارات:

```ts
// server/middleware/auth.ts
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'غير مصرح' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'جلسة غير صالحة' });
  }
}

export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'صلاحيات غير كافية' });
    }
    next();
  };
}
```

ثم في `server.ts`:

```ts
// مسارات عامة (بدون مصادقة)
app.use('/api/settings', settingsRoutes);       // GET فقط عام
// مسارات محمية
app.use('/api/users', requireAuth, requireRole('admin'), usersRoutes);
app.use('/api/customers', requireAuth, customersRoutes);
app.use('/api/cache', requireAuth, requireRole('admin'), cacheRoutes);
// ... إلخ
```

> ⚠️ ملاحظة: `GET /api/settings` و`GET /api/countries` و`GET /api/universities` يجب أن تبقى عامة لأن الواجهة العامة تعتمد عليها — لكن **الكتابة** (`POST/PUT/DELETE`) يجب أن تكون محمية.

---

### C2 — كلمتا مرور عامّتان تفتحان أي حساب (تجاوز كامل للمصادقة)

**الملف:** `server/routes/usersRoutes.ts` السطور **53-56** (مسار PostgreSQL) و**103-106** (مسار الذاكرة)

```ts
// Check password matching or emergency master PIN
const isPasswordValid = 
  user.password_hash === password || 
  password === 'afaq2026' ||      // ← كلمة مرور عامة!
  password === 'admin123';        // ← كلمة مرور عامة!
```

**الأثر:** أي شخص يعرف `afaq2026` يستطيع الدخول كأي موظف — بما فيهم المدير — بمجرد معرفة بريده. والبريد متاح أصلاً من `GET /api/users` (الثغرة C1). **السلسلة: C1 → C2 = سيطرة كاملة على لوحة الإدارة بدون أي بيانات دخول.**

**الإصلاح الفوري:**

```ts
const isPasswordValid = await bcrypt.compare(password, user.password_hash);
if (!isPasswordValid) {
  return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
}
```

احذف الشرطين `afaq2026` و`admin123` نهائياً، ثم **أعِد تعيين كلمات مرور كل الحسابات**.

---

### C3 — كلمات المرور مخزنة كنص صريح (لا تشفير)

**الأدلة:**

`server/db/init.sql:236-239`:
```sql
INSERT INTO users (id, name, email, phone, password_hash, telegram_id, role) VALUES
(1, 'د. فيصل الشمري', 'faisal@afaq-global.amrodev.com', '+966 50 123 4567', 'afaq2026', '@dr_faisal_afaq', 'admin'),
(2, 'أ. سارة المنصور', 'sara@afaq-global.amrodev.com', '+966 55 987 6543', 'afaq2026', '@sara_admissions', 'counselor'),
(3, 'م. ريان القحطاني', 'rayan@afaq-global.amrodev.com', '+966 54 321 0987', 'afaq2026', '@rayan_uk', 'counselor');
```

`server/db/reset_and_init.sql:229` — نفس الشيء بكلمة `admin123`.

`server/routes/usersRoutes.ts:54` — المقارنة نصية مباشرة: `user.password_hash === password`.

**الأثر:** أي تسريب لقاعدة البيانات (نسخة احتياطية، خطأ في الإعداد، C1) يكشف كل كلمات المرور فوراً. والاسم `password_hash` **مضلل** — فهو لا يحتوي hash إطلاقاً.

**الإصلاح:**

```ts
import bcrypt from 'bcrypt';

// عند الإنشاء
const passwordHash = await bcrypt.hash(password, 12);
// عند التحقق
const ok = await bcrypt.compare(password, user.password_hash);
```

مع migration لإعادة تعيين كل كلمات المرور الحالية (لأنها نص صريح لا يمكن تحويله تلقائياً بشكل آمن).

---

### C4 — كلمة مرور افتراضية `123456` تفتح بوابة أي طالب

**الملف:** `server/routes/applicationsRoutes.ts` السطر **892**:

```sql
WHERE (a.application_number = $1 OR c.email = $1)
  AND (c.password_hash = $2 OR $2 = '123456')   -- ← أي كلمة مرور تُقبل إذا كانت 123456
LIMIT 1
```

والسطر **908**:
```ts
const validPass = (app.portal_password || (app as any).portalPassword || '123456');
```

`server/db.ts:55-57` — كل الطلاب في البيانات التجريبية بكلمة `123456`. وكذلك `server/db.ts:84, 120`.

`src/components/StudentDashboard.tsx:511` — زر "دخول تجريبي" يُعبّئ البيانات تلقائياً:
```tsx
onClick={() => handleQuickDemoLogin('AFQ-2026-8812', '123456')}
```

**الأثر:** معرفة رقم طلب واحد أو بريد طالب = الوصول لكل ملفه (بياناته الشخصية، مستنداته، محادثاته مع المستشار). وأرقام الطلبات متسلسلة وسهلة التخمين (`AFQ-2026-XXXX`).

**تسريب إضافي:** استعلام `portal-login` (السطر 874) يُعيد `c.password_hash as "portalPassword"` — أي أن **كلمة مرور الطالب تُرسَل إلى المتصفح** في الاستجابة.

**الإصلاح:** حذف `OR $2 = '123456'`، حذف `"portalPassword"` من `SELECT`، استبدال `123456` بكلمة مرور عشوائية عند إنشاء الطلب، وإضافة rate limiting على المسار.

---

### C5 — جوازات السفر ومستندات الطلاب مكشوفة للعامة

**ثلاث مشاكل منفصلة تتضافر:**

**أ) مسار تنزيل الملفات بلا مصادقة** — `applicationsRoutes.ts:772`:
```ts
router.get('/:id/documents/:docId/file', async (req, res) => {
```
لا يوجد أي فحص لملكية الطلب. أي شخص يعرف `:id` و`:docId` ينزّل الملف.

**ب) بحث فضفاض في الملفات** — `applicationsRoutes.ts:829-843`:
```ts
for (const uDir of uploadsDirs) {
  if (fs.existsSync(uDir)) {
    const files = fs.readdirSync(uDir);
    const match = files.find(f => f.includes(id) || f.includes(docId) || (fileName && f.includes(fileName)));
    if (match) return res.sendFile(path.join(uDir, match));
  }
}
```
المطابقة بـ `includes()` فضفاضة جداً — طلب بمعرّف `1` سيطابق **أي** اسم ملف يحتوي الرقم "1" (مثل `21_...`, `100_...`). هذا يعني إمكانية تنزيل ملفات طلاب آخرين بالخطأ أو بشكل متعمد.

**ج) المجلد كله مكشوف كملفات ثابتة** — `server.ts:71-72`:
```ts
app.use('/uploads', express.static(publicUploadsPath));
app.use('/uploads', express.static(rootUploadsPath));
```
أي ملف مرفوع متاح مباشرة على `https://<الموقع>/uploads/documents/<اسم الملف>` **بدون أي مصادقة على الإطلاق** — حتى بدون المرور بالـ API.

**الأثر:** هذا أخطر بُعد في المشروع من ناحية قانونية. جوازات السفر، كشوف الدرجات، شهادات IELTS، وخطابات الغرض من الدراسة = **بيانات شخصية حساسة**. تسريبها قد يخضع لعقوبات بموجب نظام حماية البيانات الشخصية السعودي (PDPL) وقانون GDPR الأوروبي (المشروع يخدم طلاباً في بريطانيا وأستراليا).

**الإصلاح:**
1. إزالة `express.static` لمجلد `uploads` تماماً (السطور 71-72).
2. تنزيل المستندات فقط عبر مسار مُصادَق يتحقق من ملكية الطلب:
```ts
router.get('/:id/documents/:docId/file', requireAuth, async (req, res) => {
  const app = await getApplicationForUser(req.params.id, req.user);
  if (!app) return res.status(403).json({ success: false, error: 'غير مصرح' });
  // ... مع التحقق من أن المسار داخل مجلد uploads وأن اسم الملف من قاعدة البيانات فقط
});
```
3. تخزين الملفات **خارج** `public/` وفي مجلد غير مخدوم.
4. استبدال المطابقة الفضفاضة بـ `f.includes()` بمعرّف فريد (UUID) مخزّن في قاعدة البيانات.

---

### C6 — المصادقة في الواجهة فقط + باب خلفي في المتصفح

**الملف:** `src/components/StaffDashboard.tsx`

**السطور 123-129** — حالة الدخول تُقرأ من `sessionStorage`:
```tsx
const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
  try {
    return sessionStorage.getItem('afaq_admin_auth') === 'true';
  } catch { return false; }
});
```

**الأثر:** أي شخص يفتح DevTools (F12) ويكتب:
```js
sessionStorage.setItem('afaq_admin_auth', 'true');
```
ثم يُحدّث الصفحة — يحصل على لوحة إدارة كاملة، **بدون أي بيانات دخول وبدون استدعاء السيرفر**.

**السطور 241-254** — باب خلفي إضافي في الواجهة:
```tsx
} else {
  // Fallback check for demo master pin
  if (passVal === 'afaq2026' || passVal === 'admin123') {
    const fallbackUser: StaffUserEntity = {
      id: 1, name: userVal || 'مدير النظام',
      email: userVal.includes('@') ? userVal : 'faisal@afaq-global.com',
      role: 'admin', is_active: true
    };
    setCurrentUser(fallbackUser);
    setIsAuthenticated(true);
    sessionStorage.setItem('afaq_admin_auth', 'true');
```
حتى لو رفض السيرفر الدخول، الواجهة تمنح جلسة مدير محلياً.

**السطور 597-643** — أزرار "دخول سريع" تكشف كلمات المرور في الكود:
```tsx
onClick={() => handleQuickPersonaSelect('faisal@afaq-global.com', 'admin123')}
onClick={() => handleQuickPersonaSelect('sara@afaq-global.com', 'counselor123')}
onClick={() => handleQuickPersonaSelect('tariq@afaq-global.com', 'staff123')}
```
أي زائر يقرأ كود الـ JavaScript سيحصل على هذه البيانات مباشرة.

> ⚠️ **ملاحظة مهمة:** حتى لو أصبحت الـ API محمية بشكل مثالي، فإن الاعتماد على `sessionStorage` للتحقق من الصلاحية **يبقى خطأ**. الواجهة يجب أن تطلب من السيرفر من هو المستخدم (`GET /api/auth/me`) ولا تقرر الصلاحيات بنفسها أبداً.

**الإصلاح:** حذف كل منطق `fallbackUser` وأزرار الدخول السريع، وإزالة فحص `sessionStorage` كأساس للصلاحية — استبداله بجلسة حقيقية (JWT في memory أو httpOnly cookie) والتحقق من `/api/auth/me` عند تحميل الصفحة.

---

### C7 — قراءة أي ملف على السيرفر (Arbitrary File Read)

**الملف:** `server/routes/applicationsRoutes.ts:813-826`

مسار رفع المستندات يقبل `fileUrl` من العميل ويخزّنه كما هو (السطر 586: `let savedFileUrl = fileUrl || '';` — بلا أي تحقق عندما يكون الرابط قصيراً).

ثم مسار التنزيل يبني المسار من تلك القيمة ويُرسل الملف:

```ts
if (fileUrl) {
  const cleanUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  const pathsToTry = [
    path.join(process.cwd(), 'public', cleanUrl),
    path.join(process.cwd(), cleanUrl),          // ← path.join يُطبّع .. ويهرب من المجلد
    // ...
  ];
  for (const p of pathsToTry) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);                    // ← إرسال أي ملف
    }
  }
}
```

**سلسلة الاستغلال:**
1. `POST /api/applications/1/documents` بجسم يحتوي `fileUrl: "../../../../etc/passwd"` (بلا مصادقة — C1).
2. القيمة تُخزَّن في `documents.file_url` كما هي.
3. `GET /api/applications/1/documents/<docId>/file` → `path.join()` يُطبّع `..` ويخرج من مجلد المشروع → يُرسل محتوى الملف.

**الأثر:** قراءة أي ملف يقرأه المستخدم الذي يشغّل Node — `.env` (بكل أسراره: كلمة مرور قاعدة البيانات، كلمة مرور بريد Gmail، توكن تلغرام!)، `server/db.ts`، ملفات النظام. **هذه الثغرة وحدها تكفي للسيطرة الكاملة على الخادم** لأنها تُسرّب `.env`.

**الإصلاح:**
```ts
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'documents');
const target = path.resolve(UPLOAD_ROOT, path.basename(storedFileNameFromDb));
if (!target.startsWith(UPLOAD_ROOT + path.sep)) {
  return res.status(400).json({ success: false, error: 'مسار غير صالح' });
}
```
وتُبنى أسماء الملفات من قاعدة البيانات فقط (UUID)، ولا يُقبل `fileUrl` من العميل إطلاقاً.

---

## 4. الثغرات العالية (HIGH)

### H1 — لا HTTPS ولا رؤوس أمان في nginx

**الملف:** `afaq-frontend/nginx.conf:5`
```nginx
server {
    listen 80;                 # ← لا وجود لـ listen 443 ssl
    server_name afaq-global.amrodev.com localhost;
```

**الأثر:** كلمات مرور الموظفين والطلاب تُنقل كنص صريح قابل للاعتراض (خصوصاً على شبكات WiFi العامة). ولا توجد رؤوس حماية:
- لا `Strict-Transport-Security` (HSTS) — يسمح بهجمات SSL Stripping.
- لا `Content-Security-Policy` (CSP) — يسهّل XSS.
- لا `X-Frame-Options` — الموقع قابل للتضمين في iframe (Clickjacking).
- لا `X-Content-Type-Options: nosniff`.

**الإصلاح:**
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';" always;
}
server {
    listen 80;
    server_name afaq-global.amrodev.com;
    return 301 https://$host$request_uri;   # إعادة توجيه إلزامية
}
```

---

### H2 — منفذ قاعدة البيانات منشور على المضيف

**الملف:** `docker-compose.yml:9-10`
```yaml
afaq_db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"        # ← قاعدة البيانات مكشوفة على كل واجهات الشبكة
```

**الأثر:** PostgreSQL متاح من خارج الحاوية. أي ثغرة في جدار الحماية أو إعداد سحابي خاطئ = وصول مباشر لقاعدة البيانات. الحاويات الأخرى في نفس الشبكة (`afaq_internal_net`) لا تحتاج هذا المنفذ أصلاً.

**الإصلاح:** احذف قسم `ports` بالكامل — الحاويات تتواصل عبر الشبكة الداخلية. إن كنت تحتاج `pgAdmin` محلياً، اربطه بـ localhost فقط:
```yaml
    ports:
      - "127.0.0.1:5432:5432"
```

---

### H3 — كلمة مرور قاعدة البيانات الافتراضية مكشوفة ولم تُغيَّر

**الأدلة:**
- `.env.example:10,12` → `ChangeMeSecurePassword123`
- `server/db.ts:10` → نفس القيمة كـ fallback مضمّن:
```ts
const databaseUrl = process.env.DATABASE_URL || 'postgres://afaq_user:ChangeMeSecurePassword123@localhost:5432/afaq_db';
```
- سجل Git: كانت مثبتة نصاً في `docker-compose.yml` من الـ commit `caf412ac` حتى `8cc5a80`.

**الأثر:** إن كان النشر يستخدم هذه القيمة (وهو مرجّح لأنها في `.env.example` كإعداد جاهز)، فقاعدة البيانات مكشوفة. وحتى بعد حذفها من الكود، **القيمة الحالية تبقى مكشوفة في سجل Git العام**.

**الإصلاح:**
```sql
ALTER USER afaq_user WITH PASSWORD '<كلمة-مرور-عشوائية-قوية-جديدة>';
```
ثم حدّث `.env` على السيرفر، واحذف القيمة الحرفية من `server/db.ts` (اجعل المتغير إلزامياً وافشل عند غيابه)، وضع placeholder واضحاً في `.env.example`.

---

### H4 — رفع ملفات بلا التحقق من النوع أو المحتوى

**الأدلة:**
- `server.ts:29-30` — حد 15 ميجابايت للطلب الواحد.
- `server/utils/fileStorage.ts:21` — الامتداد مأخوذ من اسم الملف المُرسَل:
```ts
const ext = path.extname(originalFileName) || '.pdf';
```
- لا توجد قائمة بيضاء لأنواع MIME (`application/pdf`, `image/jpeg` فقط).

**الأثر — سلسلة هجوم عملية:**
1. مهاجم يرفع `payload.html` (أو `.svg` بجافاسكربت) عبر `POST /api/applications/1/documents` — بلا مصادقة (C1).
2. الملف يُحفظ في `public/uploads/documents/` ويُخدَم عبر `express.static` على **نفس أصل الموقع** (C5-ج).
3. يرسل الرابط للضحية (موظف إدارة). عند فتحه، الجافاسكربت يعمل في سياق الموقع.
4. يقرأ `sessionStorage.getItem('afaq_staff_user')` ويُرسله للمهاجم.

**بالإضافة:** لا حد لعدد الملفات أو الحجم الإجمالي → استنزاف القرص = DoS.

**الإصلاح:**
```ts
const ALLOWED = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
]);
// تحقق من magic bytes وليس من الامتداد فقط
// استخدم UUID كاسم ملف على القرص، واحفظ الاسم الأصلي في قاعدة البيانات
```
وأضف `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` عند تقديم الملفات.

---

### H5 — إرسال بريد إلكتروني بلا مصادقة (تصيّد وانتحال)

**الملف:** `applicationsRoutes.ts:992` → `POST /api/applications/:id/send-response`

بلا مصادقة، و`emailService.ts` يرسل باسم الشركة الرسمي:
```ts
from: `"Afaq Global Admissions" <${GMAIL_USER}>`
```

**الأثر:** أي شخص يستطيع إرسال بريد من نطاق الشركة إلى أي طالب = حملة تصيّد موثوقة تماماً، وتشويه سمعة النطاق (قد يُدرَج في قوائم البريد المزعج). وكذلك `POST /:id/send-credentials` يُرسل بيانات الدخول لأي بريد يحدده المهاجم.

**الإصلاح:** حماية كل مسارات الإرسال بـ `requireAuth` + `requireRole('admin','counselor')`، والتحقق من أن البريد المستهدف مرتبط فعلاً بالطلب.

---

### H6 — تسريب المحادثات والملاحظات الداخلية (IDOR)

**الملف:** `server/routes/messagesRoutes.ts:16` → `GET /api/messages?application_id=X`

**الأثر:** المحادثات بين المستشار والطالب، **بما فيها الملاحظات الداخلية** (`is_internal_note: true` — يراها الموظفون فقط)، متاحة لأي شخص يعرف رقم الطلب.

**الإصلاح:** مصادقة + تحقق من الملكية + فلترة `is_internal_note = false` عندما يكون الطالب هو الطالب.

---

### H7 — تسريب معلومات عبر الأخطاء ورؤوس الاستجابة

**الأدلة:**
- كل مسار تقريباً يُعيد `error.message` الخام للعميل (مثلاً `usersRoutes.ts:122, 140, 178`). أخطاء PostgreSQL تكشف أسماء الجداول والأعمدة والقيود.
- `server.ts:38-47` — `/api/health` يكشف للعامة: `postgresConnected`، `cacheEngineStats`، اسم الخدمة، والدومين.
- `settingsRoutes.ts:54-55` — يكشف `X-Cache` و`X-Response-Time`.

**الإصلاح:**
```ts
console.error('[users]', error);   // التفاصيل في السجل فقط
return res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' });
```
وحمّل `/api/health` أو اجعله يُعيد `{status:'ok'}` فقط.

---

### H8 — تعطيل التحقق من شهادة TLS لقاعدة البيانات

**الملف:** `server/db.ts:14`
```ts
ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

**الأثر:** عند تفعيل SSL، لا يتم التحقق من هوية السيرفر → هجوم Man-in-the-Middle على اتصال قاعدة البيانات.

**الإصلاح:** `rejectUnauthorized: true` مع تزويد `ca` بشهادة CA الصحيحة.

---

### H9 — لا حد لمحاولات تسجيل الدخول

لا يوجد `express-rate-limit` في المشروع. مع C2 هذا أقل أهمية، لكن بعد إصلاح C2 يصبح brute-force ممكناً على `/api/users/login` و`/api/applications/portal-login`.

**الإصلاح:** `express-rate-limit` (مثلاً 5 محاولات كل 15 دقيقة لكل IP) + تأخير تدريجي + قفل الحساب مؤقتاً.

---

### H10 — كود الـ backend كامل مكشوف عبر Source Map

**الملف:** `package.json:8`
```json
"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"
```

**الأثر:** `dist/` يُخدَم كاملاً عبر `express.static` (و`server.ts:88`)، فيصبح `https://<الموقع>/server.cjs.map` متاحاً للعامة ويحتوي **كود المصدر الكامل للـ backend** — بما فيه كل منطق المصادقة، أسماء الجداول، والمسارات. هذا يُلغي أي "أمان بالإخفاء" ويسهّل على المهاجم إيجاد C2 وC4 وC7.

**الإصلاح:** احذف `--sourcemap` من أمر البناء الإنتاجي.

---

### H11 — توكن بوت تلغرام يُقرأ من أي زائر مجهول

**الملفات:** `server/routes/settingsRoutes.ts:28` + `src/services/api.ts`

```ts
const queryRes = await pool.query('SELECT * FROM settings');   // ← بلا فلترة
```
وبنية `SiteSettings` في الواجهة تحتوي `telegram_bot_token` و`telegram_chat_id`، و`getSiteSettings()` تُنادى عند تحميل كل صفحة.

**الأثر (كامن اليوم):** القيم المزروعة فارغة، لكن **بمجرد أن يحفظ المشرف توكن البوت من لوحة التحكم، يصبح أي زائر مجهول قادراً على قراءته** عبر `GET /api/settings`. والتوكن يمنح سيطرة كاملة على البوت (قراءة/إرسال رسائل، أرشفة). إضافةً لذلك `SettingsManager.tsx` يعرض التوكن في الواجهة ويُدرجه في كتلة SQL قابلة للنسخ.

**الإصلاح:** أزل حقول الأسرار من `GET /api/settings` العام (أعِد قائمة صريحة بالأعمدة العامة، أو أقنِع القيم بـ `***`)، واقرأ الأسرار من متغيرات البيئة فقط.

---

### H12 — لا فصل صلاحيات بين الموظفين (No RBAC) — ترقية ذاتية إلى مدير

**الملف:** `src/components/StaffDashboard.tsx:714-725`

`currentUser.role` يُستخدم **فقط** لتلوين شارة المستخدم، ولا يُقيّد أي تبويب. كل التبويبات التسعة — بما فيها **إدارة المستخدمين** و**الإعدادات (فيها توكن تلغرام)** — مفتوحة لأي موظف أو مستشار يسجّل الدخول.

**الأثر:** مستشار بصلاحيات محدودة → مدير كامل بضغطة واحدة. وفي الجانب الخادمي لا يوجد أي فحص دور أصلاً (C1).

**الإصلاح:** فحص الدور في الخادم لكل مسار (`requireRole('admin')`)، وإخفاء التبويبات في الواجهة كتحسين تجربة فقط — **وليست ضابطاً أمنياً**.

---

### H13 — بوابة الطالب تفتح تلقائياً بدون تسجيل دخول

**الملف:** `src/App.tsx:134-149`

```tsx
const saved = localStorage.getItem('afaq_active_app');
// ...
return MOCK_APPLICATIONS[0] || null;      // ← رجوع تلقائي لطلب وهمي
```

**الأثر:** عند أول زيارة تُعيد الواجهة `MOCK_APPLICATIONS[0]` كطلب نشط، فلا تُعرَض بوابة الدخول أصلاً — أي أن المستخدم "مسجَّل دخوله" في الواجهة بشكل غير مقصود. كذلك `localStorage['afaq_active_app']` يحمل **كائن الطلب كاملاً بما فيه `portalPassword`** (كلمة المرور نصاً في متصفح المستخدم)، وتسجيل الخروج يُلغى بمجرد تحديث الصفحة.

**الإصلاح:** أزل الرجوع إلى `MOCK_APPLICATIONS` في الإنتاج، ولا تخزّن `portalPassword` في `localStorage` إطلاقاً.

---

### H14 — حقن HTML في قوالب البريد الصادر (تصيّد من بريد الشركة)

**الملف:** `server/services/emailService.ts`

حقول مثل `messageText` و`studentName` تُدرَج في قوالب HTML **بدون تهريب (escaping)**، ومسارات الإرسال بلا مصادقة (H5).

**الأثر:** مهاجم يرسل بريداً يحمل HTML/روابط تصيّد يظهر كأنه صادر رسمياً من `Afaq Global Admissions` — مع تشويه سمعة النطاق واحتمال إدراجه في قوائم الحظر.

**الإصلاح:** هرّب كل القيم المتغيّرة، أو استخدم محرّك قوالب يهرّب تلقائياً.

---

## 5. الثغرات المتوسطة (MEDIUM)

| # | الوصف | الملف | الإصلاح |
|---|-------|-------|---------|
| M1 | حاويات Docker تعمل بصلاحية `root` (لا يوجد `USER`) | `Dockerfile`, `afaq-backend/Dockerfile` | أضف `USER node` قبل `CMD` |
| M2 | `npm install` بدل `npm ci` → بناء غير حتمي وقابل لحقن الحزم | `afaq-backend/Dockerfile:13` | استخدم `npm ci` مع lockfile |
| M3 | وجود `package-lock.json` و`bun.lock` معاً → تضارب في الإصدارات | الجذر | اختر مدير حزم واحد |
| M4 | لا حماية CSRF (منخفض الآن، سيصبح حرجاً بعد إضافة الكوكيز) | عام | `SameSite=Strict` + CSRF token عند استخدام الكوكيز |
| M5 | بيانات تواصل حقيقية مثبتة في الكود (هاتف، واتساب، عنوان، إيميلات) | `server/db.ts`, `src/components/Footer.tsx`, `emailService.ts:17-19` | نقلها كلها إلى متغيرات بيئة |
| M6 | لا حد لحجم/عدد الطلبات → DoS | `server.ts` | `express-rate-limit` + `express-slow-down` |
| M7 | `SELECT * FROM settings` يُعيد كل الإعدادات للعميل | `settingsRoutes.ts:28` | حدّد الأعمدة المطلوبة فقط |
| M8 | `.env.example` يحتوي دومين وبريداً حقيقياً وإيميل شخصي | `.env.example:17,19` | استبدلها بـ placeholders |
| M9 | لا يوجد تحقق من صحة المدخلات (لا `zod` ولا `joi`) | كل المسارات | أضف schema validation |
| M10 | `PUT /api/users/:id` بلا مصادقة = إعادة تعيين كلمة مرور أي مستخدم | `usersRoutes.ts:186` | مصادقة + منع تغيير الدور الذاتي |
| M11 | `.dockerignore` يستثني `.env` فقط بينما `COPY . .` — أي `.env.local` أو `*.pem` سيدخل طبقات الصورة | `.dockerignore` + `Dockerfile:17` | استخدم `.env*` و`*.pem` و`*.key` |
| M12 | `client_max_body_size` غير محدد في nginx (الافتراضي 1MB) بينما Express يقبل 15MB → فشل رفع كل مستند أكبر من 1MB | `afaq-frontend/nginx.conf` | أضف `client_max_body_size 16m;` |
| M13 | رمز بوابة الطالب يُولَّد بـ `Math.random()` (6 أرقام) — غير آمن تشفيرياً وقابل للتخمين | `StaffDashboard.tsx:1222` | استخدم `crypto.randomInt()` |
| M14 | حذف المستند يُفرّغ `file_url` فقط — الملف وبياناته الشخصية تبقى على القرص بلا أي مسار محو | `applicationsRoutes.ts:737` | حذف فعلي للملف + سجل تدقيق |
| M15 | حقن Markdown في تنبيهات تلغرام الإدارية عبر بيانات الطالب | `telegramService.ts` | هرّب المدخلات أو استخدم `parse_mode` بأمان |
| M16 | `.gitignore` لا يستثني `*.pem`/`*.key`/`*.crt`/`service-account*.json` | `.gitignore` | أضف الأنماط |
| M17 | لا `helmet` ولا رؤوس أمان على مستوى Express، و`server_tokens` مفعّل في nginx (كشف الإصدار) | `server.ts`, `nginx.conf` | أضف `helmet()` و`server_tokens off;` |

---

## 6. ملاحظات منخفضة ومعلوماتية

- **L1** اسم الحزمة `"react-example"` في `package.json:2` — من قالب Google AI Studio، غير احترافي.
- **L2** صور Base‏64 مكررة: نفس الصور موجودة في `public/images/` و`src/assets/images/` و`public/` (تضخيم المستودع إلى ~20 ميجابايت).
- **L3** صور بأسماء مكررة بنسخ مختلفة (`uk.jpg` و`uk_university_campus_1789309583030.jpg` بنفس المحتوى).
- **L4** لا يوجد ملف `LICENSE`.
- **L5** لا يوجد `README.md` حقيقي (تم حذفه من القالب الأصلي).
- **L6** لا توجد اختبارات (`test`) ولا CI/CD.

### ملاحظات GitHub (من فحص سجل Git)
- 🔴 **GitHub Secret Scanning و Push Protection معطّلان** — لا يوجد بلوك `security_and_analysis` إطلاقاً.
- 🔴 **الفرع `main` غير محمي** — لا يمنع force-push ولا يتطلب مراجعة.
- 🔴 **فرع `static`** (طرفه `caf412ac`) ما زال يحمل كلمة مرور قاعدة البيانات القديمة — تنظيف `main` وحده لا يكفي.
- 🟡 المستودع **عام** و`allow_forking: true` — أي شخص قد يكون عمل Fork ويحتفظ بالتاريخ القديم.
- ✅ لم يُرفع ملف `.env` حقيقي أبداً في أي من الـ 15 commit — `.gitignore` أدّى عمله.

---

## 7. جدول كل مسارات الـ API وحالتها الأمنية

**جميع المسارات التالية بلا مصادقة أو فحص صلاحيات:**

| الطريقة | المسار | الوظيفة | الخطر |
|---------|--------|---------|-------|
| POST | `/api/users/login` | دخول الموظفين | 🔴 تجاوز بكلمة مرور عامة |
| GET | `/api/users` | كل الموظفين | 🔴 تسريب PII |
| POST | `/api/users` | إنشاء مستخدم | 🔴 إنشاء مدير |
| PUT | `/api/users/:id` | تعديل مستخدم | 🔴 تغيير كلمة مرور |
| DELETE | `/api/users/:id` | حذف مستخدم | 🔴 تعطيل النظام |
| GET | `/api/customers` | كل العملاء | 🔴 تسريب PII |
| GET | `/api/customers/:id` | عميل واحد | 🔴 تسريب PII |
| POST | `/api/customers` | إنشاء عميل | 🟠 تلويث البيانات |
| PUT | `/api/customers/:id` | تعديل عميل | 🟠 تلاعب بالبيانات |
| GET | `/api/applications` | كل الطلبات | 🔴 تسريب PII |
| GET | `/api/applications/:id` | طلب واحد | 🔴 تسريب PII |
| POST | `/api/applications` | إنشاء طلب | 🟠 إساءة استخدام |
| PATCH | `/api/applications/:id/status` | تغيير الحالة | 🟠 تلاعب |
| PUT | `/api/applications/:id` | تعديل طلب | 🟠 تلاعب |
| POST | `/api/applications/:id/documents` | رفع مستند | 🔴 رفع ملفات ضارة |
| DELETE | `/api/applications/:id/documents/:docId` | حذف مستند | 🟠 تخريب |
| PATCH | `/api/applications/:id/documents/:docId` | تعديل مستند | 🟠 تلاعب |
| **GET** | **`/api/applications/:id/documents/:docId/file`** | **تنزيل مستند** | 🔴 **جوازات سفر مكشوفة** |
| POST | `/api/applications/portal-login` | دخول الطالب | 🔴 كلمة مرور افتراضية |
| PATCH | `/api/applications/:id/portal-password` | تغيير كلمة مرور الطالب | 🔴 اختطاف حساب |
| POST | `/api/applications/:id/send-credentials` | إرسال بيانات دخول | 🔴 تصيّد |
| POST | `/api/applications/:id/send-response` | إرسال بريد | 🔴 تصيّد |
| GET | `/api/messages` | محادثات | 🔴 IDOR + ملاحظات داخلية |
| POST | `/api/messages` | إرسال رسالة | 🟠 انتحال |
| GET | `/api/settings` | إعدادات الموقع | 🟡 معلومات |
| PUT | `/api/settings` | تعديل الإعدادات | 🔴 تخريب الموقع |
| GET | `/api/countries` | دول | 🟢 عام بطبيعته |
| POST/PUT/DELETE | `/api/countries...` | إدارة الدول | 🟠 تخريب |
| GET | `/api/universities` | جامعات | 🟢 عام بطبيعته |
| POST/PUT/DELETE | `/api/universities...` | إدارة الجامعات | 🟠 تخريب |
| GET | `/api/majors` | تخصصات | 🟢 عام بطبيعته |
| POST/PUT/DELETE | `/api/majors...` | إدارة التخصصات | 🟠 تخريب |
| GET/POST/PUT | `/api/meetings` | المواعيد | 🟠 تسريب/تلاعب |
| GET | `/api/paragraphs` | نصوص | 🟢 عام بطبيعته |
| PUT | `/api/paragraphs/:slug` | تعديل النصوص | 🟠 تخريب |
| GET | `/api/cache/stats` | إحصاءات الكاش | 🟡 معلومات |
| POST | `/api/cache/clear` | تفريغ الكاش | 🟠 DoS |
| POST | `/api/cache/invalidate` | إبطال الكاش | 🟠 DoS |
| GET | `/api/health` | حالة الخادم | 🟡 معلومات |

---

## 8. خطة الإصلاح — بالترتيب

### المرحلة 0 — فورية (اليوم)
> المشروع غير منشور حالياً، لذا لا يوجد تسريب نشط. **أنجز هذه قبل أي إعادة نشر.**

1. **احذف كلمتي المرور العامّتين** من `usersRoutes.ts:53-56` و`103-106` ومن `StaffDashboard.tsx:241`.
2. **احذف الباب الخلفي في الواجهة**: أزل `sessionStorage` كأساس للصلاحية، وأزل منطق `fallbackUser`، وأزل أزرار الدخول السريع (`StaffDashboard.tsx:597-643`).
3. **احذف `OR $2 = '123456'`** من `applicationsRoutes.ts:892` و`908`، وأزل `"portalPassword"` من استعلام `portal-login`.
4. **احذف `app.use('/uploads', express.static(...))`** من `server.ts:71-72`.
5. **أصلح قراءة الملفات العشوائية** (C7): لا تقبل `fileUrl` من العميل — تحقق من أن المسار داخل `uploads/` عبر `path.resolve` + فحص البادئة.
6. **أزل `--sourcemap`** من أمر البناء في `package.json:8`.
7. **أزل الرجوع إلى `MOCK_APPLICATIONS[0]`** في `src/App.tsx:149` (يفتح بوابة الطالب تلقائياً).
8. **أعِد تعيين كلمات مرور كل الحسابات** (موظفين وطلاب) — اعتبرها مكشوفة.

### المرحلة 1 — هذا الأسبوع
6. أضف middleware مصادقة (JWT) + `requireRole`، وطبّقه على كل مسار إداري.
7. استبدل تخزين كلمات المرور النصي بـ **bcrypt** (cost 12).
8. احمِ مسار تنزيل المستندات بالملكية، وانقل الملفات خارج `public/`.
9. أضف `express-rate-limit` على `/login` و`/portal-login`.
10. أصلح تسريب الأخطاء (`error.message`) في كل المسارات.
11. **غيّر كلمة مرور PostgreSQL** ثم احذف القيمة الحرفية من `server/db.ts`.

### المرحلة 2 — هذا الشهر
12. HTTPS إلزامي + رؤوس الأمان في nginx + HSTS.
13. أزل `ports: 5432:5432` من `docker-compose.yml`.
14. أضف تحقق نوع/حجم الملفات (قائمة MIME بيضاء + magic bytes + UUID كاسم ملف).
15. أضف `zod` للتحقق من صحة كل المدخلات.
16. `rejectUnauthorized: true` في `server/db.ts:14`.
17. فعّل GitHub Secret Scanning + Push Protection + حماية الفرع `main`.
18. نظّف سجل Git على الفرعين `main` و`static` بـ `git filter-repo`، ثم راسل دعم GitHub لعمل GC — **مع العلم أن هذا لا "يُلغي" التسريب الحاصل، بل يمنع الوصول المستقبلي فقط.**

### المرحلة 3 — تحسينات
19. تشغيل الحاويات بمستخدم غير root، واستخدام `npm ci`.
20. توحيد مدير الحزم (احذف `bun.lock` أو`package-lock.json`).
21. نقل كل البيانات الحساسة/التواصل إلى متغيرات بيئة.
22. فحص ثغرات الحزم (`npm audit` / Dependabot).
23. نسخ احتياطي مشفّر لقاعدة البيانات + خطة استجابة للحوادث.
24. مراجعة الامتثال لـ PDPL/GDPR لبيانات الطلاب.

---

## 9. التقارير التفصيلية المرفقة

هذا التقرير ملخّص موحّد. التفاصيل الكاملة (كل نتيجة بموقعها، دليلها، وأثرها) في الملفات التالية داخل مجلد `afaq-audit/findings/`:

| الملف | النطاق | العدد |
|-------|--------|-------|
| `01-config-secrets.md` | الإعدادات، Docker، nginx، الأسرار، النشر | 25 نتيجة (3 حرجة، 3 عالية) |
| `02-backend-auth-api.md` | المصادقة، الصلاحيات، كل مسارات الـ API | 35 نتيجة (8 حرجة، 10 عالية) |
| `03-data-files-integrations.md` | قاعدة البيانات، رفع/قراءة الملفات، التكاملات | 25 نتيجة (5 حرجة، 5 عالية) |
| `04-frontend-exposure.md` | الواجهة، الجلسات، الأسرار في المتصفح | 22 نتيجة (3 حرجة، 6 عالية) |
| `05-git-history-secrets.md` | سجل Git كاملاً (15 commit) بحثاً عن أسرار | 14 سلسلة أسرار مُصنّفة |

**الإجمالي: 107 نتيجة موثّقة.**

### ملاحظة أمنية خاصة: تعليق موجَّه للوكلاء الآليين

`vite.config.ts` يحتوي تعليقاً موجَّهاً صراحةً للوكلاء الذكاء الاصطناعي:

> `"Do not modify—file watching is disabled to prevent flickering during agent edits."`

القصد منه **بريء تماماً** ويخصّ أداء المراقبة، ولا يوجد أي محتوى خبيث أو مخفي في المشروع كله (تم فحص ذلك). أذكره هنا فقط للشفافية: الفحص التعامل معه **كبيانات لا كتعليمات**، ولم يُنفَّذ. لكن انتبه مستقبلاً إلى أن أي تعليق في أي مستودع قد يحاول توجيه أي أداة آلية تفحصه — وهذا نمط يُسمّى **Prompt Injection**، وقد يكون ضاراً في مشاريع أخرى.

---

## 10. الحكم النهائي

| المعيار | التقييم |
|---------|---------|
| المصادقة (Authentication) | ❌ غير موجودة |
| الصلاحيات (Authorization) | ❌ غير موجودة |
| حماية كلمات المرور | ❌ نص صريح |
| حماية البيانات الشخصية | ❌ جوازات سفر مكشوفة |
| أمان النقل (TLS) | ❌ لا يوجد |
| أمان قاعدة البيانات | ❌ منفذ منشور + كلمة مرور افتراضية |
| أمان الملفات (رفع/تنزيل) | ❌ قراءة أي ملف + تنزيل جوازات بلا مصادقة |
| التحقق من المدخلات | ⚠️ جزئي |
| SQL Injection | ✅ محصّن |
| XSS | ✅ لا يوجد sink خطر |
| إدارة الأسرار | ✅ لا أسرار طرف ثالث مُسرّبة |

**الخلاصة:** المشروع في مرحلته الحالية **نموذج أولي (Prototype) بمعمارية أمنية غائبة تماماً**. لا يمكن اعتباره جاهزاً لاستقبال بيانات طلاب حقيقية. المطلوب ليس "ترقيع ثغرات" بل **بناء طبقة مصادقة وصلاحيات من الصفر** — وهو عمل مقداره أيام قليلة، وليس أسابيع، لأن باقي الكود (طبقة قاعدة البيانات، الواجهة، البنية) سليم ومنظّم.

**الجانب الإيجابي:** البنية جيدة، الاستعلامات محصّنة ضد SQL Injection، والكود منظّم بوضوح. المشكلة مركّزة في **طبقة واحدة غائبة** (المصادقة والصلاحيات)، وهذا يسهّل الإصلاح كثيراً.

---

*أُعِدّ هذا التقرير بواسطة DeepSeek Harness — فحص ثابت (Static Analysis) لكود المصدر وسجل Git. لم يتضمن فحصاً ديناميكياً (Penetration Testing) على سيرفر حي.*
