import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/api";
import logo from "../../assets/hrms_logo.png";
import { toast } from "react-toastify";
import { useHRMSData } from "../../context/HRMSDataContext";
import { useAuth } from "../../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { hasPermission } from "../../utils/hasPermission";

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useHRMSData();
  const { setUser, setPermissions, setToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await login(formData);
      console.log(response);
      console.log(response.data);

      const { token, user, permissions, requiresPasswordSetup } =
        response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(permissions || []));

      if (setUser) setUser(user);
      if (setPermissions) setPermissions(permissions || []);
      if (setToken) setToken(token);

      console.log("USER =>", user);
      console.log("PERMISSIONS =>", permissions);

      setCurrentUser({ ...user, avatarColor: "#2563EB" });
      toast.success("Login Successfully!");

      if (requiresPasswordSetup) {
        navigate("/setup-password");
      } else if (user?.isStaff === true || user?.role === "EMPLOYEE") {
        navigate("/staff/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-4 sm:p-6 font-sans md:overflow-hidden">
      <div className="relative w-full max-w-5xl h-auto md:h-[520px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
        <div className="absolute top-0 left-0 w-[450px] h-[150px] bg-gradient-to-r from-blue-200/40 to-blue-100/20 rounded-br-[200px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-gradient-to-t from-blue-200/30 to-blue-100/10 rounded-tl-full pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 h-full relative z-10">
          {/* LEFT SIDE */}
          <div className="hidden md:flex flex-col justify-center px-12 lg:px-16 bg-slate-50/40 border-r border-slate-100">
            <div className=" flex items-center">
              <img
                src={logo}
                alt="HRMS Logo"
                className="h-24 w-auto object-contain"
              />
            </div>

            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3 lowercase">
              welcome back!
            </h1>
            <div className="w-14 h-1 bg-blue-600 rounded-full mb-5"></div>

            <p className="text-slate-500 text-sm lg:text-base leading-relaxed max-w-sm font-light lowercase">
              sign in to manage employees, attendance, payroll, departments,
              recruitment and company operations from one central dashboard.
            </p>

            <div className="flex gap-6 mt-8 border-t border-slate-200/40 pt-6">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-blue-600">
                  500+
                </h3>
                <p className="text-xs text-slate-400 font-medium lowercase">
                  employees
                </p>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-blue-600">
                  25+
                </h3>
                <p className="text-xs text-slate-400 font-medium lowercase">
                  departments
                </p>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-blue-600">
                  99%
                </h3>
                <p className="text-xs text-slate-400 font-medium lowercase">
                  efficiency
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (Login Form) */}
          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-[360px]">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 mb-1 lowercase">
                sign in
              </h2>
              <p className="text-center text-slate-400 text-xs mb-6 lowercase">
                access your hrms dashboard
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="email address"
                    onChange={handleChange}
                    className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-slate-700 placeholder-slate-400 text-sm"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="password"
                    onChange={handleChange}
                    className="w-full h-12 px-4 pr-11 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-slate-700 placeholder-slate-400 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition lowercase"
                  >
                    forgot password?
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-200/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-sm lowercase"
                  >
                    {loading ? "signing in..." : "sign in"}
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-slate-500 mt-5 lowercase">
                don't have an account?
                <Link
                  to="/register"
                  className="ml-1 text-blue-600 font-bold hover:text-blue-800 transition inline-block lowercase"
                >
                  register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
