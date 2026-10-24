import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/layouts/PageHeader";
import DataTable from "../../../components/tables/DataTable";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import KPICard from "../../../components/cards/KPICard";
import {
  MdSearch,
  MdPersonAdd,
  MdFileDownload,
  MdUpdate,
  MdVisibility,
  MdPeople,
  MdCheckCircle,
  MdHourglassEmpty,
  MdDomain,
  MdBlock,
} from "react-icons/md";
import {
  getDepartments,
  getDesignations,
  getAllStaff,
  getRoles,
  updateStaffStatus,
} from "../../../services/api";
import { toast } from "react-toastify";

const EmployeeList = () => {
  const navigate = useNavigate();

  // STATE
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emp, dept, desig, roleRes] = await Promise.all([
        getAllStaff(),
        getDepartments(),
        getDesignations(),
        getRoles(),
      ]);

      let formattedEmployees = (emp.data?.data || []).map((e) => ({
        ...e,
        name: e.fullName || e.name,
        department:
          dept.data?.data?.find((d) => d.id === e.departmentId)?.name || e.department || "-",
        designation:
          desig.data?.data?.find((d) => d.id === e.designationId)?.title || e.designation || "-",
        accessRole:
          roleRes.data?.data?.find((r) => r.id === e.accessRoleId)?.name || e.accessRole || "-",
      }));

      if (formattedEmployees.length === 0) {
        const { initialEmployees } = await import("../../../data/mockData");
        formattedEmployees = initialEmployees;
      }

      setEmployees(formattedEmployees);
      setDepartments(dept.data?.data || []);
      setDesignations(desig.data?.data || []);
      setRoles(roleRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load staff list:", err);
      toast.error("Could not load staff directory");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "InActive" : "Active";
    try {
      await updateStaffStatus(staffId, newStatus);
      toast.success(`Employee status set to ${newStatus}`);
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === staffId ? { ...emp, status: newStatus } : emp
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update staff status");
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const name = String(emp?.name ?? "");
      const id = String(emp?.id ?? "");
      const email = String(emp?.email ?? "");

      const search = searchQuery.toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(search) ||
        id.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search);

      const matchesDept =
        selectedDept === "All" || emp?.department === selectedDept;

      const matchesStatus =
        selectedStatus === "All" || emp?.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Active").length;
    const inactive = employees.filter((e) => e.status !== "Active").length;
    const deptCount = new Set(employees.map((e) => e.department).filter((d) => d && d !== "-")).size;
    return { total, active, inactive, deptCount };
  }, [employees]);

  // CSV Exporter
  const exportToCSV = () => {
    const headers = [
      "Employee ID,Name,Department,Designation,Email,Phone,Joining Date,Status",
    ];
    const rows = filteredEmployees.map(
      (e) =>
        `"${e.id}","${e.name}","${e.department}","${e.designation}","${e.email}","${e.phone}","${e.joiningDate ? String(e.joiningDate).split("T")[0] : ""}","${e.status}"`
    );
    const blob = new Blob([[headers, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `cygnux_employees_${new Date().toISOString().split("T")[0]}.csv`
    );
    a.click();
  };

  // Table columns definition
  const columns = [
    {
      header: "Employee Name",
      accessor: "name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} color={row.avatarColor || "#2563EB"} size={36} />
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary text-sm">{row.name}</span>
            <span className="text-xs text-text-muted">ID: #{row.id}</span>
          </div>
        </div>
      ),
    },
    { header: "Department", accessor: "department", sortable: true },
    { header: "Designation", accessor: "designation", sortable: true },
    {
      header: "Contact Email",
      accessor: "email",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-text-secondary truncate max-w-[180px] block" title={row.email}>
          {row.email}
        </span>
      ),
    },
    {
      header: "Joining Date",
      accessor: "joiningDate",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-text-secondary">
          {row.joiningDate ? String(row.joiningDate).split("T")[0] : "—"}
        </span>
      ),
    },
    {
      header: "Role & Access",
      accessor: "accessRole",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {row.accessRole !== "-" ? row.accessRole : row.role || "Employee"}
        </span>
      ),
    },
    {
      header: "Account Status",
      accessor: "status",
      sortable: true,
      render: (row) => (
        <Badge status={row.status === "Active" ? "Active" : "Inactive"}>
          {row.status || "Active"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link to={`/employees/${row.id}`} title="View Full Profile">
            <Button
              size="sm"
              variant="ghost"
              iconBefore={<MdVisibility className="text-base text-slate-600 hover:text-blue-600" />}
              aria-label="View Profile"
            />
          </Link>
          <Button
            size="sm"
            variant="ghost"
            title="Edit Staff Information"
            iconBefore={<MdUpdate className="text-base text-blue-600" />}
            onClick={() => navigate(`/updateemployee/${row.id}`)}
            aria-label="Update Employee"
          />
          <Button
            size="sm"
            variant="ghost"
            title={row.status === "Active" ? "Deactivate Account" : "Activate Account"}
            iconBefore={
              row.status === "Active" ? (
                <MdBlock className="text-base text-rose-500 hover:text-rose-700" />
              ) : (
                <MdCheckCircle className="text-base text-emerald-500 hover:text-emerald-700" />
              )
            }
            onClick={() => handleToggleStatus(row.id, row.status)}
            aria-label="Toggle Status"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Directory & Accounts"
        subtitle="View, create, and manage employee accounts and access credentials"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              iconBefore={<MdFileDownload className="text-lg" />}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              iconBefore={<MdPersonAdd className="text-lg" />}
              onClick={() => navigate("/addemployee")}
            >
              Add New Staff
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Staff"
          value={metrics.total}
          icon={<MdPeople />}
          trend="All registered members"
        />
        <KPICard
          title="Active Accounts"
          value={metrics.active}
          icon={<MdCheckCircle />}
          trend="Can access employee portal"
        />
        <KPICard
          title="Inactive / Pending"
          value={metrics.inactive}
          icon={<MdHourglassEmpty />}
          trend="Requires activation or setup"
        />
        <KPICard
          title="Active Departments"
          value={metrics.deptCount}
          icon={<MdDomain />}
          trend="Staffed functional units"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white border border-slate-100 rounded-3xl p-4 md:px-6 shadow-xs">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 items-stretch sm:items-center">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 w-full sm:w-[280px] gap-2.5 transition-all focus-within:border-primary focus-within:bg-white">
            <MdSearch className="text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none bg-transparent outline-none w-full text-xs text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium outline-none cursor-pointer w-full sm:w-auto transition-all focus:border-primary focus:bg-white"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium outline-none cursor-pointer w-full sm:w-auto transition-all focus:border-primary focus:bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="InActive">Inactive Only</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium text-right">
          Showing <span className="font-bold text-slate-700">{filteredEmployees.length}</span> of{" "}
          <span className="font-bold text-slate-700">{employees.length}</span> employees
        </div>
      </div>

      {/* Staff Table */}
      <DataTable columns={columns} data={filteredEmployees} loading={loading} />
    </div>
  );
};

export default EmployeeList;
