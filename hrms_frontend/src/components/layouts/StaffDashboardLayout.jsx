import { useState } from "react";
import { Outlet } from "react-router-dom";
import StaffSidebar from "./StaffSidebar";
import StaffNavbar from "./StaffNavbar";

const StaffDashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950 transition-all duration-300">
      <StaffSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${
          isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <StaffNavbar onMobileToggle={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 p-5 sm:p-7 md:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;
