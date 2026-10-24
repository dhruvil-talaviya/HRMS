import dayjs from "dayjs";
import { getTenantConnection } from "../connection/tenant.connection";
import { Payroll } from "../entity/tenant/payroll.entity";
import { Staff } from "../entity/tenant/staff.entity";
import {
  calculateSingleStaffPayroll,
  parseMonthAndYear,
} from "./payrollCalculation.service";

/**
 * Preview attendance-based, shift-aware, and holiday-aware payroll for a staff member or all staff
 * without saving to database.
 */
export const previewPayrollService = async (
  dbName: string,
  data: { staffId?: number; month?: string; year?: number }
) => {
  const ds = await getTenantConnection(dbName);
  const staffRepo = ds.getRepository(Staff);

  const month = data.month;
  const year = data.year;

  if (data.staffId) {
    const staff = await staffRepo.findOne({
      where: { id: Number(data.staffId) },
      relations: { department: true, designation: true },
    });
    if (!staff) throw new Error("Staff member not found");
    return [await calculateSingleStaffPayroll(ds, staff, month, year)];
  }

  // Preview for all active staff
  const allStaff = await staffRepo.find({
    where: { status: "Active" },
    relations: { department: true, designation: true },
  });

  const previews = [];
  for (const staff of allStaff) {
    const calc = await calculateSingleStaffPayroll(ds, staff, month, year);
    previews.push(calc);
  }
  return previews;
};

/**
 * Generate or recalculate payroll records for all (or specified) active staff for a month/year.
 * Automatically ties into StaffAttendance, Shifts, Holidays, and Leaves!
 */
export const generateMonthlyPayrollService = async (
  dbName: string,
  data: { month: string; year: number; staffIds?: number[] }
) => {
  const ds = await getTenantConnection(dbName);
  const staffRepo = ds.getRepository(Staff);
  const payrollRepo = ds.getRepository(Payroll);

  const { monthStr, year } = parseMonthAndYear(data.month, data.year);

  let targetStaff: Staff[] = [];
  if (data.staffIds && data.staffIds.length > 0) {
    targetStaff = await staffRepo
      .createQueryBuilder("s")
      .where("s.id IN (:...ids)", { ids: data.staffIds })
      .leftJoinAndSelect("s.department", "department")
      .leftJoinAndSelect("s.designation", "designation")
      .getMany();
  } else {
    targetStaff = await staffRepo.find({
      where: { status: "Active" },
      relations: { department: true, designation: true },
    });
  }

  if (targetStaff.length === 0) {
    throw new Error("No active staff found to generate payroll for.");
  }

  const generatedRecords: Payroll[] = [];

  for (const staff of targetStaff) {
    const calc = await calculateSingleStaffPayroll(ds, staff, monthStr, year);

    // Check if payroll already exists for this staff in this month/year
    let payroll = await payrollRepo.findOne({
      where: {
        staffId: staff.id,
        month: monthStr,
        year,
      },
    });

    if (!payroll) {
      payroll = payrollRepo.create({
        staffId: staff.id,
        month: monthStr,
        year,
        status: "Pending",
      });
    }

    payroll.basicSalary = calc.basicSalary;
    payroll.allowance = calc.allowance;
    payroll.bonus = calc.bonus;
    payroll.deduction = calc.deduction;
    payroll.tax = calc.tax;
    payroll.overtimePay = calc.overtimePay;
    payroll.shiftAllowance = calc.shiftAllowance;
    payroll.lopDeduction = calc.lopDeduction;
    payroll.lateDeduction = calc.lateDeduction;
    payroll.netSalary = calc.netSalary;
    payroll.attendanceDetails = calc.attendanceDetails;
    payroll.salaryBreakdown = calc.salaryBreakdown;

    const saved = await payrollRepo.save(payroll);
    generatedRecords.push(saved);
  }

  return generatedRecords;
};

/**
 * Create or recalculate single payroll record with attendance math
 */
export const createPayrollService = async (
  dbName: string,
  data: any
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);
  const staffRepo = ds.getRepository(Staff);

  const staff = await staffRepo.findOne({
    where: { id: Number(data.staffId) },
    relations: { department: true, designation: true },
  });

  if (!staff) {
    throw new Error("Staff member not found");
  }

  const { monthStr, year } = parseMonthAndYear(data.month, data.year);
  const calc = await calculateSingleStaffPayroll(ds, staff, monthStr, year, {
    bonus: data.bonus,
    allowance: data.allowance,
    deduction: data.deduction,
    tax: data.tax,
  });

  let payroll = await payrollRepo.findOne({
    where: {
      staffId: staff.id,
      month: monthStr,
      year,
    },
  });

  if (!payroll) {
    payroll = payrollRepo.create({
      staffId: staff.id,
      month: monthStr,
      year,
      status: data.status || "Pending",
    });
  }

  payroll.basicSalary = calc.basicSalary;
  payroll.allowance = calc.allowance;
  payroll.bonus = calc.bonus;
  payroll.deduction = calc.deduction;
  payroll.tax = calc.tax;
  payroll.overtimePay = calc.overtimePay;
  payroll.shiftAllowance = calc.shiftAllowance;
  payroll.lopDeduction = calc.lopDeduction;
  payroll.lateDeduction = calc.lateDeduction;
  payroll.netSalary = calc.netSalary;
  payroll.attendanceDetails = calc.attendanceDetails;
  payroll.salaryBreakdown = calc.salaryBreakdown;
  if (data.remarks) payroll.remarks = data.remarks;

  return await payrollRepo.save(payroll);
};

export const getAllPayrollService = async (
  dbName: string,
  filters: { month?: string; year?: number; status?: string } = {}
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);

  const qb = payrollRepo
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.staff", "staff")
    .leftJoinAndSelect("staff.department", "department")
    .leftJoinAndSelect("staff.designation", "designation");

  if (filters.month && filters.month !== "All") {
    const { monthStr } = parseMonthAndYear(filters.month, filters.year);
    qb.andWhere("p.month = :month", { month: monthStr });
  }

  if (filters.year) {
    qb.andWhere("p.year = :year", { year: Number(filters.year) });
  }

  if (filters.status && filters.status !== "All") {
    qb.andWhere("p.status = :status", { status: filters.status });
  }

  return await qb.orderBy("p.id", "DESC").getMany();
};

export const getPayrollByIdService = async (
  dbName: string,
  id: number
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);

  return await payrollRepo.findOne({
    where: { id },
    relations: {
      staff: {
        department: true,
        designation: true,
      },
    },
  });
};

/**
 * Returns latest payroll and history for the logged-in staff member
 */
export const getMyPayrollService = async (
  dbName: string,
  staffId: number
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);
  const staffRepo = ds.getRepository(Staff);

  const staff = await staffRepo.findOne({
    where: { id: staffId },
    relations: { department: true, designation: true },
  });

  if (!staff) throw new Error("Staff record not found");

  const history = await payrollRepo.find({
    where: { staffId },
    order: { year: "DESC", id: "DESC" },
  });

  // Current month calculation preview if no processed record exists yet
  const currentMonthCalc = await calculateSingleStaffPayroll(
    ds,
    staff,
    dayjs().format("MMMM"),
    dayjs().year()
  );

  return {
    staff,
    currentPayroll: history.length > 0 ? history[0] : currentMonthCalc,
    currentPreview: currentMonthCalc,
    history,
  };
};

export const updatePayrollService = async (
  dbName: string,
  id: number,
  data: any
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);

  const payroll = await payrollRepo.findOne({
    where: { id },
    relations: { staff: true },
  });

  if (!payroll) {
    throw new Error("Payroll record not found");
  }

  if (data.allowance !== undefined) payroll.allowance = Number(data.allowance);
  if (data.bonus !== undefined) payroll.bonus = Number(data.bonus);
  if (data.deduction !== undefined) payroll.deduction = Number(data.deduction);
  if (data.tax !== undefined) payroll.tax = Number(data.tax);
  if (data.overtimePay !== undefined) payroll.overtimePay = Number(data.overtimePay);
  if (data.shiftAllowance !== undefined) payroll.shiftAllowance = Number(data.shiftAllowance);
  if (data.lopDeduction !== undefined) payroll.lopDeduction = Number(data.lopDeduction);
  if (data.lateDeduction !== undefined) payroll.lateDeduction = Number(data.lateDeduction);
  if (data.remarks !== undefined) payroll.remarks = data.remarks;
  if (data.status !== undefined) payroll.status = data.status;

  const totalEarnings =
    Number(payroll.basicSalary) +
    Number(payroll.allowance) +
    Number(payroll.bonus) +
    Number(payroll.overtimePay) +
    Number(payroll.shiftAllowance);

  const totalDeductions =
    Number(payroll.deduction) +
    Number(payroll.tax) +
    Number(payroll.lopDeduction) +
    Number(payroll.lateDeduction);

  payroll.netSalary = Math.max(0, Math.round(totalEarnings - totalDeductions));

  return await payrollRepo.save(payroll);
};

export const processPayrollService = async (
  dbName: string,
  id: number
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);

  const payroll = await payrollRepo.findOne({
    where: { id },
  });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  payroll.status = "Processed";
  payroll.processedAt = new Date();
  payroll.paymentDate = dayjs().format("YYYY-MM-DD");

  return await payrollRepo.save(payroll);
};

export const deletePayrollService = async (
  dbName: string,
  id: number
) => {
  const ds = await getTenantConnection(dbName);
  const payrollRepo = ds.getRepository(Payroll);

  const payroll = await payrollRepo.findOne({
    where: { id },
  });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  await payrollRepo.delete(id);
};