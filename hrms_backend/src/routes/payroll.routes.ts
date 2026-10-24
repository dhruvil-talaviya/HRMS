import { Router } from "express";
import {
  previewPayroll,
  generateMonthlyPayroll,
  createPayroll,
  getAllPayroll,
  getMyPayroll,
  getPayrollById,
  updatePayroll,
  processPayroll,
  deletePayroll,
} from "../controllers/payroll.contoller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

// Staff can view their own payroll; Admin can view all or preview
router.get("/my-payroll", getMyPayroll);
router.get("/:id", getPayrollById);

// Admin-only operations
router.get("/preview", requireAdmin, previewPayroll);
router.post("/preview", requireAdmin, previewPayroll);
router.post("/generate", requireAdmin, generateMonthlyPayroll);
router.post("/", requireAdmin, createPayroll);
router.get("/", requireAdmin, getAllPayroll);
router.put("/:id", requireAdmin, updatePayroll);
router.put("/process/:id", requireAdmin, processPayroll);
router.delete("/:id", requireAdmin, deletePayroll);

export default router;