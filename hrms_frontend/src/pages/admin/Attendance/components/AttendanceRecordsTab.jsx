import { useState, useEffect, useMemo } from "react";
import {
  getAttendanceRecords,
  updateAttendanceRecord,
  createManualAttendance,
  runAttendanceMaintenance,
  getAllStaff,
  getDepartments,
  getShifts,
} from "../../../../services/api";
import DataTable from "../../../../components/tables/DataTable";
import Button from "../../../../components/common/Button";
import Badge from "../../../../components/common/Badge";
import Avatar from "../../../../components/common/Avatar";
import DetailModal from "../../../../components/modals/DetailModal";
import { MdSearch, MdEdit, MdVisibility, MdCalendarToday, MdAdd, MdRefresh } from "react-icons/md";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const AttendanceRecordsTab = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  // Filter States
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedShift, setSelectedShift] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Edit fields
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [recordStatus, setRecordStatus] = useState("");
  const [workingHoursVal, setWorkingHoursVal] = useState(0);
  const [lateMinVal, setLateMinVal] = useState(0);
  const [overtimeMinVal, setOvertimeMinVal] = useState(0);
  const [breakMinVal, setBreakMinVal] = useState(0);

  // Manual entry fields
  const [manualForm, setManualForm] = useState({
    staffId: "",
    date: dayjs().format("YYYY-MM-DD"),
    status: "Present",
    clockInTime: "09:00",
    clockOutTime: "18:00",
    shiftId: "",
    notes: "Manual entry by admin",
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedDate, selectedDept, selectedShift, selectedStatus]);

  const fetchMetadata = async () => {
    try {
      const [empRes, deptRes, shiftRes] = await Promise.all([
        getAllStaff(),
        getDepartments(),
        getShifts(),
      ]);
      if (empRes.data?.success) {
        setEmployees(empRes.data.data);
        if (empRes.data.data.length > 0) {
          setManualForm((prev) => ({ ...prev, staffId: String(empRes.data.data[0].id) }));
        }
      }
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (shiftRes.data?.success) {
        setShifts(shiftRes.data.data);
        if (shiftRes.data.data.length > 0) {
          setManualForm((prev) => ({ ...prev, shiftId: shiftRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Error loading filters metadata:", err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedShift !== "All") params.shiftId = selectedShift;
      if (selectedStatus !== "All") params.status = selectedStatus;
      if (selectedDept !== "All") params.departmentId = selectedDept;

      const res = await getAttendanceRecords(params);
      if (res.data?.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching attendance logs:", err);
      toast.error(err.response?.data?.message || "Failed to fetch attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const handleRunMaintenance = async () => {
    try {
      setSweeping(true);
      const res = await runAttendanceMaintenance();
      if (res.data?.success) {
        toast.success("Attendance maintenance processed successfully!");
        fetchRecords();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Maintenance sweep failed");
    } finally {
      setSweeping(false);
    }
  };

  // Search filter
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const name = rec.employeeName ? rec.employeeName.toLowerCase() : "";
      const code = rec.employeeCode ? rec.employeeCode.toLowerCase() : "";
      const q = searchQuery.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [records, searchQuery]);

  const handleOpenView = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setSelectedRecord(record);
    setClockInTime(record.clockIn ? dayjs(record.clockIn).format("HH:mm") : "");
    setClockOutTime(record.clockOut ? dayjs(record.clockOut).format("HH:mm") : "");
    setRecordStatus(record.status || "Present");
    setWorkingHoursVal(record.workingHours || 0);
    setLateMinVal(record.lateMinutes || 0);
    setOvertimeMinVal(record.overtimeMinutes || 0);
    setBreakMinVal(record.breakDuration || 0);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const updatedPayload = {
        clockIn: clockInTime ? `${selectedRecord.date}T${clockInTime}:00` : null,
        clockOut: clockOutTime ? `${selectedRecord.date}T${clockOutTime}:00` : null,
        status: recordStatus,
        workingHours: Number(workingHoursVal),
        lateMinutes: Number(lateMinVal),
        overtimeMinutes: Number(overtimeMinVal),
        breakDuration: Number(breakMinVal),
      };

      const res = await updateAttendanceRecord(selectedRecord.id, updatedPayload);
      if (res.data?.success) {
        toast.success("Attendance record updated successfully!");
        setIsEditModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update record");
    }
  };

  const handleCreateManualAttendance = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        staffId: Number(manualForm.staffId),
        date: manualForm.date,
        status: manualForm.status,
        shiftId: manualForm.shiftId || null,
        clockIn: manualForm.clockInTime ? `${manualForm.date}T${manualForm.clockInTime}:00` : null,
        clockOut: manualForm.clockOutTime ? `${manualForm.date}T${manualForm.clockOutTime}:00` : null,
        notes: manualForm.notes,
      };

      const res = await createManualAttendance(payload);
      if (res.data?.success) {
        toast.success("Attendance record created successfully!");
        setIsManualModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create manual attendance");
    }
  };

  const columns = [
    {
      header: "Employee",
      accessor: "employeeName",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employeeName} size={32} />
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{row.employeeName}</span>
            <span className="text-xs text-text-secondary">{row.employeeCode}</span>
          </div>
        </div>
      ),
    },
    { header: "Department", accessor: "departmentName", sortable: true },
    { header: "Designation", accessor: "designationName", sortable: true },
    {
      header: "Shift",
      accessor: "shiftName",
      render: (row) => row.shiftName || <span className="text-slate-400 italic">Default</span>,
    },
    {
      header: "Clock In",
      accessor: "clockIn",
      render: (row) => (row.clockIn ? dayjs(row.clockIn).format("hh:mm A") : "—"),
    },
    {
      header: "Clock Out",
      accessor: "clockOut",
      render: (row) => (row.clockOut ? dayjs(row.clockOut).format("hh:mm A") : "—"),
    },
    {
      header: "Work Hours",
      accessor: "workingHours",
      render: (row) => (
        <span className="font-medium text-text-primary">
          {Number(row.workingHours || 0).toFixed(1)} hrs
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => {
        let variant = "neutral";
        if (["Present", "Work From Home", "On Duty", "Business Trip"].includes(row.status)) variant = "success";
        else if (row.status === "Late" || row.status === "Half Day") variant = "warning";
        else if (row.status === "Absent" || row.status === "Missed Punch") variant = "danger";
        else if (row.status === "Holiday" || row.status === "Weekly Off") variant = "primary";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenView(row)}
            className="p-1.5 text-text-secondary hover:text-primary transition-colors"
            title="View Details"
          >
            <MdVisibility size={18} />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-text-secondary hover:text-primary transition-colors"
            title="Edit Record"
          >
            <MdEdit size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-secondary border border-border-color p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-primary border border-border-color px-3 py-1.5 rounded-lg text-sm text-text-primary">
            <MdCalendarToday className="text-primary text-base" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none text-text-primary font-medium"
            />
          </div>

          <div className="relative">
            <MdSearch className="absolute left-3 top-2.5 text-text-secondary text-base" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-border-color rounded-lg bg-bg-primary text-sm text-text-primary outline-none focus:border-primary w-48 md:w-60"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Dept Select */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="p-2 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Shift Select */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="p-2 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="All">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.shiftName}</option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Work From Home">Work From Home</option>
            <option value="Holiday">Holiday</option>
            <option value="Weekly Off">Weekly Off</option>
            <option value="Missed Punch">Missed Punch</option>
          </select>

          <Button
            variant="secondary"
            onClick={handleRunMaintenance}
            disabled={sweeping}
            className="flex items-center gap-1.5 text-xs"
            title="Auto-close open punches and mark unpunched staff absent"
          >
            <MdRefresh className={sweeping ? "animate-spin" : ""} size={16} />
            {sweeping ? "Sweeping..." : "Sync Absent"}
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <MdAdd size={16} />
            Log Attendance
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        pageSize={10}
        emptyMessage={
          loading
            ? "Loading attendance records from database..."
            : "No attendance records found for this date. Click 'Log Attendance' or 'Sync Absent' to record attendance."
        }
      />

      {/* Manual Entry Modal */}
      <DetailModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Log Attendance Manually"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateManualAttendance} className="flex flex-col gap-4 text-sm mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary">Employee</label>
            <select
              required
              value={manualForm.staffId}
              onChange={(e) => setManualForm({ ...manualForm, staffId: e.target.value })}
              className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Date</label>
              <input
                type="date"
                required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Status</label>
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Work From Home">Work From Home</option>
                <option value="On Duty">On Duty</option>
                <option value="Holiday">Holiday</option>
                <option value="Weekly Off">Weekly Off</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Clock In Time</label>
              <input
                type="time"
                value={manualForm.clockInTime}
                onChange={(e) => setManualForm({ ...manualForm, clockInTime: e.target.value })}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Clock Out Time</label>
              <input
                type="time"
                value={manualForm.clockOutTime}
                onChange={(e) => setManualForm({ ...manualForm, clockOutTime: e.target.value })}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary">Shift (Optional)</label>
            <select
              value={manualForm.shiftId}
              onChange={(e) => setManualForm({ ...manualForm, shiftId: e.target.value })}
              className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary"
            >
              <option value="">Default Shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary">Reason / Notes</label>
            <textarea
              rows={2}
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              className="p-2.5 border border-border-color rounded-md bg-bg-primary text-text-primary outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-color">
            <Button type="button" variant="secondary" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Attendance
            </Button>
          </div>
        </form>
      </DetailModal>

      {/* View Modal */}
      <DetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Attendance Log Details"
        maxWidth="450px"
      >
        {selectedRecord && (
          <div className="flex flex-col gap-4 text-sm mt-2">
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Employee:</span>
              <span className="text-text-primary font-bold">{selectedRecord.employeeName}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Date:</span>
              <span className="text-text-primary">{selectedRecord.date}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Shift:</span>
              <span className="text-text-primary">{selectedRecord.shiftName || "General"}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Clock In:</span>
              <span className="text-text-primary">
                {selectedRecord.clockIn ? dayjs(selectedRecord.clockIn).format("hh:mm:ss A") : "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Clock Out:</span>
              <span className="text-text-primary">
                {selectedRecord.clockOut ? dayjs(selectedRecord.clockOut).format("hh:mm:ss A") : "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Working Hours:</span>
              <span className="text-text-primary font-bold">{Number(selectedRecord.workingHours || 0).toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Break Duration:</span>
              <span className="text-text-primary">{selectedRecord.breakDuration || 0} mins</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Late Minutes:</span>
              <span className="text-amber-500 font-medium">{selectedRecord.lateMinutes || 0} mins</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Overtime Minutes:</span>
              <span className="text-emerald-500 font-medium">{selectedRecord.overtimeMinutes || 0} mins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-secondary">Status:</span>
              <Badge variant="primary">{selectedRecord.status}</Badge>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Edit Modal */}
      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Attendance Record"
        maxWidth="480px"
      >
        {selectedRecord && (
          <form onSubmit={handleUpdateRecord} className="flex flex-col gap-4 text-sm mt-2">
            <div className="bg-bg-primary p-3 rounded-lg border border-border-color flex justify-between items-center">
              <div>
                <p className="font-bold text-text-primary">{selectedRecord.employeeName}</p>
                <p className="text-xs text-text-secondary">{selectedRecord.date}</p>
              </div>
              <Badge variant="neutral">{selectedRecord.shiftName || "General"}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Clock In Time</label>
                <input
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                  className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Clock Out Time</label>
                <input
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                  className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Total Worked (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={workingHoursVal}
                  onChange={(e) => setWorkingHoursVal(e.target.value)}
                  className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Break Duration (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={breakMinVal}
                  onChange={(e) => setBreakMinVal(e.target.value)}
                  className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Late Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={lateMinVal}
                  onChange={(e) => setLateMinVal(e.target.value)}
                  className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Overtime Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={overtimeMinVal}
                  onChange={(e) => setOvertimeMinVal(e.target.value)}
                  className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Attendance Status</label>
              <select
                value={recordStatus}
                onChange={(e) => setRecordStatus(e.target.value)}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Work From Home">Work From Home</option>
                <option value="On Duty">On Duty</option>
                <option value="Holiday">Holiday</option>
                <option value="Weekly Off">Weekly Off</option>
                <option value="Missed Punch">Missed Punch</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-color mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DetailModal>
    </div>
  );
};

export default AttendanceRecordsTab;
