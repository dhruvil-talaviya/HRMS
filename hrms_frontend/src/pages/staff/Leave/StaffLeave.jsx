import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../../components/layouts/PageHeader";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { applyLeave, getLeave } from "../../../services/api";
import { toast } from "react-toastify";

const statusDot = {
  approved: "bg-success",
  pending: "bg-warning",
  rejected: "bg-danger",
};

const totalLeaves = {
  "Sick Leave": 12,
  "Casual Leave": 12,
  "Paid Leave": 24,
};

const StaffLeave = () => {
  const [showModal, setShowModal] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [form, setForm] = useState({
    leaveType: "Sick Leave",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [history, setHistory] = useState([]);

  const handleOpenModal = () => {
    setForm({
      leaveType: "Sick Leave",
      fromDate: "",
      toDate: "",
      reason: "",
    });
    setIsMultiDay(false);
    setShowModal(true);
  };

  const leaveBalance = Object.keys(totalLeaves).map((type) => {
    const used = history
      .filter(
        (leave) => leave.leaveType === type && leave.status?.toLowerCase() === "approved",
      )
      .reduce((total, leave) => {
        const days =
          Math.ceil(
            (new Date(leave.toDate) - new Date(leave.fromDate)) /
            (1000 * 60 * 60 * 24),
          ) + 1;

        return total + days;
      }, 0);

    let color = "#2563EB";
    let bg = "bg-primary/5";
    let border = "border-l-primary";
    let textColor = "text-primary";

    if (type === "Sick Leave") {
      color = "#EF4444";
      bg = "bg-danger/5";
      border = "border-l-danger";
      textColor = "text-danger";
    }

    if (type === "Casual Leave") {
      color = "#F59E0B";
      bg = "bg-warning/5";
      border = "border-l-warning";
      textColor = "text-warning";
    }

    return {
      leaveType: type,
      total: totalLeaves[type],
      used,
      color,
      bg,
      border,
      textColor,
    };
  });

  const handleApply = async () => {
    console.log("form", form);
    try {
      const from = form.fromDate;
      const to = isMultiDay ? form.toDate : form.fromDate;

      if (!form.leaveType || !from || !to || !form.reason) {
        toast.error("All fields are required");
        return;
      }
      if (new Date(to) < new Date(from)) {
        toast.error("To Date cannot be earlier than From Date");
        return;
      }
      const response = await applyLeave({
        ...form,
        fromDate: from,
        toDate: to,
      });

      toast.success(response.data.message);
      await fetchLeaveHistory();
      setForm({
        leaveType: "Sick Leave",
        fromDate: "",
        toDate: "",
        reason: "",
      });
      setIsMultiDay(false);
      setShowModal(false);
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const fetchLeaveHistory = async () => {
    try {
      const response = await getLeave();
      setHistory(response.data?.data || []);
    } catch (error) {
      console.log("Could not load leave history:", error);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  return (
    <div>
      <PageHeader
        title="My Leave"
        subtitle="View your leave balance, apply for leave and track requests"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            id="apply-leave-btn"
          >
            Apply Leave
          </Button>
        }
      />

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
        {leaveBalance.map((lb, i) => {
          const remaining = lb.total - lb.used;
          const pct = Math.round((lb.used / lb.total) * 100);
          return (
            <motion.div
              key={lb.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className={`bg-white border border-slate-100 border-l-4 ${lb.border} rounded-[24px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 font-bold">
                  {lb.leaveType}
                </p>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${lb.bg} ${lb.textColor}`}
                >
                  {remaining} left
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-800 mb-3">
                {remaining}
                <span className="text-base font-medium text-slate-400">
                  {" "}
                  / {lb.total}
                </span>
              </p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: lb.color }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {lb.used} used · {pct}% consumed
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-slate-800">Leave History</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {history.length} requests
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[
                  "Leave Type",
                  "From",
                  "To",
                  "Days",
                  "Reason",
                  "Applied On",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((req, idx) => (
                <motion.tr
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-700">
                    {req.leaveType}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{req.fromDate}</td>
                  <td className="px-5 py-3.5 text-slate-600">{req.toDate}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-bold">
                    {Math.ceil(
                      (new Date(req.toDate) - new Date(req.fromDate)) /
                      (1000 * 60 * 60 * 24),
                    ) + 1}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">
                    {req.reason}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {" "}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[req.status?.toLowerCase()] || "bg-slate-300"
                          }`}
                      />
                      <Badge status={req.status}>{req.status}</Badge>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-7"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Apply for Leave
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-sm transition-all"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Leave Type
                  </label>
                  <select
                    value={form.leaveType}
                    onChange={(e) =>
                      setForm({ ...form, leaveType: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 outline-none focus:border-primary transition-all"
                  >
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Paid Leave</option>
                  </select>
                </div>
                {/* Multi-day Checkbox */}
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="isMultiDay"
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked);
                      if (!e.target.checked) {
                        setForm((prev) => ({ ...prev, toDate: prev.fromDate }));
                      }
                    }}
                    className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isMultiDay" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Apply for Multiple Days
                  </label>
                </div>

                {!isMultiDay ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.fromDate}
                      onChange={(e) =>
                        setForm({ ...form, fromDate: e.target.value, toDate: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 outline-none focus:border-primary transition-all"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        From
                      </label>
                      <input
                        type="date"
                        value={form.fromDate}
                        onChange={(e) =>
                          setForm({ ...form, fromDate: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        To
                      </label>
                      <input
                        type="date"
                        value={form.toDate}
                        onChange={(e) =>
                          setForm({ ...form, toDate: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Reason
                  </label>
                  <textarea
                    rows={3}
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    placeholder="Briefly describe the reason..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 outline-none focus:border-primary transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApply}
                    className="flex-1"
                    id="submit-leave-btn"
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffLeave;
