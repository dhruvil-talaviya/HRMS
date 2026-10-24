import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

// Modern custom dark glass tooltips
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/60 shadow-2xl text-xs z-50">
        <p className="font-semibold text-slate-300 mb-1">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 font-bold">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: item.color || "#3b82f6" }}
            />
            <span className="text-slate-300 font-medium">{item.name}:</span>
            <span className="text-white font-mono">
              {prefix}
              {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AreaChartComponent = ({
  data = [],
  xKey = "name",
  yKey = "value",
  color = "#2563EB",
  suffix = "%",
  prefix = "",
  unit = "%",
  domain = [0, 100],
  height = 290,
  name = "Rate",
}) => {
  const gradientId = `grad-${xKey}-${yKey}-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.7} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke="#94a3b8"
          fontSize={12}
          fontWeight={500}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          dy={6}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={11}
          fontWeight={500}
          tickLine={false}
          axisLine={false}
          domain={domain}
          unit={unit}
          tickFormatter={(v) =>
            prefix
              ? `${prefix}${typeof v === "number" && Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
              : `${v}${unit}`
          }
        />
        <Tooltip content={<CustomTooltip prefix={prefix} suffix={suffix} />} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2.5}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 5, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
          name={name}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const BarChartComponent = ({
  data = [],
  xKey = "name",
  yKey = "value",
  color = "#10B981",
  label = "Count",
}) => {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.7} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke="#94a3b8"
          fontSize={12}
          fontWeight={500}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          dy={6}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={11}
          fontWeight={500}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey={yKey}
          fill={color}
          radius={[6, 6, 0, 0]}
          maxBarSize={36}
          name={label}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const PieChartComponent = ({ data = [], nameKey = "name", valueKey = "value" }) => {
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

  return (
    <ResponsiveContainer width="100%" height={290}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={4}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

