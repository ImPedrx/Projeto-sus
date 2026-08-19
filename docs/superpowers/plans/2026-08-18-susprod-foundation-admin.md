# SusProd Foundation & Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js + Supabase foundation and an admin area where SusProd signs in, manages categories, and uploads beats — so the public storefront (plan 2) has real data to render.

**Architecture:** A single Next.js App Router project. Supabase provides Postgres, file storage and authentication. All writes go through server actions using a request-scoped Supabase client, so Postgres Row Level Security is the real authorization boundary — the UI never decides who may write. Cover art and tagged previews live in a public storage bucket; the untagged MP3/WAV masters live in a private bucket, handed out only as short-lived signed URLs after a purchase (plan 3).

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS v4, Supabase (Postgres + Storage + Auth) via `@supabase/supabase-js` and `@supabase/ssr`, Zod for validation, Vitest + Testing Library + jsdom for tests.

**Spec:** `docs/superpowers/specs/2026-08-17-susprod-beat-store-design.md`

## Plan set

The spec's v1 is split into three plans. This is plan 1 of 3.

1. **Foundation & admin** (this plan) — project scaffold, database schema, admin auth, category management, beat upload.
2. **Public storefront** — catalog page with category filtering, beat detail, persistent audio player.
3. **Checkout & requests** — Stripe and Mercado Pago checkout, automated delivery email, the "Chamar o SUS" request form and its admin queue.

## Global Constraints

- Visual style: dark trap aesthetic, black-and-white palette. No accent hues in the base theme.
- Every beat belongs to at least one category.
- One flat price per beat. No license tiers anywhere in the data model or the UI.
- The untagged masters (MP3, WAV) must never be reachable by an unauthenticated request. Only the tagged preview and the cover art are public.
- Prices are stored as integer cents (`price_cents`), never as floats.
- Customers never authenticate. The only account in the system is SusProd's admin account.
- Postgres conventions: lowercase identifiers, `bigint generated always as identity` primary keys, `text` over `varchar(n)`, `timestamptz` over `timestamp`, every foreign key column indexed, RLS enabled and forced on every table, `auth.uid()` always wrapped in a subselect inside policies.
- All UI copy is in Brazilian Portuguese. Code, identifiers, comments and commit messages are in English.

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, vitest.config.ts   project config
src/app/layout.tsx                     root layout, dark theme, fonts
src/app/globals.css                    Tailwind v4 import + theme tokens
src/app/admin/layout.tsx               admin shell, requires a signed-in admin
src/app/admin/page.tsx                 admin dashboard (beat list)
src/app/admin/login/page.tsx           admin sign-in form
src/app/admin/categorias/page.tsx      category management screen
src/app/admin/beats/novo/page.tsx      new beat upload form
src/app/admin/beats/[id]/page.tsx      edit an existing beat
src/app/auth/actions.ts                sign-in / sign-out server actions
src/lib/supabase/client.ts             browser Supabase client
src/lib/supabase/server.ts             server-component / action client
src/lib/supabase/middleware.ts         session refresh helper
src/lib/supabase/types.ts              generated database types
src/lib/beats/schema.ts                Zod schemas for category and beat input
src/lib/beats/slug.ts                  slug generation
src/lib/beats/format.ts                price and duration formatting
src/lib/beats/storage.ts               storage bucket + path helpers
src/lib/beats/queries.ts               typed read helpers over Supabase
src/middleware.ts                      refreshes the Supabase session cookie
supabase/migrations/*.sql              database migrations
tests/                                 Vitest specs mirroring src/
```

---

### Task 1: Project scaffold and dark theme

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/lib/beats/format.ts`
- Test: `tests/lib/format.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `formatPrice(cents: number): string` returning Brazilian currency (`formatPrice(19900) === "R$ 199,00"`); `formatDuration(seconds: number): string` returning `m:ss` (`formatDuration(125) === "2:05"`). A working `npm run dev`, `npm run build` and `npm test`.

- [ ] **Step 1: Scaffold the Next.js app in the existing directory**

The repository root already holds `.agents/`, `docs/` and dotfiles, so scaffold in place:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Answer "yes" when it asks about the non-empty directory. If it refuses, scaffold into `.tmp-app/`, move `src/`, `public/` and the config files to the root, then delete `.tmp-app/`.

- [ ] **Step 2: Install the remaining dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add to the `scripts` block of `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test for the formatters**

Create `tests/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatPrice, formatDuration } from "@/lib/beats/format";

describe("formatPrice", () => {
  it("renders cents as Brazilian currency", () => {
    expect(formatPrice(19900)).toBe("R$ 199,00");
  });

  it("renders a whole-real value with cents", () => {
    expect(formatPrice(5000)).toBe("R$ 50,00");
  });

  it("renders zero", () => {
    expect(formatPrice(0)).toBe("R$ 0,00");
  });
});

describe("formatDuration", () => {
  it("pads seconds under ten", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("renders durations under a minute", () => {
    expect(formatDuration(42)).toBe("0:42");
  });

  it("floors fractional seconds", () => {
    expect(formatDuration(59.9)).toBe("0:59");
  });
});
```

- [ ] **Step 5: Run the test and confirm it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/beats/format`.

- [ ] **Step 6: Implement the formatters**

Create `src/lib/beats/format.ts`:

```ts
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(cents: number): string {
  // Intl separates symbol and number with a non-breaking space; normalize it
  // so the output compares equal to a plain-space string.
  return currency.format(cents / 100).replace(/ /g, " ");
}

export function formatDuration(seconds: number): string {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
```

- [ ] **Step 7: Run the test and confirm it passes**

Run: `npm test`
Expected: PASS, 6 tests.

- [ ] **Step 8: Apply the dark theme tokens**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --background: #050505;
  --surface: #0f0f0f;
  --surface-raised: #1a1a1a;
  --border: #2a2a2a;
  --foreground: #f5f5f5;
  --muted: #8a8a8a;
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-border: var(--border);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SusProd",
  description: "Beats e projetos exclusivos por SusProd.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

Replace `src/app/page.tsx` with a placeholder that plan 2 replaces:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight">SUSPROD</h1>
    </main>
  );
}
```

- [ ] **Step 9: Verify the build and the dev server**

Run: `npm run build`
Expected: build succeeds with no type errors.

Run: `npm run dev` and open `http://localhost:3000`
Expected: black page, white "SUSPROD" heading. Stop the server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with dark theme and Vitest"
```

---

### Task 2: Database schema, RLS and storage buckets

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/migrations/0002_storage_buckets.sql`
- Create: `src/lib/supabase/types.ts`
- Create: `.env.local.example`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: tables `categories`, `beats`, `beat_categories`, `admin_users`; the function `private.is_admin()`; storage buckets `beat-public` and `beat-private`; the TypeScript type `Database` exported from `@/lib/supabase/types`, used by every later task.

- [ ] **Step 1: Create the Supabase project and capture the keys**

In the Supabase dashboard create a project. From Project Settings → API copy the project URL and the anon key.

Create `.env.local` (ignored by git):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Create `.env.local.example` with the same two keys and empty values, and commit that file.

- [ ] **Step 2: Write the schema migration**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
-- Admin allow-list. A row here is what makes an auth user an admin.
create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(trim(name)) > 0)
);

create table beats (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  price_cents int not null,
  bpm int,
  musical_key text,
  duration_seconds int,
  cover_path text,
  preview_path text not null,
  master_mp3_path text not null,
  master_wav_path text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beats_title_not_blank check (length(trim(title)) > 0),
  constraint beats_price_positive check (price_cents > 0),
  constraint beats_bpm_sane check (bpm is null or bpm between 40 and 300),
  constraint beats_status_valid check (status in ('draft', 'published', 'sold'))
);

create table beat_categories (
  beat_id bigint not null references beats (id) on delete cascade,
  category_id bigint not null references categories (id) on delete restrict,
  primary key (beat_id, category_id)
);

-- Postgres does not index foreign keys automatically. The composite primary key
-- already covers lookups by beat_id; category_id needs its own index for the
-- catalog filter and for the ON DELETE RESTRICT check.
create index beat_categories_category_id_idx on beat_categories (category_id);

-- The storefront lists published beats newest first.
create index beats_published_created_at_idx
  on beats (created_at desc)
  where status = 'published';

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger beats_set_updated_at
  before update on beats
  for each row execute function set_updated_at();

-- The admin check lives in a private schema and is never exposed to client roles.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;

alter table admin_users enable row level security;
alter table admin_users force row level security;
alter table categories enable row level security;
alter table categories force row level security;
alter table beats enable row level security;
alter table beats force row level security;
alter table beat_categories enable row level security;
alter table beat_categories force row level security;

-- No policy on admin_users: only the SECURITY DEFINER function reads it, so RLS
-- denies every client role by default.

-- Categories are public reference data.
create policy categories_public_read on categories
  for select to anon, authenticated
  using (true);

create policy categories_admin_write on categories
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Visitors only ever see published beats.
create policy beats_public_read on beats
  for select to anon, authenticated
  using (status = 'published');

create policy beats_admin_all on beats
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy beat_categories_public_read on beat_categories
  for select to anon, authenticated
  using (
    exists (
      select 1 from beats
      where beats.id = beat_categories.beat_id
        and beats.status = 'published'
    )
  );

create policy beat_categories_admin_write on beat_categories
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
```

- [ ] **Step 3: Write the storage migration**

Create `supabase/migrations/0002_storage_buckets.sql`:

```sql
-- Cover art and tagged previews are world-readable.
insert into storage.buckets (id, name, public)
values ('beat-public', 'beat-public', true)
on conflict (id) do nothing;

-- Untagged masters. Never public; served only as signed URLs after purchase.
insert into storage.buckets (id, name, public)
values ('beat-private', 'beat-private', false)
on conflict (id) do nothing;

create policy beat_public_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'beat-public' and (select private.is_admin()))
  with check (bucket_id = 'beat-public' and (select private.is_admin()));

create policy beat_private_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'beat-private' and (select private.is_admin()))
  with check (bucket_id = 'beat-private' and (select private.is_admin()));
```

- [ ] **Step 4: Apply both migrations**

Paste each file into the Supabase dashboard SQL editor and run them in order, or run `npx supabase db push` if the Supabase CLI is linked.

Expected: both succeed with no error.

- [ ] **Step 5: Create the admin account**

Dashboard → Authentication → Users → Add user: SusProd's email and a strong password. Then in the SQL editor:

```sql
insert into admin_users (user_id)
select id from auth.users where email = '<susprod email>';
```

Expected: `INSERT 0 1`.

- [ ] **Step 6: Verify that RLS actually blocks anonymous access**

In the SQL editor:

```sql
insert into categories (name, slug) values ('Dark Trap', 'dark-trap');

insert into beats (title, slug, price_cents, preview_path, master_mp3_path, status)
values ('Rascunho', 'rascunho', 19900, 'previews/x.mp3', 'masters/x.mp3', 'draft');

set local role anon;
select count(*) from beats;        -- expect 0: the beat is a draft
select count(*) from categories;   -- expect 1: categories are public
select count(*) from admin_users;  -- expect 0 rows or a permission error
reset role;

update beats set status = 'published' where slug = 'rascunho';
set local role anon;
select count(*) from beats;        -- expect 1
reset role;
```

Expected: the counts above. If a draft beat is visible to `anon`, the read policy is wrong — fix it before continuing.

- [ ] **Step 7: Generate the database types**

```bash
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/types.ts
```

If the CLI is not linked, copy the types from the dashboard's API docs page instead. Confirm the file exports `Database` and contains a `beats` entry.

- [ ] **Step 8: Confirm the generated types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add supabase src/lib/supabase/types.ts .env.local.example
git commit -m "feat: add database schema, RLS policies and storage buckets"
```

---

### Task 3: Supabase clients, session middleware and admin sign-in

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`
- Create: `src/app/auth/actions.ts`
- Create: `src/app/admin/layout.tsx`, `src/app/admin/login/page.tsx`, `src/app/admin/login/login-form.tsx`, `src/app/admin/page.tsx`
- Test: `tests/app/login-form.test.tsx`

**Interfaces:**
- Consumes: `Database` from `@/lib/supabase/types` (Task 2).
- Produces: `createBrowserClient()` from `@/lib/supabase/client`; `createServerClient()` (async, reads cookies) from `@/lib/supabase/server`; server actions `signIn(formData: FormData)` returning `{ error: string }` or redirecting, and `signOut()` from `@/app/auth/actions`; an `/admin` route tree that redirects non-admins to `/admin/login`.

- [ ] **Step 1: Write the browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient as createClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Write the server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient as createClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Write the session-refresh middleware**

Create `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function updateSession(request: NextRequest) {
  // The admin layout reads the pathname from this header to decide whether to
  // run its auth guard, so it must reach the server component tree.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Calling getUser() is what refreshes an expiring session cookie.
  await supabase.auth.getUser();

  return response;
}
```

Create `src/middleware.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|mp3|wav)$).*)",
  ],
};
```

- [ ] **Step 4: Write the auth server actions**

Create `src/app/auth/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
```

- [ ] **Step 5: Write the failing test for the login form**

Create `tests/app/login-form.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/app/admin/login/login-form";

describe("LoginForm", () => {
  it("submits the typed credentials", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("E-mail"), "sus@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "hunter2");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("sus@example.com");
    expect(formData.get("password")).toBe("hunter2");
  });

  it("shows the error returned by the action", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ error: "E-mail ou senha inválidos." });
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("E-mail"), "sus@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha inválidos.",
    );
  });
});
```

- [ ] **Step 6: Run the test and confirm it fails**

Run: `npm test -- tests/app/login-form.test.tsx`
Expected: FAIL — cannot resolve `@/app/admin/login/login-form`.

- [ ] **Step 7: Implement the login form and page**

Create `src/app/admin/login/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";

type Result = { error: string } | undefined | void;

export function LoginForm({
  action,
}: {
  action: (formData: FormData) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await action(new FormData(event.currentTarget));
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border border-border bg-surface px-3 py-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm text-muted">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded border border-border bg-surface px-3 py-2"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-foreground">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
      >
        Entrar
      </button>
    </form>
  );
}
```

Create `src/app/admin/login/page.tsx`:

```tsx
import { signIn } from "@/app/auth/actions";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">SUSPROD / ADMIN</h1>
        <LoginForm action={signIn} />
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Run the test and confirm it passes**

Run: `npm test -- tests/app/login-form.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 9: Gate the admin area**

The login page sits under `/admin`, so the shared layout must skip its guard for that path — otherwise signing in is impossible. The layout reads `x-pathname`, set by the middleware in Step 3.

Create `src/app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname.startsWith("/admin/login")) return children;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Being signed in is not the same as being an admin. RLS hides every draft
  // from a non-admin, so probing for drafts is the cheapest admin check that
  // matches what the policies actually allow.
  const { error } = await supabase
    .from("beats")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");
  if (error) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin">Beats</Link>
          <Link href="/admin/categorias">Categorias</Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted">
            Sair
          </button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 10: Create the admin dashboard placeholder**

Create `src/app/admin/page.tsx` (Task 6 replaces it):

```tsx
export default function AdminHomePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Beats</h1>
      <p className="text-muted">Nenhum beat cadastrado ainda.</p>
    </div>
  );
}
```

- [ ] **Step 11: Verify the gate by hand**

Run `npm run dev`, then:
- Visit `/admin` while signed out → redirected to `/admin/login`.
- Sign in with wrong credentials → "E-mail ou senha inválidos." with no redirect.
- Sign in with the admin credentials → lands on `/admin` with the header rendered.
- Click "Sair" → back at `/admin/login`, and `/admin` redirects again.

Expected: all four behave as described.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add Supabase clients, session middleware and admin sign-in"
```

---

### Task 4: Category management

**Files:**
- Create: `src/lib/beats/slug.ts`, `src/lib/beats/schema.ts`
- Create: `src/app/admin/categorias/page.tsx`, `src/app/admin/categorias/actions.ts`, `src/app/admin/categorias/category-form.tsx`
- Test: `tests/lib/slug.test.ts`, `tests/lib/schema.test.ts`

**Interfaces:**
- Consumes: `createServerClient()` (Task 3), `Database` (Task 2).
- Produces: `slugify(input: string): string`; `categoryInputSchema` (Zod object with `name: string`) and its inferred type `CategoryInput`; server actions `createCategory(formData: FormData)` and `deleteCategory(id: number)`, each returning `{ error: string } | { ok: true }`.

- [ ] **Step 1: Write the failing test for slugify**

Create `tests/lib/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/beats/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Dark Trap")).toBe("dark-trap");
  });

  it("strips accents", () => {
    expect(slugify("Sertanejo Remix Ação")).toBe("sertanejo-remix-acao");
  });

  it("drops punctuation and collapses separators", () => {
    expect(slugify("Boom  Bap / Lo-Fi!")).toBe("boom-bap-lo-fi");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --R&B--  ")).toBe("r-b");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- tests/lib/slug.test.ts`
Expected: FAIL — cannot resolve `@/lib/beats/slug`.

- [ ] **Step 3: Implement slugify**

Create `src/lib/beats/slug.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    // Strip the combining diacritical marks that NFD split off.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- tests/lib/slug.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing test for the category schema**

Create `tests/lib/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { categoryInputSchema } from "@/lib/beats/schema";

describe("categoryInputSchema", () => {
  it("accepts a normal name", () => {
    expect(categoryInputSchema.parse({ name: "Dark Trap" }).name).toBe("Dark Trap");
  });

  it("trims surrounding whitespace", () => {
    expect(categoryInputSchema.parse({ name: "  Drill  " }).name).toBe("Drill");
  });

  it("rejects a blank name", () => {
    expect(categoryInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name over 40 characters", () => {
    expect(categoryInputSchema.safeParse({ name: "x".repeat(41) }).success).toBe(false);
  });
});
```

- [ ] **Step 6: Run the test and confirm it fails**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: FAIL — cannot resolve `@/lib/beats/schema`.

- [ ] **Step 7: Implement the category schema**

Create `src/lib/beats/schema.ts`:

```ts
import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome.")
    .max(40, "Nome muito longo."),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
```

- [ ] **Step 8: Run the test and confirm it passes**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 9: Write the category server actions**

Create `src/app/admin/categorias/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { categoryInputSchema } from "@/lib/beats/schema";
import { slugify } from "@/lib/beats/slug";

export async function createCategory(formData: FormData) {
  const parsed = categoryInputSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
  });

  if (error) {
    // 23505 is unique_violation: the slug already exists.
    return {
      error:
        error.code === "23505"
          ? "Essa categoria já existe."
          : "Não foi possível salvar.",
    };
  }

  revalidatePath("/admin/categorias");
  return { ok: true as const };
}

export async function deleteCategory(id: number) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    // 23503 is foreign_key_violation: beats still reference this category.
    return {
      error:
        error.code === "23503"
          ? "Existem beats nessa categoria. Remova-os antes."
          : "Não foi possível excluir.",
    };
  }

  revalidatePath("/admin/categorias");
  return { ok: true as const };
}
```

- [ ] **Step 10: Build the category screen**

Create `src/app/admin/categorias/category-form.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";

export function CategoryForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = await action(new FormData(event.currentTarget));
    if ("error" in result) setError(result.error);
    else formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm text-muted">
          Nova categoria
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded border border-border bg-surface px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-foreground px-3 py-2 font-medium text-background"
      >
        Adicionar
      </button>
      {error && (
        <p role="alert" className="w-full text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
```

Create `src/app/admin/categorias/page.tsx`:

```tsx
import { createServerClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "./actions";
import { CategoryForm } from "./category-form";

export default async function CategoriesPage() {
  const supabase = await createServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("position")
    .order("name");

  const rows = categories ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
      <CategoryForm action={createCategory} />
      {rows.length === 0 ? (
        <p className="text-muted">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between py-3"
            >
              <span>{category.name}</span>
              <form action={deleteCategory.bind(null, category.id)}>
                <button type="submit" className="text-sm text-muted">
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 11: Verify by hand**

Run `npm run dev`, sign in, open `/admin/categorias`:
- Add "Dark Trap" → it appears in the list.
- Add "Dark Trap" again → "Essa categoria já existe."
- Add "Drill", then delete it → it disappears.

Expected: all three behave as described.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add category management to the admin area"
```

---

### Task 5: Beat upload

**Files:**
- Create: `src/lib/beats/storage.ts`
- Modify: `src/lib/beats/schema.ts` (append `beatInputSchema`)
- Create: `src/app/admin/beats/actions.ts`, `src/app/admin/beats/beat-form.tsx`, `src/app/admin/beats/novo/page.tsx`
- Modify: `next.config.ts` (raise the server action body size limit)
- Test: `tests/lib/storage.test.ts`, `tests/lib/beat-schema.test.ts`

**Interfaces:**
- Consumes: `slugify` and `categoryInputSchema` (Task 4), `createServerClient()` (Task 3).
- Produces: `AssetKind = "cover" | "preview" | "mp3" | "wav"`; `bucketFor(kind: AssetKind): "beat-public" | "beat-private"`; `storagePathFor(kind: AssetKind, slug: string, filename: string): string`; `beatInputSchema` with fields `title`, `priceCents`, `bpm`, `musicalKey`, `categoryIds` and its type `BeatInput`; the server action `createBeat(formData: FormData): Promise<{ error: string } | { ok: true; id: number }>`.

- [ ] **Step 1: Write the failing test for the storage helpers**

Create `tests/lib/storage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bucketFor, storagePathFor } from "@/lib/beats/storage";

describe("bucketFor", () => {
  it("puts covers and previews in the public bucket", () => {
    expect(bucketFor("cover")).toBe("beat-public");
    expect(bucketFor("preview")).toBe("beat-public");
  });

  it("puts masters in the private bucket", () => {
    expect(bucketFor("mp3")).toBe("beat-private");
    expect(bucketFor("wav")).toBe("beat-private");
  });
});

describe("storagePathFor", () => {
  it("namespaces by kind and slug and keeps the extension", () => {
    expect(storagePathFor("preview", "dark-night", "Dark Night (tag).mp3")).toBe(
      "previews/dark-night.mp3",
    );
  });

  it("lowercases the extension", () => {
    expect(storagePathFor("wav", "dark-night", "master.WAV")).toBe(
      "masters/dark-night.wav",
    );
  });

  it("names cover files by slug", () => {
    expect(storagePathFor("cover", "dark-night", "capa.PNG")).toBe(
      "covers/dark-night.png",
    );
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- tests/lib/storage.test.ts`
Expected: FAIL — cannot resolve `@/lib/beats/storage`.

- [ ] **Step 3: Implement the storage helpers**

Create `src/lib/beats/storage.ts`. The MP3 and WAV masters share the `masters/` folder but differ by extension, so they never collide:

```ts
export type AssetKind = "cover" | "preview" | "mp3" | "wav";

const FOLDERS: Record<AssetKind, string> = {
  cover: "covers",
  preview: "previews",
  mp3: "masters",
  wav: "masters",
};

export function bucketFor(kind: AssetKind): "beat-public" | "beat-private" {
  return kind === "cover" || kind === "preview" ? "beat-public" : "beat-private";
}

export function storagePathFor(
  kind: AssetKind,
  slug: string,
  filename: string,
): string {
  const extension = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
  return `${FOLDERS[kind]}/${slug}.${extension}`;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- tests/lib/storage.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing test for the beat schema**

Create `tests/lib/beat-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { beatInputSchema } from "@/lib/beats/schema";

const valid = {
  title: "Dark Night",
  priceCents: 19900,
  bpm: 140,
  musicalKey: "F#m",
  categoryIds: [1],
};

describe("beatInputSchema", () => {
  it("accepts a complete beat", () => {
    expect(beatInputSchema.parse(valid).title).toBe("Dark Night");
  });

  it("requires at least one category", () => {
    expect(beatInputSchema.safeParse({ ...valid, categoryIds: [] }).success).toBe(false);
  });

  it("rejects a zero or negative price", () => {
    expect(beatInputSchema.safeParse({ ...valid, priceCents: 0 }).success).toBe(false);
    expect(beatInputSchema.safeParse({ ...valid, priceCents: -1 }).success).toBe(false);
  });

  it("rejects a fractional price", () => {
    expect(beatInputSchema.safeParse({ ...valid, priceCents: 199.5 }).success).toBe(false);
  });

  it("rejects an implausible bpm", () => {
    expect(beatInputSchema.safeParse({ ...valid, bpm: 12 }).success).toBe(false);
  });

  it("allows bpm and key to be omitted", () => {
    const result = beatInputSchema.safeParse({
      title: "Sem Info",
      priceCents: 9900,
      bpm: null,
      musicalKey: null,
      categoryIds: [2],
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 6: Run the test and confirm it fails**

Run: `npm test -- tests/lib/beat-schema.test.ts`
Expected: FAIL — `beatInputSchema` is not exported.

- [ ] **Step 7: Append the beat schema**

Add to `src/lib/beats/schema.ts`:

```ts
export const beatInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe um título.")
    .max(80, "Título muito longo."),
  priceCents: z
    .number()
    .int("O preço deve ser um valor inteiro em centavos.")
    .positive("Informe um preço maior que zero."),
  bpm: z.number().int().min(40).max(300).nullable(),
  musicalKey: z.string().trim().max(10).nullable(),
  categoryIds: z
    .array(z.number().int().positive())
    .min(1, "Escolha ao menos uma categoria."),
});

export type BeatInput = z.infer<typeof beatInputSchema>;
```

- [ ] **Step 8: Run the test and confirm it passes**

Run: `npm test -- tests/lib/beat-schema.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 9: Write the createBeat server action**

Create `src/app/admin/beats/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { beatInputSchema } from "@/lib/beats/schema";
import { slugify } from "@/lib/beats/slug";
import { bucketFor, storagePathFor, type AssetKind } from "@/lib/beats/storage";

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}

export async function createBeat(formData: FormData) {
  // The form collects reais with a comma decimal separator; the database
  // stores integer cents.
  const priceText = String(formData.get("price") ?? "").replace(",", ".");

  const parsed = beatInputSchema.safeParse({
    title: formData.get("title"),
    priceCents: Math.round(Number(priceText) * 100),
    bpm: parseOptionalInt(formData.get("bpm")),
    musicalKey: String(formData.get("musicalKey") ?? "").trim() || null,
    categoryIds: formData.getAll("categoryIds").map((value) => Number(value)),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const preview = formData.get("preview") as File | null;
  const masterMp3 = formData.get("masterMp3") as File | null;
  const masterWav = formData.get("masterWav") as File | null;
  const cover = formData.get("cover") as File | null;

  if (!preview?.size) return { error: "Envie o preview com a tag de voz." };
  if (!masterMp3?.size) return { error: "Envie o MP3 sem tag." };

  const supabase = await createServerClient();
  const slug = slugify(parsed.data.title);

  const uploads: Array<[AssetKind, File]> = [
    ["preview", preview],
    ["mp3", masterMp3],
  ];
  if (masterWav?.size) uploads.push(["wav", masterWav]);
  if (cover?.size) uploads.push(["cover", cover]);

  const paths: Partial<Record<AssetKind, string>> = {};

  for (const [kind, file] of uploads) {
    const path = storagePathFor(kind, slug, file.name);
    const { error } = await supabase.storage
      .from(bucketFor(kind))
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) return { error: `Falha ao enviar o arquivo (${kind}).` };
    paths[kind] = path;
  }

  const { data: beat, error: insertError } = await supabase
    .from("beats")
    .insert({
      title: parsed.data.title,
      slug,
      price_cents: parsed.data.priceCents,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
      preview_path: paths.preview!,
      master_mp3_path: paths.mp3!,
      master_wav_path: paths.wav ?? null,
      cover_path: paths.cover ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !beat) {
    return {
      error:
        insertError?.code === "23505"
          ? "Já existe um beat com esse título."
          : "Não foi possível salvar o beat.",
    };
  }

  const { error: linkError } = await supabase.from("beat_categories").insert(
    parsed.data.categoryIds.map((categoryId) => ({
      beat_id: beat.id,
      category_id: categoryId,
    })),
  );

  if (linkError) {
    // A beat with no category would be invisible in the catalog, so undo the
    // insert rather than leaving a half-created row.
    await supabase.from("beats").delete().eq("id", beat.id);
    return { error: "Não foi possível vincular as categorias." };
  }

  revalidatePath("/admin");
  return { ok: true as const, id: beat.id };
}
```

- [ ] **Step 10: Build the upload form**

Create `src/app/admin/beats/beat-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };
type Result = { error: string } | { ok: true; id: number };

export function BeatForm({
  categories,
  action,
}: {
  categories: Category[];
  action: (formData: FormData) => Promise<Result>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await action(new FormData(event.currentTarget));
    setPending(false);
    if ("error" in result) setError(result.error);
    else router.push("/admin");
  }

  const field = "w-full rounded border border-border bg-surface px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm text-muted">
          Título
        </label>
        <input id="title" name="title" required className={field} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm text-muted">
            Preço (R$)
          </label>
          <input id="price" name="price" inputMode="decimal" required className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="bpm" className="block text-sm text-muted">
            BPM
          </label>
          <input id="bpm" name="bpm" inputMode="numeric" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="musicalKey" className="block text-sm text-muted">
            Tom
          </label>
          <input id="musicalKey" name="musicalKey" className={field} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Categorias</legend>
        {categories.map((category) => (
          <label key={category.id} className="flex items-center gap-2">
            <input type="checkbox" name="categoryIds" value={category.id} />
            {category.name}
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="preview" className="block text-sm text-muted">
          Preview com tag (MP3)
        </label>
        <input id="preview" name="preview" type="file" accept="audio/mpeg" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="masterMp3" className="block text-sm text-muted">
          MP3 sem tag
        </label>
        <input id="masterMp3" name="masterMp3" type="file" accept="audio/mpeg" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="masterWav" className="block text-sm text-muted">
          WAV sem tag (opcional)
        </label>
        <input id="masterWav" name="masterWav" type="file" accept="audio/wav" />
      </div>
      <div className="space-y-2">
        <label htmlFor="cover" className="block text-sm text-muted">
          Capa (opcional)
        </label>
        <input id="cover" name="cover" type="file" accept="image/*" />
      </div>

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Salvar beat"}
      </button>
    </form>
  );
}
```

Create `src/app/admin/beats/novo/page.tsx`:

```tsx
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { createBeat } from "../actions";
import { BeatForm } from "../beat-form";

export default async function NewBeatPage() {
  const supabase = await createServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (!categories?.length) {
    return (
      <p className="text-muted">
        Cadastre uma{" "}
        <Link href="/admin/categorias" className="underline">
          categoria
        </Link>{" "}
        antes de subir um beat.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Novo beat</h1>
      <BeatForm categories={categories} action={createBeat} />
    </div>
  );
}
```

- [ ] **Step 11: Raise the server action body size limit**

Audio masters exceed the default 1 MB limit. Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "150mb" },
  },
};

export default nextConfig;
```

- [ ] **Step 12: Verify by hand, including the security check**

Run `npm run dev`, sign in, open `/admin/beats/novo`:
- Submit with no category checked → "Escolha ao menos uma categoria."
- Submit a real preview MP3, a master MP3, one category and price `199,00` → redirected to `/admin`.
- In the dashboard: Storage → `beat-public` holds `previews/<slug>.mp3`; `beat-private` holds `masters/<slug>.mp3`; the `beats` row has `price_cents = 19900` and `status = 'draft'`.
- Copy the object URL of the private master and open it in a logged-out browser → access denied.

Expected: all four behave as described. If the master downloads for a logged-out visitor, stop and fix the bucket before continuing.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add beat upload to the admin area"
```

---

### Task 6: Beat list, editing and publishing

**Files:**
- Create: `src/lib/beats/queries.ts`
- Modify: `src/app/admin/page.tsx` (replace the placeholder with the real list)
- Modify: `src/app/admin/beats/actions.ts` (append `setBeatStatus`, `updateBeat`, `deleteBeat`)
- Create: `src/app/admin/beats/edit-beat-form.tsx`, `src/app/admin/beats/[id]/page.tsx`
- Test: `tests/lib/queries.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–5.
- Produces: `BeatStatus = "draft" | "published" | "sold"`; `AdminBeatRow = { id: number; title: string; priceCents: number; status: BeatStatus; categoryNames: string[] }`; `listBeatsForAdmin(supabase): Promise<AdminBeatRow[]>`; server actions `setBeatStatus(id: number, status: BeatStatus)`, `updateBeat(id: number, formData: FormData)` and `deleteBeat(id: number)`, each returning `{ error: string } | { ok: true }`.

- [ ] **Step 1: Write the failing test for the admin list mapper**

The Supabase query returns nested category rows; the mapper flattens them. Stub the client so the test needs no network.

Create `tests/lib/queries.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { listBeatsForAdmin } from "@/lib/beats/queries";

function stubClient(rows: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }),
  } as never;
}

describe("listBeatsForAdmin", () => {
  it("flattens nested category names", async () => {
    const rows = [
      {
        id: 1,
        title: "Dark Night",
        price_cents: 19900,
        status: "published",
        beat_categories: [
          { categories: { name: "Dark Trap" } },
          { categories: { name: "Drill" } },
        ],
      },
    ];

    expect(await listBeatsForAdmin(stubClient(rows))).toEqual([
      {
        id: 1,
        title: "Dark Night",
        priceCents: 19900,
        status: "published",
        categoryNames: ["Dark Trap", "Drill"],
      },
    ]);
  });

  it("returns an empty list when there are no beats", async () => {
    expect(await listBeatsForAdmin(stubClient([]))).toEqual([]);
  });

  it("tolerates a beat with no categories", async () => {
    const rows = [
      {
        id: 2,
        title: "Órfão",
        price_cents: 9900,
        status: "draft",
        beat_categories: [],
      },
    ];
    expect((await listBeatsForAdmin(stubClient(rows)))[0].categoryNames).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- tests/lib/queries.test.ts`
Expected: FAIL — cannot resolve `@/lib/beats/queries`.

- [ ] **Step 3: Implement the query helper**

Create `src/lib/beats/queries.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type BeatStatus = "draft" | "published" | "sold";

export type AdminBeatRow = {
  id: number;
  title: string;
  priceCents: number;
  status: BeatStatus;
  categoryNames: string[];
};

type RawRow = {
  id: number;
  title: string;
  price_cents: number;
  status: string;
  beat_categories: Array<{ categories: { name: string } | null }> | null;
};

export async function listBeatsForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<AdminBeatRow[]> {
  const { data, error } = await supabase
    .from("beats")
    .select("id, title, price_cents, status, beat_categories(categories(name))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    priceCents: row.price_cents,
    status: row.status as BeatStatus,
    categoryNames: (row.beat_categories ?? [])
      .map((link) => link.categories?.name)
      .filter((name): name is string => Boolean(name)),
  }));
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- tests/lib/queries.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Append the remaining server actions**

Add to `src/app/admin/beats/actions.ts` (the import goes with the existing imports at the top of the file):

```ts
import type { BeatStatus } from "@/lib/beats/queries";

export async function setBeatStatus(id: number, status: BeatStatus) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("beats").update({ status }).eq("id", id);
  if (error) return { error: "Não foi possível alterar o status." };

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateBeat(id: number, formData: FormData) {
  const priceText = String(formData.get("price") ?? "").replace(",", ".");

  const parsed = beatInputSchema.safeParse({
    title: formData.get("title"),
    priceCents: Math.round(Number(priceText) * 100),
    bpm: parseOptionalInt(formData.get("bpm")),
    musicalKey: String(formData.get("musicalKey") ?? "").trim() || null,
    categoryIds: formData.getAll("categoryIds").map((value) => Number(value)),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerClient();
  const { error: updateError } = await supabase
    .from("beats")
    .update({
      title: parsed.data.title,
      price_cents: parsed.data.priceCents,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
    })
    .eq("id", id);

  if (updateError) return { error: "Não foi possível salvar as alterações." };

  // Replace the category links wholesale — the set is tiny, and diffing buys
  // nothing here.
  await supabase.from("beat_categories").delete().eq("beat_id", id);
  const { error: linkError } = await supabase
    .from("beat_categories")
    .insert(
      parsed.data.categoryIds.map((categoryId) => ({
        beat_id: id,
        category_id: categoryId,
      })),
    );

  if (linkError) return { error: "Não foi possível salvar as categorias." };

  revalidatePath("/admin");
  revalidatePath(`/admin/beats/${id}`);
  return { ok: true as const };
}

export async function deleteBeat(id: number) {
  const supabase = await createServerClient();

  const { data: beat } = await supabase
    .from("beats")
    .select("preview_path, master_mp3_path, master_wav_path, cover_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("beats").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o beat." };

  // Remove the files only after the row is gone, so a storage failure never
  // leaves a row pointing at a missing file.
  if (beat) {
    const publicPaths = [beat.preview_path, beat.cover_path].filter(
      Boolean,
    ) as string[];
    const privatePaths = [beat.master_mp3_path, beat.master_wav_path].filter(
      Boolean,
    ) as string[];
    if (publicPaths.length) {
      await supabase.storage.from("beat-public").remove(publicPaths);
    }
    if (privatePaths.length) {
      await supabase.storage.from("beat-private").remove(privatePaths);
    }
  }

  revalidatePath("/admin");
  return { ok: true as const };
}
```

- [ ] **Step 6: Replace the admin dashboard with the real list**

Replace `src/app/admin/page.tsx`:

```tsx
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { listBeatsForAdmin } from "@/lib/beats/queries";
import { formatPrice } from "@/lib/beats/format";
import { setBeatStatus, deleteBeat } from "./beats/actions";

const STATUS_LABEL = {
  draft: "Rascunho",
  published: "Publicado",
  sold: "Vendido",
} as const;

export default async function AdminHomePage() {
  const supabase = await createServerClient();
  const beats = await listBeatsForAdmin(supabase);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Beats</h1>
        <Link
          href="/admin/beats/novo"
          className="rounded bg-foreground px-4 py-2 font-medium text-background"
        >
          Novo beat
        </Link>
      </div>

      {beats.length === 0 ? (
        <p className="text-muted">Nenhum beat cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-border">
          {beats.map((beat) => (
            <li key={beat.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-48 flex-1">
                <Link href={`/admin/beats/${beat.id}`} className="font-medium">
                  {beat.title}
                </Link>
                <p className="text-sm text-muted">
                  {beat.categoryNames.join(", ") || "Sem categoria"} ·{" "}
                  {formatPrice(beat.priceCents)}
                </p>
              </div>
              <span className="text-sm text-muted">{STATUS_LABEL[beat.status]}</span>
              {beat.status !== "sold" && (
                <form
                  action={setBeatStatus.bind(
                    null,
                    beat.id,
                    beat.status === "published" ? "draft" : "published",
                  )}
                >
                  <button type="submit" className="text-sm underline">
                    {beat.status === "published" ? "Despublicar" : "Publicar"}
                  </button>
                </form>
              )}
              <form action={deleteBeat.bind(null, beat.id)}>
                <button type="submit" className="text-sm text-muted">
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Build the edit page**

Create `src/app/admin/beats/edit-beat-form.tsx`:

```tsx
"use client";

import { useState } from "react";

type Category = { id: number; name: string };
type Result = { error: string } | { ok: true };

export function EditBeatForm({
  categories,
  beat,
  action,
}: {
  categories: Category[];
  beat: {
    title: string;
    priceCents: number;
    bpm: number | null;
    musicalKey: string | null;
    categoryIds: number[];
  };
  action: (formData: FormData) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const result = await action(new FormData(event.currentTarget));
    if ("error" in result) setError(result.error);
    else setSaved(true);
  }

  const field = "w-full rounded border border-border bg-surface px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm text-muted">
          Título
        </label>
        <input id="title" name="title" defaultValue={beat.title} required className={field} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm text-muted">
            Preço (R$)
          </label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={(beat.priceCents / 100).toFixed(2)}
            required
            className={field}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bpm" className="block text-sm text-muted">
            BPM
          </label>
          <input
            id="bpm"
            name="bpm"
            inputMode="numeric"
            defaultValue={beat.bpm ?? ""}
            className={field}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="musicalKey" className="block text-sm text-muted">
            Tom
          </label>
          <input
            id="musicalKey"
            name="musicalKey"
            defaultValue={beat.musicalKey ?? ""}
            className={field}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Categorias</legend>
        {categories.map((category) => (
          <label key={category.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="categoryIds"
              value={category.id}
              defaultChecked={beat.categoryIds.includes(category.id)}
            />
            {category.name}
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-muted">Alterações salvas.</p>}

      <button
        type="submit"
        className="rounded bg-foreground px-4 py-2 font-medium text-background"
      >
        Salvar
      </button>
    </form>
  );
}
```

Create `src/app/admin/beats/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { updateBeat } from "../actions";
import { EditBeatForm } from "../edit-beat-form";

export default async function EditBeatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const beatId = Number(id);
  const supabase = await createServerClient();

  const [{ data: beat }, { data: categories }] = await Promise.all([
    supabase
      .from("beats")
      .select("id, title, price_cents, bpm, musical_key, beat_categories(category_id)")
      .eq("id", beatId)
      .single(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!beat) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{beat.title}</h1>
      <EditBeatForm
        categories={categories ?? []}
        beat={{
          title: beat.title,
          priceCents: beat.price_cents,
          bpm: beat.bpm,
          musicalKey: beat.musical_key,
          categoryIds: (beat.beat_categories ?? []).map((link) => link.category_id),
        }}
        action={updateBeat.bind(null, beatId)}
      />
    </div>
  );
}
```

- [ ] **Step 8: Run the full suite and the build**

Run: `npm test`
Expected: PASS — every spec from Tasks 1, 3, 4, 5 and 6.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 9: Verify by hand**

Run `npm run dev`, sign in:
- `/admin` lists the beat uploaded in Task 5 with its category and price.
- Click "Publicar" → the label flips to "Publicado".
- Open the beat, change the price to `149,00`, save → "Alterações salvas." and the list shows `R$ 149,00`.
- Uncheck every category and save → "Escolha ao menos uma categoria."
- Delete a throwaway beat → it disappears, and its files are gone from both storage buckets.

Expected: all five behave as described.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add beat list, editing and publishing to the admin area"
```

---

## Done when

- SusProd signs in at `/admin/login`, and no other account can reach `/admin`.
- Categories can be created and deleted, and a category still in use refuses deletion.
- A beat can be uploaded with a tagged preview, a master MP3, an optional WAV and cover, priced in reais, tagged with one or more categories.
- Beats can be edited, published, unpublished and deleted, with their files removed on delete.
- An anonymous request can read published beats and categories, and cannot read drafts, the admin allow-list, or any file in `beat-private`.
- `npm test` and `npm run build` both pass.

Plan 2 (public storefront) starts from here and reads only published beats, their categories, and the public bucket.

---

## Status (2026-08-18)

Tasks 1–6 are implemented and committed. `npm test` (36 specs), `npm run build`
and `npm run lint` all pass.

Three deviations from the plan as written, each forced by the environment:

- **Next.js 16, not 15.** `create-next-app` installed 16.3.1, which renamed
  Middleware to Proxy — the session refresher is `src/proxy.ts`, not
  `src/middleware.ts`. The helper it calls is still `src/lib/supabase/middleware.ts`.
- **Delete and publish run from client components.** The plan bound the server
  actions straight to `<form action>`, but those actions return a result, which
  React's form-action type rejects — and binding them would have swallowed the
  error messages the actions are written to produce. `DeleteCategoryButton` and
  `BeatRowActions` call the actions and render the error.
- **`src/lib/supabase/types.ts` is hand-written** from `0001_initial_schema.sql`
  so the app could be typed before the Supabase project was reachable. Replace it
  with `npx supabase gen types typescript --project-id <ref>` output.

The repository also moved to `C:\dev\Projeto-sus`: Next 16's prerender workers
fail with `InvariantError: Expected workStore to be initialized` when the project
path contains a space, which the old path under `Windows Lite BR` did.

### Blocked on a live Supabase project

Everything below needs `.env.local` with a real project URL and anon key:

- Task 2 steps 4–8: apply both migrations, create the admin account, verify that
  `anon` cannot read drafts or `admin_users`, generate the real database types.
- Task 3 step 11, Task 4 step 11, Task 5 step 12, Task 6 step 9: the by-hand
  verification of sign-in, the admin gate, category CRUD, upload (including the
  check that a logged-out visitor cannot fetch a private master) and publishing.

## Status (2026-08-19)

Plan 1 is done and verified against the live project (`lhvrhtlidsskcayraljk`).
Migrations 0001–0004 are applied; `admin_users` holds SusProd's account; one
beat is published with a working preview.

Verified from outside the app, with the publishable key:

- `anon` reads published beats and categories, and gets an empty result on
  `admin_users`.
- `anon` writes are refused: `42501 row-level security`.
- The preview streams from `beat-public` (HTTP 200, `audio/mpeg`).
- The master exists in `beat-private` and `anon` cannot fetch it, by public URL
  or by API key.

Beyond the plan, the storefront now exists: a `(site)` route group with a hero,
a catalog at `/projetos`, expandable beat cards with an optional description, a
cart in localStorage, and an English mirror under `/en`. Checkout is deliberately
inert — that is plan 3.

### Environment traps worth remembering

- The repository moved to `C:\dev\Projeto-sus`: Next 16's prerender workers fail
  when the project path contains a space.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` holds the **publishable** key. The legacy
  service_role key leaked into a commit once and was purged from history; the
  legacy JWT keys should stay disabled.
- Three separate size limits govern uploads: `serverActions.bodySizeLimit`,
  `experimental.proxyClientMaxBodySize` (10 MB by default, truncates silently),
  and whatever the host imposes in production.
- `allowedDevOrigins` must list any origin other than localhost — a phone on the
  LAN otherwise gets 403 on every client chunk and nothing hydrates.
