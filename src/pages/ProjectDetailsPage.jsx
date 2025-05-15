// src/pages/ProjectDetailsPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProjectStatus } from '../utils/enums'; // Assuming enums.js is in utils

// Sample project data (replace with actual data fetching later)
// Updated to use statuses from enums.js
const sampleProjects = [
  { id: '1', name: 'Project Alpha', description: 'This is a detailed description for Project Alpha. It involves several key milestones and deliverables aimed at improving user engagement.', status: ProjectStatus.GENERATION_COMPLETE, details: 'Further details about Alpha: Completed on Q1 2025. Key outcomes include a 20% increase in user retention.' },
  { id: '2', name: 'Project Beta', description: 'Project Beta focuses on developing new features for the core platform. The team is currently working on the initial phase.', status: ProjectStatus.ANALYSIS_IN_PROGRESS, details: 'Further details about Beta: Currently in active development. Sprint 3 is underway, focusing on UI mockups.' },
  { id: '3', name: 'Project Gamma', description: 'The requirements for Project Gamma have been gathered, and the project is awaiting commencement.', status: ProjectStatus.ANALYSIS_PENDING, details: 'Further details about Gamma: All requirements signed off. Awaiting project manager assignment.' }, // Example: Was REQUIREMENTS_GATHERED
  { id: '4', name: 'Project Delta', description: 'Project Delta is currently on hold pending further review and resource allocation. It aims to explore new market segments.', status: ProjectStatus.MAPPING_PENDING, details: 'Further details about Delta: On hold due to budget constraints. Re-evaluation scheduled for next quarter.' }, // Example: Was ON_HOLD
  { id: '5', name: 'Project Epsilon', description: 'This project was cancelled due to unforeseen circumstances and a shift in strategic priorities.', status: ProjectStatus.ANALYSIS_PENDING, details: 'Further details about Epsilon: Cancelled on May 1st, 2025. Resources reallocated to Project Zeta.' }, // Example: Was CANCELLED. Consider adding a ProjectStatus.CANCELLED to enums.js if needed.
];


const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  // In a real app, you would fetch project details based on projectId
  const project = sampleProjects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you are looking for does not exist or has been moved.</p>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-sm">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Updated to use statuses from enums.js and align with ProjectCard.jsx styling
  const getStatusConfig = (status) => {
    switch (status) {
      case ProjectStatus.ANALYSIS_PENDING:
        return { label: ProjectStatus.ANALYSIS_PENDING, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
      case ProjectStatus.ANALYSIS_IN_PROGRESS:
        return { label: ProjectStatus.ANALYSIS_IN_PROGRESS, bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
      case ProjectStatus.ANALYSIS_COMPLETE:
        return { label: ProjectStatus.ANALYSIS_COMPLETE, bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
      case ProjectStatus.MAPPING_PENDING:
        return { label: ProjectStatus.MAPPING_PENDING, bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' };
      case ProjectStatus.MAPPING_IN_PROGRESS:
        return { label: ProjectStatus.MAPPING_IN_PROGRESS, bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' };
      case ProjectStatus.MAPPING_COMPLETE:
        return { label: ProjectStatus.MAPPING_COMPLETE, bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' };
      case ProjectStatus.GENERATION_PENDING:
        return { label: ProjectStatus.GENERATION_PENDING, bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500' };
      case ProjectStatus.GENERATION_IN_PROGRESS:
        return { label: ProjectStatus.GENERATION_IN_PROGRESS, bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
      case ProjectStatus.GENERATION_COMPLETE:
        return { label: ProjectStatus.GENERATION_COMPLETE, bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' };
      // Add a case for a "CANCELLED" status if you add it to enums.js
      // case ProjectStatus.CANCELLED:
      //   return { label: ProjectStatus.CANCELLED, bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
      default:
        return { label: status || 'Unknown', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300' };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div >
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
          {/* Header with Project Name and Status */}
          <div className="border-b border-gray-200 bg-white px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`mt-3 md:mt-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dot} mr-2`}></span>
                {statusConfig.label}
              </span>
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
            
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-10">
              <Link
                to={`/project/${projectId}/source-files`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm transition-all duration-200"
              >
                <span>Manage Source Files</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;