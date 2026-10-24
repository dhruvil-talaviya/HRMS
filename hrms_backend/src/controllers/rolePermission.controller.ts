  import { Request, Response } from "express";
  import {saveRolePermissionsService,getRolePermissionsService} from "../services/rolePermission.service";

  export const saveRolePermissions = async (req: Request,res: Response) => {
    try {
      const dbName = (req as any).user.dbName;
      const { roleId, permissionIds } = req.body;

      const result = await saveRolePermissionsService(
          dbName,
          roleId,
          permissionIds
        );
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  export const getRolePermissions = async (req: Request,res: Response) => {
    try {
      const dbName = (req as any).user.dbName;

      const id = req.params.roleId as string;
      const result = await getRolePermissionsService(
          dbName,
          id
        );
const assignedCount = result.filter((item: any) => item.assigned).length;
      return res.status(200).json({
        success: true,
        
        total:assignedCount,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };