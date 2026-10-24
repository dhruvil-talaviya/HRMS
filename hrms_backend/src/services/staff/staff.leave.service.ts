import { getTenantConnection } from "../../connection/tenant.connection";
import { Leave } from "../../entity/tenant/staff/staff.leave.entity";

export const applyLeaveService = async (
  dbName: string,
  staffId: number,
  data: any
) => {
  if (!data?.leaveType || !data.leaveType.trim()) {
    throw new Error("leave type is required");
  }
  if (!data?.fromDate || !data?.toDate) {
    throw new Error("start date and end date are required");
  }
  if (!data?.reason || !data.reason.trim()) {
    throw new Error("reason is required");
  }

  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error("invalid date format");
  }
  if (from > to) {
    throw new Error("start date cannot be after end date");
  }

  const dataSource = await getTenantConnection(dbName);
  const leaveRepo = dataSource.getRepository(Leave);

  // Check for overlapping pending or approved leave requests
  const overlap = await leaveRepo
    .createQueryBuilder("l")
    .where("l.staffId = :staffId", { staffId })
    .andWhere("l.status IN (:...statuses)", { statuses: ["PENDING", "APPROVED"] })
    .andWhere("l.fromDate <= :toDate AND l.toDate >= :fromDate", {
      fromDate: data.fromDate,
      toDate: data.toDate,
    })
    .getOne();

  if (overlap) {
    throw new Error("overlapping leave request already exists for this date range");
  }

  const leave = leaveRepo.create({
    staffId,
    leaveType: data.leaveType.trim(),
    fromDate: data.fromDate,
    toDate: data.toDate,
    reason: data.reason.trim(),
    status: "PENDING",
  });

  return await leaveRepo.save(leave);
};



export const getLeaveService = async (
  dbName: string,
  staffId: number
) => {
  const dataSource = await getTenantConnection(dbName);

  const leaveRepo = dataSource.getRepository(Leave);

  const leaves = await leaveRepo.find({
    where: {
      staffId,
    },
    order: {
      createdAt: "DESC",
    },
  });

  return leaves;
};