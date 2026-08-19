# Licence contracts

The non-exclusive beat licence SusProd sends to buyers, as a typeset template
plus a small renderer.

## Rendering

```bash
node contracts/render.mjs <data.json> <out.pdf>     # a filled agreement
node contracts/render.mjs --blank <out.pdf>         # a form to fill by hand
node contracts/render.mjs <data.json> <out.pdf> --debug   # also write the HTML
```

`contracts/example.json` lists every field with placeholder values. Copy it,
fill it in, and render. A field left out of the JSON renders empty in a filled
agreement and as a writing rule in a blank one, and the renderer refuses to
finish if a template placeholder was never substituted.

The renderer needs Playwright's Chromium:

```bash
npm i --no-save playwright && npx playwright install chromium
```

## What is not in this folder

Filled data files name real buyers and carry their home addresses. Keep them
out of the repository — render into a local folder that git ignores, and send
the PDF from there.

## About the wording

The clauses are the ones SusProd has been using. The rewrite fixed grammar and
typography only — no term changed. Corrections included `licence`/`license`
used interchangeably, "grants to License" where the Licensee was meant,
"principle address" for "principal address", "here by", "condition upon",
a singular "a Recordings", a missing word in the Delivery clause, and copy
counts printed without digit separators.

Two things in the source contracts are substantive and were left exactly as
they were, because changing them would change the deal:

- The Governing Law clause names Bahia, Brazil, while the Consideration clause
  invokes the United States Copyright Act.
- One agreement caps copies at 2,147,483,647 — the maximum value of a signed
  32-bit integer, which suggests a form default rather than a negotiated
  number.

Both are worth a lawyer's eye before the next contract goes out.

## Reissued copies

Two of the original agreements are already signed. A reissued PDF reproduces
their terms for reading only and says so in a notice at the top; the executed
document is the copy the parties actually signed. Never send a reissue as if it
were the signed agreement.
