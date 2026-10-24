import { useState, useEffect, useMemo } from "react";
import { getAttendanceRequests, approveAttendanceRequest, rejectAttendanceRequest } from "../../../../services/api";
import DataTable from "../../../../components/tables/DataTable";
import Button from "../../../../components/common/Button";
import Badge from "../../../../components/common/Badge";
import KPICard from "../../../../components/cards/KPICard";
import DetailModal from "../../../../components/modals/DetailModal";
import { MdHourglassEmpty, MdCheckCircle, MdCancel, MdVisibility } from "react-icons/md";
import { toast } from "react-toastify";

const AttendanceRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionComment, setActionComment] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getAttendanceRequests();
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenView = (req) => {
    setSelectedRequest(req);
    setActionComment("");
    setIsViewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const res = await approveAttendanceRequest(selectedRequest.id, { comment: actionComment });
      if (res.data?.success) {
        toast.success("Request approved successfully");
        setIsViewModalOpen(false);
        fetchRequests();
      }
    } catch(err) {
      toast.error(err.response?.data?.message || "Error approving request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      const res = await rejectAttendanceRequest(selectedRequest.id, { comment: actionComment });
      if (res.data?.success) {
        toast.success("Request rejected successfully");
        setIsViewModalOpen(false);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error rejecting request");
    }
  };

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "Pending").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const rejected = requests.filter((r) => r.status === "Rejected").length;
    return { pending, approved, rejected };
  }, [requests]);

  const columns = [
    { header: "Employee Name", accessor: "employeeName", sortable: true },
    { header: "Department", accessor: "departmentName", sortable: true },
    { header: "Request Type", accessor: "requestType", sortable: true },
    { header: "Request Date", accessor: "requestDate", sortable: true },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <Button variant="outline" size="sm" iconBefore={<MdVisibility />} onClick={() => handleOpenView(row)}>
          Process
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div className="py-12 text-center text-text-secondary">Loading Requests...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KPICard title="Pending Requests" value={stats.pending} icon={<MdHourglassEmpty />} color="amber" variant="clean" />
        <KPICard title="Approved Requests" value={stats.approved} icon={<MdCheckCircle />} color="emerald" variant="clean" />
        <KPICard title="Rejected Requests" value={stats.rejected} icon={<MdCancel />} color="rose" variant="clean" />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={requests} pageSize={8} emptyMessage="No attendance requests logged yet." />

      {/* Detail Modal */}
      <DetailModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Process Attendance Request" maxWidth="500px">
        {selectedRequest && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Employee:</span>
              <span className="text-text-primary font-bold">{selectedRequest.employeeName}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Request Type:</span>
              <span className="text-text-primary font-semibold">{selectedRequest.requestType}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary">Target Date:</span>
              <span className="text-text-primary">{selectedRequest.requestDate}</span>
            </div>
            <div className="flex flex-col gap-1 border-b border-border-color pb-2">
              <span className="font-semibold text-text-secondary font-bold">Reason/Justification:</span>
              <span className="text-text-primary bg-bg-primary p-2.5 rounded-lg border border-border-color mt-1 italic">
                "{selectedRequest.reason}"
              </span>
            </div>

            {selectedRequest.status === "Pending" ? (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary">Approval/Rejection Comments</label>
                  <textarea
                    rows="3"
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder="Provide comment for review log..."
                    className="p-2.5 border border-border-color rounded-md bg-bg-primary text-sm text-text-primary outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-border-color mt-2">
                  <Button variant="danger" iconBefore={<MdCancel />} onClick={handleReject}>
                    Reject
                  </Button>
                  <Button variant="primary" iconBefore={<MdCheckCircle />} onClick={handleApprove}>
                    Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex justify-between border-b border-border-color pb-2">
                  <span className="font-semibold text-text-secondary">Processed Status:</span>
                  <Badge status={selectedRequest.status}>{selectedRequest.status}</Badge>
                </div>
                <div className="flex justify-between border-b border-border-color pb-2">
                  <span className="font-semibold text-text-secondary">Processed By:</span>
                  <span className="text-text-primary font-bold">{selectedRequest.approvedBy || "—"}</span>
                </div>
                {selectedRequest.approvalComment && (
                  <div className="flex flex-col gap-1 pb-2">
                    <span className="font-semibold text-text-secondary">Approval Comments:</span>
                    <span className="text-text-primary bg-bg-primary p-2.5 rounded-lg border border-border-color italic">
                      "{selectedRequest.approvalComment}"
                    </span>
                  </div>
                )}
                {selectedRequest.rejectionComment && (
                  <div className="flex flex-col gap-1 pb-2">
                    <span className="font-semibold text-text-secondary">Rejection Reason:</span>
                    <span className="text-text-primary bg-bg-primary p-2.5 rounded-lg border border-border-color italic">
                      "{selectedRequest.rejectionComment}"
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default AttendanceRequestsTab;
