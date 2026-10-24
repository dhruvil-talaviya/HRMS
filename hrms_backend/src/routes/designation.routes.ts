import { Router } from "express";
import {
  createDesignation,
  getDesignations,
  updateDesignation,
  deleteDesignation,
  getDesignationByDepartment,
} from "../controllers/designation.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, requireAdmin, createDesignation);
router.get("/", authMiddleware, getDesignations);
router.put("/:id", authMiddleware, requireAdmin, updateDesignation);
router.delete("/:id", authMiddleware, requireAdmin, deleteDesignation);
router.get(
  "/department/:departmentId",
  authMiddleware,
  getDesignationByDepartment
);

export default router;