import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import PageHeader from "../../../components/layouts/PageHeader";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import {
  MdCalendarToday,
  MdChevronLeft,
  MdChevronRight,
  MdEvent,
  MdBeachAccess,
  MdEventBusy,
  MdToday,
  MdSchedule,
} from "react-icons/md";
import { getHolidays, getLeave } from "../../../services/api";

const eventTypeColor = {
  Holiday: { dot: "bg-rose-500", badge: "danger", bg: "bg-rose-50 border-rose-200 text-rose-700" },
  Leave: { dot: "bg-amber-500", badge: "warning", bg: "bg-amber-50 border-amber-200 text-amber-700" },
  Meeting: { dot: "bg-blue-500", badge: "primary", bg: "bg-blue-50 border-blue-200 text-blue-700" },
  Event: { dot: "bg-emerald-500", badge: "success", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
};

const defaultCompanyEvents = [
  { title: "Monthly All-Hands & Townhall", type: "Meeting", time: "10:00 AM", recurringDay: 15 },
  { title: "Department Retrospective & Demo", type: "Meeting", time: "03:30 PM", recurringDay: 28 },
];

const StaffCalendar = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };
  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const [holRes, leaveRes] = await Promise.allSettled([
          getHolidays(),
          getLeave(),
        ]);

        if (holRes.status === "fulfilled" && holRes.value?.data?.data) {
          setHolidays(holRes.value.data.data);
        }
        if (leaveRes.status === "fulfilled" && leaveRes.value?.data?.data) {
          setLeaves(leaveRes.value.data.data);
        }
      } catch (err) {
        console.error("Calendar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Compile full event list for current active view and upcoming cards
  const allEvents = useMemo(() => {
    const list = [];

    // 1. Map real company holidays
    (holidays || []).forEach((h) => {
      if (h.holidayDate) {
        list.push({
          date: h.holidayDate.split("T")[0],
          title: h.holidayName || "Public Holiday",
          type: "Holiday",
          time: h.holidayType || "Full Day",
          description: h.description || "Official Company Holiday",
        });
      }
    });

    // 2. Map approved user leaves
    (leaves || []).forEach((l) => {
      if (l.status?.toLowerCase() === "approved" && l.fromDate && l.toDate) {
        let cur = dayjs(l.fromDate);
        const end = dayjs(l.toDate);
        while (cur.isBefore(end) || cur.isSame(end, "day")) {
          list.push({
            date: cur.format("YYYY-MM-DD"),
            title: `${l.leaveType} (Approved)`,
            type: "Leave",
            time: "Off Work",
            description: l.reason || "Approved Personal Leave",
          });
          cur = cur.add(1, "day");
        }
      }
    });

    // 3. Add recurring monthly events for this year/month
    defaultCompanyEvents.forEach((ce) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(ce.recurringDay).padStart(2, "0")}`;
      list.push({
        date: dateStr,
        title: ce.title,
        type: ce.type,
        time: ce.time,
        description: "Standard scheduled company session",
      });
    });

    return list;
  }, [holidays, leaves, year, month]);

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return allEvents.filter((e) => e.date === dateStr);
  };

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const selectedDayEvents = allEvents.filter((e) => e.date === selectedDateStr);

  const upcomingEvents = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    return allEvents
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 6);
  }, [allEvents]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedule & Calendar"
        subtitle="Manage working days, company holidays, approved leaves, and meetings"
        actions={
          <Button
            variant="secondary"
            size="sm"
            iconBefore={<MdToday className="text-lg" />}
            onClick={jumpToToday}
          >
            Today
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Calendar Grid Section */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col gap-6">
          {/* Header Month / Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {monthName} {year}
              </h2>
              {loading && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium animate-pulse">
                  Syncing events...
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button
                onClick={prevMonth}
                aria-label="Previous Month"
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shadow-sm"
              >
                <MdChevronLeft className="text-xl" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="Next Month"
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shadow-sm"
              >
                <MdChevronRight className="text-xl" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div
                key={d}
                className={`text-xs font-semibold py-2 ${
                  i === 0 || i === 6 ? "text-rose-400" : "text-slate-400"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] rounded-2xl bg-slate-50/40" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrent = isToday(day);
              const isSelected = selectedDay === day;
              const hasHoliday = dayEvents.some((e) => e.type === "Holiday");
              const hasLeave = dayEvents.some((e) => e.type === "Leave");

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[72px] sm:min-h-[82px] rounded-2xl p-2 cursor-pointer border flex flex-col justify-between transition-all select-none ${
                    isSelected
                      ? "ring-2 ring-blue-600 border-blue-500 shadow-md bg-blue-50/40"
                      : isCurrent
                      ? "border-blue-300 bg-blue-50/20"
                      : hasHoliday
                      ? "border-rose-100 bg-rose-50/30 hover:border-rose-300"
                      : hasLeave
                      ? "border-amber-100 bg-amber-50/30 hover:border-amber-300"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs sm:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isCurrent
                          ? "bg-blue-600 text-white shadow-sm"
                          : isSelected
                          ? "text-blue-700 bg-blue-100"
                          : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.slice(0, 2).map((ev, ei) => (
                      <div
                        key={ei}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${
                          eventTypeColor[ev.type]?.bg || "bg-slate-100 text-slate-700"
                        }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-bold text-slate-400 text-center">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Color Indicators Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap gap-4">
              {Object.entries(eventTypeColor).map(([type, config]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                  <span className="text-slate-600 font-medium">{type}</span>
                </div>
              ))}
            </div>
            <span className="text-slate-400 text-[11px]">Click any date to inspect details</span>
          </div>
        </div>

        {/* Selected Date Inspector & Upcoming Events */}
        <div className="flex flex-col gap-6">
          {/* Selected Date Details */}
          <div className="bg-white rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-slate-400">
                  Inspecting Day
                </span>
                <h3 className="text-base font-extrabold text-slate-800">
                  {dayjs(selectedDateStr).format("dddd, MMMM D, YYYY")}
                </h3>
              </div>
              <Badge status={isToday(selectedDay) ? "success" : "neutral"}>
                {isToday(selectedDay) ? "Today" : "Scheduled"}
              </Badge>
            </div>

            <div className="flex flex-col gap-2.5">
              {selectedDayEvents.length === 0 ? (
                <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                  <MdCalendarToday className="text-3xl text-slate-300" />
                  <p className="text-xs">No special events or holidays on this date.</p>
                  <p className="text-[11px] text-slate-400">Regular working hours apply.</p>
                </div>
              ) : (
                selectedDayEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                      eventTypeColor[ev.type]?.bg || "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{ev.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 shadow-xs">
                        {ev.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                      <MdSchedule />
                      <span>{ev.time}</span>
                    </div>
                    {ev.description && (
                      <p className="text-[11px] opacity-90 mt-0.5">{ev.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Company Calendar Highlights */}
          <div className="bg-white rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MdEvent className="text-blue-600 text-lg" />
                <span className="text-sm font-bold text-slate-800">Upcoming Highlights</span>
              </div>
              <span className="text-xs text-slate-400">{upcomingEvents.length} upcoming</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming holidays scheduled.</p>
              ) : (
                upcomingEvents.map((ev, idx) => (
                  <div
                    key={`${ev.date}-${idx}`}
                    className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
                      {ev.type === "Holiday" ? (
                        <MdBeachAccess className="text-rose-500" />
                      ) : ev.type === "Leave" ? (
                        <MdEventBusy className="text-amber-500" />
                      ) : (
                        <MdCalendarToday className="text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{ev.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {dayjs(ev.date).format("MMM D, YYYY")} · {ev.time}
                      </p>
                    </div>
                    <Badge status={ev.type === "Holiday" ? "danger" : ev.type === "Leave" ? "warning" : "primary"}>
                      {ev.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffCalendar;
