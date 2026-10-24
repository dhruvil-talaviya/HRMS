import { getTenantConnection } from "../../connection/tenant.connection";
import { Staff } from "../../entity/tenant/staff.entity";

export const getMyProfileService = async (
  dbName: string,
  staffId: number
) => {
  const dataSource = await getTenantConnection(dbName);
  const staffRepo = dataSource.getRepository(Staff);

  const staff = await staffRepo.findOne({
    where: { id: staffId },
    relations: {
      department: true,
      designation: true,
      accessRole: true,
    },
  });

  if (!staff) {
    throw new Error("staff not found");
  }

  const clean = { ...staff };
  delete (clean as any).password;
  return clean;
};

export const updateMyProfileService = async (
  dbName: string,
  staffId: number,
  data: any
) => {
  const dataSource = await getTenantConnection(dbName);
  const staffRepo = dataSource.getRepository(Staff);

  const staff = await staffRepo.findOne({
    where: { id: staffId },
  });

  if (!staff) {
    throw new Error("staff not found");
  }

  if (data.name !== undefined) staff.fullName = data.name;
  if (data.fullName !== undefined) staff.fullName = data.fullName;
  if (data.phone !== undefined) staff.phone = data.phone;
  if (data.address !== undefined) staff.address = data.address;

  const saved = await staffRepo.save(staff);
  const clean = { ...saved };
  delete (clean as any).password;
  return clean;
};