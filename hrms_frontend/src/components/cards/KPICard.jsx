import { motion } from "framer-motion";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";

const THEMES = {
  blue: {
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-800/30",
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-600/40",
    badge: "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/50",
    bar: "bg-blue-600",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-600/40",
    badge: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50",
    bar: "bg-emerald-600",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-800/30",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-600/40",
    badge: "bg-rose-50/80 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50",
    bar: "bg-rose-500",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-800/30",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-600/40",
    badge: "bg-amber-50/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50",
    bar: "bg-amber-500",
  },
  violet: {
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border-violet-100 dark:border-violet-800/30",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-600/40",
    badge: "bg-violet-50/80 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200/50",
    bar: "bg-violet-500",
  },
  indigo: {
    iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30",
    hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-600/40",
    badge: "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/50",
    bar: "bg-indigo-600",
  },
  teal: {
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-100 dark:border-teal-800/30",
    hoverBorder: "hover:border-teal-300 dark:hover:border-teal-600/40",
    badge: "bg-teal-50/80 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200/50",
    bar: "bg-teal-600",
  },
  orange: {
    iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border-orange-100 dark:border-orange-800/30",
    hoverBorder: "hover:border-orange-300 dark:hover:border-orange-600/40",
    badge: "bg-orange-50/80 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200/50",
    bar: "bg-orange-500",
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] ${theme.hoverBorder} transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between`}
    >
      {/* Top Header: Title & Dual-Tone Icon */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-normal lowercase">
            {title}
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              {value}
            </span>
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${theme.iconBg} shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0`}
        >
          {icon}
        </div>
      </div>

      {/* Bottom Section: Trend Badge, Subtitle & Optional Progress */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between gap-2 min-h-[22px]">
          {trend ? (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border lowercase ${
                trendType === "down"
                  ? "bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                  : trendType === "neutral"
                  ? "bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
              }`}
            >
              {trendType === "down" ? (
                <MdTrendingDown className="text-xs shrink-0" />
              ) : trendType === "neutral" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              ) : (
                <MdTrendingUp className="text-xs shrink-0" />
              )}
              <span className="truncate">{trend}</span>
            </div>
          ) : (
            <div />
          )}

          {subtitle && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-medium lowercase">
              {subtitle}
            </span>
          )}
        </div>

        {typeof progress === "number" && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
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
