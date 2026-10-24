const Badge = ({ children, status = "neutral", className = "" }) => {
  const getVariant = (val) => {
    const v = val.toLowerCase();
    if (v === "active" || v === "present" || v === "approved" || v === "processed" || v === "hired" || v === "on-time" || v === "on time" || v === "paid" || v === "on duty" || v === "business trip") return "success";
    if (v === "on leave" || v === "late" || v === "pending" || v === "screening" || v === "technical round" || v === "offer" || v === "interview" || v === "half-day" || v === "half day" || v === "missed punch" || v === "weekly off") return "warning";
    if (v === "absent" || v === "rejected" || v === "suspended" || v === "inactive" || v === "unpaid") return "danger";
    if (v === "wfh" || v === "work from home" || v === "applied" || v === "active reviews" || v === "holiday") return "info";
    return "neutral";
  };

  const variant = getVariant(status || children || "");

  const variantClasses = {
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
    neutral: "bg-bg-primary text-text-secondary border border-border-color"
  };

  return (
    <span className={`inline-flex items-center justify-center font-semibold text-xs px-2.5 py-1 rounded-full whitespace-nowrap lowercase ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
