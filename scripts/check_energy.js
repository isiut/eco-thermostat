const fs = require("fs");
const path = require("path");

const csvPath = path.join(process.cwd(), "data", "energy.csv");
try {
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = lines[0]
    .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? "";
    rows.push(obj);
  }

  function parseTs(s) {
    if (!s) return null;
    let str = String(s);
    str = str.replace(/\s+[A-Z]{2,4}$/, "");
    str = str.replace(/\b(a\.m\.|a\.m|am)\b/i, "AM");
    str = str.replace(/\b(p\.m\.|p\.m|pm)\b/i, "PM");
    str = str.replace(/\./g, "");
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  const hoursFound = new Set();
  for (const r of rows) {
    const ts = parseTs(r["Timestamp (Hour Ending)"]);
    if (ts) hoursFound.add(ts.getHours());
  }

  const hoursArr = Array.from(hoursFound).sort((a, b) => a - b);
  console.log("Hours present in CSV:", hoursArr.join(","));
  const now = new Date();
  console.log("Current server hour:", now.getHours());
  const matches = rows.filter((r) => {
    const ts = parseTs(r["Timestamp (Hour Ending)"]);
    return ts && ts.getHours() === now.getHours();
  });
  console.log("Matching rows for current hour:", matches.length);
  if (matches.length > 0)
    console.log(
      "First matching timestamp:",
      matches[0]["Timestamp (Hour Ending)"]
    );
} catch (err) {
  console.error("Error reading CSV:", err.message);
  process.exit(1);
}
