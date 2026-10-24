import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdSearch,
  MdNotifications,
  MdArrowDropDown,
  MdLogout,
  MdPerson,
  MdLockOpen,
  MdMenu,
} from "react-icons/md";
import Avatar from "../common/Avatar";
import { useHRMSData } from "../../context/HRMSDataContext";
import { getMyProfile } from "../../services/api";

const StaffNavbar = ({ onMobileToggle }) => {
  const navigate = useNavigate();
  const { notifications, markAllNotificationsAsRead } = useHRMSData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored && (stored.name || stored.fullName || stored.email)) {
        return {
          name: stored.fullName || stored.name || "Employee",
          role: stored.role || stored.accessRole || "Staff",
          email: stored.email || "",
          avatarColor: "#0F172A",
        };
      }
    } catch {
      // ignore
    }
    return {
      name: "Employee",
      role: "Staff Member",
      email: "",
      avatarColor: "#0F172A",
    };
  });

  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    window.location.href = "/login";
  };

  const getProfile = async () => {
    try {
      const res = await getMyProfile();
      const data = res.data?.data;
      if (data) {
        setCurrentUser({
          name: data.fullName || data.name || "Employee",
          role: data.role || data.accessRole || "Staff",
          email: data.email || "",
          avatarColor: "#0F172A",
        });
      }
    } catch (error) {
      console.log("Could not refresh live profile in navbar:", error);
    }
  };

  useEffect(() => {
    getProfile();

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markAllNotificationsAsRead();
    }
  };

  return (
    <header className="h-[68px] sticky top-0 right-0 flex items-center justify-between px-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 z-[90] transition-all">
      <div className="flex items-center gap-4">
        <button
          className="text-2xl text-slate-700 dark:text-slate-200 block md:hidden cursor-pointer"
          onClick={onMobileToggle}
          aria-label="Toggle Menu"
        >
          <MdMenu />
        </button>
        <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 px-3.5 py-1.5 rounded-xl w-[300px] gap-2.5 transition-all">
          <MdSearch className="text-slate-400 text-lg shrink-0" />
          <input
            type="text"
            placeholder="search leaves, payslips..."
            className="border-none bg-transparent outline-none w-full text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs font-medium lowercase"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/70 dark:bg-slate-800/60 rounded-full border border-slate-200/60 dark:border-slate-700/50 lowercase">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            className="bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-lg cursor-pointer flex items-center justify-center p-2 rounded-xl relative transition-all hover:bg-slate-100 hover:text-blue-600"
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >
            <MdNotifications />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-[52px] right-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl w-[320px] max-h-[400px] overflow-y-auto z-[100]">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white lowercase">notifications</h3>
              </div>
              <div>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      !notif.read ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{notif.text}</span>
                    <span className="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-3 cursor-pointer relative px-2.5 py-1 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-200/60"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          ref={profileMenuRef}
        >
          <Avatar name={currentUser.name} color={currentUser.avatarColor} size={36} />
          <div className="flex-col hidden md:flex text-left">
            <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 lowercase tracking-wide">{currentUser.role}</span>
          </div>

          <MdArrowDropDown className="text-lg text-slate-400" />

          {showProfileMenu && (
            <div className="absolute top-[52px] right-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl w-[220px] overflow-hidden z-[100] py-1.5">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold block text-xs text-slate-800 dark:text-white">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">{currentUser.email}</span>
              </div>
              <div
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/staff/profile");
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 lowercase"
              >
                <MdPerson className="text-base" />
                <span>my profile</span>
              </div>
              <div
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/setup-password");
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 lowercase"
              >
                <MdLockOpen className="text-base" />
                <span>reset password</span>
              </div>
              <div
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 transition-all cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-slate-100 dark:border-slate-800 mt-1 lowercase"
              >
                <MdLogout className="text-base" />
                <span>sign out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default StaffNavbar;
