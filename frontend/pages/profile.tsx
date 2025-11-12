import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface Review {
  _id: string;
  reviewerId: {
    _id: string;
    displayName: string;
    profile?: { avatar?: string };
  };
  rating: number;
  comment?: string;
  detailedRatings?: {
    pay: number;
    workingExperience: number;
    professionalism: number;
    likelyToWork: number;
    recommendToFriends: number;
  };
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "reviews">("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: "",
    profile: {
      avatar: "",
      age: "",
      workExperience: "",
      about: "",
      bio: "",
      location: "",
      phoneNumber: "",
      portfolio: "",
      skills: [] as string[],
    },
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Password visibility state
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Copy portfolio link state
  const [portfolioCopied, setPortfolioCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }

    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        profile: {
          avatar: user.profile?.avatar || "",
          age: user.profile?.age?.toString() || "",
          workExperience: user.profile?.workExperience || "",
          about: user.profile?.about || "",
          bio: user.profile?.bio || "",
          location: user.profile?.location || "",
          phoneNumber: user.profile?.phoneNumber || "",
          portfolio: user.profile?.portfolio || "",
          skills: user.profile?.skills || [],
        },
      });
      setImagePreview(user.profile?.avatar || "");
    }
  }, [user, authLoading, router]);

  // Fetch reviews for client
  useEffect(() => {
    const fetchReviews = async () => {
      if (user && (user.role === "client" || user.role === "both")) {
        setLoadingReviews(true);
        try {
          const response = await api.get(`/reviews/user/${user.id}`);
          setReviews(response.data.reviews || []);
        } catch (error) {
          console.error("Error fetching reviews:", error);
        } finally {
          setLoadingReviews(false);
        }
      }
    };

    fetchReviews();
  }, [user]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size should be less than 2MB" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select a valid image file" });
      return;
    }

    setUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setProfileData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            avatar: base64String,
          },
        }));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to process image" });
      setUploadingImage(false);
    }
  };

  const handleCopyPortfolio = () => {
    if (profileData.profile.portfolio) {
      navigator.clipboard.writeText(profileData.profile.portfolio);
      setPortfolioCopied(true);
      setTimeout(() => setPortfolioCopied(false), 2000);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData = {
        displayName: profileData.displayName,
        profile: {
          ...profileData.profile,
          age: profileData.profile.age ? parseInt(profileData.profile.age) : undefined,
        },
      };

      await api.put("/auth/profile", updateData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Reload to update context
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }

    try {
      await api.put("/auth/change-password", { newPassword: passwordData.newPassword });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to generate user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const isFreelancer = user?.role === "freelancer" || user?.role === "both";
  const isClient = user?.role === "client" || user?.role === "both";

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3 px-1 font-semibold transition-colors ${
                activeTab === "profile"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`pb-3 px-1 font-semibold transition-colors ${
                activeTab === "password"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Change Password
            </button>
            {isClient && (
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 px-1 font-semibold transition-colors ${
                  activeTab === "reviews"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                My Reviews ({reviews.length})
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-200 border border-green-400 dark:border-green-800"
                  : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-400 dark:border-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {imagePreview || profileData.profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview || profileData.profile.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-4xl font-bold">
                        {getInitials(profileData.displayName || user?.displayName || "")}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {uploadingImage ? "Uploading..." : "Click to upload profile picture (max 2MB)"}
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {isClient ? "Age/Founded In" : "Age"}
                  </label>
                  <input
                    type="number"
                    value={profileData.profile.age}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        profile: { ...profileData.profile, age: e.target.value },
                      })
                    }
                    min={isClient ? "1800" : "18"}
                    max={isClient ? new Date().getFullYear().toString() : "100"}
                    placeholder={isClient ? "e.g., 2010 (company founded)" : "e.g., 25"}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Freelancer-specific fields */}
              {isFreelancer && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Work Experience
                    </label>
                    <input
                      type="text"
                      value={profileData.profile.workExperience}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          profile: { ...profileData.profile, workExperience: e.target.value },
                        })
                      }
                      placeholder="e.g., 5 years, Fresher"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Portfolio URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={profileData.profile.portfolio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            profile: { ...profileData.profile, portfolio: e.target.value },
                          })
                        }
                        placeholder="https://yourportfolio.com"
                        className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {profileData.profile.portfolio && (
                        <button
                          type="button"
                          onClick={handleCopyPortfolio}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                          title={portfolioCopied ? "Copied!" : "Copy link"}
                        >
                          {portfolioCopied ? (
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Client rating display (read-only) */}
              {isClient && user.rating && user.rating.count > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Your Rating: {user.rating.average.toFixed(1)} / 5 ({user.rating.count} reviews)
                    </span>
                  </div>
                </div>
              )}

              {/* Common fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.profile.location}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, location: e.target.value },
                    })
                  }
                  placeholder="e.g., Mumbai, Maharashtra"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.profile.phoneNumber}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, phoneNumber: e.target.value },
                    })
                  }
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  About Yourself
                </label>
                <textarea
                  value={profileData.profile.about}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, about: e.target.value },
                    })
                  }
                  rows={5}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Re-enter your new password"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && isClient && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                My Reviews from Freelancers
              </h2>

              {loadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600 dark:text-gray-400">Loading reviews...</div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No reviews yet</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    Reviews from freelancers will appear here once you complete projects
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Reviewer Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            {review.reviewerId.profile?.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={review.reviewerId.profile.avatar}
                                alt={review.reviewerId.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-lg font-bold">
                                {getInitials(review.reviewerId.displayName)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {review.reviewerId.displayName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        {/* Overall Rating */}
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= review.rating
                                    ? "text-yellow-500"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Ratings */}
                      {review.detailedRatings && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pay</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.detailedRatings!.pay
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-sm font-semibold text-gray-900 dark:text-white ml-1">
                                {review.detailedRatings.pay}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Working Experience</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.detailedRatings!.workingExperience
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-sm font-semibold text-gray-900 dark:text-white ml-1">
                                {review.detailedRatings.workingExperience}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Professionalism</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.detailedRatings!.professionalism
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-sm font-semibold text-gray-900 dark:text-white ml-1">
                                {review.detailedRatings.professionalism}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Likely to Work Again</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.detailedRatings!.likelyToWork
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-sm font-semibold text-gray-900 dark:text-white ml-1">
                                {review.detailedRatings.likelyToWork}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recommend to Friends</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.detailedRatings!.recommendToFriends
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-sm font-semibold text-gray-900 dark:text-white ml-1">
                                {review.detailedRatings.recommendToFriends}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                          <p className="text-gray-700 dark:text-gray-300 italic">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

