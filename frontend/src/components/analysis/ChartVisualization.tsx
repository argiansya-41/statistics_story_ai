"use client";

import React, { useState } from "react";
import type { VisualizationSpec } from "@/lib/types/analysis";
import { BarChart3, TrendingUp, Info } from "lucide-react";

interface ChartVisualizationProps {
  visualisasi?: VisualizationSpec[];
}

export const ChartVisualization: React.FC<ChartVisualizationProps> = ({ visualisasi }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label?: string } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ label: string; value: number } | null>(null);

  if (!visualisasi || visualisasi.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Grafik visualisasi belum tersedia untuk analisis ini.
      </div>
    );
  }

  const spec = visualisasi[activeTab] || visualisasi[0];
  const { jenis_grafik, judul, label_x, label_y, data_grafik } = spec;

  // Modern Chart Color Palette (Standard Scientific / Analytics Palette)
  const colors = {
    primary: "#2563EB",       // Royal Blue
    primaryLight: "#3B82F6",  // Blue
    primaryFill: "rgba(37, 99, 235, 0.65)",
    secondary: "#10B981",     // Emerald Green
    accent: "#F59E0B",        // Amber
    trendline: "#EF4444",     // Crimson Red
    meanLine: "#DC2626",
    grid: "#E2E8F0",          // Subtle slate grid
    gridLight: "#F1F5F9",
    axis: "#94A3B8",          // Slate-400
    text: "#475569",          // Slate-600
    textDark: "#1E293B",      // Slate-800
  };

  const barPalette = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              {jenis_grafik === "scatter" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
            </span>
            <h3 className="text-base font-semibold text-slate-800">
              {judul || (jenis_grafik === "scatter" ? "Diagram Tebar (Scatter Plot)" : jenis_grafik === "batang" ? "Grafik Batang" : "Histogram Distribusi")}
            </h3>
          </div>
          <p className="text-xs text-slate-500 pl-9">
            {jenis_grafik === "scatter"
              ? `Hubungan antara ${label_x || "Variabel X"} dan ${label_y || "Variabel Y"}`
              : jenis_grafik === "batang"
              ? `Perbandingan nilai rata-rata antar kelompok`
              : `Frekuensi sebaran data observasi`}
          </p>
        </div>

        {/* Tab Pemilih jika terdapat lebih dari 1 grafik */}
        {visualisasi.length > 1 && (
          <div className="flex rounded-lg bg-slate-100 p-1">
            {visualisasi.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === i
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Grafik {i + 1}: {v.jenis_grafik.charAt(0).toUpperCase() + v.jenis_grafik.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="pt-6">
        {/* =========================================================================
            1. GRAFIK BATANG STANDARD (BAR CHART)
           ========================================================================= */}
        {jenis_grafik === "batang" && (
          <div className="w-full max-w-3xl mx-auto space-y-4">
            {(() => {
              const kategori = data_grafik.kategori || [];
              const nilai = data_grafik.nilai || [];
              const labels = data_grafik.labels || [];
              const rawMax = Math.max(...nilai, 1);
              const maxVal = Math.ceil(rawMax * 1.15);

              // Grid ticks for Y-axis (4 intervals)
              const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

              const width = 640;
              const height = 340;
              const marginLeft = 60;
              const marginRight = 30;
              const marginTop = 30;
              const marginBottom = 60;
              const plotWidth = width - marginLeft - marginRight;
              const plotHeight = height - marginTop - marginBottom;

              const slotWidth = plotWidth / Math.max(kategori.length, 1);
              const barWidth = Math.min(64, slotWidth * 0.55);

              return (
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] w-full">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
                      {/* Horizontal Gridlines & Y-Axis Labels */}
                      {yTicks.map((tick, i) => {
                        const yPos = marginTop + plotHeight - (tick / maxVal) * plotHeight;
                        return (
                          <g key={i}>
                            <line
                              x1={marginLeft}
                              y1={yPos}
                              x2={marginLeft + plotWidth}
                              y2={yPos}
                              stroke={colors.grid}
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={marginLeft - 12}
                              y={yPos + 4}
                              textAnchor="end"
                              fontSize="11"
                              fontWeight="500"
                              fill={colors.text}
                            >
                              {tick}
                            </text>
                          </g>
                        );
                      })}

                      {/* Main Axis Lines */}
                      <line
                        x1={marginLeft}
                        y1={marginTop}
                        x2={marginLeft}
                        y2={marginTop + plotHeight}
                        stroke={colors.axis}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={marginLeft}
                        y1={marginTop + plotHeight}
                        x2={marginLeft + plotWidth}
                        y2={marginTop + plotHeight}
                        stroke={colors.axis}
                        strokeWidth="1.5"
                      />

                      {/* Bars */}
                      {kategori.map((kat, idx) => {
                        const val = nilai[idx] || 0;
                        const barHeight = Math.max(4, (val / maxVal) * plotHeight);
                        const x = marginLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
                        const y = marginTop + plotHeight - barHeight;
                        const color = barPalette[idx % barPalette.length];
                        const isHovered = hoveredBar?.label === kat;

                        return (
                          <g
                            key={kat}
                            className="cursor-pointer transition-opacity"
                            onMouseEnter={() => setHoveredBar({ label: kat, value: val })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* Bar with smooth rounded top corners */}
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              rx="6"
                              ry="6"
                              fill={color}
                              fillOpacity={isHovered ? 1 : 0.88}
                              stroke={color}
                              strokeWidth="1"
                            />

                            {/* Value label on top of bar */}
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="700"
                              fill={colors.textDark}
                            >
                              {val}
                            </text>

                            {/* Category label below X axis */}
                            <text
                              x={x + barWidth / 2}
                              y={marginTop + plotHeight + 22}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="600"
                              fill={colors.textDark}
                            >
                              {kat}
                            </text>
                            {labels[idx] && (
                              <text
                                x={x + barWidth / 2}
                                y={marginTop + plotHeight + 38}
                                textAnchor="middle"
                                fontSize="10"
                                fill={colors.text}
                              >
                                {labels[idx]}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Y-Axis Label */}
                      <text
                        transform={`rotate(-90)`}
                        x={-(marginTop + plotHeight / 2)}
                        y="18"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill={colors.text}
                      >
                        {label_y || "Rata-rata Nilai"}
                      </text>
                    </svg>
                  </div>

                  {/* Legend / Info Bar */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-medium">Sumbu X: {label_x || "Kelompok Observasi"}</span>
                    <span className="font-medium">Sumbu Y: {label_y || "Nilai Rata-rata"}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            2. HISTOGRAM STANDARD (DISTRIBUSI FREKUENSI)
           ========================================================================= */}
        {jenis_grafik === "histogram" && (
          <div className="w-full max-w-3xl mx-auto space-y-4">
            {(() => {
              const bins = data_grafik.bins || [];
              const rawMax = Math.max(...bins.map((b) => b.count), 1);
              const maxCount = Math.ceil(rawMax * 1.15);
              const mean = data_grafik.mean_marker;

              const width = 640;
              const height = 340;
              const marginLeft = 60;
              const marginRight = 30;
              const marginTop = 30;
              const marginBottom = 65;
              const plotWidth = width - marginLeft - marginRight;
              const plotHeight = height - marginTop - marginBottom;

              const yTicks = [0, Math.round(maxCount * 0.25), Math.round(maxCount * 0.5), Math.round(maxCount * 0.75), maxCount];
              const binWidth = plotWidth / Math.max(bins.length, 1);

              return (
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] w-full">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
                      {/* Horizontal Gridlines */}
                      {yTicks.map((tick, i) => {
                        const yPos = marginTop + plotHeight - (tick / maxCount) * plotHeight;
                        return (
                          <g key={i}>
                            <line
                              x1={marginLeft}
                              y1={yPos}
                              x2={marginLeft + plotWidth}
                              y2={yPos}
                              stroke={colors.grid}
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={marginLeft - 12}
                              y={yPos + 4}
                              textAnchor="end"
                              fontSize="11"
                              fontWeight="500"
                              fill={colors.text}
                            >
                              {tick}
                            </text>
                          </g>
                        );
                      })}

                      {/* Axis Lines */}
                      <line
                        x1={marginLeft}
                        y1={marginTop}
                        x2={marginLeft}
                        y2={marginTop + plotHeight}
                        stroke={colors.axis}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={marginLeft}
                        y1={marginTop + plotHeight}
                        x2={marginLeft + plotWidth}
                        y2={marginTop + plotHeight}
                        stroke={colors.axis}
                        strokeWidth="1.5"
                      />

                      {/* Histogram Bins */}
                      {bins.map((b, idx) => {
                        const barHeight = (b.count / maxCount) * plotHeight;
                        const x = marginLeft + idx * binWidth + 1.5;
                        const y = marginTop + plotHeight - barHeight;
                        const w = Math.max(3, binWidth - 3);

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={w}
                              height={barHeight}
                              rx="3"
                              ry="3"
                              fill={colors.primaryLight}
                              fillOpacity="0.85"
                              stroke={colors.primary}
                              strokeWidth="1"
                            />
                            {b.count > 0 && (
                              <text
                                x={x + w / 2}
                                y={y - 6}
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="700"
                                fill={colors.textDark}
                              >
                                {b.count}
                              </text>
                            )}
                            {/* Bin Range Label */}
                            <text
                              x={x + w / 2}
                              y={marginTop + plotHeight + 18}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="500"
                              fill={colors.text}
                            >
                              {b.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Mean Marker Line (Garis Rata-rata) */}
                      {mean !== undefined && bins.length > 0 && (() => {
                        const minVal = bins[0].min;
                        const maxVal = bins[bins.length - 1].max;
                        const range = maxVal - minVal || 1;
                        const meanX = marginLeft + ((mean - minVal) / range) * plotWidth;

                        return (
                          <g>
                            <line
                              x1={meanX}
                              y1={marginTop}
                              x2={meanX}
                              y2={marginTop + plotHeight}
                              stroke={colors.meanLine}
                              strokeWidth="2"
                              strokeDasharray="5 3"
                            />
                            <rect
                              x={meanX - 35}
                              y={marginTop - 22}
                              width="70"
                              height="18"
                              rx="4"
                              fill="#FEF2F2"
                              stroke={colors.meanLine}
                              strokeWidth="1"
                            />
                            <text
                              x={meanX}
                              y={marginTop - 10}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="700"
                              fill={colors.meanLine}
                            >
                              Mean: {mean}
                            </text>
                          </g>
                        );
                      })()}

                      {/* Y-Axis Title */}
                      <text
                        transform={`rotate(-90)`}
                        x={-(marginTop + plotHeight / 2)}
                        y="18"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill={colors.text}
                      >
                        {label_y || "Frekuensi (Jumlah)"}
                      </text>
                    </svg>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-medium">Sumbu X: {label_x || "Interval Nilai"}</span>
                    <span className="font-medium">Sumbu Y: {label_y || "Frekuensi"}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            3. SCATTER PLOT STANDARD (DIAGRAM TEBAR BULAT & GARIS TREN)
           ========================================================================= */}
        {jenis_grafik === "scatter" && (
          <div className="w-full max-w-3xl mx-auto space-y-4">
            {(() => {
              const points = data_grafik.points || [];
              if (points.length === 0) {
                return <div className="text-sm text-slate-500 py-8 text-center">Titik data belum tersedia.</div>;
              }

              const xs = points.map((p) => p.x);
              const ys = points.map((p) => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              // Standard dimensions
              const width = 640;
              const height = 360;
              const marginLeft = 60;
              const marginRight = 30;
              const marginTop = 30;
              const marginBottom = 60;
              const plotWidth = width - marginLeft - marginRight;
              const plotHeight = height - marginTop - marginBottom;

              // Generous padding so dots on the boundary don't get clipped
              const spanX = maxX - minX || 1;
              const spanY = maxY - minY || 1;
              const padX = spanX * 0.05;
              const padY = spanY * 0.05;

              const domainMinX = Math.floor(minX - padX);
              const domainMaxX = Math.ceil(maxX + padX);
              const domainMinY = Math.floor(minY - padY);
              const domainMaxY = Math.ceil(maxY + padY);

              const rangeX = domainMaxX - domainMinX;
              const rangeY = domainMaxY - domainMinY;

              const mapX = (xVal: number) => marginLeft + ((xVal - domainMinX) / rangeX) * plotWidth;
              const mapY = (yVal: number) => marginTop + plotHeight - ((yVal - domainMinY) / rangeY) * plotHeight;

              // 5 Clean Ticks for X and Y
              const xTicks = Array.from({ length: 6 }, (_, i) =>
                Math.round(domainMinX + (i / 5) * rangeX)
              );
              const yTicks = Array.from({ length: 6 }, (_, i) =>
                Math.round(domainMinY + (i / 5) * rangeY)
              );

              const line = data_grafik.line;
              const lineStart = line ? { x: mapX(line.x1), y: mapY(line.y1) } : null;
              const lineEnd = line ? { x: mapX(line.x2), y: mapY(line.y2) } : null;

              // Dynamic dot radius based on point density
              const dotRadius = points.length > 250 ? 3.5 : points.length > 100 ? 4.5 : 5.5;

              return (
                <div className="space-y-4">
                  {/* Clean Legend Header */}
                  <div className="flex flex-wrap items-center justify-end gap-5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500 border border-white shadow-sm inline-block" />
                      <span className="font-medium text-slate-700">Titik Observasi ({points.length} data)</span>
                    </div>
                    {line && (
                      <div className="flex items-center gap-2">
                        <span className="h-0.5 w-5 bg-red-500 inline-block" />
                        <span className="font-medium text-slate-700">Garis Tren Linear</span>
                      </div>
                    )}
                  </div>

                  {/* SVG Chart */}
                  <div className="relative aspect-[16/9] w-full bg-white rounded-xl">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
                      {/* Horizontal Gridlines & Y-Axis Numeric Ticks */}
                      {yTicks.map((tick, i) => {
                        const yPos = mapY(tick);
                        return (
                          <g key={`y-${i}`}>
                            <line
                              x1={marginLeft}
                              y1={yPos}
                              x2={marginLeft + plotWidth}
                              y2={yPos}
                              stroke={colors.grid}
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={marginLeft - 12}
                              y={yPos + 4}
                              textAnchor="end"
                              fontSize="11"
                              fontWeight="500"
                              fill={colors.text}
                            >
                              {tick}
                            </text>
                          </g>
                        );
                      })}

                      {/* Vertical Gridlines & X-Axis Numeric Ticks */}
                      {xTicks.map((tick, i) => {
                        const xPos = mapX(tick);
                        return (
                          <g key={`x-${i}`}>
                            <line
                              x1={xPos}
                              y1={marginTop}
                              x2={xPos}
                              y2={marginTop + plotHeight}
                              stroke={colors.gridLight}
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={xPos}
                              y={marginTop + plotHeight + 20}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="500"
                              fill={colors.text}
                            >
                              {tick}
                            </text>
                          </g>
                        );
                      })}

                      {/* Standard Coordinate Axes */}
                      <line
                        x1={marginLeft}
                        y1={marginTop}
                        x2={marginLeft}
                        y2={marginTop + plotHeight}
                        stroke={colors.axis}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={marginLeft}
                        y1={marginTop + plotHeight}
                        x2={marginLeft + plotWidth}
                        y2={marginTop + plotHeight}
                        stroke={colors.axis}
                        strokeWidth="1.5"
                      />

                      {/* Regression / Trend Line */}
                      {lineStart && lineEnd && (
                        <line
                          x1={lineStart.x}
                          y1={lineStart.y}
                          x2={lineEnd.x}
                          y2={lineEnd.y}
                          stroke={colors.trendline}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Data Points (CIRCLES with professional opacity for density) */}
                      {points.map((pt, idx) => {
                        const cx = mapX(pt.x);
                        const cy = mapY(pt.y);
                        const isHovered = hoveredPoint?.x === pt.x && hoveredPoint?.y === pt.y;

                        return (
                          <circle
                            key={idx}
                            cx={cx}
                            cy={cy}
                            r={isHovered ? dotRadius + 2.5 : dotRadius}
                            fill={isHovered ? "#1D4ED8" : colors.primary}
                            fillOpacity={isHovered ? 1 : 0.65}
                            stroke="#FFFFFF"
                            strokeWidth={isHovered ? 2 : 1}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            <title>
                              {pt.label ? `${pt.label}: ` : ""}({pt.x}, {pt.y})
                            </title>
                          </circle>
                        );
                      })}

                      {/* X-Axis Title */}
                      <text
                        x={marginLeft + plotWidth / 2}
                        y={height - 12}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill={colors.textDark}
                      >
                        {label_x || "Variabel X"}
                      </text>

                      {/* Y-Axis Title */}
                      <text
                        transform={`rotate(-90)`}
                        x={-(marginTop + plotHeight / 2)}
                        y="18"
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill={colors.textDark}
                      >
                        {label_y || "Variabel Y"}
                      </text>
                    </svg>
                  </div>

                  {/* Active Tooltip / Hover Banner */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-600 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      {hoveredPoint ? (
                        <span>
                          Observasi Dipilih: <strong className="text-slate-850">{label_x || "X"}: {hoveredPoint.x}</strong> | <strong className="text-slate-850">{label_y || "Y"}: {hoveredPoint.y}</strong>
                          {hoveredPoint.label ? ` (${hoveredPoint.label})` : ""}
                        </span>
                      ) : (
                        <span>Arahkan kursor ke titik data untuk melihat nilai koordinat secara presisi.</span>
                      )}
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      Rentang: [{minX} s.d. {maxX}] × [{minY} s.d. {maxY}]
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
