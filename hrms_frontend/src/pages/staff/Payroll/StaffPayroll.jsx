import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import PageHeader from "../../../components/layouts/PageHeader";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import DetailModal from "../../../components/modals/DetailModal";
import { AreaChartComponent } from "../../../components/charts/ChartWrappers";
import {
  MdReceipt,
  MdLocalPrintshop,
  MdVisibility,
  MdEventAvailable,
  MdAccessTime,
  MdNightlightRound,
  MdShield,
  MdPayments,
} from "react-icons/md";
import { getMyPayroll } from "../../../services/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const inr = (n) => `₹${Math.abs(Number(n || 0)).toLocaleString("en-IN")}`;

const StaffPayroll = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const res = await getMyPayroll();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load staff payroll", err);
      toast.error(err.response?.data?.message || "Failed to load payroll details");
    } finally {
      setLoading(false);
    }
  };

  const current = data?.currentPayroll || data?.currentPreview || null;
  const history = data?.history || [];

  const breakdown = useMemo(() => {
    if (!current) return [];

    const basic = Number(current.salaryBreakdown?.basic || current.basicSalary || 0);
    const hra = Number(current.salaryBreakdown?.hra || 0);
    const allowance = Number(current.allowance || current.salaryBreakdown?.specialAllowance || 0);
    const shiftAllowance = Number(current.shiftAllowance || 0);
    const overtimePay = Number(current.overtimePay || 0);
    const bonus = Number(current.bonus || 0);

    const lop = Number(current.lopDeduction || current.salaryBreakdown?.lopDeduction || 0);
    const late = Number(current.lateDeduction || current.salaryBreakdown?.lateDeduction || 0);
    const pf = Number(current.salaryBreakdown?.pfDeduction || 0);
    const pt = Number(current.salaryBreakdown?.ptDeduction || 0);
    const tax = Number(current.tax || 0);
    const otherDed = Number(current.deduction || 0);

    const items = [
      { label: "Base / Basic Salary", amount: basic, type: "credit" },
      { label: "House Rent Allowance (HRA)", amount: hra, type: "credit" },
      { label: "Other Allowances", amount: allowance, type: "credit" },
    ];

    if (shiftAllowance > 0) {
      items.push({ label: "Shift Differential Bonus", amount: shiftAllowance, type: "credit" });
    }
    if (overtimePay > 0) {
      items.push({ label: "Overtime Compensation", amount: overtimePay, type: "credit" });
    }
    if (bonus > 0) {
      items.push({ label: "Performance Bonus", amount: bonus, type: "credit" });
    }

    if (lop > 0) {
      items.push({ label: "Loss of Pay (Absent Days)", amount: -lop, type: "debit" });
    }
    if (late > 0) {
      items.push({ label: "Late Arrival Penalties", amount: -late, type: "debit" });
    }
    if (pf > 0) {
      items.push({ label: "Provident Fund (PF)", amount: -pf, type: "debit" });
    }
    if (pt > 0) {
      items.push({ label: "Professional Tax (PT)", amount: -pt, type: "debit" });
    }
    if (tax > 0) {
      items.push({ label: "Tax Deduction (TDS)", amount: -tax, type: "debit" });
    }
    if (otherDed > 0) {
      items.push({ label: "Other Deductions", amount: -otherDed, type: "debit" });
    }

    items.push({ label: "Net Take-Home Pay", amount: Number(current.netSalary || 0), type: "net" });

    return items;
  }, [current]);

  const netSalaryTrend = useMemo(() => {
    if (history.length > 0) {
      return history
        .slice(0, 6)
        .reverse()
        .map((h) => ({
          name: h.month ? h.month.slice(0, 3) : "Mo",
          value: Number(h.netSalary || 0),
        }));
    }
    return [
      { name: "Current", value: Number(current?.netSalary || 0) },
    ];
  }, [history, current]);

  const handleOpenPayslip = (slip) => {
    setSelectedSlip(slip);
    setIsPayslipModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-text-secondary">
        <p className="animate-pulse">Loading payroll information...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Payroll & Compensation"
        subtitle="View your attendance-driven salary breakdowns, shift differentials, and download payslips"
      />

      {/* Current Month Payslip Banner */}
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary rounded-3xl p-7 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-xl" />
          <div className="absolute right-20 bottom-0 w-28 h-28 bg-white/10 rounded-full blur-lg" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white/70 text-xs font-semibold mb-1">
                {current.status === "Processed" ? "Processed Payslip" : "Current Attendance-Calculated Payroll"}
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-1">
                {inr(current.netSalary)}
              </h2>
              <p className="text-white/80 text-sm">
                Net Pay • {current.month} {current.year || dayjs().year()}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {current.status || "Pending Calculation"}
                </span>
                {current.paymentDate && (
                  <span className="text-white/70 text-xs">Paid on {current.paymentDate}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/15">
                <p className="text-white/70 text-xs mb-1">Base Salary</p>
                <p className="text-white font-bold text-sm md:text-base">{inr(current.basicSalary)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/15">
                <p className="text-white/70 text-xs mb-1">Allowances & OT</p>
                <p className="text-white font-bold text-sm md:text-base">
                  +{inr(Number(current.allowance || 0) + Number(current.overtimePay || 0) + Number(current.shiftAllowance || 0))}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/15">
                <p className="text-white/70 text-xs mb-1">Deductions & LOP</p>
                <p className="text-white font-bold text-sm md:text-base text-red-200">
                  -{inr(Number(current.deduction || 0) + Number(current.tax || 0) + Number(current.lopDeduction || 0))}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance & Shift Factors Card */}
      {current?.attendanceDetails && (
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MdEventAvailable className="text-primary text-xl" />
            <h3 className="font-bold text-text-primary text-base">
              Attendance, Shift & Holiday Basis for this Month
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-bg-primary p-3 rounded-xl border border-border-color flex flex-col">
              <span className="text-xs text-text-secondary">Assigned Shift</span>
              <span className="font-bold text-sm text-text-primary mt-1">
                {current.attendanceDetails.shiftName}
              </span>
              <span className="text-[11px] text-slate-400">{current.attendanceDetails.shiftType} Shift</span>
            </div>

            <div className="bg-bg-primary p-3 rounded-xl border border-border-color flex flex-col">
              <span className="text-xs text-text-secondary">Payable Days</span>
              <span className="font-bold text-sm text-emerald-600 mt-1">
                {current.attendanceDetails.payableDays} / {current.attendanceDetails.totalCalendarDays}
              </span>
              <span className="text-[11px] text-slate-400">Total days compensated</span>
            </div>

            <div className="bg-bg-primary p-3 rounded-xl border border-border-color flex flex-col">
              <span className="text-xs text-text-secondary">Days Present</span>
              <span className="font-bold text-sm text-text-primary mt-1">
                {current.attendanceDetails.presentDays} Days
              </span>
              <span className="text-[11px] text-slate-400">
                {current.attendanceDetails.halfDays > 0 ? `+${current.attendanceDetails.halfDays} half days` : "Full attendance"}
              </span>
            </div>

            <div className="bg-bg-primary p-3 rounded-xl border border-border-color flex flex-col">
              <span className="text-xs text-text-secondary">Public Holidays</span>
              <span className="font-bold text-sm text-indigo-600 mt-1">
                {current.attendanceDetails.holidayDays} Paid
              </span>
              <span className="text-[11px] text-slate-400">Credited to salary</span>
            </div>

            <div className="bg-bg-primary p-3 rounded-xl border border-border-color flex flex-col">
              <span className="text-xs text-text-secondary">Weekly Offs</span>
              <span className="font-bold text-sm text-text-primary mt-1">
                {current.attendanceDetails.weeklyOffDays} Days
              </span>
              <span className="text-[11px] text-slate-400">Sundays & Roster</span>
            </div>

            <div className="bg-bg-primary p-3 rounded-xl border border-border-color flex flex-col">
              <span className="text-xs text-text-secondary">Overtime Work</span>
              <span className="font-bold text-sm text-purple-600 mt-1">
                {current.attendanceDetails.overtimeHours} hrs
              </span>
              <span className="text-[11px] text-purple-600 font-medium">
                +{inr(current.overtimePay || 0)} OT Pay
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown and Trend Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Breakdown List */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-color">
            <h3 className="font-bold text-text-primary text-base">
              Detailed Salary Breakdown
            </h3>
            <Button
              variant="secondary"
              onClick={() => handleOpenPayslip(current)}
              className="text-xs flex items-center gap-1.5"
            >
              <MdVisibility size={16} />
              Full Payslip
            </Button>
          </div>

          <div className="flex flex-col divide-y divide-border-color">
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className={`py-2.5 flex justify-between items-center text-sm ${
                  item.type === "net"
                    ? "font-extrabold text-base pt-3 border-t-2 border-border-color text-emerald-600"
                    : ""
                }`}
              >
                <span className={item.type === "net" ? "text-text-primary" : "text-text-secondary"}>
                  {item.label}
                </span>
                <span
                  className={
                    item.type === "credit"
                      ? "font-semibold text-text-primary"
                      : item.type === "debit"
                      ? "font-semibold text-red-500"
                      : "font-black text-emerald-600 text-lg"
                  }
                >
                  {item.amount < 0 ? `-${inr(item.amount)}` : inr(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* History & Trend */}
        <div className="flex flex-col gap-6">
          <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-text-primary text-base mb-3">
              Net Salary Progression
            </h3>
            <div className="h-44">
              <AreaChartComponent
                data={netSalaryTrend}
                dataKey="value"
                color="#2563EB"
              />
            </div>
          </div>

          {/* Past Payslips */}
          <div className="bg-bg-secondary border border-border-color rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-text-primary text-base mb-3">
              Past Payslips & Archives
            </h3>
            <div className="flex flex-col divide-y divide-border-color max-h-48 overflow-y-auto">
              {history.map((slip) => (
                <div
                  key={slip.id}
                  className="py-2.5 flex justify-between items-center text-sm hover:bg-bg-primary/50 px-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => handleOpenPayslip(slip)}
                >
                  <div>
                    <p className="font-semibold text-text-primary">
                      {slip.month} {slip.year}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Net: {inr(slip.netSalary)} • Status: {slip.status}
                    </p>
                  </div>
                  <Button variant="ghost" className="text-xs flex items-center gap-1">
                    <MdReceipt size={16} />
                    View
                  </Button>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-xs text-text-secondary py-4 text-center">
                  No historical payslips generated yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Payslip Modal */}
      <DetailModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        title="Official Employee Payslip"
        maxWidth="650px"
      >
        {selectedSlip && (
          <div className="flex flex-col gap-5 text-sm mt-2">
            <div className="flex justify-between items-start border-b border-border-color pb-4">
              <div>
                <h4 className="text-lg font-bold text-text-primary">
                  {data?.staff?.fullName || "Employee"}
                </h4>
                <p className="text-xs text-text-secondary">
                  {data?.staff?.email} • Employee ID: EMP{String(data?.staff?.id || "").padStart(4, "0")}
                </p>
                <p className="text-xs text-text-secondary">
                  {data?.staff?.department?.name || "General"} • {data?.staff?.designation?.title || "Staff"}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-text-primary">
                  {selectedSlip.month} {selectedSlip.year || dayjs().year()}
                </span>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                  {selectedSlip.status || "Calculated"}
                </p>
                {selectedSlip.paymentDate && (
                  <p className="text-[11px] text-slate-400">Paid: {selectedSlip.paymentDate}</p>
                )}
              </div>
            </div>

            {/* Attendance Snapshot in Payslip */}
            {selectedSlip.attendanceDetails && (
              <div className="bg-bg-primary p-3 rounded-xl border border-border-color text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-text-secondary">Shift: </span>
                  <span className="font-semibold text-text-primary">
                    {selectedSlip.attendanceDetails.shiftName}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Payable Days: </span>
                  <span className="font-bold text-emerald-600">
                    {selectedSlip.attendanceDetails.payableDays} / {selectedSlip.attendanceDetails.totalCalendarDays}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Present / Worked: </span>
                  <span className="font-semibold text-text-primary">
                    {selectedSlip.attendanceDetails.presentDays} days ({selectedSlip.attendanceDetails.totalWorkedHours}h)
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Public Holidays: </span>
                  <span className="font-semibold text-text-primary">
                    {selectedSlip.attendanceDetails.holidayDays} paid
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Weekly Offs: </span>
                  <span className="font-semibold text-text-primary">
                    {selectedSlip.attendanceDetails.weeklyOffDays} days
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Overtime Work: </span>
                  <span className="font-semibold text-indigo-600">
                    {selectedSlip.attendanceDetails.overtimeHours}h (+{inr(selectedSlip.overtimePay || 0)})
                  </span>
                </div>
              </div>
            )}

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-border-color rounded-xl p-3 flex flex-col gap-2">
                <span className="font-bold text-text-primary pb-1 border-b border-border-color">
                  Earnings
                </span>
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-medium">{inr(selectedSlip.basicSalary)}</span>
                </div>
                {Number(selectedSlip.allowance || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Allowances</span>
                    <span className="font-medium">{inr(selectedSlip.allowance)}</span>
                  </div>
                )}
                {Number(selectedSlip.shiftAllowance || 0) > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>Shift Differential</span>
                    <span className="font-medium">+{inr(selectedSlip.shiftAllowance)}</span>
                  </div>
                )}
                {Number(selectedSlip.overtimePay || 0) > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>Overtime Pay</span>
                    <span className="font-medium">+{inr(selectedSlip.overtimePay)}</span>
                  </div>
                )}
                {Number(selectedSlip.bonus || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Bonus</span>
                    <span className="font-medium">+{inr(selectedSlip.bonus)}</span>
                  </div>
                )}
              </div>

              <div className="border border-border-color rounded-xl p-3 flex flex-col gap-2">
                <span className="font-bold text-text-primary pb-1 border-b border-border-color">
                  Deductions
                </span>
                {Number(selectedSlip.lopDeduction || 0) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Loss of Pay (Absent)</span>
                    <span className="font-medium">-{inr(selectedSlip.lopDeduction)}</span>
                  </div>
                )}
                {Number(selectedSlip.lateDeduction || 0) > 0 && (
                  <div className="flex justify-between text-amber-500">
                    <span>Late Penalties</span>
                    <span className="font-medium">-{inr(selectedSlip.lateDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Provident Fund (PF)</span>
                  <span className="font-medium">{inr(selectedSlip.salaryBreakdown?.pfDeduction || 1800)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax</span>
                  <span className="font-medium">{inr(selectedSlip.salaryBreakdown?.ptDeduction || 200)}</span>
                </div>
                {Number(selectedSlip.tax || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Tax (TDS)</span>
                    <span className="font-medium">{inr(selectedSlip.tax)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Total Disbursed Net Pay
                </p>
                <p className="text-[11px] text-emerald-600/80">Credited to employee bank account</p>
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {inr(selectedSlip.netSalary)}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-color">
              <Button variant="secondary" onClick={handlePrint} className="flex items-center gap-1.5">
                <MdLocalPrintshop size={16} />
                Print Payslip
              </Button>
              <Button variant="primary" onClick={() => setIsPayslipModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default StaffPayroll;
