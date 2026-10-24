import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth.middleware";
import {
  getDailyReport,
  getMonthlyReport,
  getEmployeeReport,
  getDepartmentReport,
  getLateReport,
  getOvertimeReport,
  getBreakReport,
  getMissedPunchReport,
  getSummaryReport,
  getShiftReport,
  getHolidayReport,
} from "../../controllers/admin/report.controller";

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin);


router.get("/daily", getDailyReport);
router.get("/monthly", getMonthlyReport);
router.get("/employee", getEmployeeReport);
router.get("/department", getDepartmentReport);
router.get("/late", getLateReport);
router.get("/overtime", getOvertimeReport);
router.get("/break", getBreakReport);
router.get("/missed-punch", getMissedPunchReport);
router.get("/summary", getSummaryReport);
router.get("/shift", getShiftReport);
router.get("/holiday", getHolidayReport);

export default router;
