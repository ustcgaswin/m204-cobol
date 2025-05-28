import { Link } from 'react-router-dom';
import { Trash2, Calendar, ChevronRight } from 'lucide-react'; // Added Calendar and ChevronRight icons

const ProjectCard = ({ project, onDeleteRequest, onCardClick }) => {
  const { id, name, description, lastUpdated } = project;

  // Format date to be more readable
  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  // Handle description truncation with word boundaries
  const truncateDescription = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    
    // Find the last space before maxLength
    const lastSpaceIndex = text.lastIndexOf(' ', maxLength);
    const truncatedText = text.substring(0, lastSpaceIndex > 0 ? lastSpaceIndex : maxLength);
    return `${truncatedText}...`;
  };

  const truncatedDescription = truncateDescription(description, 120);
  
  // Handle delete confirmation with user feedback
  const handleDelete = (e) => {
    e.preventDefault(); // Prevent event bubbling
    e.stopPropagation();
    onDeleteRequest(id, name);
  };

  // Handle card click
  const handleCardClick = (e) => {
    // Only trigger card click if not clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    onCardClick(id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full relative group"
    >
      {/* Card Content Container */}
      <div className="p-5 flex flex-col h-full">
        {/* Header Section */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1" title={name}>
            {name}
          </h3>
        </div>
        
        {/* Description Section */}
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3" title={description}>
          {truncatedDescription || "No description provided"}
        </p>
        
        {/* Date Section - Made more prominent */}
        {formattedDate && (
          <div className="flex items-center text-xs text-gray-500 mb-4 mt-auto">
            <Calendar size={14} className="mr-1" />
            <span>Updated {formattedDate}</span>
          </div>
        )}
        
        {/* Actions Section */}
        <div className="flex justify-between items-center gap-2 mt-2">
          <Link
            to={`/project/${id}`}
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking the button
            className="flex-grow inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:outline-none text-white font-medium py-2 px-4 rounded-md text-sm transition-all duration-200"
            aria-label={`Open ${name} project details`}
          >
            Open Project
            <ChevronRight size={16} className="ml-1" />
          </Link>
          
          <button
            onClick={handleDelete}
            className="p-2 rounded-md bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none transition-all duration-200"
            aria-label={`Delete ${name} project`}
            title="Delete project"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Hover Effect Overlay - Visual feedback for card being interactive */}
      <div className="absolute inset-0 border-2 border-transparent rounded-lg group-hover:border-teal-500 pointer-events-none transition-all duration-200"></div>
    </div>
  );
};

export default ProjectCard;