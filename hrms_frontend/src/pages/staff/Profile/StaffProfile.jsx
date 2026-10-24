import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "../../../components/layouts/PageHeader";
import Badge from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import { toast } from "react-toastify";

import { getMyProfile, updateMyProfile } from "../../../services/api";

const ProfileField = ({ label, value, editable, field, editMode, draft, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1 lowercase">{label}</label>
    {editMode && editable ? (
      <input
        type="text"
        value={draft?.[field] ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
      />
    ) : (
      <p className="text-xs font-semibold text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">{value || "—"}</p>
    )}
  </div>
);

const StaffProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);

  const handleSave = async () => {
    try {
      await updateMyProfile(draft);
      toast.success("profile updated successfully!");
      await getProfile();
      setEditMode(false);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message?.toLowerCase?.() || "failed to update profile");
    }
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditMode(false);
  };

  const handleFieldChange = (field, val) => {
    setDraft((prev) => ({ ...prev, [field]: val }));
  };

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const res = await getMyProfile();
      const data = res.data?.data || {};

      const trimmedJoiningDate = data.joiningDate ? String(data.joiningDate).substring(0, 10) : "—";
      const trimmedDob = data.dob ? String(data.dob).substring(0, 10) : "—";

      const profileData = {
        id: data.id || "—",
        name: data.fullName || data.name || "Employee",
        email: data.email || "—",
        phone: data.phone || "—",
        department: data.department?.name || data.departmentName || "General",
        designation: data.designation?.title || data.designationName || "Staff",
        joiningDate: trimmedJoiningDate,
        status: data.status || "Active",
        role: data.role || data.accessRole || "Employee",
        gender: data.gender || "—",
        dateOfBirth: trimmedDob,
        address: data.address || "—",
        avatarColor: "#0F172A",
      };

      setProfile(profileData);
      setDraft(profileData);
    } catch (err) {
      console.log("failed to load staff profile:", err);
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const fallback = {
          id: stored.id || "EMP",
          name: stored.fullName || stored.name || "Employee",
          email: stored.email || "",
          phone: stored.phone || "—",
          department: stored.department || "General",
          designation: stored.designation || "Staff",
          joiningDate: "—",
          status: stored.status || "Active",
          role: stored.role || "Employee",
          gender: "—",
          dateOfBirth: "—",
          address: "—",
          avatarColor: "#0F172A",
        };
        setProfile(fallback);
        setDraft(fallback);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <PageHeader title="my profile" subtitle="loading your employee profile..." />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 h-96 xl:col-span-1" />
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 h-64" />
            <div className="bg-white rounded-3xl p-8 border border-slate-100 h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="my profile"
        subtitle="view and update your personal information"
        actions={
          editMode ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                id="cancel-profile-edit"
              >
                cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                id="save-profile-btn"
              >
                save changes
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditMode(true)}
              id="edit-profile-btn"
            >
              edit profile
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 p-7 flex flex-col items-center text-center xl:col-span-1"
        >
          <div className="relative mb-4">
            <Avatar name={profile.name} color={profile.avatarColor} size={96} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {profile.name}
          </h2>
          <p className="text-sm text-slate-500 mb-3">{profile.designation}</p>
          <Badge status={profile.status} className="mb-4">
            {profile.status}
          </Badge>

          <div className="w-full space-y-3 text-left border-t border-slate-100 pt-5">
            {[
              { label: "role", value: profile.role },
              { label: "department", value: profile.department },
              { label: "employee id", value: profile.id },
              { label: "joined", value: profile.joiningDate },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/30 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Details Panel */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 p-6"
          >
            <div className="mb-5 pb-3 border-b border-slate-100">
              <p className="text-base font-bold text-slate-800 lowercase">
                personal information
              </p>
              <p className="text-xs text-slate-400 mt-0.5 lowercase">
                contact and identity details
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ProfileField
                label="full name"
                value={profile.name}
                editable
                field="name"
                editMode={editMode}
                draft={draft}
                onChange={handleFieldChange}
              />
              <ProfileField
                label="email address"
                value={profile.email}
                editable
                field="email"
                editMode={editMode}
                draft={draft}
                onChange={handleFieldChange}
              />
              <ProfileField
                label="phone number"
                value={profile.phone}
                editable
                field="phone"
                editMode={editMode}
                draft={draft}
                onChange={handleFieldChange}
              />
              <ProfileField label="date of birth" value={profile.dateOfBirth} />
              <ProfileField label="gender" value={profile.gender} />
              <ProfileField
                label="address"
                value={profile.address}
                editable
                field="address"
                editMode={editMode}
                draft={draft}
                onChange={handleFieldChange}
              />
            </div>
          </motion.div>

          {/* Work Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 p-6"
          >
            <div className="mb-5 pb-3 border-b border-slate-100">
              <p className="text-base font-bold text-slate-800 lowercase">
                work information
              </p>
              <p className="text-xs text-slate-400 mt-0.5 lowercase">
                employment and department details
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ProfileField label="department" value={profile.department} />
              <ProfileField label="designation" value={profile.designation} />
              <ProfileField label="joining date" value={profile.joiningDate} />
              <ProfileField label="employment status" value={profile.status} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
