import { getTenantConnection } from "../../connection/tenant.connection";
import { ShiftAssignment } from "../../entity/tenant/shiftAssignment.entity";
import { Staff } from "../../entity/tenant/staff.entity";
import { Department } from "../../entity/tenant/department.entity";
import { Shift } from "../../entity/tenant/shift.entity";

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
    .addSelect("s.email", "employeeEmail")
    .addSelect("dept.name", "departmentName")
    .addSelect("shift.shiftName", "shiftName")
    .addSelect("shift.startTime", "startTime")
    .addSelect("shift.endTime", "endTime")
    .orderBy("sa.createdAt", "DESC")
    .getRawMany();

  return results;
};

export const createShiftAssignmentService = async (dbName: string, data: any) => {
  const ds = await getTenantConnection(dbName);
  const repo = ds.getRepository(ShiftAssignment);
  const staffRepo = ds.getRepository(Staff);

  const {
    assignmentType,
    employeeId,
    bulkEmployeeIds,
    departmentId,
    shiftId,
    effectiveFrom,
    effectiveTo,
    remarks,
    assignedBy,
  } = data;

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

