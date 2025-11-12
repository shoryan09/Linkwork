import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect based on user role after login
  useEffect(() => {
    if (user) {
      if (user.role === "client") {
        router.push("/dashboard/client");
      } else if (user.role === "freelancer") {
        router.push("/dashboard/freelancer");
      } else if (user.role === "both") {
        router.push("/dashboard/client"); // Default to client dashboard for "both"
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Login successful - useEffect will handle redirect
    } catch (err: any) {
      console.error("Login error:", err);
      // Handle Firebase auth errors
      let errorMessage = "Failed to login. Please try again.";
      
      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "Invalid credentials. Please check your email and password.";
      } else if (err.response?.status === 404) {
        errorMessage = "Account not found in our system. Please sign up first.";
      } else if (err.message && !err.code) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Login
          </h2>
          {/* Rest of the code with dark: classes added to labels and inputs */}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
