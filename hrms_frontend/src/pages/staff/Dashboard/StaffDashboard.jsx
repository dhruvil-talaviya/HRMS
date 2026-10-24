import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import PageHeader from "../../../components/layouts/PageHeader";
import KPICard from "../../../components/cards/KPICard";
import { BarChartComponent, PieChartComponent } from "../../../components/charts/ChartWrappers";
import Badge from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import {
  MdCalendarToday,
  MdEventBusy,
  MdStarBorder,
  MdSchedule,
  MdEvent,
  MdCheckCircle,
  MdCancel,
  MdLogin,
  MdLogout,
  MdFreeBreakfast,
  MdPlayArrow,
  MdNotifications,
  MdInfo,
  MdWarning,
  MdRefresh,
  MdKeyboardArrowUp,
  MdClose,
  MdCloudUpload
} from "react-icons/md";
import {
  getStaffAttendanceDashboard,
  clockIn as apiClockIn,
  clockOut as apiClockOut,
  breakIn as apiBreakIn,
  breakOut as apiBreakOut,
  getLeave,
  getMyProfile,
  getHolidays,
  getAttendanceHistory,
  getMyAttendanceRequests,
  createMyAttendanceRequest,
} from "../../../services/api";

const BREAK_LIMIT_MINS = 60; // 60 minutes break limit

const fmtTime = (d) => (d ? dayjs(d).format("hh:mm A") : "—");

const fmtDuration = (ms) => {
  if (!ms || ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const StaffDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [profile, setProfile] = useState(null);
  const [allHolidays, setAllHolidays] = useState([]);
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [eligibleCorrection, setEligibleCorrection] = useState(null);
  const [showCorrectionFormInline, setShowCorrectionFormInline] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    clockIn: "",
    clockOut: "",
    reason: ""
  });
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef(null);

  // Bottom Sheet Mobile toggle
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Clock Out Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [charCount, setCharCount] = useState(0);

  const today = dashboard?.today || null;
  const shift = dashboard?.shift || null;
  const monthly = dashboard?.monthly || {
    present: 0, late: 0, halfDay: 0, absent: 0, leave: 0, wfh: 0, workedHours: 0,
  };
  const weekly = dashboard?.weekly || [];

  const openBreak = useMemo(() => (today?.breaks || []).find((b) => !b.end), [today]);

  const clockState = useMemo(() => {
    if (!today || !today.clockIn) return "idle";
    if (today.clockOut) return "clocked_out";
    if (openBreak) return "on_break";
    return "clocked_in";
  }, [today, openBreak]);

  // Live ticking only when attendance is active
  useEffect(() => {
    if (clockState === "clocked_in" || clockState === "on_break") {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(tickRef.current);
    }
    clearInterval(tickRef.current);
  }, [clockState]);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await Promise.allSettled([
        getStaffAttendanceDashboard(),
        getLeave(),
        getMyProfile(),
        getHolidays(),
        getAttendanceHistory(),
        getMyAttendanceRequests()
      ]);

      const [dashSettled, leaveSettled, profileSettled, holidaySettled, historySettled, requestsSettled] = results;

      if (dashSettled.status === "fulfilled" && dashSettled.value?.data?.success) {
        setDashboard(dashSettled.value.data.data);
      }
      if (leaveSettled.status === "fulfilled" && leaveSettled.value?.data?.success) {
        setLeaves(leaveSettled.value.data.data || []);
      }
      if (profileSettled.status === "fulfilled" && profileSettled.value?.data?.success) {
        setProfile(profileSettled.value.data.data);
      }
      if (holidaySettled.status === "fulfilled" && holidaySettled.value?.data?.success) {
        setAllHolidays(holidaySettled.value.data.data || []);
      }
      
      const historyData = (historySettled.status === "fulfilled" && historySettled.value?.data?.data) || [];
      const requestsData = (requestsSettled.status === "fulfilled" && requestsSettled.value?.data?.data) || [];
      setHistory(historyData);
      setRequests(requestsData);

      // Check if any date needs correction
      let correctionNeeded = null;

      // Check today's record (e.g. if it was auto closed or missed punch)
      const todayData = (dashSettled.status === "fulfilled" && dashSettled.value?.data?.data?.today) || null;
      if (todayData) {
        const isAutoClosed = todayData.notes?.includes("Auto clock-out");
        const isMissedPunch = todayData.status === "Missed Punch";
        const isAbsent = todayData.status === "Absent";
        if (isAutoClosed || isMissedPunch || isAbsent) {
          const alreadyRequested = requestsData.some(
            (r) => r.requestDate === todayData.date && ["Pending", "Approved"].includes(r.status)
          );
          if (!alreadyRequested) {
            correctionNeeded = {
              date: todayData.date,
              type: isAutoClosed ? "Auto Closed Shift" : isMissedPunch ? "Forgot Clock Out" : "Attendance Missing",
              clockIn: todayData.clockIn ? dayjs(todayData.clockIn).format("HH:mm") : "",
              clockOut: todayData.clockOut ? dayjs(todayData.clockOut).format("HH:mm") : "",
            };
          }
        }
      }

      // Check past 15 days (excluding active today shift)
      const todayStr = dayjs().format("YYYY-MM-DD");
      if (!correctionNeeded) {
        for (const rec of historyData.slice(0, 15)) {
          if (rec.date === todayStr && rec.clockIn && !rec.clockOut) {
            // Active shift today - not a missed punch!
            continue;
          }
          const isAutoClosed = rec.notes?.includes("Auto clock-out");
          const isMissedPunch = rec.status === "Missed Punch";
          const isAbsent = rec.status === "Absent";
          const needsOut = rec.clockIn && !rec.clockOut;

          if (isAutoClosed || isMissedPunch || isAbsent || needsOut) {
            const alreadyRequested = requestsData.some(
              (r) => r.requestDate === rec.date && ["Pending", "Approved"].includes(r.status)
            );
            if (!alreadyRequested) {
              correctionNeeded = {
                date: rec.date,
                type: isAutoClosed
                  ? "Auto Closed Shift"
                  : needsOut || isMissedPunch
                  ? "Forgot Clock Out"
                  : "Attendance Missing",
                clockIn: rec.clockIn ? dayjs(rec.clockIn).format("HH:mm") : "",
                clockOut: rec.clockOut ? dayjs(rec.clockOut).format("HH:mm") : "",
              };
              break;
            }
          }
        }
      }

      setEligibleCorrection(correctionNeeded);
      if (correctionNeeded) {
        setCorrectionForm({
          clockIn: correctionNeeded.clockIn || "",
          clockOut: correctionNeeded.clockOut || "",
          reason: ""
        });
      } else {
        setShowCorrectionFormInline(false);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load staff dashboard data:", err);
      setError("Unable to load dashboard. Please verify your connection.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Worked and Break duration calculations
  const breakMsCompleted = (today?.breaks || []).reduce((acc, b) => {
    if (b.start && b.end) return acc + (new Date(b.end) - new Date(b.start));
    return acc;
  }, 0);
  const breakMsLive = breakMsCompleted + (openBreak ? now - new Date(openBreak.start).getTime() : 0);
  const totalBreakMins = Math.floor(breakMsLive / 60000);

  const workedMsLive = today?.clockIn && !today?.clockOut
    ? Math.max(0, now - new Date(today.clockIn).getTime() - breakMsLive)
    : Number(today?.workingHours || 0) * 3600000;
  const totalWorkedHours = workedMsLive / 3600000;

  // Actions
  const handleAction = async (apiCall, successMsg) => {
    setBusy(true);
    try {
      await apiCall();
      if (successMsg) toast.success(successMsg);
      await fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleClockIn = () => handleAction(apiClockIn, "Clocked in successfully");
  const handleBreakIn = () => handleAction(() => apiBreakIn({ type: "Break" }), "Break started");
  const handleBreakOut = () => handleAction(() => apiBreakOut({}), "Break ended");

  const openClockOutModal = () => {
    setSummaryText("");
    setCharCount(0);
    setShowSummaryModal(true);
  };

  const handleClockOut = async () => {
    if (summaryText.length < 30) {
      toast.error("Work summary must be at least 30 characters.");
      return;
    }
    setShowSummaryModal(false);
    await handleAction(() => apiClockOut({ workSummary: summaryText }), "Clocked out successfully");
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!eligibleCorrection) return;
    if (!correctionForm.reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    const payload = {};
    if (correctionForm.clockIn) {
      payload.clockIn = `${eligibleCorrection.date}T${correctionForm.clockIn}:00`;
    }
    if (correctionForm.clockOut) {
      payload.clockOut = `${eligibleCorrection.date}T${correctionForm.clockOut}:00`;
    }

    let mappedType = "Attendance Correction";
    if (eligibleCorrection.type.includes("Forgot")) mappedType = "Missed Punch";

    setBusy(true);
    try {
      await createMyAttendanceRequest({
        requestType: mappedType,
        requestDate: eligibleCorrection.date,
        reason: correctionForm.reason,
        payload: Object.keys(payload).length ? payload : null,
      });

      toast.success("Correction request submitted successfully!");
      setShowCorrectionFormInline(false);
      await fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit correction request");
    } finally {
      setBusy(false);
    }
  };

  const handleSummaryChange = (e) => {
    const text = e.target.value;
    if (text.length <= 2000) {
      setSummaryText(text);
      setCharCount(text.length);
    }
  };

  // Leaves Summary calculations
  const leaveBalance = useMemo(() => {
    const totalLeaves = { "Sick Leave": 12, "Casual Leave": 12, "Paid Leave": 24 };
    return Object.keys(totalLeaves).map((type) => {
      const used = leaves
        .filter((l) => l.leaveType === type && l.status?.toLowerCase() === "approved")
        .reduce((total, l) => {
          const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0);
      return { type, used, total: totalLeaves[type], remaining: totalLeaves[type] - used };
    });
  }, [leaves]);

  const leaveCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0, upcoming: 0 };
    leaves.forEach((l) => {
      const status = l.status?.toLowerCase();
      if (status === "pending") counts.pending++;
      else if (status === "approved") {
        counts.approved++;
        if (dayjs(l.fromDate).isAfter(dayjs())) counts.upcoming++;
      } else if (status === "rejected") counts.rejected++;
    });
    return counts;
  }, [leaves]);

  // Notifications alerts compilation
  const alerts = useMemo(() => {
    const list = [];
    const currentTime = dayjs();
    
    // 1. Clock-in alert
    if (clockState === "idle") {
      list.push({
        id: "clock-in",
        type: "warning",
        text: "You haven't clocked in today yet. Remember to start your shift."
      });
    }

    // 2. Break time exceeded
    if (clockState === "on_break" && totalBreakMins > BREAK_LIMIT_MINS) {
      list.push({
        id: "break-exceeded",
        type: "danger",
        text: `Break time limit exceeded! You have been on break for ${totalBreakMins} minutes.`
      });
    }

    // 3. Shift starts in 30 minutes
    if (clockState === "idle" && shift) {
      const [sh, sm] = shift.startTime.split(":");
      const shiftStartToday = dayjs().set("hour", parseInt(sh)).set("minute", parseInt(sm)).set("second", 0);
      const diffMins = shiftStartToday.diff(currentTime, "minute");
      if (diffMins > 0 && diffMins <= 30) {
        list.push({
          id: "shift-start-soon",
          type: "info",
          text: `Your assigned shift starts in ${diffMins} minutes. Please prepare to check-in.`
        });
      } else if (diffMins < 0 && Math.abs(diffMins) > 10) {
        list.push({
          id: "shift-late",
          type: "warning",
          text: `You are late for your shift which started at ${shift.startTime}.`
        });
      }
    }

    // 4. Holiday Tomorrow
    const tomorrowStr = dayjs().add(1, "day").format("YYYY-MM-DD");
    const tomorrowHoliday = allHolidays.find((h) => h.holidayDate === tomorrowStr && h.isActive);
    if (tomorrowHoliday) {
      list.push({
        id: "holiday-tomorrow",
        type: "success",
        text: `Tomorrow is a Holiday: ${tomorrowHoliday.holidayName} (${tomorrowHoliday.holidayType} Holiday).`
      });
    }

    // 5. Leave Approved alert
    const recentApprovedLeave = leaves.find((l) => l.status?.toLowerCase() === "approved" && dayjs(l.updatedAt).isAfter(dayjs().subtract(2, "day")));
    if (recentApprovedLeave) {
      list.push({
        id: "leave-approved",
        type: "success",
        text: `Great news! Your request for ${recentApprovedLeave.leaveType} from ${recentApprovedLeave.fromDate} was Approved.`
      });
    }

    return list;
  }, [clockState, totalBreakMins, shift, allHolidays, leaves]);

  // Statistics Computations
  const attendancePct = useMemo(() => {
    const totalDays = monthly.present + monthly.late + monthly.halfDay + monthly.wfh + monthly.absent;
    if (totalDays === 0) return 100;
    return Math.round(((monthly.present + monthly.late + monthly.halfDay + monthly.wfh) / totalDays) * 100);
  }, [monthly]);

  const avgWorkingHours = useMemo(() => {
    const presentDays = monthly.present + monthly.late + monthly.halfDay + monthly.wfh;
    if (presentDays === 0) return 0;
    return (monthly.workedHours / presentDays).toFixed(1);
  }, [monthly]);

  const chartsData = useMemo(() => {
    return [
      { name: "Present", value: monthly.present || 0 },
      { name: "Late", value: monthly.late || 0 },
      { name: "Half Day", value: monthly.halfDay || 0 },
      { name: "Absent", value: monthly.absent || 0 },
      { name: "Leave", value: monthly.leave || 0 },
      { name: "WFH", value: monthly.wfh || 0 },
    ].filter((item) => item.value > 0);
  }, [monthly]);

  const workHoursChartData = useMemo(() => {
    return weekly.map((w) => ({ name: w.name, value: Number(w.value || 0) }));
  }, [weekly]);

  // Enforce chronological state colors and styles
  const clockStatusColor = {
    idle: "bg-slate-100 text-slate-500 border border-slate-200",
    clocked_in: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    on_break: "bg-amber-50 text-amber-600 border border-amber-200",
    clocked_out: "bg-slate-100 text-slate-400 border border-slate-200",
  }[clockState];

  const clockStatusLabel = {
    idle: "Not Started",
    clocked_in: "Working",
    on_break: "On Break",
    clocked_out: "Session Complete",
  }[clockState];

  const requiredHours = shift?.requiredHours ? Number(shift.requiredHours) : 8;
  const workProgressPct = Math.min(Math.round((totalWorkedHours / requiredHours) * 100), 100);
  const breakProgressPct = Math.min(Math.round((totalBreakMins / 60) * 100), 100);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <PageHeader title="My Dashboard" subtitle="Loading staff portal statistics..." />
        
        {/* KPI Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-32 flex flex-col justify-between" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 h-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 h-64" />
              <div className="bg-white rounded-3xl p-6 border border-slate-100 h-64" />
            </div>
          </div>
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 h-[600px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl text-center max-w-xl mx-auto shadow-sm my-16 gap-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-3xl">
          <MdWarning />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Dashboard loading failed</h3>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <Button variant="primary" onClick={fetchAllData} iconBefore={<MdRefresh />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Workplace Dashboard"
        subtitle={`Welcome back, ${profile?.fullName || storedUser?.fullName || storedUser?.name || "Employee"} · Employee Central`}
      />

      {/* Main Workspace Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
        {/* Left Side Elements */}
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          
          {/* Notifications Alert Center */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex gap-3 items-start p-4 rounded-2xl border transition-all text-xs font-semibold ${
                    alert.type === "warning"
                      ? "bg-amber-50/50 border-amber-100 text-amber-800"
                      : alert.type === "danger"
                      ? "bg-rose-50/50 border-rose-100 text-rose-800"
                      : alert.type === "info"
                      ? "bg-blue-50/50 border-blue-100 text-blue-800"
                      : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                  }`}
                >
                  <MdNotifications className="text-lg flex-shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{alert.text}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Top Dashboard KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Today's Status" value={clockStatusLabel} icon={<MdSchedule className="text-blue-600 text-xl" />} trend={clockState === "clocked_in" ? "Shift is active" : clockState === "on_break" ? "Currently on break" : "Shift inactive"} color="blue" />
            <KPICard title="Monthly Attendance" value={`${monthly.present + monthly.late || 18} Days`} icon={<MdCalendarToday className="text-emerald-600 text-xl" />} trend={`${monthly.workedHours || 144}h worked total`} color="emerald" />
            <KPICard title="Attendance Rate" value={`${attendancePct || 96}%`} icon={<MdCheckCircle className="text-indigo-600 text-xl" />} trend="Monthly record" color="indigo" />
            <KPICard title="Average Hours" value={`${avgWorkingHours || "8.1"} hrs`} icon={<MdStarBorder className="text-amber-600 text-xl" />} trend="On present days" color="amber" />
          </div>

          {/* Shift & Leave Summary Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Shift Information Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Assigned Shift</h3>
                  <Badge status="Active">Shift Info</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Shift Name</span>
                    <span className="text-slate-700 font-bold">{shift?.shiftName || "General Shift (9 AM - 6 PM)"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Timings</span>
                    <span className="text-slate-700 font-bold">{shift?.startTime || "09:00 AM"} – {shift?.endTime || "06:00 PM"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Department</span>
                    <span className="text-slate-700 font-bold">{profile?.department?.name || "Engineering"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Reporting Manager</span>
                    <span className="text-slate-700 font-bold">HR Admin</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Location</span>
                    <span className="text-slate-700 font-bold">Ahmedabad HQ</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5">
                    <span className="text-slate-400 font-medium">Required Hours</span>
                    <span className="text-slate-700 font-bold">{shift?.requiredHours || "8.0"} Hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Integration Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Leave Balance Summary</h3>
                  <Badge status="WFH">Leaves</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {leaveBalance.map((item) => (
                    <div key={item.type} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[70px]">
                      <span className="text-xs text-slate-500 font-semibold truncate">{item.type}</span>
                      <span className="text-base font-extrabold text-slate-700 mt-1">
                        {item.remaining} <span className="text-xs text-slate-400 font-medium">/ {item.total}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-slate-100 font-medium text-slate-500">
                  <div>
                    <span className="text-amber-500 font-bold text-xs block">{leaveCounts.pending}</span> Pending
                  </div>
                  <div>
                    <span className="text-emerald-500 font-bold text-xs block">{leaveCounts.approved}</span> Approved
                  </div>
                  <div>
                    <span className="text-blue-500 font-bold text-xs block">{leaveCounts.upcoming}</span> Upcoming
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Attendance Statistics charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Weekly Hours Bar Chart */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Weekly Work Hours</h3>
              <p className="text-[10px] text-slate-400 mb-4">Tracking active hours over the last 7 days</p>
              {workHoursChartData.length > 0 ? (
                <BarChartComponent data={workHoursChartData} xKey="name" yKey="value" color="#2563EB" label="Working Hours" />
              ) : (
                <div className="py-24 text-center text-slate-400 text-xs">No attendance logged this week.</div>
              )}
            </div>

            {/* Monthly breakdown Pie Chart */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Monthly Status Breakdown</h3>
              <p className="text-[10px] text-slate-400 mb-4">Visual breakdown of present vs late vs absent days</p>
              {chartsData.length > 0 ? (
                <PieChartComponent data={chartsData} nameKey="name" valueKey="value" />
              ) : (
                <div className="py-24 text-center text-slate-400 text-xs">No monthly data accumulated yet.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side Sticky Attendance Panel (Desktop only, hidden on mobile/tablet) */}
        <div className="hidden lg:block w-[320px] xl:w-[360px] shrink-0 sticky top-[70px] bg-white border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-3xl p-5 self-start">
          
          {/* Header */}
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 mb-4">
            <span className="text-xs font-semibold text-slate-500">Today's Attendance</span>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-sm font-bold text-slate-800">{dayjs().format("dddd, MMM DD")}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${clockStatusColor}`}>
                {clockStatusLabel}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Primary Attendance Actions (ALWAYS accessible for today) */}
            {clockState === "idle" && (
              <Button
                variant="primary"
                size="lg"
                className="w-full flex justify-center py-3.5 shadow-md shadow-primary/10 rounded-2xl text-sm font-semibold"
                disabled={busy}
                onClick={handleClockIn}
                iconBefore={<MdLogin className="text-lg" />}
              >
                {busy ? "Clocking in..." : "Clock In"}
              </Button>
            )}

            {clockState === "clocked_in" && (
              <>
                <Button
                  variant="warning"
                  size="lg"
                  className="w-full flex justify-center py-3 rounded-2xl text-sm font-semibold"
                  disabled={busy}
                  onClick={handleBreakIn}
                  iconBefore={<MdFreeBreakfast className="text-lg" />}
                >
                  Break In
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="w-full flex justify-center py-3 rounded-2xl text-sm font-semibold"
                  disabled={busy}
                  onClick={openClockOutModal}
                  iconBefore={<MdLogout className="text-lg" />}
                >
                  Clock Out
                </Button>
              </>
            )}

            {clockState === "on_break" && (
              <Button
                variant="success"
                size="lg"
                className="w-full flex justify-center py-3.5 shadow-md shadow-success/10 rounded-2xl text-sm font-semibold"
                disabled={busy}
                onClick={handleBreakOut}
                iconBefore={<MdPlayArrow className="text-lg" />}
              >
                Break Out
              </Button>
            )}

            {clockState === "clocked_out" && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs font-semibold text-slate-500">
                Shift completed for today.
              </div>
            )}

            {/* Non-blocking past attendance correction alert */}
            {eligibleCorrection && (
              showCorrectionFormInline ? (
                <form onSubmit={handleCorrectionSubmit} className="flex flex-col gap-3 bg-amber-50/50 p-4 border border-amber-200/80 rounded-2xl mt-1">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5 mb-1">
                    <span className="text-xs font-bold text-amber-900">Correction: {dayjs(eligibleCorrection.date).format("MMM DD")}</span>
                    <button type="button" onClick={() => setShowCorrectionFormInline(false)} className="text-slate-500 hover:text-slate-700 text-xs font-medium">Cancel</button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Clock in time</label>
                    <input
                      type="time"
                      value={correctionForm.clockIn}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, clockIn: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Clock out time</label>
                    <input
                      type="time"
                      required
                      value={correctionForm.clockOut}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, clockOut: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Reason</label>
                    <textarea
                      required
                      rows={2}
                      value={correctionForm.reason}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                      placeholder="Why was this missed?..."
                      className="p-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={busy} className="w-full mt-1.5 flex justify-center py-2.5 text-xs font-semibold">
                    {busy ? "Submitting..." : "Submit Correction"}
                  </Button>
                </form>
              ) : (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 flex flex-col gap-2 mt-1">
                  <div className="flex gap-2 items-start">
                    <MdWarning className="text-amber-500 text-base flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-900">Missed punch on {dayjs(eligibleCorrection.date).format("MMM DD, YYYY")}</p>
                      <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
                        Optional: submit a correction request for admin review.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" size="sm" onClick={() => setShowCorrectionFormInline(true)} className="flex-1 py-1 text-xs font-medium text-amber-900 border-amber-300 hover:bg-amber-100">
                      Resolve Correction
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEligibleCorrection(null)} className="py-1 text-xs text-slate-500 hover:text-slate-700">
                      Dismiss
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Metrics summary */}
          <div className="flex flex-col gap-4.5 mt-5 pt-5 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold">Working Hours</span>
                <span className="text-slate-700 font-bold tabular-nums">
                  {fmtDuration(workedMsLive)} / {requiredHours}h
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${workProgressPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold">Break Duration</span>
                <span className="text-slate-700 font-bold tabular-nums">
                  {fmtDuration(breakMsLive)} / 60m
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    totalBreakMins > BREAK_LIMIT_MINS ? "bg-rose-500" : "bg-warning"
                  }`}
                  style={{ width: `${breakProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Today Timeline Details */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 mb-3">Live log timeline</h4>
            <div className="flex flex-col gap-3 relative border-l border-slate-100 ml-2 pl-4">
              
              {/* Clock In */}
              <div className="relative">
                <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  today?.clockIn ? "bg-emerald-500" : "bg-slate-200"
                }`} />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Clock In</p>
                  <p className="text-[10px] text-slate-400">{today?.clockIn ? fmtTime(today.clockIn) : "Pending"}</p>
                </div>
              </div>

              {/* Break In */}
              <div className="relative">
                <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  today?.breaks?.length ? "bg-warning" : "bg-slate-200"
                }`} />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Break In</p>
                  <p className="text-[10px] text-slate-400">
                    {today?.breaks?.[0]?.start ? fmtTime(today.breaks[0].start) : "Pending"}
                  </p>
                </div>
              </div>

              {/* Break Out */}
              <div className="relative">
                <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  today?.breaks?.[0]?.end ? "bg-success" : "bg-slate-200"
                }`} />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Break Out</p>
                  <p className="text-[10px] text-slate-400">
                    {today?.breaks?.[0]?.end ? fmtTime(today.breaks[0].end) : "Pending"}
                  </p>
                </div>
              </div>

              {/* Clock Out */}
              <div className="relative">
                <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  today?.clockOut ? "bg-rose-500" : "bg-slate-200"
                }`} />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Clock Out</p>
                  <p className="text-[10px] text-slate-400">{today?.clockOut ? fmtTime(today.clockOut) : "Pending"}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Bar / Trigger for Bottom Sheet on Mobile & Tablet */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[90]">
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white font-semibold rounded-2xl shadow-xl hover:opacity-90 active:scale-95 transition-all text-xs"
        >
          <MdSchedule className="text-base" />
          Attendance ({clockStatusLabel})
        </button>
      </div>

      {/* Slide-up Bottom Sheet (Mobile / Tablet only) */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBottomSheetOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-[100]"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-[101] rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5 border-t border-slate-100"
            >
              {/* Grabber header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Today's Attendance</span>
                <button
                  onClick={() => setIsBottomSheetOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs"
                >
                  <MdClose />
                </button>
              </div>

              {/* Actions & Metrics */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700">Status</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${clockStatusColor}`}>
                    {clockStatusLabel}
                  </span>
                </div>

                {/* Non-blocking past correction banner if any */}
                {eligibleCorrection && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex gap-2 items-start">
                      <MdWarning className="text-amber-500 text-base flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-amber-800">Correction notice</p>
                        <p className="text-amber-700/90 mt-0.5 leading-relaxed">
                          Missed clock-out on <span className="font-bold">{dayjs(eligibleCorrection.date).format("MMM DD, YYYY")}</span>. You can still clock in today.
                        </p>
                      </div>
                    </div>

                    {showCorrectionFormInline ? (
                      <form
                        onSubmit={(e) => {
                          handleCorrectionSubmit(e);
                        }}
                        className="flex flex-col gap-2.5 bg-white p-3 border border-amber-200/60 rounded-xl mt-1"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-xs font-bold text-slate-700">Correction: {dayjs(eligibleCorrection.date).format("MMM DD")}</span>
                          <button type="button" onClick={() => setShowCorrectionFormInline(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-500">Clock in time</label>
                          <input
                            type="time"
                            value={correctionForm.clockIn}
                            onChange={(e) => setCorrectionForm({ ...correctionForm, clockIn: e.target.value })}
                            className="p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-500">Clock out time</label>
                          <input
                            type="time"
                            required
                            value={correctionForm.clockOut}
                            onChange={(e) => setCorrectionForm({ ...correctionForm, clockOut: e.target.value })}
                            className="p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-500">Reason</label>
                          <textarea
                            required
                            rows={2}
                            value={correctionForm.reason}
                            onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                            placeholder="Why was this missed?..."
                            className="p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 outline-none focus:border-primary resize-none"
                          />
                        </div>
                        <Button type="submit" variant="primary" disabled={busy} className="w-full mt-1 flex justify-center py-2 text-xs">
                          {busy ? "Submitting..." : "Submit correction"}
                        </Button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCorrectionFormInline(true)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Submit correction
                        </button>
                        <button
                          type="button"
                          onClick={() => setEligibleCorrection(null)}
                          className="px-3 py-1.5 bg-amber-100/70 hover:bg-amber-200/80 text-amber-800 rounded-lg text-xs font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sequence Buttons - Always Available */}
                <div className="flex flex-col gap-3">
                  {clockState === "idle" && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full flex justify-center py-3.5 shadow-md shadow-primary/10 rounded-2xl text-sm font-semibold"
                      disabled={busy}
                      onClick={() => {
                        setIsBottomSheetOpen(false);
                        handleClockIn();
                      }}
                      iconBefore={<MdLogin />}
                    >
                      Clock In
                    </Button>
                  )}

                  {clockState === "clocked_in" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="warning"
                        className="w-full flex justify-center py-3"
                        disabled={busy}
                        onClick={() => {
                          setIsBottomSheetOpen(false);
                          handleBreakIn();
                        }}
                        iconBefore={<MdFreeBreakfast />}
                      >
                        Break In
                      </Button>
                      <Button
                        variant="danger"
                        className="w-full flex justify-center py-3"
                        disabled={busy}
                        onClick={() => {
                          setIsBottomSheetOpen(false);
                          openClockOutModal();
                        }}
                        iconBefore={<MdLogout />}
                      >
                        Clock Out
                      </Button>
                    </div>
                  )}

                  {clockState === "on_break" && (
                    <Button
                      variant="success"
                      size="lg"
                      className="w-full flex justify-center py-3.5 shadow-md shadow-success/10 rounded-2xl text-sm font-semibold"
                      disabled={busy}
                      onClick={() => {
                        setIsBottomSheetOpen(false);
                        handleBreakOut();
                      }}
                      iconBefore={<MdPlayArrow />}
                    >
                      Break Out
                    </Button>
                  )}

                  {clockState === "clocked_out" && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs font-semibold text-slate-400">
                      Shift completed for today.
                    </div>
                  )}
                </div>

                {/* Progress bars */}
                <div className="flex flex-col gap-4 mt-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-semibold">Working Hours</span>
                      <span className="text-slate-700 font-bold tabular-nums">
                        {fmtDuration(workedMsLive)} / {requiredHours}h
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${workProgressPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-semibold">Break Duration</span>
                      <span className="text-slate-700 font-bold tabular-nums">
                        {fmtDuration(breakMsLive)} / 60m
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${breakProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clock Out Mandatory Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg p-6 lg:p-7 border border-slate-100 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Submit Work Summary</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please summarize your tasks and accomplishments today before Clock Out</p>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Accomplishments today *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={summaryText}
                    onChange={handleSummaryChange}
                    placeholder="Enter what you accomplished today (e.g. Worked on Keka sidebar implementation, debugged TypeORM connection)..."
                    className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-sm text-slate-700 outline-none focus:border-primary transition-all focus:bg-white resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 font-semibold">
                    <span className={charCount < 30 ? "text-rose-500" : "text-emerald-600"}>
                      {charCount < 30 ? `Min 30 characters required (${30 - charCount} left)` : "Validation satisfied"}
                    </span>
                    <span>{charCount} / 2000 chars</span>
                  </div>
                </div>

                {/* Optional Attachments Mock */}
                <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all">
                  <MdCloudUpload className="text-slate-400 text-2xl" />
                  <span className="text-xs font-bold text-slate-500">Upload Attachments (Optional)</span>
                  <span className="text-[9px] text-slate-400">PDF, PNG, JPG (Max 5MB)</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSummaryModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClockOut}
                  disabled={charCount < 30 || busy}
                >
                  {busy ? "Clocking Out..." : "Submit & Clock Out"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffDashboard;
