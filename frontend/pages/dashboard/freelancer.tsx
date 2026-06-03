import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import api from "@/lib/api";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectDetailModal from "@/components/projects/ProjectDetailModal";
import RateExperienceModal from "@/components/RateExperienceModal";

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
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  Haryana: ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  Karnataka: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  Manipur: ["Imphal", "Thoubal", "Bishnupur"],
  Meghalaya: ["Shillong", "Tura", "Jowai"],
  Mizoram: ["Aizawl", "Lunglei", "Saiha"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer"],
  Sikkim: ["Gangtok", "Namchi", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  Tripura: ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad"],
  Uttarakhand: ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  Delhi: ["New Delhi", "Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  Ladakh: ["Leh", "Kargil"],
  Puducherry: ["Puducherry", "Karaikal"],
};

const COMPLEXITY_OPTIONS = [
  { value: "", label: "Any complexity" },
  { value: "short", label: "Simple (1-2 weeks)" },
  { value: "medium", label: "Moderate (2-4 weeks)" },
  { value: "long", label: "Complex (1+ months)" },
];

export default function FreelancerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { unreadByProject } = useUnreadCount();
  const [projects, setProjects] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [error, setError] = useState("");
  const [proposalError, setProposalError] = useState("");
  const [proposalSuccess, setProposalSuccess] = useState("");
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [viewProjectModalId, setViewProjectModalId] = useState<string | null>(null);
  const [ratingModalData, setRatingModalData] = useState<{
    projectId: string;
    projectTitle: string;
    clientId: string;
  } | null>(null);
  const [reviewedProjects, setReviewedProjects] = useState<Set<string>>(new Set());

  // Format unread count like WhatsApp (1, 2, 3, 4+)
  const formatUnreadCount = (count: number) => {
    if (!count || count === 0) return null;
    if (count > 4) return "4+";
    return count.toString();
  };
  const [filters, setFilters] = useState({
    state: "",
    city: "",
    minBudget: "",
    maxBudget: "",
    complexity: "",
  });

  const availableCities = useMemo(() => {
    if (!filters.state) {
      return [];
    }
    return CITIES_BY_STATE[filters.state] || [];
  }, [filters.state]);

  const openProposalModal = useCallback((project: any) => {
    setSelectedProject(project);
    setProposalText("");
    setProposalError("");
    setProposalSuccess("");
    setShowProposalModal(true);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role !== "freelancer" && user.role !== "both") {
        router.push("/dashboard/client");
        return;
      }

      // fetchProjects will also fetch proposals internally
      fetchProjects();
      // Also fetch proposals separately for the proposals section
      fetchProposals();
    }
  }, [user, authLoading, router]);

  // Auto-open proposal modal if proposalProjectId query parameter is present
  useEffect(() => {
    const proposalProjectId = router.query.proposalProjectId as string;
    if (proposalProjectId && !projectsLoading && !showProposalModal) {
      // Find the project in the current projects list
      const project = projects.find((p: any) => p._id === proposalProjectId);
      
      if (project) {
        // Project is already in the list, open modal directly
        openProposalModal(project);
        // Remove query parameter from URL
        router.replace("/dashboard/freelancer", undefined, { shallow: true });
      } else {
        // Project not in list, fetch it separately
        const fetchProjectById = async () => {
          try {
            const response = await api.get(`/projects/${proposalProjectId}`);
            const projectData = response.data.project;
            if (projectData) {
              openProposalModal(projectData);
              // Remove query parameter from URL
              router.replace("/dashboard/freelancer", undefined, { shallow: true });
            }
          } catch (err: any) {
            console.error("Error fetching project:", err);
            // Remove query parameter even if fetch fails
            router.replace("/dashboard/freelancer", undefined, { shallow: true });
          }
        };
        fetchProjectById();
      }
    }
  }, [router.query.proposalProjectId, projectsLoading, projects, showProposalModal, openProposalModal, router]);

  // Internal function to fetch proposals without setting loading state
  const fetchProposalsData = async () => {
    try {
      const response = await api.get("/proposals/my");
      return response.data.proposals || [];
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
      return [];
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const proposals = await fetchProposalsData();
      setProposals(proposals);

      // Check which finished projects have been reviewed
      const finishedProjectIds = proposals
        .filter((p: any) => p.projectId?.status === "finished")
        .map((p: any) => p.projectId._id);

      if (finishedProjectIds.length > 0) {
        const reviewChecks = await Promise.all(
          finishedProjectIds.map((projectId: string) =>
            api.get(`/reviews/check/${projectId}`).catch(() => ({ data: { exists: false } }))
          )
        );

        const reviewed = new Set<string>();
        finishedProjectIds.forEach((projectId: string, index: number) => {
          if (reviewChecks[index]?.data?.exists) {
            reviewed.add(projectId);
          }
        });

        setReviewedProjects(reviewed);
      }
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const fetchProjects = async () => {
    setProjectsLoading(true);
    setError("");

    try {
      // First fetch proposals to get project IDs that already have proposals
      const proposals = await fetchProposalsData();
      const proposedProjectIds = new Set(
        proposals.map((p: any) => p.projectId?._id || p.projectId)
      );

      const query = new URLSearchParams();
      query.append("status", "open");
      query.append("limit", "12");
      if (filters.state) query.append("state", filters.state);
      if (filters.city) query.append("city", filters.city);
      if (filters.minBudget) query.append("minBudget", filters.minBudget);
      if (filters.maxBudget) query.append("maxBudget", filters.maxBudget);
      if (filters.complexity) query.append("complexity", filters.complexity);

      const response = await api.get(`/projects?${query.toString()}`);
      const allProjects = response.data.projects || [];
      
      // Filter out projects that already have proposals
      const availableProjects = allProjects.filter(
        (project: any) => !proposedProjectIds.has(project._id)
      );
      
      setProjects(availableProjects);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.error || "Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state"
        ? {
            city: "",
          }
        : {}),
    }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      state: "",
      city: "",
      minBudget: "",
      maxBudget: "",
      complexity: "",
    }));
    // Delay to ensure state updates before fetching
    setTimeout(() => {
      fetchProjects();
    }, 0);
  };

  const closeProposalModal = () => {
    if (proposalSubmitting) return;
    setShowProposalModal(false);
    setSelectedProject(null);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const words = proposalText.trim().split(/\s+/).filter(Boolean);

    if (words.length < 30) {
      setProposalError("Please write at least 30 words explaining why you're a great fit.");
      return;
    }

    setProposalSubmitting(true);
    setProposalError("");
    setProposalSuccess("");

    const defaultBudget =
      selectedProject?.budget?.max ||
      selectedProject?.budget?.min ||
      selectedProject?.budget ||
      0;
    const durationMap: Record<string, number> = {
      short: 14,
      medium: 30,
      long: 60,
    };
    const deliveryTime = durationMap[selectedProject?.duration as string] || 30;

    try {
      await api.post("/proposals", {
        projectId: selectedProject._id,
        coverLetter: proposalText.trim(),
        proposedBudget: defaultBudget,
        deliveryTime,
      });
      setProposalSuccess("Proposal submitted successfully!");
      setShowProposalModal(false);
      setSelectedProject(null);
      setProposalText("");
      // Refresh projects (which will filter out the one we just submitted)
      // and refresh proposals list
      await fetchProjects();
      await fetchProposals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to submit proposal. Please try again.";
      
      // Check if it's a duplicate proposal error
      if (err.response?.status === 409 || errorMessage.includes("already submitted")) {
        setProposalError("You have already submitted a proposal for this project.");
        // Remove the project from the list immediately
        setProjects((prev) => prev.filter((p: any) => p._id !== selectedProject._id));
      } else {
        setProposalError(errorMessage);
      }
    } finally {
      setProposalSubmitting(false);
    }
  };

  if (authLoading) {
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
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8 transition-colors">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome back, {user?.displayName || user?.email || "User"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You're logged in as a{" "}
            <span className="font-semibold">Freelancer</span>
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Find Local Work
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleResetFilters}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={fetchProjects}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={projectsLoading}
              >
                {projectsLoading ? "Filtering..." : "Apply Filters"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              value={filters.city}
              onChange={handleFilterChange}
              disabled={!filters.state}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">Select city</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="minBudget"
              value={filters.minBudget}
              onChange={handleFilterChange}
              placeholder="Min pay (₹)"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <input
              type="number"
              name="maxBudget"
              value={filters.maxBudget}
              onChange={handleFilterChange}
              placeholder="Max pay (₹)"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <select
              name="complexity"
              value={filters.complexity}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white md:col-span-2 lg:col-span-1"
            >
              {COMPLEXITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Open Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Open Projects
          </h2>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {projectsLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project: any) => (
                <div
                  key={project._id}
                  className="flex flex-col bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <ProjectCard 
                    project={project}
                    onSubmitProposal={(projectData) => {
                      openProposalModal(projectData);
                    }}
                  />
                  <div className="mt-4 flex items-center justify-center">
                    <button
                      onClick={() => openProposalModal(project)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Submit a Proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No projects match your filters right now. Try adjusting the filters or check back
              later.
            </p>
          )}
        </div>

        {/* My Proposals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Proposals
            </h2>
            <button
              onClick={fetchProposals}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {proposalsLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading your proposals...</p>
          ) : proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal: any) => (
                <div
                  key={proposal._id}
                  className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {proposal.projectId?.title || "Project unavailable"}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {proposal.projectId?.location}
                      </div>
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
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-200">
                        Proposed Budget
                      </p>
                      <p>₹{proposal.proposedBudget?.toLocaleString() || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-200">
                        Delivery Time
                      </p>
                      <p>{proposal.deliveryTime ? `${proposal.deliveryTime} days` : "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-200">
                        Project Budget
                      </p>
                      {proposal.projectId?.budget ? (
                        <p>
                          ₹{proposal.projectId.budget.min.toLocaleString()} - ₹
                          {proposal.projectId.budget.max.toLocaleString()}
                        </p>
                      ) : (
                        <p>—</p>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-200">
                        Project Status
                      </p>
                      <p>
                        {proposal.projectId?.status
                          ? proposal.projectId.status.charAt(0).toUpperCase() +
                            proposal.projectId.status.slice(1)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {proposal.projectId?.status === "finished" && proposal.projectId?.finishedAt && (
                    <div className="mt-4 text-sm text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      ✓ Project Finished on {new Date(proposal.projectId.finishedAt).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        if (proposal.projectId?._id) {
                          setViewProjectModalId(proposal.projectId._id);
                        }
                      }}
                      className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      disabled={!proposal.projectId?._id}
                    >
                      View Project
                    </button>
                    {proposal.status === "accepted" && 
                     proposal.projectId?._id && 
                     proposal.projectId?.status !== "finished" && (
                      <button
                        onClick={() => router.push(`/chat/${proposal.projectId._id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors relative"
                      >
                        Open Chat
                        {formatUnreadCount(unreadByProject[proposal.projectId._id]) && (
                          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {formatUnreadCount(unreadByProject[proposal.projectId._id])}
                          </span>
                        )}
                      </button>
                    )}
                    {proposal.status === "accepted" &&
                     proposal.projectId?.status === "finished" && 
                     !reviewedProjects.has(proposal.projectId._id) && (
                      <button
                        onClick={() => {
                          const clientId = typeof proposal.projectId.clientId === 'string' 
                            ? proposal.projectId.clientId 
                            : proposal.projectId.clientId?._id;
                          
                          if (clientId) {
                            setRatingModalData({
                              projectId: proposal.projectId._id,
                              projectTitle: proposal.projectId.title,
                              clientId: clientId,
                            });
                          } else {
                            alert("Unable to load client information. Please try again.");
                          }
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                      >
                        ⭐ Rate Experience
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              You haven't submitted any proposals yet. Browse open projects and send your first
              proposal!
            </p>
          )}
        </div>
      </div>

      {showProposalModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 max-w-2xl w-full rounded-xl shadow-lg p-6 md:p-8 relative">
            <button
              onClick={closeProposalModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close proposal form"
              disabled={proposalSubmitting}
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Submit Proposal
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {selectedProject.title}
            </p>

            <form onSubmit={handleSubmitProposal} className="space-y-5">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Why are you a great fit? <span className="text-sm font-normal">(minimum 30 words)</span>
                </label>
                <textarea
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Describe your relevant skills, experience, and why you would be a strong match for this project..."
                  disabled={proposalSubmitting}
                />
                <div className="flex justify-between text-sm mt-2 text-gray-500 dark:text-gray-400">
                  <span>{proposalText.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span>Minimum 30 words</span>
                </div>
              </div>

              {proposalError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                  {proposalError}
                </div>
              )}

              {proposalSuccess && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded">
                  {proposalSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeProposalModal}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={proposalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                  disabled={
                    proposalSubmitting ||
                    proposalText.trim().split(/\s+/).filter(Boolean).length < 30
                  }
                >
                  {proposalSubmitting ? "Submitting..." : "Submit Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal for My Proposals */}
      {viewProjectModalId && (
        <ProjectDetailModal
          projectId={viewProjectModalId}
          isOpen={!!viewProjectModalId}
          onClose={() => setViewProjectModalId(null)}
          onSubmitProposal={(project) => {
            setViewProjectModalId(null);
            openProposalModal(project);
          }}
        />
      )}

      {/* Rate Experience Modal */}
      {ratingModalData && (
        <RateExperienceModal
          isOpen={!!ratingModalData}
          onClose={() => setRatingModalData(null)}
          projectId={ratingModalData.projectId}
          projectTitle={ratingModalData.projectTitle}
          clientId={ratingModalData.clientId}
          onSuccess={() => {
            fetchProposals();
            setRatingModalData(null);
          }}
        />
      )}
    </Layout>
  );
}
