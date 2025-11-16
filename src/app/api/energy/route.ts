import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Simple in-memory store for demo purposes.
// Note: this won't persist across server restarts or in serverless edge environments.
let latestEnergy: Record<string, number> | null = null;

async function tryReadCsvForCurrentHour(): Promise<Record<
  string,
  number
> | null> {
  try {
    // Look for a CSV in the project `data/energy.csv` (user can place their file there)
    const csvPath = path.join(process.cwd(), "data", "energy.csv");
    const text = await fs.readFile(csvPath, "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return null;
    const header = lines[0]
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]
        .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
        .map((c) => c.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? "";
      rows.push(obj);
    }

    const tsCol = "Timestamp (Hour Ending)";
    const now = new Date();
    const targetHour = now.getHours();

    // Helper: parse timestamp strings similar to client logic
    function parseTs(s: string) {
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

    const subset = rows.filter((r) => {
      const raw = r[tsCol] ?? r[tsCol.toLowerCase()];
      const d = parseTs(raw as string);
      return d !== null && d.getHours() === targetHour;
    });

    if (subset.length === 0) return null;

    const row = subset[0];
    const excluded = new Set(["BA Code", tsCol]);
    const result: Record<string, number> = {};
    for (const col of Object.keys(row)) {
      if (excluded.has(col)) continue;
      const raw = row[col];
      const num = Number(String(raw).replace(/,/g, ""));
      result[col] = Number.isNaN(num) ? 0 : num;
    }

    return result;
  } catch (err) {
    // If file doesn't exist or parse fails, return null to indicate no file data available
    return null;
  }
}

export async function GET() {
  // Return in-memory stored data if present
  if (latestEnergy) return NextResponse.json(latestEnergy);

  // Otherwise try to read CSV from disk and compute for current hour
  const fromFile = await tryReadCsvForCurrentHour();
  if (fromFile) return NextResponse.json(fromFile);

  return NextResponse.json({});
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an object of {source: wh}" },
        { status: 400 }
      );
    }

    const parsed: Record<string, number> = {};
    for (const key of Object.keys(body)) {
      const val = Number(body[key]);
      parsed[key] = Number.isNaN(val) ? 0 : val;
    }

    latestEnergy = parsed;
    return NextResponse.json({ success: true, data: latestEnergy });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
