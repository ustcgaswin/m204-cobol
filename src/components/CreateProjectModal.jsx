import React, { useEffect, useRef } from 'react';

function CreateProjectModal({
  isOpen,
  onClose,
  newProjectName,
  setNewProjectName,
  newProjectDescription,
  setNewProjectDescription,
  handleCreateProject,
}) {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  
  // Focus on name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    }
  }, [isOpen]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Close when clicking outside
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateProject(e); 
  };
  
  return (
    <div 
      onClick={handleClickOutside}
      className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center transition-opacity duration-300"
    >
      <div 
        ref={modalRef}
        className="relative mx-auto p-0 w-full max-w-2xl shadow-xl rounded-xl bg-white transform transition-all duration-300"
      >
        {/* Header */}
        <div className="bg-teal-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-teal-100 transition-colors p-1 rounded-full hover:bg-teal-500"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Form content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label htmlFor="projectNameModal" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name<span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="projectNameModal"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
              placeholder="Enter a descriptive project name"
              required
            />
          </div>
          
          <div className="mb-5"> {/* Adjusted margin-bottom from mb-5 to mb-6 to maintain spacing after removing progress bar */}
            <label htmlFor="projectDescriptionModal" className="block text-sm font-medium text-gray-700 mb-1">
              Project Description<span className="text-red-500">*</span>
            </label>
            <textarea
              id="projectDescriptionModal"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
              placeholder="Describe the project goals and requirements"
              required
            ></textarea>
            
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-6"> {/* Added mt-6 to ensure spacing if progress bar was the only thing with mb-6 */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center"
              disabled={!newProjectName || !newProjectDescription}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;