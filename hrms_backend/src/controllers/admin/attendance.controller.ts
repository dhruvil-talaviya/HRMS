/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import {
  getShiftsService,
  createShiftService,
  getShiftByIdService,
  updateShiftService,
  deleteShiftService,
  getShiftAssignmentsService,
  createShiftAssignmentService,
  updateShiftAssignmentService,
  deleteShiftAssignmentService,
  getAttendanceSettingsService,
  updateAttendanceSettingsService,
  getHolidaysService,
  createHolidayService,
  updateHolidayService,
  deleteHolidayService,
  getAttendanceRecordsService,
  updateAttendanceRecordService,
  createManualAttendanceService,
  getAttendanceMetricsService,
  getAttendanceChartsService,
  getAttendanceRequestsService,
  getAttendanceRequestByIdService,
  approveAttendanceRequestService,
  rejectAttendanceRequestService,
} from "../../services/admin/attendance.service";
import { runMaintenanceForTenant } from "../../services/admin/attendanceMaintenance.service";

const getUser = (req: Request) => (req as any).user as { userId: string; dbName: string };

// ===== SHIFTS =====

export const getShifts = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getShiftsService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await createShiftService(dbName, req.body);
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getShiftByIdService(dbName, String(req.params.id));
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(404).json({ success: false, message: e.message });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await updateShiftService(dbName, String(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    await deleteShiftService(dbName, String(req.params.id));
    return res.json({ success: true, message: "Shift deleted successfully" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ===== SHIFT ASSIGNMENTS =====

export const getShiftAssignments = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getShiftAssignmentsService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const createShiftAssignment = async (req: Request, res: Response) => {
  try {
    const { dbName, userId } = getUser(req);
    const data = await createShiftAssignmentService(dbName, { ...req.body, assignedBy: userId });
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const updateShiftAssignment = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await updateShiftAssignmentService(dbName, String(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteShiftAssignment = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    await deleteShiftAssignmentService(dbName, String(req.params.id));
    return res.json({ success: true, message: "Shift assignment deleted successfully" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ===== SETTINGS =====

export const getAttendanceSettings = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getAttendanceSettingsService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const updateAttendanceSettings = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await updateAttendanceSettingsService(dbName, req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ===== HOLIDAYS =====

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getHolidaysService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await createHolidayService(dbName, req.body);
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await updateHolidayService(dbName, String(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    await deleteHolidayService(dbName, String(req.params.id));
    return res.json({ success: true, message: "Holiday deleted successfully" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ===== ATTENDANCE RECORDS =====

export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const { date, status, shiftId, departmentId } = req.query;
    const data = await getAttendanceRecordsService(dbName, { date, status, shiftId, departmentId });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await updateAttendanceRecordService(dbName, String(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const createManualAttendance = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await createManualAttendanceService(dbName, req.body);
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const runMaintenance = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    await runMaintenanceForTenant(dbName);
    return res.json({ success: true, message: "Attendance maintenance completed" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ===== DASHBOARD =====

export const getAttendanceMetrics = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getAttendanceMetricsService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const getAttendanceCharts = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getAttendanceChartsService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ===== ATTENDANCE REQUESTS =====

export const getAttendanceRequests = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getAttendanceRequestsService(dbName);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const getAttendanceRequestById = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await getAttendanceRequestByIdService(dbName, String(req.params.id));
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(404).json({ success: false, message: e.message });
  }
};

export const approveAttendanceRequest = async (req: Request, res: Response) => {
  try {
    const { dbName, userId } = getUser(req);
    const data = await approveAttendanceRequestService(dbName, String(req.params.id), {
      ...req.body,
      approvedBy: userId,
    });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const rejectAttendanceRequest = async (req: Request, res: Response) => {
  try {
    const { dbName } = getUser(req);
    const data = await rejectAttendanceRequestService(dbName, String(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};
