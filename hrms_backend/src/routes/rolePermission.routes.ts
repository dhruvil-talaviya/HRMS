import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";
import {
  saveRolePermissions,
  getRolePermissions,
} from "../controllers/rolePermission.controller";

const router = Router();

router.put("/", authMiddleware, requireAdmin, saveRolePermissions);
router.get("/:roleId", authMiddleware, requireAdmin, getRolePermissions);

export default router;

