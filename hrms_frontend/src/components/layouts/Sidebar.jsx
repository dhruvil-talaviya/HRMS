import { NavLink } from "react-router-dom";
// import {logo} from '../../assets/hrms_logo.png'
import logo from "../../assets/logowhite.png";

import { sidebarMenu } from "../../data/sidebarMenu";
import WithPermission from "../hoc/WithPermission";
import {
  MdDashboard,
  MdPeople,
  MdAccessTime,
  MdEventBusy,
  MdPayments,
  MdStarBorder,
  MdWorkOutline,
  MdBusiness,
  MdBadge,
  MdAssessment,
  MdCalendarToday,
  MdSettings,
  MdMenuOpen,
  MdMenu,
  MdTrackChanges,
} from "react-icons/md";

const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const menuItems = [
    { name: "dashboard", path: "/dashboard", icon: <MdDashboard /> },
    { name: "staff management", path: "/employees", icon: <MdPeople /> },
    { name: "attendance", path: "/attendance", icon: <MdAccessTime /> },
    { name: "leave management", path: "/leave", icon: <MdEventBusy /> },
    { name: "payroll", path: "/payroll", icon: <MdPayments /> },
    { name: "performance", path: "/performance", icon: <MdStarBorder /> },
    { name: "recruitment", path: "/recruitment", icon: <MdWorkOutline /> },
    { name: "departments", path: "/departments", icon: <MdBusiness /> },
    { name: "designations", path: "/designations", icon: <MdBadge /> },
    { name: "reports", path: "/reports", icon: <MdAssessment /> },
    { name: "calendar", path: "/calendar", icon: <MdCalendarToday /> },
    { name: "settings", path: "/settings", icon: <MdSettings /> },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-bg-sidebar text-gray-400 flex flex-col border-r border-border-color z-50 shadow-lg transition-all duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}
      >
       
        <div className=" h-[70px] flex items-center justify-center px-6 border-b border-white/1 shrink-0">
          <img
            src={logo}
            alt="HRMS Logo"
            className="h-22 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 flex flex-col gap-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg hover:bg-bg-sidebar-hover hover:text-white transition-all text-sm font-medium gap-3 whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.3)]"
                    : "text-gray-400"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <span
                className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none" : "opacity-100"}`}
              >
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 flex items-center justify-between shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:bg-bg-sidebar-hover hover:text-white text-xl p-2 rounded-full w-9 h-9 flex items-center justify-center transition-all hidden md:flex"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <MdMenu /> : <MdMenuOpen />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
