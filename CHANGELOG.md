# Changelog

All notable changes to Tracciona are documented here. Format based on [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added

- Sessions 47-55: Security hardening, modularization, testing, documentation

## [0.9.0] - 2026-02-26

### Added

- HSTS and explicit CORS middleware (Session 50)
- Cloudflare WAF configuration guide and secrets rotation procedures
- 20 unit tests for server services (aiProvider, rateLimit, safeError, siteConfig, aiConfig)
- Lighthouse CI dedicated workflow with raised thresholds
- Web Vitals reporting to GA4 (FCP, TTFB, CLS, INP, LCP)
- Basic accessibility tests with Playwright
- Database integrity check script
- ERD diagram (Mermaid) for 30+ tables
- Data retention policy (GDPR-compliant)
- Slow queries monitoring endpoint
- Cron jobs documentation with scheduler templates

### Changed

- WhatsApp process endpoint refactored from ~550 to ~75 lines
- AI provider extended with multimodal support (image + text blocks)
- verify-document.post.ts migrated to callAI with mock fallback
- Lighthouse performance threshold raised from 70% to 80%

### Fixed

- Vehicles and advertisements tables now have vertical column for isolation
- Vertical isolation tests rewritten with real Supabase mocks

## [0.8.0] - 2026-02-25

### Added

- DAST security scanning: OWASP ZAP + Nuclei + SSL checks (Session 46)
- IDOR protection, rate limiting, and information leakage security tests
- Security testing strategy documentation (6-layer model)
- Daily audit CI workflow (semgrep, npm-audit, lint, typecheck, extensibility)
- Multi-tier backup system (daily/weekly/monthly to Backblaze B2)
- Disaster recovery documentation
- AI provider failover (Anthropic primary + OpenAI fallback)
- Centralized AI model configuration with env var overrides
- Centralized site URL/name configuration
- Vertical isolation: middleware, query helpers, composite indexes
- Service extraction: imageUploader, vehicleCreator, notifications, whatsappProcessor

## [0.7.0] - 2026-02-24

### Added

- Flujos operativos alignment with strategic decisions (Session 44)
- E2E testing: 8 user journey specs with Playwright (Session 42)
- Architecture documentation: service layer, technical diagram, thresholds (Session 41)
- Monetization: 14-day trials, dunning emails, revenue metrics (Session 40)

## [0.6.0] - 2026-02

### Added

- PWA offline page and service worker improvements (Session 39)
- UX clarity: onboarding tooltips, empty states (Session 38)
- Security CI: CSP hardening, CSRF, rate limiting audit (Session 37)
- Cross-audit: indexes, cache, auth, i18n, consolidation (Session 36)
- RLS hardening, database indexes, CSP, DOMPurify (Session 35)
- Auth hardening, Turnstile CAPTCHA, ownership verification (Session 34)

## [0.5.0] - 2026-01

### Added

- Infrastructure monitoring with alerting (Session 33)
- Public market data dashboard (Session 32)
- Dealer tools: valuator, comparator, cost calculator (Sessions 30-31)
- Favorites and search alerts with price drop notifications (Session 29)
- Dealer CRM module (Session 28)
- Admin KPI metrics dashboard (Sessions 26-27)
- Dealer dashboard and DSA transparency (Sessions 24-25)
- Multi-vertical configuration system (Sessions 22-23)

## [0.4.0] - 2025-12

### Added

- WhatsApp vehicle submission pipeline (Sessions 20-21)
- PWA support and CI/CD pipeline (Sessions 18-19)
- Stripe payments integration (Session 17)
- Advertising, lead capture, social posts (Sessions 16b-16d)
- Auction system (Session 16)
- Vehicle verification module (Session 15)

## [0.3.0] - 2025-11

### Added

- Legal pages, GDPR compliance, static content (Sessions 12-14)
- News and guides CMS (Session 11)
- Admin panel enhancements, editorial, filters (Sessions 6-10)

## [0.2.0] - 2025-10

### Added

- User interaction features and admin panel (Sessions 4-5)
- Vehicle detail pages with SEO (Session 3)
- Full catalog with i18n JSONB (Session 2)

## [0.1.0] - 2025-09

### Added

- Initial Nuxt 3 setup with Supabase auth and Cloudflare Pages deploy (Session 1)
- Security emergency fixes from legacy site (Session 0)
