import bcrypt from "bcrypt";
import DatabaseConnection from "../connection/postgresql.connection";
import { getTenantConnection } from "../connection/tenant.connection";
import { Staff } from "../entity/tenant/staff.entity";
import { Users } from "../entity/master/users.entity";
import { Leave } from "../entity/tenant/staff/staff.leave.entity";
import { Department } from "../entity/tenant/department.entity";
import { Designation } from "../entity/tenant/designation.entity";

const sanitizeStaff = (staff: any) => {
  if (!staff) return null;
  const clone = { ...staff };
  delete clone.password;
  return clone;
};

export const createStaffService = async (dbName: string, data: any) => {
  const dataSource = await getTenantConnection(dbName);
  const staffRepo = dataSource.getRepository(Staff);

  if (!data.email || !data.email.trim()) {
    throw new Error("email is required");
  }

  const existing = await staffRepo.findOne({
    where: { email: data.email.trim().toLowerCase() },
  });
  if (existing) {
    throw new Error("employee with this email already exists");
  }

  const defaultPassword = data.password && data.password.trim().length >= 6 ? data.password.trim() : "Password@123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const staff = staffRepo.create({
    fullName: data.fullName?.trim() || "",
    email: data.email.trim().toLowerCase(),
    role: data.role || "EMPLOYEE",
    phone: data.phone || "",
    password: hashedPassword,
    gender: data.gender || "",
    departmentId: data.departmentId ? String(data.departmentId) : undefined,
    designationId: data.designationId ? String(data.designationId) : undefined,
    salary: data.salary ? Number(data.salary) : 0,
    dob: data.dob || null,
    joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],
    address: data.address || "",
    accessRoleId: data.accessRoleId ? String(data.accessRoleId) : undefined,
    status: data.status || "InActive",
    isFirstLogin: true,
  } as any);

  const savedStaff = await staffRepo.save(staff);
  return sanitizeStaff(savedStaff);
};

export const getAllStaffService = async (dbName: string) => {
  const dataSource = await getTenantConnection(dbName);
  const staffRepo = dataSource.getRepository(Staff);

  const staffList = await staffRepo.find({
    relations: { department: true, designation: true },
    order: { id: "ASC" },
  });

  return staffList.map(sanitizeStaff);
};

export const updateStaffStatusService = async (
  dbName: string,
  id: number,
  status: string,
) => {
  const dataSource = await getTenantConnection(dbName);
  const staffRepo = dataSource.getRepository(Staff);
  const staff = await staffRepo.findOne({
    where: { id: Number(id) },
  });

  if (!staff) {
    throw new Error("staff not found");
  }

  staff.status = status;
  const saved = await staffRepo.save(staff);
  return sanitizeStaff(saved);
};

export const setupPasswordService = async (
  dbName: string,
  staffId: number | string,
  newPassword: string,
  isStaff: boolean = true,
  userEmail?: string
) => {
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    throw new Error("password must be at least 6 characters");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // If flagged as non-staff (tenant admin), check master DB first
  if (!isStaff) {
    const masterRepo = DatabaseConnection.getRepository(Users);
    const masterUser = await masterRepo.findOne({
      where: [{ id: String(staffId) }, ...(userEmail ? [{ email: userEmail }] : [])],
    });
    if (masterUser) {
      masterUser.password = hashedPassword;
      await masterRepo.save(masterUser);
      return { id: masterUser.id, email: masterUser.email, name: masterUser.name };
    }
  }

  // Attempt to find and update staff member in tenant DB
  try {
    const dataSource = await getTenantConnection(dbName);
    const staffRepo = dataSource.getRepository(Staff);

    let staff = null;
    if (!isNaN(Number(staffId))) {
      staff = await staffRepo.findOne({ where: { id: Number(staffId) } });
    }
    if (!staff && userEmail) {
      staff = await staffRepo.findOne({ where: { email: userEmail.toLowerCase() } });
    }

    if (staff) {
      staff.password = hashedPassword;
      staff.status = "Active";
      staff.isFirstLogin = false;
      const saved = await staffRepo.save(staff);
      return sanitizeStaff(saved);
    }
  } catch {
    // If tenant connection fails, fall back to master user check
  }

  // Fallback: Check master DB Users table
  const masterRepo = DatabaseConnection.getRepository(Users);
  const masterUser = await masterRepo.findOne({
    where: [{ id: String(staffId) }, ...(userEmail ? [{ email: userEmail }] : [])],
  });

  if (masterUser) {
    masterUser.password = hashedPassword;
    await masterRepo.save(masterUser);
    return { id: masterUser.id, email: masterUser.email, name: masterUser.name };
  }

  throw new Error("user not found");
};

export const getStaffByIdService = async (dbName: string, id: number) => {
  const dataSource = await getTenantConnection(dbName);

  const staffRepo = dataSource.getRepository(Staff);
  const departmentRepo = dataSource.getRepository(Department);
  const designationRepo = dataSource.getRepository(Designation);

  const staff = await staffRepo.findOne({
    where: { id: Number(id) },
  });

  if (!staff) {
    return null;
  }

  const department = staff.departmentId
    ? await departmentRepo.findOne({ where: { id: String(staff.departmentId) } })
    : null;

  const designation = staff.designationId
    ? await designationRepo.findOne({ where: { id: String(staff.designationId) } })
    : null;

  const clean = sanitizeStaff(staff);
  return {
    ...clean,
    departmentName: department?.name || "",
    designationName: designation?.title || "",
  };
};

export const updateStaffService = async (
  dbName: string,
  id: number,
  data: any,
) => {
  const dataSource = await getTenantConnection(dbName);
  const staffRepo = dataSource.getRepository(Staff);
  const staff = await staffRepo.findOne({
    where: { id: Number(id) },
  });

  if (!staff) {
    throw new Error("staff not found");
  }

  if (data.email && data.email.trim().toLowerCase() !== staff.email) {
    const existing = await staffRepo.findOne({
      where: { email: data.email.trim().toLowerCase() },
    });
    if (existing && existing.id !== staff.id) {
      throw new Error("email is already in use by another staff member");
    }
    staff.email = data.email.trim().toLowerCase();
  }

  if (data.fullName !== undefined) staff.fullName = data.fullName;
  if (data.phone !== undefined) staff.phone = data.phone;
  if (data.gender !== undefined) staff.gender = data.gender;
  if (data.departmentId !== undefined) staff.departmentId = String(data.departmentId);
  if (data.designationId !== undefined) staff.designationId = String(data.designationId);
  if (data.salary !== undefined) staff.salary = Number(data.salary);
  if (data.dob !== undefined) staff.dob = data.dob;
  if (data.joiningDate !== undefined) staff.joiningDate = data.joiningDate;
  if (data.address !== undefined) staff.address = data.address;
  if (data.accessRoleId !== undefined) staff.accessRoleId = String(data.accessRoleId);
  if (data.status !== undefined) staff.status = data.status;

  if (data.password && data.password.trim()) {
    staff.password = await bcrypt.hash(data.password.trim(), 10);
  }

  const updatedStaff = await staffRepo.save(staff);
  return sanitizeStaff(updatedStaff);
};

export const getAllLeaveService = async (dbName: string) => {
  const dataSource = await getTenantConnection(dbName);
  const leaveRepo = dataSource.getRepository(Leave);

  return await leaveRepo.find({
    order: { createdAt: "DESC" },
  });
};


export const updateLeaveStatusService = async (
  dbName: string,
  leaveId: number,
  status: string
) => {
  const dataSource = await getTenantConnection(dbName);
  const leaveRepo = dataSource.getRepository(Leave);

  const leave = await leaveRepo.findOne({
    where: { id: Number(leaveId) },
  });

  if (!leave) {
    throw new Error("leave request not found");
  }

  const upperStatus = status.trim().toUpperCase();
  if (!["APPROVED", "REJECTED", "PENDING", "CANCELLED"].includes(upperStatus)) {
    throw new Error("invalid leave status");
  }

  leave.status = upperStatus;
  return await leaveRepo.save(leave);
};

