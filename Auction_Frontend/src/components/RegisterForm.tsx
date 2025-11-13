'use client';

import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "@/lib/redux/slices/authSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "USER",
    otp: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccessMessage("");
    console.log("Submitting form with data:", formData);

    try {
      if (!showOTP) {
        // Initial registration without OTP
        const response = await dispatch(register({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        })).then((res) => res.payload);

        console.log("Registration response:", response);

        // Handle plain text or JSON response
        const message = typeof response === "string" ? response : response?.message || "Registration successful";
        setSuccessMessage(message);
        setShowOTP(true);
      } else {
        // Verify OTP
        const verifyResponse = await fetch("http://localhost:8080/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: formData.otp,
          }),
        });

        const verifyData = await verifyResponse.text();
        console.log("Verify OTP response:", verifyResponse.status, verifyData);

        if (!verifyResponse.ok) {
          throw new Error(verifyData || "Invalid OTP or verification failed");
        }

        console.log("OTP verified successfully");
        setSuccessMessage("Email verified successfully! Redirecting to login...");

        // Redirect after a brief delay to show success message
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Error details:", err);
      setError((err as Error).message || "Registration failed");
      if (showOTP) {
        setShowOTP(true); // Keep OTP field if verification fails
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError("");
      setLoading(true);
      setSuccessMessage("");

      console.log("Resending OTP with data:", formData);

      const response = await dispatch(register({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })).then((res) => res.payload);

      const message = typeof response === "string" ? response : response?.message || "OTP resent successfully";
      setSuccessMessage(message);

    } catch (err) {
      console.error("Error resending OTP:", err);
      setError((err as Error).message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="px-6 py-6 border-b border-gray-200 justify-center text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-red-400 bg-clip-text text-transparent">Register</h2>
        <p className="mt-2 text-sm bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
          Create your account to get started
        </p>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={showOTP}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${showOTP ? 'bg-gray-100' : ''} text-gray-700`}
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={showOTP}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${showOTP ? 'bg-gray-100' : ''} text-gray-700`}
              placeholder="Enter your password"
            />
          </div>

          {!showOTP && (
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] bg-no-repeat bg-[position:right_12px_center] bg-[length:12px_8px] text-gray-700"
              >
                <option value="ADMIN">Admin</option>
                <option value="TEAM_OWNER">Team Owner</option>
                <option value="USER">User</option>
              </select>
            </div>
          )}

          {showOTP && (
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                value={formData.otp}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700"
                placeholder="Enter the OTP sent to your email"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 flex items-center gap-2">
                Please check your email for the verification code
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : showOTP ? "Verify OTP" : "Register"}
          </button>
        </form>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <p className="text-sm text-center text-gray-600">
          Already have an account?
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-500 hover:underline ml-1 font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}