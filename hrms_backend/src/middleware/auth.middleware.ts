import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  userId: string | number;
  email: string;
  tenantId: string;
  roleId: string | number;
  role: string;
  isStaff?: boolean;
  dbName: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): any => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "token required",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token required",
      });
    }

    const decoded = jwt.verify(
      token,
      (process.env.JWT_SECRET as string) || "fallback_secret_key"
    ) as AuthenticatedUser;

    if (!decoded || !decoded.dbName) {
      return res.status(401).json({
        success: false,
        message: "invalid token payload",
      });
    }

    (req as any).user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError" ? "token expired" : "invalid token",
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
  const user = (req as any).user as AuthenticatedUser;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "unauthorized",
    });
  }

  const role = (user.role || "").toUpperCase();
  const isAdmin = (role === "TENANT_ADMIN" || role === "SUPER_ADMIN" || role === "ADMIN") && !user.isStaff;

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "forbidden: admin access required",
    });
  }

  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const user = (req as any).user as AuthenticatedUser;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }

    const userRole = (user.role || "").toUpperCase();
    const upperAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!upperAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "forbidden: insufficient permissions",
      });
    }

    next();
  };
};