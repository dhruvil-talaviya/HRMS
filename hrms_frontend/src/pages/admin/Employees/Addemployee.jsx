import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import PageHeader from "../../../components/layouts/PageHeader";
import Button from "../../../components/common/Button";
import {
  getDepartments,
  getDesignations,
  createStaff,
  getDesignationByDepartment,
  getRoles,
  updateStaff,
  getStaffById,
} from "../../../services/api";
import { toast } from "react-toastify";
import {
  MdArrowBack,
  MdPerson,
  MdWork,
  MdLock,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";

function Addemployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    departmentId: "",
    designationId: "",
    joiningDate: new Date().toISOString().split("T")[0],
    gender: "Male",
    dob: "1995-01-01",
    address: "",
    role: "Employee",
    accessRoleId: "",
    salary: "25000",
  });

  useEffect(() => {
    initForm();
  }, [id]);

  const initForm = async () => {
    try {
      setLoading(true);
      const [deptRes, roleRes] = await Promise.all([
        getDepartments(),
        getRoles(),
      ]);

      const deptList = deptRes.data?.data || [];
      const roleList = roleRes.data?.data || [];
      setDepartments(deptList);
      setRoles(roleList);

      // In edit mode: load the employee directly
      if (id) {
        const empRes = await getStaffById(id);
        const emp = empRes.data?.data;
        if (emp) {
          setFormData({
            fullName: emp.fullName || "",
            email: emp.email || "",
            phone: emp.phone || "",
            password: "",
            departmentId: emp.departmentId || "",
            designationId: emp.designationId || "",
            joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
            gender: emp.gender || "Male",
            dob: emp.dob ? emp.dob.split("T")[0] : "1995-01-01",
            address: emp.address || "",
            role: emp.role || "Employee",
            accessRoleId: emp.accessRoleId || "",
            salary: String(emp.salary || "25000"),
          });

          if (emp.departmentId) {
            const desigRes = await getDesignationByDepartment(emp.departmentId);
            setDesignations(desigRes.data?.data || []);
          }
        }
      } else {
        // In create mode: pre-select the first access role if available
        if (roleList.length > 0) {
          const defaultRole =
            roleList.find((r) => r.name.toLowerCase() === "employee") || roleList[0];
          setFormData((prev) => ({
            ...prev,
            accessRoleId: defaultRole.id,
          }));
        }
      }
    } catch (err) {
      console.error("Initialization error:", err);
      toast.error("Failed to load departments and roles");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;

    setFormData((prev) => ({
      ...prev,
      departmentId,
      designationId: "",
    }));

    if (!departmentId) {
      setDesignations([]);
      return;
    }

    try {
      const response = await getDesignationByDepartment(departmentId);
      setDesignations(response.data?.data || []);
    } catch (error) {
      console.error("Failed to load designations:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.departmentId) {
      toast.error("Please select a department");
      return;
    }

    if (!formData.designationId) {
      toast.error("Please select a designation");
      return;
    }

    if (!id && (!formData.password || formData.password.length < 4)) {
      toast.error("Password must be at least 4 characters long");
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      gender: formData.gender,
      departmentId: formData.departmentId,
      designationId: formData.designationId,
      dob: formData.dob,
      joiningDate: formData.joiningDate,
      salary: Number(formData.salary || 0),
      role: formData.role.trim() || "Employee",
      accessRoleId: formData.accessRoleId || null,
      address: formData.address.trim() || "Address on file",
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      setSubmitting(true);
      if (id) {
        await updateStaff(id, payload);
        toast.success("Employee record updated successfully!");
      } else {
        await createStaff(payload);
        toast.success("New staff account created successfully! Credentials active.");
      }
      navigate("/employees");
    } catch (error) {
      console.error("Submit error:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to save employee record";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <PageHeader title={id ? "Update Staff Member" : "Register New Staff Member"} subtitle="Loading..." />
        <div className="bg-white rounded-3xl p-8 border border-slate-100 h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={id ? "Update Staff Profile" : "Register New Staff Account"}
        subtitle={
          id
            ? "Update details, department placement, and permissions for this staff member."
            : "Create a staff profile with credentials so the employee can access the staff portal."
        }
        actions={
          <Link to="/employees">
            <Button variant="secondary" iconBefore={<MdArrowBack />}>
              Back to Directory
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Personal & Contact Information */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              <MdPerson />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                1. Personal & Contact Information
              </h3>
              <p className="text-xs text-slate-400">
                Basic biographical details and contact records
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Johnathan Doe"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Work Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. john.doe@company.com"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
              <span className="text-[11px] text-slate-400">Used as the login username</span>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                name="phone"
                maxLength="15"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white transition-all font-medium cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Residential Address */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Home Address</label>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, apartment, city, state and postal code..."
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Employment & Placement */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              <MdWork />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                2. Employment & Department Placement
              </h3>
              <p className="text-xs text-slate-400">
                Job classification, hierarchy, and salary configuration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                name="departmentId"
                required
                value={formData.departmentId}
                onChange={handleDepartmentChange}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white transition-all font-medium cursor-pointer"
              >
                <option value="">— Select Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Designation <span className="text-rose-500">*</span>
              </label>
              <select
                name="designationId"
                required
                value={formData.designationId}
                onChange={handleChange}
                disabled={!formData.departmentId}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white transition-all font-medium cursor-pointer disabled:opacity-50"
              >
                <option value="">
                  {formData.departmentId
                    ? "— Select Designation —"
                    : "Select a department first"}
                </option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title / Role Tag */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Job Title / Role Profile <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. Full Stack Engineer / UI Designer"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>

            {/* Joining Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Basic Salary */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Monthly Basic Salary (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                name="salary"
                min="0"
                value={formData.salary}
                onChange={handleChange}
                placeholder="25000"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Account Credentials & System Permissions */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              <MdLock />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                3. Portal Access & Security Credentials
              </h3>
              <p className="text-xs text-slate-400">
                Configure login credentials and user access permissions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Access Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                System Access Role <span className="text-rose-500">*</span>
              </label>
              <select
                name="accessRoleId"
                value={formData.accessRoleId}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white transition-all font-medium cursor-pointer"
              >
                <option value="">— Default Employee Role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400">
                Determines which modules and permissions this staff member has
              </span>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {id ? "Change Account Password (Optional)" : "Initial Portal Password"}
                {!id && <span className="text-rose-500"> *</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required={!id}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={id ? "Leave empty to keep existing password" : "e.g. Employee@2026"}
                  className="w-full px-4 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                {id
                  ? "Enter a new password only if you wish to reset it."
                  : "Employee will use this password to sign in to the portal."}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/employees")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            iconBefore={<MdSave className="text-lg" />}
            disabled={submitting}
          >
            {submitting
              ? "Saving Record..."
              : id
              ? "Save Changes"
              : "Register Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Addemployee;
