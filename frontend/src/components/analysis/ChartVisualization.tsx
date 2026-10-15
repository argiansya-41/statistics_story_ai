"use client";

import React, { useState } from "react";
import type { VisualizationSpec } from "@/lib/types/analysis";

interface ChartVisualizationProps {
  visualisasi?: VisualizationSpec[];
}

export const ChartVisualization: React.FC<ChartVisualizationProps> = ({ visualisasi }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!visualisasi || visualisasi.length === 0) {
    return (
      <div className="border border-black bg-white p-8 text-center font-mono-tech text-xs text-black/50">
        Grafik belum tersedia untuk analisis ini.
      </div>
    );
  }

  const spec = visualisasi[activeTab] || visualisasi[0];
  const { jenis_grafik, judul, label_x, label_y, data_grafik } = spec;

  return (
    <div className="border border-black bg-white">
      {/* Header Bar */}
      <div className="bg-[#EFEFEF] border-b border-black px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
          <span className="font-mono-tech text-xs font-bold text-black uppercase">
            {judul || `VISUALISASI: ${jenis_grafik.toUpperCase()}`}
          </span>
        </div>

        {/* Tab Pemilih jika ada lebih dari 1 grafik */}
        {visualisasi.length > 1 && (
          <div className="flex border border-black bg-white divide-x divide-black font-mono-tech text-[11px]">
            {visualisasi.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`px-3 py-1 font-bold transition-colors ${
                  activeTab === i ? "bg-black text-white" : "hover:bg-[#EBEB00]"
                }`}
              >
                Grafik {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="p-6 md:p-8 bg-[#FBFBFB]">
        {/* 1. GRAFIK BATANG (BAR CHART) */}
        {jenis_grafik === "batang" && (
          <div className="w-full max-w-2xl mx-auto">
            {(() => {
              const kategori = data_grafik.kategori || [];
              const nilai = data_grafik.nilai || [];
              const labels = data_grafik.labels || [];
              const maxVal = Math.max(...nilai, 1);

              return (
                <div>
                  <div className="space-y-4">
                    {kategori.map((kat, idx) => {
                      const val = nilai[idx] || 0;
                      const pct = Math.max(8, (val / (maxVal * 1.15)) * 100);
                      const isFirst = idx === 0;

                      return (
                        <div key={kat} className="space-y-1">
                          <div className="flex justify-between font-mono-tech text-xs font-bold">
                            <span>{kat}</span>
                            <span className="text-black/70">{labels[idx] || val}</span>
                          </div>
                          <div className="h-10 w-full bg-[#E5E5E5] border border-black relative overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full border-r border-black transition-all duration-500 flex items-center justify-end pr-3 font-mono-tech text-xs font-bold ${
                                isFirst ? "bg-[#003BFF] text-white" : "bg-[#EBEB00] text-black"
                              }`}
                            >
                              {val}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-between font-mono-tech text-[10px] text-black/50 border-t border-black/20 pt-2">
                    <span>{label_x || "Kelompok"}</span>
                    <span>{label_y || "Rata-rata Nilai"}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. HISTOGRAM */}
        {jenis_grafik === "histogram" && (
          <div className="w-full max-w-2xl mx-auto">
            {(() => {
              const bins = data_grafik.bins || [];
              const maxCount = Math.max(...bins.map((b) => b.count), 1);
              const mean = data_grafik.mean_marker;

              return (
                <div>
                  {mean !== undefined && (
                    <div className="mb-4 flex items-center gap-2 font-mono-tech text-xs text-[#003BFF] font-bold">
                      <span className="w-3 h-0.5 bg-[#003BFF] inline-block" />
                      <span>Rata-rata (Mean): {mean}</span>
                    </div>
                  )}

                  {/* SVG Histogram Bars */}
                  <div className="relative aspect-[16/9] w-full border border-black bg-white p-4">
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                      {/* Grid Horizontal */}
                      <line x1="0" y1="15" x2="100" y2="15" stroke="#EAEAEA" strokeWidth="0.5" />
                      <line x1="0" y1="30" x2="100" y2="30" stroke="#EAEAEA" strokeWidth="0.5" />
                      <line x1="0" y1="45" x2="100" y2="45" stroke="#EAEAEA" strokeWidth="0.5" />

                      {/* Batang Bins */}
                      {bins.map((b, idx) => {
                        const barWidth = 100 / bins.length;
                        const barHeight = (b.count / (maxCount * 1.15)) * 50;
                        const x = idx * barWidth + 1;
                        const y = 55 - barHeight;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={Math.max(2, barWidth - 2)}
                              height={barHeight}
                              fill="#003BFF"
                              stroke="#000000"
                              strokeWidth="0.5"
                            />
                            {/* Angka frekuensi di atas batang */}
                            {b.count > 0 && (
                              <text
                                x={x + barWidth / 2 - 1}
                                y={y - 2}
                                fontSize="3"
                                textAnchor="middle"
                                fontFamily="monospace"
                                fill="#000000"
                              >
                                {b.count}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Label Rentang Bins */}
                  <div className="flex justify-between mt-2 font-mono-tech text-[10px] text-black/60">
                    {bins.map((b, i) => (
                      <span key={i} className="text-center truncate px-0.5">
                        {b.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between font-mono-tech text-[10px] text-black/50 border-t border-black/20 pt-2">
                    <span>{label_x || "Interval Nilai"}</span>
                    <span>{label_y || "Frekuensi (Jumlah Observasi)"}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. SCATTER PLOT */}
        {jenis_grafik === "scatter" && (
          <div className="w-full max-w-2xl mx-auto">
            {(() => {
              const points = data_grafik.points || [];
              if (points.length === 0) {
                return <div className="font-mono-tech text-xs">Titik scatter belum tersedia.</div>;
              }

              const xs = points.map((p) => p.x);
              const ys = points.map((p) => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              const rangeX = maxX === minX ? 1 : maxX - minX;
              const rangeY = maxY === minY ? 1 : maxY - minY;

              // Normalisasi koordinat ke 100 x 60 viewBox
              const mapPt = (p: { x: number; y: number }) => {
                const nx = 8 + ((p.x - minX) / rangeX) * 84;
                const ny = 52 - ((p.y - minY) / rangeY) * 44;
                return { cx: nx, cy: ny };
              };

              const line = data_grafik.line;
              const lineStart = line ? mapPt({ x: line.x1, y: line.y1 }) : null;
              const lineEnd = line ? mapPt({ x: line.x2, y: line.y2 }) : null;

              return (
                <div>
                  <div className="relative aspect-[16/10] w-full border border-black bg-white p-2">
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                      {/* Grid */}
                      <line x1="8" y1="10" x2="92" y2="10" stroke="#EDEDED" strokeWidth="0.5" />
                      <line x1="8" y1="30" x2="92" y2="30" stroke="#EDEDED" strokeWidth="0.5" />
                      <line x1="8" y1="52" x2="92" y2="52" stroke="#000000" strokeWidth="0.8" />
                      <line x1="8" y1="10" x2="8" y2="52" stroke="#000000" strokeWidth="0.8" />

                      {/* Garis Regresi / Trend */}
                      {lineStart && lineEnd && (
                        <line
                          x1={lineStart.cx}
                          y1={lineStart.cy}
                          x2={lineEnd.cx}
                          y2={lineEnd.cy}
                          stroke="#003BFF"
                          strokeWidth="1.2"
                          strokeDasharray="2,1"
                        />
                      )}

                      {/* Titik Scatter Plot */}
                      {points.map((pt, idx) => {
                        const coords = mapPt(pt);
                        return (
                          <circle
                            key={idx}
                            cx={coords.cx}
                            cy={coords.cy}
                            r="1.8"
                            fill="#FF2E2E"
                            stroke="#000000"
                            strokeWidth="0.5"
                          >
                            <title>
                              ({pt.x}, {pt.y})
                            </title>
                          </circle>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="mt-3 flex justify-between font-mono-tech text-[10px] text-black/60">
                    <div>
                      Sumbu X: <strong className="text-black">{label_x || "Variabel X"}</strong> ({minX} s.d. {maxX})
                    </div>
                    <div>
                      Sumbu Y: <strong className="text-black">{label_y || "Variabel Y"}</strong> ({minY} s.d. {maxY})
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
