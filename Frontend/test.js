import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync } from "fs";

// ✅ Ensure report folder exists
const reportDir = "./lighthouse-reports";
if (!existsSync(reportDir)) {
  mkdirSync(reportDir);
}

// ✅ Pages based on your React Router
const pages = [
  "", // Landing
  "login",
  "forgot-password",
  "signup",
  "demo",
  "face-registration",
  "student-dashboard",
  "lecturer-groups",
  "lecturer-dashboard/1",
  "admin-panel",
  "user-profile",
  "not-found"
];

const results = [];

function runLighthouse(url, outputFile) {
  console.log(`🚀 Testing ${url || "home"} (Desktop Mode)...`);
  try {
    const baseName = outputFile.replace(/\//g, "_") || "home";
    const htmlPath = `${reportDir}/${baseName}.html`;
    const jsonPath = `${reportDir}/${baseName}.report.json`;

    // ✅ Run Lighthouse in desktop mode
    execSync(
      `npx lighthouse http://localhost:8080/${url} --preset=desktop --output json --output html --output-path=${htmlPath} --chrome-flags="--headless --disable-gpu --no-sandbox --ignore-certificate-errors"`,
      { stdio: "ignore" }
    );

    // ✅ Read JSON report
    const jsonFile = readFileSync(jsonPath, "utf8");
    const data = JSON.parse(jsonFile);
    const categories = data.categories;
    const audits = data.audits;

    // ✅ Extract key scores
    const perf = categories.performance.score * 100;
    const access = categories.accessibility.score * 100;
    const seo = categories.seo.score * 100;
    const best = categories["best-practices"].score * 100;

    // ✅ Extract detailed metrics
    const lcp = (audits["largest-contentful-paint"]?.numericValue / 1000).toFixed(2) + " s";
    const cls = audits["cumulative-layout-shift"]?.numericValue?.toFixed(3);
    const inp =
      audits["interactive"]?.numericValue
        ? (audits["interactive"].numericValue / 1000).toFixed(2) + " s"
        : "N/A";

    results.push({
      Page: url || "home",
      Performance: perf,
      Accessibility: access,
      SEO: seo,
      "Best Practices": best,
      LCP: lcp,
      CLS: cls,
      INP: inp
    });
  } catch (err) {
    console.error(`❌ Error testing ${url}:`, err.message);
  }
}

(async () => {
  for (const page of pages) {
    runLighthouse(page, page || "home");
  }

  // ✅ Print summary table
  console.log("\n📊 Lighthouse Desktop Summary (with Local Metrics)\n");
  console.table(results);

  // ✅ Calculate averages
  const avg = (key) =>
    (results.reduce((sum, r) => sum + (r[key] || 0), 0) / results.length).toFixed(2);

  console.log(`\n✅ Average Performance: ${avg("Performance")}%`);
  console.log(`✅ Average Accessibility: ${avg("Accessibility")}%`);
  console.log(`✅ Average SEO: ${avg("SEO")}%`);
  console.log(`✅ Average Best Practices: ${avg("Best Practices")}%`);
})();
