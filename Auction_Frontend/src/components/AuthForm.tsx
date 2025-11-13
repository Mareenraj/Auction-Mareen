'use client';

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, register } from "@/lib/redux/slices/authSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  type: "login" | "register";
};

export default function AuthForm({ type }: AuthFormProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: type === "register" ? "USER" : undefined,
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
      if (type === "register" && !showOTP) {
        // Initial registration without OTP
        const response = await dispatch(register({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        })).then((res) => res.payload); // Access raw response
        console.log("Registration response:", response);

        // Handle plain text or JSON response
        const message = typeof response === "string" ? response : response?.message || "Registration successful";
        setSuccessMessage(message);
        setShowOTP(true); // Enable OTP field after success
      } else if (type === "register" && showOTP) {
        // Verify OTP
        const verifyResponse = await fetch("http://localhost:8080/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: formData.otp,
          }),
        });
        const verifyData = await verifyResponse.text(); // Use text() for flexibility
        console.log("Verify OTP response:", verifyResponse.status, verifyData);

        if (!verifyResponse.ok) {
          throw new Error(verifyData || "Invalid OTP or verification failed");
        }
        console.log("OTP verified successfully");
        router.push("/login"); // Navigate to login page
      } else {
        // Login
        const result = await dispatch(login({
          email: formData.email,
          password: formData.password,
        })).unwrap();
        console.log("Login response:", result);
        if (result.token) {
          document.cookie = `token=${result.token}; HttpOnly; Path=/; Secure; SameSite=Strict`;
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Error details:", err);
      setError((err as Error).message || "Authentication failed");
      if (type === "register" && showOTP) {
        setShowOTP(true); // Keep OTP field if verification fails
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="px-6 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {type === "login" ? "Login" : "Register"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your credentials to {type === "login" ? "access" : "create"} your account
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {type === "register" && !showOTP && (
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] bg-no-repeat bg-[position:right_12px_center] bg-[length:12px_8px]"
              >
                <option value="">Select role</option>
                <option value="ADMIN">Admin</option>
                <option value="TEAM_OWNER">Team Owner</option>
                <option value="USER">User</option>
              </select>
            </div>
          )}

          {type === "register" && showOTP && (
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter OTP"
                disabled={loading}
              />
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
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : type === "login" ? "Login" : showOTP ? "Verify OTP" : "Register"}
          </button>
        </form>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <p className="text-sm text-center text-gray-600">
          {type === "login" ? "Don't have an account?" : "Already have an account?"}
          <Link 
            href={type === "login" ? "/register" : "/login"} 
            className="text-blue-600 hover:text-blue-500 hover:underline ml-1 font-medium"
          >
            {type === "login" ? "Register" : "Login"}
          </Link>
        </p>
      </div>
    </div>
  );
}