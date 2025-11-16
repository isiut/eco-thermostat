"use client";
import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type EnergyData = Record<string, number>;

export default function EnergyChart({
  selectedTime,
}: {
  selectedTime?: string;
}) {
  const [data, setData] = useState<EnergyData>({});
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  // selectedTime is e.g. "9:00 AM" from the page; we'll convert to hour

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData(hourParam?: string) {
    try {
      const url = hourParam
        ? `/api/energy?hour=${encodeURIComponent(hourParam)}`
        : "/api/energy";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setData(json ?? {});
    } catch (err) {
      console.error(err);
    }
  }
  // ------------------------------------------------------------------------------------

  // Convert selectedTime (e.g. "9:00 AM") -> two-digit hour string "09"
  function timeStringToHour(t?: string): string | null {
    if (!t) return null;
    const m = String(t)
      .trim()
      .match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
    if (!m) return null;
    let h = Number(m[1]);
    const ampm = m[2].toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return String(h).padStart(2, "0");
  }

  // Fetch data when `selectedTime` changes (or on mount). If `selectedTime` is empty,
  // server will use its current hour.
  useEffect(() => {
    const hour = timeStringToHour(selectedTime) ?? undefined;
    fetchData(hour);
    const id = setInterval(() => fetchData(hour), 60 * 1000);
    return () => clearInterval(id);
  }, [selectedTime]);

  const labels = Object.keys(data);
  const values = Object.values(data);
  const colors = labels.map(
    (_, i) =>
      [
        "#16a34a",
        "#059669",
        "#10b981",
        "#34d399",
        "#6ee7b7",
        "#ef4444",
        "#f59e0b",
      ][i % 7]
  );

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        hoverOffset: 8,
      },
    ],
  };

  const total = values.reduce((s, n) => s + n, 0);

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-emerald-200 shadow-sm">
      <h4 className="text-sm font-bold text-emerald-700 mb-2">
        Energy Sources
      </h4>
      {labels.length === 0 ? (
        <p className="text-sm text-gray-500">No energy data yet.</p>
      ) : (
        <div className="max-w-xs mx-auto">
          <Doughnut data={chartData} />
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs text-gray-500">
          Chart generated automatically from server CSV (`data/energy.csv`) for
          the current hour.
        </p>

        {labels.length > 0 && (
          <div className="mt-3 bg-emerald-50 p-3 rounded-md border border-emerald-100">
            <div className="flex justify-between text-sm font-medium text-emerald-700">
              <span>Total energy</span>
              <span>{total.toLocaleString()} Wh</span>
            </div>
            <div className="mt-2 space-y-1">
              {labels.map((label, i) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        background: colors[i],
                        display: "inline-block",
                        borderRadius: 4,
                      }}
                    />
                    <span className="text-gray-700">{label}</span>
                  </div>
                  <div className="text-gray-700">{values[i] ?? 0} Wh</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
