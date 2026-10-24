import { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/logowhite.png";
import {
  MdDashboard,
  MdAccessTime,
  MdEventBusy,
  MdPayments,
  MdStarBorder,
  MdPerson,
  MdCalendarToday,
  MdMenuOpen,
  MdMenu,
} from "react-icons/md";

const StaffSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const menuItems = [
    { name: "dashboard", path: "/staff/dashboard", icon: <MdDashboard /> },
    { name: "my attendance", path: "/staff/attendance", icon: <MdAccessTime /> },
    { name: "my leave", path: "/staff/leave", icon: <MdEventBusy /> },
    { name: "my payroll", path: "/staff/payroll", icon: <MdPayments /> },
    { name: "my performance", path: "/staff/performance", icon: <MdStarBorder /> },
    { name: "my profile", path: "/staff/profile", icon: <MdPerson /> },
    { name: "calendar", path: "/staff/calendar", icon: <MdCalendarToday /> },
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
        {/* Logo */}
        <div className="h-[70px] flex items-center justify-center px-6 border-b border-white/10 shrink-0">
          <img
            src={logo}
            alt="HRMS Logo"
            className="h-22 w-auto object-contain"
          />
        </div>

        {/* Employee Portal badge */}
        {!isCollapsed && (
          <div className="mx-3 mt-4 mb-1 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <span className="text-xs font-semibold text-primary lowercase">
              employee portal
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
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
                className={`transition-opacity duration-300 ${
                  isCollapsed
                    ? "opacity-0 w-0 overflow-hidden pointer-events-none"
                    : "opacity-100"
                }`}
              >
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
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

export default StaffSidebar;
