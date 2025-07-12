import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, FileText, Trash2, ArrowLeft, File, Image, Code, Archive, Eye, Zap,
  AlertTriangle, CheckCircle, Search, Filter, Loader2, X
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
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

const SOURCE_TYPE_OPTIONS = [
  { value: '', label: 'Select type...' },
  { value: 'm204', label: 'M204' },
  { value: 'parmlib', label: 'PARMLIB' },
  { value: 'jcl', label: 'JCL' },
  { value: 'other', label: 'Other' },
];


const UploadFilesModal = ({ isOpen, onClose, onUploadConfirm }) => {
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { file: File, type: string, id: string }
  const fileInputRefModal = useRef(null);

  if (!isOpen) return null;

  const handleModalFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        type: '', // Default type, user needs to select
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(7)}` // Unique ID for list rendering
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      event.target.value = ''; // Reset file input
    }
  };

  const handleTypeChange = (fileId, newType) => {
    setSelectedFiles(prev => prev.map(f => f.id === fileId ? { ...f, type: newType } : f));
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = () => {
    const filesToUpload = selectedFiles.filter(f => f.type);
    if (filesToUpload.length !== selectedFiles.length) {
        toast.error("Please specify a type for all selected files.");
        return;
    }
    if (filesToUpload.length === 0 && selectedFiles.length > 0) {
        toast.error("Please select a type for your file(s).");
        return;
    }
    if (filesToUpload.length === 0) {
        toast.error("No files selected or types specified for upload.");
        return;
    }
    onUploadConfirm(filesToUpload.map(f => ({ file: f.file, type: f.type })));
    onClose(); 
    setSelectedFiles([]); 
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full transform transition-all max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Upload Source Files</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => fileInputRefModal.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium py-3 px-4 rounded-lg border-2 border-dashed border-teal-300 hover:border-teal-400 transition-colors"
            >
              <Upload size={20} />
              <span>Click to select files</span>
            </button>
            <input ref={fileInputRefModal} type="file" multiple onChange={handleModalFileChange} className="hidden" accept="*" id="modalFileUploadInput" />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-700 mb-2">Files to Upload ({selectedFiles.length}):</h4>
              {selectedFiles.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 flex-grow min-w-0">
                    <FileText size={18} className="text-gray-500 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800" title={item.file.name}>
                        {item.file.name}
                        </p>
                        <p className="text-xs text-gray-500">{ (item.file.size / 1024).toFixed(2) } KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={item.type}
                        onChange={(e) => handleTypeChange(item.id, e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500 w-full sm:w-auto"
                    >
                        {SOURCE_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                            {opt.label}
                        </option>
                        ))}
                    </select>
                    <button onClick={() => handleRemoveFile(item.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full flex-shrink-0" title="Remove file">
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedFiles.length === 0 && (
             <p className="text-sm text-gray-500 text-center py-4">No files selected yet. Click above to add files.</p>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-xl border-t">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || selectedFiles.some(f => !f.type)}
          >
            Upload Selected
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={() => { onClose(); setSelectedFiles([]); }}
          >
            Cancel
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
  // fileInputRef is removed as it's now in the modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [fileToView, setFileToView] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({});
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);


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
      sourceType: backendFile.source_type, // Ensure this is provided by backend
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

  const handleActualFileUploads = async (filesWithTypes) => {
    if (!filesWithTypes || filesWithTypes.length === 0) {
      return;
    }

    const formData = new FormData();
    filesWithTypes.forEach(item => {
      formData.append('files', item.file);
      formData.append('source_types', item.type);
    });

    const tempUploadItems = filesWithTypes.map(item => ({
        id: `${item.file.name}-${item.type}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: item.file.name,
        type: item.type,
        progress: 0,
        isLoading: true,
        error: null,
        success: false,
    }));

    tempUploadItems.forEach(item => {
        setUploadProgress(prev => ({ ...prev, [item.id]: { progress: 0, name: item.name, error: null, isLoading: true, success: false } }));
    });

    try {
      tempUploadItems.forEach(item => { // Simulate initial small progress
        setUploadProgress(prev => ({ ...prev, [item.id]: { ...prev[item.id], progress: 5 } }));
      });

      const response = await apiClient.post(`/files/${projectId}/upload_source_files/`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          tempUploadItems.forEach(item => {
            setUploadProgress(prev => {
              if (!prev[item.id]) return prev; // Guard against item being removed
              return { ...prev, [item.id]: { ...prev[item.id], progress: percentCompleted } };
            });
          });
        },
      });
      
      const backendUploadedFiles = response.data?.data || [];
      const backendMessage = response.data?.message || "";
      const overallStatus = response.status;

      const newFrontendFiles = backendUploadedFiles.map(mapBackendFileToFrontend);
      if (newFrontendFiles.length > 0) {
        setUploadedFiles(prevFiles => [...prevFiles, ...newFrontendFiles]);
      }
      
      let successfulUploadCount = 0;

      tempUploadItems.forEach(tempItem => {
        const correspondingBackendFile = backendUploadedFiles.find(bf => bf.original_filename === tempItem.name && bf.source_type === tempItem.type);
        
        if (correspondingBackendFile) {
          successfulUploadCount++;
          setUploadProgress(prev => {
            if (!prev[tempItem.id]) return prev;
            return { ...prev, [tempItem.id]: { ...prev[tempItem.id], isLoading: false, success: true, progress: 100 }};
          });
          toast.success(`File "${tempItem.name}" (${tempItem.type}) uploaded successfully!`);
          setTimeout(() => {
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempItem.id];
                return newProgress;
            });
          }, 1000);
        } else {
          // File was in the request but not in the successful response data
          // Check backendMessage for specific errors
          let specificError = `Failed to process "${tempItem.name}" (${tempItem.type}).`;
          if (backendMessage) {
            // Basic check if the message contains the filename
            const fileErrorRegex = new RegExp(`File '${tempItem.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^:]*: (.*?)(?:;|$)`, 'i');
            const match = backendMessage.match(fileErrorRegex);
            if (match && match[1]) {
              specificError = `"${tempItem.name}": ${match[1].trim()}`;
            } else if (backendMessage.toLowerCase().includes(tempItem.name.toLowerCase()) && backendMessage.toLowerCase().includes("error")) {
                specificError = `Error with "${tempItem.name}": Server reported an issue. Check details: ${backendMessage}`;
            }
          }

          setUploadProgress(prev => {
            if (!prev[tempItem.id]) return prev;
            return { ...prev, [tempItem.id]: { ...prev[tempItem.id], error: specificError, isLoading: false, progress: prev[tempItem.id]?.progress || 0, success: false }};
          });
          toast.error(specificError);
          setTimeout(() => {
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[tempItem.id];
                return newProgress;
            });
           }, 7000);
        }
      });

      if (backendMessage && (overallStatus >= 400 || (backendMessage.toLowerCase().includes("fail") && successfulUploadCount < tempUploadItems.length))) {
        if (successfulUploadCount < tempUploadItems.length && successfulUploadCount > 0) {
            toast.warning(`Partial success: ${backendMessage}`);
        } else if (successfulUploadCount === 0) {
            // This case should be caught by the main catch block if status is >= 400
            // but if status is 200 and message indicates all failed, this is a fallback.
            // toast.error(`Upload failed: ${backendMessage}`);
        }
      }

    } catch (err) {
      console.error(`Failed to upload batch of files:`, err);
      let errorMessage = "An error occurred during file upload.";
      if (err.response && err.response.data) {
        if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(d => `${d.loc?.join(' -> ') || 'Field'}: ${d.msg}`).join('; ');
        } else if (err.response.data.detail) {
           errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
           errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      tempUploadItems.forEach(item => {
        setUploadProgress(prev => {
          if (!prev[item.id]) return prev;
          return { ...prev, [item.id]: { ...prev[item.id], error: errorMessage, isLoading: false, progress: 0, success: false }};
        });
      });
      toast.error(`Upload failed: ${errorMessage}`);
       setTimeout(() => {
        tempUploadItems.forEach(item => {
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[item.id];
                return newProgress;
            });
        });
       }, 7000);
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
    toast.info("Analysis started for all files. Statuses will update shortly."); // Changed to info
    
    try {
      await apiClient.post(`/analysis/project/${projectId}/analyze-ordered`);
      toast.success("Analysis request for all files sent successfully. Backend is processing.");
    } catch (err) {
      console.error(`Failed to start analysis for project ${projectId}:`, err);
      toast.error(err.response?.data?.detail || "Failed to start analysis for the project.");
      fetchSourceFiles(); // Re-fetch to get actual current statuses
    } finally {
      const baseDelay = 5000; 
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
        const filesToDelete = [...uploadedFiles]; 
        const deletePromises = filesToDelete.map(file =>
          apiClient.delete(`/files/source_files/${file.id}`)
            .then(() => ({ id: file.id, name: file.name, status: 'fulfilled' }))
            .catch(err => ({ id: file.id, name: file.name, status: 'rejected', error: err.response?.data?.detail || `Failed to delete ${file.name}` }))
        );

        const results = await Promise.allSettled(deletePromises);
        
        const successfullyDeletedIds = [];
        const failedDeletions = [];

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
            successfullyDeletedIds.push(result.value.id);
          } else if (result.status === 'fulfilled' && result.value.status === 'rejected') {
            failedDeletions.push({name: result.value.name, error: result.value.error});
          } else if (result.status === 'rejected') {
            failedDeletions.push({name: "Unknown file", error: `An unexpected error occurred during deletion.`});
            console.error("Unexpected rejection in Promise.allSettled for delete:", result.reason);
          }
        });

        setUploadedFiles(prevFiles => prevFiles.filter(file => !successfullyDeletedIds.includes(file.id)));
        setSearchQuery('');

        if (failedDeletions.length === 0 && successfullyDeletedIds.length === filesToDelete.length) {
          toast.success("All files deleted successfully.");
        } else {
          if (successfullyDeletedIds.length > 0) {
            toast.success(`${successfullyDeletedIds.length} file(s) deleted successfully.`);
          }
          failedDeletions.forEach(fail => {
            toast.error(`Failed to delete "${fail.name}": ${fail.error}`);
            console.error(`Deletion error for ${fail.name}:`, fail.error);
          });
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
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
              disabled={isLoading || Object.keys(uploadProgress).length > 0 || isProcessingAction}
            > <Upload size={20} /> <span>Upload Files</span> </button>
            <Link
              to={`/project/${projectId}`}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-teal-300"
            > <ArrowLeft size={16} /> <span>Back to Project</span> </Link>
          </div>
        </div>

        {/* Hidden file input removed from here, it's in the modal now */}

        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Uploads In Progress</h3>
            {Object.entries(uploadProgress).map(([tempId, item]) => (
              <div key={tempId} className="mb-2 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center text-sm">
                  <span className="truncate font-medium text-gray-800" title={item.name}>{item.name}</span>
                  {item.isLoading && !item.success && !item.error && <Loader2 className="h-4 w-4 animate-spin text-teal-500" />}
                  {item.error && <AlertTriangle size={16} className="text-red-500" title={item.error} />}
                  {item.success && <CheckCircle size={16} className="text-emerald-500" />}
                </div>
                {(item.isLoading || item.progress < 100) && !item.error && !item.success && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                )}
                {item.success && (<p className="text-xs text-emerald-600 mt-1">Successfully uploaded!</p>)}
                {item.error && <p className="text-xs text-red-600 mt-1 break-all">{item.error}</p>}
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
                    disabled={isLoading || isProcessingAction || Object.keys(uploadProgress).length > 0 || uploadedFiles.length === 0 || uploadedFiles.every(f => ['analyzing', 'analyzed', 'completed'].includes(f.analysisStatus))}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                  > <Zap size={16} /> <span>Analyze All</span> </button>
                  <button
                    onClick={handleRemoveAllFiles}
                    disabled={isLoading || isProcessingAction || Object.keys(uploadProgress).length > 0 || uploadedFiles.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-colors text-sm border border-red-600 whitespace-nowrap disabled:opacity-50"
                  > <Trash2 size={16} /> <span>Delete All</span> </button>
                </div>
              </div>
            )}

            {filteredFiles.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="bg-gray-50 px-4 py-3 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                    <div className="col-span-5">File Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {filteredFiles.map((file) => (
                      <li key={file.id} className="bg-white hover:bg-gray-50 transition-colors px-4 py-3 grid md:grid-cols-12 gap-3 md:gap-4 items-center">
                        <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center"> {getFileIcon(file.name)} </div>
                          <div className="min-w-0"> <p className="font-medium text-gray-800 truncate" title={file.name}>{file.name}</p> </div>
                        </div>
                        <div className="md:col-span-2 text-sm text-gray-600">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                                {file.sourceType || 'N/A'}
                            </span>
                        </div>
                        <div className="md:col-span-3 flex items-center gap-1.5">
                          {getStatusIcon(file.analysisStatus)}
                          <span className="text-sm">{getStatusText(file.analysisStatus)}</span>
                        </div>
                        <div className="md:col-span-2 flex gap-1.5 justify-end">
                          <button
                            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View file content" onClick={() => handleViewFile(file)}
                            disabled={isProcessingAction || Object.keys(uploadProgress).length > 0}
                          > <Eye size={18} /> </button>
                          <button
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleDeleteFile(file.id, file.name)} title="Delete file"
                            disabled={isProcessingAction || Object.keys(uploadProgress).length > 0}
                          > <Trash2 size={18} /> </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5"> <Filter size={12} /> Showing {filteredFiles.length} of {uploadedFiles.length} files </p>
                {allFilesProcessedServerStatus && uploadedFiles.length > 0 && (
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

      <UploadFilesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadConfirm={handleActualFileUploads}
      />

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