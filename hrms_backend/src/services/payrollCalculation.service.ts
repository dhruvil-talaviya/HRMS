import { DataSource } from "typeorm";
import dayjs from "dayjs";
import { Staff } from "../entity/tenant/staff.entity";
import { StaffAttendance, AttendanceStatus } from "../entity/tenant/staff/staff.attandance.entity";
import { Shift } from "../entity/tenant/shift.entity";
import { Holiday } from "../entity/tenant/holiday.entity";
import { Leave } from "../entity/tenant/staff/staff.leave.entity";
import { resolveActiveShift, isWeeklyOff } from "../utils/attendance.util";

export interface AttendanceBreakdown {
  totalCalendarDays: number;
  scheduledWorkingDays: number;
  presentDays: number;
  halfDays: number;
  lateDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  payableDays: number;
  unpaidDays: number;
  totalWorkedHours: number;
  overtimeMinutes: number;
  overtimeHours: number;
  shiftName: string;
  shiftType: string;
  shiftCode: string;
}

export interface SalaryBreakdown {
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  shiftAllowance: number;
  overtimePay: number;
  bonus: number;
  grossSalary: number;
  dailyRate: number;
  hourlyRate: number;
  lopDeduction: number;
  lateDeduction: number;
  pfDeduction: number;
  ptDeduction: number;
  taxDeduction: number;
  customDeduction: number;
  totalDeductions: number;
  netSalary: number;
}

export interface CalculatedPayrollResult {
  staffId: number;
  staffName: string;
  staffEmail: string;
  departmentName?: string;
  designationName?: string;
  month: string;
  year: number;
  basicSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  tax: number;
  overtimePay: number;
  shiftAllowance: number;
  lopDeduction: number;
  lateDeduction: number;
  netSalary: number;
  attendanceDetails: AttendanceBreakdown;
  salaryBreakdown: SalaryBreakdown;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const parseMonthAndYear = (monthInput: any, yearInput: any) => {
  let year = Number(yearInput) || dayjs().year();
  let monthStr = String(monthInput || "").trim();

  // If month is like "2026-05" or "2026-5"
  if (monthStr.includes("-")) {
    const parts = monthStr.split("-");
    year = Number(parts[0]) || year;
    const mNum = Number(parts[1]);
    monthStr = MONTH_NAMES[mNum - 1] || monthStr;
  } else if (!isNaN(Number(monthStr)) && Number(monthStr) >= 1 && Number(monthStr) <= 12) {
    monthStr = MONTH_NAMES[Number(monthStr) - 1];
  } else {
    // Check if valid name
    const found = MONTH_NAMES.find((m) => m.toLowerCase() === monthStr.toLowerCase());
    if (found) monthStr = found;
    else monthStr = MONTH_NAMES[dayjs().month()];
  }

  const monthIdx = MONTH_NAMES.indexOf(monthStr);
  const mNumStr = String(monthIdx + 1).padStart(2, "0");
  const startDate = `${year}-${mNumStr}-01`;
  const daysInMonth = dayjs(startDate).daysInMonth();
  const endDate = `${year}-${mNumStr}-${String(daysInMonth).padStart(2, "0")}`;

  return { monthStr, year, monthIdx, startDate, endDate, daysInMonth };
};

/**
 * Calculates payroll for a single staff member based on their:
 * 1. Shifts (shift type, required hours, weekly offs)
 * 2. Holidays (paid company and departmental public holidays)
 * 3. Attendance records (present, late, half day, absent, overtime hours)
 * 4. Approved leaves (paid vs unpaid)
 */
export const calculateSingleStaffPayroll = async (
  ds: DataSource,
  staff: Staff,
  monthInput: any,
  yearInput: any,
  customAdjustments: { bonus?: number; allowance?: number; deduction?: number; tax?: number } = {}
): Promise<CalculatedPayrollResult> => {
  const { monthStr, year, startDate, endDate, daysInMonth } = parseMonthAndYear(monthInput, yearInput);
  const staffId = staff.id;

  // 1. Fetch holidays in this month
  const holidayRepo = ds.getRepository(Holiday);
  const allHolidays = await holidayRepo.find({ where: { isActive: true } });
  const monthHolidays = allHolidays.filter((h) => {
    if (h.departmentId && staff.departmentId && h.departmentId !== staff.departmentId) return false;
    const hDate = dayjs(h.holidayDate);
    const inRange = hDate.isAfter(dayjs(startDate).subtract(1, "day")) && hDate.isBefore(dayjs(endDate).add(1, "day"));
    const sameMonth = hDate.month() === dayjs(startDate).month();
    return inRange || (h.isRecurring && sameMonth);
  });

  // 2. Fetch approved leaves for this month
  const leaveRepo = ds.getRepository(Leave);
  const leaves = await leaveRepo.find({
    where: { staffId },
  });
  const approvedLeaves = leaves.filter((l) => (l.status || "").toLowerCase() === "approved");

  // 3. Fetch attendance records for this month
  const attRepo = ds.getRepository(StaffAttendance);
  const attendanceRecords = await attRepo
    .createQueryBuilder("att")
    .where("att.staffId = :staffId", { staffId })
    .andWhere("att.date >= :startDate AND att.date <= :endDate", { startDate, endDate })
    .getMany();

  const attendanceMap = new Map<string, StaffAttendance>();
  for (const rec of attendanceRecords) {
    attendanceMap.set(rec.date, rec);
  }

  // 4. Resolve shift
  const activeShift = await resolveActiveShift(ds, staffId, startDate);
  const fallbackShift =
    activeShift ||
    (await ds.getRepository(Shift).find({ order: { createdAt: "ASC" }, take: 1 }))[0] ||
    null;
  const shiftName = fallbackShift?.shiftName || "General Shift";
  const shiftType = fallbackShift?.shiftType || "General";
  const shiftCode = fallbackShift?.shiftCode || "GEN";
  const requiredHours = Number(fallbackShift?.requiredHours || 8.0);

  // 5. Day-by-day evaluation across the month
  let presentDays = 0;
  let halfDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let holidayDays = 0;
  let weeklyOffDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let scheduledWorkingDays = 0;
  let totalWorkedHours = 0;
  let overtimeMinutes = 0;

  const todayStr = dayjs().format("YYYY-MM-DD");

  for (let day = 1; day <= daysInMonth; day++) {
    const curDateStr = `${year}-${String(dayjs(startDate).month() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isWeekly = isWeeklyOff(fallbackShift, curDateStr);
    const holidayMatch = monthHolidays.find((h) => {
      const hd = dayjs(h.holidayDate);
      return hd.date() === day && (hd.month() === dayjs(startDate).month() || h.isRecurring);
    });

    if (holidayMatch && holidayMatch.isPaid) {
      holidayDays++;
      continue;
    }

    if (isWeekly) {
      weeklyOffDays++;
      continue;
    }

    scheduledWorkingDays++;

    // Check if on approved leave
    const onLeave = approvedLeaves.find((l) => {
      const from = dayjs(l.fromDate).format("YYYY-MM-DD");
      const to = dayjs(l.toDate).format("YYYY-MM-DD");
      return curDateStr >= from && curDateStr <= to;
    });

    if (onLeave) {
      const lType = (onLeave.leaveType || "").toLowerCase();
      if (lType.includes("unpaid") || lType.includes("loss of pay") || lType.includes("lop")) {
        unpaidLeaveDays++;
      } else {
        paidLeaveDays++;
      }
      continue;
    }

    // Check attendance record
    const att = attendanceMap.get(curDateStr);
    if (att) {
      totalWorkedHours += Number(att.workingHours || 0);
      overtimeMinutes += Number(att.overtimeMinutes || 0);

      const status = att.status;
      if (status === AttendanceStatus.HALF_DAY) {
        halfDays++;
      } else if (status === AttendanceStatus.ABSENT) {
        absentDays++;
      } else if (status === AttendanceStatus.LATE) {
        presentDays++;
        lateDays++;
      } else if (
        status === AttendanceStatus.PRESENT ||
        status === AttendanceStatus.WORK_FROM_HOME ||
        status === AttendanceStatus.ON_DUTY ||
        status === AttendanceStatus.BUSINESS_TRIP
      ) {
        presentDays++;
      } else {
        // Unknown or Missed Punch
        if (Number(att.workingHours) >= 4) {
          presentDays++;
        } else {
          absentDays++;
        }
      }
    } else {
      // If date is in past or today and no punch, treated as absent/missed punch
      if (curDateStr <= todayStr) {
        absentDays++;
      }
    }
  }

  // 6. Payable days calculation
  const payableDays = Math.min(
    daysInMonth,
    Math.round((presentDays + halfDays * 0.5 + holidayDays + weeklyOffDays + paidLeaveDays) * 10) / 10
  );
  const unpaidDays = Math.max(0, daysInMonth - payableDays);
  const overtimeHours = Math.round((overtimeMinutes / 60) * 10) / 10;

  // 7. Salary & Compensations
  const monthlySalary = Number(staff.salary || 0);
  const dailyRate = daysInMonth > 0 ? Math.round((monthlySalary / daysInMonth) * 100) / 100 : 0;
  const hourlyRate = requiredHours > 0 ? Math.round((dailyRate / requiredHours) * 100) / 100 : 0;

  // Standard salary component splits (50% Basic, 20% HRA, 10% Conveyance, 20% Special)
  const basic = Math.round(monthlySalary * 0.5);
  const hra = Math.round(monthlySalary * 0.2);
  const conveyance = Math.round(monthlySalary * 0.1);
  const specialAllowance = Math.max(0, monthlySalary - (basic + hra + conveyance));

  // Shift differential allowance
  let shiftAllowance = 0;
  const lowerShift = shiftType.toLowerCase();
  if (lowerShift.includes("night")) {
    shiftAllowance = 2500;
  } else if (lowerShift.includes("evening")) {
    shiftAllowance = 1500;
  } else if (lowerShift.includes("rotational")) {
    shiftAllowance = 1000;
  }

  // Overtime pay (1.5x hourly rate)
  const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
  const bonus = Number(customAdjustments.bonus || 0);
  const additionalAllowance = Number(customAdjustments.allowance || 0);

  // Total gross earnings
  const grossSalary = monthlySalary + shiftAllowance + overtimePay + bonus + additionalAllowance;

  // Deductions:
  // LOP = unpaid days * daily rate
  const lopDeduction = Math.round(unpaidDays * dailyRate);

  // Late arrival penalty: Grace of 3 late arrivals allowed, then 0.25 day's wage per extra late arrival
  const penaltyLates = Math.max(0, lateDays - 3);
  const lateDeduction = Math.round(penaltyLates * (dailyRate * 0.25));

  // Statutory Deductions:
  // Provident fund = 12% of basic (standard statutory cap of ₹1,800/mo)
  const pfDeduction = Math.min(1800, Math.round(basic * 0.12));
  // Professional Tax = standard ₹200
  const ptDeduction = monthlySalary > 10000 ? 200 : 0;

  // Tax (TDS): standard 5% if gross > 50,000, or custom tax
  const defaultTax = grossSalary > 50000 ? Math.round((grossSalary - 50000) * 0.05) : 0;
  const taxDeduction = customAdjustments.tax !== undefined ? Number(customAdjustments.tax) : defaultTax;
  const customDeduction = Number(customAdjustments.deduction || 0);

  const totalDeductions = lopDeduction + lateDeduction + pfDeduction + ptDeduction + taxDeduction + customDeduction;
  const netSalary = Math.max(0, Math.round(grossSalary - totalDeductions));

  const attendanceDetails: AttendanceBreakdown = {
    totalCalendarDays: daysInMonth,
    scheduledWorkingDays,
    presentDays,
    halfDays,
    lateDays,
    absentDays,
    paidLeaveDays,
    unpaidLeaveDays,
    holidayDays,
    weeklyOffDays,
    payableDays,
    unpaidDays,
    totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
    overtimeMinutes,
    overtimeHours,
    shiftName,
    shiftType,
    shiftCode,
  };

  const salaryBreakdown: SalaryBreakdown = {
    basic,
    hra,
    conveyance,
    specialAllowance,
    shiftAllowance,
    overtimePay,
    bonus,
    grossSalary,
    dailyRate,
    hourlyRate,
    lopDeduction,
    lateDeduction,
    pfDeduction,
    ptDeduction,
    taxDeduction,
    customDeduction,
    totalDeductions,
    netSalary,
  };

  return {
    staffId: staff.id,
    staffName: staff.fullName,
    staffEmail: staff.email,
    departmentName: staff.department?.name,
    designationName: staff.designation?.title,
    month: monthStr,
    year,
    basicSalary: basic,

    allowance: hra + conveyance + specialAllowance + additionalAllowance,
    bonus,
    deduction: pfDeduction + ptDeduction + customDeduction,
    tax: taxDeduction,
    overtimePay,
    shiftAllowance,
    lopDeduction,
    lateDeduction,
    netSalary,
    attendanceDetails,
    salaryBreakdown,
  };

};
