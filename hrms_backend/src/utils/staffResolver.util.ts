import { getTenantConnection } from "../connection/tenant.connection";
import { Staff } from "../entity/tenant/staff.entity";

/**
 * Resolves a valid Staff ID in the given tenant database.
 * If userId is already a positive integer, it returns it directly.
 * If userId is a UUID or non-numeric (e.g. Master/Tenant Admin account),
 * it looks up the Staff entity by email or falls back to the first staff record.
 */
export const resolveTenantStaffId = async (
  dbName: string,
  userId: any,
  email?: string
): Promise<number> => {
  const numId = Number(userId);
  if (Number.isInteger(numId) && numId > 0) {
    return numId;
  }

  const ds = await getTenantConnection(dbName);
  const staffRepo = ds.getRepository(Staff);

  if (email) {
    const byEmail = await staffRepo.findOne({ where: { email } });
    if (byEmail) return byEmail.id;
  }

  // Fallback for admin previewing or testing attendance / profile features
  const firstStaff = (await staffRepo.find({ order: { id: "ASC" }, take: 1 }))[0];
  if (firstStaff) return firstStaff.id;

  throw new Error("No staff record found in this company. Please create a staff profile first.");
};
