import { Router } from "express";
import {
  createRole,
  getRoles,
  updateRole,
} from "../controllers/role.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getRoles);
router.post("/", authMiddleware, requireAdmin, createRole);
router.put("/:id", authMiddleware, requireAdmin, updateRole);

export default router;

