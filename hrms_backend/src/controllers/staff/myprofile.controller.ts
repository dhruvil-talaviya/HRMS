import { Request, Response } from "express";
import { getMyProfileService, updateMyProfileService } from "../../services/staff/myprofile.services";
import { resolveTenantStaffId } from "../../utils/staffResolver.util";

export const getMyProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const dbName = user?.dbName;
    const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);

    const profile = await getMyProfileService(
      dbName,
      staffId
    );

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: profile,
    });

  } catch (error: any) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMyProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const dbName = user?.dbName;
    const staffId = await resolveTenantStaffId(dbName, user?.userId, user?.email);

    const profile = await updateMyProfileService(
      dbName,
      staffId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });

  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};