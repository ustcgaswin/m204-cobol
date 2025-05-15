import { useState, useMemo, useEffect } from 'react';
import ProjectCard from './components/ProjectCard.jsx';
import CreateProjectModal from './components/CreateProjectModal.jsx'; // Import the modal
import { ProjectStatus } from './utils/enums.js';

// Sample project data
const sampleProjects = [
  { id: '1', name: 'Project Alpha', description: 'This is a detailed description for Project Alpha. It involves several key milestones and deliverables aimed at improving user engagement.', status: ProjectStatus.GENERATION_COMPLETE, lastUpdated: '2024-03-15T10:00:00Z' },
  { id: '2', name: 'Project Beta', description: 'Project Beta focuses on developing new features for the core platform. The team is currently working on the initial phase.', status: ProjectStatus.ANALYSIS_IN_PROGRESS, lastUpdated: '2024-05-10T14:30:00Z' },
  { id: '3', name: 'Project Gamma', description: 'The requirements for Project Gamma have been gathered, and the project is awaiting commencement.', status: ProjectStatus.ANALYSIS_PENDING, lastUpdated: '2024-04-20T09:00:00Z' },
  { id: '4', name: 'Project Delta', description: 'Project Delta is currently on hold pending further review and resource allocation. It aims to explore new market segments.', status: ProjectStatus.MAPPING_PENDING, lastUpdated: '2024-01-25T16:45:00Z' },
  { id: '5', name: 'Project Epsilon', description: 'This project was cancelled due to unforeseen circumstances and a shift in strategic priorities.', status: ProjectStatus.ANALYSIS_PENDING, lastUpdated: '2023-12-01T11:20:00Z' }, // Or choose another appropriate status like ANALYSIS_PENDING if "cancelled" is not part of the new flow
  { id: '6', name: 'Project Zeta', description: 'A new initiative to explore AI integration.', status: ProjectStatus.MAPPING_IN_PROGRESS, lastUpdated: '2024-05-01T12:00:00Z' },
  { id: '7', name: 'Project Eta', description: 'Customer feedback portal development.', status: ProjectStatus.GENERATION_PENDING, lastUpdated: '2024-04-28T10:15:00Z' },
  { id: '8', name: 'Project Theta', description: 'Security audit and improvements.', status: ProjectStatus.ANALYSIS_COMPLETE, lastUpdated: '2024-02-10T17:00:00Z' },
];

const PROJECTS_PER_PAGE = 3;
const ALL_STATUSES = 'ALL_STATUSES'; // Constant for representing all statuses

function App() {
  const [projects, setProjects] = useState(sampleProjects);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false); // This will now control modal visibility
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUSES);

  // Reset current page when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // Create New Project Handler
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectDescription.trim()) {
      alert("Please provide both project name and description.");
      return;
    }
    const newProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newProjectName,
      description: newProjectDescription,
      status: ProjectStatus.ANALYSIS_PENDING, // Default status for new projects
      lastUpdated: new Date().toISOString(),
    };
    setProjects(prevProjects => [newProject, ...prevProjects]);
    setNewProjectName('');
    setNewProjectDescription('');
    setShowCreateForm(false); // Close the modal
    setSearchTerm(''); // Optionally clear search/filter
    setSelectedStatus(ALL_STATUSES); // Optionally clear search/filter
    setCurrentPage(1);
  };

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        // Filter by status
        if (selectedStatus === ALL_STATUSES) {
          return true;
        }
        return project.status === selectedStatus;
      })
      .filter(project => {
        // Filter by search term (name or description)
        if (!searchTerm.trim()) {
          return true;
        }
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(lowerSearchTerm) ||
          project.description.toLowerCase().includes(lowerSearchTerm)
        );
      });
  }, [projects, searchTerm, selectedStatus]);

  // Pagination Logic (uses filteredProjects)
  const indexOfLastProject = currentPage * PROJECTS_PER_PAGE;
  const indexOfFirstProject = indexOfLastProject - PROJECTS_PER_PAGE;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Get unique status values for the filter dropdown
  const statusOptions = [
    { value: ALL_STATUSES, label: 'All Statuses' },
    ...Object.values(ProjectStatus).map(status => ({
      value: status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // Prettify label
    }))
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Projects Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(true)} // Open the modal
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded shadow transition duration-150 ease-in-out w-full sm:w-auto flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Project
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="searchProjects" className="block text-sm font-medium text-gray-700 mb-1">
              Search Projects
            </label>
            <input
              type="text"
              id="searchProjects"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="filterStatus"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modal for Creating Project */}
      <CreateProjectModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDescription={newProjectDescription}
        setNewProjectDescription={setNewProjectDescription}
        handleCreateProject={handleCreateProject}
      />

      {filteredProjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-4 py-2 text-sm font-medium border rounded-md ${
                    currentPage === number
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600">
            {searchTerm || selectedStatus !== ALL_STATUSES ? 'No projects match your criteria.' : 'No projects found.'}
          </p>
          {!showCreateForm && !(searchTerm || selectedStatus !== ALL_STATUSES) && (
             <p className="text-gray-500 mt-2">You can start by creating a new project.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;