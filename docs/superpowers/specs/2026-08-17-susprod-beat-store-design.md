# SusProd — Beat Store & Portfolio

Status: draft, decisions pending. Written mid-brainstorming session, 2026-08-17.

## Idea

Site for music producer **SusProd**: sells beats and doubles as his portfolio.
Visual style: dark trap aesthetic, black-and-white palette.

## Scope decomposition

Project is too big for one spec. Split into sub-projects, each gets its own
spec → plan → implementation cycle:

1. **Store / beat library** (this spec's focus) — catalog of finished beats,
   preview playback, purchase. Also functions as portfolio.
2. **Custom request + admin** (next spec) — client-facing form to request a
   personalized beat/project; each submission creates a ticket/order visible
   in an `/admin` panel for SusProd.
3. **About/bio section** — deferred, details TBD in a later conversation.

## Decisions locked in

- **Stack**: Next.js + React. Reasoning: full-stack in one framework, good
  admin-panel ergonomics, easy access to shadcn/ui components, easy deploy
  (Vercel).
- Repo currently has zero app code — only `.agents/` skill library. No git
  repo initialized yet (per CLAUDE.md, "master has zero commits" — actually
  no `.git` exists at all as of this session).

## Open questions (answer next session before finalizing sub-project 1 spec)

- **Licensing model for beats**: multiple license tiers per beat (MP3 lease /
  WAV-trackout lease / exclusive — standard in the beat-selling market) vs. a
  single flat price per beat vs. leave structure open for now. Was mid-ask
  when session paused.
- **Payment processing**: which provider/integration (Stripe? something else?).
- **Audio preview**: watermarked/tagged preview vs. full-track streaming with
  DRM-lite protection; need a player (waveform? simple `<audio>`?).
- **File delivery after purchase**: what does the buyer receive (MP3 only,
  WAV, trackout stems, exclusive contract doc)? Automated delivery or manual?
- **Beat catalog data**: how beats get uploaded/managed — admin upload flow,
  or manual for now (v1) with admin CMS later?
- **Auth**: does the storefront need customer accounts, or checkout-as-guest
  with order lookup via email?
- **Hosting/deploy target**: Vercel assumed given Next.js choice — confirm.

## Next steps

1. Resume brainstorming for sub-project 1 (store/beat library): answer open
   questions above, one at a time.
2. Propose 2-3 architecture approaches with trade-offs once requirements are
   clear.
3. Present design in sections, get approval per section.
4. Finalize this spec file (replace draft status), then run spec self-review.
5. User reviews spec, then hand off to `writing-plans` skill for sub-project 1.
6. Only after sub-project 1 ships (or at least has an approved plan): start
   brainstorming sub-project 2 (custom request + `/admin` ticket system).
