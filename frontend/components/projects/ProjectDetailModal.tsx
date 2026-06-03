import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ProjectDetailModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposal?: (project: ProjectDetails) => void;
}

interface ProjectDetails {
  _id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
    type?: string;
  };
  skills: string[];
  location: string;
  duration: string;
  status: string;
  proposalsCount?: number;
  deadline?: string;
  createdAt: string;
  finishedAt?: string;
  clientId?: {
    _id: string;
    displayName: string;
    profile?: {
      avatar?: string;
    };
    rating?: {
      average: number;
      count: number;
    };
  };
  hiredFreelancer?: {
    _id: string;
    displayName: string;
  };
}

export default function ProjectDetailModal({
  projectId,
  isOpen,
  onClose,
  onSubmitProposal,
}: ProjectDetailModalProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setHasApplied(false); // Reset state when opening modal
      fetchProjectDetails();
      if (user && (user.role === "freelancer" || user.role === "both")) {
        checkIfApplied();
      }
    } else {
      // Reset state when modal closes
      setHasApplied(false);
      setProject(null);
    }
  }, [isOpen, projectId, user]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (err: any) {
      console.error("Error fetching project details:", err);
      // Check if project not found (404) or doesn't exist
      if (err.response?.status === 404 || err.response?.data?.error?.includes("not found")) {
        setError("Project does not exist");
      } else {
        setError(err.response?.data?.error || "Failed to load project details");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!user || !projectId) return;
    
    try {
      setCheckingApplied(true);
      const response = await api.get("/proposals/my");
      const proposals = response.data.proposals || [];
      
      // Check if any proposal exists for this project
      const hasProposal = proposals.some((p: any) => {
        const proposalProjectId = p.projectId?._id || p.projectId;
        return proposalProjectId === projectId;
      });
      
      setHasApplied(hasProposal);
    } catch (err: any) {
      console.error("Error checking if applied:", err);
      setHasApplied(false);
    } finally {
      setCheckingApplied(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      short: "Short Term (1-3 months)",
      medium: "Medium Term (3-6 months)",
      long: "Long Term (6+ months)",
    };
    return labels[duration] || duration;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      open: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Open" },
      "in-progress": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "In Progress" },
      completed: { color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Cancelled" },
    };
    const badge = badges[status] || badges.open;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading project details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        ) : project ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {project.title}
                  </h2>
                  {getStatusBadge(project.status)}
                </div>
                {project.clientId && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Posted by:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {project.clientId.displayName}
                    </span>
                    {project.clientId.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {project.clientId.rating.average.toFixed(1)} ({project.clientId.rating.count})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Project Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Budget Range
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()}
                  </p>
                  {project.budget.type && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.budget.type === "fixed" ? "Fixed Price" : "Hourly Rate"}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Location
                  </h4>
                  {project.location.includes(",") ? (
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.location.split(",")[0].trim()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.location.split(",").slice(1).join(",").trim()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {project.location}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Project Duration
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getDurationLabel(project.duration)}
                  </p>
                </div>

                {/* Proposals */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Proposals
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.proposalsCount || 0} proposal{project.proposalsCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {project.deadline && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Deadline
                    </h4>
                    <p className="text-gray-900 dark:text-white">{formatDate(project.deadline)}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Posted On
                  </h4>
                  <p className="text-gray-900 dark:text-white">{formatDate(project.createdAt)}</p>
                </div>
              </div>

              {/* Hired Freelancer */}
              {project.hiredFreelancer && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                    Hired Freelancer
                  </h4>
                  <p className="text-green-900 dark:text-green-100 font-semibold">
                    {project.hiredFreelancer.displayName}
                  </p>
                </div>
              )}

              {/* Finished Date */}
              {project.status === "finished" && project.finishedAt && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    ✓ Project Finished
                  </h4>
                  <p className="text-purple-900 dark:text-purple-100 font-semibold">
                    {new Date(project.finishedAt).toLocaleString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {user && project.status === "open" && (
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
                {user.role === "freelancer" || user.role === "both" ? (
                  hasApplied ? (
                    <button
                      disabled
                      className="px-6 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-lg font-semibold cursor-not-allowed opacity-75"
                    >
                      Already Applied
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onSubmitProposal && project) {
                          // Ensure project has all required fields
                          const projectData = {
                            _id: project._id,
                            title: project.title,
                            description: project.description,
                            budget: project.budget,
                            duration: project.duration,
                            skills: project.skills,
                            location: project.location,
                            status: project.status,
                            createdAt: project.createdAt,
                          };
                          onClose();
                          // Use setTimeout to ensure modal closes before opening new one
                          setTimeout(() => {
                            onSubmitProposal(projectData);
                          }, 150);
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Submit Proposal
                    </button>
                  )
                ) : null}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

