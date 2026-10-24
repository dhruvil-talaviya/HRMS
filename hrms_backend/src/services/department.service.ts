import { getTenantConnection } from "../connection/tenant.connection";
import { Department } from "../entity/tenant/department.entity";
import { Designation } from "../entity/tenant/designation.entity";
import { Staff } from "../entity/tenant/staff.entity";
import DatabaseConnection from "../connection/postgresql.connection";
import { Users } from "../entity/master/users.entity";

export const createDepartmentService = async (dbName: string, payload: any) => {

    const dataSource = await getTenantConnection(dbName);
    const departmentRepo = dataSource.getRepository(Department);
    const department = await departmentRepo.save({
        name: payload.name,
        managerId: payload.managerId,
        budget: payload.budget,
        openPositions: payload.openPositions,
        headcount: 0
    });
    return department;
};

export const getDepartmentsService = async (dbName: string) => {
    const dataSource = await getTenantConnection(dbName);
    const departmentRepo = dataSource.getRepository(Department);
    return await departmentRepo.find({
        where: {
            is_deleted: false
        }
    });
};

export const updateDepartmentService = async (dbName: string, id: string, payload: any) => {
    const dataSource = await getTenantConnection(dbName);
    const departmentRepo = dataSource.getRepository(Department);

    const department = await departmentRepo.findOne({
        where: {
            id,
            is_deleted: false
        }
    });

    if (!department) {
        throw new Error("Department not found");
    }
    department.name = payload.name;
 
    return await departmentRepo.save(department);
};

export const deleteDepartmentService = async (dbName: string, id: string) => {

    const dataSource = await getTenantConnection(dbName);
    const departmentRepo = dataSource.getRepository(Department);
    const designationRepo = dataSource.getRepository(Designation);
    const department = await departmentRepo.findOne({
        where: {
            id,
            is_deleted: false
        }
    });

    if (!department) {
        throw new Error("Department not found");
    }

    const designationCount = await designationRepo.count({
      where: {
        department: { id },
        is_deleted: false,
      },
    });
    if (designationCount > 0) {
      throw new Error("department contains designations. delete or reassign designations first.");
    }

    const staffRepo = dataSource.getRepository(Staff);
    const staffCount = await staffRepo.count({
      where: { departmentId: String(id) },
    });
    if (staffCount > 0) {
      throw new Error("department contains assigned employees. reassign employees first.");
    }


    department.is_deleted = true;
    await departmentRepo.save(department);
    return true;
};


export const getDepartmentHeadOptionsService = async (
  dbName: string,
  userId: string
) => {
  console.log("DB NAME =>", dbName);
  console.log("USER ID =>", userId);

  const tenantSource = await getTenantConnection(dbName);

  const staffRepo = tenantSource.getRepository(Staff);

  const userRepo = DatabaseConnection.getRepository(Users);

  const admin = await userRepo.findOne({
    where: {
      id: userId,
      is_deleted: false,
    },
  });

  const staff = await staffRepo.find({
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  });

  console.log("ADMIN =>", admin);
  console.log("STAFF =>", staff);
  console.log("STAFF COUNT =>", staff.length);

  const options = [];

  // Admin add karo
  if (admin) {
    options.push({
      id: "admin",
      fullName: admin.name,
      role: "TENANT_ADMIN",
    });
  }

  // Staff add karo
  if (staff.length > 0) {
    options.push(...staff);
  }

  console.log("FINAL OPTIONS =>", options);

  return options;
};