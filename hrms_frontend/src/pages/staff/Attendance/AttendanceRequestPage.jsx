import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import PageHeader from "../../../components/layouts/PageHeader";
import Button from "../../../components/common/Button";
import {
  getTodayAttendance,
  getAttendanceHistory,
  getMyAttendanceRequests,
  createMyAttendanceRequest,
} from "../../../services/api";
import { MdOutlineWarning, MdArrowBack, MdCheckCircleOutline } from "react-icons/md";

const REQUEST_TYPES = [
  "Forgot Clock Out",
  "Missing Break",
  "Attendance Correction",
  "Late Clock In",
  "Wrong Time",
  "Other",
];

const AttendanceRequestPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [eligibleDates, setEligibleDates] = useState([]);
  
  // Form State
  const [reqForm, setReqForm] = useState({
    requestType: "Forgot Clock Out",
    requestDate: "",
    reason: "",
    clockIn: "",
    clockOut: "",
  });

  // Verify eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setLoading(true);
        const [todayRes, histRes, reqRes] = await Promise.all([
          getTodayAttendance(),
          getAttendanceHistory(),
          getMyAttendanceRequests(),
        ]);

        const todayData = todayRes.data?.data?.attendance || null;
        const historyData = histRes.data?.data || [];
        const requestsData = reqRes.data?.data || [];

        const datesNeedingCorrection = [];

        // Check today's record (e.g. if it was auto closed or missed punch)
        if (todayData) {
          const isAutoClosed = todayData.notes?.includes("Auto clock-out");
          const isMissedPunch = todayData.status === "Missed Punch";
          const isAbsent = todayData.status === "Absent";
          if (isAutoClosed || isMissedPunch || isAbsent) {
            datesNeedingCorrection.push({
              date: todayData.date,
              type: isAutoClosed ? "Auto Closed Shift" : isMissedPunch ? "Forgot Clock Out" : "Attendance Missing",
              clockIn: todayData.clockIn ? dayjs(todayData.clockIn).format("HH:mm") : "",
              clockOut: todayData.clockOut ? dayjs(todayData.clockOut).format("HH:mm") : "",
            });
          }
        }

        // Check history records (up to last 15 days)
        historyData.slice(0, 15).forEach((rec) => {
          const isAutoClosed = rec.notes?.includes("Auto clock-out");
          const isMissedPunch = rec.status === "Missed Punch";
          const isAbsent = rec.status === "Absent";
          const needsOut = rec.clockIn && !rec.clockOut; // forgot to clock out yesterday/earlier day
          
          if (isAutoClosed || isMissedPunch || isAbsent || needsOut) {
            // Check if request already submitted and approved/pending for this date
            const alreadyRequested = requestsData.some(
              (r) => r.requestDate === rec.date && ["Pending", "Approved"].includes(r.status)
            );
            if (!alreadyRequested) {
              datesNeedingCorrection.push({
                date: rec.date,
                type: isAutoClosed
                  ? "Auto Closed Shift"
                  : needsOut || isMissedPunch
                  ? "Forgot Clock Out"
                  : "Attendance Missing",
                clockIn: rec.clockIn ? dayjs(rec.clockIn).format("HH:mm") : "",
                clockOut: rec.clockOut ? dayjs(rec.clockOut).format("HH:mm") : "",
              });
            }
          }
        });

        // Also check if any request has admin-requested clarification
        const clarificationRequests = requestsData.filter(
          (r) => r.status?.toLowerCase().includes("clarification")
        );
        clarificationRequests.forEach((req) => {
          datesNeedingCorrection.push({
            date: req.requestDate,
            type: "Admin Requested Clarification",
            clockIn: req.payload?.clockIn ? dayjs(req.payload.clockIn).format("HH:mm") : "",
            clockOut: req.payload?.clockOut ? dayjs(req.payload.clockOut).format("HH:mm") : "",
            reason: req.reason,
            reqId: req.id,
          });
        });

        if (datesNeedingCorrection.length === 0) {
          toast.info("No attendance corrections are required at this time.");
          navigate("/staff/dashboard");
          return;
        }

        setEligibleDates(datesNeedingCorrection);
        
        // Pre-fill form with the first eligible correction date
        const first = datesNeedingCorrection[0];
        setReqForm({
          requestType: first.type.includes("Forgot") ? "Forgot Clock Out" : "Attendance Correction",
          requestDate: first.date,
          reason: first.reason || "",
          clockIn: first.clockIn || "",
          clockOut: first.clockOut || "",
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to check attendance correction eligibility:", err);
        toast.error("Could not fetch eligibility details.");
        navigate("/staff/dashboard");
      }
    };

    checkEligibility();
  }, [navigate]);

  // Handle date select change
  const handleDateChange = (date) => {
    const found = eligibleDates.find((d) => d.date === date);
    if (found) {
      setReqForm({
        ...reqForm,
        requestDate: date,
        requestType: found.type.includes("Forgot") ? "Forgot Clock Out" : "Attendance Correction",
        clockIn: found.clockIn || "",
        clockOut: found.clockOut || "",
      });
    } else {
      setReqForm({ ...reqForm, requestDate: date });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reqForm.requestDate) return toast.error("Date is required");
    if (!reqForm.reason.trim()) return toast.error("Reason is required");

    const payload = {};
    if (reqForm.clockIn) {
      payload.clockIn = `${reqForm.requestDate}T${reqForm.clockIn}:00`;
    }
    if (reqForm.clockOut) {
      payload.clockOut = `${reqForm.requestDate}T${reqForm.clockOut}:00`;
    }

    // Map custom request types to database enums if needed
    // Regularization | Missed Punch | Attendance Correction | Work From Home | On Duty
    let mappedType = "Attendance Correction";
    if (reqForm.requestType === "Forgot Clock Out") mappedType = "Missed Punch";
    else if (reqForm.requestType === "Late Clock In") mappedType = "Regularization";

    setBusy(true);
    try {
      await createMyAttendanceRequest({
        requestType: mappedType,
        requestDate: reqForm.requestDate,
        reason: reqForm.reason,
        payload: Object.keys(payload).length ? payload : null,
      });

      toast.success("Correction request submitted successfully");
      navigate("/staff/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <PageHeader title="Attendance Correction Request" subtitle="Loading..." />
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-96 flex items-center justify-center">
          <div className="text-slate-400 text-sm font-medium">Validating correction eligibility...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/staff/dashboard")}
          className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all shadow-sm"
        >
          <MdArrowBack className="text-xl" />
        </button>
        <PageHeader
          title="Request Attendance Correction"
          subtitle="Correct missing timestamps, forgot clock-outs, or auto-closed shifts."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Instructions & Eligible Dates */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 text-amber-800">
            <div className="flex gap-3 items-start">
              <MdOutlineWarning className="text-amber-500 text-2xl flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold mb-1">Actions Required</h4>
                <p className="text-xs leading-relaxed opacity-90">
                  The system detected missing attendance records, auto-closed shifts, or clarify requests for you. Please file regularizations below.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-3">
              Eligible Dates ({eligibleDates.length})
            </h3>
            <div className="flex flex-col gap-2">
              {eligibleDates.map((item) => (
                <button
                  key={item.date}
                  onClick={() => handleDateChange(item.date)}
                  className={`text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 ${
                    reqForm.requestDate === item.date
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-100 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-xs font-bold">{dayjs(item.date).format("dddd, MMM DD, YYYY")}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold self-start ${
                    item.type.includes("Forgot")
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : item.type.includes("Auto")
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}>
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Date */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">
                  Target Date *
                </label>
                <select
                  required
                  value={reqForm.requestDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="p-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm text-slate-700 outline-none focus:border-primary transition-all focus:bg-white"
                >
                  {eligibleDates.map((d) => (
                    <option key={d.date} value={d.date}>
                      {dayjs(d.date).format("MMM DD, YYYY")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Type */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">
                  Request Reason / Type *
                </label>
                <select
                  value={reqForm.requestType}
                  onChange={(e) => setReqForm({ ...reqForm, requestType: e.target.value })}
                  className="p-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm text-slate-700 outline-none focus:border-primary transition-all focus:bg-white"
                >
                  {REQUEST_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Adjustments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">
                  Corrected Clock In Time
                </label>
                <input
                  type="time"
                  value={reqForm.clockIn}
                  onChange={(e) => setReqForm({ ...reqForm, clockIn: e.target.value })}
                  className="p-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm text-slate-700 outline-none focus:border-primary transition-all focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">
                  Corrected Clock Out Time
                </label>
                <input
                  type="time"
                  value={reqForm.clockOut}
                  onChange={(e) => setReqForm({ ...reqForm, clockOut: e.target.value })}
                  className="p-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm text-slate-700 outline-none focus:border-primary transition-all focus:bg-white"
                />
              </div>
            </div>

            {/* Reason Explanation */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">
                Explanatory Reason *
              </label>
              <textarea
                required
                rows={4}
                value={reqForm.reason}
                onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                placeholder="Briefly explain the reason for this correction (e.g. Forgot to punch out due to offsite client meeting)..."
                className="p-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm text-slate-700 outline-none focus:border-primary transition-all focus:bg-white resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/staff/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={busy}
                iconBefore={<MdCheckCircleOutline className="text-lg" />}
              >
                {busy ? "Submitting..." : "Submit Correction"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRequestPage;
