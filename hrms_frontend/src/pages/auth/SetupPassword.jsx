import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdLock, MdCheckCircle } from "react-icons/md";
import logo from "../../assets/hrms_logo.png";
import { toast } from "react-toastify";
import { setupStaffPassword } from "../../services/api";

const PasswordInput = ({ name, placeholder, value, onChange, required }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full h-12 px-4 pr-11 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-slate-700 placeholder-slate-400 text-sm"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
};

const SetupPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const employeeName = storedUser?.name || storedUser?.fullName || "";

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("password must be at least 6 characters long");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await setupStaffPassword(form.newPassword);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          status: "Active",
          isFirstLogin: false,
          requiresPasswordSetup: false,
        })
      );

      toast.success("password updated successfully! your account is now active.");
      if (user?.isStaff) {
        navigate("/staff/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "something went wrong. please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-4 sm:p-6 font-sans md:overflow-hidden">
      <div className="relative w-full max-w-5xl h-auto md:h-[600px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">

        <div className="absolute top-0 left-0 w-[450px] h-[150px] bg-gradient-to-r from-blue-200/40 to-blue-100/20 rounded-br-[200px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-gradient-to-t from-blue-200/30 to-blue-100/10 rounded-tl-full pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 h-full relative z-10">

          <div className="hidden md:flex flex-col justify-center px-12 lg:px-16 bg-slate-50/40 border-r border-slate-100">
            <div className="flex items-center mb-6">
              <img src={logo} alt="hrms logo" className="h-20 w-auto object-contain" />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3 lowercase">
              secure your account
            </h1>
            <div className="w-14 h-1 bg-blue-600 rounded-full mb-5" />
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-light mb-6 lowercase">
              this is your first login. set a strong personal password before
              accessing your employee portal to keep your account protected.
            </p>

            <div className="flex flex-col gap-3 border-t border-slate-200/40 pt-6">
              {[
                "use a mix of letters, numbers & symbols",
                "never share your password with anyone",
                "you can update it anytime from your profile",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2.5">
                  <MdCheckCircle className="text-blue-500 text-base mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500 lowercase">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-[360px]">

              <div className="flex justify-center mb-4 md:hidden">
                <img src={logo} alt="hrms logo" className="h-12 w-auto object-contain" />
              </div>

              <div className="flex items-center gap-2 justify-center mb-1">
                <MdLock className="text-blue-600 text-xl" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 lowercase">
                  set new password
                </h2>
              </div>
              <p className="text-center text-slate-500 text-xs mb-6 lowercase">
                {employeeName ? `welcome, ${employeeName}! ` : ""}first login detected — create a secure password to activate your account
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 lowercase">
                    new password
                  </label>
                  <PasswordInput
                    name="newPassword"
                    placeholder="create a strong password"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                  />

                  <p className="text-[11px] text-slate-400 mt-1.5 lowercase">minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 lowercase">
                    confirm password
                  </label>
                  <PasswordInput
                    name="confirmPassword"
                    placeholder="re-enter new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  {form.confirmPassword && (
                    <p className={`text-[11px] font-semibold mt-1.5 lowercase ${
                      form.newPassword === form.confirmPassword
                        ? "text-emerald-600"
                        : "text-rose-500"
                    }`}>
                      {form.newPassword === form.confirmPassword
                        ? "✓ passwords match"
                        : "✗ passwords do not match"}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-200/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-sm lowercase"
                  >
                    {loading ? "updating password..." : "set password & continue"}
                  </button>
                </div>

              </form>

              <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed lowercase">
                having trouble?{" "}
                <span className="text-blue-600 font-semibold cursor-pointer hover:text-blue-800 transition lowercase">
                  contact your hr
                </span>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
