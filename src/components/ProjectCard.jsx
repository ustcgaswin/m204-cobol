// src/components/ProjectCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ProjectStatus } from '../utils/enums'; // Assuming enums.js is in utils

const ProjectCard = ({ project }) => {
  const { id, name, description, status, lastUpdated } = project;

  const getStatusConfig = (status) => {
    switch (status) {
      case ProjectStatus.ANALYSIS_PENDING:
        return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', label: 'Analysis Pending' };
      case ProjectStatus.ANALYSIS_IN_PROGRESS:
        return { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Analysis In Progress' };
      case ProjectStatus.ANALYSIS_COMPLETE:
        return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Analysis Complete' };
      case ProjectStatus.MAPPING_PENDING:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Mapping Pending' };
      case ProjectStatus.MAPPING_IN_PROGRESS:
        return { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Mapping In Progress' };
      case ProjectStatus.MAPPING_COMPLETE:
        return { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500', label: 'Mapping Complete' };
      case ProjectStatus.GENERATION_PENDING:
        return { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500', label: 'Generation Pending' };
      case ProjectStatus.GENERATION_IN_PROGRESS:
        return { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Generation In Progress' };
      case ProjectStatus.GENERATION_COMPLETE:
        return { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500', label: 'Generation Complete' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(status);

  // Format the description to show only first 120 characters
  const truncatedDescription = description?.length > 120 
    ? `${description.substring(0, 120)}...` 
    : description;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Top colorful status indicator */}
      <div className={`h-1 w-full ${statusConfig.dot}`}></div>
      
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 hover:text-teal-600 transition-colors">{name}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`h-2 w-2 rounded-full ${statusConfig.dot} mr-1.5`}></span>
            {statusConfig.label}
          </span>
        </div>
        
        <p className="text-gray-600 mb-6 flex-grow">{truncatedDescription}</p>
        
        {lastUpdated && (
          <div className="text-xs text-gray-500 mb-4">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </div>
        )}
        
        <div className="mt-auto flex justify-between items-center">
          <Link
            to={`/project/${id}`}
            className="inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:outline-none text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 w-full"
            aria-label={`Open ${name} project details`}
          >
            Open Project
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;