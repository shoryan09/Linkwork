import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import ProjectCard from "@/components/projects/ProjectCard";
import api from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data.projects);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Browse Projects
        </h1>

        {/* Search and Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search projects..."
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Location"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Skills"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Loading projects...
          </p>
        ) : error ? (
          <p className="text-center text-red-600 dark:text-red-400">
            Error: {error}
          </p>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No projects found.
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              Check back later for new opportunities!
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
