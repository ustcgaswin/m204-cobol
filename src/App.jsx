import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner'; 
import { useNavigate, useLocation } from 'react-router-dom';
import ProjectCard from './components/ProjectCard.jsx';
import CreateProjectModal from './components/CreateProjectModal.jsx';
import apiClient from './config/axiosConfig.js';
import { AlertTriangle, Loader2, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

const PROJECTS_PER_PAGE = 3;

// Confirmation Modal Component (can be moved to a separate file)
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[900] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl">
          <button
            type="button"
            disabled={isLoading}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onConfirm}
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {confirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [allProjects, setAllProjects] = useState([]); // Store all fetched projects
  const [projects, setProjects] = useState([]); // Filtered and sorted projects
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({});
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  const openConfirmationModal = (props) => {
    setConfirmModalProps(props);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmModalProps({});
  };

  const handleConfirmModalAction = async () => {
    if (confirmModalProps.onConfirm) {
      setIsProcessingAction(true);
      try {
        await confirmModalProps.onConfirm();
      } catch (e) {
        console.error("Error during confirmed action:", e);
        toast.error("An unexpected error occurred.");
      } finally {
        setIsProcessingAction(false);
        closeConfirmationModal();
      }
    }
  };

  // Add this function to handle card clicks
  const handleProjectCardClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  // Fetch all projects ONCE on mount
  const fetchAllProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/projects?limit=1000');
      let fetchedProjects = response.data.data.map(p => ({
        id: p.project_id.toString(),
        name: p.project_name,
        description: p.description,
        createdAt: p.created_at || new Date().toISOString(),
      }));
      setAllProjects(fetchedProjects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err.response?.data?.detail || "Failed to fetch projects. Please try again.");
      setAllProjects([]);
      toast.error(err.response?.data?.detail || "Failed to fetch projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only fetch ONCE on mount
  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  // Filter and sort projects locally whenever allProjects, searchTerm, or sortOrder changes
  useEffect(() => {
    let filtered = allProjects;
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(lowerSearchTerm) ||
          (p.description && p.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    setProjects(filtered);
    const newTotalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);
    setTotalPages(newTotalPages);

    // Adjust currentPage if it's out of bounds after filtering
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0 && filtered.length === 0) {
      setCurrentPage(1);
    }
  }, [allProjects, searchTerm, sortOrder, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Get highlighted project ID from navigation state (if any)
  const highlightedProjectId = location.state?.highlight && location.pathname.startsWith('/project/')
    ? location.pathname.split('/').pop()
    : null;

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectDescription.trim()) {
      toast.error("Please provide both project name and description.");
      return;
    }
    setIsCreatingProject(true); 
    try {
      const newProjectData = {
        project_name: newProjectName,
        description: newProjectDescription,
      };
      const response = await apiClient.post('/projects/', newProjectData); 
      
      if (response.status === 201 && response.data) {
        setNewProjectName('');
        setNewProjectDescription('');
        setShowCreateForm(false);
        toast.success("Project created successfully!");
        await fetchAllProjects(); // Refetch all projects
        setCurrentPage(1); // Go to first page after creation

        // Navigate to the new project's page and highlight it
        const newProjectId = response.data.data?.project_id || response.data.project_id;
        if (newProjectId) {
          navigate(`/project/${newProjectId}`, { state: { highlight: true } });
        }
      } else {
        console.warn('Project created, but response was not as expected:', response);
        toast.error('Project created, but there was an issue updating the list.');
        await fetchAllProjects();
      }
    } catch (err) {
      console.error("Failed to create project:", err);
      toast.error(err.response?.data?.detail || err.message || "Failed to create project.");
    } finally {
      setIsCreatingProject(false); 
    }
  };

  const handleDeleteProjectRequest = (projectId, projectName) => {
    openConfirmationModal({
      title: "Delete Project",
      message: `Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: () => executeDeleteProject(projectId, projectName),
    });
  };

  const executeDeleteProject = async (projectId, projectName) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success(`Project "${projectName}" deleted successfully.`);
      
      // Update allProjects state locally
      const updatedProjects = allProjects.filter(p => p.id !== projectId);
      setAllProjects(updatedProjects);

      const newTotalPages = Math.ceil(updatedProjects.length / PROJECTS_PER_PAGE);
      setTotalPages(newTotalPages);

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newTotalPages === 0) {
        setCurrentPage(1);
      } else {
        const newCurrentProjects = updatedProjects.slice((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE);
        if (newCurrentProjects.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }

    } catch (err) {
      console.error(`Failed to delete project ${projectId}:`, err);
      toast.error(err.response?.data?.detail || `Failed to delete project "${projectName}".`);
    }
  };

  const currentProjects = useMemo(() => {
    const indexOfLastProject = currentPage * PROJECTS_PER_PAGE;
    const indexOfFirstProject = indexOfLastProject - PROJECTS_PER_PAGE;
    return projects.slice(indexOfFirstProject, indexOfLastProject);
  }, [projects, currentPage]);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || (pageNumber > totalPages && totalPages > 0) || totalPages === 0 && pageNumber !==1 ) return;
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Projects Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded shadow transition duration-150 ease-in-out w-full sm:w-auto flex items-center focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Project
        </button>
      </div>

    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
    <div className="flex-1">
      <label htmlFor="searchProjects" className="block text-sm font-semibold text-gray-800 mb-2">
        Search Projects
      </label>
      <input
        type="text"
        id="searchProjects"
        placeholder="Search by name or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
      />
    </div>
    <div className="flex items-end">
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-800 mb-2">Sort by Created Date</label>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          title={`Sort by created date ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortOrder === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
          <span className="ml-2 font-medium">{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
        </button>
      </div>
    </div>
  </div>
</div>

      <CreateProjectModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDescription={newProjectDescription}
        setNewProjectDescription={setNewProjectDescription}
        handleCreateProject={handleCreateProject}
        isCreatingProject={isCreatingProject} 
      />

      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-xl text-gray-600 mt-4">Loading projects...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-10 bg-red-100 text-red-700 p-4 rounded-md">
          <AlertTriangle size={40} className="mx-auto mb-2" />
          <p className="text-xl">{error}</p>
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDeleteRequest={handleDeleteProjectRequest}
                onCardClick={handleProjectCardClick}
                highlighted={highlightedProjectId === project.id}
              />
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
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600">
            {searchTerm ? 'No projects match your search.' : 'No projects found. Get started by creating one!'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmModalAction}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        confirmText={confirmModalProps.confirmText}
        isLoading={isProcessingAction}
      />

            {/* Toaster removed - now global in Layout.jsx */}
      </div>
        );
}

export default App;