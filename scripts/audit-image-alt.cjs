/* eslint-disable @typescript-eslint/no-require-imports */
// Run: npm run audit:alt -- [http://localhost:3000/blog ...]
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(tsx|jsx|html|htm)$/.test(file) ? [file] : [];
  });
}
const files = ["app", "src", "public"].flatMap(sourceFiles);
const rows = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  if (/\.jsx?$|\.tsx$/.test(file)) {
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ["img", "Image"].includes(node.tagName.getText(tree))) {
        const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
        const get = key => attrs.find(attr => attr.name.getText(tree) === key)?.initializer;
        const alt = get("alt"), role = get("role"), hidden = get("aria-hidden");
        const literal = value => value && ts.isStringLiteral(value) ? value.text : undefined;
        const ignored = literal(role) === "presentation" || literal(hidden) === "true" ||
          file.replaceAll("\\", "/").includes("/Analytics/MetaPixel.");
        rows.push({ file, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
          source: get("src")?.getText(tree),
          status: !alt ? "missing" : ts.isStringLiteral(alt) ? alt.text.trim() ? "text" : ignored ? "decorative" : "empty" : "dynamic",
          expression: alt?.getText(tree) });
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  } else {
    for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
      const alt = match[0].match(/\balt\s*=\s*(["'])([\s\S]*?)\1/i);
      const decorative = /(?:aria-hidden=["']true|role=["']presentation)/i.test(match[0]);
      rows.push({ file, line: source.slice(0, match.index).split("\n").length,
        status: !alt ? "missing" : alt[2].trim() ? "text" : decorative ? "decorative" : "empty", expression: alt?.[2] });
    }
  }
}
const issues = rows.filter(row => row.status === "missing" || row.status === "empty");
const report = { scope: "Frontend source: app, src (including admin), public HTML", images: rows.length,
  missing: rows.filter(row => row.status === "missing").length,
  emptyMeaningful: rows.filter(row => row.status === "empty").length,
  decorative: rows.filter(row => row.status === "decorative").length,
  dynamic: rows.filter(row => row.status === "dynamic").length, issues, rows, rendered: [] };
console.log("Frontend image ALT audit");
console.log("Image tags: " + report.images);
console.log("Missing ALT attribute: " + report.missing);
console.log("Blank ALT needing review: " + report.emptyMeaningful);
console.log("Intentional decorative/tracking ALT: " + report.decorative);
console.log("Dynamic ALT expressions: " + report.dynamic + " (source scan; runtime values require rendered-page checks)");
for (const issue of issues) console.log(issue.file + ":" + issue.line + " " + issue.status);
(async () => {
  for (const url of process.argv.slice(2)) {
    try {
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const html = await response.text();
    const { JSDOM } = require("jsdom");
    // Exclude noscript tracking pixels from the visible-page image audit.
    const dom = new JSDOM(html, { url, runScripts: "outside-only" });
    const images = [...dom.window.document.images].filter(image => !image.closest("noscript"));
    const missing = images.filter(image => !image.hasAttribute("alt"));
    const blank = images.filter(image => !image.alt.trim() && image.getAttribute("aria-hidden") !== "true" && image.getAttribute("role") !== "presentation");
    const result = { url, status: response.status, images: images.length,
      missing: missing.map(image => image.outerHTML), blank: blank.map(image => image.outerHTML),
      note: "Server-rendered HTML only; client-loaded images are covered by API/component checks, not browser hydration." };
    report.rendered.push(result);
    console.log(url + " HTTP " + response.status + ": " + images.length + " SSR images, " + missing.length + " missing, " + blank.length + " blank");
    dom.window.close();
    if (!response.ok || missing.length || blank.length) process.exitCode = 1;
    } catch (error) {
      report.rendered.push({ url, error: error.message });
      console.error(url + ": " + error.message);
      process.exitCode = 1;
    }
  }
  fs.mkdirSync(".tmp-alt-audit", { recursive: true });
  fs.writeFileSync(path.join(".tmp-alt-audit", "report.json"), JSON.stringify(report, null, 2));
  console.log("Report: .tmp-alt-audit/report.json");
  if (issues.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
