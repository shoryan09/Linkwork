import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import ProjectCard from "@/components/projects/ProjectCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  label: string;
}

function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder,
  label,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const removeFilter = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between h-[42px]"
      >
        <span className={selectedValues.length > 0 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
          {selectedValues.length > 0
            ? `${selectedValues.length} ${label} selected`
            : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-900 dark:text-white">{option}</span>
            </label>
          ))}
        </div>
      )}

    </div>
  );
}

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

const COMMON_SKILLS = [
  "Web Development",
  "Mobile App Development",
  "React",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "PHP",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "UI/UX Design",
  "Graphic Design",
  "Logo Design",
  "Branding",
  "Content Writing",
  "Copywriting",
  "SEO",
  "Digital Marketing",
  "Social Media Marketing",
  "Video Editing",
  "Photography",
  "Data Entry",
  "Excel",
  "WordPress",
  "Shopify",
  "E-commerce",
  "API Development",
  "DevOps",
  "Cloud Computing",
  "Machine Learning",
  "Data Science",
  "Other",
];

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    state: [] as string[],
    skills: [] as string[],
    minBudget: "",
    maxBudget: "",
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("status", "open");
      
      if (filters.search) {
        query.append("search", filters.search);
      }
      if (filters.state.length > 0) {
        filters.state.forEach((state) => {
          query.append("state", state);
        });
      }
      if (filters.skills.length > 0) {
        filters.skills.forEach((skill) => {
          query.append("skills", skill);
        });
      }
      if (filters.minBudget) {
        query.append("minBudget", filters.minBudget);
      }
      if (filters.maxBudget) {
        query.append("maxBudget", filters.maxBudget);
      }

      const response = await api.get(`/projects?${query.toString()}`);
      setProjects(response.data.projects || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSearch = () => {
    fetchProjects();
  };

  const handleResetFilters = async () => {
    const resetFilters = {
      search: "",
      state: [] as string[],
      skills: [] as string[],
      minBudget: "",
      maxBudget: "",
    };
    setFilters(resetFilters);
    
    // Fetch all projects with reset filters
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("status", "open");
      const response = await api.get(`/projects?${query.toString()}`);
      setProjects(response.data.projects || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Browse Projects
        </h1>

        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              placeholder="Search projects..."
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            {/* Location (State) Multi-Select Dropdown */}
            <MultiSelectDropdown
              options={INDIAN_STATES}
              selectedValues={filters.state}
              onChange={(values) => setFilters((prev) => ({ ...prev, state: values }))}
              placeholder="Select States"
              label="States"
            />

            {/* Skills Multi-Select Dropdown */}
            <MultiSelectDropdown
              options={COMMON_SKILLS}
              selectedValues={filters.skills}
              onChange={(values) => setFilters((prev) => ({ ...prev, skills: values }))}
              placeholder="Select Skills"
              label="Skills"
            />

            {/* Min Budget */}
            <input
              type="number"
              name="minBudget"
              value={filters.minBudget}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              placeholder="Min Budget (₹)"
              min="0"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />

            {/* Max Budget */}
            <input
              type="number"
              name="maxBudget"
              value={filters.maxBudget}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              placeholder="Max Budget (₹)"
              min="0"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Selected Filters Display */}
          {(filters.state.length > 0 || filters.skills.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {filters.state.map((state) => (
                  <span
                    key={state}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                  >
                    {state}
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, state: prev.state.filter((s) => s !== state) }))}
                      className="hover:text-blue-600 dark:hover:text-blue-300"
                      aria-label={`Remove ${state}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {filters.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))}
                      className="hover:text-green-600 dark:hover:text-green-300"
                      aria-label={`Remove ${skill}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search and Reset Buttons */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            {(filters.search || filters.state.length > 0 || filters.skills.length > 0 || filters.minBudget || filters.maxBudget) && (
              <button
                onClick={handleResetFilters}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset Filters
              </button>
            )}
          </div>
        </div>

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
              <ProjectCard 
                key={project._id} 
                project={project}
                onSubmitProposal={(projectData) => {
                  // If user is not logged in, redirect to login
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  // If user is a freelancer, navigate to dashboard with project ID
                  if (user.role === "freelancer" || user.role === "both") {
                    router.push(`/dashboard/freelancer?proposalProjectId=${projectData._id}`);
                  }
                }}
              />
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
