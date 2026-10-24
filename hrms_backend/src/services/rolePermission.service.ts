import { getTenantConnection } from "../connection/tenant.connection";
import { RolePermission } from "../entity/tenant/rolePermission.entity";


export const saveRolePermissionsService = async (
  dbName: string,
  roleId: string,
  permissionIds: string[]
) => {
  const dataSource = await getTenantConnection(dbName);
  const repo = dataSource.getRepository(RolePermission);
  await repo.delete({ role: { id: roleId } });

  for (const permissionId of permissionIds) {
    await repo.save({
      role: { id: roleId } as any,
      module: { id: permissionId } as any,
      isActive: true
    });
  }

  return {
    message: "Permissions assigned successfully",
  };
};

export const getRolePermissionsService = async (
  dbName: string,
  roleId: string
) => {
  const dataSource = await getTenantConnection(dbName);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);
  
  const rolePermissions = await rolePermissionRepo.find({
    where: { role: { id: roleId } },
  });

  return rolePermissions.map((rp) => ({
    permissionId: rp.module?.id,
    assigned: true,
  }));
};