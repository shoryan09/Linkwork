import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import api from "@/lib/api";
import ProjectDetailModal from "@/components/projects/ProjectDetailModal";

// Indian States and Cities data
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

const CITIES_BY_STATE: { [key: string]: string[] } = {
  "Andhra Pradesh": ["Hyderabad", "Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer"],
  "Sikkim": ["Gangtok", "Namchi", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Delhi": ["New Delhi", "Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  "Ladakh": ["Leh", "Kargil"],
  "Puducherry": ["Puducherry", "Karaikal"],
};

const CATEGORIES = [
  "Web Development",
  "Mobile App Development",
  "Design",
  "Writing",
  "Marketing",
  "Data Entry",
  "Video Editing",
  "Photography",
  "Other",
];

const COMPLEXITY_LEVELS = [
  { value: "short", label: "Simple (1-2 weeks)" },
  { value: "medium", label: "Moderate (2-4 weeks)" },
  { value: "long", label: "Complex (1+ months)" },
];

export default function ClientDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { unreadByProject } = useUnreadCount();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    complexity: "",
    minBudget: "",
    maxBudget: "",
    skills: "",
    state: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectProposals, setProjectProposals] = useState<
    Record<string, { loading: boolean; proposals: any[]; error?: string }>
  >({});
  const [proposalActionLoading, setProposalActionLoading] = useState<Record<string, boolean>>({});
  const [proposalActionFeedback, setProposalActionFeedback] = useState<
    Record<string, { type: "success" | "error"; message: string } | undefined>
  >({});
  const [viewProjectModalId, setViewProjectModalId] = useState<string | null>(null);
  const [viewProfileFreelancer, setViewProfileFreelancer] = useState<any | null>(null);

  // Format unread count like WhatsApp (1, 2, 3, 4+)
  const formatUnreadCount = (count: number) => {
    if (!count || count === 0) return null;
    if (count > 4) return "4+";
    return count.toString();
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role !== "client" && user.role !== "both") {
        router.push("/dashboard/freelancer");
        return;
      }
      fetchMyProjects();
    }
  }, [user, authLoading, router]);

  const fetchMyProjects = async () => {
    try {
      const response = await api.get("/projects/my/projects");
      setProjects(response.data.projects || []);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalsForProject = async (projectId: string) => {
    setProjectProposals((prev) => ({
      ...prev,
      [projectId]: {
        proposals: prev[projectId]?.proposals || [],
        loading: true,
        error: "",
      },
    }));

    try {
      const response = await api.get(`/proposals/project/${projectId}`);
      setProjectProposals((prev) => ({
        ...prev,
        [projectId]: {
          proposals: response.data.proposals || [],
          loading: false,
          error: "",
        },
      }));
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Failed to load proposals. Please try again.";
      setProjectProposals((prev) => ({
        ...prev,
        [projectId]: {
          proposals: [],
          loading: false,
          error: message,
        },
      }));
    }
  };

  const toggleProposals = async (projectId: string) => {
    setProposalActionFeedback((prev) => ({
      ...prev,
      [projectId]: undefined,
    }));

    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      return;
    }

    setExpandedProjectId(projectId);

    if (!projectProposals[projectId]) {
      await fetchProposalsForProject(projectId);
    }
  };

  const handleProposalStatusChange = async (
    proposalId: string,
    status: "accepted" | "rejected",
    projectId: string
  ) => {
    setProposalActionLoading((prev) => ({ ...prev, [proposalId]: true }));
    setProposalActionFeedback((prev) => ({
      ...prev,
      [projectId]: undefined,
    }));

    try {
      await api.put(`/proposals/${proposalId}/status`, { status });
      setProposalActionFeedback((prev) => ({
        ...prev,
        [projectId]: {
          type: "success",
          message:
            status === "accepted"
              ? "Proposal accepted successfully."
              : "Proposal rejected successfully.",
        },
      }));
      await Promise.all([fetchProposalsForProject(projectId), fetchMyProjects()]);
      if (status === "accepted") {
        router.push(`/chat/${projectId}`);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Failed to update proposal status. Please try again.";
      setProposalActionFeedback((prev) => ({
        ...prev,
        [projectId]: { type: "error", message },
      }));
    } finally {
      setProposalActionLoading((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleFinishProject = async (projectId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this project as finished? This action will close the project."
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.put(`/projects/${projectId}`, { status: "finished" });
      setProposalActionFeedback((prev) => ({
        ...prev,
        [projectId]: {
          type: "success",
          message: "Project marked as finished successfully.",
        },
      }));
      await fetchMyProjects();
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Failed to finish project. Please try again.";
      setProposalActionFeedback((prev) => ({
        ...prev,
        [projectId]: { type: "error", message },
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleAutofill = () => {
    // Count filled fields (excluding description)
    const filledFields = [
      formData.title,
      formData.category,
      formData.complexity,
      formData.minBudget,
      formData.maxBudget,
      formData.skills,
      formData.state,
      formData.city,
    ].filter((field) => field && field.toString().trim().length > 0);

    if (filledFields.length < 4) {
      setError("Fill atleast 4 fields");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Generate description from filled fields
    const parts: string[] = [];

    if (formData.title) {
      parts.push(`We are looking for a skilled professional to help with: ${formData.title}.`);
    }

    if (formData.category) {
      parts.push(`This project falls under the ${formData.category} category.`);
    }

    if (formData.skills) {
      const skillsList = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (skillsList.length > 0) {
        parts.push(
          `Required skills include: ${skillsList.join(", ")}. The ideal candidate should have expertise in these areas.`
        );
      }
    }

    if (formData.complexity) {
      const complexityLabels: Record<string, string> = {
        short: "Simple (1-2 weeks)",
        medium: "Moderate (2-4 weeks)",
        long: "Complex (1+ months)",
      };
      const complexityText = complexityLabels[formData.complexity] || formData.complexity;
      parts.push(`Project complexity: ${complexityText}.`);
    }

    if (formData.minBudget && formData.maxBudget) {
      parts.push(
        `Budget range: ₹${parseInt(formData.minBudget).toLocaleString()} - ₹${parseInt(formData.maxBudget).toLocaleString()}.`
      );
    } else if (formData.minBudget) {
      parts.push(`Minimum budget: ₹${parseInt(formData.minBudget).toLocaleString()}.`);
    } else if (formData.maxBudget) {
      parts.push(`Maximum budget: ₹${parseInt(formData.maxBudget).toLocaleString()}.`);
    }

    if (formData.state && formData.city) {
      parts.push(`Location: ${formData.city}, ${formData.state}.`);
    } else if (formData.state) {
      parts.push(`Location: ${formData.state}.`);
    }

    parts.push(
      "We are looking for a reliable and experienced professional who can deliver high-quality work within the specified timeline."
    );

    const generatedDescription = parts.join(" ");

    setFormData((prev) => ({
      ...prev,
      description: generatedDescription,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // Validate budget
      const minBudget = parseInt(formData.minBudget);
      const maxBudget = parseInt(formData.maxBudget);
      
      if (minBudget >= maxBudget) {
        setError("Maximum budget must be greater than minimum budget");
        setSubmitting(false);
        return;
      }

      // Parse skills
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Build location string
      const location = formData.city
        ? `${formData.state}, ${formData.city}`
        : formData.state;

      // Map complexity to duration
      const durationMap: { [key: string]: string } = {
        short: "short",
        medium: "medium",
        long: "long",
      };

      const projectData = {
        title: formData.title,
        description: formData.description,
        budget: {
          min: minBudget,
          max: maxBudget,
          type: "fixed",
        },
        skills: skillsArray,
        duration: durationMap[formData.complexity] || "medium",
        location: location,
      };

      await api.post("/projects", projectData);
      setSuccess("Project posted successfully!");
      setFormData({
        title: "",
        description: "",
        category: "",
        complexity: "",
        minBudget: "",
        maxBudget: "",
        skills: "",
        state: "",
        city: "",
      });
      fetchMyProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to post project");
    } finally {
      setSubmitting(false);
    }
  };

  const availableCities = formData.state
    ? CITIES_BY_STATE[formData.state] || []
    : [];

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create a Project Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Create a Project
          </h2>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="e.g., Logo for my coffee shop"
              />
        </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 dark:text-gray-300 font-semibold">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg transition-colors"
                >
                  Autofill
                </button>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Describe what you need..."
              />
          </div>

            {/* Category and Complexity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
          </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Complexity
                </label>
                <select
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select complexity</option>
                  {COMPLEXITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
          </div>
        </div>

            {/* Budget and Skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Minimum Budget (₹)
                </label>
                <input
                  type="number"
                  name="minBudget"
                  value={formData.minBudget}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Maximum Budget (₹)
                </label>
                <input
                  type="number"
                  name="maxBudget"
                  value={formData.maxBudget}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., 10000"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., Design, Branding"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Location
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.state}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                  <option value="">Select city</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
            <button
                type="submit"
                disabled={submitting}
                className="bg-gray-900 dark:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {submitting ? "Posting..." : "Post Project"}
            </button>
          </div>
          </form>
        </div>

        {/* My Projects Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            My Projects
          </h2>

          {projects.length > 0 ? (
            <div className="space-y-6">
              {projects.map((project: any) => (
                <div
                  key={project._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            project.status === "open"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : project.status === "in-progress"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : project.status === "completed" || project.status === "finished"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          <strong>Location:</strong> {project.location || "—"}
                        </span>
                        {project.budget && (
                          <span>
                            <strong>Budget:</strong> ₹
                            {project.budget.min?.toLocaleString()} - ₹
                            {project.budget.max?.toLocaleString()}
                          </span>
                        )}
                        <span>
                          <strong>Complexity:</strong>{" "}
                          {project.duration === "short"
                            ? "Simple (1-2 weeks)"
                            : project.duration === "medium"
                            ? "Moderate (2-4 weeks)"
                            : project.duration === "long"
                            ? "Complex (1+ months)"
                            : "—"}
                        </span>
                        {project.skills?.length > 0 && (
                          <span>
                            <strong>Skills:</strong> {project.skills.join(", ")}
                          </span>
                        )}
                      </div>
                      {project.status === "finished" && project.finishedAt && (
                        <div className="mt-3 text-sm text-purple-600 dark:text-purple-400 font-medium">
                          ✓ Finished on {new Date(project.finishedAt).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                      <button
                        onClick={() => toggleProposals(project._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {expandedProjectId === project._id
                          ? "Hide Proposals"
                          : `View Proposals (${project.proposalsCount || 0})`}
                      </button>
                      {project.status === "in-progress" && (
                        <button
                          onClick={() => router.push(`/chat/${project._id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors relative"
                        >
                          Open Chat
                          {formatUnreadCount(unreadByProject[project._id]) && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {formatUnreadCount(unreadByProject[project._id])}
                            </span>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setViewProjectModalId(project._id)}
                        className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        View Project
                      </button>
                      {project.status === "in-progress" && (
                        <button
                          onClick={() => handleFinishProject(project._id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Finish Project
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedProjectId === project._id && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                      {proposalActionFeedback[project._id] && (
                        <div
                          className={`px-4 py-3 rounded mb-4 ${
                            proposalActionFeedback[project._id]?.type === "success"
                              ? "bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200"
                              : "bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200"
                          }`}
                        >
                          {proposalActionFeedback[project._id]?.message}
                        </div>
                      )}

                      {projectProposals[project._id]?.loading ? (
                        <p className="text-gray-600 dark:text-gray-400">
                          Loading proposals...
                        </p>
                      ) : projectProposals[project._id]?.error ? (
                        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                          {projectProposals[project._id]?.error}
                        </div>
                      ) : projectProposals[project._id]?.proposals?.length ? (
                        <div className="space-y-4">
                          {projectProposals[project._id].proposals.map((proposal: any) => {
                            const freelancer = proposal.freelancerId;
                            const isPending = proposal.status === "pending";
                            return (
                              <div
                                key={proposal._id}
                                className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-5"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {freelancer?.displayName || "Freelancer"}
                                    </h4>
                                    {freelancer?.profile?.skills?.length > 0 && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Skills: {freelancer.profile.skills.join(", ")}
                                      </p>
                                    )}
                                    {freelancer?.profile?.location && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Location: {freelancer.profile.location}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                      proposal.status === "accepted"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                        : proposal.status === "rejected"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    }`}
                                  >
                                    {proposal.status.charAt(0).toUpperCase() +
                                      proposal.status.slice(1)}
                                  </span>
                                </div>

                                <div className="mt-4">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Why they are a great fit
                                  </p>
                                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                    {proposal.coverLetter}
                                  </p>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                                  <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                                      Proposed Budget
                                    </p>
                                    <p>
                                      ₹{proposal.proposedBudget?.toLocaleString() || "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                                      Delivery Time
                                    </p>
                                    <p>
                                      {proposal.deliveryTime
                                        ? `${proposal.deliveryTime} days`
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                                      Submitted
                                    </p>
                                    <p>
                                      {proposal.createdAt
                                        ? new Date(proposal.createdAt).toLocaleString()
                                        : "—"}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    onClick={() =>
                                      handleProposalStatusChange(
                                        proposal._id,
                                        "accepted",
                                        project._id
                                      )
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                                    disabled={
                                      !isPending || proposalActionLoading[proposal._id] === true
                                    }
                                  >
                                    {proposalActionLoading[proposal._id]
                                      ? "Processing..."
                                      : "Accept"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleProposalStatusChange(
                                        proposal._id,
                                        "rejected",
                                        project._id
                                      )
                                    }
                                    className="border border-red-500 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:border-gray-400 disabled:text-gray-400 dark:disabled:text-gray-500"
                                    disabled={
                                      !isPending || proposalActionLoading[proposal._id] === true
                                    }
                                  >
                                    {proposalActionLoading[proposal._id]
                                      ? "Processing..."
                                      : "Reject"}
                                  </button>
                                  <button
                                    onClick={() => setViewProfileFreelancer(freelancer)}
                                    className="border border-blue-500 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                  >
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400">
                          No proposals submitted yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center transition-colors">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No projects yet. Create your first project above!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal for My Projects */}
      {viewProjectModalId && (
        <ProjectDetailModal
          projectId={viewProjectModalId}
          isOpen={!!viewProjectModalId}
          onClose={() => setViewProjectModalId(null)}
        />
      )}

      {/* Freelancer Profile Modal */}
      {viewProfileFreelancer && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Freelancer Profile
              </h2>
              <button
                onClick={() => setViewProfileFreelancer(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Profile Picture and Name */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {viewProfileFreelancer.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewProfileFreelancer.profile.avatar}
                      alt={viewProfileFreelancer.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {(() => {
                        const name = viewProfileFreelancer.displayName || "U";
                        const parts = name.trim().split(" ");
                        if (parts.length === 1) {
                          return parts[0].charAt(0).toUpperCase();
                        }
                        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                      })()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {viewProfileFreelancer.displayName}
                  </h3>
                  {viewProfileFreelancer.email && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {viewProfileFreelancer.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                {viewProfileFreelancer.profile?.location && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewProfileFreelancer.profile.location}
                    </p>
                  </div>
                )}

                {viewProfileFreelancer.profile?.age && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Age</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewProfileFreelancer.profile.age} years
                    </p>
                  </div>
                )}

                {viewProfileFreelancer.profile?.workExperience && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Work Experience</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewProfileFreelancer.profile.workExperience}
                    </p>
                  </div>
                )}

                {viewProfileFreelancer.profile?.phoneNumber && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewProfileFreelancer.profile.phoneNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Skills */}
              {viewProfileFreelancer.profile?.skills?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewProfileFreelancer.profile.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {viewProfileFreelancer.profile?.portfolio && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Portfolio
                  </h4>
                  <a
                    href={viewProfileFreelancer.profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {viewProfileFreelancer.profile.portfolio}
                  </a>
                </div>
              )}

              {/* About */}
              {viewProfileFreelancer.profile?.about && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    About
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {viewProfileFreelancer.profile.about}
                  </p>
                </div>
              )}

              {/* Bio */}
              {viewProfileFreelancer.profile?.bio && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Bio
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewProfileFreelancer.profile.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewProfileFreelancer(null)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
