import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const Navigate = useNavigate();

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
        { email, password }
      );

      const accessToken = res.data.data.accessToken;
      const refreshToken = res.data.data.refreshToken;
      const role = res.data.data.role;

      localStorage.setItem("adminToken", accessToken);
      localStorage.setItem("adminRefreshToken", refreshToken);
      localStorage.setItem("role", role); // Store role for potential future use

      if (rememberMe) {
        localStorage.setItem("adminEmail", email);
      }

      setSuccess(true);
      setTimeout(() => Navigate("/dashboard"), 500);

    } catch (error) {
      console.error(error);
      setError(error?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 }
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Card Container */}
        <div className="rounded-3xl bg-gray-900/40 backdrop-blur-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="relative p-8 bg-gradient-to-b from-indigo-500/10 to-transparent border-b border-white/[0.08]">
            <motion.div custom={0} variants={itemVariants} className="flex flex-col items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                <p className="text-white/40 text-sm mt-1">BidNDrive Management</p>
              </div>
            </motion.div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Logging in...
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <motion.div custom={1} variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-white/60 text-sm font-medium">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:bg-gray-800/80 focus:outline-none transition-all duration-200 disabled:opacity-50"
                    placeholder="admin@example.com"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div custom={2} variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-white/60 text-sm font-medium">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-800/50 border border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-400/50 focus:bg-gray-800/80 focus:outline-none transition-all duration-200 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div custom={3} variants={itemVariants} className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded bg-gray-800 border border-white/[0.08] checked:bg-indigo-500 checked:border-indigo-400 focus:outline-none cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-white/40 text-sm group-hover:text-white/60 transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  disabled={loading}
                  className="text-white/40 hover:text-indigo-400 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Login Button */}
              <motion.button
                custom={4}
                variants={itemVariants}
                type="submit"
                disabled={loading || success}
                className="w-full py-3 mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
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

            {/* Divider */}
            <motion.div custom={5} variants={itemVariants} className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900/40 text-white/40">Need help?</span>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div custom={6} variants={itemVariants} className="text-center">
              <p className="text-white/40 text-sm">
                Contact support at{" "}
                <a href="mailto:support@bidndrive.com" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  support@bidndrive.com
                </a>
              </p>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-white/[0.08] bg-black/20">
            <p className="text-center text-xs text-white/30">
              © 2026 BidNDrive • All rights reserved
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <motion.div custom={7} variants={itemVariants} className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your connection is secure and encrypted
        </motion.div>
      </motion.div>
    </div>
  );
}
