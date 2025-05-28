import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, FileText, Trash2, ArrowLeft, File, Image, Code, Archive, Eye, Zap,
  AlertTriangle, CheckCircle, Search, Filter, Loader2, X
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner'; // Only import toast, not Toaster
import apiClient from '../config/axiosConfig';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
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

const SourceFilesPage = () => {
  const { projectId } = useParams();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [fileToView, setFileToView] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({});
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const openConfirmationModal = ({ title, message, onConfirm, confirmText = "Confirm" }) => {
    setConfirmModalProps({ title, message, onConfirm, confirmText });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmModalProps({});
  };

  const handleConfirmAction = async () => {
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

  const mapBackendFileToFrontend = (backendFile) => {
    let frontendStatus = backendFile.analysis_status || 'unknown';
    if (backendFile.analysis_status === 'analysis_completed') {
      frontendStatus = 'completed';
    } else if (backendFile.analysis_status === 'analysis_started' || backendFile.analysis_status === 'processing') {
      frontendStatus = 'analyzing';
    }
    return {
      id: backendFile.input_source_id,
      name: backendFile.original_filename,
      size: backendFile.size || 0,
      uploadDate: backendFile.created_at || new Date().toISOString(),
      analysisStatus: frontendStatus,
      sourceType: backendFile.source_type,
    };
  };

  const fetchSourceFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/files/${projectId}/source_files`);
      const fetchedFiles = response.data.data.map(mapBackendFileToFrontend);
      setUploadedFiles(fetchedFiles);
    } catch (err) {
      console.error("Failed to fetch source files:", err);
      const errorMessage = err.response?.data?.detail || "Failed to load source files.";
      setError(errorMessage);
      setUploadedFiles([]);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchSourceFiles();
    }
  }, [projectId, fetchSourceFiles]);

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop().toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return <Image size={18} className="text-purple-500" />;
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(extension))
      return <Code size={18} className="text-blue-500" />;
    if (['zip', 'tar', 'rar', 'gz'].includes(extension))
      return <Archive size={18} className="text-amber-500" />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension))
      return <FileText size={18} className="text-red-500" />;
    return <File size={18} className="text-gray-500" />;
  };

  const getStatusIcon = (analysisStatus) => {
    switch (analysisStatus) {
      case 'analyzing':
        return <div className="animate-pulse"><Zap size={16} className="text-amber-500" /></div>;
      case 'analyzed':
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'uploaded':
         return <Upload size={16} className="text-blue-500" />;
      default:
        return <FileText size={16} className="text-gray-400"/>;
    }
  };
  
  const getStatusText = (analysisStatus) => {
    switch (analysisStatus) {
      case 'analyzing': return 'Analyzing...';
      case 'analyzed': return 'Analyzed';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      case 'uploaded': return 'Uploaded';
      default: return 'Pending';
    }
  };

  const handleFileChange = async (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const filesToUpload = Array.from(event.target.files);
      event.target.value = ''; 

      const uploadPromises = filesToUpload.map(async (file) => {
        const tempId = `${file.name}-${Date.now()}`;
        setUploadProgress(prev => ({ ...prev, [tempId]: { progress: 0, name: file.name, error: null, isLoading: true, success: false } }));

        const formData = new FormData();
        formData.append('files', file); 

        try {
          const response = await apiClient.post(`/files/${projectId}/upload_source_files/`, formData, {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [tempId]: { ...prev[tempId], progress: percentCompleted } }));
            },
          });
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            const newFile = mapBackendFileToFrontend(response.data.data[0]);
            setUploadedFiles(prevFiles => [...prevFiles, newFile]);
            setUploadProgress(prev => ({ 
              ...prev, 
              [tempId]: { ...prev[tempId], isLoading: false, success: true, progress: 100 } 
            }));
            toast.success(`File "${file.name}" uploaded successfully!`);
            setTimeout(() => {
              setUploadProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[tempId];
                  return newProgress;
              });
            }, 300); 
          } else {
            throw new Error(response.data?.message || "Upload successful but no file data returned.");
          }
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          let errorMessage = `Failed to upload ${file.name}`;
          if (err.response && err.response.data) {
            if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
              errorMessage = err.response.data.detail.map(d => `${d.loc.join(' -> ')}: ${d.msg}`).join('; ');
            } else if (err.response.data.detail) {
               errorMessage = err.response.data.detail;
            } else if (err.response.data.message) {
               errorMessage = err.response.data.message;
            }
          } else if (err.message) {
            errorMessage = err.message;
          }
          setUploadProgress(prev => ({
            ...prev,
            [tempId]: { ...prev[tempId], error: errorMessage, isLoading: false, progress: 0, success: false }
          }));
          toast.error(errorMessage);
           setTimeout(() => {
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempId];
                return newProgress;
            });
           }, 5000); 
        }
      });
      await Promise.all(uploadPromises);
    }
  };

  const handleDeleteFile = (fileIdToDelete, fileName) => {
    openConfirmationModal({
      title: "Delete File Permanently",
      message: `Are you sure you want to delete "${fileName}"? This action cannot be undone and will remove the file permanently from the server.`,
      confirmText: "Delete Permanently",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/files/source_files/${fileIdToDelete}`);
          setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileIdToDelete));
          toast.success(`File "${fileName}" deleted successfully.`);
        } catch (err) {
          console.error(`Failed to delete file ${fileIdToDelete}:`, err);
          toast.error(err.response?.data?.detail || `Failed to delete "${fileName}".`);
        }
      }
    });
  };

  const handleViewFile = async (file) => {
    if (file.originalFile && typeof FileReader !== "undefined") {
        const reader = new FileReader();
        reader.onload = (e) => {
            setFileToView({ name: file.name, content: e.target.result, type: file.originalFile.type });
            setIsViewModalOpen(true);
        };
        reader.onerror = () => {
            setFileToView({ name: file.name, content: "Error reading file content.", type: file.originalFile.type });
            setIsViewModalOpen(true);
        };
        const textLikeMimeTypes = ['text/', 'application/json', 'application/xml', 'application/javascript', 'application/typescript'];
        const textLikeExtensions = /\.(txt|md|json|js|jsx|ts|tsx|html|css|xml|log|csv|yaml|yml)$/i;
        if (textLikeMimeTypes.some(typePrefix => file.originalFile.type.startsWith(typePrefix)) || textLikeExtensions.test(file.name)) {
            reader.readAsText(file.originalFile);
        } else {
            setFileToView({ name: file.name, content: `Preview not available for this file type (${file.originalFile.type || 'unknown'}).`, type: file.originalFile.type });
            setIsViewModalOpen(true);
        }
    } else {
        setIsViewModalOpen(true);
        setFileToView({ name: file.name, content: "Fetching file content...", type: file.sourceType || "unknown" });
        try {
            const response = await apiClient.get(`files/source_files/${file.id}/content`);
            if (typeof response.data === 'string') {
                setFileToView({ name: file.name, content: response.data, type: response.headers?.['content-type'] || file.sourceType || "unknown" });
            } else {
                setFileToView({ name: file.name, content: `Preview not available for this file type or content is not plain text. (Received type: ${typeof response.data})`, type: response.headers?.['content-type'] || file.sourceType || "unknown" });
            }
        } catch (err) {
            console.error(`Failed to fetch content for ${file.name}:`, err);
            let errorMessage = "Error fetching file content.";
            if (err.response) {
                if (typeof err.response.data === 'string' && (!err.response.headers['content-type'] || !err.response.headers['content-type'].includes('json'))) {
                    errorMessage = err.response.data;
                } else if (err.response.data && err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (err.response.statusText) {
                    errorMessage = `Error ${err.response.status}: ${err.response.statusText}`;
                }
            } else if (err.request) {
                errorMessage = "No response received from server.";
            } else {
                errorMessage = err.message;
            }
            setFileToView({ name: file.name, content: errorMessage, type: file.sourceType || "unknown" });
        }
    }
  };

  const handleAnalyzeAllFiles = async () => {
    if (uploadedFiles.length === 0 || !projectId) return;
    
    setUploadedFiles(prevFiles => prevFiles.map(f => ({ ...f, analysisStatus: 'analyzing' })));
    toast.success("Analysis started for all files. Statuses will update shortly.");
    
    try {
      // Send a single request to the new endpoint
      await apiClient.post(`/analysis/project/${projectId}/analyze-ordered`);
      // Optionally, you might want to inform the user that the request was sent successfully
      // The backend will now handle analyzing all files for the project.
      // We still need to refresh the file list after some time to get updated statuses.
    } catch (err) {
      console.error(`Failed to start analysis for project ${projectId}:`, err);
      toast.error(err.response?.data?.detail || "Failed to start analysis for the project.");
      // Revert status for all files if the overall request fails, or handle more granularly if needed
      setUploadedFiles(prevFiles => prevFiles.map(f => ({ ...f, analysisStatus: 'error' }))); // Or revert to original status
    } finally {
      // Refresh files after a delay to allow backend processing
      const baseDelay = 5000; // Increased base delay as it's a project-wide operation
      const perFileDelay = 500; 
      const totalDelay = baseDelay + (uploadedFiles.length * perFileDelay);
      setTimeout(() => fetchSourceFiles(), totalDelay);
    }
  };

  const handleRemoveAllFiles = () => {
    if (uploadedFiles.length === 0) return;
    openConfirmationModal({
      title: "Delete All Files Permanently",
      message: `Are you sure you want to delete all ${uploadedFiles.length} files from the server? This action cannot be undone.`,
      confirmText: "Delete All Permanently",
      onConfirm: async () => {
        const filesToDelete = [...uploadedFiles]; // Copy current files
        const deletePromises = filesToDelete.map(file =>
          apiClient.delete(`/files/source_files/${file.id}`)
            .then(() => ({ id: file.id, status: 'fulfilled' }))
            .catch(err => ({ id: file.id, status: 'rejected', error: err.response?.data?.detail || `Failed to delete ${file.name}` }))
        );

        const results = await Promise.allSettled(deletePromises);
        
        const successfullyDeletedIds = [];
        const failedDeletions = [];

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
            successfullyDeletedIds.push(result.value.id);
          } else if (result.status === 'fulfilled' && result.value.status === 'rejected') {
            failedDeletions.push(result.value.error);
          } else if (result.status === 'rejected') {
            // This case should ideally not happen if the inner promise catches its error
            failedDeletions.push(`An unexpected error occurred for one of the files.`);
            console.error("Unexpected rejection in Promise.allSettled for delete:", result.reason);
          }
        });

        setUploadedFiles(prevFiles => prevFiles.filter(file => !successfullyDeletedIds.includes(file.id)));
        setSearchQuery('');

        if (failedDeletions.length === 0 && successfullyDeletedIds.length === filesToDelete.length) {
          toast.success("All files deleted successfully.");
        } else if (successfullyDeletedIds.length > 0) {
          toast.error(`${successfullyDeletedIds.length} files deleted. ${failedDeletions.length} files failed to delete.`);
          failedDeletions.forEach(errMsg => console.error("Deletion error:", errMsg));
        } else {
          toast.error("Failed to delete files. Please check console for details.");
          failedDeletions.forEach(errMsg => console.error("Deletion error:", errMsg));
        }
      }
    });
  };

  const filteredFiles = uploadedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFilesProcessedServerStatus = uploadedFiles.length > 0 &&
    uploadedFiles.every(file => ['analyzed', 'completed', 'error'].includes(file.analysisStatus));

  if (isLoading && uploadedFiles.length === 0) { 
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
        <p className="text-xl text-gray-700 mt-4">Loading source files...</p>
      </div>
    );
  }

  if (error && uploadedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Files</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchSourceFiles}
            className="mr-2 inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-sm"
          > Retry </button>
          <Link to={`/project/${projectId}`} className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200 shadow-sm">
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Source Files</h1>
            <p className="text-gray-600 mt-1">Manage and analyze your project source files</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
              disabled={isLoading || isProcessingAction}
            > <Upload size={20} /> <span>Upload Files</span> </button>
            <Link
              to={`/project/${projectId}`}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-teal-300"
            > <ArrowLeft size={16} /> <span>Back to Project</span> </Link>
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" id="fileUploadInput" accept="*" />

        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Uploads</h3>
            {Object.entries(uploadProgress).map(([tempId, item]) => (
              <div key={tempId} className="mb-2 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center text-sm">
                  <span className="truncate font-medium text-gray-800" title={item.name}>{item.name}</span>
                  {item.isLoading && !item.success && <Loader2 className="h-4 w-4 animate-spin text-teal-500" />}
                  {item.error && <AlertTriangle size={16} className="text-red-500" title={item.error} />}
                  {item.success && <CheckCircle size={16} className="text-emerald-500" />}
                </div>
                {item.isLoading && !item.error && !item.success && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                )}
                {item.success && (<p className="text-xs text-emerald-600 mt-1">Successfully uploaded!</p>)}
                {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-teal-500" />
              <span>Uploaded Files</span>
              {uploadedFiles.length > 0 && (
                <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full ml-2">
                  {uploadedFiles.length}
                </span>
              )}
               {isLoading && uploadedFiles.length > 0 && <Loader2 className="h-5 w-5 animate-spin text-teal-500 ml-2" />}
            </h2>
          </div>

          <div className="p-6">
            {uploadedFiles.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <Search size={16} className="text-gray-400" /> </div>
                  <input
                    type="text"
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyzeAllFiles}
                    disabled={isLoading || isProcessingAction || uploadedFiles.length === 0 || uploadedFiles.every(f => ['analyzing', 'analyzed', 'completed'].includes(f.analysisStatus))}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                  > <Zap size={16} /> <span>Analyze All</span> </button>
                  <button
                    onClick={handleRemoveAllFiles}
                    disabled={isLoading || isProcessingAction || uploadedFiles.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-colors text-sm border border-red-600 whitespace-nowrap disabled:opacity-50"
                  > <Trash2 size={16} /> <span>Delete All</span> </button>
                </div>
              </div>
            )}

            {filteredFiles.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="bg-gray-50 px-4 py-3 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                    <div className="col-span-6">File Name</div>
                    <div className="col-span-4">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {filteredFiles.map((file) => (
                      <li key={file.id} className="bg-white hover:bg-gray-50 transition-colors px-4 py-3 grid md:grid-cols-12 gap-3 md:gap-4 items-center">
                        <div className="md:col-span-6 flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center"> {getFileIcon(file.name)} </div>
                          <div className="min-w-0"> <p className="font-medium text-gray-800 truncate" title={file.name}>{file.name}</p> </div>
                        </div>
                        <div className="md:col-span-4 hidden md:flex items-center gap-1.5">
                          {getStatusIcon(file.analysisStatus)}
                          <span className="text-sm">{getStatusText(file.analysisStatus)}</span>
                        </div>
                        <div className="md:col-span-2 flex gap-1.5 justify-end">
                          <button
                            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View file content" onClick={() => handleViewFile(file)}
                            disabled={isProcessingAction}
                          > <Eye size={18} /> </button>
                          <button
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleDeleteFile(file.id, file.name)} title="Delete file"
                            disabled={isProcessingAction}
                          > <Trash2 size={18} /> </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5"> <Filter size={12} /> Showing {filteredFiles.length} of {uploadedFiles.length} files </p>
                {allFilesProcessedServerStatus && (
                  <div className="mt-6 text-center">
                    <Link
                      to={`/project/${projectId}/inventory`} 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors text-base"
                    > Proceed to Inventory <ArrowLeft size={18} className="transform rotate-180" /> </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                {searchQuery ? (
                    <>
                        <Search size={36} className="mx-auto text-gray-400 mb-3" />
                        <p className="font-medium text-gray-700">No files match your search "{searchQuery}"</p>
                        <p className="text-sm text-gray-500 mt-1">Try a different search term or clear the search.</p>
                    </>
                ) : (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4"> <FileText size={28} className="text-teal-500" /> </div>
                        <p className="text-gray-700 font-medium text-lg">No files uploaded yet</p>
                        <p className="text-gray-500 mt-2 max-w-md mx-auto"> Click the "Upload Files" button to add source files to your project. </p>
                    </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toaster removed - now global in Layout.jsx */}

      {isViewModalOpen && fileToView && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2" title={fileToView.name}>
                {getFileIcon(fileToView.name)} <span className="truncate max-w-md">{fileToView.name}</span>
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-auto flex-grow p-5">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-5 rounded-lg border border-gray-200 font-mono text-gray-800">{fileToView.content}</pre>
            </div>
            <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setIsViewModalOpen(false)} className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors"> Close </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        confirmText={confirmModalProps.confirmText}
        isLoading={isProcessingAction}
      />
    </div>
  );
};

export default SourceFilesPage;