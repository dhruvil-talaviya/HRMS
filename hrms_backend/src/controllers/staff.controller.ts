import { Request, Response } from "express";
import {
  createStaffService,
  getAllStaffService,
  updateStaffStatusService,
  getStaffByIdService,
  updateStaffService,
  setupPasswordService,
  getAllLeaveService,
  updateLeaveStatusService
} from "../services/staff.service";
import { number } from "zod";

export const createStaff = async (
  req: Request,
  res: Response 
) => {
  try {
    const dbName = (req as any).user.dbName;

    const staff = await createStaffService(
      dbName,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (error: any) {
    console.log("ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStaff = async (
  req: Request,
  res: Response
) => {
  try {
    const dbName = (req as any).user.dbName;

    const staff = await getAllStaffService(
      dbName
    );

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaffStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const dbName = (req as any).user.dbName;

    const { id } = req.params;
    const { status } = req.body;

    const staff = await updateStaffStatusService(
      dbName,
      Number(id),
      status
    );

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: staff,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getStaffById = async (
  req: Request,
  res: Response
) => {
  try {
    const dbName = (req as any).user.dbName;

    const staff = await getStaffByIdService(
      dbName,
      Number(req.params.id)
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
 const dbName = (req as any).user.dbName;
    const id = req.params.id;
    const data = req.body;

    const updatedStaff = await updateStaffService(dbName, Number(id), data);

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const setupPassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const newPassword = req.body.newPassword || req.body.password;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "password must be at least 6 characters",
      });
    }

    const userId = user?.userId || user?.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "user id not found in token",
      });
    }

    await setupPasswordService(
      user.dbName,
      userId,
      newPassword,
      user.isStaff !== false,
      user.email
    );

    return res.status(200).json({
      success: true,
      message: "password updated successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "failed to update password",
    });
  }
};



export const getAllLeave = async (
  req: Request,
  res: Response
) => {
  try {
    const dbName = (req as any).user.dbName;

    const leaves = await getAllLeaveService(dbName);

    return res.status(200).json({
      success: true,
      message: "All leaves fetched successfully",
      data: leaves,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLeaveStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const dbName = (req as any).user.dbName;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const leave = await updateLeaveStatusService(
      dbName,
      Number(id),
      status
    );

    return res.status(200).json({
      success: true,
      message: `Leave request status updated to ${status} successfully`,
      data: leave,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};