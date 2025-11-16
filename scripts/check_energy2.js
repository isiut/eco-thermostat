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
    const raw = String(s).trim();
    const m = raw.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|a\.m|am|p\.m\.|p\.m|pm|AM|PM)?/i
    );
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    const year = Number(m[3]);
    let hour = Number(m[4]);
    const minute = m[5] ? Number(m[5]) : 0;
    const ampm = m[6] ? String(m[6]).toLowerCase() : null;
    if (ampm) {
      if (/p/.test(ampm) && hour < 12) hour += 12;
      if (/a/.test(ampm) && hour === 12) hour = 0;
    }
    const d = new Date(year, month - 1, day, hour, minute, 0, 0);
    return d;
  }

  console.log("Showing first 6 raw timestamps and their normalized forms:");
  for (let i = 0; i < 6 && i < rows.length; i++) {
    const raw = rows[i]["Timestamp (Hour Ending)"];
    let norm = String(raw).replace(/\s+[A-Z]{2,4}$/, "");
    norm = norm.replace(/\b(a\.m\.|a\.m|am)\b/i, "AM");
    norm = norm.replace(/\b(p\.m\.|p\.m|pm)\b/i, "PM");
    norm = norm.replace(/\./g, "");
    console.log(i + 1, "raw:", raw);
    console.log("   normalized:", norm);
    console.log("   Date parse ->", new Date(norm).toString());
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
