import { motion } from "framer-motion";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";

const THEMES = {
  blue: {
    accentBar: "before:bg-blue-500",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40",
    hoverBorder: "hover:border-blue-400/50 dark:hover:border-blue-600/50",
    gradient: "from-blue-500/[0.04] to-transparent",
    bar: "bg-blue-600",
    glow: "group-hover:shadow-blue-500/10",
  },
  emerald: {
    accentBar: "before:bg-emerald-500",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
    hoverBorder: "hover:border-emerald-400/50 dark:hover:border-emerald-600/50",
    gradient: "from-emerald-500/[0.04] to-transparent",
    bar: "bg-emerald-600",
    glow: "group-hover:shadow-emerald-500/10",
  },
  rose: {
    accentBar: "before:bg-rose-500",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40",
    hoverBorder: "hover:border-rose-400/50 dark:hover:border-rose-600/50",
    gradient: "from-rose-500/[0.04] to-transparent",
    bar: "bg-rose-500",
    glow: "group-hover:shadow-rose-500/10",
  },
  amber: {
    accentBar: "before:bg-amber-500",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
    hoverBorder: "hover:border-amber-400/50 dark:hover:border-amber-600/50",
    gradient: "from-amber-500/[0.04] to-transparent",
    bar: "bg-amber-500",
    glow: "group-hover:shadow-amber-500/10",
  },
  violet: {
    accentBar: "before:bg-violet-500",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40",
    hoverBorder: "hover:border-violet-400/50 dark:hover:border-violet-600/50",
    gradient: "from-violet-500/[0.04] to-transparent",
    bar: "bg-violet-500",
    glow: "group-hover:shadow-violet-500/10",
  },
  indigo: {
    accentBar: "before:bg-indigo-500",
    iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40",
    hoverBorder: "hover:border-indigo-400/50 dark:hover:border-indigo-600/50",
    gradient: "from-indigo-500/[0.04] to-transparent",
    bar: "bg-indigo-600",
    glow: "group-hover:shadow-indigo-500/10",
  },
  teal: {
    accentBar: "before:bg-teal-500",
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/40",
    hoverBorder: "hover:border-teal-400/50 dark:hover:border-teal-600/50",
    gradient: "from-teal-500/[0.04] to-transparent",
    bar: "bg-teal-600",
    glow: "group-hover:shadow-teal-500/10",
  },
  orange: {
    accentBar: "before:bg-orange-500",
    iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/40",
    hoverBorder: "hover:border-orange-400/50 dark:hover:border-orange-600/50",
    gradient: "from-orange-500/[0.04] to-transparent",
    bar: "bg-orange-500",
    glow: "group-hover:shadow-orange-500/10",
  },
};

const KPICard = ({
  title,
  value,
  icon,
  trend,
  trendType = "up",
  color = "blue",
  subtitle,
  progress,
  onClick,
}) => {
  const theme = THEMES[color] || THEMES.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] ${theme.hoverBorder} ${theme.glow} transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-2xl ${theme.accentBar}`}
    >
      {/* Subtle Ambient Hover Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Top Header: Title & Dual-Tone Icon */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {value}
            </span>
          </div>
        </div>

        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl border ${theme.iconBg} shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0`}
        >
          {icon}
        </div>
      </div>

      {/* Bottom Section: Trend Badge, Subtitle & Optional Progress */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between gap-2 min-h-[22px]">
          {trend ? (
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${
                trendType === "down"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40"
                  : trendType === "neutral"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
              }`}
            >
              {trendType === "down" ? (
                <MdTrendingDown className="text-xs sm:text-sm shrink-0" />
              ) : trendType === "neutral" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              ) : (
                <MdTrendingUp className="text-xs sm:text-sm shrink-0" />
              )}
              <span className="truncate">{trend}</span>
            </div>
          ) : (
            <div />
          )}

          {subtitle && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate font-medium">
              {subtitle}
            </span>
          )}
        </div>

        {typeof progress === "number" && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full ${theme.bar} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KPICard;

