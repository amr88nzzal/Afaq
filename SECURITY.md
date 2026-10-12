# Security Policy — سياسة الأمان

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ |
| `security-fixes` branch | ✅ (pending merge) |
| older commits / `static` branch | ❌ |

Only the latest commit on `main` receives security fixes.

---

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through either channel:

1. **GitHub Private Vulnerability Reporting** (preferred) —
   *Security* tab → *Report a vulnerability*.
2. **Email** — `amr.nzzal@gmail.com` with the subject `[SECURITY] Afaq`.

Include, as far as you can:

- what the issue is and where (file, route, parameter),
- how to reproduce it (request/response, or a short proof of concept),
- the impact you believe it has,
- any suggested fix.

### What to expect

| Stage | Target |
|-------|--------|
| Acknowledgement | within 3 days |
| Initial assessment | within 7 days |
| Fix or mitigation plan | within 30 days |
| Public disclosure | coordinated, after a fix ships |

Please give us a reasonable window to fix the issue before disclosing it
publicly. We will credit you in the release notes unless you ask us not to.

---

## Security model — what this project assumes

Understanding the intended deployment helps you judge whether something is a
vulnerability or expected behaviour.

**Deployment:** Cloudflare Tunnel + Zero Trust. The origin server accepts **no
inbound connections**; `cloudflared` opens an outbound tunnel to Cloudflare and
TLS terminates at Cloudflare's edge. Only SSH remains open on the host.

**Authentication:** opaque random session tokens held in an `httpOnly`,
`SameSite=Strict` cookie. Tokens are stored server-side as SHA-256 hashes and
can be revoked immediately (logout, password change, account deactivation).

**Authorization:** enforced server-side on every route
(`requireAuth` / `requireStaff` / `requireAdmin`). Any check in the React UI is
presentation only and is never a security boundary.

**Passwords:** hashed with `scrypt` (Node's built-in `crypto`, no external
dependency). Plaintext values are never stored or returned by the API.

**Uploaded documents:** stored outside `public/` under opaque `upload:<uuid>`
references. Download requires a session and passes an ownership check. Files
are validated by magic bytes against an allowlist.

**Secrets:** environment variables only. Secret keys are stripped from
`GET /api/settings` and rejected by `PUT /api/settings`.

### Out of scope

- Findings that require an attacker to already control the origin server,
  the Docker daemon, or the Cloudflare account.
- Missing hardening on endpoints that are unreachable from the internet.
- Rate limiting or DoS on static assets served by Nginx.
- Reports produced solely by an automated scanner without a working
  proof of concept.
- Social engineering, physical access, and third-party service outages.

---

## Hardening checklist for operators

See [`docs/security/README-AR.md`](docs/security/README-AR.md) for the full
Arabic security documentation and the pre-deployment checklist.

Minimum before going live:

- [ ] `INITIAL_ADMIN_PASSWORD` set, and the admin password changed after first login.
- [ ] `DATABASE_URL` uses a fresh strong password (the old committed value is burned).
- [ ] `TRUST_PROXY=2` when deployed behind Cloudflare Tunnel.
- [ ] No published ports in `docker-compose.yml` (`docker ps` shows none).
- [ ] Cloudflare: *Always Use HTTPS*, HSTS, Minimum TLS 1.2 enabled.
- [ ] GitHub: Secret Scanning, Push Protection and branch protection enabled.
- [ ] `git check-ignore -v .env` confirms `.env` is never committed.
