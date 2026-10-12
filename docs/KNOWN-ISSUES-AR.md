# مشكلات معروفة وبيئة التطوير

## 1. `npm run build` يفشل بـ `Cannot find native binding`

**الأعراض:**

```
Error: Cannot find native binding. npm has a bug related to optional dependencies
(https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing
both package-lock.json and node_modules directory.
```

أو رسالة مشابهة عن `@rollup/rollup-<platform>` أو `lightningcss-<platform>` أو
`@tailwindcss/oxide-<platform>`.

**السبب:** خلل معروف في npm ([#4828](https://github.com/npm/cli/issues/4828))
حيث لا تُثبَّت الاعتماديات الاختيارية الخاصة بالمنصّة إذا كان `package-lock.json`
قد وُلّد على منصّة أو إصدار npm مختلف.

**الحل:** أُصلح جذرياً في هذا المستودع بإعادة توليد ملف القفل. إن تكرّر:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**لا تستخدم** `npm install <package> --no-save` كحل — جرّبناه وفشل: كل أمر يزيل
حزمة المنصّة الأخرى. الحل الصحيح هو إعادة توليد القفل.

**تحقّق من السلامة بعد الإصلاح:**

```bash
npx tsc --noEmit        # يجب: صفر أخطاء
npm run build           # يجب: dist/server.cjs بلا أخطاء
ls dist/*.map           # يجب: لا يوجد أي ملف .map
```

---

## 2. إصدار Node المطلوب

```
engines: { node: "^20.19.0 || >=22.12.0" }
```

الملف `.nvmrc` يحدّد **22** (LTS الحالي).

```bash
nvm install 22 && nvm use 22
# أو
fnm use
```

**الأعراض على إصدار أقدم** (مثل 20.14): تحذير `EBADENGINE` عند كل أمر npm،
وقد يفشل البناء في حزم مثل `@vitejs/plugin-react`.

---

## 3. منافذ Docker تتجاوز `ufw`

`Docker` يُدرج قواعده في سلاسل `iptables` الخاصة به (DOCKER/FORWARD) ولا تمرّ
عبر قواعد `INPUT` التي يكتبها `ufw`. **منفذ منشور بـ `ports:` يبقى مفتوحاً من
الإنترنت حتى لو كان `ufw` يمنعه.**

```bash
# اعرض ما تنشره الحاويات فعلاً
docker ps --format '{{.Names}}\t{{.Ports}}'

# اعرض قواعد Docker في iptables
sudo iptables -t nat -L DOCKER -n
```

**الحل في هذا المشروع:** لا تُنشر أي منفذ إطلاقاً. الوصول يتم عبر
Cloudflare Tunnel فقط — راجع
[`docs/deploy/cloudflared/README-AR.md`](../deploy/cloudflared/README-AR.md).

إن كنت تعتمد على `ufw` وحدها، فاستخدم **Cloud Security Group** من مزوّد
السحابة بدلاً منها، أو اربط المنافذ بـ `127.0.0.1` فقط.

---

## 4. الجلسات لا تبقى بعد إعادة تشغيل الخادم

الجلسات محفوظة في ذاكرة العملية (`server/services/sessionService.ts`)، فإعادة
التشغيل أو إعادة نشر الحاوية تُسجّل الخروج للجميع.

- **للموظفين:** مدة الجلسة 8 ساعات.
- **للطلاب:** ساعتان.

هذا **مقصود** وهو أكثر أماناً (مدة محدودة، وإبطال فوري عند تغيير كلمة المرور).
للترقية إلى جلسات تدوم: انقل الـ `Map` في `sessionService.ts` إلى جدول
`sessions` في PostgreSQL — لا يحتاج تغيير أي مسار آخر.

---

## 5. وضع الذاكرة المتكاملة (بلا PostgreSQL)

إن غاب `DATABASE_URL` يعمل النظام بمخزن على القرص في `server/data/store.json`.

- مناسب للتطوير فقط.
- **`INITIAL_ADMIN_PASSWORD` لا يُطبَّق بعد أول تشغيل**، لأن كلمة المرور صارت
  مخزّنة ومُشفَّرة. لتغييرها: احذف `server/data/store.json` ثم أعد التشغيل، أو
  غيّرها من لوحة التحكم.
- المجلد مستثنى في `.gitignore` — لا ترفعه أبداً (يحتوي بيانات طلاب تجريبية).

---

## 6. لا تعمل على مستودع Git داخل OneDrive

OneDrive يقفل ملفات `.git` ويسبب تعارضات مزامنة وتعديلات غير متوقعة.

اعمل في مسار عادي مثل `C:\Users\<user>\Projects\` — وليس داخل
`OneDrive\Documents\`.

---

## 7. ملف القفل واحد فقط

المشروع يُدار بـ **npm** وحده. حُذف `bun.lock` لأن وجوده بجانب
`package-lock.json` كان يسبب التباساً وفشل تثبيت.

- لتثبيت حتمي: `npm ci`
- لتحديث الاعتماديات: `npm install` ثم تحقّق من الفرق في `package-lock.json`

لا تُضِف ملف قفل من مدير حزم آخر.
