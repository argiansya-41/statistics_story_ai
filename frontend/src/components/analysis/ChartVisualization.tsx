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
      <div className="border border-black bg-white p-8 text-center font-mono-tech text-xs text-black/50 shadow-[4px_4px_0px_#000000]">
        Grafik visualisasi belum tersedia untuk analisis ini.
      </div>
    );
  }

  const spec = visualisasi[activeTab] || visualisasi[0];
  const { jenis_grafik, judul, label_x, label_y, data_grafik } = spec;

  return (
    <div className="border border-black bg-white shadow-[4px_4px_0px_#000000]">
      {/* Header Bar */}
      <div className="bg-[#EFEFEF] border-b border-black px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
          <span className="font-mono-tech text-xs font-bold text-black uppercase tracking-wider">
            {judul || `VISUALISASI PIKSEL SVG: ${jenis_grafik.toUpperCase()}`}
          </span>
        </div>

        {/* Tab Pemilih jika terdapat lebih dari 1 grafik */}
        {visualisasi.length > 1 && (
          <div className="flex border border-black bg-white divide-x divide-black font-mono-tech text-xs font-bold">
            {visualisasi.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`px-3 py-1 transition-colors ${
                  activeTab === i ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                }`}
              >
                Grafik {i + 1}: {v.jenis_grafik}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="p-6 md:p-8 bg-[#FBFBFB]">
        {/* 1. GRAFIK BATANG PIKSEL (BAR CHART) */}
        {jenis_grafik === "batang" && (
          <div className="w-full max-w-2xl mx-auto space-y-6" role="img" aria-label={`Grafik batang perbandingan ${judul || ""}`}>
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
                      const pct = Math.max(10, (val / (maxVal * 1.15)) * 100);
                      const isFirst = idx === 0;

                      return (
                        <div key={kat} className="space-y-1.5">
                          <div className="flex justify-between font-mono-tech text-xs font-bold">
                            <span className="text-black uppercase">{kat}</span>
                            <span className="text-black/70 font-mono-tech">{labels[idx] || `Rata-rata: ${val}`}</span>
                          </div>
                          <div className="h-11 w-full bg-[#E5E5E5] border-2 border-black relative overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full border-r-2 border-black transition-all duration-700 flex items-center justify-end pr-3 font-mono-tech text-xs font-bold ${
                                isFirst
                                  ? "bg-[#003BFF] text-white"
                                  : "bg-[#EBEB00] text-black"
                              }`}
                            >
                              {val}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-between font-mono-tech text-[10px] text-black/60 border-t border-black pt-2">
                    <span>SUMBU X: {label_x || "Kelompok Observasi"}</span>
                    <span>SUMBU Y: {label_y || "Rata-rata Nilai"}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. HISTOGRAM PIKSEL */}
        {jenis_grafik === "histogram" && (
          <div className="w-full max-w-2xl mx-auto space-y-4" role="img" aria-label={`Histogram frekuensi distribusi ${judul || ""}`}>
            {(() => {
              const bins = data_grafik.bins || [];
              const maxCount = Math.max(...bins.map((b) => b.count), 1);
              const mean = data_grafik.mean_marker;

              return (
                <div>
                  {mean !== undefined && (
                    <div className="mb-3 flex items-center gap-2 font-mono-tech text-xs text-[#003BFF] font-bold">
                      <span className="w-3 h-1 bg-[#003BFF] border border-black inline-block" />
                      <span>Garis Rata-rata (Mean): {mean}</span>
                    </div>
                  )}

                  {/* SVG Histogram */}
                  <div className="relative aspect-[16/9] w-full border-2 border-black bg-white p-3">
                    <svg
                      viewBox="0 0 100 60"
                      preserveAspectRatio="none"
                      className="w-full h-full"
                      aria-label="Distribusi histogram data"
                    >
                      {/* Grid Horizontal */}
                      <line x1="0" y1="15" x2="100" y2="15" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="1,1" />
                      <line x1="0" y1="30" x2="100" y2="30" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="1,1" />
                      <line x1="0" y1="45" x2="100" y2="45" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="1,1" />
                      <line x1="0" y1="55" x2="100" y2="55" stroke="#000000" strokeWidth="1" />

                      {/* Batang Bins (Kotak Tegas) */}
                      {bins.map((b, idx) => {
                        const barWidth = 100 / bins.length;
                        const barHeight = (b.count / (maxCount * 1.2)) * 48;
                        const x = idx * barWidth + 1;
                        const y = 55 - barHeight;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={Math.max(3, barWidth - 2)}
                              height={barHeight}
                              fill="#003BFF"
                              stroke="#000000"
                              strokeWidth="0.8"
                            />
                            {b.count > 0 && (
                              <text
                                x={x + barWidth / 2 - 1}
                                y={y - 2}
                                fontSize="3"
                                textAnchor="middle"
                                fontFamily="monospace"
                                fontWeight="bold"
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
                  <div className="flex justify-between mt-2 font-mono-tech text-[10px] text-black/70 font-bold">
                    {bins.map((b, i) => (
                      <span key={i} className="text-center truncate px-0.5">
                        {b.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between font-mono-tech text-[10px] text-black/60 border-t border-black pt-2">
                    <span>SUMBU X: {label_x || "Interval Nilai Observasi"}</span>
                    <span>SUMBU Y: {label_y || "Frekuensi Kemunculan"}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. SCATTER PLOT PIKSEL (DENGAN TITIK KOTAK & GARIS TEGAS) */}
        {jenis_grafik === "scatter" && (
          <div className="w-full max-w-2xl mx-auto space-y-4" role="img" aria-label={`Scatter plot korelasi/regresi ${judul || ""}`}>
            {(() => {
              const points = data_grafik.points || [];
              if (points.length === 0) {
                return <div className="font-mono-tech text-xs">Titik data belum tersedia.</div>;
              }

              const xs = points.map((p) => p.x);
              const ys = points.map((p) => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              const rangeX = maxX === minX ? 1 : maxX - minX;
              const rangeY = maxY === minY ? 1 : maxY - minY;

              // Pemetaan koordinat ke viewport 100 x 60
              const mapPt = (p: { x: number; y: number }) => {
                const nx = 10 + ((p.x - minX) / rangeX) * 80;
                const ny = 50 - ((p.y - minY) / rangeY) * 40;
                return { x: nx, y: ny };
              };

              const line = data_grafik.line;
              const lineStart = line ? mapPt({ x: line.x1, y: line.y1 }) : null;
              const lineEnd = line ? mapPt({ x: line.x2, y: line.y2 }) : null;

              return (
                <div>
                  <div className="relative aspect-[16/10] w-full border-2 border-black bg-white p-2">
                    <svg
                      viewBox="0 0 100 60"
                      preserveAspectRatio="none"
                      className="w-full h-full"
                      aria-label="Diagram tebar titik piksel dan garis regresi"
                    >
                      {/* Grid Kisi Blueprint */}
                      <line x1="10" y1="10" x2="92" y2="10" stroke="#EDEDED" strokeWidth="0.5" strokeDasharray="1,1" />
                      <line x1="10" y1="30" x2="92" y2="30" stroke="#EDEDED" strokeWidth="0.5" strokeDasharray="1,1" />
                      <line x1="10" y1="50" x2="92" y2="50" stroke="#000000" strokeWidth="1" />
                      <line x1="10" y1="10" x2="10" y2="50" stroke="#000000" strokeWidth="1" />

                      {/* Garis Tren / Garis Regresi Tegas */}
                      {lineStart && lineEnd && (
                        <line
                          x1={lineStart.x}
                          y1={lineStart.y}
                          x2={lineEnd.x}
                          y2={lineEnd.y}
                          stroke="#003BFF"
                          strokeWidth="1.2"
                          strokeDasharray="2,1"
                        />
                      )}

                      {/* Titik Tebar Sebagai KOTAK PIKSEL (<rect>) */}
                      {points.map((pt, idx) => {
                        const coords = mapPt(pt);
                        return (
                          <rect
                            key={idx}
                            x={coords.x - 1.5}
                            y={coords.y - 1.5}
                            width="3"
                            height="3"
                            fill="#FF2E2E"
                            stroke="#000000"
                            strokeWidth="0.6"
                            aria-label={`Titik (${pt.x}, ${pt.y})`}
                          >
                            <title>
                              ({pt.x}, {pt.y})
                            </title>
                          </rect>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="mt-3 flex justify-between font-mono-tech text-[10px] text-black/70 font-bold border-t border-black pt-2">
                    <div>
                      SUMBU X: <span className="text-black">{label_x || "Variabel X"}</span> ({minX} s.d. {maxX})
                    </div>
                    <div>
                      SUMBU Y: <span className="text-black">{label_y || "Variabel Y"}</span> ({minY} s.d. {maxY})
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
