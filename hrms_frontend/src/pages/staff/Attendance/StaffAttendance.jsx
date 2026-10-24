import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import PageHeader from "../../../components/layouts/PageHeader";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/tables/DataTable";
import DetailModal from "../../../components/modals/DetailModal";
import {
  MdSearch,
  MdFilterList,
  MdFileDownload,
  MdCalendarToday,
  MdList,
  MdInbox,
  MdWarning,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdBeachAccess,
  MdInfoOutline
} from "react-icons/md";
import {
  getAttendanceHistory,
  getMyAttendanceRequests,
  getHolidays
} from "../../../services/api";

const fmtTime = (d) => (d ? dayjs(d).format("hh:mm A") : "—");

const EmptyState = ({ message, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 border border-slate-100 rounded-3xl gap-4">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl">
      <MdInbox />
    </div>
    <div>
      <h4 className="text-sm font-bold text-slate-800">{message}</h4>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const StaffAttendance = () => {
  // Tabs: "History" | "Holidays" | "Requests"
  const [activeTab, setActiveTab] = useState("History");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [logs, setLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Holiday view mode: "Cards" | "Calendar"
  const [holidayView, setHolidayView] = useState("Cards");
  const [holidayYear, setHolidayYear] = useState(() => new Date().getFullYear());
  const [calendarDate, setCalendarDate] = useState(() => dayjs());

  // Request details modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [histSettled, reqSettled, holSettled] = await Promise.allSettled([
        getAttendanceHistory(),
        getMyAttendanceRequests(),
        getHolidays()
      ]);

      if (histSettled.status === "fulfilled" && histSettled.value?.data?.success) {
        setLogs(histSettled.value.data.data || []);
      }
      if (reqSettled.status === "fulfilled" && reqSettled.value?.data?.success) {
        setRequests(reqSettled.value.data.data || []);
      }
      if (holSettled.status === "fulfilled" && holSettled.value?.data?.success) {
        setHolidays(holSettled.value.data.data || []);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load attendance logs", err);
      setError("Unable to load attendance details. Please check your network.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceDetails();
  }, []);

  // ── FILTERS & SEARCH FOR HISTORY ──────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search term (status or date)
      const matchesSearch =
        log.date.includes(searchTerm) ||
        (log.status && log.status.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Status Filter
      const matchesStatus = statusFilter === "All" || log.status === statusFilter;

      // 3. Month Filter
      let matchesMonth = true;
      if (monthFilter !== "All") {
        const logMonth = dayjs(log.date).format("MM");
        matchesMonth = logMonth === monthFilter;
      }

      // 4. Date Range Filter
      let matchesRange = true;
      if (startDateFilter && endDateFilter) {
        const logDate = dayjs(log.date);
        matchesRange =
          (logDate.isSame(startDateFilter, "day") || logDate.isAfter(startDateFilter)) &&
          (logDate.isSame(endDateFilter, "day") || logDate.isBefore(endDateFilter));
      }

      return matchesSearch && matchesStatus && matchesMonth && matchesRange;
    });
  }, [logs, searchTerm, statusFilter, monthFilter, startDateFilter, endDateFilter]);

  // Months lists
  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Date", "Clock In", "Clock Out", "Working Hours", "Break Minutes", "Status", "Notes"];
    const rows = filteredLogs.map((log) => [
      log.date,
      log.clockIn ? dayjs(log.clockIn).format("hh:mm A") : "—",
      log.clockOut ? dayjs(log.clockOut).format("hh:mm A") : "—",
      log.workingHours || "0",
      log.breakDuration || "0",
      log.status,
      log.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Logs_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully");
  };

  // ── HOLIDAY CALCULATIONS ──────────────────────────────────────────────────
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const year = dayjs(h.holidayDate).year();
      return h.isActive && year === Number(holidayYear);
    });
  }, [holidays, holidayYear]);

  const holidayStats = useMemo(() => {
    const total = filteredHolidays.length;
    const mandatory = filteredHolidays.filter((h) => h.isPaid).length;
    const optional = total - mandatory;
    return { total, mandatory, optional };
  }, [filteredHolidays]);

  // Calendar calculations
  const generateCalendarDays = () => {
    const startOfMonth = calendarDate.startOf("month");
    const endOfMonth = calendarDate.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days = [];
    let day = startDate;

    while (day.isBefore(endDate)) {
      days.push(day);
      day = day.add(1, "day");
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const getHolidayForDay = (day) => {
    return holidays.find((h) => h.isActive && dayjs(h.holidayDate).isSame(day, "day"));
  };

  const handleOpenRequestDetail = (req) => {
    setSelectedRequest(req);
    setIsRequestModalOpen(true);
  };


  // Table columns definition for History
  const historyColumns = [
    {
      header: "Date",
      accessor: "date",
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700">{row.date}</span>,
    },
    {
      header: "Clock In",
      accessor: "clockIn",
      render: (row) => <span className="text-slate-600 font-medium">{row.clockIn ? fmtTime(row.clockIn) : "—"}</span>,
    },
    {
      header: "Clock Out",
      accessor: "clockOut",
      render: (row) => <span className="text-slate-600 font-medium">{row.clockOut ? fmtTime(row.clockOut) : "—"}</span>,
    },
    {
      header: "Working Hours",
      accessor: "workingHours",
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{Number(row.workingHours || 0).toFixed(1)} hrs</span>,
    },
    {
      header: "Break Duration",
      accessor: "breakDuration",
      render: (row) => <span className="text-slate-600">{row.breakDuration || 0} mins</span>,
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: "Notes",
      accessor: "notes",
      render: (row) => (
        <span className="text-xs text-slate-400 max-w-[180px] truncate block" title={row.notes}>
          {row.notes || "—"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <PageHeader title="Attendance Logs" subtitle="Fetching logs & details..." />
        <div className="bg-white rounded-3xl p-6 border border-slate-100 h-96" />
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
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load attendance logs</h3>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <Button variant="primary" onClick={fetchAttendanceDetails} iconBefore={<MdRefresh />}>
          Retry Fetching
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance & Leave Logs"
        subtitle="Review your historical check-in logs, company holidays, and correction requests"
      />

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 gap-6 text-sm font-semibold text-slate-400">
        {[
          { id: "History", label: "Attendance Logs" },
          { id: "Holidays", label: "Holidays Directory" },
          { id: "Requests", label: "Correction Log" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 relative transition-all ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: HISTORY TABLE ────────────────────────────────────────────── */}
      {activeTab === "History" && (
        <div className="flex flex-col gap-5">
          {/* Advanced Multi-Filters Header */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search logs by date, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-slate-50 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white transition-all font-medium"
                />
              </div>

              {/* CSV Export Button */}
              <Button
                variant="outline"
                onClick={handleExportCSV}
                iconBefore={<MdFileDownload className="text-base" />}
              >
                Export CSV
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 outline-none focus:border-primary"
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="Missed Punch">Missed Punch</option>
                </select>
              </div>

              {/* Month Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 outline-none focus:border-primary"
                >
                  <option value="All">All Months</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Start */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">From Date</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 outline-none focus:border-primary"
                />
              </div>

              {/* Date End */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">To Date</label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-700 outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* History Data Table */}
          {filteredLogs.length > 0 ? (
            <DataTable columns={historyColumns} data={filteredLogs} pageSize={10} />
          ) : (
            <EmptyState message="No attendance records found matching filters." subtitle="Try adjusting your filter settings or search terms above." />
          )}
        </div>
      )}

      {/* ── TAB 2: REDESIGNED HOLIDAYS ──────────────────────────────────────── */}
      {activeTab === "Holidays" && (
        <div className="flex flex-col gap-5">
          {/* Controls & Stats header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            
            {/* Year filter & View modes */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Year</span>
                <select
                  value={holidayYear}
                  onChange={(e) => setHolidayYear(Number(e.target.value))}
                  className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setHolidayView("Cards")}
                  className={`p-2 flex items-center justify-center text-lg transition-all ${
                    holidayView === "Cards" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"
                  }`}
                  title="Card view"
                >
                  <MdList />
                </button>
                <button
                  onClick={() => setHolidayView("Calendar")}
                  className={`p-2 flex items-center justify-center text-lg transition-all ${
                    holidayView === "Calendar" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"
                  }`}
                  title="Calendar Grid view"
                >
                  <MdCalendarToday />
                </button>
              </div>
            </div>

            {/* Counters */}
            <div className="flex gap-4 text-xs font-bold text-slate-500 justify-between sm:justify-start">
              <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                Total: <span className="text-slate-800">{holidayStats.total}</span>
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                Mandatory: <span className="text-emerald-800">{holidayStats.mandatory}</span>
              </span>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                Optional: <span className="text-amber-800">{holidayStats.optional}</span>
              </span>
            </div>
          </div>

          {/* Cards View */}
          {holidayView === "Cards" && (
            filteredHolidays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredHolidays.map((holiday, idx) => (
                  <motion.div
                    key={holiday.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 ${
                      holiday.isPaid ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-amber-500"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-primary leading-none">
                            {dayjs(holiday.holidayDate).format("MMM")}
                          </span>
                          <span className="text-sm font-extrabold text-primary leading-none mt-0.5">
                            {dayjs(holiday.holidayDate).format("DD")}
                          </span>
                        </div>
                        <Badge status={holiday.isPaid ? "Active" : "InActive"}>
                          {holiday.isPaid ? "Mandatory" : "Optional"}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 mb-1">{holiday.holidayName}</h4>
                      <p className="text-[10px] text-slate-400 mb-2">
                        {dayjs(holiday.holidayDate).format("dddd")} · {holiday.holidayType || "Public"}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {holiday.description || "No description provided for this holiday."}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState message="No holidays found for this year." />
            )
          )}

          {/* Calendar Grid View */}
          {holidayView === "Calendar" && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-800">{calendarDate.format("MMMM YYYY")}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalendarDate(calendarDate.subtract(1, "month"))}
                    className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-base"
                  >
                    <MdChevronLeft />
                  </button>
                  <button
                    onClick={() => setCalendarDate(calendarDate.add(1, "month"))}
                    className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-base"
                  >
                    <MdChevronRight />
                  </button>
                </div>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 text-center font-semibold text-xs text-slate-400 border-b border-slate-100 pb-2 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1.5 min-h-[300px]">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = day.month() === calendarDate.month();
                  const holiday = getHolidayForDay(day);

                  return (
                    <div
                      key={index}
                      className={`border border-slate-100 rounded-xl p-2 flex flex-col justify-between min-h-[75px] relative transition-all ${
                        isCurrentMonth ? "bg-white" : "bg-slate-50/50 opacity-40"
                      } ${
                        holiday
                          ? holiday.isPaid
                            ? "border-emerald-200 bg-emerald-50/5"
                            : "border-amber-200 bg-amber-50/5"
                          : ""
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${holiday ? "text-primary" : "text-slate-400"}`}>
                        {day.date()}
                      </span>
                      {holiday && (
                        <div
                          className={`rounded px-1.5 py-0.5 text-[8px] font-bold w-full truncate text-center ${
                            holiday.isPaid ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                          }`}
                          title={holiday.holidayName}
                        >
                          {holiday.holidayName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: REQUESTS ─────────────────────────────────────────────────── */}
      {activeTab === "Requests" && (
        requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleOpenRequestDetail(r)}
                className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center gap-4 hover:border-primary/20"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-700">{r.requestType}</span>
                    <Badge status={r.status}>{r.status}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">
                    Date: {dayjs(r.requestDate).format("MMM DD, YYYY")}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[280px]">Reason: {r.reason}</p>
                </div>
                <MdInfoOutline className="text-slate-400 text-lg flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState message="No attendance requests found." subtitle="Any correction or regularization requests filed will appear here." />
        )
      )}

      {/* Request details modal */}
      <DetailModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Details"
        maxWidth="460px"
      >
        {selectedRequest && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-800">{selectedRequest.requestType}</span>
              <Badge status={selectedRequest.status}>{selectedRequest.status}</Badge>
            </div>

            <div className="flex flex-col gap-3 text-xs font-medium">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Request Date</span>
                <span className="text-slate-700 font-bold">
                  {dayjs(selectedRequest.requestDate).format("dddd, MMMM DD, YYYY")}
                </span>
              </div>
              
              {selectedRequest.payload?.clockIn && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Requested Clock In</span>
                  <span className="text-slate-700 font-bold">
                    {dayjs(selectedRequest.payload.clockIn).format("hh:mm A")}
                  </span>
                </div>
              )}

              {selectedRequest.payload?.clockOut && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Requested Clock Out</span>
                  <span className="text-slate-700 font-bold">
                    {dayjs(selectedRequest.payload.clockOut).format("hh:mm A")}
                  </span>
                </div>
              )}

              <div className="flex flex-col py-1 gap-1">
                <span className="text-slate-400">Reason</span>
                <p className="text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed resize-none">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.approvalComment && (
                <div className="flex flex-col py-1 gap-1">
                  <span className="text-emerald-600 font-bold">Manager Comments</span>
                  <p className="text-emerald-800 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 leading-relaxed">
                    {selectedRequest.approvalComment}
                  </p>
                </div>
              )}

              {selectedRequest.rejectionComment && (
                <div className="flex flex-col py-1 gap-1">
                  <span className="text-rose-600 font-bold">Rejection Reason</span>
                  <p className="text-rose-800 bg-rose-50/50 rounded-xl p-3 border border-rose-100 leading-relaxed">
                    {selectedRequest.rejectionComment}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 mt-2">
              <Button onClick={() => setIsRequestModalOpen(false)}>Close Details</Button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default StaffAttendance;
