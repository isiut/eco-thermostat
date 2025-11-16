"use client";
import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type EnergyData = Record<string, number>;

export default function EnergyChart() {
  const [data, setData] = useState<EnergyData>({});
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hour, setHour] = useState<string>("00");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/energy");
      if (!res.ok) return;
      const json = await res.json();
      setData(json ?? {});
    } catch (err) {
      console.error(err);
    }
  }
  // ------------------------------------------------------------------------------------

  // Automatically update `hour` to the current hour and fetch server data
  useEffect(() => {
    const updateHour = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      setHour(h);
    };

    updateHour();
    const id = setInterval(updateHour, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch data automatically when the hour changes (or on mount), and periodically
  useEffect(() => {
    // initial fetch
    fetchData();
    // refresh every minute
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour]);

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
