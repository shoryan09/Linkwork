import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function Navbar() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  
  // Check if user is a client - handle both possible user object structures
  const userRole = user?.role;
  const isClient = user && (userRole === "client" || userRole === "both");
  const isFreelancer = user && (userRole === "freelancer" || userRole === "both");
  
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className={`text-2xl font-bold transition-colors ${
                router.pathname === "/"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              }`}
            >
              LinkWork
            </Link>
            <div className="ml-10 flex space-x-4">
              <Link
                href="/projects"
                className={`px-3 py-2 rounded-md transition-colors ${
                  router.pathname.startsWith("/projects")
                    ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                Projects
              </Link>
              {isFreelancer && (
                <Link
                  href="/dashboard/freelancer"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    router.pathname.startsWith("/dashboard/freelancer")
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Freelancer Dashboard
                </Link>
              )}
              {isClient && (
                <Link
                  href="/dashboard/client"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    router.pathname.startsWith("/dashboard/client")
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Client Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell - Only show for logged in users */}
            {user && <NotificationDropdown />}

            {/* Profile Avatar - Only show for logged in users */}
            {user && (
              <Link
                href="/profile"
                className={`relative ${
                  router.pathname === "/profile"
                    ? "ring-2 ring-blue-500 dark:ring-blue-400 rounded-full"
                    : ""
                }`}
                title="Profile"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 transition-all">
                  {user.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profile.avatar}
                      alt={user.displayName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {(() => {
                        const name = user.displayName || user.email || "U";
                        const parts = name.trim().split(" ");
                        if (parts.length === 1) {
                          return parts[0].charAt(0).toUpperCase();
                        }
                        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                      })()}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                // Sun icon
                <svg
                  className="w-5 h-5 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Moon icon
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    router.pathname === "/login"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    router.pathname === "/signup"
                      ? "bg-blue-700 dark:bg-blue-600 text-white font-semibold"
                      : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
