import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth.middleware";
import {
  getShifts,
  createShift,
  getShiftById,
  updateShift,
  deleteShift,
  getShiftAssignments,
  createShiftAssignment,
  updateShiftAssignment,
  deleteShiftAssignment,
  getAttendanceSettings,
  updateAttendanceSettings,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getAttendanceRecords,
  updateAttendanceRecord,
  createManualAttendance,
  runMaintenance,
  getAttendanceMetrics,
  getAttendanceCharts,
  getAttendanceRequests,
  getAttendanceRequestById,
  approveAttendanceRequest,
  rejectAttendanceRequest,
} from "../../controllers/admin/attendance.controller";

const router = Router();
router.use(authMiddleware);

// Dashboard metrics & charts
router.get("/dashboard/metrics", requireAdmin, getAttendanceMetrics);
router.get("/dashboard/charts", requireAdmin, getAttendanceCharts);

// Records & maintenance
router.get("/records", requireAdmin, getAttendanceRecords);
router.post("/records", requireAdmin, createManualAttendance);
router.put("/records/:id", requireAdmin, updateAttendanceRecord);
router.post("/maintenance/run", requireAdmin, runMaintenance);

// Shifts
router.get("/shifts", getShifts);
router.post("/shifts", requireAdmin, createShift);
router.get("/shifts/:id", getShiftById);
router.put("/shifts/:id", requireAdmin, updateShift);
router.delete("/shifts/:id", requireAdmin, deleteShift);

// Shift assignments
router.get("/shift-assignment", getShiftAssignments);
router.post("/shift-assignment", requireAdmin, createShiftAssignment);
router.put("/shift-assignment/:id", requireAdmin, updateShiftAssignment);
router.delete("/shift-assignment/:id", requireAdmin, deleteShiftAssignment);

// Settings
router.get("/settings", getAttendanceSettings);
router.put("/settings", requireAdmin, updateAttendanceSettings);

// Holidays (read allowed for all authenticated tenant users, modifications admin only)
router.get("/holidays", getHolidays);
router.post("/holidays", requireAdmin, createHoliday);
router.put("/holidays/:id", requireAdmin, updateHoliday);
router.delete("/holidays/:id", requireAdmin, deleteHoliday);

// Attendance regularization requests
router.get("/requests", requireAdmin, getAttendanceRequests);
router.get("/requests/:id", requireAdmin, getAttendanceRequestById);
router.put("/requests/:id/approve", requireAdmin, approveAttendanceRequest);
router.put("/requests/:id/reject", requireAdmin, rejectAttendanceRequest);

export default router;

