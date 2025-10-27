# Project Rules – <App/Service Name>
Purpose: ship a public, production-ready application with reliable login, zero-tolerance for trivially preventable errors, and fast rollback.

## 0) Scope & Environments
- Target environments: **dev**, **staging**, **prod** (identical except scale/secrets).
- All config comes from **environment variables**; no secrets in code. (12-Factor)  [oai_citation:4‡Twelve-Factor App](https://12factor.net/?utm_source=chatgpt.com)
- Secrets via <Vault/KMS/Parameter Store>; annual key rotation; zero shared human accounts.

## 1) Source Control & Branching
- `main` is production. Release branches tag versions; feature branches → MR with:
  - Lint + typecheck + unit tests
  - SAST/Dependency scan
  - Migration dry-run (if DB)
  - Preview deploy

## 2) Build, Test, Quality Gates
### Tests
- **Unit** coverage ≥ **85%** for core/auth; **no criticals** open.
- **Integration** tests: auth flows, DB, queue, email/SMS.
- **E2E** smoke on every deploy (Cypress/Playwright).
- **Load test**: meet SLO p95 login < **400 ms**, homepage < **600 ms** at baseline N RPS.

### Quality Gates (CI must fail if any fail)
- Lint/typecheck clean; no `TODO`/`console.log` in prod bundles.
- No **high** or **critical** vuln (SCA/SAST).
- Coverage threshold met; migrations idempotent.

(See Google SRE **launch readiness** mindset for PRR.)  [oai_citation:5‡Google SRE](https://sre.google/sre-book/launch-checklist/?utm_source=chatgpt.com)

## 3) Authentication & Account Lifecycle (production-grade)
Implement per **NIST 800-63B** (AAL1+ minimum) & **OWASP ASVS** sections V2/V3.  [oai_citation:6‡NIST Pages](https://pages.nist.gov/800-63-3/sp800-63b.html?utm_source=chatgpt.com)

### Allowed auth methods
- **OIDC/OAuth2** with PKCE for public clients; **confidential** clients use client secrets.
- **Password auth** allowed with:
  - 12+ char passphrases; permit long (≥64); **no forced mixed-char rules**; check against **breached lists** on signup/reset. (NIST)  [oai_citation:7‡NIST Pages](https://pages.nist.gov/800-63-3/sp800-63b.html?utm_source=chatgpt.com)
  - Online guessing protection: exponential backoff + IP/Account risk scoring.

### Sessions & Tokens
- HTTPS only; HSTS enabled.
- Session cookies: `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict` if possible).
- Server-side session invalidation on logout; rotate session ID after auth; idle timeout 15–30m; absolute timeout 8–12h. (OWASP Session Mgmt)  [oai_citation:8‡OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html?utm_source=chatgpt.com)
- OAuth2:
  - Use **Authorization Code + PKCE**.
  - **Refresh token rotation** or **sender-constrained refresh tokens**; detect reuse; revoke on suspicion. (OAuth BCP / RFC 9700)  [oai_citation:9‡IETF](https://www.ietf.org/archive/id/draft-ietf-oauth-security-topics-29.html?utm_source=chatgpt.com)

### Account flows (must pass E2E)
- Signup/consent; email/phone verification (rate-limited).
- Login: username/password, SSO, **MFA** opt-in (TOTP/WebAuthn where possible).
- Forgot password (token, one-use, short TTL).
- Lockout & unlock, device/session list, sign-out-all.
- PII export/delete endpoints (privacy).

## 4) Security Controls (ASVS L2 baseline)
- **Input validation** centrally; encode on output.
- **CSRF** on state-changing endpoints (double submit or SameSite).
- **RBAC**: deny-by-default; permission checks server-side.
- **Rate limits** per IP/user/route; CAPTCHA only as last resort.
- **Dependencies** scanned; pin hashes; renovate weekly.
- **Headers**: CSP, X-Content-Type-Options, X-Frame-Options/Frame-Ancestors, Referrer-Policy.

(ASVS maps and cheat sheets)  [oai_citation:10‡OWASP Foundation](https://owasp.org/www-project-application-security-verification-standard/?utm_source=chatgpt.com)

## 5) Data, Migrations, and Backups
- Schema migrations are **reversible**; pre-deploy dry-run on staging data.
- Backups: daily encrypted, restore tested monthly; RPO ≤ 24h, RTO ≤ 4h.
- PII minimization; data retention policy documented.

## 6) Observability & Ops
- Logs are structured JSON; **no secrets/PII**. Correlate by request ID.
- Metrics: SLIs for **availability**, **latency**, **error rate**, **saturation**; SLOs documented.
- Tracing across gateway → service → DB.
- Alerts page to humans only on **user-visible impact**; on-call rota + runbooks.

## 7) CI/CD & Releases
- Pipeline: build → test → scan → package → deploy (blue/green or canary).
- **Automatic rollback** on health check regressions; feature flags for risky code.
- Post-deploy smoke: health, login, create/read/update critical entity, logout.

## 8) Frontend Reliability
- Type-safe API client; zod/io-ts runtime validation on responses.
- Error boundaries; offline fallback; retry with jitter on idempotent calls.

## 9) Performance Budgets
- FE: LCP < 2.5s, TTI < 3.5s on 4G mid-tier device; JS < 300KB initial.
- BE: p95 endpoints < 400–600ms; cold starts < 1s; queue lag < 2s.

## 10) Accessibility & Internationalization
- WCAG 2.2 AA for flows (especially login, forms, focus order).
- Localize auth messages; right-to-left ready if needed.

## 11) Compliance & Privacy
- Display privacy policy; lawful basis for processing; cookie banner if required.
- Data subject rights: export/delete; audit logs for admin actions.

## 12) Production Readiness Review (PRR) – must pass before first public launch
- PRR checklist completed and signed by Eng + Security + Ops.
- GameDay/chaos: kill DB replica, expire secrets, block outbound DNS—prove the runbooks.
- Load & soak test at 2× expected traffic for 1h; no error budget burn > threshold.
(See Google SRE PRR & launch checklist.)  [oai_citation:11‡Google SRE](https://sre.google/sre-book/evolving-sre-engagement-model/?utm_source=chatgpt.com)

## 13) “Done” Definition for Any Feature
- Unit + integration + e2e tests added and passing in CI.
- Telemetry + alerts defined.
- Security review comments addressed.
- Docs updated (README, runbooks, ADR if needed).
- Feature flag scoped and with rollback plan.

## 14) Login Test Matrix (run in CI nightly + on every release)
- [ ] Username/password: good creds, bad creds, throttling after N attempts.
- [ ] OIDC: PKCE flow success/fail; token storage; refresh rotation.
- [ ] MFA: enroll, challenge, recovery codes.
- [ ] Session lifecycle: rotation on auth, idle/absolute timeout, logout invalidates server session.
- [ ] Forgot password: token TTL, single-use, invalid after change.
- [ ] CSRF checks on POST/PUT/PATCH/DELETE.
- [ ] Cookie flags present (`Secure`, `HttpOnly`, `SameSite`).
- [ ] Authorization: role boundary tests (user cannot access admin).
- [ ] Browser + device matrix (Chrome, Safari, Firefox, iOS/Android WebView).

## 15) Runbooks (link)
- Incident: elevated 401/403, auth latency, IdP outage, token reuse detected.
- Emergency rotate secrets/keys; revoke sessions; notify users.