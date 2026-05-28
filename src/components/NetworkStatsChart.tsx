import React from "react";

interface DataPoint {
  time: string;
  speed: number;
}

interface NetworkStatsChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export const NetworkStatsChart: React.FC<NetworkStatsChartProps> = ({
  data,
  color = "#3b82f6", // Default is Tailwind Indigo/Blue
  height = 140,
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 bg-slate-900/60 rounded-xl border border-slate-800 border-dashed text-slate-500 font-mono text-xs">
        No Telemetry Packets Active
      </div>
    );
  }

  // Find max speed value to scale the Y axis
  const maxSpeed = Math.max(...data.map((d) => d.speed), 10); // at least scale to 10 MB/s
  const chartWidth = 500;
  const paddingX = 20;
  const paddingY = 15;

  // Map speed data to SVG points
  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = height - paddingY - (d.speed / maxSpeed) * (height - paddingY * 2);
    return { x, y };
  });

  // Assemble path instructions
  const pathString = points.reduce(
    (acc, p, index) => (index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );

  // Path for the filled gradient area under the curve
  const areaPathString = points.length > 0
    ? `${pathString} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="w-full bg-slate-950/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-md shadow-inner">
      {/* Dynamic light emission background */}
      <div 
        className="absolute w-32 h-32 blur-[60px] opacity-10 rounded-full -top-10 -right-10 select-none pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
          LIVE ACCELERATION CHART
        </span>
        <span className="text-xs font-mono font-semibold text-slate-400">
          Peak: <span className="text-amber-400 font-bold">{maxSpeed.toFixed(1)} MB/s</span>
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full overflow-visible drop-shadow-[0_0_8px_rgba(59,130,246,0.15)]"
          preserveAspectRatio="none"
          style={{ height: `${height}px` }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor={color} />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={paddingX} y1={height / 2} x2={chartWidth - paddingX} y2={height / 2} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={paddingX} y1={height - paddingY} x2={chartWidth - paddingX} y2={height - paddingY} stroke="#334155" />

          {/* Draw filled area under path */}
          {areaPathString && (
            <path d={areaPathString} fill="url(#chartGradient)" />
          )}

          {/* Draw main speed trend line */}
          {pathString && (
            <path
              d={pathString}
              fill="none"
              stroke="url(#lineGlow)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points pulsing node (the last element) */}
          {points.length > 0 && (
            <>
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="6"
                fill={color}
                className="animate-pulse"
              />
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="3"
                fill="#ffffff"
              />
            </>
          )}
        </svg>
      </div>

      <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-slate-500">
        <span>T - 10 Sec</span>
        <span>T - 5 Sec</span>
        <span>Current Speed ({data[data.length - 1]?.speed.toFixed(1) || 0} MB/s)</span>
      </div>
    </div>
  );
};
