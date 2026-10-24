import { Request, Response } from "express";
import {
  clockInService,
  clockOutService,
  startBreakService,
  endBreakService,
  getTodayAttendanceService,
  getAttendanceHistoryService,
  getStaffDashboardService,
  createAttendanceRequestService,
  getMyRequestsService,
  resetAttendanceService,
} from "../../services/staff/attendance.service";
import { getClientIp } from "../../utils/attendance.util";
import { resolveTenantStaffId } from "../../utils/staffResolver.util";

const getStaffContext = async (req: Request) => {
  const user = (req as any).user;
  const dbName = user?.dbName;
  const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);
  return { staffId, dbName };
};

export const clockIn = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const attendance = await clockInService(dbName, staffId, {
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || null,
    });
    return res.status(200).json({ success: true, message: "Clocked in successfully", data: attendance });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const { workSummary } = req.body || {};
    const attendance = await clockOutService(dbName, staffId, workSummary);
    return res.status(200).json({ success: true, message: "Clocked out successfully", data: attendance });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const startBreak = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const attendance = await startBreakService(dbName, staffId, req.body || {});
    return res.status(200).json({ success: true, message: "Break started successfully", data: attendance });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const endBreak = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const attendance = await endBreakService(dbName, staffId, req.body || {});
    return res.status(200).json({ success: true, message: "Break ended successfully", data: attendance });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const data = await getTodayAttendanceService(dbName, staffId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const { startDate, endDate } = req.query;
    const history = await getAttendanceHistoryService(
      dbName,
      staffId,
      startDate as string,
      endDate as string
    );
    return res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getStaffDashboard = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const data = await getStaffDashboardService(dbName, staffId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createMyRequest = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const data = await createAttendanceRequestService(dbName, staffId, req.body);
    return res.status(201).json({ success: true, message: "Request submitted", data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyRequests = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    const data = await getMyRequestsService(dbName, staffId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resetAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId, dbName } = await getStaffContext(req);
    await resetAttendanceService(dbName, staffId);
    return res.status(200).json({ success: true, message: "Today's attendance reset successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
