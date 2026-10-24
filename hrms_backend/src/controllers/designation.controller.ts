import { Request, Response } from "express";
import {
  createDesignationService,
  getDesignationsService,
  updateDesignationService,
  deleteDesignationService,
  getDesignationByDepartmentService,
} from "../services/designation.service";

export const createDesignation = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const result = await createDesignationService(dbName, req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "failed to create designation",
    });
  }
};

export const getDesignations = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const result = await getDesignationsService(dbName);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "failed to fetch designations",
    });
  }
};

export const updateDesignation = async (req: any, res: any) => {
  try {
    const result = await updateDesignationService(
      req.user.dbName,
      req.params.id,
      req.body
    );
    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "failed to update designation",
    });
  }
};

export const deleteDesignation = async (req: any, res: any) => {
  try {
    await deleteDesignationService(req.user.dbName, req.params.id);
    return res.json({
      success: true,
      message: "designation deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "failed to delete designation",
    });
  }
};

export const getDesignationByDepartment = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const departmentId = req.params.departmentId as string;
    const result = await getDesignationByDepartmentService(
      dbName,
      departmentId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "failed to fetch designations by department",
    });
  }
};