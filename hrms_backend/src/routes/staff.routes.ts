import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

import {
  createStaff,
  getAllStaff,
  updateStaffStatus,
  getStaffById,
  updateStaff,
  setupPassword,
  getAllLeave,
  updateLeaveStatus,
} from "../controllers/staff.controller";

import { validate } from "../middleware/validate";
import { createStaffSchema } from "../dto/create-staff.dto";

const router = Router();

router.post("/", authMiddleware, requireAdmin, validate(createStaffSchema), createStaff);
router.get("/", authMiddleware, getAllStaff);
router.get("/leave", authMiddleware, requireAdmin, getAllLeave);
router.put("/leave/:id/status", authMiddleware, requireAdmin, updateLeaveStatus);
router.put("/setup-password", authMiddleware, setupPassword);
router.put("/:id/status", authMiddleware, requireAdmin, updateStaffStatus);
router.get("/:id", authMiddleware, getStaffById);
router.put("/:id", authMiddleware, requireAdmin, updateStaff);

export default router;

