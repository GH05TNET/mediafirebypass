import React from "react";

interface ThreeDButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "cyan" | "green" | "purple" | "danger" | "amber";
  glowing?: boolean;
  children: React.ReactNode;
}

export const ThreeDButton: React.FC<ThreeDButtonProps> = ({
  variant = "primary",
  glowing = false,
  children,
  className = "",
  ...props
}) => {
  // Styles for different colors
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 to-blue-600 border-indigo-700 hover:brightness-110 text-white shadow-indigo-500/20 border-t border-white/20",
    cyan: "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-700 hover:brightness-110 text-white shadow-cyan-400/30 border-t border-white/25",
    green: "bg-gradient-to-r from-emerald-400 to-teal-600 border-emerald-600 hover:brightness-110 text-slate-950 shadow-emerald-500/20 border-t border-white/30",
    purple: "bg-gradient-to-r from-purple-500 to-indigo-600 border-purple-700 hover:brightness-110 text-white shadow-purple-500/20 border-t border-white/20",
    danger: "bg-gradient-to-r from-rose-500 to-red-650 border-rose-700 hover:brightness-110 text-white shadow-rose-500/20 border-t border-white/20",
    amber: "bg-gradient-to-r from-amber-400 to-orange-550 border-amber-600 hover:brightness-110 text-slate-950 shadow-amber-500/20 border-t border-white/30",
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold tracking-wider uppercase rounded-xl
        border-b-4 border-r border-t-0 border-l-0
        transition-all duration-150 ease-out active:border-b-0 active:border-r-0 active:translate-y-[4px] active:translate-x-[1px]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]}
        ${glowing ? "shadow-[0_0_20px_rgba(var(--glow-color),0.35)]" : ""}
        ${className}
      `}
      style={{
        // Set up variables for glowing shadow support
        "--glow-color": variant === "primary" ? "59,130,246" : variant === "cyan" ? "6,182,212" : variant === "green" ? "16,185,129" : "139,92,246"
      } as React.CSSProperties}
      {...props}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
