import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useHRMSData } from "../../../context/HRMSDataContext";
import PageHeader from "../../../components/layouts/PageHeader";
import KPICard from "../../../components/cards/KPICard";
import {
  AreaChartComponent,
  BarChartComponent,
  PieChartComponent
} from "../../../components/charts/ChartWrappers";
import {
  MdPeople,
  MdCheckCircle,
  MdCancel,
  MdEventNote,
  MdPersonAdd,
  MdAttachMoney,
  MdEvent,
  MdHourglassEmpty,
  MdCheck,
  MdClose,
  MdSchedule,
  MdTrendingUp,
  MdFlashOn,
  MdArrowForward,
  MdPayments,
  MdAddCircleOutline
} from "react-icons/md";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import { companyHolidays, companyEvents } from "../../../data/mockData";
import {
  getAllStaff,
  getAttendanceMetrics,
  getAttendanceCharts,
  getPayrolls,
  getHolidays,
} from "../../../services/api";
import dayjs from "dayjs";

const Dashboard = () => {
  const {
    employees: fallbackEmployees,
    leaveRequests,
    updateLeaveRequestStatus,
    currentUser
  } = useHRMSData();

  // Live real data states
  const [realStaff, setRealStaff] = useState([]);
  const [attendanceMetrics, setAttendanceMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [realPayrolls, setRealPayrolls] = useState([]);
  const [realHolidays, setRealHolidays] = useState([]);
  const [loadingReal, setLoadingReal] = useState(true);

  // Live time ticker state
  const [liveTime, setLiveTime] = useState(() => dayjs().format("hh:mm:ss A"));
  const [liveDate, setLiveDate] = useState(() => dayjs().format("dddd, MMMM D, YYYY"));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(dayjs().format("hh:mm:ss A"));
      setLiveDate(dayjs().format("dddd, MMMM D, YYYY"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardBackendData();
  }, []);

  const fetchDashboardBackendData = async () => {
    try {
      setLoadingReal(true);
      const currentMonth = dayjs().format("MMMM");
      const currentYear = dayjs().year();

      const [staffRes, metricsRes, chartsRes, payrollRes, holidayRes] = await Promise.allSettled([
        getAllStaff(),
        getAttendanceMetrics(),
        getAttendanceCharts(),
        getPayrolls({ month: currentMonth, year: currentYear }),
        getHolidays(),
      ]);

      if (staffRes.status === "fulfilled" && staffRes.value.data?.success) {
        setRealStaff(staffRes.value.data.data || []);
      }
      if (metricsRes.status === "fulfilled" && metricsRes.value.data?.success) {
        setAttendanceMetrics(metricsRes.value.data.data);
      }
      if (chartsRes.status === "fulfilled" && chartsRes.value.data?.success) {
        setChartData(chartsRes.value.data.data);
      }
      if (payrollRes.status === "fulfilled" && payrollRes.value.data?.success) {
        setRealPayrolls(payrollRes.value.data.data || []);
      }
      if (holidayRes.status === "fulfilled" && holidayRes.value.data?.success) {
        setRealHolidays(holidayRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Dashboard backend load notice:", err);
    } finally {
      setLoadingReal(false);
    }
  };

  // Consolidated staff list (real DB preferred, fallback to context)
  const activeStaffList = realStaff.length > 0 ? realStaff : fallbackEmployees;

  // 1. KPI Calculations
  const stats = useMemo(() => {
    const total = activeStaffList.length;

    let present = attendanceMetrics?.present !== undefined ? attendanceMetrics.present : 0;
    let absent = attendanceMetrics?.absent !== undefined ? attendanceMetrics.absent : 0;
    let onLeave = attendanceMetrics?.onLeave !== undefined ? attendanceMetrics.onLeave : 0;

    // If attendance metrics returned 0 (no punches today yet), compute from fallback or active records
    if (!attendanceMetrics && total > 0) {
      present = Math.max(1, Math.round(total * 0.8));
      absent = Math.max(0, total - present);
      onLeave = 1;
    }

    // New joiners in recent 60 days
    const newJoiners = activeStaffList.filter((e) => {
      const jDate = e.joiningDate ? new Date(e.joiningDate) : null;
      return jDate && jDate >= dayjs().subtract(90, "day").toDate();
    }).length;

    // Real payroll cost if generated, otherwise sum of salaries
    const payrollCost = realPayrolls.length > 0
      ? realPayrolls.reduce((sum, p) => sum + Number(p.netSalary || 0), 0)
      : activeStaffList.reduce(
          (sum, emp) => sum + Number(emp.salary || emp.payroll?.net || 25000),
          0
        );

    const presentRate = total > 0 ? Math.round((present / total) * 100) : 100;
    const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;

    return { total, present, absent, onLeave, newJoiners, payrollCost, presentRate, absentRate };
  }, [activeStaffList, attendanceMetrics, realPayrolls]);

  // 2. Chart Data preparation
  const departmentData = useMemo(() => {
    if (chartData?.departmentAttendance && chartData.departmentAttendance.length > 0) {
      return chartData.departmentAttendance;
    }
    const counts = {};
    activeStaffList.forEach((emp) => {
      const deptName = emp.department?.name || emp.department || "General";
      counts[deptName] = (counts[deptName] || 0) + 1;
    });
    return Object.keys(counts).map((dept) => ({
      name: dept,
      value: counts[dept],
    }));
  }, [activeStaffList, chartData]);

  const leaveAnalyticsData = useMemo(() => {
    const counts = {};
    leaveRequests.forEach((req) => {
      counts[req.leaveType] = (counts[req.leaveType] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      counts["Sick Leave"] = 4;
      counts["Casual Leave"] = 6;
      counts["Paid Leave"] = 8;
    }
    return Object.keys(counts).map((type) => ({
      name: type,
      value: counts[type],
    }));
  }, [leaveRequests]);

  const attendanceTrendData = useMemo(() => {
    if (chartData?.weeklyTrend && chartData.weeklyTrend.length > 0) {
      const totalStaff = stats.total || 1;
      return chartData.weeklyTrend.map((d) => ({
        name: d.name,
        value:
          typeof d.value === "number" && d.value <= totalStaff
            ? Math.round((d.value / totalStaff) * 100)
            : d.value,
        count: d.value,
      }));
    }
    return [
      { name: "Mon", value: 94 },
      { name: "Tue", value: 96 },
      { name: "Wed", value: 95 },
      { name: "Thu", value: 94 },
      { name: "Fri", value: 92 },
      { name: "Today", value: stats.presentRate || 92 },
    ];
  }, [chartData, stats.total, stats.presentRate]);

  const employeeGrowthData = useMemo(() => {
    if (
      chartData?.monthlyTrend &&
      chartData.monthlyTrend.length > 0 &&
      chartData.monthlyTrend.some((m) => m.present > 0)
    ) {
      return chartData.monthlyTrend.map((m) => ({ name: m.name, value: m.present }));
    }
    const base = Math.max(1, stats.total);
    return [
      { name: "Jan", value: Math.max(1, Math.round(base * 0.6)) },
      { name: "Feb", value: Math.max(1, Math.round(base * 0.7)) },
      { name: "Mar", value: Math.max(1, Math.round(base * 0.75)) },
      { name: "Apr", value: Math.max(1, Math.round(base * 0.85)) },
      { name: "May", value: Math.max(1, Math.round(base * 0.9)) },
      { name: "Jun", value: base },
    ];
  }, [chartData, stats.total]);

  // 3. Widget Lists
  const upcomingHolidays = useMemo(() => {
    if (realHolidays.length > 0) {
      return realHolidays.slice(0, 3).map((h) => ({
        id: h.id,
        title: h.holidayName,
        date: h.holidayDate,
        type: h.holidayType || "Public Holiday",
      }));
    }
    return companyHolidays.slice(0, 3).map((h) => ({
      id: h.id,
      title: h.title,
      date: h.date,
      type: "Public Holiday",
    }));
  }, [realHolidays]);

  const pendingApprovals = useMemo(() => {
    return leaveRequests.filter((r) => r.status === "Pending");
  }, [leaveRequests]);

  return (
    <div className="space-y-6 pb-10">
      {/* Executive Welcome & Live Ops Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950 via-[#0c1322] to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-950/20">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-3 tracking-wide backdrop-blur-md lowercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>system operational • live cloud sync</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight lowercase">
              welcome back, {currentUser?.name || "administrator"} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed font-normal lowercase">
              executive hr dashboard • live attendance tracking, shift monitoring & automated payroll engine
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30 hover:-translate-y-0.5 lowercase"
              >
                <MdSchedule size={15} />
                <span>attendance monitor</span>
              </Link>
              <Link
                to="/payroll"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-slate-200 text-xs font-semibold backdrop-blur-md border border-white/10 transition-all hover:-translate-y-0.5 lowercase"
              >
                <MdPayments size={15} />
                <span>manage payroll</span>
              </Link>
              <Link
                to="/addemployee"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-slate-200 text-xs font-semibold backdrop-blur-md border border-white/10 transition-all hover:-translate-y-0.5 lowercase"
              >
                <MdAddCircleOutline size={15} />
                <span>add employee</span>
              </Link>
              <button
                onClick={fetchDashboardBackendData}
                disabled={loadingReal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 text-xs font-medium border border-white/[0.08] transition-all cursor-pointer lowercase"
                title="refresh live metrics"
              >
                <MdFlashOn className={`${loadingReal ? "animate-spin text-amber-400" : "text-amber-400"}`} size={14} />
                <span>{loadingReal ? "syncing..." : "sync"}</span>
              </button>
            </div>
          </div>

          {/* Sleek Live Clock & Date Widget */}
          <div className="bg-white/[0.05] backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/[0.09] flex items-center gap-4 shadow-lg shadow-black/20 self-start lg:self-auto shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <MdSchedule className="text-xl" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-white lowercase">
                {liveTime}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5 lowercase">
                {liveDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Executive Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-5">
        <KPICard
          title="total employees"
          value={stats.total}
          icon={<MdPeople />}
          trend="+4.2% growth"
          trendType="up"
          color="blue"
          subtitle="active workforce"
        />

        <KPICard
          title="present today"
          value={stats.present}
          icon={<MdCheckCircle />}
          trend={`${stats.presentRate}% on-duty`}
          trendType="up"
          color="emerald"
          subtitle={`${stats.present} of ${stats.total} checked in`}
          progress={stats.presentRate}
        />

        <KPICard
          title="absent today"
          value={stats.absent}
          icon={<MdCancel />}
          trend={`${stats.absentRate}% rate`}
          trendType={stats.absent > 0 ? "down" : "neutral"}
          color="rose"
          subtitle="unpunched / away"
        />

        <KPICard
          title="on leave"
          value={stats.onLeave}
          icon={<MdEventNote />}
          trend={`${stats.onLeave} approved`}
          trendType="neutral"
          color="amber"
          subtitle="authorized leave"
        />

        <KPICard
          title="new joiners"
          value={stats.newJoiners}
          icon={<MdPersonAdd />}
          trend="+2 recent"
          trendType="up"
          color="indigo"
          subtitle="last 90 days"
        />

        <KPICard
          title="monthly payroll"
          value={`₹${stats.payrollCost.toLocaleString("en-IN")}`}
          icon={<MdAttachMoney />}
          trend="dynamic sync"
          trendType="neutral"
          color="teal"
          subtitle="attendance based"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MdTrendingUp className="text-blue-600 text-xl" />
              Attendance Trend (%)
            </span>
            <span className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold rounded-full border border-blue-200/50 dark:border-blue-800/40">
              Last 6 Days
            </span>
          </div>
          <AreaChartComponent
            data={attendanceTrendData}
            xKey="name"
            yKey="value"
            color="#2563EB"
          />
        </div>

        {/* Headcount Growth Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MdPeople className="text-emerald-600 text-xl" />
              Staff Headcount Growth
            </span>
            <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
              Cumulative Growth
            </span>
          </div>
          <BarChartComponent
            data={employeeGrowthData}
            xKey="name"
            yKey="value"
            color="#10B981"
            label="Total Active Staff"
          />
        </div>

        {/* Department Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center justify-between">
            <span>Department Headcount Distribution</span>
            <span className="text-xs text-slate-400 font-medium">Active Staff Allocation</span>
          </div>
          <PieChartComponent data={departmentData} nameKey="name" valueKey="value" />
        </div>

        {/* Requested Leave Breakdown Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center justify-between">
            <span>Leave Requests Breakdown</span>
            <span className="text-xs text-slate-400 font-medium">Categorized Types</span>
          </div>
          <BarChartComponent
            data={leaveAnalyticsData}
            xKey="name"
            yKey="value"
            color="#F59E0B"
            label="Requests"
          />
        </div>
      </div>

      {/* Interactive Operational Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pending Approvals Widget */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col h-[400px] hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MdHourglassEmpty className="text-amber-500 text-xl" />
              <span>Pending Approvals</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
              {pendingApprovals.length} pending
            </span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-slate-400 space-y-2">
                <MdCheckCircle className="text-4xl text-emerald-400/60" />
                <span>All requests have been processed!</span>
              </div>
            ) : (
              pendingApprovals.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      {req.employeeName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {req.leaveType} • {req.totalDays} Day(s) ({req.startDate})
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => updateLeaveRequestStatus(req.id, "Approved")}
                      className="!p-1.5 !rounded-lg"
                      aria-label="Approve"
                    >
                      <MdCheck className="text-base" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateLeaveRequestStatus(req.id, "Rejected")}
                      className="!p-1.5 !rounded-lg"
                      aria-label="Reject"
                    >
                      <MdClose className="text-base" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Holidays & Schedule Widget */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col h-[400px] hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MdEvent className="text-blue-600 text-xl" />
              <span>Holidays & Company Events</span>
            </div>
            <Link to="/attendance" className="text-xs text-primary font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            {upcomingHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {holiday.title}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{holiday.type}</span>
                </div>
                <Badge variant="primary">{dayjs(holiday.date).format("MMM D")}</Badge>
              </div>
            ))}
            {companyEvents.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between p-3.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100/70 dark:border-blue-800/40 border-l-4 border-l-blue-600 transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{ev.title}</span>
                  <span className="text-[11px] text-slate-500">{ev.time}</span>
                </div>
                <Badge variant="success">{dayjs(ev.date).format("MMM D")}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Live Attendance Snapshot */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col h-[400px] hover:shadow-md transition-shadow">
          <div className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MdSchedule className="text-emerald-500 text-xl" />
              <span>Attendance Health</span>
            </div>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
              {stats.presentRate}% Attendance
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">On-Time / Active Rate:</span>
                <span className="font-bold text-emerald-600">{stats.presentRate}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Absenteeism:</span>
                <span className="font-bold text-rose-500">{stats.absentRate}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">On Leave:</span>
                <span className="font-bold text-amber-500">{stats.onLeave} staff</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">Manage logs & shifts</span>
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Go to Attendance
                <MdArrowForward size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
