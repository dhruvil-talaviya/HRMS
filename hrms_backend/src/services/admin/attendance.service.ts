import { getTenantConnection } from "../../connection/tenant.connection";
import {
  StaffAttendance,
  AttendanceStatus,
  ClockOutApproval,
} from "../../entity/tenant/staff/staff.attandance.entity";
import { Shift } from "../../entity/tenant/shift.entity";
import { ShiftAssignment } from "../../entity/tenant/shiftAssignment.entity";
import { AttendanceSettings } from "../../entity/tenant/attendanceSettings.entity";
import { Holiday } from "../../entity/tenant/holiday.entity";
import {
  AttendanceRequest,
  AttendanceRequestType,
} from "../../entity/tenant/attendanceRequest.entity";
import { Staff } from "../../entity/tenant/staff.entity";
import { Department } from "../../entity/tenant/department.entity";
import { Designation } from "../../entity/tenant/designation.entity";
import dayjs from "dayjs";
import { finalizeWorkingTime, resolveActiveShift } from "../../utils/attendance.util";


export const getShiftsService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);
  return await ds.getRepository(Shift).find({ order: { createdAt: "DESC" } });
};

export const createShiftService = async (dbName: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(Shift);
  const shift = repo.create(data);
  return await repo.save(shift);
};

export const getShiftByIdService = async (dbName: string, id: string) => {
  const ds = await getTenantConnection(dbName);
  const shift = await ds.getRepository(Shift).findOne({ where: { id } });
  if (!shift) throw new Error("Shift not found");
  return shift;
};

export const updateShiftService = async (dbName: string, id: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(Shift);
  const shift = await repo.findOne({ where: { id } });
  if (!shift) throw new Error("Shift not found");
  Object.assign(shift, data);
  return await repo.save(shift);
};

export const deleteShiftService = async (dbName: string, id: string) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(Shift);
  const shift = await repo.findOne({ where: { id } });
  if (!shift) throw new Error("Shift not found");
  await repo.delete(id);
};



export const getShiftAssignmentsService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);

  const results = await ds
    .getRepository(ShiftAssignment)
    .createQueryBuilder("sa")
    .leftJoin(Staff, "s", "s.id = sa.employeeId")
    .leftJoin(Department, "dept", "dept.id = s.departmentId")
    .leftJoin(Shift, "shift", "shift.id::text = sa.shiftId")
    .select("sa.id", "id")
    .addSelect("sa.employeeId", "employeeId")
    .addSelect("sa.shiftId", "shiftId")
    .addSelect("sa.effectiveFrom", "effectiveFrom")
    .addSelect("sa.effectiveTo", "effectiveTo")
    .addSelect("sa.status", "status")
    .addSelect("sa.remarks", "remarks")
    .addSelect("s.fullName", "employeeName")
    .addSelect("dept.name", "departmentName")
    .addSelect("shift.shiftName", "shiftName")
    .orderBy("sa.createdAt", "DESC")
    .getRawMany();

  return results;
};

export const createShiftAssignmentService = async (dbName: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(ShiftAssignment);
  const staffRepo = ds.getRepository(Staff);

  const { assignmentType, employeeId, bulkEmployeeIds, departmentId, shiftId, effectiveFrom, effectiveTo, remarks, assignedBy } = data;

  let employeeIds: number[] = [];

  if (assignmentType === "Single" && employeeId) {
    employeeIds = [Number(employeeId)];
  } else if (assignmentType === "Bulk" && bulkEmployeeIds?.length) {
    employeeIds = bulkEmployeeIds.map(Number);
  } else if (assignmentType === "Department" && departmentId) {
    const staff = await staffRepo.find({ where: { departmentId } });
    employeeIds = staff.map((s) => s.id);
  }

  if (!employeeIds.length) throw new Error("No employees selected");

  for (const empId of employeeIds) {
    await repo
      .createQueryBuilder()
      .update(ShiftAssignment)
      .set({ status: "Inactive", effectiveTo: effectiveFrom })
      .where("employeeId = :empId AND status = :status", { empId, status: "Active" })
      .execute();
  }

  const assignments = employeeIds.map((empId) =>
    repo.create({
      employeeId: empId,
      shiftId,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      status: "Active",
      assignedBy: assignedBy || null,
      remarks: remarks || null,
    })
  );

  return await repo.save(assignments);
};

export const updateShiftAssignmentService = async (dbName: string, id: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(ShiftAssignment);
  const assignment = await repo.findOne({ where: { id } });
  if (!assignment) throw new Error("Assignment not found");
  Object.assign(assignment, data);
  return await repo.save(assignment);
};

export const deleteShiftAssignmentService = async (dbName: string, id: string) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(ShiftAssignment);
  const assignment = await repo.findOne({ where: { id } });
  if (!assignment) throw new Error("Shift assignment not found");
  await repo.delete(id);
};



export const getAttendanceSettingsService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(AttendanceSettings);
  let settings = await repo.findOne({ where: { id: 1 } });
  if (!settings) {
    settings = repo.create({ id: 1 });
    return await repo.save(settings);
  }
  return settings;
};

export const updateAttendanceSettingsService = async (dbName: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(AttendanceSettings);
  const existing = await repo.findOne({ where: { id: 1 } });
  if (!existing) {
    const settings = repo.create({ id: 1, ...data });
    return await repo.save(settings);
  }
  Object.assign(existing, data);
  return await repo.save(existing);
};



export const getHolidaysService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);
  return await ds.getRepository(Holiday).find({ order: { holidayDate: "ASC" } });
};

export const createHolidayService = async (dbName: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(Holiday);
  const holiday = repo.create(data);
  return await repo.save(holiday);
};

export const updateHolidayService = async (dbName: string, id: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(Holiday);
  const holiday = await repo.findOne({ where: { id } });
  if (!holiday) throw new Error("Holiday not found");
  Object.assign(holiday, data);
  return await repo.save(holiday);
};

export const deleteHolidayService = async (dbName: string, id: string) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(Holiday);
  const holiday = await repo.findOne({ where: { id } });
  if (!holiday) throw new Error("Holiday not found");
  await repo.delete(id);
};



export const getAttendanceRecordsService = async (dbName: string, filters: any) => {
  const ds = await getTenantConnection(dbName);

  let qb = ds
    .getRepository(StaffAttendance)
    .createQueryBuilder("att")
    .leftJoin(Staff, "s", "s.id = att.staffId")
    .leftJoin(Department, "dept", "dept.id = s.departmentId")
    .leftJoin(Designation, "desig", "desig.id = s.designationId")
    .leftJoin(Shift, "shift", "shift.id::text = att.shiftId")
    .select("att.id", "id")
    .addSelect("att.date", "date")
    .addSelect("att.clockIn", "clockIn")
    .addSelect("att.clockOut", "clockOut")
    .addSelect("att.status", "status")
    .addSelect("att.workingHours", "workingHours")
    .addSelect("att.lateMinutes", "lateMinutes")
    .addSelect("att.overtimeMinutes", "overtimeMinutes")
    .addSelect("att.breakDuration", "breakDuration")
    .addSelect("att.staffId", "staffId")
    .addSelect("s.fullName", "employeeName")
    .addSelect("dept.name", "departmentName")
    .addSelect("desig.title", "designationName")
    .addSelect("shift.shiftName", "shiftName");

  if (filters.date) {
    qb = qb.where("att.date = :date", { date: filters.date });
  }
  if (filters.status && filters.status !== "All") {
    qb = qb.andWhere("att.status = :status", { status: filters.status });
  }
  if (filters.shiftId) {
    qb = qb.andWhere("att.shiftId = :shiftId", { shiftId: filters.shiftId });
  }
  if (filters.departmentId) {
    qb = qb.andWhere("s.departmentId = :departmentId", { departmentId: filters.departmentId });
  }

  const records = await qb.orderBy("att.date", "DESC").getRawMany();

  return records.map((r) => ({
    ...r,
    employeeCode: `EMP${String(r.staffId || "").padStart(4, "0")}`,
  }));
};

export const updateAttendanceRecordService = async (dbName: string, id: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(StaffAttendance);
  const record = await repo.findOne({ where: { id } });
  if (!record) throw new Error("Attendance record not found");

  // Normalise date-time strings coming from the admin edit form.
  if (data.clockIn) data.clockIn = new Date(data.clockIn);
  if (data.clockOut) data.clockOut = new Date(data.clockOut);

  Object.assign(record, data);
  record.isManual = true; // admin correction
  return await repo.save(record);
};

/**
 * Manually create an attendance record (admin manual entry) for a given date.
 */
export const createManualAttendanceService = async (dbName: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(StaffAttendance);
  const settingsRepo = ds.getRepository(AttendanceSettings);

  const staffId = Number(data.staffId);
  const date = data.date;
  if (!staffId || !date) throw new Error("staffId and date are required");

  let record = await repo.findOne({ where: { staffId, date } });
  if (!record) record = repo.create({ staffId, date, breaks: [] });

  if (data.clockIn) record.clockIn = new Date(data.clockIn);
  if (data.clockOut) record.clockOut = new Date(data.clockOut);
  record.isManual = true;
  record.notes = data.notes || record.notes || null;

  const shift = data.shiftId
    ? await ds.getRepository(Shift).findOne({ where: { id: data.shiftId } })
    : await resolveActiveShift(ds, staffId, date);
  record.shiftId = shift ? shift.id : record.shiftId || null;

  const settings =
    (await settingsRepo.findOne({ where: { id: 1 } })) || settingsRepo.create({ id: 1 });

  if (record.clockIn && record.clockOut) {
    const result = finalizeWorkingTime(record, shift, settings);
    record.workingHours = result.workingHours;
    record.breakDuration = result.breakDuration;
    record.overtimeMinutes = result.overtimeMinutes;
    record.earlyExitMinutes = result.earlyExitMinutes;
    record.status = data.status || result.status;
  } else {
    record.status = data.status || record.status;
  }
  record.clockOutApproval = ClockOutApproval.APPROVED;
  return repo.save(record);
};



export const getAttendanceMetricsService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);
  const today = dayjs().format("YYYY-MM-DD");

  const [totalEmployees, activeShifts, pendingRequests, pendingClockOuts, todayRecords] =
    await Promise.all([
      ds.getRepository(Staff).count({ where: { status: "Active" } }),
      ds.getRepository(Shift).count({ where: { isActive: true } }),
      ds.getRepository(AttendanceRequest).count({ where: { status: "Pending" } }),
      ds.getRepository(StaffAttendance).count({
        where: { date: today, clockOutApproval: ClockOutApproval.PENDING },
      }),
      ds.getRepository(StaffAttendance).find({ where: { date: today } }),
    ]);

  const presentToday = todayRecords.filter(
    (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE
  ).length;
  const absentToday = todayRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
  const lateEmployees = todayRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
  const onLeave = todayRecords.filter((r) => r.status === AttendanceStatus.ON_LEAVE).length;
  const halfDay = todayRecords.filter((r) => r.status === AttendanceStatus.HALF_DAY).length;
  const workFromHome = todayRecords.filter(
    (r) => r.status === AttendanceStatus.WORK_FROM_HOME
  ).length;
  const attendancePercentage =
    totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  return {
    totalEmployees,
    activeShifts,
    pendingRequests,
    pendingClockOuts,
    presentToday,
    absentToday,
    lateEmployees,
    onLeave,
    halfDay,
    workFromHome,
    attendancePercentage,
  };
};


export const getAttendanceChartsService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);
  const today = dayjs();

  
  const monthlyTrend: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = today.subtract(i, "month");
    const start = month.startOf("month").format("YYYY-MM-DD");
    const end = month.endOf("month").format("YYYY-MM-DD");

    const count = await ds
      .getRepository(StaffAttendance)
      .createQueryBuilder("att")
      .where("att.date >= :start AND att.date <= :end", { start, end })
      .andWhere("att.status IN (:...statuses)", {
        statuses: [
          AttendanceStatus.PRESENT,
          AttendanceStatus.LATE,
          AttendanceStatus.HALF_DAY,
          AttendanceStatus.WORK_FROM_HOME,
        ],
      })
      .getCount();

    monthlyTrend.push({ name: month.format("MMM"), present: count });
  }


  const weeklyTrend: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = today.subtract(i, "day");
    const dateStr = day.format("YYYY-MM-DD");

    const count = await ds
      .getRepository(StaffAttendance)
      .createQueryBuilder("att")
      .where("att.date = :date", { date: dateStr })
      .andWhere("att.status IN (:...statuses)", {
        statuses: [
          AttendanceStatus.PRESENT,
          AttendanceStatus.LATE,
          AttendanceStatus.HALF_DAY,
          AttendanceStatus.WORK_FROM_HOME,
        ],
      })
      .getCount();

    weeklyTrend.push({ name: day.format("ddd"), value: count });
  }


  const deptRows = await ds
    .getRepository(Staff)
    .createQueryBuilder("s")
    .leftJoin(Department, "dept", "dept.id = s.departmentId")
    .leftJoin(
      StaffAttendance,
      "att",
      "att.staffId = s.id AND att.date = :today",
      { today: today.format("YYYY-MM-DD") }
    )
    .select("dept.name", "deptName")
    .addSelect("COUNT(DISTINCT s.id)", "total")
    .addSelect(
      `COUNT(DISTINCT CASE WHEN att.status IN ('${AttendanceStatus.PRESENT}','${AttendanceStatus.LATE}','${AttendanceStatus.HALF_DAY}','${AttendanceStatus.WORK_FROM_HOME}') THEN att.id END)`,
      "present"
    )
    .where("s.status = 'Active'")
    .groupBy("dept.name")
    .getRawMany();

  const departmentAttendance = deptRows
    .filter((r) => r.deptName)
    .map((r) => ({
      name: r.deptName,
      value:
        Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0,
    }));

  const shiftRows = await ds
    .getRepository(ShiftAssignment)
    .createQueryBuilder("sa")
    .leftJoin(Shift, "shift", "shift.id::text = sa.shiftId")
    .select("shift.shiftName", "name")
    .addSelect("COUNT(sa.id)", "value")
    .where("sa.status = 'Active'")
    .groupBy("shift.shiftName")
    .getRawMany();

  const shiftUtilization = shiftRows
    .filter((r) => r.name)
    .map((r) => ({ name: r.name, value: Number(r.value) }));

  return { monthlyTrend, weeklyTrend, departmentAttendance, shiftUtilization };
};



export const getAttendanceRequestsService = async (dbName: string) => {
  const ds = await getTenantConnection(dbName);

  const results = await ds
    .getRepository(AttendanceRequest)
    .createQueryBuilder("req")
    .leftJoin(Staff, "s", "s.id = req.employeeId")
    .leftJoin(Department, "dept", "dept.id = s.departmentId")
    .select("req.id", "id")
    .addSelect("req.employeeId", "employeeId")
    .addSelect("req.requestType", "requestType")
    .addSelect("req.requestDate", "requestDate")
    .addSelect("req.status", "status")
    .addSelect("req.reason", "reason")
    .addSelect("req.payload", "payload")
    .addSelect("req.approvalComment", "approvalComment")
    .addSelect("req.rejectionComment", "rejectionComment")
    .addSelect("req.approvedBy", "approvedBy")
    .addSelect("req.approvedAt", "approvedAt")
    .addSelect("req.createdAt", "createdAt")
    .addSelect("s.fullName", "employeeName")
    .addSelect("dept.name", "departmentName")
    .orderBy("req.createdAt", "DESC")
    .getRawMany();

  return results;
};

export const getAttendanceRequestByIdService = async (dbName: string, id: string) => {
  const ds = await getTenantConnection(dbName);
  const request = await ds.getRepository(AttendanceRequest).findOne({ where: { id } });
  if (!request) throw new Error("Request not found");
  return request;
};

/**
 * Apply an approved request's effect to the underlying attendance record.
 * Upserts the StaffAttendance row for (employee, date) and recomputes hours.
 */
const applyApprovedRequest = async (ds: any, request: AttendanceRequest) => {
  const attRepo = ds.getRepository(StaffAttendance);
  const settingsRepo = ds.getRepository(AttendanceSettings);
  const settings =
    (await settingsRepo.findOne({ where: { id: 1 } })) || settingsRepo.create({ id: 1 });

  const staffId = request.employeeId;
  const date = request.requestDate;
  const payload = request.payload || {};

  // Clock-out approval: just release the held record.
  if (request.requestType === AttendanceRequestType.CLOCK_OUT_APPROVAL) {
    const rec = await attRepo.findOne({ where: { staffId, date } });
    if (rec) {
      rec.clockOutApproval = ClockOutApproval.APPROVED;
      await attRepo.save(rec);
    }
    return;
  }

  // Shift change is handled via Shift Assignment, not the attendance row.
  if (request.requestType === AttendanceRequestType.SHIFT_CHANGE) return;

  let rec = await attRepo.findOne({ where: { staffId, date } });
  if (!rec) {
    rec = attRepo.create({ staffId, date, breaks: [] });
  }

  rec.isManual = true;
  rec.notes = request.reason;
  if (payload.shiftId) rec.shiftId = payload.shiftId;
  if (!rec.shiftId) {
    const shift = await resolveActiveShift(ds, staffId, date);
    rec.shiftId = shift ? shift.id : null;
  }
  if (payload.clockIn) rec.clockIn = new Date(payload.clockIn);
  if (payload.clockOut) rec.clockOut = new Date(payload.clockOut);

  // Explicit status (WFH / On Duty / Business Trip) wins; otherwise recompute.
  if (payload.status) {
    rec.status = payload.status;
  } else if (request.requestType === AttendanceRequestType.WORK_FROM_HOME) {
    rec.status = AttendanceStatus.WORK_FROM_HOME;
  } else if (request.requestType === AttendanceRequestType.ON_DUTY) {
    rec.status = AttendanceStatus.ON_DUTY;
  }

  if (rec.clockIn && rec.clockOut) {
    const shift = rec.shiftId
      ? await ds.getRepository(Shift).findOne({ where: { id: rec.shiftId } })
      : null;
    const result = finalizeWorkingTime(rec, shift, settings);
    rec.workingHours = result.workingHours;
    rec.breakDuration = result.breakDuration;
    rec.overtimeMinutes = result.overtimeMinutes;
    rec.earlyExitMinutes = result.earlyExitMinutes;
    // Keep an explicit override status when provided.
    if (!payload.status && ![
      AttendanceStatus.WORK_FROM_HOME,
      AttendanceStatus.ON_DUTY,
    ].includes(rec.status as AttendanceStatus)) {
      rec.status = result.status;
    }
  }

  rec.clockOutApproval = ClockOutApproval.APPROVED;
  await attRepo.save(rec);
};

export const approveAttendanceRequestService = async (
  dbName: string,
  id: string,
  data: any
) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(AttendanceRequest);
  const request = await repo.findOne({ where: { id } });
  if (!request) throw new Error("Request not found");

  request.status = "Approved";
  request.approvalComment = data.comment || null;
  request.approvedBy = data.approvedBy || null;
  request.approvedAt = new Date();

  const saved = await repo.save(request);

  try {
    await applyApprovedRequest(ds, request);
  } catch (e) {
    // Approval succeeds even if the record could not be auto-applied; surfaced via logs.
    console.error("Failed to apply approved attendance request:", e);
  }

  return saved;
};

export const rejectAttendanceRequestService = async (
  dbName: string,
  id: string,
  data: any
) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(AttendanceRequest);
  const request = await repo.findOne({ where: { id } });
  if (!request) throw new Error("Request not found");

  request.status = "Rejected";
  request.rejectionComment = data.comment || null;

  return await repo.save(request);
};
