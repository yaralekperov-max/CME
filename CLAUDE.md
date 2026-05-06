# MedCME — Claude Session Guide

Russian CME (НМО) tracker for doctors. **Marketplace model**: organizations list externally-hosted courses; doctors self-report completion and track accreditation points. Not an LMS — no content hosting.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router (server components by default) |
| DB | PostgreSQL via Prisma ORM |
| Cache | Redis (ioredis) — cache invalidation + rate limiting |
| Auth | NextAuth v4 + credentials provider + Prisma adapter |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) — streaming chat |
| Email | SendPulse REST API |
| Error tracking | Sentry (`@sentry/nextjs`) |
| Styling | Tailwind CSS + CSS variables in `globals.css` |
| Validation | Zod (API routes) |

---

## Directory layout

```
src/
  app/
    (auth)/          # Login, register, forgot/reset password, verify-email
    (portal)/        # Doctor-facing app (layout has sidebar + topbar)
      dashboard/     # Points progress, pace, upcoming deadlines
      catalog/       # Course marketplace: list + detail + enroll
      history/       # Enrollment history with ?status= ?year= filters
      points/        # Points breakdown by year
      certificates/  # Uploaded certificates
      profile/       # Edit profile, notification settings
      ai/            # Claude AI assistant chat
    admin/           # Admin panel (separate layout)
      dashboard/     # Metrics overview
      courses/       # Course list + new + [id]/edit
      organizations/ # Org list + [id] detail page
      doctors/       # Doctor list with filters + CSV export
      moderation/    # Courses pending moderation
      analytics/     # (stub) Analytics page
      finance/       # (stub) Finance page
    api/
      auth/          # register, forgot-password, reset-password, verify-email, resend-verification
      admin/
        courses/[id] # PATCH (partial update, publishedAt stamping)
        doctors/export-csv/
        organizations/[id]/activate/
        moderation/[courseId]/
      courses/       # Public course listing (with Redis cache)
      enrollments/   # POST enroll; [id]/complete PATCH
      points/        # GET points summary
      profile/       # PATCH profile
      ai/chat/       # POST streaming AI chat
      cron/deadline-reminders/  # GET (X-Cron-Secret)
      health/        # GET {ok, db, redis}
    page.tsx         # Landing page (redirects logged-in users)
    privacy/         # Privacy policy (ФЗ-152)
    global-error.tsx # Sentry error boundary
  components/
    ui/              # card, badge, button, input, alert, table, progress
    portal/          # enroll-button, complete-button, sidebar, topbar, catalog-filters
    admin/           # sidebar, topbar, moderation-card
    providers/       # SessionProvider wrapper
  lib/
    auth/config.ts   # NextAuth authOptions (credentials + email verify check)
    db/
      index.ts       # Prisma client singleton
      points.ts      # calcPacePerYear(userId) — shared helper
    redis/client.ts  # ioredis singleton + invalidate(prefix) helper
    email/client.ts  # SendPulse wrapper: sendEmail(to, subject, html)
    ai/client.ts     # Anthropic client singleton
    rate-limit.ts    # sliding-window rate limiter via Redis
    constants.ts     # SPECIALIZATIONS, FORMAT_LABELS, FORMAT_COLORS
    utils.ts         # formatPrice, formatDate, cn (clsx+tailwind-merge)
  types/             # Shared TypeScript types (CourseFormat, CourseStatus, etc.)
prisma/
  schema.prisma
  migrations/        # Committed — baseline is 20260506000000_init
  seed.ts
```

---

## Key architectural decisions

### URL-based filtering (server components)
Pages that filter (history, admin courses, admin doctors) receive `searchParams` as a prop and pass filters directly to Prisma `where`. No client-side state, no useEffect fetches. Filter tabs are `<a href="?param=value">` links.

```tsx
// Server component pattern
export default async function Page({ searchParams }: { searchParams: { status?: string } }) {
  const courses = await db.course.findMany({ where: { status: searchParams.status ?? undefined } })
  ...
}
```

### Client interactivity
Only use `'use client'` for forms (login, profile, edit-course) and components with local UI state (enroll-button, complete-button, ai-chat). Everything else is server-rendered.

### AI quick-questions via URL
Sidebar quick-question links are `<a href="/app/ai?q=...">`. `AiChat` reads `?q=` on mount via `useSearchParams`, auto-sends the message, then clears the URL with `router.replace(pathname)`.

### Course completion flow
1. Doctor enrolls → `POST /api/enrollments` → enrollment row created with status `IN_PROGRESS`
2. Doctor completes externally → clicks "Отметить как пройденный" in catalog detail
3. `PATCH /api/enrollments/[id]/complete` → `db.$transaction`: updates enrollment status to `COMPLETED`, creates `PointTransaction`
4. Optional: doctor pastes certificate URL into the confirm dialog (`certificateFileUrl` on Enrollment)

### Points calculation
`src/lib/db/points.ts` exports `calcPacePerYear(userId)` — averages points across completed past years. Used in dashboard, points page, and `/api/points`. Never hardcode `pacePerYear = 43`.

### Redis caching
`invalidate(prefix)` deletes all keys matching `prefix*`. Call after mutations:
- After course changes: `invalidate('courses:')`
- After enrollment/points: `invalidate('points:')`

### Rate limiting
`src/lib/rate-limit.ts` — sliding window via Redis ZRANGEBYSCORE/ZADD. Applied in auth routes (register, login, forgot-password).

---

## Auth flow

1. Register → bcrypt hash → `emailVerified = null` → verification email (32-byte hex token in Redis, 24h TTL)
2. `GET /api/auth/verify-email?token=...` → sets `emailVerified = new Date()` on User
3. Login via credentials → `authorize()` throws `EMAIL_NOT_VERIFIED` if `!emailVerified` → client shows resend link
4. Session has `user.id`, `user.role`, `user.name`
5. Roles: `DOCTOR`, `ADMIN`, `SUPER_ADMIN`, `ORG_MANAGER`

---

## Admin panel

- `/admin` — layout with its own sidebar/topbar, no auth check in layout (all admin routes check session individually)
- Course PATCH: `src/app/api/admin/courses/[id]/route.ts` — handles `publishedAt` stamping when transitioning to `PUBLISHED`
- Organization activation: `POST /api/admin/organizations/[id]/activate` → sets status to `ACTIVE`, redirects
- Doctor CSV export: `/api/admin/doctors/export-csv` — BOM-prefixed for Excel

---

## Cron

`GET /api/cron/deadline-reminders` secured with `X-Cron-Secret: $CRON_SECRET` header.
Sends emails to doctors with accreditation deadline in 30 or 7 days.
Schedule from external cron (Yandex Scheduler, GitHub Actions, etc.):
```
curl -H "X-Cron-Secret: $CRON_SECRET" https://medcme.ru/api/cron/deadline-reminders
```

---

## Environment variables

See `.env.example` for full list. Required to run locally:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `ANTHROPIC_API_KEY` — for AI chat

Optional (features degrade gracefully without):
- `SENDPULSE_*` — emails won't send
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_*` — error tracking disabled
- `CRON_SECRET` — cron endpoint returns 401

---

## Development commands

```bash
npm run dev              # Next.js dev server on :3000
npm run typecheck        # tsc --noEmit (no emit, just type check)
npm run db:migrate:dev   # prisma migrate dev (requires live DB)
npm run db:migrate       # prisma migrate deploy (production)
npm run db:generate      # regenerate Prisma client after schema changes
npm run db:studio        # Prisma Studio on :5555
npm run db:seed          # tsx prisma/seed.ts
```

---

## Prisma migrations

Migrations are committed in `prisma/migrations/`. Baseline: `20260506000000_init`.

When changing the schema:
1. Edit `prisma/schema.prisma`
2. `npm run db:migrate:dev -- --name describe_change` (with live DB)
3. Commit the generated migration file
4. `npm run db:generate` regenerates the Prisma client

**Never** delete or squash existing migrations in production.

---

## Sentry

Three config files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
`next.config.ts` is wrapped with `withSentryConfig`.
`src/app/global-error.tsx` is the React error boundary that captures unhandled errors.
Source maps are uploaded during `next build` via `SENTRY_AUTH_TOKEN`.

---

## CI/CD

**GitHub Actions:**
- `ci.yml` — runs on every push/PR: `prisma generate` → `typecheck` → `lint`
- `deploy.yml` — runs on push to `main`: builds Docker image, pushes to Docker Hub, SSHs into server and restarts

**Required GitHub Secrets:**
| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `SSH_HOST` | Server IP / hostname |
| `SSH_USER` | SSH username (e.g. `ubuntu`) |
| `SSH_KEY` | Private SSH key (ed25519) |
| `SSH_PORT` | SSH port (default 22, optional) |

**Server setup** (one-time):
```bash
mkdir -p /opt/medcme
# Copy docker-compose.prod.yml and .env to /opt/medcme/
# docker login as DOCKER_USERNAME on server (or use --password-stdin in deploy script)
```

**Local dev with Docker:**
```bash
docker compose up          # starts app + postgres + redis
docker compose down -v     # tear down including volumes
```
App runs on :3000, PostgreSQL on :5432, Redis on :6379. Set `DATABASE_URL` and `REDIS_URL` to local services in `.env.local`.

---

## Pending work (as of last session)

- **Organization portal** — ORG_MANAGER role needs its own dashboard to manage courses and view enrollments
- **Payment flow** — courses have `priceKopecks`, no actual payment processing yet (YuKassa/Tinkoff)
- **"Мои данные" page** — ФЗ-152 compliance: user can download/delete their personal data
- **Admin analytics** — `admin/analytics/page.tsx` has stub data, needs real queries
- **Certificate button** in history — button exists in UI but has no action (should link to `certificateFileUrl`)
- **Docker + CI/CD** — `Dockerfile` exists, no CI pipeline yet
- **Password strength indicator** on registration form

---

## Design system

CSS variables defined in `globals.css`:
- `--text`, `--text2`, `--text3` — text hierarchy
- `--accent`, `--accent-light` — primary color (blue)
- `--surface`, `--surface2` — backgrounds
- `--border` — borders
- `--font-display` — heading font (Inter/system)

UI components live in `src/components/ui/`. Always use these instead of raw HTML for consistency.

Badge colors: `green | amber | red | blue | gray | purple`
