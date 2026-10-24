import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentHeadOptions,
} from "../controllers/department.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, requireAdmin, createDepartment);
router.get("/", authMiddleware, getDepartments);
router.put("/:id", authMiddleware, requireAdmin, updateDepartment);
router.delete("/:id", authMiddleware, requireAdmin, deleteDepartment);
router.get("/head-options", authMiddleware, requireAdmin, getDepartmentHeadOptions);

export default router;