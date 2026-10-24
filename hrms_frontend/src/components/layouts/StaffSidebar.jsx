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
        <div
          className={`h-[74px] flex items-center justify-center border-b border-white/10 shrink-0 transition-all duration-300 ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          <img
            src={logo}
            alt="HRMS Logo"
            className={`w-full object-contain transition-all duration-300 ${
              isCollapsed
                ? "max-w-[46px] max-h-[36px]"
                : "max-w-[218px] max-h-[54px]"
            }`}
          />
        </div>

        {/* Employee Portal badge */}
        {!isCollapsed && (
          <div className="mx-3.5 mt-3 mb-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-[11px] font-semibold text-blue-400 lowercase">
              employee portal
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold gap-3 whitespace-nowrap lowercase ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
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
        <div className="p-4 border-t border-white/10 flex items-center justify-between shrink-0">
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
