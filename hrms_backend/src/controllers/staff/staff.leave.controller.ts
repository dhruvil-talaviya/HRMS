import { Request, Response } from "express";
import { applyLeaveService, getLeaveService } from "../../services/staff/staff.leave.service";
import { resolveTenantStaffId } from "../../utils/staffResolver.util";

export const applyLeave = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const dbName = user?.dbName;
    const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);

    const leave = await applyLeaveService(
      dbName,
      staffId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Leave Applied Successfully",
      data: leave,
    });

  } catch (error: any) {
    console.error("Leave Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

export const getLeave = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const dbName = user?.dbName;
    const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);

    const leaves = await getLeaveService(
      dbName,
      staffId
    );

    return res.status(200).json({
      success: true,
      message: "Leave fetched successfully",
      data: leaves,
    });
  } catch (error: any) {
    console.error("Get Leave Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};