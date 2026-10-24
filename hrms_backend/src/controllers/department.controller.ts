import { Request, Response } from "express";
import {
  createDepartmentService,
  getDepartmentsService,
  updateDepartmentService,
  deleteDepartmentService,
  getDepartmentHeadOptionsService,
} from "../services/department.service";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const result = await createDepartmentService(dbName, req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "failed to create department",
    });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const result = await getDepartmentsService(dbName);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "failed to fetch departments",
    });
  }
};

export const updateDepartment = async (req: any, res: any) => {
  try {
    const result = await updateDepartmentService(
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
      message: error.message || "failed to update department",
    });
  }
};

export const deleteDepartment = async (req: any, res: any) => {
  try {
    await deleteDepartmentService(req.user.dbName, req.params.id);
    return res.json({
      success: true,
      message: "department deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "failed to delete department",
    });
  }
};

export const getDepartmentHeadOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const dbName = (req as any).user.dbName;
    const userId = (req as any).user.userId;

    const result = await getDepartmentHeadOptionsService(dbName, userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};