import { Request, Response } from "express";
import {
  createPayrollService,
  getAllPayrollService,
  getPayrollByIdService,
  updatePayrollService,
  processPayrollService,
  previewPayrollService,
  generateMonthlyPayrollService,
  getMyPayrollService,
  deletePayrollService,
} from "../services/payroll.service";
import { resolveTenantStaffId } from "../utils/staffResolver.util";

export const previewPayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const { staffId, month, year } = { ...req.query, ...req.body };
    const data = await previewPayrollService(dbName, {
      staffId: staffId ? Number(staffId) : undefined,
      month: month as string,
      year: year ? Number(year) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll preview calculated successfully",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const generateMonthlyPayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const { month, year, staffIds } = req.body;
    const data = await generateMonthlyPayrollService(dbName, {
      month,
      year: Number(year),
      staffIds,
    });

    return res.status(200).json({
      success: true,
      message: `Generated payroll for ${data.length} staff members successfully`,
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const payroll = await createPayrollService(dbName, req.body);

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;
    const { month, year, status } = req.query;

    const payroll = await getAllPayrollService(dbName, {
      month: month as string,
      year: year ? Number(year) : undefined,
      status: status as string,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll fetched successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyPayroll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const dbName = user?.dbName;
    const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);

    const data = await getMyPayrollService(dbName, staffId);

    return res.status(200).json({
      success: true,
      message: "My payroll fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPayrollById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const dbName = user?.dbName;

    const payroll = await getPayrollByIdService(dbName, Number(req.params.id));
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "payroll not found",
      });
    }

    // IDOR protection: staff members can only access their own payslip
    if (user?.isStaff) {
      const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);
      if (payroll.staffId !== staffId) {
        return res.status(403).json({
          success: false,
          message: "forbidden: access to this payslip is not permitted",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updatePayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;

    const payroll = await updatePayrollService(
      dbName,
      Number(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const processPayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;

    const payroll = await processPayrollService(
      dbName,
      Number(req.params.id)
    );

    return res.status(200).json({
      success: true,
      message: "Payroll processed successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePayroll = async (req: Request, res: Response) => {
  try {
    const dbName = (req as any).user.dbName;

    await deletePayrollService(dbName, Number(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};