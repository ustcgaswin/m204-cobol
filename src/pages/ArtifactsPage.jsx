import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  FileCode,
  AlertTriangle,
  Package,
  Eye,
  X,
  Download,
  Loader2,
  CheckSquare,
  Clipboard,
  Check
} from 'lucide-react';
import JSZip from 'jszip';
import apiClient from '../config/axiosConfig';

const artifactCardIcons = {
  COBOL: <FileCode size={20} className="text-blue-500" />,
  JCL: <FileText size={20} className="text-green-500" />,
  UnitTest: <CheckSquare size={20} className="text-purple-500" />,
  Default: <Package size={20} className="text-gray-500" />,
};

const staticTabsConfig = [
  { id: 'COBOL', label: 'COBOL', IconComponent: FileCode, defaultIconProps: { className: "text-blue-500 group-hover:text-blue-600" } },
  { id: 'JCL', label: 'JCL', IconComponent: FileText, defaultIconProps: { className: "text-green-500 group-hover:text-green-600" } },
  { id: 'UnitTest', label: 'Unit Tests', IconComponent: CheckSquare, defaultIconProps: { className: "text-purple-500 group-hover:text-purple-600" } },
];

const mapBackendTypeToFrontendType = (backendType) => {
  if (!backendType) return 'Default';
  const lowerBackendType = backendType.toLowerCase();
  if (lowerBackendType === 'cobol') return 'COBOL';
  if (lowerBackendType.startsWith('jcl')) return 'JCL';
  if (lowerBackendType === 'unit_test' || lowerBackendType === 'unittest') return 'UnitTest';
  return 'Default';
};

const ARTIFACTS_PER_PAGE = 12;

const ArtifactsPage = () => {
  const { projectId } = useParams();
  const [allArtifacts, setAllArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [projectNameForDisplay, setProjectNameForDisplay] = useState('');
  const [loadingProjectName, setLoadingProjectName] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState({ name: '', content: '' });
  const [isZipping, setIsZipping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProjectDetailsAndArtifacts = async () => {
      if (!projectId) {
        setProjectNameForDisplay('');
        setLoading(false);
        setLoadingProjectName(false);
        setError("No project ID provided.");
        setAllArtifacts([]);
        setAvailableTabs([]);
        return;
      }

      setLoading(true);
      setLoadingProjectName(true);
      setError(null);
      setAllArtifacts([]);
      setAvailableTabs([]);
      setActiveTab('');
      
      let localCacheKeyNamePart = `ProjectID_${projectId}`;

      try {
        const projectResponse = await apiClient.get(`/projects/${projectId}`);
        const projectData = projectResponse.data?.data || projectResponse.data;
        if (projectData && projectData.project_name) {
          setProjectNameForDisplay(projectData.project_name);
          localCacheKeyNamePart = projectData.project_name.replace(/\s+/g, '_');
        } else {
          setProjectNameForDisplay(`ID: ${projectId}`);
        }
      } catch (projectError) {
        console.error(`Failed to fetch project name for ID ${projectId}:`, projectError);
        setProjectNameForDisplay(`ID: ${projectId}`);
      } finally {
        setLoadingProjectName(false);
      }

      const cacheKey = `artifacts_${localCacheKeyNamePart}_${projectId}`;

      try {
        const cachedDataString = localStorage.getItem(cacheKey);
        if (cachedDataString) {
          const cachedStorageItem = JSON.parse(cachedDataString);
          if (cachedStorageItem && Array.isArray(cachedStorageItem.artifacts)) {
            setAllArtifacts(cachedStorageItem.artifacts);
            const uniqueTypesInProject = [...new Set(cachedStorageItem.artifacts.map(a => a.type).filter(Boolean))];
            const currentProjectTabs = staticTabsConfig.filter(tabConf => uniqueTypesInProject.includes(tabConf.id));
            const sortedProjectTabs = currentProjectTabs.sort((a, b) =>
              staticTabsConfig.findIndex(t => t.id === a.id) -
              staticTabsConfig.findIndex(t => t.id === b.id)
            );
            setAvailableTabs(sortedProjectTabs);
            if (sortedProjectTabs.length > 0) {
              setActiveTab(sortedProjectTabs[0].id);
            }
            setLoading(false);
            setCurrentPage(1);
            setTotalPages(Math.ceil(cachedStorageItem.artifacts.length / ARTIFACTS_PER_PAGE) || 1);
            console.log(`Loaded artifacts from localStorage for key: ${cacheKey}`);
            return; 
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (e) {
        console.error("Error reading or parsing artifacts from localStorage:", e);
        localStorage.removeItem(cacheKey);
      }

      try {
        const artifactsApiResponse = await apiClient.post(
          `/artifacts/generate/project/${projectId}`
        );

        const backendResponseData = artifactsApiResponse.data;
        const processedArtifacts = [];

        if (Array.isArray(backendResponseData)) {
          backendResponseData.forEach(inputSource => {
            if (inputSource && Array.isArray(inputSource.generated_files)) {
              inputSource.generated_files.forEach(file => {
                const frontendType = mapBackendTypeToFrontendType(file.artifact_type);
                processedArtifacts.push({
                  id: `${inputSource.input_source_original_filename}_${file.file_name}`, 
                  name: file.file_name,
                  type: frontendType,
                  content: file.content,
                  size: file.content ? `${(file.content.length / 1024).toFixed(2)} KB` : '0 KB',
                  lastModified: new Date().toLocaleDateString(), 
                  description: `Generated ${frontendType} file for ${inputSource.input_source_original_filename}.`,
                  url: '#',
                });
              });
            }
          });
        } else {
          console.warn("Unexpected API response structure for artifacts:", backendResponseData);
        }
        
        if (processedArtifacts.length > 0) {
          setAllArtifacts(processedArtifacts);
          const uniqueTypesInProject = [...new Set(processedArtifacts.map(a => a.type).filter(Boolean))];
          const currentProjectTabs = staticTabsConfig.filter(tabConf => uniqueTypesInProject.includes(tabConf.id));
          const sortedProjectTabs = currentProjectTabs.sort((a, b) =>
            staticTabsConfig.findIndex(t => t.id === a.id) -
            staticTabsConfig.findIndex(t => t.id === b.id)
          );
          setAvailableTabs(sortedProjectTabs);
          if (sortedProjectTabs.length > 0) {
            setActiveTab(sortedProjectTabs[0].id);
          }
          setCurrentPage(1);
          setTotalPages(Math.ceil(processedArtifacts.length / ARTIFACTS_PER_PAGE) || 1);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ artifacts: processedArtifacts, timestamp: new Date().toISOString() }));
            console.log(`Saved artifacts to localStorage for key: ${cacheKey}`);
          } catch (e) {
            console.error("Error saving artifacts to localStorage:", e);
          }
        } else {
          const currentProjectIdentifier = projectNameForDisplay || `ID: ${projectId}`;
          let specificError = `No displayable artifacts found for project ${currentProjectIdentifier}.`;
          if (Array.isArray(backendResponseData) && backendResponseData.length === 0) {
             specificError = `No artifacts were generated for project ${currentProjectIdentifier}. The project might be empty or not contain relevant M204 files.`;
          } else if (!Array.isArray(backendResponseData)){
             specificError = `Received an unexpected response format from the server for project ${currentProjectIdentifier}.`;
          }
          setError(specificError);
        }

      } catch (e) {
        console.error("Failed to fetch or process artifacts from API:", e);
        const currentProjectIdentifier = projectNameForDisplay || `ID: ${projectId}`;
        let errorMessage = `Failed to load artifacts for project ${currentProjectIdentifier}.`;
        if (e.response) {
            errorMessage = e.response.data?.detail || e.message || errorMessage;
        } else {
            errorMessage = e.message || errorMessage;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetailsAndArtifacts();

  }, [projectId]);

  // Update pagination when artifacts or tab changes
  useEffect(() => {
    setCurrentPage(1);
    const filtered = allArtifacts.filter(artifact => !activeTab || artifact.type === activeTab);
    setTotalPages(Math.ceil(filtered.length / ARTIFACTS_PER_PAGE) || 1);
  }, [allArtifacts, activeTab]);

  const handleViewContent = (artifact) => {
    setViewModalData({ name: artifact.name, content: artifact.content });
    setIsViewModalOpen(true);
    setIsCopied(false); 
  };

  const handleDownload = (artifact) => {
    if (!artifact || !artifact.content) {
      setError("Cannot download file: content is missing.");
      return;
    }
    try {
      const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = artifact.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError(`Could not download file ${artifact.name}. Please try again.`);
    }
  };

  const handleDownloadAll = async () => {
    if (isZipping || allArtifacts.length === 0) return;

    setIsZipping(true);
    setError(null);
    const zip = new JSZip();

    allArtifacts.forEach(artifact => {
      zip.file(artifact.name, artifact.content || "");
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const safeProjectName = (projectNameForDisplay && !projectNameForDisplay.startsWith("ID: ")) 
                              ? projectNameForDisplay.replace(/\s+/g, '_') 
                              : `project_${projectId}`;
      const zipFileName = `${safeProjectName}_artifacts.zip`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error creating or downloading ZIP file:", err);
      setError("Could not create or download artifact package. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyContent = async () => {
    if (!viewModalData.content) return;
    try {
      await navigator.clipboard.writeText(viewModalData.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy content: ', err);
    }
  };

  // Pagination logic
  const displayedArtifacts = allArtifacts
    .filter(artifact => !activeTab || artifact.type === activeTab);

  const paginatedArtifacts = displayedArtifacts.slice(
    (currentPage - 1) * ARTIFACTS_PER_PAGE,
    currentPage * ARTIFACTS_PER_PAGE
  );

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="text-gray-600">
            {loadingProjectName && !projectNameForDisplay ? 'Loading project details...' : `Loading artifacts for ${projectNameForDisplay || `Project ID: ${projectId}`}...`}
          </p>
        </div>
      </div>
    );
  }

  if (error && !allArtifacts.length) {
    return (
      <div className="h-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">Error Loading Artifacts</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-grow">
        <header className="mb-6 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Project Artifacts
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Viewable and downloadable output files for project <span className="font-semibold text-teal-600">{projectNameForDisplay || `ID: ${projectId}`}</span>.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 shrink-0">
              <button
                onClick={handleDownloadAll}
                disabled={isZipping || allArtifacts.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isZipping ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Zipping...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    Download All Artifacts
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {error && allArtifacts.length > 0 && ( 
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                         <p className="text-sm font-semibold text-red-800">Notice</p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                     <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                        >
                            <span className="sr-only">Dismiss</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {allArtifacts.length === 0 && !error ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-10 bg-white rounded-lg shadow">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No Artifacts Available</h3>
            <p className="text-gray-500">There are no artifacts to display for project <span className="font-semibold">{projectNameForDisplay || `ID: ${projectId}`}</span>.</p>
            <p className="text-xs text-gray-400 mt-2">This could be because the project is empty, no M204 files were found, or an error occurred during generation. Data might also be loading or an issue with cached data.</p>
          </div>
        ) : !error && allArtifacts.length > 0 ? (
          <div className="flex flex-col flex-grow">
            {availableTabs.length > 0 && (
              <div className="mt-6 border-b border-gray-200 bg-white rounded-t-lg shadow-sm shrink-0">
                <nav className="-mb-px flex space-x-0 overflow-x-auto" aria-label="Tabs">
                  {availableTabs.map((tabConfig) => {
                    const { IconComponent, defaultIconProps } = tabConfig;
                    const isActive = activeTab === tabConfig.id;
                    return (
                      <button
                        key={tabConfig.id}
                        onClick={() => {
                          setActiveTab(tabConfig.id);
                        }}
                        className={`group whitespace-nowrap py-3.5 px-4 border-b-2 font-medium text-sm flex items-center gap-2
                          ${isActive
                            ? 'border-teal-500 text-teal-600 bg-teal-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }
                          focus:outline-none transition-colors flex-1 justify-center md:flex-none`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <IconComponent size={15} {...defaultIconProps} className={`${defaultIconProps.className} ${isActive ? '' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        <span className="ml-1">{tabConfig.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            <div className={`bg-white p-4 flex-grow ${availableTabs.length > 0 ? 'rounded-b-lg shadow-sm' : 'rounded-lg shadow-sm mt-6'}`}>
              {paginatedArtifacts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedArtifacts.sort((a, b) => a.name.localeCompare(b.name)).map((artifact) => (
                      <div
                        key={artifact.id} 
                        className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center mb-2">
                            {artifactCardIcons[artifact.type] || artifactCardIcons.Default}
                            <h3 className="ml-2 text-md font-medium text-gray-800 truncate" title={artifact.name}>
                              {artifact.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500">Type: {artifact.type || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Size: {artifact.size || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Modified: {artifact.lastModified || 'N/A'}</p>
                          {artifact.description && (
                            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                              {artifact.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleViewContent(artifact)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            <Eye size={16} className="mr-1.5" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(artifact)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          >
                            <Download size={16} className="mr-1.5" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination Controls */}
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
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <>
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700">
                      No {activeTab ? `${availableTabs.find(t => t.id === activeTab)?.label || ''} ` : ''}Artifacts
                    </h3>
                    <p className="text-gray-500">
                      There are no {activeTab ? `${availableTabs.find(t => t.id === activeTab)?.label.toLowerCase() || ''} ` : ''}artifacts to display in this section.
                    </p>
                  </>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* View Content Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={viewModalData.name}>
                {viewModalData.name}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap break-all">
                {viewModalData.content || "No content available."}
              </pre>
            </div>
            <div className="flex items-center justify-end p-4 border-t space-x-2">
              <button
                onClick={handleCopyContent}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors
                            ${isCopied 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                disabled={!viewModalData.content}
              >
                {isCopied ? <Check size={16} className="mr-1.5" /> : <Clipboard size={16} className="mr-1.5" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactsPage;