import { useState, useEffect } from "react";
import { 
  getShiftAssignments, 
  createShiftAssignment, 
  updateShiftAssignment, 
  deleteShiftAssignment, // Added this import
  getAllStaff, 
  getDepartments, 
  getShifts 
} from "../../../../services/api";
import DataTable from "../../../../components/tables/DataTable";
import Button from "../../../../components/common/Button";
import Badge from "../../../../components/common/Badge";
import DetailModal from "../../../../components/modals/DetailModal";
import Avatar from "../../../../components/common/Avatar";
import { MdAdd } from "react-icons/md";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const ShiftAssignmentTab = ({ defaultShiftId }) => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [assignmentType, setAssignmentType] = useState("Single"); 
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(defaultShiftId || "");
  const [effectiveFrom, setEffectiveFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [effectiveTo, setEffectiveTo] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (defaultShiftId) {
      setSelectedShiftId(defaultShiftId);
    }
  }, [defaultShiftId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, empRes, deptRes, shiftRes] = await Promise.all([
        getShiftAssignments(),
        getAllStaff(),
        getDepartments(),
        getShifts(),
      ]);

      if (assignRes.data?.success) setAssignments(assignRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (shiftRes.data?.success) setShifts(shiftRes.data.data);
    } catch (err) {
      console.error("Error loading assignment tab data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = () => {
    setIsEditing(false);
    setEditId(null);
    setAssignmentType("Single");
    setSelectedEmployeeId("");
    setSelectedDeptId("");
    setBulkEmployeeIds([]);
    setSelectedShiftId(defaultShiftId || (shifts[0]?.id || ""));
    setEffectiveFrom(dayjs().format("YYYY-MM-DD"));
    setEffectiveTo("");
    setRemarks("");
    setIsModalOpen(true);
  };

  // Populate modal for editing
  const handleEdit = (row) => {
    setIsEditing(true);
    setEditId(row.id);
    setAssignmentType("Single"); // Usually edits are done on a per-employee basis
    setSelectedEmployeeId(row.employeeId || "");
    setSelectedShiftId(row.shiftId || "");
    setEffectiveFrom(row.effectiveFrom || dayjs().format("YYYY-MM-DD"));
    setEffectiveTo(row.effectiveTo || "");
    setRemarks(row.remarks || "");
    setIsModalOpen(true);
  };

  // Toggle between Active and InActive
  const handleToggleStatus = async (row) => {
    try {
      const newStatus = row.status === "Active" ? "InActive" : "Active";
      const res = await updateShiftAssignment(row.id, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Shift assignment ${newStatus === "Active" ? "activated" : "deactivated"} successfully`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // Delete Assignment
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shift assignment?")) return;
    
    try {
      const res = await deleteShiftAssignment(id);
      if (res.data?.success) {
        toast.success("Shift assignment deleted successfully");
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete assignment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      
      if (isEditing) {
        // Edit existing assignment
        const updatePayload = {
          shiftId: selectedShiftId,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          remarks,
          // Add other fields if your backend requires them for updates
        };
        res = await updateShiftAssignment(editId, updatePayload);
      } else {
        // Create new assignment
        const createPayload = {
          assignmentType,
          shiftId: selectedShiftId,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          remarks,
          employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
          departmentId: selectedDeptId || undefined,
          bulkEmployeeIds: bulkEmployeeIds.map(Number),
        };
        res = await createShiftAssignment(createPayload);
      }

      if (res.data?.success) {
        toast.success(`Shift ${isEditing ? "updated" : "assigned"} successfully`);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving shift assignment");
    }
  };

  const handleBulkEmployeeToggle = (id) => {
    setBulkEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const columns = [
    {
      header: "Employee",
      accessor: "employeeName",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employeeName} size={30} />
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{row.employeeName}</span>
            <span className="text-xs text-text-secondary">{row.employeeEmail}</span>
          </div>
        </div>
      ),
    },
    { header: "Department", accessor: "departmentName", sortable: true },
    { header: "Shift Name", accessor: "shiftName", sortable: true },
    { header: "Start Time", accessor: "startTime" },
    { header: "End Time", accessor: "endTime" },
    { header: "Effective From", accessor: "effectiveFrom", sortable: true },
    { header: "Effective To", accessor: "effectiveTo", render: (row) => row.effectiveTo || "Ongoing" },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => (
        <Badge status={row.status === "Active" ? "Active" : "InActive"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex items-center gap-6">
          {/* Activate / Deactivate text button */}
          <button 
            type="button"
            onClick={() => handleToggleStatus(row)}
            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            style={{ color: '#2563eb' }}
          >
            {row.status === "Active" ? "Deactivate" : "Activate"}
          </button>
          
          {/* Edit text button */}
          <button 
            type="button"
            onClick={() => handleEdit(row)}
            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            style={{ color: '#2563eb' }}
          >
            Edit
          </button>
          
          {/* Delete outline button */}
          <button 
            type="button"
            onClick={() => handleDelete(row.id)}
            className="px-4 py-1.5 border border-red-500 text-red-500 font-semibold rounded-md hover:bg-red-50 transition-colors"
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]; 

  if (loading) {
    return <div className="py-12 text-center text-text-secondary">Loading Assignments...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-text-primary">Employee Shift Assignments</h3>
        <Button variant="primary" iconBefore={<MdAdd />} onClick={handleOpenAssign}>
          Assign Shift
        </Button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={assignments} pageSize={8} emptyMessage="No shift assignments registered yet." />

      {/* Assignment Modal */}
      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Shift Assignment" : "Assign Employee Shift"} maxWidth="500px">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Hide Assignment Type toggle if we are editing an existing assignment */}
          {!isEditing && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Assignment Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="Single"
                    checked={assignmentType === "Single"}
                    onChange={() => setAssignmentType("Single")}
                  />
                  Single Staff
                </label>
                <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="Bulk"
                    checked={assignmentType === "Bulk"}
                    onChange={() => setAssignmentType("Bulk")}
                  />
                  Bulk Staff
                </label>
                <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="Department"
                    checked={assignmentType === "Department"}
                    onChange={() => setAssignmentType("Department")}
                  />
                  Department
                </label>
              </div>
            </div>
          )}

          {/* Form Conditional fields */}
          {assignmentType === "Single" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Select Employee *</label>
              <select
                required
                disabled={isEditing} // Often you lock the user selection while editing
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.email})</option>
                ))}
              </select>
            </div>
          )}

          {!isEditing && assignmentType === "Department" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Select Department *</label>
              <select
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {!isEditing && assignmentType === "Bulk" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Select Employees (Multiple) *</label>
              <div className="border border-border-color rounded-md p-3 max-h-40 overflow-y-auto bg-bg-primary flex flex-col gap-2">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkEmployeeIds.includes(emp.id)}
                      onChange={() => handleBulkEmployeeToggle(emp.id)}
                    />
                    {emp.fullName} ({emp.email})
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-secondary">Select Shift Profile *</label>
            <select
              required
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
            >
              <option value="">-- Choose Shift --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Effective From *</label>
              <input
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary">Effective To (Optional)</label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-secondary">Remarks</label>
            <textarea
              rows="3"
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-color mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Save Changes" : "Assign Shift"}
            </Button>
          </div>
        </form>
      </DetailModal>
    </div>
  );
};

export default ShiftAssignmentTab;
