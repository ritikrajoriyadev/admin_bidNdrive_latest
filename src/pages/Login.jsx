import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePermissions } from "../context/PermissionsContext";
import { i } from "framer-motion/client";

export default function AdminLogin() {
  const { refreshPermissions } = usePermissions();
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("adminToken");
    const savedEmail =
      localStorage.getItem("adminEmail");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    refreshPermissions();
    // if (token) {
    //   navigate("/dashboard");
    // }
  }, [navigate, refreshPermissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/login`,
        {
          email,
          password,
        }
      );

      const accessToken =
        res.data.data.accessToken;
      const refreshToken =
        res.data.data.refreshToken;
      const role = res.data.data.role;

      localStorage.setItem(
        "adminToken",
        accessToken
      );
      localStorage.setItem(
        "adminRefreshToken",
        refreshToken
      );
      localStorage.setItem("role", role);

      if (rememberMe) {
        localStorage.setItem(
          "adminEmail",
          email
        );
      } else {
        localStorage.removeItem(
          "adminEmail"
        );
      }

      refreshPermissions();
      setSuccess(true);

      if (role === "super-admin") {
        navigate("/dashboard");
      }
      if (role === "admin") {
        navigate("/dashboard");
      } if (role === "retail-associate") {
        navigate("/radashboard");
      }
      // setTimeout(() => {
      //   navigate("/dashboard");
      // }, 500);
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden px-4">

      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-400/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        {/* Main Card */}
        <div className="rounded-[32px] bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden">

          {/* Header */}
          <div className="p-8 border-b border-slate-200 bg-gradient-to-b from-indigo-50 to-white">
            <motion.div
              custom={0}
              variants={itemVariants}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                Admin Panel
              </h1>

              <p className="text-slate-500 mt-2 text-sm">
                Welcome back to
                BidNDrive Dashboard
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="p-8">

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-600 text-sm"
              >
                Login successful...
              </motion.div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <motion.div
                custom={1}
                variants={itemVariants}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    disabled={loading}
                    placeholder="admin@example.com"
                    className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-300 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                custom={2}
                variants={itemVariants}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-300 pl-12 pr-14 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-500 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me */}
              <motion.div
                custom={3}
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                    className="accent-indigo-600"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-violet-500 transition"
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Login Button */}
              <motion.button
                custom={4}
                variants={itemVariants}
                type="submit"
                disabled={
                  loading || success
                }
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-semibold hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(99,102,241,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>

            {/* Support */}
            <div className="mt-8 text-center text-sm text-slate-500">
              Need help?{" "}
              <a
                href="mailto:support@bidndrive.com"
                className="text-indigo-600 hover:text-violet-500 font-medium transition"
              >
                support@bidndrive.com
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">
            © 2026 BidNDrive • All rights
            reserved
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-5 text-center text-xs text-slate-500">
          🔒 Your connection is secure
          and encrypted
        </div>
      </motion.div>
    </div>
  );
}