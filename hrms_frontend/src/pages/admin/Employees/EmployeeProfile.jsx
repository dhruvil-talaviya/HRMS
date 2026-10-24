import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/layouts/PageHeader";
import Avatar from "../../../components/common/Avatar";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Tabs from "../../../components/common/Tabs";
import DetailModal from "../../../components/modals/DetailModal";
import { toast } from "react-toastify";
import {
  getStaffById,
  updateStaffStatus,
} from "../../../services/api";
import {
  MdDescription,
  MdFileDownload,
  MdStar,
  MdLocalPrintshop,
  MdArrowBack,
  MdEdit,
  MdCheckCircle,
  MdBlock,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdBadge,
  MdDateRange,
  MdAttachMoney,
} from "react-icons/md";

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState("Current Month");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await getStaffById(id);
      if (response.data?.data) {
        setEmployee(response.data.data);
      } else {
        setEmployee(null);
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Could not load employee details");
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!employee) return;
    const newStatus = employee.status === "Active" ? "InActive" : "Active";
    try {
      setStatusUpdating(true);
      await updateStaffStatus(employee.id, newStatus);
      toast.success(`Staff status changed to ${newStatus}`);
      setEmployee((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update staff status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <PageHeader title="Staff Profile" subtitle="Loading employee information..." />
        <div className="bg-white rounded-3xl p-8 border border-slate-100 h-48" />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 h-96" />
          <div className="bg-white rounded-3xl p-6 border border-slate-100 h-96" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 max-w-md mx-auto my-12 shadow-sm flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-3xl">
          <MdBlock />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Employee Profile Not Found</h2>
          <p className="text-xs text-slate-500">The requested staff record does not exist or has been removed.</p>
        </div>
        <Link to="/employees">
          <Button variant="primary" iconBefore={<MdArrowBack />}>
            Back to Staff Directory
          </Button>
        </Link>
      </div>
    );
  }

  // Safe defaults for optional relations and stats
  const salaryNum = Number(employee.salary || 0);
  const basicSalary = salaryNum > 0 ? Math.round(salaryNum * 0.6) : 0;
  const hra = salaryNum > 0 ? Math.round(salaryNum * 0.25) : 0;
  const allowances = salaryNum > 0 ? Math.round(salaryNum * 0.15) : 0;
  const pf = salaryNum > 0 ? Math.round(basicSalary * 0.12) : 0;
  const netSalary = Math.max(0, salaryNum - pf);

  const leaveBalance = employee.leaveBalance || {
    sick: 12,
    sickUsed: 2,
    casual: 12,
    casualUsed: 3,
    paid: 24,
    paidUsed: 5,
  };

  const performance = employee.performance || {
    kpiScore: 92,
    rating: 4.8,
    reviewStatus: "Completed",
    completedReviews: 4,
  };

  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "payroll", label: "Payroll & Salary" },
    { id: "leave", label: "Leave Summary" },
    { id: "attendance", label: "Attendance Record" },
    { id: "performance", label: "Performance Profile" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee Profile"
        subtitle={`Viewing comprehensive profile for ${employee.fullName || "Staff Member"}`}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/employees">
              <Button variant="secondary" iconBefore={<MdArrowBack />}>
                Staff Directory
              </Button>
            </Link>
            <Button
              variant="primary"
              iconBefore={<MdEdit />}
              onClick={() => navigate(`/updateemployee/${employee.id}`)}
            >
              Edit Staff
            </Button>
          </div>
        }
      />

      {/* Header Profile Banner Card */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 relative" />
        <div className="px-6 pb-6 flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 relative z-10 text-center sm:text-left">
          <div className="border-4 border-white shadow-lg rounded-3xl overflow-hidden bg-slate-900">
            <Avatar name={employee.fullName} color={employee.avatarColor || "#2563EB"} size={100} />
          </div>

          <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 w-full">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {employee.fullName}
                </h2>
                <Badge status={employee.status === "Active" ? "Active" : "Inactive"}>
                  {employee.status || "Active"}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-500">
                {employee.designationName || employee.role || "Staff"} ·{" "}
                {employee.departmentName || "General Department"} · ID: #{employee.id}
              </p>
            </div>

            {/* Quick Status Toggle Action */}
            <Button
              variant={employee.status === "Active" ? "secondary" : "primary"}
              size="sm"
              iconBefore={employee.status === "Active" ? <MdBlock /> : <MdCheckCircle />}
              onClick={handleToggleStatus}
              disabled={statusUpdating}
            >
              {employee.status === "Active" ? "Deactivate Account" : "Activate Account"}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Details Sidebar + Tabbed Details */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Contact & Employment Quick Info */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Contact Information
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MdEmail className="text-blue-500 text-lg shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</span>
              <span className="text-slate-700 font-semibold text-xs truncate" title={employee.email}>
                {employee.email || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MdPhone className="text-blue-500 text-lg shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone</span>
              <span className="text-slate-700 font-semibold text-xs">{employee.phone || "—"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MdLocationOn className="text-blue-500 text-lg shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</span>
              <span className="text-slate-700 font-semibold text-xs">{employee.address || "—"}</span>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mt-2">
            Employment Details
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MdBadge className="text-indigo-500 text-lg shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Designation</span>
              <span className="text-slate-700 font-semibold text-xs">
                {employee.designationName || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MdDateRange className="text-indigo-500 text-lg shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Joining Date</span>
              <span className="text-slate-700 font-semibold text-xs">
                {employee.joiningDate ? employee.joiningDate.split("T")[0] : "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MdAttachMoney className="text-emerald-500 text-lg shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Compensation</span>
              <span className="text-emerald-600 font-extrabold text-sm">
                ₹{salaryNum.toLocaleString("en-IN")} / mo
              </span>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[460px]">
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Identity & Background
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Date of Birth</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {employee.dob ? employee.dob.split("T")[0] : "—"}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Gender</span>
                  <span className="text-sm font-semibold text-slate-700">{employee.gender || "—"}</span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Portal Role</span>
                  <span className="text-sm font-semibold text-slate-700">{employee.role || "Employee"}</span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Staff Internal ID</span>
                  <span className="text-sm font-semibold text-slate-700">#{employee.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Tab */}
          {activeTab === "payroll" && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Monthly Salary Breakdown
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-medium">Basic Pay</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">₹{basicSalary.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-medium">HRA & Allowances</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">₹{(hra + allowances).toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs text-emerald-600 font-medium">Est. Net Take-Home</span>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">₹{netSalary.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mt-4">
                Available Payslips
              </div>
              <div className="flex flex-col gap-2.5">
                {["Current Month", "Previous Month"].map((month) => (
                  <div
                    key={month}
                    className="flex justify-between items-center p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100"
                  >
                    <span className="font-semibold text-sm text-slate-700">{month} Payslip</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedPayslipMonth(month);
                        setIsPayslipOpen(true);
                      }}
                    >
                      Preview Payslip
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Summary Tab */}
          {activeTab === "leave" && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Leave Balances
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-center flex flex-col gap-1">
                  <span className="text-xs font-semibold text-rose-600">Sick Leave</span>
                  <span className="text-2xl font-extrabold text-slate-800">
                    {leaveBalance.sick - leaveBalance.sickUsed} Left
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Used: {leaveBalance.sickUsed} / {leaveBalance.sick} Days
                  </span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center flex flex-col gap-1">
                  <span className="text-xs font-semibold text-amber-600">Casual Leave</span>
                  <span className="text-2xl font-extrabold text-slate-800">
                    {leaveBalance.casual - leaveBalance.casualUsed} Left
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Used: {leaveBalance.casualUsed} / {leaveBalance.casual} Days
                  </span>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center flex flex-col gap-1">
                  <span className="text-xs font-semibold text-blue-600">Paid Leave</span>
                  <span className="text-2xl font-extrabold text-slate-800">
                    {leaveBalance.paid - leaveBalance.paidUsed} Left
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Used: {leaveBalance.paidUsed} / {leaveBalance.paid} Days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Attendance Log Summary
              </div>
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Standard Work Shift Assigned</p>
                <p className="text-xs text-slate-400 mt-1">
                  Employee attendance is monitored live in the Attendance & Daily Logs console.
                </p>
                <div className="mt-4">
                  <Link to="/attendance">
                    <Button variant="secondary" size="sm">
                      Open Full Attendance Console
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Appraisal & Evaluation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-medium">KPI Score</span>
                  <p className="text-xl font-bold text-slate-800">{performance.kpiScore} / 100</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-medium">Average Star Rating</span>
                  <p className="text-xl font-bold text-slate-800 flex items-center gap-1">
                    <MdStar className="text-amber-400" /> {performance.rating} / 5.0
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Internal Employee Files
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "Employment Contract.pdf", size: "1.4 MB" },
                  { name: "Identification & Tax Form.pdf", size: "850 KB" },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MdDescription className="text-2xl text-blue-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" iconBefore={<MdFileDownload className="text-lg" />} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payslip Modal */}
      <DetailModal
        isOpen={isPayslipOpen}
        onClose={() => setIsPayslipOpen(false)}
        title={`Salary Slip Preview - ${selectedPayslipMonth}`}
        maxWidth="600px"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="secondary" iconBefore={<MdLocalPrintshop />} onClick={handlePrintPayslip}>
              Print Payslip
            </Button>
            <Button variant="primary" onClick={() => setIsPayslipOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div id="payslip-print-section" className="flex flex-col gap-5 p-4 border border-slate-200 rounded-2xl">
          <div className="flex justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">CYGNUX HRMS</h2>
              <p className="text-xs text-slate-400">Official Staff Payslip</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">{selectedPayslipMonth}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Staff ID</span>
              <span className="font-semibold text-slate-700">#{employee.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
              <span className="font-semibold text-slate-700">{employee.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
              <span className="font-semibold text-slate-700">{employee.departmentName || "General"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
              <span className="font-semibold text-slate-700">{employee.designationName || employee.role || "Staff"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between font-bold text-slate-600 border-b border-slate-200 pb-1">
              <span>Earnings</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Basic Salary</span>
              <span>₹{basicSalary.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>HRA & Special Allowances</span>
              <span>₹{(hra + allowances).toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-600 border-b border-slate-200 pb-1 mt-2">
              <span>Deductions</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>PF & Statutory Deductions</span>
              <span>₹{pf.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center pt-3 font-extrabold text-sm border-t border-slate-200 text-slate-800">
              <span>Net Take-home Pay</span>
              <span className="text-emerald-600">₹{netSalary.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </DetailModal>
    </div>
  );
};

export default EmployeeProfile;
