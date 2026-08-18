# SusProd — Beat Store & Portfolio

Status: requirements settled, ready for planning. Updated 2026-08-18.

## Idea

Site for the music producer **SusProd**: sells beats and doubles as his
portfolio. Visual style: dark trap aesthetic, black-and-white palette.

## Scope for v1

1. **Beat catalog** — finished beats browsable by category, with preview
   playback and purchase.
2. **Audio player** — persistent player with full transport controls.
3. **"Chamar o SUS"** — a call-to-action button anywhere in the catalog that
   opens a request form for a custom/exclusive project. Each submission
   creates a ticket in `/admin`.
4. **Admin panel** — SusProd logs in, uploads beats, manages the request
   queue.

Deferred to a later cycle: the about/bio section.

## Decisions

**Stack**: Next.js + React (App Router), shadcn/ui for components.
Full-stack in one framework, good admin ergonomics, easy deploy.

**Catalog and categories**: beats are grouped by category — the type/genre of
the track (e.g. dark trap, drill, boom bap, R&B). A beat belongs to at least
one category. The catalog page filters by category; categories are managed
from the admin panel alongside the beats themselves.

**Pricing**: one flat price per beat. No license tiers.

**Payments**: both Stripe (international cards) and Mercado Pago (PIX, boleto,
Brazilian cards). Buyer picks at checkout.

**Preview audio**: each beat has a separate preview MP3 carrying SusProd's
voice tag. The full untagged file is never served before purchase.

**Player**: persistent across navigation — it keeps playing while the visitor
browses. Controls: play/pause, seek (scrub backwards and forwards on a
waveform or progress bar), volume with mute, track title and cover art, and
next/previous through the current filtered list.

**Catalog management**: admin upload flow. SusProd signs in and uploads the
audio files, cover art, title, category and price through the site — no
deploy needed to add a beat.

**Delivery after purchase**: automated. Payment webhook confirms the sale and
emails a signed, expiring download link for the MP3 and WAV.

**Customer auth**: none. Guest checkout with email only; the buyer looks up an
order by email if the link expires. Login exists solely for the admin.

**Infrastructure**: Vercel for the app, Supabase for Postgres, audio/artwork
storage, and admin auth.

## Custom project requests ("Chamar o SUS")

A prominent button in the catalog (and in the site header) opens a form:
name, contact email, reference tracks or description of what the client
wants, budget and deadline if they have one. Submitting creates a request
record visible in `/admin` with a status the producer moves through
(new → in conversation → accepted → delivered → closed). SusProd gets an
email notification for each new request.

## Next steps

1. Hand this spec to the `writing-plans` skill and produce the v1 plan.
2. Build order suggested by dependency: data model and Supabase setup →
   admin auth and beat upload → public catalog with categories → player →
   checkout and delivery → request form and admin queue.
