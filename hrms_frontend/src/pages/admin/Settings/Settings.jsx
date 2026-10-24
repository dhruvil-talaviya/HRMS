import { useState, useEffect } from "react";
import { useHRMSData } from "../../../context/HRMSDataContext";
import PageHeader from "../../../components/layouts/PageHeader";
import Tabs from "../../../components/common/Tabs";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import {
  getRoles,
  createRole,
  updateRole,
  getPermissions,
  getRolePermissions,
  saveRolePermissions,
} from "../../../services/api";
import { toast } from "react-toastify";

const Settings = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
  });

  const handleEditRole = (role) => {
    setRoleForm({
      name: role.name,
      description: role.description,
    });

    setEditingRoleId(role.id);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    try {
      if (editingRoleId) {
        await updateRole(editingRoleId, roleForm);
        toast.success("Role Updated Successfully");
      } else {
        await createRole(roleForm);
        toast.success("Role Created Successfully");
      }

      loadRoles();
      setShowRoleModal(false);
      setRoleForm({
        name: "",
        description: "",
      });
      setEditingRoleId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const { companySettings, updateSettings, leavePolicies, payrollPolicies } =
    useHRMSData();

  const [activeTab, setActiveTab] = useState("company");

  // Local Form state for Company
  const [compForm, setCompForm] = useState({ ...companySettings });

  const tabs = [
    { id: "company", label: "Company Settings" },
    { id: "roles", label: "Roles & Permissions" },
    { id: "leave", label: "Leave Policies" },
    { id: "payroll", label: "Payroll Rules" },
    { id: "notifications", label: "Notification Settings" },
  ];

  useEffect(() => {
    loadRoles();
    fetchPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await getRoles();

      setRoles(res.data.data);

      if (res.data.data.length > 0) {
        await handleRoleSelect(res.data.data[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchPermissions = async () => {
    const res = await getPermissions();
    console.log("Permissions =>", res.data.data);
    setPermissions(res.data.data);
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleRoleSelect = async (role) => {
    try {
      setSelectedRole(role);

      const res = await getRolePermissions(role.id);

      // System roles => all permissions
      if (role.name === "SUPER_ADMIN" || role.name === "TENANT_ADMIN") {
        setSelectedPermissions(permissions.map((p) => p.id));
        return;
      }

      setSelectedPermissions(
        res.data.data.filter((item) => item.assigned).map((item) => item.id),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      toast.error("Select Role First");
      return;
    }

    await saveRolePermissions({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });

    toast.success("Permissions Saved Successfully");
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    updateSettings(compForm);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure platform rules, policies, and account setups"
      />

      <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 shadow-sm min-h-[480px]">
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Company Settings */}
        {activeTab === "company" && (
          <form onSubmit={handleCompanySubmit}>
            <h3 className="text-base font-bold text-text-primary mb-5 pb-2 border-b border-border-color">
              Company Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Company Name
                </label>
                <input
                  type="text"
                  value={compForm.companyName}
                  onChange={(e) =>
                    setCompForm({ ...compForm, companyName: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-md border border-border-color bg-bg-primary text-text-primary text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Official Email
                </label>
                <input
                  type="email"
                  value={compForm.companyEmail}
                  onChange={(e) =>
                    setCompForm({ ...compForm, companyEmail: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-md border border-border-color bg-bg-primary text-text-primary text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={compForm.companyPhone}
                  onChange={(e) =>
                    setCompForm({ ...compForm, companyPhone: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-md border border-border-color bg-bg-primary text-text-primary text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Base Currency
                </label>
                <select
                  value={compForm.currency}
                  onChange={(e) =>
                    setCompForm({ ...compForm, currency: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-md border border-border-color bg-bg-primary text-text-primary text-sm outline-none focus:border-primary transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Standard Timezone
                </label>
                <select
                  value={compForm.timezone}
                  onChange={(e) =>
                    setCompForm({ ...compForm, timezone: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-md border border-border-color bg-bg-primary text-text-primary text-sm outline-none focus:border-primary transition-all"
                >
                  <option value="UTC-5 (EST)">UTC-5 (EST)</option>
                  <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                  <option value="UTC+5:30 (IST)">UTC+5:30 (IST)</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Office Address
                </label>
                <textarea
                  rows="3"
                  value={compForm.address}
                  onChange={(e) =>
                    setCompForm({ ...compForm, address: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-md border border-border-color bg-bg-primary text-text-primary text-sm outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit" variant="primary">
                Save Profile Changes
              </Button>
            </div>
          </form>
        )}

        {/* Roles & Permissions */}
        {activeTab === "roles" && (
          <div>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-border-color">
              <h3 className="text-base font-bold text-text-primary">
                Roles & Permissions
              </h3>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingRoleId(null);

                  setRoleForm({
                    name: "",
                    description: "",
                  });

                  setShowRoleModal(true);
                }}
              >
                + Add Role
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Roles List */}

              <div className="bg-bg-primary border border-border-color rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text-primary text-sm">
                    Roles
                  </h4>
                </div>

                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => handleRoleSelect(role)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                        selectedRole?.id === role.id
                          ? "bg-blue-50 border-blue-500"
                          : "border-border-color hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-medium">{role.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Permissions */}
              <div className="lg:col-span-2 bg-bg-primary border border-border-color rounded-xl p-4">
                <h4 className="font-semibold text-text-primary mb-4">
                  Assigned Permissions
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        disabled={
                          selectedRole?.name === "SUPER_ADMIN" ||
                          selectedRole?.name === "TENANT_ADMIN"
                        }
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                      />

                      <span>{permission.name}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button variant="primary" onClick={handleSavePermissions}>
                    Save Permissions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRoleModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-5">Add New Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role Name{" "}
                  </label>

                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full border border-border-color rounded-lg px-3 py-2 text-sm"
                    placeholder="TEAM_LEAD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {" "}
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-border-color rounded-lg px-3 py-2 text-sm"
                    placeholder="Role Description"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel{" "}
                </Button>

                <Button variant="primary" onClick={handleSaveRole}>
                  {editingRoleId ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Policies */}
        {activeTab === "leave" && (
          <div>
            <h3 className="text-base font-bold text-text-primary mb-5 pb-2 border-b border-border-color">
              Company Leave Configurations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-3">
              {leavePolicies.map((p) => (
                <div
                  key={p.id}
                  className="bg-bg-primary border border-border-color rounded-lg p-4 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex justify-between items-center font-bold text-sm text-text-primary">
                    <span>{p.type}</span>
                    <Badge status="WFH">{p.allowance} Days / yr</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Accrual Cycle:</span>
                    <span className="font-semibold text-gray-800">
                      {p.accrual}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Carry Over:</span>
                    <span className="font-semibold text-gray-800">
                      {p.carryOver ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payroll Rules */}
        {activeTab === "payroll" && (
          <div>
            <h3 className="text-base font-bold text-text-primary mb-5 pb-2 border-b border-border-color">
              Financial Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-3">
              <div className="bg-bg-primary border border-border-color rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                <div className="font-bold text-sm text-gray-700">
                  PF contribution Rate
                </div>
                <div className="text-2xl font-extrabold text-blue-500 mt-2">
                  {payrollPolicies.pfContribution}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Deducted from gross base salary monthly
                </div>
              </div>

              <div className="bg-bg-primary border border-border-color rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                <div className="font-bold text-sm text-gray-700">
                  Standard Working Hours
                </div>
                <div className="text-2xl font-extrabold text-blue-500 mt-2">
                  {payrollPolicies.standardWorkingHours} Hours / mo
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Required check-ins to avoid salary deduction
                </div>
              </div>

              <div className="bg-bg-primary border border-border-color rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                <div className="font-bold text-sm text-gray-700">
                  Overtime Multiplier
                </div>
                <div className="text-2xl font-extrabold text-blue-500 mt-2">
                  {payrollPolicies.overtimeRate}x
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hourly rate calculation for extra logs
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-bold text-text-primary mb-3">
                Tax Brackets (Slabs)
              </h4>
              <div className="bg-bg-primary border border-border-color rounded-lg p-4 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-color text-text-secondary">
                      <th className="pb-2">Income Slab Range</th>
                      <th className="pb-2">Tax Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {payrollPolicies.taxSlab?.map((slab, idx) => (
                      <tr key={idx} className="text-text-primary">
                        <td className="py-2.5 font-medium">
                          {slab.upTo
                            ? `Up to $${slab.upTo.toLocaleString()}`
                            : `Above $${slab.above?.toLocaleString()}`}
                        </td>
                        <td className="py-2.5 font-semibold text-blue-600">
                          {slab.rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === "notifications" && (
          <div>
            <h3 className="text-base font-bold text-text-primary mb-5 pb-2 border-b border-border-color">
              Email & Alert Triggers
            </h3>
            <div className="flex flex-col gap-4 mt-4">
              {[
                "Send email alert on new leave application request",
                "Notify HR on new recruitment candidate submission",
                "Generate notifications for completed monthly payroll",
                "Send weekly attendance digests to department managers",
                "Notify employee on profile data updates",
              ].map((opt, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
