# نشر آفاق خلف Cloudflare Tunnel + Zero Trust

دليل تشغيل كامل. الهدف النهائي: **صفر منافذ مفتوحة على السيرفر**، وTLS مُنهى على حافة Cloudflare، وطبقة تحقق ثانية على مسارات الإدارة.

---

## 1. لماذا هذا الإعداد

```
المتصفح ──TLS──> حافة Cloudflare ──نفق مشفّر──> cloudflared ──شبكة Docker──> nginx ──> Express
         └──────── مشفّر ────────┘              └──── لا يخرج من المضيف ────┘
```

- `cloudflared` **تبدأ الاتصال صادراً** إلى Cloudflare، فلا يحتاج السيرفر أي منفذ وارد.
- الجزء الوحيد غير المشفّر هو `cloudflared → nginx` داخل شبكة Docker، ولا يمرّ على أي شبكة خارجية.
- **لا حاجة لشهادة TLS على السيرفر**، ولا لـ `certbot`، ولا لبلوك 443 في nginx.

---

## 2. إنشاء النفق

على السيرفر (مرة واحدة):

```bash
# 1. تسجيل الدخول إلى حسابك في Cloudflare
cloudflared tunnel login

# 2. إنشاء النفق — احفظ الـ UUID الظاهر في المخرجات
cloudflared tunnel create afaq-global

# 3. ربط النطاق بالنفق (ينشئ سجل CNAME تلقائياً)
cloudflared tunnel route dns afaq-global afaq-global.amrodev.com

# 4. تأكيد الإنشاء
cloudflared tunnel list
```

سيُنشأ ملف الاعتماد في `~/.cloudflared/<TUNNEL-UUID>.json`.

```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<TUNNEL-UUID>.json /etc/cloudflared/
sudo chmod 600 /etc/cloudflared/*.json
sudo chown -R root:root /etc/cloudflared
cp config.yml /etc/cloudflared/config.yml   # من هذا المجلد
sudo sed -i 's/REPLACE_WITH_TUNNEL_UUID/<TUNNEL-UUID>/' /etc/cloudflared/config.yml
```

> ⚠️ ملف `credentials.json` سرّ فعلي — صلاحيات `600` ومالكه `root`، ولا يدخل Git أبداً.

---

## 3. الطريقة المفضّلة: cloudflared كحاوية (صفر منافذ)

```bash
# أضف توكن النفق إلى .env  (من: Zero Trust ← Networks ← Tunnels ← اختر النفق ← Install)
echo 'CLOUDFLARE_TUNNEL_TOKEN=<التوكن>' >> .env

# شغّل الحزمة كاملة
docker compose -f docker-compose.yml -f docs/deploy/cloudflared/cloudflared.compose.yml up -d
```

الآن **احذف قسم `ports` بالكامل** من خدمة `afaq_frontend` في `docker-compose.yml`، لأن cloudflared تصل إليها عبر الشبكة الداخلية باسم `afaq_frontend:80`.

**تحقّق:**

```bash
docker ps --format '{{.Names}}\t{{.Ports}}'
# يجب ألا يظهر أي منفذ منشور على أي حاوية

ss -tlnp | grep -v ':22'
# يجب ألا يظهر شيء غير SSH
```

---

## 4. إعدادات Cloudflare الإلزامية

من لوحة Cloudflare لهذا النطاق:

| الإعداد | المكان | القيمة |
|---------|--------|--------|
| Always Use HTTPS | SSL/TLS ← Edge Certificates | ✅ مُفعَّل |
| Minimum TLS Version | SSL/TLS ← Edge Certificates | TLS 1.2 |
| HSTS | SSL/TLS ← Edge Certificates | ✅ مُفعَّل (ابدأ بـ `max-age=86400` ثم زدها) |
| Opportunistic Encryption | SSL/TLS ← Edge Certificates | ✅ |
| TLS 1.3 | SSL/TLS ← Edge Certificates | ✅ |
| Bot Fight Mode | Security ← Bots | ✅ (اختياري) |

> **مهم:** فعّل HSTS من Cloudflare **وليس من nginx**. في هذا الإعداد يصل الطلب إلى nginx عبر HTTP داخلي، وترويسة HSTS من Cloudflare هي التي تصل للمتصفح فعلاً.

---

## 5. Zero Trust Access — طبقة ثانية لمسارات الإدارة

الهدف: لا يصل الطلب إلى خادمك إطلاقاً قبل التحقق من هوية الموظف.

### إنشاء التطبيق

`Zero Trust` ← `Access` ← `Applications` ← `Add an application` ← `Self-hosted`

**التطبيق الأول — مسارات الـ API الإدارية:**

| الحقل | القيمة |
|-------|--------|
| Application name | Afaq Admin API |
| Session Duration | 8 hours |
| Public hostname | `afaq-global.amrodev.com` |
| Path | `api/users/*` |

ثم **أضف مسارات إضافية لنفس التطبيق** (Add a path):
`api/customers/*` · `api/cache/*` · `api/settings` (فقط PUT) · `api/meetings/*`

> ملاحظة: Cloudflare Access تعمل على المسار ولا تفرّق بين GET و PUT. لذلك حماية `/api/settings` تعني حماية القراءة العامة أيضاً — وهذا **يكسر الموقع العام**. حماية `/api/settings` غير ضرورية بعد الإصلاحات: الخادم يحذف المفاتيح السرّية من الاستجابة ويرفض كتابتها. **اتركها غير محمية.**

**التطبيق الثاني — لوحة الإدارة نفسها:**

| الحقل | القيمة |
|-------|--------|
| Application name | Afaq Admin UI |
| Path | `admin*` |

> اللوحة تُفتح عبر `#admin`، وهو جزء لا يُرسَل إلى السيرفر (Fragment)، فلا يمكن حمايته بـ Access. لكن **الـ API الذي يقرأ البيانات محمي فعلاً**، ولوحة مفتوحة بلا جلسة لا تعرض شيئاً. اضبط سياسة على `api/*` الإدارية كما أعلاه وهذا كافٍ.

### السياسة

في تبويب `Policies` أضف:

- **Action:** `Allow`
- **Include:** `Emails` ← أضف بريد كل موظف إدارياً (أو `Emails ending in @amrodev.com`)

ثم أضف سياسة ثانية:

- **Action:** `Block`
- **Include:** `Everyone`

الترتيب مهم: `Allow` قبل `Block`.

### ⚠️ تحذير حاسم

**لا تجعل Zero Trust بديلاً عن مصادقة التطبيق.** هي طبقة إضافية فقط. الأسباب:

1. سياسة Access تُضبط على مستوى النطاق — خطأ واحد في مسار يفتح كل شيء.
2. لو عُطّلت أو تغيّر الحساب، يصبح خادمك مكشوفاً فوراً.
3. لا تحمي من مهاجم داخل النطاق المسموح (جهاز موظف مخترق).

المصادقة التي في الكود (`requireAuth` / `requireStaff` / `requireAdmin`) هي الأساس، وAccess طبقة ثانية فوقها.

---

## 6. قواعد WAF الموصى بها

من `Security` ← `WAF` ← `Custom rules`:

**1) حظر الطلبات الكبيرة على مسارات غير الرفع:**
```
(http.request.uri.path contains "/api/" and not http.request.uri.path contains "/documents")
and http.request.body.size > 1048576
→ Block
```
السبب: حد Express هو 15MB ولا يحتاجه غير مسار رفع المستندات.

**2) حظر الوصول المباشر لمسارات الملفات القديمة:**
```
http.request.uri.path contains "/uploads/"
→ Block
```
الخادم يُعيد 404 أصلاً، لكن الحجب على الحافة يوفّر الموارد.

**3) تحديد معدّل على تسجيل الدخول (طبقة إضافية):**
`Security` ← `WAF` ← `Rate limiting rules`
- المسار: `api/users/login` و `api/applications/portal-login`
- الحد: 10 طلبات / دقيقة لكل IP
- الإجراء: `Block` لمدة 10 دقائق

> الخادم يحدّ المعدّل بنفسه على `CF-Connecting-IP`، وهذه طبقة إضافية على الحافة.

---

## 7. قائمة تحقق نهائية

```bash
# 1) لا منافذ منشورة
docker ps --format '{{.Names}}\t{{.Ports}}'

# 2) لا شيء يستمع غير SSH
sudo ss -tlnp | grep -v ':22'

# 3) قواعد Docker في iptables (تتجاوز ufw!)
sudo iptables -t nat -L DOCKER -n

# 4) نفق يعمل
docker logs afaq_cloudflared --tail 20 | grep -i "registered\|error"

# 5) الـ API محمي من الخارج
curl -s -o /dev/null -w "%{http_code}\n" https://afaq-global.amrodev.com/api/users
# المتوقع: 401 (أو 302 إلى صفحة تسجيل الدخول إن فعّلت Access)
```

| البند | الحالة |
|-------|--------|
| [ ] لا منافذ منشورة (`docker ps`) | |
| [ ] لا نشر لـ 5432 | |
| [ ] `TRUST_PROXY=2` في `.env` | |
| [ ] Always Use HTTPS + HSTS + TLS 1.2 من Cloudflare | |
| [ ] سياسة Access على مسارات الإدارة | |
| [ ] `curl /api/users` يُعيد 401 من الإنترنت | |
| [ ] SSH محمي بمفتاح فقط (`PasswordAuthentication no`) | |

---

## 8. أوامر تشخيص شائعة

```bash
# اختبار النفق محلياً بلا تثبيت خدمة
cloudflared tunnel --config /etc/cloudflared/config.yml run

# عرض معلومات النفق
cloudflared tunnel info afaq-global

# اختبار أن الخادم يرى HTTPS فعلاً (يجب أن تظهر ترويسة HSTS)
curl -sI https://afaq-global.amrodev.com/api/health | grep -i strict-transport

# التأكد أن كلمة مرور بوابة الطالب القديمة لم تعد تعمل (يجب 401)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://afaq-global.amrodev.com/api/applications/portal-login \
  -H 'Content-Type: application/json' \
  -d '{"loginId":"AFQ-2026-8812","password":"123456"}'
```

آخر أمرين هما أهم تحقق عملي: الأول يثبت أن إصلاح `X-Forwarded-Proto` يعمل عبر النفق الحقيقي، والثاني يثبت أن الباب الخلفي أُغلق.
