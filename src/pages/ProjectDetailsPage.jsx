import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { ProjectStatus } from '../utils/enums'; // Removed: ProjectStatus no longer used
import apiClient from '../config/axiosConfig.js'; // Import the apiClient

// Sample project data removed - will fetch from API

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  // const navigate = useNavigate(); // Removed: For potential redirection
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/projects/${projectId}`);
        const p = response.data.data;
        setProject({
          id: p.project_id.toString(),
          name: p.project_name,
          description: p.description,
          // status: p.project_status, // Status removed
          lastUpdated: p.updated_at || new Date().toISOString(),
          // details: p.details, // If your backend provides a 'details' field, map it here
        });
      } catch (err) {
        console.error(`Failed to fetch project ${projectId}:`, err);
        setError(err.response?.data?.detail || "Failed to load project details.");
        if (err.response?.status === 404) {
          // Optional: redirect or show specific "not found" UI handled by the general error display
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // const getStatusConfig = (status) => { ... }; // Removed getStatusConfig function
  // const statusConfig = getStatusConfig(project.status); // Removed statusConfig variable

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <p className="text-xl text-gray-700">Loading project details...</p>
        {/* You can add a spinner or more elaborate loading animation here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-sm">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (!project) {
    // This case should ideally be covered by the error state if API returns 404
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you are looking for could not be loaded.</p>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-sm">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        {/* Main content card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header with Project Name */}
          <div className="border-b border-gray-200 bg-white px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {/* Status Label Removed */}
              {/* <span className={`mt-3 md:mt-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dot} mr-2`}></span>
                {statusConfig.label}
              </span> */}
            </div>
          </div>

          {/* Project Information */}
          <div className="p-6">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Description</h2>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>
            </div>
            
            {project.lastUpdated && (
              <div className="text-sm text-gray-500 mb-8">
                Last updated: {new Date(project.lastUpdated).toLocaleDateString()}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-10">
              <Link
                to={`/project/${projectId}/source-files`} // Ensure this route is defined in your React Router
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm transition-all duration-200"
              >
                <span>Manage Source Files</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              {/* Add other action buttons here, e.g., Edit, Delete */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;