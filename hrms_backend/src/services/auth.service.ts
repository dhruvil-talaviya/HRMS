import bcrypt from "bcrypt";
import { QueryRunner } from "typeorm";
import DatabaseConnection from "../connection/postgresql.connection";

import { Tenant_dbs } from "../entity/master/tenant_db.entity";
import { Users } from "../entity/master/users.entity";
import { Roles } from "../entity/master/roles.entity";
import { Staff } from "../entity/tenant/staff.entity";
import { getTenantConnection } from "../connection/tenant.connection";

import { Role } from "../entity/tenant/roles.entity";
import { seedRoles } from "../seeders/roles.seeder";

import { RolePermission } from "../entity/tenant/rolePermission.entity";

import { generateToken } from "../utils/jwt";
import { seedDepartments } from "../seeders/department.seed";
import { seedDesignations } from "../seeders/designation.seed";
import { seedRolePermissions } from "../seeders/rolePermission.seed";
import { seedModules } from "../seeders/seedModule";
export const registerCompanyService = async (payload: any) => {
  const {
    companyName,
    companyEmail,
    phone = "",
    industry = "general",
    companySize = "1-10",
    country = "",
    state = "",
    city = "",
    address = "",
    adminName,
    adminEmail,
    password,
  } = payload || {};

  if (!companyName || !companyName.trim()) {
    throw new Error("company name is required");
  }
  if (!companyEmail || !companyEmail.trim()) {
    throw new Error("company email is required");
  }
  if (!adminEmail || !adminEmail.trim()) {
    throw new Error("admin email is required");
  }
  if (!password || password.length < 6) {
    throw new Error("password must be at least 6 characters");
  }

  const userRepo = DatabaseConnection.getRepository(Users);
  const tenantRepo = DatabaseConnection.getRepository(Tenant_dbs);
  const roleRepo = DatabaseConnection.getRepository(Roles);

  const existingUser = await userRepo.findOne({
    where: { email: adminEmail.trim().toLowerCase() },
  });

  if (existingUser) {
    throw new Error("admin email already exists");
  }

  const existingTenant = await tenantRepo.findOne({
    where: { company_email: companyEmail.trim().toLowerCase() },
  });

  if (existingTenant) {
    throw new Error("company with this email already exists");
  }

  // Ensure master TENANT_ADMIN role exists
  let tenantAdminRole = await roleRepo.findOne({
    where: { name: "TENANT_ADMIN" },
  });

  if (!tenantAdminRole) {
    tenantAdminRole = await roleRepo.save({
      name: "TENANT_ADMIN",
      is_deleted: false,
    });
  }

  const sanitized = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  let subdomain = sanitized || "company";
  let dbName = `hrms_${subdomain}`;

  // Check if dbName or subdomain already taken in tenant_dbs
  const duplicateSub = await tenantRepo.findOne({ where: { subdomain } });
  if (duplicateSub) {
    subdomain = `${subdomain}_${Date.now().toString(36)}`;
    dbName = `hrms_${subdomain}`;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const tenant = await tenantRepo.save({
    name: companyName.trim(),
    company_email: companyEmail.trim().toLowerCase(),
    phone,
    industry,
    company_size: companySize,
    country,
    state,
    city,
    address,
    subdomain,
    db_name: dbName,
    is_active: true,
  });

  let databaseCreated = false;
  try {
    const queryRunner = DatabaseConnection.createQueryRunner();
    await queryRunner.connect();
    
    // Check if database already exists in postgres
    const dbCheck = await queryRunner.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbCheck.length === 0) {
      await queryRunner.query(`CREATE DATABASE "${dbName}"`);
    }
    await queryRunner.release();
    databaseCreated = true;

    const tenantDataSource = await getTenantConnection(dbName);

    await seedRoles(tenantDataSource);
    await seedModules(tenantDataSource);
    await seedRolePermissions(tenantDataSource);
    await seedDepartments(tenantDataSource, industry);
    await seedDesignations(tenantDataSource, industry);

    const user = await userRepo.save({
      email: adminEmail.trim().toLowerCase(),
      name: adminName || companyName,
      password: hashedPassword,
      role_id: tenantAdminRole.id,
      tenant_id: tenant.id,
      db_name: tenant.db_name,
    });

    return {
      tenantId: tenant.id,
      companyName: tenant.name,
      companyEmail: tenant.company_email,
      adminName: user.name,
      adminEmail: user.email,
      subdomain,
      dbName,
      userId: user.id,
    };
  } catch (err: any) {
    // If provisioning failed, clean up tenant record
    try {
      await tenantRepo.delete(tenant.id);
    } catch (_) {}
    throw new Error(`tenant provisioning failed: ${err.message}`);
  }
};

export const loginService = async (payload: any) => {
  const { email, password } = payload || {};

  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const trimmedEmail = email.trim().toLowerCase();

  const userRepo = DatabaseConnection.getRepository(Users);
  const roleRepo = DatabaseConnection.getRepository(Roles);
  const tenantRepo = DatabaseConnection.getRepository(Tenant_dbs);

  const user = await userRepo.findOne({
    where: { email: trimmedEmail },
  });

  if (user) {
    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);

    if (isMatch) {
      const role = await roleRepo.findOne({
        where: { id: user.role_id },
      });

      const company = await tenantRepo.findOne({
        where: { id: user.tenant_id },
      });

      // Tenant DB Connection
      const tenantConnection = await getTenantConnection(user.db_name);
      const tenantRoleRepo = tenantConnection.getRepository(Role);
      const rolePermissionRepo = tenantConnection.getRepository(RolePermission);

      // Find Tenant Role
      let tenantRole = await tenantRoleRepo.findOne({
        where: { name: role?.name },
      });

      if (!tenantRole) {
        const { seedRoles } = await import("../seeders/roles.seeder");
        await seedRoles(tenantConnection);
        tenantRole = await tenantRoleRepo.findOne({
          where: { name: role?.name || "TENANT_ADMIN" },
        });

        if (!tenantRole) {
          tenantRole = await tenantRoleRepo.save({
            name: role?.name || "TENANT_ADMIN",
            description: "Tenant Administrator",
            is_system: true,
          });
        }
      }

      // Get Role Permissions
      const rolePermissions = await rolePermissionRepo.find({
        where: {
          role: { id: tenantRole.id },
          isActive: true,
        },
        relations: { module: true },
      });

      const permissions = rolePermissions.map((item) => ({
        module: item.module?.identifier,
        operations: item.operations,
      }));

      const roleName = tenantRole.name || "TENANT_ADMIN";

      const token = generateToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        roleId: tenantRole.id,
        role: roleName,
        isStaff: false,
        dbName: user.db_name,
      });

      return {
        token,
        permissions,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: tenantRole.id,
          role: roleName,
          isStaff: false,
          tenant_id: user.tenant_id,
          companyName: company?.name,
          db_name: user.db_name,
        },
      };
    }
  }

  const allTenants = await tenantRepo.find({
    where: { is_active: true },
  });

  let foundStaffWithEmail = false;

  for (const tenant of allTenants) {
    try {
      const tenantConnection = await getTenantConnection(tenant.db_name);
      const staffRepo = tenantConnection.getRepository(Staff);

      const staff = await staffRepo.findOne({
        where: { email: trimmedEmail },
      });

      if (staff) {
        foundStaffWithEmail = true;

        let isPasswordMatch = false;
        if (staff.password?.startsWith("$2")) {
          isPasswordMatch = await bcrypt.compare(password, staff.password).catch(() => false);
        } else if (staff.password === password) {
          // Upgrade legacy unhashed password to bcrypt
          isPasswordMatch = true;
          staff.password = await bcrypt.hash(password, 10);
          await staffRepo.save(staff);
        }

        if (!isPasswordMatch) {
          continue;
        }

        const roleRepo = tenantConnection.getRepository(Role);
        const rolePermissionRepo = tenantConnection.getRepository(RolePermission);

        const role = staff.accessRoleId
          ? await roleRepo.findOne({ where: { id: staff.accessRoleId } })
          : null;

        const rolePermissions = staff.accessRoleId
          ? await rolePermissionRepo.find({
              where: {
                role: { id: staff.accessRoleId },
                isActive: true,
              },
              relations: { module: true },
            })
          : [];

        const permissions = rolePermissions.map((item) => ({
          module: item.module?.identifier,
          operations: item.operations,
        }));

        const roleName = role?.name || "EMPLOYEE";

        const token = generateToken({
          userId: staff.id,
          email: staff.email,
          tenantId: tenant.id,
          roleId: staff.accessRoleId,
          role: roleName,
          isStaff: true,
          dbName: tenant.db_name,
        });

        const requiresPasswordSetup =
          staff.isFirstLogin === true || staff.status === "InActive";

        return {
          token,
          permissions,
          requiresPasswordSetup,
          user: {
            id: staff.id,
            name: staff.fullName,
            email: staff.email,
            role: roleName,
            accessRole: roleName,
            isStaff: true,
            status: staff.status,
            isFirstLogin: requiresPasswordSetup,
            tenant_id: tenant.id,
            companyName: tenant.name,
            db_name: tenant.db_name,
          },
        };
      }
    } catch (_) {
      // Continue searching other tenants if one tenant DB is unavailable
    }
  }

  if (user || foundStaffWithEmail) {
    throw new Error("invalid password");
  }

  throw new Error("invalid email");
};

