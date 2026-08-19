// Renders a licence agreement to PDF from the HTML template.
//
//   node contracts/render.mjs <data.json> <out.pdf>
//   node contracts/render.mjs --blank <out.pdf>
//
// The blank form leaves every field as a rule to write on, which is what the
// producer hands over when the deal is agreed in person rather than by email.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(HERE, "non-exclusive-license.template.html");

const FIELDS = [
  "producerTagline",
  "effectiveDate",
  "compositionTitle",
  "songwriter",
  "licenseeName",
  "licenseeAlias",
  "licenseeAddress",
  "licensorName",
  "licensorAlias",
  "licensorAddress",
  "copies",
  "fee",
  "videoStreams",
  "radioStations",
  "creditName",
  "payableTo",
  "infringementLaw",
  "governingLaw",
  "licenseePublishing",
  "licensorPublishing",
];

// A blank line long enough to write on, since an empty placeholder would just
// collapse and leave the sentence looking broken.
const RULE = "&#95;".repeat(28);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function aliasPhrase(alias) {
  return alias ? `, professionally known as ${escapeHtml(alias)}` : "";
}

function build(data, { blank = false } = {}) {
  let html = readFileSync(TEMPLATE, "utf8");

  const values = {};
  for (const field of FIELDS) {
    const given = data[field];
    values[field] = given ? escapeHtml(given) : blank ? RULE : "";
  }

  // The tagline is part of the letterhead, not a field of the deal, so a blank
  // form keeps it printed rather than turning it into a line to fill in.
  values.producerTagline = escapeHtml(data.producerTagline ?? "Beats & Production");

  values.licenseeAliasPhrase = blank ? "" : aliasPhrase(data.licenseeAlias);
  values.licensorAliasPhrase = blank ? "" : aliasPhrase(data.licensorAlias);

  values.reissueNotice = data.reissueNotice
    ? `<p class="reissue">${escapeHtml(data.reissueNotice)}</p>`
    : "";

  for (const [key, value] of Object.entries(values)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  const missing = html.match(/\{\{(\w+)\}\}/g);
  if (missing) throw new Error(`template placeholders left unfilled: ${[...new Set(missing)].join(", ")}`);

  return html;
}

const args = process.argv.slice(2);
const blank = args[0] === "--blank";
const dataPath = blank ? null : args[0];
const outPath = blank ? args[1] : args[1];

if (!outPath) {
  console.error("usage: node contracts/render.mjs <data.json|--blank> <out.pdf>");
  process.exit(1);
}

const data = dataPath ? JSON.parse(readFileSync(dataPath, "utf8")) : {};
const html = build(data, { blank });

// The filled HTML is only useful when checking the layout, so it stays out of
// the delivery folder unless it is asked for.
if (args.includes("--debug")) {
  writeFileSync(outPath.replace(/\.pdf$/i, ".html"), html, "utf8");
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `
    <div style="width:100%;padding:0 20mm;font-family:Helvetica,Arial,sans-serif;
                font-size:7pt;color:#7a7a7a;display:flex;justify-content:space-between;">
      <span>${escapeHtml(data.compositionTitle ?? "Non-Exclusive License Agreement")}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
  margin: { top: "18mm", bottom: "22mm", left: "20mm", right: "20mm" },
});
await browser.close();

console.log(`wrote ${outPath}`);
