import { useState } from "react";
import ProjectDetailModal from "./ProjectDetailModal";

interface ProjectCardProps {
  project: {
    _id: string;
    title: string;
    description: string;
    budget: {
      min: number;
      max: number;
    };
    skills: string[];
    location: string;
    proposalsCount?: number;
  };
  onSubmitProposal?: (project: any) => void;
}

export default function ProjectCard({ project, onSubmitProposal }: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const MAX_DESCRIPTION_LENGTH = 150;
  const isDescriptionLong = project.description.length > MAX_DESCRIPTION_LENGTH;
  const truncatedDescription = isDescriptionLong 
    ? project.description.substring(0, MAX_DESCRIPTION_LENGTH) 
    : project.description;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all flex flex-col h-full">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {project.title}
        </h3>

        <div className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
          <p className="inline">
            {truncatedDescription}
            {isDescriptionLong && "... "}
            {isDescriptionLong && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline"
              >
                View More
              </button>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
          {project.skills.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
              +{project.skills.length - 3}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="font-semibold">
            ₹{project.budget.min.toLocaleString()} - ₹
            {project.budget.max.toLocaleString()}
          </span>
          <span>{project.location}</span>
        </div>

        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {project.proposalsCount && project.proposalsCount > 0
            ? `${project.proposalsCount} proposal${project.proposalsCount > 1 ? "s" : ""}`
            : "No proposals yet."}
        </div>

        {/* View Project Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Project
        </button>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        projectId={project._id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitProposal={onSubmitProposal}
      />
    </>
  );
}
