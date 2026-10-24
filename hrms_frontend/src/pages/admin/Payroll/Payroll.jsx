import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import PageHeader from "../../../components/layouts/PageHeader";
import DataTable from "../../../components/tables/DataTable";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import DetailModal from "../../../components/modals/DetailModal";
import { PieChartComponent } from "../../../components/charts/ChartWrappers";
import {
  MdPayments,
  MdCheckCircle,
  MdHourglassEmpty,
  MdReceipt,
  MdLocalPrintshop,
  MdVisibility,
  MdEdit,
  MdPlayCircleFilled,
  MdCalendarToday,
  MdAccessTime,
  MdNightlightRound,
  MdTrendingUp,
} from "react-icons/md";
import {
  getPayrolls,
  generateMonthlyPayroll,
  previewPayroll,
  updatePayroll,
  processPayroll,
  getAllStaff,
} from "../../../services/api";
import { toast } from "react-toastify";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("MMMM"));
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Edit fields
  const [editForm, setEditForm] = useState({
    bonus: 0,
    allowance: 0,
    deduction: 0,
    tax: 0,
    remarks: "",
  });

  // Generate wizard state
  const [generateMonth, setGenerateMonth] = useState(dayjs().format("MMMM"));
  const [generateYear, setGenerateYear] = useState(dayjs().year());
  const [previews, setPreviews] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchStaff();
  }, [selectedMonth, selectedYear, statusFilter]);

  const fetchStaff = async () => {
    try {
      const res = await getAllStaff();
      if (res.data?.success) setAllStaffList(res.data.data || []);
    } catch (err) {
      console.error("Failed to load staff", err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (statusFilter !== "All") params.status = statusFilter;

      const res = await getPayrolls(params);
      if (res.data?.success) {
        setPayrolls(res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading payroll records:", err);
      toast.error(err.response?.data?.message || "Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculations from real database payroll
  const stats = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let processed = 0;
    let pending = 0;
    let totalTax = 0;
    let totalOvertimePay = 0;
    let totalShiftAllowance = 0;

    payrolls.forEach((p) => {
      const net = Number(p.netSalary || 0);
      const basic = Number(p.basicSalary || 0);
      const allow = Number(p.allowance || 0);
      const bon = Number(p.bonus || 0);
      const ot = Number(p.overtimePay || 0);
      const sa = Number(p.shiftAllowance || 0);

      totalGross += basic + allow + bon + ot + sa;
      totalNet += net;
      totalTax += Number(p.tax || 0);
      totalOvertimePay += ot;
      totalShiftAllowance += sa;

      if (p.status === "Processed") {
        processed += net;
      } else {
        pending += net;
      }
    });

    return {
      totalGross,
      totalNet,
      processed,
      pending,
      totalTax,
      totalOvertimePay,
      totalShiftAllowance,
      count: payrolls.length,
    };
  }, [payrolls]);

  // Department distribution
  const deptPayrollData = useMemo(() => {
    const sum = {};
    payrolls.forEach((p) => {
      const deptName = p.staff?.department?.name || "General";
      sum[deptName] = (sum[deptName] || 0) + Number(p.netSalary || 0);
    });
    return Object.keys(sum).map((d) => ({
      name: d,
      value: sum[d],
    }));
  }, [payrolls]);

  const handleOpenGenerate = async () => {
    setIsGenerateModalOpen(true);
    setGenerateMonth(selectedMonth);
    setGenerateYear(selectedYear);
    loadPreview(selectedMonth, selectedYear);
  };

  const loadPreview = async (m, y) => {
    try {
      setPreviewLoading(true);
      const res = await previewPayroll({ month: m, year: y });
      if (res.data?.success) {
        setPreviews(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to calculate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmGenerate = async () => {
    try {
      setGenerating(true);
      const res = await generateMonthlyPayroll({
        month: generateMonth,
        year: generateYear,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Payroll generated successfully!");
        setIsGenerateModalOpen(false);
        setSelectedMonth(generateMonth);
        setSelectedYear(generateYear);
        fetchPayrolls();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenPayslip = (payroll) => {
    setSelectedPayroll(payroll);
    setIsPayslipOpen(true);
  };

  const handleOpenEdit = (payroll) => {
    setSelectedPayroll(payroll);
    setEditForm({
      bonus: Number(payroll.bonus || 0),
      allowance: Number(payroll.allowance || 0),
      deduction: Number(payroll.deduction || 0),
      tax: Number(payroll.tax || 0),
      remarks: payroll.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    try {
      const res = await updatePayroll(selectedPayroll.id, editForm);
      if (res.data?.success) {
        toast.success("Payroll adjustments updated successfully");
        setIsEditModalOpen(false);
        fetchPayrolls();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update payroll");
    }
  };

  const handleProcess = async (id) => {
    try {
      const res = await processPayroll(id);
      if (res.data?.success) {
        toast.success("Payroll marked as Processed & Paid!");
        fetchPayrolls();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payroll");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Columns for DataTable
  const columns = [
    {
      header: "Employee",
      accessor: "staff.fullName",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.staff?.fullName || "Staff"} size={36} />
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">
              {row.staff?.fullName || "Employee"}
            </span>
            <span className="text-xs text-text-secondary">{row.staff?.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "staff.department.name",
      render: (row) => row.staff?.department?.name || "General",
    },
    {
      header: "Shift & Attendance",
      accessor: "attendanceDetails",
      render: (row) => {
        const att = row.attendanceDetails;
        if (!att) return <span className="text-slate-400 text-xs">Standard</span>;
        return (
          <div className="flex flex-col text-xs gap-0.5">
            <span className="font-medium text-text-primary">
              {att.shiftName} ({att.shiftType})
            </span>
            <span className="text-slate-500">
              {att.payableDays}/{att.totalCalendarDays} days payable • {att.presentDays}P {att.absentDays}A {att.holidayDays}H {att.weeklyOffDays}W
            </span>
          </div>
        );
      },
    },
    {
      header: "Basic Salary",
      accessor: "basicSalary",
      render: (row) => `₹${Number(row.basicSalary || 0).toLocaleString("en-IN")}`,
    },
    {
      header: "Shift & OT Pay",
      accessor: "overtimePay",
      render: (row) => {
        const ot = Number(row.overtimePay || 0);
        const sa = Number(row.shiftAllowance || 0);
        return (
          <div className="flex flex-col text-xs">
            {sa > 0 && <span className="text-indigo-600 font-medium">+₹{sa.toLocaleString("en-IN")} Shift</span>}
            {ot > 0 && <span className="text-emerald-600 font-medium">+₹{ot.toLocaleString("en-IN")} OT</span>}
            {sa === 0 && ot === 0 && <span className="text-slate-400">—</span>}
          </div>
        );
      },
    },
    {
      header: "Deductions (LOP)",
      accessor: "deduction",
      render: (row) => {
        const lop = Number(row.lopDeduction || 0);
        const totalDed = Number(row.deduction || 0) + Number(row.tax || 0);
        return (
          <div className="flex flex-col text-xs">
            <span className="text-red-500 font-medium">-₹{totalDed.toLocaleString("en-IN")}</span>
            {lop > 0 && <span className="text-slate-400">LOP: ₹{lop.toLocaleString("en-IN")}</span>}
          </div>
        );
      },
    },
    {
      header: "Net Salary",
      accessor: "netSalary",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-emerald-600">
          ₹{Number(row.netSalary || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => {
        const isProcessed = row.status === "Processed";
        return (
          <Badge variant={isProcessed ? "success" : "warning"}>
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPayslip(row)}
            className="p-1.5 text-text-secondary hover:text-primary transition-colors"
            title="View Payslip"
          >
            <MdVisibility size={18} />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-text-secondary hover:text-primary transition-colors"
            title="Adjust Payroll"
          >
            <MdEdit size={18} />
          </button>
          {row.status !== "Processed" && (
            <button
              onClick={() => handleProcess(row.id)}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors"
              title="Mark as Processed / Paid"
            >
              <MdCheckCircle size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll & Compensation Management"
        subtitle="Manage dynamic attendance-based, shift-aware, and holiday-integrated payroll"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleOpenGenerate}
              className="flex items-center gap-2 shadow-md"
            >
              <MdPlayCircleFilled size={18} />
              Calculate & Generate Payroll
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-color p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Total Net Payroll
            </p>
            <h3 className="text-2xl font-bold text-text-primary mt-1">
              ₹{stats.totalNet.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {stats.count} staff records for {selectedMonth} {selectedYear}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <MdPayments size={28} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-color p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Processed / Paid
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{stats.processed.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Disbursed on time
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <MdCheckCircle size={28} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-color p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Pending Approval
            </p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">
              ₹{stats.pending.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Awaiting sign-off
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <MdHourglassEmpty size={28} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-color p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Shift & Overtime Pay
            </p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">
              ₹{(stats.totalOvertimePay + stats.totalShiftAllowance).toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-purple-600 font-medium mt-1">
              OT: ₹{stats.totalOvertimePay.toLocaleString("en-IN")} • Shift: ₹{stats.totalShiftAllowance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
            <MdTrendingUp size={28} />
          </div>
        </div>
      </div>

      {/* Filter and Period Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-secondary border border-border-color p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-primary border border-border-color px-3 py-1.5 rounded-lg text-sm text-text-primary">
            <MdCalendarToday className="text-primary text-base" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent outline-none text-text-primary font-medium"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-bg-primary border border-border-color px-3 py-1.5 rounded-lg text-sm text-text-primary">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent outline-none text-text-primary font-medium"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-border-color rounded-lg bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
          </select>
        </div>

        {deptPayrollData.length > 0 && (
          <div className="text-xs text-text-secondary flex items-center gap-2">
            <span>Departments:</span>
            {deptPayrollData.slice(0, 3).map((d) => (
              <span key={d.name} className="px-2 py-1 bg-bg-primary rounded border border-border-color">
                {d.name}: ₹{d.value.toLocaleString("en-IN")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Payroll Table */}
      <DataTable
        columns={columns}
        data={payrolls}
        pageSize={10}
        emptyMessage={
          loading
            ? "Loading payroll records from server..."
            : `No payroll records generated for ${selectedMonth} ${selectedYear}. Click "Calculate & Generate Payroll" above to generate based on live attendance.`
        }
      />

      {/* Generate Payroll Wizard Modal */}
      <DetailModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Attendance & Shift-Based Payroll Generator"
        maxWidth="800px"
      >
        <div className="flex flex-col gap-4 text-sm mt-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-blue-900 dark:text-blue-100 flex flex-col gap-1">
            <p className="font-bold text-sm">Attendance, Shift & Holiday Integration Engine</p>
            <p className="text-xs leading-relaxed">
              This will calculate payable days, loss of pay (LOP) deductions for unpunched/absent days,
              overtime wages (1.5x hourly rate), shift differential bonuses (Night/Evening shifts),
              and credit paid public holidays for all active employees.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Payroll Month</label>
              <select
                value={generateMonth}
                onChange={(e) => {
                  setGenerateMonth(e.target.value);
                  loadPreview(e.target.value, generateYear);
                }}
                className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Payroll Year</label>
              <select
                value={generateYear}
                onChange={(e) => {
                  setGenerateYear(Number(e.target.value));
                  loadPreview(generateMonth, Number(e.target.value));
                }}
                className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Previews Table */}
          <div className="border border-border-color rounded-xl overflow-hidden mt-2">
            <div className="bg-bg-primary p-3 border-b border-border-color flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-text-secondary">
                Calculation Preview ({previews.length} Active Staff)
              </span>
              {previewLoading && <span className="text-xs text-primary font-medium animate-pulse">Calculating...</span>}
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-secondary text-text-secondary border-b border-border-color">
                  <tr>
                    <th className="p-2.5">Staff</th>
                    <th className="p-2.5">Shift</th>
                    <th className="p-2.5">Payable / Total</th>
                    <th className="p-2.5">OT Hours</th>
                    <th className="p-2.5">Gross</th>
                    <th className="p-2.5">LOP Ded.</th>
                    <th className="p-2.5">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {previews.map((p) => (
                    <tr key={p.staffId} className="hover:bg-bg-primary/50">
                      <td className="p-2.5 font-medium text-text-primary">{p.staffName}</td>
                      <td className="p-2.5">{p.attendanceDetails?.shiftName}</td>
                      <td className="p-2.5 font-medium">
                        {p.attendanceDetails?.payableDays} / {p.attendanceDetails?.totalCalendarDays}d
                      </td>
                      <td className="p-2.5">{p.attendanceDetails?.overtimeHours} hrs</td>
                      <td className="p-2.5">₹{(p.salaryBreakdown?.grossSalary || 0).toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-red-500 font-medium">
                        -₹{(p.salaryBreakdown?.lopDeduction || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-600">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {previews.length === 0 && !previewLoading && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-text-secondary">
                        No staff members found to calculate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-color">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={generating || previews.length === 0}
              onClick={handleConfirmGenerate}
              className="flex items-center gap-2"
            >
              {generating ? "Saving..." : `Confirm & Generate (${previews.length} Records)`}
            </Button>
          </div>
        </div>
      </DetailModal>

      {/* Edit Adjustments Modal */}
      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Adjust Payroll Allowances & Deductions"
        maxWidth="500px"
      >
        {selectedPayroll && (
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 text-sm mt-2">
            <div className="bg-bg-primary p-3 rounded-lg border border-border-color flex justify-between items-center">
              <div>
                <p className="font-bold text-text-primary">{selectedPayroll.staff?.fullName}</p>
                <p className="text-xs text-text-secondary">{selectedPayroll.month} {selectedPayroll.year}</p>
              </div>
              <span className="font-bold text-emerald-600">
                Base: ₹{Number(selectedPayroll.basicSalary).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Performance Bonus (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.bonus}
                  onChange={(e) => setEditForm({ ...editForm, bonus: Number(e.target.value) })}
                  className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Special Allowances (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.allowance}
                  onChange={(e) => setEditForm({ ...editForm, allowance: Number(e.target.value) })}
                  className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Other Deductions (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.deduction}
                  onChange={(e) => setEditForm({ ...editForm, deduction: Number(e.target.value) })}
                  className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Tax (TDS) (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.tax}
                  onChange={(e) => setEditForm({ ...editForm, tax: Number(e.target.value) })}
                  className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Remarks / Note</label>
              <textarea
                rows={2}
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                className="p-2.5 border border-border-color rounded-lg bg-bg-primary text-text-primary outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-color">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Adjustments
              </Button>
            </div>
          </form>
        )}
      </DetailModal>

      {/* Comprehensive Printable Payslip Modal */}
      <DetailModal
        isOpen={isPayslipOpen}
        onClose={() => setIsPayslipOpen(false)}
        title="Employee Payslip & Attendance Breakdown"
        maxWidth="650px"
      >
        {selectedPayroll && (
          <div className="flex flex-col gap-5 text-sm mt-2 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border-color pb-4">
              <div>
                <h4 className="text-lg font-bold text-text-primary">
                  {selectedPayroll.staff?.fullName}
                </h4>
                <p className="text-xs text-text-secondary">
                  {selectedPayroll.staff?.designation?.title || "Staff"} • {selectedPayroll.staff?.department?.name || "General"}
                </p>
                <p className="text-xs text-text-secondary">
                  Staff ID: EMP{String(selectedPayroll.staffId).padStart(4, "0")} • {selectedPayroll.staff?.email}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-text-primary">
                  {selectedPayroll.month} {selectedPayroll.year}
                </span>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                  Status: {selectedPayroll.status}
                </p>
                {selectedPayroll.paymentDate && (
                  <p className="text-[11px] text-slate-400">Paid on: {selectedPayroll.paymentDate}</p>
                )}
              </div>
            </div>

            {/* Attendance & Shift Card */}
            {selectedPayroll.attendanceDetails && (
              <div className="bg-bg-primary p-3 rounded-xl border border-border-color">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                  Attendance & Shift Summary
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-text-secondary">Shift: </span>
                    <span className="font-semibold text-text-primary">
                      {selectedPayroll.attendanceDetails.shiftName} ({selectedPayroll.attendanceDetails.shiftType})
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Payable Days: </span>
                    <span className="font-bold text-emerald-600">
                      {selectedPayroll.attendanceDetails.payableDays} / {selectedPayroll.attendanceDetails.totalCalendarDays}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Present: </span>
                    <span className="font-semibold text-text-primary">{selectedPayroll.attendanceDetails.presentDays} days</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Absent / LOP: </span>
                    <span className="font-semibold text-red-500">{selectedPayroll.attendanceDetails.absentDays} days</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Public Holidays: </span>
                    <span className="font-semibold text-text-primary">{selectedPayroll.attendanceDetails.holidayDays} paid</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Weekly Offs: </span>
                    <span className="font-semibold text-text-primary">{selectedPayroll.attendanceDetails.weeklyOffDays} days</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Late Arrivals: </span>
                    <span className="font-semibold text-amber-500">{selectedPayroll.attendanceDetails.lateDays} times</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Overtime: </span>
                    <span className="font-semibold text-indigo-600">
                      {selectedPayroll.attendanceDetails.overtimeHours} hrs (₹{Number(selectedPayroll.overtimePay || 0).toLocaleString("en-IN")})
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Total Worked: </span>
                    <span className="font-semibold text-text-primary">{selectedPayroll.attendanceDetails.totalWorkedHours} hrs</span>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings and Deductions Table */}
            <div className="grid grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="border border-border-color rounded-xl overflow-hidden">
                <div className="bg-bg-primary p-2.5 font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-color">
                  Earnings
                </div>
                <div className="p-3 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Basic Salary</span>
                    <span className="font-medium">
                      ₹{(selectedPayroll.salaryBreakdown?.basic || Math.round(Number(selectedPayroll.basicSalary) * 0.5)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">HRA (House Rent)</span>
                    <span className="font-medium">
                      ₹{(selectedPayroll.salaryBreakdown?.hra || Math.round(Number(selectedPayroll.basicSalary) * 0.2)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Special Allowances</span>
                    <span className="font-medium">
                      ₹{(selectedPayroll.salaryBreakdown?.specialAllowance || Math.round(Number(selectedPayroll.basicSalary) * 0.3)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {Number(selectedPayroll.shiftAllowance || 0) > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Shift Differential</span>
                      <span className="font-medium">
                        +₹{Number(selectedPayroll.shiftAllowance).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {Number(selectedPayroll.overtimePay || 0) > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Overtime Pay</span>
                      <span className="font-medium">
                        +₹{Number(selectedPayroll.overtimePay).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {Number(selectedPayroll.bonus || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Performance Bonus</span>
                      <span className="font-medium">
                        +₹{Number(selectedPayroll.bonus).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border-color pt-2 flex justify-between font-bold text-text-primary">
                    <span>Gross Earnings</span>
                    <span>
                      ₹{(
                        Number(selectedPayroll.basicSalary) +
                        Number(selectedPayroll.allowance || 0) +
                        Number(selectedPayroll.bonus || 0) +
                        Number(selectedPayroll.overtimePay || 0) +
                        Number(selectedPayroll.shiftAllowance || 0)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-border-color rounded-xl overflow-hidden">
                <div className="bg-bg-primary p-2.5 font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-color">
                  Deductions
                </div>
                <div className="p-3 flex flex-col gap-2 text-xs">
                  {Number(selectedPayroll.lopDeduction || 0) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Loss of Pay (Absent)</span>
                      <span className="font-medium">
                        -₹{Number(selectedPayroll.lopDeduction).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {Number(selectedPayroll.lateDeduction || 0) > 0 && (
                    <div className="flex justify-between text-amber-500">
                      <span>Late Penalty</span>
                      <span className="font-medium">
                        -₹{Number(selectedPayroll.lateDeduction).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Provident Fund (PF)</span>
                    <span className="font-medium">
                      ₹{(selectedPayroll.salaryBreakdown?.pfDeduction || 1800).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Professional Tax (PT)</span>
                    <span className="font-medium">
                      ₹{(selectedPayroll.salaryBreakdown?.ptDeduction || 200).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {Number(selectedPayroll.tax || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tax (TDS)</span>
                      <span className="font-medium">
                        ₹{Number(selectedPayroll.tax).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {Number(
                    selectedPayroll.salaryBreakdown?.customDeduction ??
                      (selectedPayroll.salaryBreakdown
                        ? 0
                        : Number(selectedPayroll.deduction || 0) >=
                          Number(selectedPayroll.lopDeduction || 0)
                        ? Math.max(
                            0,
                            Number(selectedPayroll.deduction || 0) -
                              Number(selectedPayroll.lopDeduction || 0) -
                              Number(selectedPayroll.salaryBreakdown?.pfDeduction || 0) -
                              Number(selectedPayroll.salaryBreakdown?.ptDeduction || 0)
                          )
                        : Number(selectedPayroll.deduction || 0))
                  ) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary lowercase">other deductions</span>
                      <span className="font-medium">
                        ₹{Number(
                          selectedPayroll.salaryBreakdown?.customDeduction ??
                            selectedPayroll.deduction
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border-color pt-2 flex justify-between font-bold text-red-500">
                    <span className="lowercase">total deductions</span>
                    <span>
                      -₹{(
                        selectedPayroll.salaryBreakdown?.totalDeductions !== undefined
                          ? Number(selectedPayroll.salaryBreakdown.totalDeductions)
                          : Number(selectedPayroll.deduction || 0) +
                            Number(selectedPayroll.tax || 0) +
                            (Number(selectedPayroll.deduction || 0) >=
                            Number(selectedPayroll.lopDeduction || 0)
                              ? 0
                              : Number(selectedPayroll.lopDeduction || 0)) +
                            Number(selectedPayroll.lateDeduction || 0)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Highlight */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400">
                  Take-Home Net Salary
                </p>
                <p className="text-xs text-emerald-600/80 mt-0.5">
                  Calculated dynamically from attendance, shift & holiday engine
                </p>
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{Number(selectedPayroll.netSalary).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-color">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrint}
                className="flex items-center gap-1.5"
              >
                <MdLocalPrintshop size={16} />
                Print Payslip
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsPayslipOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default Payroll;
