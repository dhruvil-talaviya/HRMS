import { getTenantConnection } from "../connection/tenant.connection";
import { Designation } from "../entity/tenant/designation.entity";
import { Department } from "../entity/tenant/department.entity";
import { Staff } from "../entity/tenant/staff.entity";


export const createDesignationService =async (dbName:string,payload:any) => {
  const dataSource = await getTenantConnection(dbName);
  const designationRepo = dataSource.getRepository(Designation);
    const departmentRepo = dataSource.getRepository(Department);

     
  const department = await departmentRepo.findOne({
    where: {
      id: payload.department_id,
      is_deleted: false,
    },
  });

    if (!department) {
    throw new Error("Department not found");
    
  }

// Create Designation
  const designation = designationRepo.create({
    title: payload.title,
    department: department,
  });

 return await designationRepo.save(designation);
};

export const getDesignationsService =async (dbName:string) => {
  const dataSource = await getTenantConnection(dbName);
  const designationRepo = dataSource.getRepository(Designation);
  return await designationRepo.find({
    where:{
      is_deleted:false
    },
      relations: {
    department: true,
  }
  });
};

export const updateDesignationService = async (dbName:string,id:string,payload:any) => {
  const dataSource =await getTenantConnection(dbName);
  const designationRepo = dataSource.getRepository(Designation);
  const designation = await designationRepo.findOne({
    where:{
      id,
      is_deleted:false
    }
  });

  if(!designation){
    throw new Error("Designation not found");
  }
  designation.title = payload.title;
  // designation.department_id = payload.department_id;
 designation.department = {
  id: payload.department_id,
  } as any;

  return await designationRepo.save(designation);
};

export const deleteDesignationService =async (dbName:string,id:string) => {
  const dataSource = await getTenantConnection(dbName);
  const designationRepo = dataSource.getRepository(Designation);

  const designation = await designationRepo.findOne({
    where:{
      id,
      is_deleted:false
    }
  });

  if (!designation) {
    throw new Error("designation not found");
  }

  const staffRepo = dataSource.getRepository(Staff);
  const staffCount = await staffRepo.count({
    where: { designationId: String(id) },
  });
  if (staffCount > 0) {
    throw new Error("designation contains assigned employees. reassign employees first.");
  }

  designation.is_deleted = true;
  await designationRepo.save(designation);
  return true;
};


export const getDesignationByDepartmentService = async (dbName: string,departmentId: string) => {
  const dataSource = await getTenantConnection(dbName);
  const designationRepo = dataSource.getRepository(Designation);

  return await designationRepo.find({
     where: {
    department: {
      id: departmentId,
    },
    is_deleted: false,
  },
  relations: {
    department: true,
  },
  });
};