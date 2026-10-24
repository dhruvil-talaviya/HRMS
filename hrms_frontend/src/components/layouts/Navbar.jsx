import { useState, useRef, useEffect } from "react";
import { useHRMSData } from "../../context/HRMSDataContext";
import { useNavigate } from "react-router-dom";
import {
  MdSearch,
  MdNotifications,
  MdArrowDropDown,
  MdLogout,
  MdPerson,
  MdLockOpen,
  MdMenu
} from "react-icons/md";
import Avatar from "../common/Avatar";

const Navbar = ({ onMobileToggle }) => {
  const {
    currentUser,
    notifications,
    markAllNotificationsAsRead,
  } = useHRMSData();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
   window.location.href = "/login";
  };

  // Close menus when clicking outside
  useEffect(() => {
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

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markAllNotificationsAsRead();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-[70px] sticky top-0 right-0 flex items-center justify-between px-6 bg-bg-secondary/80 backdrop-blur-md border-b border-border-color z-[90] transition-all">
      <div className="flex items-center gap-4">
        <button className="text-2xl text-text-primary block md:hidden cursor-pointer" onClick={onMobileToggle} aria-label="Toggle Menu">
          <MdMenu />
        </button>
        <div className="hidden md:flex items-center bg-bg-primary border border-border-color focus-within:border-primary px-4 py-2 rounded-xl w-[280px] gap-2.5 transition-all">
          <MdSearch className="text-text-muted text-lg" />
          <input
            type="text"
            placeholder="Search employees, policies..."
            className="border-none bg-transparent outline-none w-full text-text-primary text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-sm text-text-secondary font-medium hidden md:block">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            className="bg-transparent border-none text-text-secondary text-xl cursor-pointer flex items-center justify-center p-2 rounded-full relative transition-all hover:bg-bg-primary hover:text-primary"
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >
            <MdNotifications />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-bg-secondary" />}
          </button>

          {showNotifications && (
            <div className="absolute top-[55px] right-0 bg-bg-secondary border border-border-color rounded-lg shadow-lg w-[320px] max-h-[400px] overflow-y-auto z-[100]">
              <div className="p-4 border-b border-border-color">
                <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              </div>
              <div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-muted">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-border-color flex flex-col gap-1 transition-all hover:bg-bg-primary ${!notif.read ? "bg-primary-light" : ""
                        }`}
                    >
                      <span className="text-[13px] text-text-primary">{notif.text}</span>
                      <span className="text-[11px] text-text-muted">{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-3 cursor-pointer relative"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          ref={profileMenuRef}
        >
          <Avatar name={currentUser.name} color={currentUser.avatarColor} size={38} />
          <div className="flex-col hidden md:flex">
            <span className="text-sm font-semibold text-text-primary leading-[1.2]">{currentUser.name || "Admin"}</span>
            <span className="text-[11px] font-medium text-slate-500 capitalize tracking-wide">
              {currentUser.role ? currentUser.role.replace("_", " ").toLowerCase() : "Tenant Admin"}
            </span>
          </div>
          <MdArrowDropDown className="text-xl text-gray-500" />

          {showProfileMenu && (
            <div className="absolute top-[55px] right-0 bg-bg-secondary border border-border-color rounded-lg shadow-lg w-[220px] overflow-hidden z-[100]">
              <div className="p-4 border-b border-border-color">
                <span className="font-semibold block text-sm text-text-primary">{currentUser.name}</span>
                <span className="text-xs text-text-muted">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary transition-all cursor-pointer hover:bg-bg-primary hover:text-primary">
                <MdPerson />
                <span>My Profile</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary transition-all cursor-pointer hover:bg-bg-primary hover:text-primary">
                <MdLockOpen />
                <span>Reset Password</span>
              </div>
              <div
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary transition-all cursor-pointer hover:bg-bg-primary hover:text-primary border-t border-border-color"
              >
                <MdLogout className="text-danger" />
                <span className="text-danger">
                  Sign Out
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
